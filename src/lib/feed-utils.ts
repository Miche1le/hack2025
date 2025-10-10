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

export function createDedupKey(
  title: string,
  source: string,
  link?: string,
): string {
  const normalizedTitle = normalizeTitle(title);
  const normalizedSource =
    extractHostname(source) || extractHostname(link) || "unknown";
  return `${normalizedTitle}::${normalizedSource}`;
}

export function dedupeItems<
  T extends { title: string; source: string; link?: string },
>(items: T[]): T[] {
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

// Advanced scoring-based search with weights
interface ScoredItem<T> {
  item: T;
  score: number;
}

function calculateSearchScore(
  text: string,
  searchTerms: string[],
  weight: number = 1,
): number {
  const lowerText = text.toLowerCase();
  let score = 0;

  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase();

    // Exact phrase match - highest score
    if (lowerText.includes(lowerTerm)) {
      score += weight * 10;

      // Bonus for word boundary match (not part of larger word)
      // Use Unicode-aware word boundaries that work with Cyrillic and other scripts
      const escapedTerm = lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Use negative lookahead/lookbehind with Unicode letter/number classes
      const regex = new RegExp(
        `(?<!\\p{L}|\\p{N})${escapedTerm}(?!\\p{L}|\\p{N})`,
        "gimu",
      );
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length * weight * 5;
      }
    }

    // Partial word matches (for longer terms)
    if (lowerTerm.length > 4) {
      // Split by non-letter/non-number characters to get words
      const words = lowerText.split(/[^\p{L}\p{N}]+/u);
      for (const word of words) {
        if (word.includes(lowerTerm) || lowerTerm.includes(word)) {
          score += weight * 2;
        }
      }
    }
  }

  return score;
}

export function filterItemsByQuery<
  T extends {
    title: string;
    contentSnippet?: string;
    content?: string;
    summary?: string;
    searchScore?: number;
  },
>(items: T[], queryTerms: string[]): T[] {
  if (!Array.isArray(queryTerms) || queryTerms.length === 0) {
    return items;
  }

  const normalizedTerms = queryTerms
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedTerms.length === 0) {
    return items;
  }

  // Score each item
  const scoredItems: ScoredItem<T>[] = items.map((item) => {
    let totalScore = 0;

    // Title has highest weight (3x)
    totalScore += calculateSearchScore(item.title || "", normalizedTerms, 3);

    // Summary has medium weight (2x)
    totalScore += calculateSearchScore(item.summary || "", normalizedTerms, 2);

    // Content snippets have lower weight (1x)
    totalScore += calculateSearchScore(
      item.contentSnippet || "",
      normalizedTerms,
      1,
    );
    totalScore += calculateSearchScore(
      item.content || "",
      normalizedTerms,
      0.5,
    );

    return { item, score: totalScore };
  });

  // Filter items with score > 0, attach score, and sort by score descending
  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ ...item, searchScore: score }));
}
