// @ts-ignore - временное решение для проблем с типами
import { extract } from "@extractus/article-extractor";

export interface ExtractedArticle {
  content?: string;
  description?: string;
}

export async function fetchArticleContent(url: string): Promise<ExtractedArticle | null> {
  try {
    const result = await extract(url, {
      descriptionLengthThreshold: 120,
      fetch: (input: any, init: any) => fetch(input, {
        ...init,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; Hack2025Bot/1.0)",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      }),
    });

    if (!result) {
      return null;
    }

    return {
      content: result.content ?? result.articleText ?? undefined,
      description: result.excerpt ?? result.description ?? undefined,
    };
  } catch (error) {
    console.warn("Failed to extract article", { url, error });
    return null;
  }
}

