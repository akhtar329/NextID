import { SearchRepository } from '@/repositories/search/search.repo';
import { SearchCache } from '@/cache/search/search.cache';
import { SearchParams, SearchResponse } from '@/types/search.types';

export class SearchService {
  private repo: SearchRepository;
  private cache: SearchCache;

  constructor() {
    this.repo = new SearchRepository();
    this.cache = new SearchCache();
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    // 1. Check cache
    const cached = this.cache.get(params);
    if (cached) {
      return cached;
    }

    // 2. Get from database
    const [results, total] = await Promise.all([
      this.repo.search(params),
      this.repo.getTotalCount(params.query)
    ]);

    const response: SearchResponse = {
      results,
      total,
      page: params.page,
      totalPages: Math.ceil(total / params.limit)
    };

    // 3. Store in cache
    this.cache.set(params, response);

    return response;
  }
}