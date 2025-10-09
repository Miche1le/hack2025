export function extractHostname(url?: string): string {
  if (!url) {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const candidate = /:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    const hostname = new URL(candidate).hostname;
    return hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createDedupKey(title: string, source: string, link?: string): string {
  const normalizedTitle = normalizeTitle(title);
  const normalizedSource = extractHostname(source) || extractHostname(link) || "unknown";
  return `${normalizedTitle}::${normalizedSource}`;
}

export function dedupeItems<T extends { title: string; source: string; link?: string }>(items: T[]): T[] {
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

export function filterItemsByQuery<
  T extends { title: string; contentSnippet?: string; content?: string }
>(
  items: T[], 
  queryTerms: string[]
): T[] {
  if (!Array.isArray(queryTerms) || queryTerms.length === 0) {
    return items;
  }

  const normalizedTerms = queryTerms
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedTerms.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [item.title, item.content, item.contentSnippet]
      .map((segment) => segment?.toLowerCase() ?? "")
      .join(" ");

    return normalizedTerms.some((term) => haystack.includes(term));
  });
}
