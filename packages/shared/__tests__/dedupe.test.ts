import { describe, expect, it } from 'vitest';

import { dedupeItems, extractHostname } from '../feed-utils';
import type { AggregatedItemInput } from '../types';

describe('extractHostname', () => {
  it('supports bare domains without protocol', () => {
    expect(extractHostname('Example.com')).toBe('example.com');
  });

  it('trims spaces and lowercases the result', () => {
    expect(extractHostname('  HTTPS://Blog.EXAMPLE.com/post ')).toBe('blog.example.com');
  });

  it('returns empty string for invalid inputs', () => {
    expect(extractHostname('not a url: example')).toBe('');
    expect(extractHostname('')).toBe('');
    expect(extractHostname(undefined)).toBe('');
  });
});

describe('dedupeItems', () => {
  const base: AggregatedItemInput = {
    title: 'OpenAI запускает новый сервис',
    link: 'https://example.com/news/1',
    source: 'example.com',
    published: '2024-05-01T00:00:00.000Z',
    contentSnippet: 'Компания представила новую платформу.',
    content: 'Компания представила новую платформу.',
  };

  it('removes duplicates for identical titles within the same domain', () => {
    const items = [
      base,
      {
        ...base,
        link: 'https://example.com/news/1-duplicate',
        contentSnippet: 'Дубликат записи.',
      },
    ];

    const deduped = dedupeItems(items);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].link).toBe(base.link);
  });

  it('keeps entries with the same title but different domains', () => {
    const items = [
      base,
      {
        ...base,
        link: 'https://another.com/story/1',
        source: 'another.com',
      },
    ];

    const deduped = dedupeItems(items);
    expect(deduped).toHaveLength(2);
  });

  it('deduplicates titles for the same domain even if the source casing differs', () => {
    const items = [
      base,
      {
        ...base,
        source: 'EXAMPLE.COM',
        link: 'https://example.com/news/1-updated',
        contentSnippet: 'Вторая версия записи на том же домене.',
      },
    ];

    const deduped = dedupeItems(items);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].source).toBe(base.source);
  });

  it('falls back to link hostname when source is missing', () => {
    const items = [
      {
        ...base,
        source: '',
      },
      {
        ...base,
        source: '',
        link: 'https://example.com/news/1-duplicate?utm_source=rss',
        contentSnippet: 'Дубликат записи с UTM-меткой.',
      },
    ];

    const deduped = dedupeItems(items);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].link).toBe(base.link);
  });

  it('considers titles equal after normalization as duplicates', () => {
    const items = [
      base,
      {
        ...base,
        title: '  OPENAI запускает новый сервис!!! ',
        link: 'https://example.com/news/1-variant',
      },
    ];

    const deduped = dedupeItems(items);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].title).toBe(base.title);
  });
});
