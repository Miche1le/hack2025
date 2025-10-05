export interface AggregatedItemInput {
  title: string;
  link?: string;
  source: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
}

export interface FetchRequestBody {
  feeds: string[];
  query?: string;
  interval?: number;
}

