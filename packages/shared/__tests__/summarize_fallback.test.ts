import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { summarize } from '../summarize';

const ORIGINAL_KEY = process.env.OPENAI_API_KEY;

describe('summarize fallback', () => {
  beforeAll(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterAll(() => {
    if (ORIGINAL_KEY) {
      process.env.OPENAI_API_KEY = ORIGINAL_KEY;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });

  it('uses extractive summary when no API key is present', async () => {
    const text = [
      'Первое предложение описывает событие.',
      'Второе предложение добавляет детали!',
      'Третье предложение завершает картину?',
      'Четвёртое предложение останется за пределами сводки.',
    ].join(' ');

    const summary = await summarize(text);
    expect(summary).toBe(
      'Первое предложение описывает событие. Второе предложение добавляет детали! Третье предложение завершает картину?',
    );
  });

  it('trims excessive whitespace and newlines before building a fallback summary', async () => {
    const text = '  Первая строка описания...\n\n    Вторая строка уточняет детали.  ';

    const summary = await summarize(text);
    expect(summary).toBe('Первая строка описания... Вторая строка уточняет детали.');
  });

  it('limits fallback summary length and sentences', async () => {
    const longSentence =
      'Это длинное предложение описывает контекст события с большим количеством деталей и пояснений, ' +
      'чтобы проверить корректную работу механизма усечения при генерации fallback-сводки.';
    const text = Array.from({ length: 4 }, (_, index) => `${longSentence} ${index + 1}.`).join(' ');

    const summary = await summarize(text);

    expect(summary.length).toBeLessThanOrEqual(420);
    expect(summary.includes('4.')).toBe(false);
    const sentenceEndings = summary.match(/[.!?]/g) ?? [];
    expect(sentenceEndings.length).toBeLessThanOrEqual(3);
  });
});
