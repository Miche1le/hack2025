import Parser from "rss-parser";
import { extractHostname } from "./feed-utils";

const MAX_ITEMS_PER_FEED = 20;
const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "NewsAggregatorBot/1.0 (+https://example.com)";


interface RSSItem {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  [key: string]: unknown;
}

interface RSSFeed {
  link?: string;
  items?: RSSItem[];
  atomLinks?: Array<{ [key: string]: unknown }>;
  rawLinks?: Array<{ [key: string]: unknown }>;
}

export interface NormalizedFeedItem {
  title: string;
  link: string;
  source: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  feedUrl: string;
}

export interface FeedMetadata {
  hubUrls: string[];
  selfUrl?: string;
  topicUrl?: string;
}

export interface FeedFetchResult {
  items: NormalizedFeedItem[];
  metadata: FeedMetadata;
}

function selectPublishedDate(item: RSSItem): string {
  if (item.isoDate) {
    return item.isoDate;
  }

  if (item.pubDate) {
    const date = new Date(item.pubDate);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}

async function fetchWithTimeout(url: string): Promise<{ xml: string; headers: Headers }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/rss+xml, application/xml, text/xml, */*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch feed: " + response.status + " " + response.statusText);
    }

    const xml = await response.text();
    return { xml, headers: response.headers };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timed out after " + FETCH_TIMEOUT_MS + "ms");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseLinkHeader(value: string | null): FeedMetadata {
  if (!value) {
    return { hubUrls: [] };
  }

  const parts = value.split(",");
  const hubs = new Set<string>();
  let selfUrl: string | undefined;

  for (const part of parts) {
    const hrefMatch = part.match(/<([^>]+)>/);
    const relMatch = part.match(/rel="?([^";]+)"?/i);
    if (!hrefMatch || !relMatch) {
      continue;
    }

    const url = hrefMatch[1].trim();
    const relValue = relMatch[1].trim().toLowerCase();

    if (relValue.includes("hub")) {
      hubs.add(url);
    }

    if (relValue.includes("self")) {
      selfUrl = url;
    }
  }

  return {
    hubUrls: Array.from(hubs),
    selfUrl,
    topicUrl: selfUrl,
  };
}

function discoverWebSubLinksFromXml(xml: string): FeedMetadata {
  const linkRegex = /<(?:atom:)?link\b([^>]+)>/gi;
  const hubs = new Set<string>();
  const selfCandidates: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(xml))) {
    const attributes = match[1];
    if (!attributes) {
      continue;
    }

    const relMatch = attributes.match(/\brel=["']([^"']+)["']/i);
    const hrefMatch = attributes.match(/\bhref=["']([^"']+)["']/i);

    if (!hrefMatch) {
      continue;
    }

    const relValue = relMatch?.[1]?.toLowerCase() ?? "";
    const hrefValue = hrefMatch[1];

    if (relValue.split(/\s+/).includes("hub")) {
      hubs.add(hrefValue);
    }

    if (relValue.split(/\s+/).includes("self")) {
      selfCandidates.push(hrefValue);
    }
  }

  return {
    hubUrls: Array.from(hubs),
    selfUrl: selfCandidates[0],
    topicUrl: selfCandidates[0],
  };
}

async function normalizeItems(feed: RSSFeed, feedUrl: string): Promise<NormalizedFeedItem[]> {
  const feedHost = extractHostname(feed.link || feedUrl) || extractHostname(feedUrl);
  const items = feed.items?.slice(0, MAX_ITEMS_PER_FEED) ?? [];

  const normalized = items
    .map((item) => {
      if (!item.title || !item.link) {
        return null;
      }

      const linkHost = extractHostname(item.link) || feedHost;
      const snippetSource = item.contentSnippet || item.summary || item.content || "";
      const snippet = snippetSource.replace(/\s+/g, " ").trim();
      const content = item.content?.trim();

      return {
        title: item.title.trim(),
        link: item.link,
        source: linkHost || feedHost || "unknown",
        pubDate: selectPublishedDate(item),
        contentSnippet: snippet.length > 0 ? snippet : undefined,
        content,
        feedUrl,
      } as NormalizedFeedItem;
    })
    .filter((item): item is NormalizedFeedItem => item !== null);

  return normalized;
}

export async function parseFeedXml(xml: string, feedUrl: string): Promise<FeedFetchResult> {
  const parser = new Parser({
    defaultRSS: 2.0,
    headers: {
      "user-agent": USER_AGENT,
    },
  });

  const feed = (await parser.parseString(xml)) as RSSFeed;
  const items = await normalizeItems(feed, feedUrl);
  const metadataFromXml = discoverWebSubLinksFromXml(xml);
  const link = feed.link || metadataFromXml.selfUrl || feedUrl;

  return {
    items,
    metadata: {
      hubUrls: metadataFromXml.hubUrls,
      selfUrl: metadataFromXml.selfUrl || feed.link,
      topicUrl: metadataFromXml.topicUrl || link,
    },
  };
}

export async function loadFeedWithMetadata(feedUrl: string): Promise<FeedFetchResult> {
  const { xml, headers } = await fetchWithTimeout(feedUrl);
  const parsed = await parseFeedXml(xml, feedUrl);
  const headerMetadata = parseLinkHeader(headers.get("link"));

  const hubSet = new Set<string>([...parsed.metadata.hubUrls, ...(headerMetadata.hubUrls ?? [])]);
  const selfUrl = parsed.metadata.selfUrl || headerMetadata.selfUrl || feedUrl;

  return {
    items: parsed.items,
    metadata: {
      hubUrls: Array.from(hubSet),
      selfUrl,
      topicUrl: parsed.metadata.topicUrl || headerMetadata.topicUrl || selfUrl,
    },
  };
}

export async function loadFeed(feedUrl: string): Promise<NormalizedFeedItem[]> {
  const { items } = await loadFeedWithMetadata(feedUrl);
  return items;
}
