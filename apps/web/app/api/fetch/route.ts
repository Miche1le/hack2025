import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { dedupeItems, filterItemsByQuery } from '@shared/feed-utils';
import { summarize } from '@shared/summarize';
import type { AggregatedItemInput, FetchRequestBody, FetchResponse } from '@shared/types';
import { loadFeed, type NormalizedFeedItem } from '@services/api/rss';

const MAX_FEEDS = 15;

interface ParsedRequest {
  feeds: string[];
  queryTerms: string[];
  warnings: string[];
}

function computeItemId(item: AggregatedItemInput): string {
  const hash = createHash('sha1');
  hash.update(item.title ?? '');
  hash.update('||');
  hash.update(item.link ?? '');
  hash.update('||');
  hash.update(item.source ?? '');
  if (item.pubDate) {
    hash.update('||');
    hash.update(item.pubDate);
  }
  return hash.digest('hex');
}

function parseRequestBody(body: unknown): ParsedRequest {
  const candidate = body as Partial<FetchRequestBody> | null | undefined;

  if (!candidate || !Array.isArray(candidate.feeds)) {
    throw new Error('feeds array is required');
  }

  const feeds = candidate.feeds
    .map((feed) => String(feed).trim())
    .filter(Boolean);

  if (feeds.length === 0) {
    throw new Error('feeds array must not be empty');
  }

  const uniqueFeeds = Array.from(new Set(feeds));
  const trimmedFeeds = uniqueFeeds.slice(0, MAX_FEEDS);
  const warnings: string[] = [];

  if (uniqueFeeds.length > MAX_FEEDS) {
    warnings.push('Only the first ' + MAX_FEEDS + ' feeds were processed. Add fewer URLs or create another view.');
  }

  const rawQuery = typeof candidate.query === 'string' ? candidate.query : '';
  const queryTerms = rawQuery
    .split(/[\n,]/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  return { feeds: trimmedFeeds, queryTerms, warnings };
}

async function summarizeItems(items: NormalizedFeedItem[]): Promise<(AggregatedItemInput & { summary: string })[]> {
  const results = await Promise.allSettled(
    items.map(async (item) => {
      const baseText = (item.content?.trim() || item.contentSnippet || item.title || '').trim();
      const safeBase = baseText.length > 0 ? baseText : 'No summary available.';
      let summary = safeBase;

      try {
        const generated = await summarize(safeBase, item.title);
        summary = generated && generated.trim().length > 0 ? generated.trim() : safeBase;
      } catch (error) {
        console.warn('Failed to summarize feed item', { 
          link: item.link, 
          title: item.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Используем fallback суммаризацию
        summary = safeBase;
      }

      return {
        title: item.title,
        link: item.link,
        source: item.source,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        content: item.content,
        summary,
      } satisfies AggregatedItemInput & { summary: string };
    }),
  );

  // Обрабатываем результаты, включая отклоненные промисы
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Fallback для неудачных суммаризаций
      const item = items[index];
      const baseText = (item.content?.trim() || item.contentSnippet || item.title || '').trim();
      return {
        title: item.title,
        link: item.link,
        source: item.source,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        content: item.content,
        summary: baseText.length > 0 ? baseText : 'No summary available.',
      } satisfies AggregatedItemInput & { summary: string };
    }
  });
}

function sortByPublished(items: NormalizedFeedItem[]): NormalizedFeedItem[] {
  return [...items].sort((a, b) => {
    const timeA = a.pubDate ? Date.parse(a.pubDate) : 0;
    const timeB = b.pubDate ? Date.parse(b.pubDate) : 0;
    return timeB - timeA;
  });
}

export async function POST(request: NextRequest) {
  let parsed: ParsedRequest;

  try {
    const body = await request.json();
    parsed = parseRequestBody(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request body' },
      { status: 400 },
    );
  }

  const feedResults = await Promise.allSettled(parsed.feeds.map((feedUrl) => loadFeed(feedUrl)));

  const collectedItems: NormalizedFeedItem[] = [];
  const failures: string[] = [...parsed.warnings];

  feedResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      collectedItems.push(...result.value);
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      failures.push(parsed.feeds[index] + ': ' + reason);
    }
  });

  if (collectedItems.length === 0) {
    const responseBody: FetchResponse = {
      items: [],
      error: 'No stories could be retrieved. Check the feed URLs and try again.',
      warnings: failures.length > 0 ? failures : undefined,
    };

    return NextResponse.json(responseBody, { status: 200 });
  }

  const filtered = filterItemsByQuery(collectedItems, parsed.queryTerms);
  const uniqueItems = dedupeItems(filtered);
  const orderedItems = sortByPublished(uniqueItems);
  const summarized = await summarizeItems(orderedItems);

  const responseItems = summarized.map((item) => ({
    id: computeItemId(item),
    title: item.title,
    link: item.link,
    source: item.source,
    published: item.pubDate ?? '',
    summary: item.summary ?? '',
  }));

  const responseBody: FetchResponse = {
    items: responseItems,
    warnings: failures.length > 0 ? failures : undefined,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
