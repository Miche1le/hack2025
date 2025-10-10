import type { SummarizerConfig } from "@/types";

const DEFAULT_MODEL = "llama3.1:8b-instruct";
const FALLBACK_CHAR_LIMIT = 420;
const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const MAX_CACHE_ENTRIES = 500;
const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const OLLAMA_HEADERS = {
  "content-type": "application/json",
  accept: "application/json",
};

type CacheEntry = {
  value: string;
  expiresAt: number;
};

class LocalSummarizer {
  private cache = new Map<string, CacheEntry>();
  private config: SummarizerConfig;

  constructor(config: SummarizerConfig = {}) {
    this.config = {
      model: DEFAULT_MODEL,
      cacheTtlMs: DEFAULT_CACHE_TTL_MS,
      fallbackCharLimit: FALLBACK_CHAR_LIMIT,
      ...config,
    };
  }

  private stripHtmlTags(html: string): string {
    if (!html) return "";
    
    return html
      // Удаляем скрипты и стили полностью
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      // Заменяем блочные элементы на пробелы перед удалением тегов
      .replace(/<\/?(?:div|p|h[1-6]|li|br|hr)[^>]*>/gi, " ")
      // Удаляем остальные HTML теги
      .replace(/<[^>]*>/g, "")
      // Декодируем HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Нормализуем пробелы
      .replace(/\s+/g, " ")
      .trim();
  }

  private clampLength(value: string, max: number): string {
    return value && value.length > max
      ? value.slice(0, max - 1).trimEnd() + "..."
      : value;
  }

  private fallbackSummary(text: string): string {
    // Очищаем HTML теги перед обработкой
    const cleanText = this.stripHtmlTags(text || "");
    const sentences = cleanText
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join(" ");
    const fallback = sentences || cleanText;
    return this.clampLength(fallback, this.config.fallbackCharLimit!);
  }

  private makeCacheKey(
    text: string,
    hint: string | undefined,
    model: string | undefined,
    apiEnabled: boolean,
    baseUrl?: string,
  ): string {
    const mode = apiEnabled ? (model ?? DEFAULT_MODEL) : "fallback";
    const endpoint = baseUrl ?? "default";
    return `${mode}::${endpoint}::${hint ?? ""}::${text}`;
  }

  private resolveModel(): string {
    return (
      this.config.model ||
      process.env.OLLAMA_MODEL ||
      process.env.OPENAI_MODEL ||
      DEFAULT_MODEL
    );
  }

  private resolveBaseUrl(): string | undefined {
    const sources = [
      this.config.baseUrl,
      process.env.OLLAMA_BASE_URL,
      process.env.OPENAI_BASE_URL,
    ];
    for (const candidate of sources) {
      const value = candidate?.trim();
      if (value) {
        return value;
      }
    }
    return DEFAULT_BASE_URL;
  }

  private getCachedSummary(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  private setCachedSummary(key: string, value: string): void {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.config.cacheTtlMs!,
    });
  }

  async summarize(text: string, hint?: string): Promise<string> {
    // Очищаем HTML теги перед обработкой
    const cleanText = this.stripHtmlTags(text || "").trim();
    if (cleanText.length === 0) {
      return "";
    }

    const apiKey = this.config.apiKey ?? process.env.OPENAI_API_KEY;
    const model = this.resolveModel();
    const baseUrl = this.resolveBaseUrl();
    const cacheKey = this.makeCacheKey(
      cleanText,
      hint,
      model,
      Boolean(apiKey),
      baseUrl,
    );
    const cached = this.getCachedSummary(cacheKey);
    if (cached) {
      return cached;
    }

    if (cleanText.length < 40) {
      const summary = this.fallbackSummary(cleanText);
      this.setCachedSummary(cacheKey, summary);
      return summary;
    }

    try {
      const prompt =
        `Суммаризируй текст максимум в 3 коротких предложения (до ~360 символов), без лишних деталей.` +
        `${hint ? ` Контекст: ${hint}.` : ""}\n\nТекст:\n${cleanText}`;

      const response = await fetch(
        `${baseUrl?.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            ...OLLAMA_HEADERS,
            ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: "Ты краткий и фактический новостной редактор.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 220,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Summarizer request failed: ${response.status}`);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const output = json.choices?.[0]?.message?.content?.trim();
      const summary = this.clampLength(
        output && output.length > 0 ? output : this.fallbackSummary(cleanText),
        this.config.fallbackCharLimit!,
      );
      this.setCachedSummary(cacheKey, summary);
      return summary;
    } catch {
      const summary = this.fallbackSummary(cleanText);
      this.setCachedSummary(cacheKey, summary);
      return summary;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Создаем глобальный экземпляр суммаризатора
const summarizer = new LocalSummarizer({
  apiKey: process.env.OLLAMA_API_KEY || process.env.OPENAI_API_KEY,
  model: process.env.OLLAMA_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL,
  cacheTtlMs: Number(process.env.SUMMARY_CACHE_TTL_MS) || DEFAULT_CACHE_TTL_MS,
  baseUrl:
    process.env.OLLAMA_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    DEFAULT_BASE_URL,
});

export { LocalSummarizer, summarizer };
export default summarizer;
