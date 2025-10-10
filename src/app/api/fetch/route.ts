import { NextRequest, NextResponse } from "next/server";
import { dedupeItems, filterItemsByQuery } from "@/lib/feed-utils";
import { loadFeed } from "@/lib/rss-parser";
import summarizer from "@/lib/summarizer";
import { fetchArticleContent } from "@/lib/article";
import type { Article } from "@/types";

const MAX_FEEDS = 15;
const GENERIC_ERROR = "Unable to refresh feeds. Please try again.";
const EMPTY_FEED_ERROR = "Add at least one RSS feed URL.";

type FetchRequestPayload = {
  feeds?: unknown;
  query?: unknown;
};

type FeedQuerySnapshot = {
  feedUrl: string;
  items: Awaited<ReturnType<typeof loadFeed>>;
};

function normalizeFeeds(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value): value is string => value.length > 0)
    .slice(0, MAX_FEEDS);
}

function normalizeQuery(input: unknown): string {
  return typeof input === "string" ? input : "";
}

function normalizeQueryTerms(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

function buildArticleFromFeed(item: Awaited<ReturnType<typeof loadFeed>>[number]): Article {
  return {
    id: `${item.title}::${item.source ?? "unknown"}::${item.link}`,
    title: item.title,
    link: item.link,
    source: item.source ?? "unknown",
    pubDate: item.pubDate,
    summary: item.contentSnippet ?? item.content ?? item.title,
    contentSnippet: item.contentSnippet,
    content: item.content,
    feedUrl: item.feedUrl,
  };
}

async function summarizeArticles(items: Article[]): Promise<Article[]> {
  return Promise.all(
    items.map(async (item) => {
      try {
        const articleContent = item.link ? await fetchArticleContent(item.link).catch(() => null) : null;
        const primaryText = articleContent?.content?.trim() ?? articleContent?.description?.trim() ?? "";
        const fallbackText = (item.content?.trim() || item.summary?.trim() || item.contentSnippet || "").trim();
        const baseText = primaryText.length > 0 ? primaryText : fallbackText;
        const safeBase = baseText.length > 0 ? baseText : item.title ?? "No summary available.";

        const generated = await summarizer
          .summarize(safeBase, item.title)
          .then((result) => result?.trim())
          .catch(() => null);

        return {
          ...item,
          summary: generated && generated.length > 0 ? generated : safeBase,
          content: articleContent?.content ?? item.content,
        };
      } catch (error) {
        console.warn("Failed to summarize feed item", { link: item.link, error });
        return item;
      }
    }),
  );
}

export async function POST(request: NextRequest) {
  let payload: FetchRequestPayload;

  try {
    payload = (await request.json()) as FetchRequestPayload;
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const feedUrls = normalizeFeeds(payload.feeds);
  const query = normalizeQuery(payload.query);

  if (feedUrls.length === 0) {
    return NextResponse.json({ error: EMPTY_FEED_ERROR }, { status: 400 });
  }

  try {
    const results = await Promise.allSettled(
      feedUrls.map(async (feedUrl): Promise<FeedQuerySnapshot> => ({
        feedUrl,
        items: await loadFeed(feedUrl),
      })),
    );

    const collectedItems: Article[] = [];
    const failures: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const { items } = result.value;
        collectedItems.push(...items.map(buildArticleFromFeed));
      } else {
        const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
        failures.push(`${feedUrls[index]}: ${reason}`);
      }
    });

    if (collectedItems.length === 0) {
      return NextResponse.json(
        {
          error: "No stories could be retrieved. Check the feed URLs and try again.",
          warnings: failures,
        },
        { status: 200 },
      );
    }

    // First dedupe all collected items
    const uniqueItems = dedupeItems(collectedItems);

    // Sort newest first by publication date
    const orderedItems = [...uniqueItems].sort((a, b) => {
      const timeA = a.pubDate ? Date.parse(a.pubDate) : 0;
      const timeB = b.pubDate ? Date.parse(b.pubDate) : 0;
      return timeB - timeA;
    });

    // Summarize articles first
    const summarized = await summarizeArticles(orderedItems);

    // Then filter by query (so we can search in AI-generated summaries too)
    const queryTerms = normalizeQueryTerms(query);
    const filtered = filterItemsByQuery(summarized, queryTerms);

    return NextResponse.json({ articles: filtered, warnings: failures }, { status: 200 });
  } catch (error) {
    console.error("Failed to process feed request", error);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
