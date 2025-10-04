import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { summarize } from '@shared/summarize';

const parser: Parser = new Parser({
  timeout: 10000
});

/**
 * API endpoint to fetch and summarize articles from one or more RSS feeds. The
 * body of the POST request should be JSON with the following shape:
 * `{ feeds: string[], query?: string }` where `feeds` is an array of URLs
 * pointing to RSS feeds and `query` is an optional keyword used to filter
 * results by title or description. Duplicate articles (based on source and
 * title) are removed. Each article is summarized into three sentences by
 * default, using OpenAI when configured or a fallback summarizer otherwise.
 */
export async function POST(req: NextRequest) {
  try {
    const { feeds, query } = await req.json();
    if (!Array.isArray(feeds) || feeds.length === 0) {
      return NextResponse.json({ error: 'feeds array is required' }, { status: 400 });
    }
    const articles: { title?: string; link?: string; contentSnippet?: string; pubDate?: string; source?: string }[] = [];
    for (const url of feeds) {
      try {
        const feed = await parser.parseURL(url);
        for (const item of feed.items) {
          if (query) {
            const text = (item.title || '') + ' ' + (item.contentSnippet || '') + ' ' + (item.content || '');
            if (!text.toLowerCase().includes(query.toLowerCase())) continue;
          }
          articles.push({
            title: item.title,
            link: item.link,
            contentSnippet: item.contentSnippet || item.content || '',
            pubDate: item.pubDate,
            source: feed.title
          });
        }
      } catch (err) {
        console.error(`Error parsing feed ${url}:`, err);
      }
    }
    // Deduplicate articles by combining source and normalized title
    const seen = new Set<string>();
    const unique: typeof articles = [];
    for (const a of articles) {
      const key = `${a.source || ''}-${(a.title || '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(a);
      }
    }
    // Summarize articles concurrently
    const summarized = await Promise.all(
      unique.map(async (article) => {
        const summary = await summarize(article.contentSnippet || '');
        return { ...article, summary };
      })
    );
    return NextResponse.json({ articles: summarized });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
