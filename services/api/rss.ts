import Parser from 'rss-parser';

import { extractHostname } from '@shared/feed-utils';
import type { AggregatedItemInput } from '@shared/types';

const MAX_ITEMS_PER_FEED = 20;
const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = 'NewsAggregatorBot/1.0 (+https://example.com)';

const parser = new Parser({
  defaultRSS: 2.0,
  headers: {
    'user-agent': USER_AGENT,
  },
});

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
}

export interface NormalizedFeedItem extends AggregatedItemInput {
  feedUrl: string;
  content?: string;
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

function collectContent(item: RSSItem): { snippet: string; content?: string } {
  const snippetSource = item.contentSnippet || item.summary || item.content || '';
  const snippet = snippetSource.replace(/\s+/g, ' ').trim();
  const content = item.content?.trim();
  return { snippet, content: content && content.length > 0 ? content : undefined };
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/rss+xml, application/xml, text/xml, */*;q=0.8',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch feed: ' + response.status + ' ' + response.statusText);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timed out after ' + FETCH_TIMEOUT_MS + 'ms');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadFeed(feedUrl: string): Promise<NormalizedFeedItem[]> {
  const xml = await fetchWithTimeout(feedUrl);
  const feed = (await parser.parseString(xml)) as RSSFeed;
  const feedHost = extractHostname(feed.link || feedUrl) || extractHostname(feedUrl);

  const items = feed.items?.slice(0, MAX_ITEMS_PER_FEED) ?? [];

  return items
    .map((item) => {
      if (!item.title || !item.link) {
        return null;
      }

      const linkHost = extractHostname(item.link) || feedHost;
      const { snippet, content } = collectContent(item);

      return {
        title: item.title.trim(),
        link: item.link,
        source: linkHost || feedHost || 'unknown',
        pubDate: selectPublishedDate(item),
        contentSnippet: snippet.length > 0 ? snippet : undefined,
        content,
        feedUrl,
      } as NormalizedFeedItem;
    })
    .filter((item): item is NormalizedFeedItem => item !== null);
}

export const __private__ = {
  collectContent,
  selectPublishedDate,
  fetchWithTimeout,
};
