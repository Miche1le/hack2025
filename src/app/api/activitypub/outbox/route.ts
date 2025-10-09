import { NextRequest, NextResponse } from "next/server";
import { refreshFeeds } from "@/server/websub";
import {
  ACTIVITY_OUTBOX_PATH,
  SITE_NAME,
  SITE_URL,
  JSON_FEED_PATH,
  RSS_API_PATH,
  absolutePath,
  DEFAULT_FEED_URLS,
} from "@/lib/site-config";
import { dedupeItems } from "@/lib/feed-utils";

const ACTIVITYSTREAMS_MEDIA_TYPE = "application/activity+json";

export async function GET(request: NextRequest) {
  const actorUrl = absolutePath("/api/activitypub/actor");
  const outboxUrl = absolutePath(ACTIVITY_OUTBOX_PATH);
  const searchParams = request.nextUrl.searchParams;
  const feedsParam = searchParams.get("feeds");
  const feeds = feedsParam
    ? feedsParam.split(",").map((entry) => entry.trim()).filter(Boolean)
    : DEFAULT_FEED_URLS;

  const { items, warnings } = await refreshFeeds(feeds);
  const uniqueItems = dedupeItems(items).slice(0, 50);

  const ordered = uniqueItems.map((item) => {
    const published = item.pubDate ? new Date(item.pubDate).toISOString() : undefined;
    const htmlContent = item.content || item.contentSnippet || item.title;
    return {
      id: `${outboxUrl}#${encodeURIComponent(item.link)}`,
      type: "Create",
      actor: actorUrl,
      published,
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      object: {
        id: item.link,
        type: "Article",
        url: item.link,
        name: item.title,
        attributedTo: item.source,
        published,
        content: htmlContent,
        contentMap: {
          en: htmlContent,
        },
        attachments: [
          {
            type: "PropertyValue",
            name: "Summary",
            value: item.contentSnippet ?? item.content ?? item.title,
          },
        ],
      },
    };
  });

  const collection = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: outboxUrl,
    type: "OrderedCollection",
    totalItems: ordered.length,
    summary: `${SITE_NAME} Activity Outbox for ${SITE_URL}`,
    orderedItems: ordered,
    warnings,
    links: {
      jsonFeed: JSON_FEED_PATH,
      rss: RSS_API_PATH,
    },
  };

  return NextResponse.json(collection, {
    headers: {
      "content-type": ACTIVITYSTREAMS_MEDIA_TYPE,
    },
  });
}

