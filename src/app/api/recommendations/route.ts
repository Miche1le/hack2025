import { NextRequest, NextResponse } from "next/server";
import { findSimilarArticles, findSimilarArticlesKeywordBased } from "@/lib/embeddings";
import type { Article } from "@/types";

type RecommendationRequest = {
  favoriteIds: string[];
  candidateIds: string[];
  articles: Article[];
  topK?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecommendationRequest;
    const { favoriteIds, candidateIds, articles, topK = 5 } = body;

    if (!Array.isArray(favoriteIds) || !Array.isArray(candidateIds) || !Array.isArray(articles)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Get favorite and candidate articles
    const favoriteArticles = articles.filter((article) => favoriteIds.includes(article.id));
    const candidateArticles = articles.filter((article) => candidateIds.includes(article.id));

    if (favoriteArticles.length === 0 || candidateArticles.length === 0) {
      return NextResponse.json({ recommendations: [] }, { status: 200 });
    }

    // Try semantic search first
    try {
      const recommendations = await findSimilarArticles(favoriteArticles, candidateArticles, topK);
      
      if (recommendations.length > 0) {
        console.log(`Found ${recommendations.length} semantic recommendations`);
        return NextResponse.json({ recommendations, method: "semantic" }, { status: 200 });
      }
    } catch (error) {
      console.warn("Semantic search failed, falling back to keyword-based:", error);
    }

    // Fallback to keyword-based recommendations
    const recommendations = findSimilarArticlesKeywordBased(favoriteArticles, candidateArticles, topK);
    console.log(`Found ${recommendations.length} keyword-based recommendations`);
    
    return NextResponse.json({ recommendations, method: "keyword" }, { status: 200 });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

