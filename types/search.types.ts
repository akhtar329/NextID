export interface SearchParams {
  query: string;
  page: number;
  limit: number;
  type?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  type: 'admission' | 'university' | 'program' | 'news' | 'result';
  slug: string;
  excerpt: string;
  image?: string;
  date?: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
}