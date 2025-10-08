import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";
const FALLBACK_CHAR_LIMIT = 420;
const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_ENV = Number(process.env.SUMMARY_CACHE_TTL_MS ?? "");
const CACHE_TTL_MS = Number.isFinite(CACHE_TTL_ENV) && CACHE_TTL_ENV > 0 ? CACHE_TTL_ENV : 30 * 60 * 1000;

type CacheEntry = {
  value: string;
  expiresAt: number;
};

const summaryCache = new Map<string, CacheEntry>();

function clampLength(value: string, max: number): string {
  return value && value.length > max ? value.slice(0, max - 1).trimEnd() + "..." : value;
}

function extractKeywords(text: string): string[] {
  // Простое извлечение ключевых слов (слова длиннее 3 символов, не стоп-слова)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 10); // Берем топ-10 ключевых слов
}

function calculateSentenceScore(sentence: string, keywords: string[]): number {
  const words = sentence.toLowerCase().split(/\s+/);
  const keywordMatches = keywords.filter(keyword => 
    words.some(word => word.includes(keyword) || keyword.includes(word))
  ).length;
  
  // Бонус за позицию в тексте (первые предложения важнее)
  const positionBonus = 1;
  
  // Бонус за длину (не слишком короткие, не слишком длинные)
  const lengthBonus = sentence.length > 20 && sentence.length < 200 ? 1 : 0.5;
  
  return keywordMatches * 2 + positionBonus + lengthBonus;
}

function advancedFallbackSummary(text: string): string {
  if (!text || text.length < 20) {
    return text || "No summary available.";
  }

  // Нормализуем текст
  const normalizedText = text.replace(/\s+/g, " ").trim();
  
  // Извлекаем ключевые слова
  const keywords = extractKeywords(normalizedText);
  
  // Разбиваем на предложения
  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 10)
    .map(sentence => sentence.trim());

  if (sentences.length === 0) {
    return clampLength(normalizedText, FALLBACK_CHAR_LIMIT);
  }

  if (sentences.length <= 3) {
    return clampLength(sentences.join(" "), FALLBACK_CHAR_LIMIT);
  }

  // Оцениваем каждое предложение
  const scoredSentences = sentences.map(sentence => ({
    text: sentence,
    score: calculateSentenceScore(sentence, keywords)
  }));

  // Сортируем по оценке и берем топ-3
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.text);

  // Восстанавливаем порядок предложений как в оригинале
  const orderedSentences = sentences.filter(sentence => 
    topSentences.includes(sentence)
  );

  const summary = orderedSentences.join(" ");
  return clampLength(summary, FALLBACK_CHAR_LIMIT);
}

function fallbackSummary(text: string): string {
  // Используем улучшенный алгоритм для длинных текстов
  if (text.length > 100) {
    return advancedFallbackSummary(text);
  }
  
  // Для коротких текстов используем простой подход
  const sentences = (text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
  const fallback = sentences || text;
  return clampLength(fallback, FALLBACK_CHAR_LIMIT);
}

function makeCacheKey(text: string, hint: string | undefined, model: string | undefined, apiEnabled: boolean): string {
  const mode = apiEnabled ? model ?? DEFAULT_MODEL : "fallback";
  return `${mode}::${hint ?? ""}::${text}`;
}

function getCachedSummary(key: string): string | null {
  const entry = summaryCache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    summaryCache.delete(key);
    return null;
  }

  return entry.value;
}

