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

function fallbackSummary(text: string): string {
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
  if (summaryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = summaryCache.keys().next().value as string | undefined;
    if (oldestKey) {
      summaryCache.delete(oldestKey);
    }
  }

  summaryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function summarize(text: string, hint?: string): Promise<string> {
  const trimmed = (text || "").trim();
  if (trimmed.length === 0) {
    return "";
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const cacheKey = makeCacheKey(trimmed, hint, model, Boolean(apiKey));
  const cached = getCachedSummary(cacheKey);
  if (cached) {
    return cached;
  }

  if (trimmed.length < 40 || !apiKey) {
    const summary = fallbackSummary(trimmed);
    setCachedSummary(cacheKey, summary);
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
    const summary = clampLength(output && output.length > 0 ? output : fallbackSummary(trimmed), FALLBACK_CHAR_LIMIT);
    setCachedSummary(cacheKey, summary);
    return summary;
  } catch {
    const summary = fallbackSummary(trimmed);
    setCachedSummary(cacheKey, summary);
    return summary;
  }
}

export const __cache__ = {
  _store: summaryCache,
  clear: () => summaryCache.clear(),
};
