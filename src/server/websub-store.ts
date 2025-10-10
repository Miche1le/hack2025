import crypto from "crypto";
import type { FeedMetadata, NormalizedFeedItem } from "@/lib/rss-parser";

export interface StoredFeedItem extends NormalizedFeedItem {
  storedAt: number;
}

export interface SubscriptionState {
  topic: string;
  topicId: string;
  feedUrl: string;
  hubUrl?: string;
  hubUrls: string[];
  callbackUrl?: string;
  verifyToken: string;
  secret?: string;
  leaseSeconds?: number;
  leaseExpiresAt?: number;
  mode: "pending" | "active" | "expired";
  items: Map<string, StoredFeedItem>;
  lastHandshakeAt?: number;
  lastPushAt?: number;
}

interface WebSubStore {
  subscriptions: Map<string, SubscriptionState>;
  topicIndex: Map<string, string>;
}

type GlobalWithStore = typeof globalThis & {
  __WEB_SUB_STORE__?: WebSubStore;
};

const globalWithStore = globalThis as GlobalWithStore;

if (!globalWithStore.__WEB_SUB_STORE__) {
  globalWithStore.__WEB_SUB_STORE__ = {
    subscriptions: new Map(),
    topicIndex: new Map(),
  };
}

function getStore(): WebSubStore {
  return globalWithStore.__WEB_SUB_STORE__!;
}

export function createTopicId(topic: string): string {
  return crypto.createHash("sha256").update(topic).digest("hex");
}

export function getSubscription(topic: string): SubscriptionState | undefined {
  return getStore().subscriptions.get(topic);
}

export function getSubscriptionById(topicId: string): SubscriptionState | undefined {
  const store = getStore();
  const topic = store.topicIndex.get(topicId);
  return topic ? store.subscriptions.get(topic) : undefined;
}

export function upsertSubscription(
  topic: string,
  feedUrl: string,
  metadata: FeedMetadata,
  params: Partial<Omit<SubscriptionState, "topic" | "topicId" | "feedUrl" | "hubUrls" | "items">> = {},
): SubscriptionState {
  const store = getStore();
  const existing = store.subscriptions.get(topic);
  const topicId = existing?.topicId ?? createTopicId(topic);
  const hubUrls = Array.from(new Set([...(existing?.hubUrls ?? []), ...(metadata.hubUrls ?? [])])).filter(Boolean);

  const subscription: SubscriptionState = {
    topic,
    topicId,
    feedUrl,
    hubUrls,
    verifyToken: existing?.verifyToken ?? params.verifyToken ?? crypto.randomBytes(16).toString("hex"),
    secret: existing?.secret ?? params.secret,
    hubUrl: params.hubUrl ?? existing?.hubUrl,
    callbackUrl: params.callbackUrl ?? existing?.callbackUrl,
    leaseSeconds: params.leaseSeconds ?? existing?.leaseSeconds,
    leaseExpiresAt: params.leaseExpiresAt ?? existing?.leaseExpiresAt,
    mode: params.mode ?? existing?.mode ?? "pending",
    items: existing?.items ?? new Map(),
    lastHandshakeAt: params.lastHandshakeAt ?? existing?.lastHandshakeAt,
    lastPushAt: params.lastPushAt ?? existing?.lastPushAt,
  };

  store.subscriptions.set(topic, subscription);
  store.topicIndex.set(topicId, topic);

  return subscription;
}

export function storeFeedItems(topic: string, items: NormalizedFeedItem[]): SubscriptionState | undefined {
  const subscription = getSubscription(topic);
  if (!subscription) {
    return undefined;
  }

  const now = Date.now();
  for (const item of items) {
    const key = item.link || `${item.title}::${item.pubDate ?? ""}`;
    subscription.items.set(key, {
      ...item,
      storedAt: now,
    });
  }

  subscription.lastPushAt = now;
  enforceItemLimit(subscription.items, 200);
  return subscription;
}

function enforceItemLimit(map: Map<string, StoredFeedItem>, maxItems: number): void {
  if (map.size <= maxItems) {
    return;
  }

  const sorted = Array.from(map.values()).sort((a, b) => {
    const timeA = a.pubDate ? Date.parse(a.pubDate) : 0;
    const timeB = b.pubDate ? Date.parse(b.pubDate) : 0;
    return timeB - timeA;
  });

  const trimmed = sorted.slice(0, maxItems);
  map.clear();
  for (const item of trimmed) {
    const key = item.link || `${item.title}::${item.pubDate ?? ""}`;
    map.set(key, item);
  }
}

export function getAggregatedItems(feedUrls: string[]): NormalizedFeedItem[] {
  const feeds = new Set(feedUrls);
  const store = getStore();
  const collected: NormalizedFeedItem[] = [];

  for (const subscription of Array.from(store.subscriptions.values())) {
    if (feeds.size > 0 && !feeds.has(subscription.feedUrl)) {
      continue;
    }
    for (const item of Array.from(subscription.items.values())) {
      collected.push(item);
    }
  }

  return collected.sort((a, b) => {
    const timeA = a.pubDate ? Date.parse(a.pubDate) : 0;
    const timeB = b.pubDate ? Date.parse(b.pubDate) : 0;
    return timeB - timeA;
  });
}

export function listSubscriptions(): SubscriptionState[] {
  return Array.from(getStore().subscriptions.values());
}

export function markSubscriptionExpired(topic: string): void {
  const subscription = getSubscription(topic);
  if (!subscription) {
    return;
  }
  subscription.mode = "expired";
}

export function clearStore(): void {
  const store = getStore();
  store.subscriptions.clear();
  store.topicIndex.clear();
}

