import { NextRequest, NextResponse } from "next/server";
import { refreshFeeds } from "@/server/websub";
import {
  ACTIVITY_OUTBOX_PATH,
  JSON_FEED_PATH,
  RSS_API_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absolutePath,
  DEFAULT_FEED_URLS,
} from "@/lib/site-config";
import { dedupeItems } from "@/lib/feed-utils";

export async function GET(request: NextRequest) {
  const feedsParam = request.nextUrl.searchParams.get("feeds");
  const feeds = feedsParam
    ? feedsParam.split(",").map((feed) => feed.trim()).filter(Boolean)
    : DEFAULT_FEED_URLS;

  const { items, warnings } = await refreshFeeds(feeds);
  const uniqueItems = dedupeItems(items).slice(0, 50);
  const feedUrl = absolutePath(JSON_FEED_PATH);

  const jsonFeed = {
    version: "https://jsonfeed.org/version/1",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    home_page_url: SITE_URL,
    feed_url: feedUrl,
    language: "en-US",
    hubs: [],
    warnings,
    items: uniqueItems.map((item) => ({
      id: item.link ?? item.title,
      url: item.link,
      title: item.title,
      summary: item.contentSnippet,
      content_html: item.content ?? item.contentSnippet ?? item.title,
      date_published: item.pubDate,
      external_url: item.link,
      authors: item.source ? [{ name: item.source }] : undefined,
    })),
    attachments: [
      {
        url: absolutePath(RSS_API_PATH),
        mime_type: "application/rss+xml",
        title: "RSS", 
      },
      {
        url: absolutePath(ACTIVITY_OUTBOX_PATH),
        mime_type: "application/activity+json",
        title: "ActivityStreams Outbox",
      },
    ],
  };

  return NextResponse.json(jsonFeed, {
    headers: {
      "content-type": "application/json",
    },
  });
}

