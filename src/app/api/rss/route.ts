import { NextRequest, NextResponse } from "next/server";
import { refreshFeeds } from "@/server/websub";
import { dedupeItems } from "@/lib/feed-utils";
import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_FEED_URLS,
  absolutePath,
} from "@/lib/site-config";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

import type { Article } from "@/types";

function buildRss(items: Article[], warnings: string[]): string {
  const lastBuildDate = new Date().toUTCString();
  const itemEntries = items
    .map((item) => {
      const title = item.title ? `<title>${escapeXml(item.title)}</title>` : "";
      const pubDate = item.pubDate ? `<pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>` : "";
      const descriptionContent = item.content ?? item.contentSnippet ?? "";
      const description = descriptionContent ? `<description><![CDATA[${descriptionContent}]]></description>` : "";
      const guid = item.link ? `<guid isPermaLink="true">${escapeXml(item.link)}</guid>` : "";
      const link = item.link ? `<link>${escapeXml(item.link)}</link>` : "";
      const source = item.source ? `<author>${escapeXml(item.source)}</author>` : "";

      return `<item>
        ${title}
        ${link}
        ${guid}
        ${pubDate}
        ${source}
        ${description}
      </item>`;
    })
    .join("\n");

  const warningBlock =
    warnings.length > 0
      ? `<rssWarning><![CDATA[${warnings.join(" | ")}]]></rssWarning>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${escapeXml(SITE_URL)}</link>
      <description>${escapeXml(SITE_NAME)}</description>
      <lastBuildDate>${lastBuildDate}</lastBuildDate>
      <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
      ${warningBlock}
      ${itemEntries}
    </channel>
  </rss>`;
}

export async function GET(request: NextRequest) {
  const feedsParam = request.nextUrl.searchParams.get("feeds");
  const feeds = feedsParam
    ? feedsParam.split(",").map((feed) => feed.trim()).filter(Boolean)
    : DEFAULT_FEED_URLS;

  const { items, warnings } = await refreshFeeds(feeds);
  const normalized = items.map<Article>((item) => ({
    id: `${item.title}::${item.source}::${item.link}`,
    title: item.title,
    link: item.link,
    source: item.source ?? "unknown",
    pubDate: item.pubDate,
    summary: item.contentSnippet ?? item.content ?? item.title,
    contentSnippet: item.contentSnippet,
    content: item.content,
    feedUrl: item.feedUrl,
  }));
  const uniqueItems = dedupeItems<Article>(normalized).slice(0, 50);
  const rss = buildRss(uniqueItems, warnings);

  return new NextResponse(rss, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=120",
      "link": `<${absolutePath("/api/feed.json")}>; rel="alternate"; type="application/json"`,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const feeds = Array.isArray(body?.feeds) ? body.feeds : DEFAULT_FEED_URLS;
  const { items, warnings } = await refreshFeeds(feeds);
  const normalized = items.map<Article>((item) => ({
    id: `${item.title}::${item.source}::${item.link}`,
    title: item.title,
    link: item.link,
    source: item.source ?? "unknown",
    pubDate: item.pubDate,
    summary: item.contentSnippet ?? item.content ?? item.title,
    contentSnippet: item.contentSnippet,
    content: item.content,
    feedUrl: item.feedUrl,
  }));
  const uniqueItems = dedupeItems<Article>(normalized).map((item) => ({
    title: item.title,
    link: item.link,
    source: item.source,
    pubDate: item.pubDate,
    contentSnippet: item.contentSnippet,
    content: item.content,
    feedUrl: item.feedUrl,
  }));

  return NextResponse.json({ items: uniqueItems, warnings });
}

