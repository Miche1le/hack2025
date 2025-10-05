import type { AggregatedItemInput } from './types';

export function extractHostname(url: string | undefined): string {
  if (!url) {
    return '';
  }

  try {
    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }

    const candidate = /:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    const hostname = new URL(candidate).hostname;
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

export function createDedupKey(title: string, source: string, link?: string): string {
  const normalizedTitle = normalizeTitle(title);
  const normalizedSource = extractHostname(source) || extractHostname(link);
  return `${normalizedTitle}::${normalizedSource}`;
}

export function dedupeItems<T extends AggregatedItemInput>(items: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    const key = createDedupKey(item.title, item.source, item.link);
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
