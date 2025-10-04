import { Configuration, OpenAIApi } from 'openai';

/**
 * Summarize a block of text into a given number of sentences. When no API key
 * is provided via `OPENAI_API_KEY`, a simple extractive summarizer is used
 * which returns the first sentences from the text. This fallback ensures the
 * service always produces a short summary even in development or demo mode.
 *
 * @param text      The full text to summarize.
 * @param sentences The desired number of sentences in the summary.
 */
export async function summarize(text: string, sentences: number = 3): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  // Fallback summarization: grab the first n sentences
  const fallback = () => {
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const parts = text.match(sentenceRegex) || [];
    return parts.slice(0, sentences).join(' ').trim();
  };
  if (!apiKey) {
    return fallback();
  }
  try {
    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);
    const prompt = `Summarize the following text in ${sentences} sentences:\n\n${text}`;
    const response = await openai.createCompletion({
      model: 'gpt-5-nano',
      prompt,
      max_tokens: 256,
      temperature: 0.5
    });
    const summary = response?.data?.choices?.[0]?.text?.trim();
    return summary && summary.length > 0 ? summary : fallback();
  } catch (error) {
    console.error('Error summarizing via OpenAI:', error);
    return fallback();
  }
}