function setCachedSummary(key: string, value: string): void {
  // LRU стратегия: удаляем самые старые записи при достижении лимита
  if (summaryCache.size >= MAX_CACHE_ENTRIES) {
    const entries = Array.from(summaryCache.entries());
    // Сортируем по времени истечения (самые старые первыми)
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    // Удаляем 10% самых старых записей
    const toDelete = Math.floor(MAX_CACHE_ENTRIES * 0.1);
    for (let i = 0; i < toDelete; i++) {
      summaryCache.delete(entries[i][0]);
    }
  }

  summaryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function summarizeWithLocalLLM(text: string, hint?: string): Promise<string> {
  const localSummaryUrl = process.env.LOCAL_SUMMARY_URL;
  
  if (!localSummaryUrl) {
    throw new Error('Local summary service not configured');
  }

  try {
    const response = await fetch(localSummaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, hint }),
      signal: AbortSignal.timeout(30000) // 30 секунд для локальной LLM
    });

    if (!response.ok) {
      throw new Error(`Local LLM error: ${response.status}`);
    }

    const data = await response.json();
    return data.summary || fallbackSummary(text);
  } catch (error) {
    console.warn('Local LLM error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function summarize(text: string, hint?: string): Promise<string> {
  const trimmed = (text || "").trim();
  if (trimmed.length === 0) {
    return "";
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const useLocalOnly = process.env.USE_LOCAL_ONLY === 'true';
  const cacheKey = makeCacheKey(trimmed, hint, model, Boolean(apiKey) && !useLocalOnly);
  const cached = getCachedSummary(cacheKey);
  if (cached) {
    return cached;
  }

  if (trimmed.length < 40) {
    const summary = fallbackSummary(trimmed);
    setCachedSummary(cacheKey, summary);
    return summary;
  }

  // Пробуем локальную LLM если настроена
  if (useLocalOnly || process.env.LOCAL_SUMMARY_URL) {
    try {
      const summary = await summarizeWithLocalLLM(trimmed, hint);
      const clampedSummary = clampLength(summary, FALLBACK_CHAR_LIMIT);
      setCachedSummary(cacheKey, clampedSummary);
      return clampedSummary;
    } catch (error) {
      console.warn('Local LLM failed, falling back to OpenAI or extractive summary');
    }
  }

  // Fallback на OpenAI если доступен
  if (apiKey && !useLocalOnly) {
    try {
      const client = new OpenAI({ 
        apiKey,
        timeout: 10000, // 10 секунд таймаут
      });
      const prompt =
        `Summarize the text in 2-3 sentences (up to ~360 characters). ` +
        `Keep it concise and factual. ${hint ? `Context: ${hint}. ` : ""}` +
        `Text:\n${trimmed}`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "You are a concise news editor." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 220
      });

      const output = response.choices[0]?.message?.content?.trim();
      const summary = clampLength(output && output.length > 0 ? output : fallbackSummary(trimmed), FALLBACK_CHAR_LIMIT);
      setCachedSummary(cacheKey, summary);
      return summary;
    } catch (error) {
      console.warn('OpenAI API error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Финальный fallback на экстрактивную суммаризацию
  const summary = fallbackSummary(trimmed);
  setCachedSummary(cacheKey, summary);
  return summary;
}

export const __cache__ = {
  _store: summaryCache,
  clear: () => summaryCache.clear(),
  size: () => summaryCache.size,
  stats: () => {
    const entries = Array.from(summaryCache.values());
    const now = Date.now();
    const expired = entries.filter(entry => entry.expiresAt <= now).length;
    return {
      total: summaryCache.size,
      expired,
      active: summaryCache.size - expired,
      maxEntries: MAX_CACHE_ENTRIES,
      ttlMs: CACHE_TTL_MS
    };
  },
  cleanup: () => {
    const now = Date.now();
    for (const [key, entry] of summaryCache.entries()) {
      if (entry.expiresAt <= now) {
        summaryCache.delete(key);
      }
    }
  }
};

// Дополнительные функции для работы с суммаризацией
export function getSummaryQuality(text: string, summary: string): 'high' | 'medium' | 'low' {
  const compressionRatio = summary.length / text.length;
  
  if (compressionRatio < 0.3 && summary.length > 50) {
    return 'high';
  } else if (compressionRatio < 0.6 && summary.length > 30) {
    return 'medium';
  } else {
    return 'low';
  }
}

export function extractSummaryKeywords(summary: string): string[] {
  return extractKeywords(summary);
}

export function isSummaryCached(text: string, hint?: string): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const cacheKey = makeCacheKey(text.trim(), hint, model, Boolean(apiKey));
  return getCachedSummary(cacheKey) !== null;
}
