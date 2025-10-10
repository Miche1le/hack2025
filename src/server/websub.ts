import crypto from "crypto";
import { loadFeedWithMetadata } from "@/lib/rss-parser";
import type { FeedFetchResult, NormalizedFeedItem } from "@/lib/rss-parser";
import {
  getAggregatedItems,
  getSubscription,
  getSubscriptionById,
  markSubscriptionExpired,
  storeFeedItems,
  upsertSubscription,
  type SubscriptionState,
} from "@/server/websub-store";

interface SubscriptionRequest {
  hubUrl?: string;
  secret?: string;
  leaseSeconds?: number;
}

const WEB_SUB_VERIFY_RETRIES = 2;

export interface RefreshResult {
  items: NormalizedFeedItem[];
  warnings: string[];
}

export async function ensureSubscription(
  feedUrl: string,
): Promise<SubscriptionState> {
  const { items, metadata } = await loadFeedWithMetadata(feedUrl);
  const topicUrl = metadata.selfUrl ?? feedUrl;
  const subscription = upsertSubscription(topicUrl, feedUrl, metadata, {
    mode: "pending",
  });

  storeFeedItems(topicUrl, items);

  if (!metadata.hubUrls?.length) {
    subscription.mode = "expired";
    subscription.lastHandshakeAt = Date.now();
    return subscription;
  }

  if (
    subscription.mode === "active" &&
    subscription.leaseExpiresAt &&
    subscription.leaseExpiresAt > Date.now()
  ) {
    return subscription;
  }

  const hubUrl = metadata.hubUrls[0];
  subscription.hubUrl = hubUrl;

  const callbackUrl = buildCallbackUrl(subscription.topicId);
  subscription.callbackUrl = callbackUrl;

  const hubResponse = await requestSubscription({
    hubUrl,
    topicUrl,
    callbackUrl,
    leaseSeconds: subscription.leaseSeconds,
    secret: subscription.secret,
    verifyToken: subscription.verifyToken,
  });

  if (!hubResponse.ok) {
    await handleSubscriptionFailure(subscription, hubResponse);
  }

  subscription.lastHandshakeAt = Date.now();
  subscription.mode = "pending";
  return subscription;
}

async function requestSubscription(options: {
  hubUrl: string;
  topicUrl: string;
  callbackUrl: string;
  secret?: string;
  leaseSeconds?: number;
  verifyToken?: string;
}): Promise<Response> {
  const form = new URLSearchParams();
  form.set("hub.mode", "subscribe");
  form.set("hub.topic", options.topicUrl);
  form.set("hub.callback", options.callbackUrl);
  if (options.secret) {
    form.set("hub.secret", options.secret);
  }
  if (options.verifyToken) {
    form.set("hub.verify_token", options.verifyToken);
  }
  if (options.leaseSeconds) {
    form.set("hub.lease_seconds", String(options.leaseSeconds));
  }

  return fetch(options.hubUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
}

async function handleSubscriptionFailure(
  subscription: SubscriptionState,
  response: Response,
): Promise<void> {
  const text = await response.text().catch(() => "");
  subscription.mode = "expired";
  console.warn("WebSub subscription request failed", {
    topic: subscription.topic,
    hub: subscription.hubUrl,
    status: response.status,
    body: text,
  });
}

export async function handleVerificationCallback(
  params: URLSearchParams,
): Promise<{ status: number; body: string }> {
  const mode = params.get("hub.mode");
  const topic = params.get("hub.topic");
  const challenge = params.get("hub.challenge");
  const leaseSecondsValue = params.get("hub.lease_seconds");
  const verifyToken = params.get("hub.verify_token");

  if (!mode || !topic || !challenge) {
    return { status: 400, body: "Missing hub verification parameters" };
  }

  const subscription = getSubscription(topic);
  if (!subscription) {
    return { status: 404, body: "Topic not found" };
  }

  if (verifyToken && verifyToken !== subscription.verifyToken) {
    return { status: 403, body: "Invalid verification token" };
  }

  if (mode === "subscribe") {
    subscription.mode = "active";
    if (leaseSecondsValue) {
      const seconds = Number.parseInt(leaseSecondsValue, 10);
      if (!Number.isNaN(seconds)) {
        subscription.leaseSeconds = seconds;
        subscription.leaseExpiresAt = Date.now() + seconds * 1000;
      }
    }
  } else if (mode === "unsubscribe") {
    markSubscriptionExpired(subscription.topic);
  }

  return { status: 200, body: challenge };
}

export async function handleContentNotification(
  topic: string,
  body: string,
  headers: Headers,
): Promise<void> {
  const subscription = getSubscription(topic);
  if (!subscription) {
    throw new Error("Unknown topic");
  }

  subscription.lastPushAt = Date.now();

  if (subscription.secret) {
    verifySignature(body, headers, subscription.secret);
  }

  let feedResult: FeedFetchResult | undefined;
  try {
    feedResult = await loadFeedWithMetadata(topic);
  } catch (error) {
    console.warn("Failed to reload feed after push", { topic, error });
  }

  if (!feedResult) {
    return;
  }

  upsertSubscription(topic, subscription.feedUrl, feedResult.metadata, {
    mode: "active",
    lastPushAt: Date.now(),
  });

  storeFeedItems(topic, feedResult.items);
}

function verifySignature(body: string, headers: Headers, secret: string): void {
  const signature =
    headers.get("x-hub-signature-256") ?? headers.get("x-hub-signature");
  if (!signature) {
    throw new Error("Missing X-Hub-Signature header");
  }

  const [algorithm, hash] = signature.split("=");
  if (!algorithm || !hash) {
    throw new Error("Invalid signature format");
  }

  const expected = crypto
    .createHmac(algorithm, secret)
    .update(body)
    .digest("hex");
  if (
    !crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(expected, "hex"),
    )
  ) {
    throw new Error("Invalid signature");
  }
}

