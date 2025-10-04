import OpenAI from "openai";

/**
 * Produce a short summary made of roughly 2-3 sentences. Falls back to a
 * simple extractive summary whenever OpenAI credentials are missing or the
 * input text is too short.
 */
export async function summarize(text: string, hint?: string): Promise<string> {
  const trimmed = (text || "").trim();
  if (trimmed.length < 40 || !process.env.OPENAI_API_KEY) {
    return fallbackSummary(trimmed);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const prompt =
      `Summarize the text in 2-3 sentences (up to ~360 characters). ` +
      `Keep it concise and factual. ${hint ? `Context: ${hint}. ` : ""}` +
      `Text:\n${trimmed}`;

    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a concise news editor." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 220
    });

    const out = resp.choices[0]?.message?.content?.trim();
    return out && out.length > 0 ? clamp(out, 420) : fallbackSummary(trimmed);
  } catch {
    return fallbackSummary(trimmed);
  }
}

function fallbackSummary(text: string): string {
  const sentences = (text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
  return clamp(sentences || text, 420);
}

function clamp(s: string, max: number): string {
  return s && s.length > max ? s.slice(0, max - 1).trimEnd() + "..." : s;
}