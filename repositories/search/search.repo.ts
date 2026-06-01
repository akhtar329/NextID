import { db } from '@/db/db';
import { sql } from 'drizzle-orm';
import { SearchParams, SearchResult } from '@/types/search.types';

export class SearchRepository {
  async search(params: SearchParams): Promise<SearchResult[]> {
    const { query, page, limit } = params;
    const offset = (page - 1) * limit;
    
    const results = await db.execute(sql`
      SELECT 
        id,
        title,
        'admission' as type,
        slug,
        description as excerpt,
        NULL as image
      FROM admissions
      WHERE title ILIKE ${`%${query}%`}
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    // ✅ Properly typed mapping without 'any'
    const mappedResults: SearchResult[] = results.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      type: 'admission' as const, // Fixed type literal
      slug: String(row.slug),
      excerpt: String(row.excerpt),
      image: row.image ? String(row.image) : undefined,
    }));
    
    return mappedResults;
  }

  async getTotalCount(query: string): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM admissions
      WHERE title ILIKE ${`%${query}%`}
    `);
    
    const total = result.rows[0] as { total: string | number };
    return Number(total?.total || 0);
  }
}