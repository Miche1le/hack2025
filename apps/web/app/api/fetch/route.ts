import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { dedupeItems, filterItemsByQuery } from '@shared/feed-utils';
import type { AggregatedItemInput, FetchRequestBody, FetchResponse } from '@shared/types';
import { summarize } from '@shared/summarize';

import { loadFeed, type NormalizedFeedItem } from '../../../../../services/api/rss';

const MAX_FEEDS = 15;

function computeItemId(item: AggregatedItemInput): string {
  return createHash('sha1').update(`${item.title}|${item.link}|${item.source}`).digest('hex');
}

function parseRequestBody(body: unknown): { feeds: string[]; queryTerms: string[] } {
  const candidate = body as Partial<FetchRequestBody> | null | undefined;

  if (!candidate || !Array.isArray(candidate.feeds)) {
    throw new Error('`feeds` array is required');
  }

  const feeds = candidate.feeds.map((feed) => String(feed).trim()).filter(Boolean);
  if (feeds.length === 0) {
    throw new Error('`feeds` array must not be empty');
  }

  if (feeds.length > MAX_FEEDS) {
    throw new Error(`A maximum of ${MAX_FEEDS} feeds is allowed`);
  }

  const query = typeof candidate.query === 'string' ? candidate.query : '';
  const queryTerms = query
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  return { feeds, queryTerms };
}

async function summarizeItems(
  items: NormalizedFeedItem[],
): Promise<(AggregatedItemInput & { summary: string })[]> {
  const summarizationPromises = items.map(async (item) => {
    const textForSummary = item.content?.trim() || item.contentSnippet?.trim() || item.title;
    const summary = await summarize(textForSummary, item.title);

    return {
      title: item.title,
      link: item.link,
      source: item.source,
      published: item.published,
      contentSnippet: item.contentSnippet,
      content: item.content,
      summary,
    } satisfies AggregatedItemInput & { summary: string };
  });

  return Promise.all(summarizationPromises);
}

export async function POST(request: NextRequest) {
  let feeds: string[] = [];
  let queryTerms: string[] = [];

  try {
    const body = await request.json();
    ({ feeds, queryTerms } = parseRequestBody(body));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Invalid request body',
      },
      { status: 400 },
    );
  }

  const feedResults = await Promise.allSettled(feeds.map((feedUrl) => loadFeed(feedUrl)));

  const collectedItems: NormalizedFeedItem[] = [];
  const failures: string[] = [];

  feedResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      collectedItems.push(...result.value);
    } else {
      failures.push(`${feeds[index]}: ${result.reason instanceof Error ? result.reason.message : result.reason}`);
    }
  });

  if (collectedItems.length === 0) {
    const responseBody: FetchResponse = {
      items: [],
      error: 'no valid feeds',
      warnings: failures.length > 0 ? failures : undefined,
    };

    return NextResponse.json(responseBody, { status: 200 });
  }

  const filtered = filterItemsByQuery(collectedItems, queryTerms);
  const uniqueItems = dedupeItems(filtered);
  const summarizedItems = await summarizeItems(uniqueItems);

  const responseItems = summarizedItems.map((item) => ({
    id: computeItemId(item),
    title: item.title,
    link: item.link,
    source: item.source,
    published: item.published,
    summary: item.summary,
  }));

  const responseBody: FetchResponse = {
    items: responseItems,
    warnings: failures.length > 0 ? failures : undefined,
  };

  return NextResponse.json(responseBody, { status: 200 });
}

