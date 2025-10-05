import { describe, expect, it } from 'vitest';

import { dedupeItems, extractHostname, filterItemsByQuery } from '../feed-utils';
import type { AggregatedItemInput } from '../types';

describe('extractHostname', () => {
  it('supports bare domains without protocol', () => {
    expect(extractHostname('Example.com')).toBe('example.com');
  });

  it('trims spaces and normalises casing', () => {
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
    title: 'OpenAI launches a new service',
    link: 'https://example.com/news/1',
    source: 'example.com',
    pubDate: '2024-05-01T00:00:00.000Z',
    contentSnippet: 'The company introduced a new platform.',
    content: 'The company introduced a new platform.',
  };

  it('removes duplicates when host and title match', () => {
    const items = [
      base,
      {
        ...base,
        source: 'EXAMPLE.com',
        link: 'https://example.com/news/1-copy',
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

  it('uses link hostname when source is empty', () => {
    const first: AggregatedItemInput = {
      title: 'SpaceX schedules a launch',
      link: 'https://spacex.com/launch',
      source: '',
    };
    const second: AggregatedItemInput = {
      title: 'spacex schedules a launch!!!',
      link: 'https://spacex.com/launch?ref=dup',
      source: '',
    };

    const deduped = dedupeItems([first, second]);
    expect(deduped).toHaveLength(1);
  });
});

describe('filterItemsByQuery', () => {
  const entries: AggregatedItemInput[] = [
    { title: 'AI helps analyse data', link: 'https://example.com/ai', source: 'example.com', contentSnippet: 'The algorithm saves time' },
    { title: 'European economy grows', link: 'https://world.example/eu', source: 'world.example', contentSnippet: 'Markets hold firm' },
  ];

  it('keeps entries containing provided terms', () => {
    const filtered = filterItemsByQuery(entries, ['Ai', 'space']);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe(entries[0].title);
  });

});
