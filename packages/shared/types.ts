export interface FetchRequestBody {
  feeds: string[];
  query?: string;
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
  items: FetchResponseItem[];
  warnings?: string[];
  error?: string;
}

export interface AggregatedItemInput {
  title: string;
  link: string;
  source: string;
  published: string;
  contentSnippet?: string;
  content?: string;
}

export interface AggregatedItem extends AggregatedItemInput {
  id: string;
  summary: string;
}
