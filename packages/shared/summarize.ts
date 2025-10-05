import { OpenAI } from 'openai';

const MAX_SUMMARY_LENGTH = 420;
const MAX_SENTENCES = 3;

let cachedClient: OpenAI | null = null;

function getClient(apiKey: string): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

function truncateSummary(text: string): string {
  if (text.length <= MAX_SUMMARY_LENGTH) {
    return text.trim();
  }

  const truncated = text.slice(0, MAX_SUMMARY_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  const safeSlice = lastSpace > MAX_SUMMARY_LENGTH * 0.6 ? truncated.slice(0, lastSpace) : truncated;
  return `${safeSlice.trim()}…`;
}

function extractSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [];
  }

  const sentenceMatches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!sentenceMatches) {
    return [normalized];
  }

  return sentenceMatches.map((segment) => segment.trim());
}

function fallbackSummarize(text: string): string {
  const sentences = extractSentences(text);
  if (sentences.length === 0) {
    return '';
  }

  const availableCount = sentences.length >= 2 ? Math.min(MAX_SENTENCES, sentences.length) : 1;
  const summary = sentences.slice(0, availableCount).join(' ');
  return truncateSummary(summary);
}

function buildPrompt(text: string, hint?: string): string {
  const lines = [
    'Summarize the following news item in Russian using 2-3 concise sentences (≤420 characters).',
    'Focus on key facts and avoid filler language.',
  ];

  if (hint) {
    lines.push(`Contextual hint: ${hint}`);
  }

  lines.push(`\nArticle:\n${text.trim()}`);
  return lines.join('\n');
}

export async function summarize(text: string, hint?: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const client = getClient(apiKey);
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const response = await client.chat.completions.create({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'Ты — помощник-редактор новостей. Делаешь лаконичные, информативные резюме на русском языке. Используй 2-3 предложения и не превышай 420 символов.',
          },
          {
            role: 'user',
            content: buildPrompt(trimmed, hint),
          },
        ],
      });

      const summary = response.choices?.[0]?.message?.content?.trim();
      if (summary) {
        return truncateSummary(summary);
      }
    } catch (error) {
      console.warn('LLM summarization failed, falling back to extractive summary.', error);
    }
  }

  return fallbackSummarize(trimmed);
}

export const __private__ = {
  extractSentences,
  fallbackSummarize,
  truncateSummary,
};
