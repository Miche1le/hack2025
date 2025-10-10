// Semantic embeddings for smart recommendations using Ollama/OpenAI

interface EmbeddingResponse {
  embedding: number[];
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Use OpenAI-compatible API (Ollama or OpenAI)
async function createEmbedding(text: string): Promise<number[] | null> {
  try {
    const baseUrl = OPENAI_BASE_URL || OLLAMA_BASE_URL;
    const url = `${baseUrl}/v1/embeddings`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OPENAI_API_KEY ? { "Authorization": `Bearer ${OPENAI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: "nomic-embed-text", // Ollama embedding model
        input: text.slice(0, 2000), // Limit text length
      }),
    });

    if (!response.ok) {
      console.warn("Embedding API error:", response.status);
      return null;
    }

    const data = await response.json() as { data: EmbeddingResponse[] };
    return data.data[0]?.embedding || null;
  } catch (error) {
    console.warn("Failed to create embedding:", error);
    return null;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Calculate average embedding from multiple texts
function averageEmbeddings(embeddings: number[][]): number[] | null {
  if (embeddings.length === 0) return null;
  
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);
  
  for (const embedding of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += embedding[i];
    }
  }
  
  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }
  
  return avg;
}

export interface ArticleWithEmbedding {
  id: string;
  title: string;
  summary?: string;
  embedding?: number[];
}

// Create embedding for an article
export async function embedArticle(article: { title: string; summary?: string }): Promise<number[] | null> {
  const text = `${article.title}\n${article.summary || ""}`.trim();
  return createEmbedding(text);
}

// Find similar articles based on favorites
export async function findSimilarArticles<T extends ArticleWithEmbedding>(
  favoriteArticles: T[],
  candidateArticles: T[],
  topK: number = 5
): Promise<T[]> {
  try {
    // Create embeddings for favorites (if not already embedded)
    const favoriteEmbeddings: number[][] = [];
    
    for (const article of favoriteArticles) {
      if (article.embedding) {
        favoriteEmbeddings.push(article.embedding);
      } else {
        const embedding = await embedArticle(article);
        if (embedding) {
          favoriteEmbeddings.push(embedding);
          article.embedding = embedding;
        }
      }
    }

    if (favoriteEmbeddings.length === 0) {
      return [];
    }

    // Calculate average embedding of favorites
    const targetEmbedding = averageEmbeddings(favoriteEmbeddings);
    if (!targetEmbedding) {
      return [];
    }

    // Calculate similarity for each candidate
    const scoredCandidates: Array<{ article: T; similarity: number }> = [];

    for (const article of candidateArticles) {
      let embedding = article.embedding;
      
      if (!embedding) {
        const newEmbedding = await embedArticle(article);
        if (newEmbedding) {
          embedding = newEmbedding;
          article.embedding = newEmbedding;
        }
      }

      if (embedding) {
        const similarity = cosineSimilarity(targetEmbedding, embedding);
        scoredCandidates.push({ article, similarity });
      }
    }

    // Sort by similarity and return top K
    return scoredCandidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(({ article }) => article);
  } catch (error) {
    console.error("Failed to find similar articles:", error);
    return [];
  }
}

// Fallback: Simple keyword-based recommendations (if embeddings fail)
export function findSimilarArticlesKeywordBased<T extends { title: string; summary?: string }>(
  favoriteArticles: T[],
  candidateArticles: T[],
  topK: number = 5
): T[] {
  // Extract keywords from favorites
  const favoriteKeywords = favoriteArticles
    .flatMap((article) => {
      const text = `${article.title} ${article.summary || ""}`.toLowerCase();
      return text.split(/\W+/).filter((word) => word.length > 4);
    })
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Score candidates
  const scoredCandidates = candidateArticles.map((article) => {
    const text = `${article.title} ${article.summary || ""}`.toLowerCase();
    const words = text.split(/\W+/);
    const score = words.reduce((sum, word) => sum + (favoriteKeywords[word] || 0), 0);
    return { article, score };
  });

  // Return top K
  return scoredCandidates
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ article }) => article);
}

