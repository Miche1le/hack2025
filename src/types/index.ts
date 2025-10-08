export interface Article {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  source?: string;
  summary?: string;
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
}
