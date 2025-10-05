import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

import { dedupeItems, filterItemsByQuery } from "@shared/feed-utils";
import { summarize } from "@shared/summarize";
import type { AggregatedItemInput, FetchRequestBody } from "@shared/types";

const parser: Parser = new Parser({
  timeout: 10000,
});

type ParsedFeed = Parser.Output<Record<string, unknown>>;

function parseBody(body: unknown): { feeds: string[]; queryTerms: string[] } {
  const candidate = body as Partial<FetchRequestBody> | null | undefined;

  if (!candidate || !Array.isArray(candidate.feeds)) {
    throw new Error("`feeds` array is required");
  }

  const feeds = candidate.feeds.map((feed) => String(feed).trim()).filter(Boolean);
  if (feeds.length === 0) {
    throw new Error("`feeds` array must not be empty");
  }

  const query = typeof candidate.query === "string" ? candidate.query : "";
  const queryTerms = query
    .split(",")
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  return { feeds, queryTerms };
}

function toAggregatedItem(feed: ParsedFeed, item: ParsedFeed["items"][number]): AggregatedItemInput {
  return {
    title: item.title?.trim() || feed.title?.trim() || "Untitled item",
    link: item.link || undefined,
    source: feed.link || feed.feedUrl || feed.title || "",
    pubDate: item.pubDate || undefined,
    contentSnippet: item.contentSnippet || item.content || undefined,
    content: item.content || undefined,
  };
}

export async function POST(request: NextRequest) {
  let feeds: string[] = [];
  let queryTerms: string[] = [];

  try {
    const body = await request.json();
    ({ feeds, queryTerms } = parseBody(body));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid request body",
      },
      { status: 400 },
    );
  }

  const collected: AggregatedItemInput[] = [];

  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items) {
        collected.push(toAggregatedItem(feed, item));
      }
    } catch (error) {
      console.error(`Error parsing feed ${url}:`, error);
    }
  }

  const filtered = filterItemsByQuery(collected, queryTerms);
  const deduped = dedupeItems(filtered);

  const summarized = await Promise.all(
    deduped.map(async (article) => {
      const baseText = article.content?.trim() || article.contentSnippet?.trim() || article.title;
      const summary = await summarize(baseText, article.title);
      return { ...article, summary };
    }),
  );

  return NextResponse.json({ articles: summarized });
}