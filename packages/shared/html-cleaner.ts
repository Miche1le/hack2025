// Utility function to clean HTML tags from RSS content
export function cleanHtmlTags(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
  
  // Clean up extra whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

// Enhanced function to extract clean text from RSS content
export function extractCleanContent(item: any): { snippet: string; content?: string } {
  const rawContent = item.content || item.contentSnippet || item.summary || '';
  const rawSnippet = item.contentSnippet || item.summary || item.content || '';
  
  const cleanContent = cleanHtmlTags(rawContent);
  const cleanSnippet = cleanHtmlTags(rawSnippet);
  
  return {
    snippet: cleanSnippet,
    content: cleanContent && cleanContent.length > 0 ? cleanContent : undefined
  };
}
