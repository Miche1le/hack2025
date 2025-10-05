import type { AggregatedItemInput } from './types';

export function extractHostname(url: string | undefined): string {
  if (!url) {
    return '';
  }

  try {
    const hostname = new URL(url).hostname;
    return hostname.toLowerCase();
  } catch (error) {
    return '';
  }
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createDedupKey(title: string, source: string): string {
  const normalizedTitle = normalizeTitle(title);
  const normalizedSource = source.toLowerCase();
  return `${normalizedTitle}::${normalizedSource}`;
}

export function dedupeItems<T extends AggregatedItemInput>(items: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    const key = createDedupKey(item.title, item.source);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

export function filterItemsByQuery<T extends AggregatedItemInput>(items: T[], terms: string[]): T[] {
  if (!Array.isArray(terms) || terms.length === 0) {
    return items;
  }

  const normalizedTerms = terms.map((term) => term.trim().toLowerCase()).filter(Boolean);
  if (normalizedTerms.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [item.title, item.contentSnippet ?? '', item.content ?? '']
      .join(' ')
      .toLowerCase();

    return normalizedTerms.some((term) => haystack.includes(term));
  });
}
