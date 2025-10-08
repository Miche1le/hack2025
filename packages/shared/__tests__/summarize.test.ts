import { describe, expect, it, beforeEach } from 'vitest';
import { 
  summarize, 
  __cache__, 
  getSummaryQuality, 
  extractSummaryKeywords, 
  isSummaryCached 
} from '../summarize';

describe('summarize', () => {
  beforeEach(() => {
    __cache__.clear();
  });

  it('returns empty string for empty input', async () => {
    const result = await summarize('');
    expect(result).toBe('');
  });

  it('returns empty string for whitespace-only input', async () => {
    const result = await summarize('   \n\t   ');
    expect(result).toBe('');
  });

  it('uses fallback summarization for short text', async () => {
    const shortText = 'This is a short article about technology.';
    const result = await summarize(shortText);
    expect(result).toBe(shortText);
  });

  it('uses advanced fallback for longer text without API key', async () => {
    const longText = `
      Artificial intelligence is transforming the way we work and live. 
      Companies are investing billions in AI research and development. 
      Machine learning algorithms can now process vast amounts of data. 
      The future of work will be heavily influenced by AI technologies. 
      However, there are concerns about job displacement and ethical implications.
    `.trim();
    
    const result = await summarize(longText);
    expect(result).toBeTruthy();
    expect(result.length).toBeLessThanOrEqual(420);
    expect(result.length).toBeGreaterThan(50);
  });

  it('caches results correctly', async () => {
    const text = 'This is a test article for caching.';
    const hint = 'test';
    
    // Первый вызов
    const result1 = await summarize(text, hint);
    expect(result1).toBeTruthy();
    
    // Проверяем, что результат закэширован
    expect(isSummaryCached(text, hint)).toBe(true);
    
    // Второй вызов должен вернуть тот же результат
    const result2 = await summarize(text, hint);
    expect(result2).toBe(result1);
  });

  it('handles cache expiration', async () => {
    const text = 'Test article for cache expiration.';
    
    // Создаем запись в кэше с истекшим временем
    const expiredTime = Date.now() - 1000;
    __cache__._store.set('test-key', {
      value: 'cached summary',
      expiresAt: expiredTime
    });
    
    // Очищаем истекшие записи
    __cache__.cleanup();
    
    // Проверяем, что истекшая запись удалена
    expect(__cache__._store.has('test-key')).toBe(false);
  });
});

describe('getSummaryQuality', () => {
  it('returns high quality for good compression', () => {
    const text = 'A'.repeat(200);
    const summary = 'A'.repeat(50);
    expect(getSummaryQuality(text, summary)).toBe('high');
  });

  it('returns medium quality for moderate compression', () => {
    const text = 'A'.repeat(200);
    const summary = 'A'.repeat(100);
    expect(getSummaryQuality(text, summary)).toBe('medium');
  });

  it('returns low quality for poor compression', () => {
    const text = 'A'.repeat(200);
    const summary = 'A'.repeat(150);
    expect(getSummaryQuality(text, summary)).toBe('low');
  });
});

describe('extractSummaryKeywords', () => {
  it('extracts meaningful keywords', () => {
    const summary = 'Artificial intelligence is revolutionizing technology and business processes.';
    const keywords = extractSummaryKeywords(summary);
    expect(keywords).toContain('artificial');
    expect(keywords).toContain('intelligence');
    expect(keywords).toContain('technology');
    expect(keywords).toContain('business');
    expect(keywords).toContain('processes');
  });

  it('filters out stop words', () => {
    const summary = 'The artificial intelligence is revolutionizing the technology.';
    const keywords = extractSummaryKeywords(summary);
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('is');
  });

  it('limits keywords to reasonable number', () => {
    const summary = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z artificial intelligence technology business processes machine learning data science';
    const keywords = extractSummaryKeywords(summary);
    expect(keywords.length).toBeLessThanOrEqual(10);
  });
});

describe('cache management', () => {
  beforeEach(() => {
    __cache__.clear();
  });

  it('provides cache statistics', () => {
    const stats = __cache__.stats();
    expect(stats.total).toBe(0);
    expect(stats.expired).toBe(0);
    expect(stats.active).toBe(0);
    expect(stats.maxEntries).toBe(500);
    expect(stats.ttlMs).toBe(30 * 60 * 1000);
  });

  it('tracks cache size correctly', () => {
    expect(__cache__.size()).toBe(0);
    
    // Добавляем тестовую запись
    __cache__._store.set('test', {
      value: 'test summary',
      expiresAt: Date.now() + 1000
    });
    
    expect(__cache__.size()).toBe(1);
  });
});
