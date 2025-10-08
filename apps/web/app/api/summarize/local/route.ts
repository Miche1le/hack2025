import { NextRequest, NextResponse } from 'next/server';

interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    max_tokens?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export async function POST(request: NextRequest) {
  let text = '';
  
  try {
    const body = await request.json();
    text = body.text;
    const hint = body.hint;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const localSummaryUrl = process.env.LOCAL_SUMMARY_URL;
    const ollamaModel = process.env.OLLAMA_MODEL || 'mistral:7b-instruct';
    
    if (!localSummaryUrl) {
      return NextResponse.json(
        { error: 'Local summary service not configured' },
        { status: 503 }
      );
    }

    // Формируем промпт для локальной LLM
    const prompt = `Summarize the following text in 2-3 sentences (up to ~360 characters). Keep it concise and factual. ${hint ? `Context: ${hint}. ` : ''}Text:\n${text}`;

    const ollamaRequest: OllamaRequest = {
      model: ollamaModel,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        max_tokens: 220
      }
    };

    const response = await fetch(localSummaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaRequest),
      // Таймаут для локальной LLM может быть больше
      signal: AbortSignal.timeout(30000) // 30 секунд
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();
    
    if (!data.response) {
      throw new Error('No response from Ollama');
    }

    // Очищаем ответ от лишних символов
    const summary = data.response.trim();
    
    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Local summarization error:', error);
    
    // Возвращаем fallback суммаризацию
    const fallbackSummary = await generateFallbackSummary(text);
    
    return NextResponse.json({ 
      summary: fallbackSummary,
      fallback: true 
    });
  }
}

async function generateFallbackSummary(text: string): Promise<string> {
  // Простая экстрактивная суммаризация
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 10)
    .slice(0, 3)
    .join(' ');
  
  return sentences || text.slice(0, 420);
}