function buildCallbackUrl(topicId: string): string {
  const baseUrl = process.env.WEBSUB_CALLBACK_BASE_URL;
  if (!baseUrl) {
    throw new Error("WEBSUB_CALLBACK_BASE_URL is not set");
  }
  const url = new URL("/api/websub/callback", baseUrl);
  url.searchParams.set("topicId", topicId);
  return url.toString();
}

export async function refreshFeeds(feedUrls: string[]): Promise<RefreshResult> {
  const uniqueFeeds = Array.from(new Set(feedUrls.filter(Boolean)));
  const warnings: string[] = [];

  if (uniqueFeeds.length === 0) {
    return { items: [], warnings: [] };
  }

  await Promise.all(
    uniqueFeeds.map(async (url) => {
      try {
        const subscription = await ensureSubscription(url);
        if (!subscription.hubUrls.length) {
          warnings.push(
            `${url} does not advertise a WebSub hub. Falling back to periodic polling.`,
          );
        } else if (subscription.mode === "expired") {
          warnings.push(
            `Subscription for ${url} is not active yet. Will retry automatically.`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`${url}: ${message}`);
      }
    }),
  );

  const items = getAggregatedItems(uniqueFeeds);
  return {
    items,
    warnings,
  };
}

export async function processUnverifiedSubscription(
  topic: string,
  retry = 0,
): Promise<void> {
  const subscription = getSubscription(topic);
  if (!subscription) {
    return;
  }

  if (subscription.mode === "active") {
    return;
  }

  if (retry >= WEB_SUB_VERIFY_RETRIES) {
    subscription.mode = "expired";
    return;
  }

  const hubUrl = subscription.hubUrl ?? subscription.hubUrls[0];
  if (!hubUrl) {
    subscription.mode = "expired";
    return;
  }

  const callbackUrl =
    subscription.callbackUrl ?? buildCallbackUrl(subscription.topicId);
  const response = await requestSubscription({
    hubUrl,
    topicUrl: subscription.topic,
    callbackUrl,
    secret: subscription.secret,
    leaseSeconds: subscription.leaseSeconds,
    verifyToken: subscription.verifyToken,
  });

  if (!response.ok) {
    await handleSubscriptionFailure(subscription, response);
  } else {
    subscription.mode = "pending";
  }
}

export function resolveTopicFromHeaders(headers: Headers): string | null {
  const linkHeader = headers.get("link");
  if (!linkHeader) {
    return null;
  }

  const matches = linkHeader.match(/<([^>]+)>;\s*rel="self"/i);
  return matches?.[1] ?? null;
}

export function resolveTopicFromParams(topicId?: string | null): string | null {
  if (!topicId) {
    return null;
  }
  const subscription = getSubscriptionById(topicId);
  return subscription?.topic ?? null;
}
