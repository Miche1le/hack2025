export interface Article {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  source: string;
  summary?: string;
  feedUrl?: string;
  contentSnippet?: string;
  content?: string;
  searchScore?: number;
  embedding?: number[];
}

export interface FeedMetadata {
  hubUrls: string[];
  selfUrl?: string;
  topicUrl?: string;
}

export interface JsonFeedItem {
  id: string;
  url: string;
  title: string;
  summary?: string;
  content_html?: string;
  date_published?: string;
  external_url?: string;
  authors?: Array<{ name: string }>;
  tags?: string[];
}

export interface JsonFeedResponse {
  version: string;
  title: string;
  home_page_url?: string;
  feed_url: string;
  description?: string;
  items: JsonFeedItem[];
}


export interface FetchResponseItem {
  id: string;
  title: string;
  link: string;
  source: string;
  published: string;
  summary: string;
}

export interface FetchResponse {
  items?: FetchResponseItem[];
  warnings?: string[];
  error?: string;
}

export interface FetchRequestBody {
  feeds: string[];
  query?: string;
  interval?: number;
}

export interface SummarizerConfig {
  apiKey?: string;
  model?: string;
  cacheTtlMs?: number;
  fallbackCharLimit?: number;
  baseUrl?: string;
}
