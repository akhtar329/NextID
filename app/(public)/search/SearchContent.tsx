// app/api/public/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import { cacheTag, cacheLife } from 'next/cache';

const ITEMS_PER_PAGE = 20;

async function getAllSearchablePosts(): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("search-all-posts");
  cacheLife("hours");
  
  try {
    const types = ['admission', 'job', 'scholarship', 'result', 'news', 'date_sheet', 'blog'] as const;
    
    const results = await Promise.all(
      types.map(type => postService.getList(type, 1000))
    );
    
    const allPosts = results.flat();
    return allPosts;
  } catch (error) {
    console.error('Error fetching searchable posts:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString());
    
    if (!query) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    }
    
    // Get all posts from cache
    const allPosts = await getAllSearchablePosts();
    
    // Filter by search query (title)
    const filtered = allPosts.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase())
    );
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedResults = filtered.slice(start, start + limit);
    
    const results = paginatedResults.map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      type: item.type,
      excerpt: item.excerpt,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      meta: item.meta,
    }));
    
    return NextResponse.json({
      success: true,
      data: results,
      total,
      page,
      totalPages,
      limit
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: [], total: 0, page: 1, totalPages: 0 },
      { status: 500 }
    );
  }
}