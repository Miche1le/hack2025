import OpenAI from "openai";
import type { SummarizerConfig } from "@/types";

const DEFAULT_MODEL = "gpt-4o-mini";
const FALLBACK_CHAR_LIMIT = 420;
const MAX_CACHE_ENTRIES = 500;
const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

  private clampLength(value: string, max: number): string {
    return value && value.length > max ? value.slice(0, max - 1).trimEnd() + "..." : value;
  }

  private fallbackSummary(text: string): string {
    const sentences = (text || "")
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join(" ");
    const fallback = sentences || text;
    return this.clampLength(fallback, this.config.fallbackCharLimit!);
  }

  private makeCacheKey(text: string, hint: string | undefined, model: string | undefined, apiEnabled: boolean): string {
    const mode = apiEnabled ? model ?? DEFAULT_MODEL : "fallback";
    return `${mode}::${hint ?? ""}::${text}`;
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
      expiresAt: Date.now() + this.config.cacheTtlMs! 
    });
  }

  async summarize(text: string, hint?: string): Promise<string> {
    const trimmed = (text || "").trim();
    if (trimmed.length === 0) {
      return "";
    }

    const apiKey = this.config.apiKey;
    const model = this.config.model || DEFAULT_MODEL;
    const cacheKey = this.makeCacheKey(trimmed, hint, model, Boolean(apiKey));
    const cached = this.getCachedSummary(cacheKey);
    if (cached) {
      return cached;
    }

    if (trimmed.length < 40 || !apiKey) {
      const summary = this.fallbackSummary(trimmed);
      this.setCachedSummary(cacheKey, summary);
      return summary;
    }

    try {
      const client = new OpenAI({ apiKey });
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
      const summary = this.clampLength(
        output && output.length > 0 ? output : this.fallbackSummary(trimmed), 
        this.config.fallbackCharLimit!
      );
      this.setCachedSummary(cacheKey, summary);
      return summary;
    } catch {
      const summary = this.fallbackSummary(trimmed);
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
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
  cacheTtlMs: Number(process.env.SUMMARY_CACHE_TTL_MS) || DEFAULT_CACHE_TTL_MS,
});

export { LocalSummarizer, summarizer };
export default summarizer;
