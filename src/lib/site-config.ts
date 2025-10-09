const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const defaultFeeds = process.env.NEXT_PUBLIC_DEFAULT_FEEDS ??
  "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml";

export const SITE_URL = defaultSiteUrl.replace(/\/$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Hack2025 News Aggregator";
export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
  "Personal news summaries with WebSub push delivery, JSON Feed, ActivityStreams, and semantic microformats.";

export const DEFAULT_FEED_URLS = defaultFeeds
  .split(/[,\n]/)
  .map((entry) => entry.trim())
  .filter(Boolean);

export const PRIMARY_FEED_URL = DEFAULT_FEED_URLS[0] ??
  "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml";

export const DEFAULT_HUB_URL =
  process.env.NEXT_PUBLIC_WEBSUB_HUB ?? "https://pubsubhubbub.appspot.com/";

export const JSON_FEED_PATH = "/api/feed.json";
export const ACTIVITY_ACTOR_PATH = "/api/activitypub/actor";
export const ACTIVITY_OUTBOX_PATH = "/api/activitypub/outbox";
export const RSS_API_PATH = "/api/rss";

export function absolutePath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

