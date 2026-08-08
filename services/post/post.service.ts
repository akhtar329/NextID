// services/post/post.service.ts

import { revalidateTag } from "next/cache";
import { postRepository } from "@/repositories/post/post.repository";
import type { Post } from "@/types/post";
import { cacheTag, cacheLife } from "next/cache";

type PostType = "result" | "admission" | "news" | "date_sheet" | "scholarship" | "blog" | "job";

// ============ TYPES ============
export interface ExtendedPost extends Post {
  actualImage: string | null;
  meta: Record<string, unknown> | null;
}

// ============ HELPER FUNCTIONS ============
function normalizeImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/uploads/${url}`;
}

function mapPost(post: Post): ExtendedPost {
  return {
    ...post,
    featuredImage: normalizeImage(post.featuredImage),
    actualImage: normalizeImage(post.featuredImage),
    meta: post.meta || null,
  };
}

// ============ TYPE SAFETY HELPERS ============

function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key];
  return (value !== undefined && value !== null) ? value as T : defaultValue;
}

function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function safeLower(value: unknown): string {
  return safeString(value).toLowerCase();
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function safeArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [];
}

// ============ CACHED DATE UTILITIES ============

export async function getCurrentYear(): Promise<string> {
  "use cache";
  cacheTag("current-year");
  cacheLife({ revalidate: 31536000 });
  return new Date().getFullYear().toString();
}

export async function getCurrentDate(): Promise<Date> {
  "use cache";
  cacheTag("current-date");
  cacheLife({ revalidate: 3600 });
  return new Date();
}

export async function getDaysLeft(deadline: Date | string | null): Promise<number | null> {
  "use cache";
  const deadlineKey = deadline instanceof Date ? deadline.toISOString() : 
                     typeof deadline === 'string' ? deadline : 'null';
  cacheTag(`days-left-${deadlineKey}`);
  cacheLife({ revalidate: 3600 });
  
  if (!deadline) return null;
  
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

export async function isDeadlineNear(deadline: Date | string | null, daysThreshold: number = 7): Promise<boolean> {
  "use cache";
  const deadlineKey = deadline instanceof Date ? deadline.toISOString() : 
                     typeof deadline === 'string' ? deadline : 'null';
  cacheTag(`deadline-near-${deadlineKey}-${daysThreshold}`);
  cacheLife({ revalidate: 3600 });
  
  if (!deadline) return false;
  
  const daysLeft = await getDaysLeft(deadline);
  return daysLeft !== null && daysLeft <= daysThreshold && daysLeft > 0;
}

export async function isDeadlinePassed(deadline: Date | string | null): Promise<boolean> {
  "use cache";
  const deadlineKey = deadline instanceof Date ? deadline.toISOString() : 
                     typeof deadline === 'string' ? deadline : 'null';
  cacheTag(`deadline-passed-${deadlineKey}`);
  cacheLife({ revalidate: 3600 });
  
  if (!deadline) return false;
  
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const today = new Date();
  return deadlineDate < today;
}

export async function formatShortDate(date: Date | string | null): Promise<string> {
  "use cache";
  const dateKey = date instanceof Date ? date.toISOString() : 
                  typeof date === 'string' ? date : 'null';
  cacheTag(`short-date-${dateKey}`);
  cacheLife({ revalidate: 3600 });
  
  if (!date) return 'TBA';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export async function formatLongDate(date: Date | string | null): Promise<string> {
  "use cache";
  const dateKey = date instanceof Date ? date.toISOString() : 
                  typeof date === 'string' ? date : 'null';
  cacheTag(`long-date-${dateKey}`);
  cacheLife({ revalidate: 3600 });
  
  if (!date) return 'TBA';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export async function isOpen(deadline: Date | string | null): Promise<boolean> {
  "use cache";
  const deadlineKey = deadline instanceof Date ? deadline.toISOString() : 
                     typeof deadline === 'string' ? deadline : 'null';
  cacheTag(`is-open-${deadlineKey}`);
  cacheLife({ revalidate: 3600 });
  
  const passed = await isDeadlinePassed(deadline);
  return !passed;
}

// ============ INTERNAL CACHED FUNCTIONS ============

// ----- Generic -----
async function getListInternal(
  type: PostType | 'all',
  limit: number = 10,
  offset: number = 0,
  filters?: { featured?: boolean; popular?: boolean; breaking?: boolean }
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag(`list-${type}`);
  cacheTag("posts");
  cacheTag(`posts-type-${type}`);
  cacheTag("homepage");
  cacheLife("days");
  
  const posts = await postRepository.getList(type, limit, offset, filters);
  return posts.map(mapPost);
}

async function getDetailInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag(`detail-${slug}`);
  cacheTag(`post-${slug}`);
  cacheTag("posts");
  cacheLife("days");
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getRelatedInternal(
  currentId: number,
  type: PostType,
  limit: number = 5
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag(`related-${currentId}-${type}`);
  cacheTag(`post-related-${type}`);
  cacheTag(`posts-type-${type}`);
  cacheLife("days");
  
  const posts = await postRepository.getRelated(currentId, type, limit);
  return posts.map(mapPost);
}

async function getTotalCountInternal(type: PostType | 'all'): Promise<number> {
  "use cache";
  cacheTag(`count-${type}`);
  cacheTag(`posts-type-${type}`);
  cacheLife("days");
  
  return await postRepository.getTotalCount(type);
}

// ----- Admission -----
async function getAdmissionBySlugInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-admission");
  cacheTag(`admission-[slug]`);
  cacheTag(`admission-detail-${slug}`);
  cacheTag(`admission-${slug}`);
  cacheLife("days");
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getAdmissionByIdInternal(id: number): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-admission");
  cacheTag(`admission-[id]`);
  cacheTag(`admission-${id}`);
  cacheLife("days");
  
  const post = await postRepository.getById(id);
  return post ? mapPost(post) : null;
}

async function getAdmissionCountsInternal(): Promise<{ open: number; closed: number; total: number }> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-admission");
  cacheTag("admission-counts");
  cacheTag("admissions-metadata");
  cacheLife("hours");
  
  const all = await postRepository.getList('admission', 1000);
  const total = all.length;
  const open = all.filter(p => getMetaValue(p.meta, 'status', 'Open') === 'Open').length;
  const closed = total - open;
  return { open, closed, total };
}

// ----- Blog -----
async function getBlogsListInternal(
  limit: number = 10,
  offset: number = 0,
  filters?: { featured?: boolean; popular?: boolean }
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-blog");
  cacheTag("blogs-all");
  cacheTag("blogs-list");
  cacheTag("blogs-data");
  cacheLife("days");
  
  const posts = await postRepository.getList('blog', limit, offset, filters);
  return posts.map(mapPost);
}

async function getBlogBySlugInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-blog");
  cacheTag(`blog-[slug]`);
  cacheTag(`blog-detail-${slug}`);
  cacheTag(`blog-${slug}`);
  cacheLife("days");
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getBlogByIdInternal(id: number): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-blog");
  cacheTag(`blog-[id]`);
  cacheTag(`blog-${id}`);
  cacheLife("days");
  
  const post = await postRepository.getById(id);
  return post ? mapPost(post) : null;
}

async function getBlogStatsInternal(): Promise<{ total: number; featured: number; popular: number }> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-blog");
  cacheTag("blogs-stats");
  cacheTag("blog-categories");
  cacheLife("hours");
  
  const all = await postRepository.getList('blog', 1000);
  const total = all.length;
  const featured = all.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true).length;
  const popular = all.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true).length;
  return { total, featured, popular };
}

async function getRelatedBlogsInternal(
  currentId: number,
  category: string,
  limit: number = 3
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-blog");
  cacheTag(`blog-related-[id]`);
  cacheTag(`blog-related-${currentId}`);
  cacheTag("blog-related");
  cacheLife("days");
  
  const posts = await postRepository.getRelated(currentId, 'blog', limit);
  return posts.map(mapPost);
}

async function incrementBlogViewCountInternal(slug: string): Promise<void> {
  "use cache";
  cacheTag(`blog-${slug}`);
  cacheTag(`blog-detail-${slug}`);
  cacheLife({ revalidate: 3600 });
  
  await postRepository.incrementViewCount('blog', slug);
}

// ----- Date Sheet -----
async function getDateSheetsListInternal(
  limit: number = 10,
  offset: number = 0,
  filters?: { popular?: boolean }
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-date_sheet");
  cacheTag("date-sheets-all");
  cacheTag("date-sheets-list");
  cacheTag("date-sheets-data");
  cacheTag("date-sheets-metadata");
  cacheLife("days");
  
  const posts = await postRepository.getList('date_sheet', limit, offset, filters);
  return posts.map(mapPost);
}

async function getDateSheetBySlugInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-date_sheet");
  cacheTag(`date-sheet-[slug]`);
  cacheTag(`date-sheet-detail-${slug}`);
  cacheTag(`date-sheet-${slug}`);
  cacheLife("days");
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getDateSheetByIdInternal(id: number): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-date_sheet");
  cacheTag(`date-sheet-[id]`);
  cacheTag(`date-sheet-${id}`);
  cacheLife("days");
  
  const post = await postRepository.getById(id);
  return post ? mapPost(post) : null;
}

async function getDateSheetStatsInternal(): Promise<{ total: number; popular: number }> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-date_sheet");
  cacheTag("date-sheets-stats");
  cacheTag("date-sheet-counts");
  cacheLife("hours");
  
  const all = await postRepository.getList('date_sheet', 1000);
  const total = all.length;
  const popular = all.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true).length;
  return { total, popular };
}

async function getDateSheetsByBoardInternal(boardSlug: string, year?: number): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-date_sheet");
  cacheTag(`date-sheet-[board]-[year]`);
  cacheTag(`date-sheet-${boardSlug}`);
  if (year) cacheTag(`date-sheet-${boardSlug}-${year}`);
  cacheLife("days");
  
  const all = await postRepository.getList('date_sheet', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const board = getMetaValue(meta, 'boardSlug', '') || safeLower(getMetaValue(meta, 'boardName', '')).replace(/\s+/g, '-');
    const postYear = getMetaValue(meta, 'year', 0);
    const matchesBoard = board === boardSlug;
    const matchesYear = year ? postYear === year : true;
    return matchesBoard && matchesYear;
  });
  return filtered.map(mapPost);
}

async function getDateSheetsByYearInternal(year: number): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-date_sheet");
  cacheTag(`date-sheet-${year}`);
  cacheLife("days");
  
  const all = await postRepository.getList('date_sheet', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    return getMetaValue(meta, 'year', 0) === year;
  });
  return filtered.map(mapPost);
}

async function getDateSheetsByExamTypeInternal(examType: string): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-date_sheet");
  cacheTag(`date-sheet-${examType}`);
  cacheLife("days");
  
  const all = await postRepository.getList('date_sheet', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const type = getMetaValue(meta, 'examType', '') || getMetaValue(meta, 'type', '');
    return safeLower(type) === safeLower(examType);
  });
  return filtered.map(mapPost);
}

async function incrementDateSheetViewCountInternal(slug: string): Promise<void> {
  "use cache";
  cacheTag(`date-sheet-${slug}`);
  cacheTag(`date-sheet-detail-${slug}`);
  cacheLife({ revalidate: 3600 });
  
  await postRepository.incrementViewCount('date_sheet', slug);
}

// ----- Job -----
async function getJobsListInternal(
  limit: number = 10,
  offset: number = 0,
  filters?: { featured?: boolean; urgent?: boolean; open?: boolean }
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-job");
  cacheTag("jobs-all");
  cacheTag("jobs-list");
  cacheTag("jobs-data");
  cacheTag("jobs-metadata");
  cacheLife("days");
  
  const posts = await postRepository.getList('job', limit, offset, filters);
  return posts.map(mapPost);
}

async function getJobBySlugInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-job");
  cacheTag(`job-[slug]`);
  cacheTag(`job-detail-${slug}`);
  cacheTag(`job-${slug}`);
  cacheLife("days");
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getJobByIdInternal(id: number): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-job");
  cacheTag(`job-[id]`);
  cacheTag(`job-${id}`);
  cacheLife("days");
  
  const post = await postRepository.getById(id);
  return post ? mapPost(post) : null;
}

async function getJobStatsInternal(): Promise<{ total: number; featured: number; urgent: number; open: number }> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-job");
  cacheTag("jobs-stats");
  cacheTag("job-counts");
  cacheLife("hours");
  
  const all = await postRepository.getList('job', 1000);
  const total = all.length;
  const featured = all.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true).length;
  const urgent = all.filter(p => getMetaValue<boolean>(p.meta, 'isUrgent', false) === true).length;
  const open = all.filter(p => {
    const deadline = safeDate(getMetaValue(p.meta, 'deadline', null));
    if (!deadline) return true;
    return deadline > new Date();
  }).length;
  return { total, featured, urgent, open };
}

async function getJobsByTypeInternal(jobType: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-job");
  cacheTag(`jobs-by-type-[jobType]`);
  cacheTag(`jobs-${jobType}`);
  cacheLife("days");
  
  const all = await postRepository.getList('job', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const type = getMetaValue(meta, 'jobType', '') || getMetaValue(meta, 'type', '');
    return safeLower(type).replace(/ /g, '-') === safeLower(jobType);
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function getJobsByLocationInternal(location: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-job");
  cacheTag(`jobs-by-location-[location]`);
  cacheTag(`jobs-${location}`);
  cacheLife("days");
  
  const all = await postRepository.getList('job', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const loc = getMetaValue(meta, 'location', '') || getMetaValue(meta, 'city', '');
    return safeLower(loc).replace(/ /g, '-') === safeLower(location);
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function getJobsByCompanyInternal(company: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-job");
  cacheTag(`jobs-by-company-[company]`);
  cacheTag(`jobs-${company}`);
  cacheLife("days");
  
  const all = await postRepository.getList('job', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const comp = getMetaValue(meta, 'company', '') || getMetaValue(meta, 'organization', '');
    return safeLower(comp).replace(/ /g, '-') === safeLower(company);
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function incrementJobViewCountInternal(slug: string): Promise<void> {
  "use cache";
  cacheTag(`job-${slug}`);
  cacheTag(`job-detail-${slug}`);
  cacheLife({ revalidate: 3600 });
  
  await postRepository.incrementViewCount('job', slug);
}

// ----- News -----
async function getNewsListInternal(
  limit: number = 10,
  offset: number = 0,
  filters?: { featured?: boolean; breaking?: boolean; popular?: boolean }
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-news");
  cacheTag("news-all");
  cacheTag("news-list");
  cacheTag("news-data");
  cacheTag("news-metadata");
  cacheLife("days");
  
  const posts = await postRepository.getList('news', limit, offset, filters);
  return posts.map(mapPost);
}

async function getNewsBySlugInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-news");
  cacheTag(`news-[slug]`);
  cacheTag(`news-detail-${slug}`);
  cacheTag(`news-${slug}`);
  cacheLife("days");
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getNewsByIdInternal(id: number): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-news");
  cacheTag(`news-[id]`);
  cacheTag(`news-${id}`);
  cacheLife("days");
  
  const post = await postRepository.getById(id);
  return post ? mapPost(post) : null;
}

async function getNewsStatsInternal(): Promise<{ total: number; featured: number; breaking: number; popular: number }> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-news");
  cacheTag("news-counts");
  cacheLife("hours");
  
  const all = await postRepository.getList('news', 1000);
  const total = all.length;
  const featured = all.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true).length;
  const breaking = all.filter(p => getMetaValue<boolean>(p.meta, 'isBreaking', false) === true).length;
  const popular = all.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true).length;
  return { total, featured, breaking, popular };
}

async function getRelatedNewsInternal(currentId: number, limit: number = 3): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-news");
  cacheTag(`news-related-[id]`);
  cacheTag(`news-related-${currentId}`);
  cacheTag("news-related");
  cacheLife("days");
  
  const posts = await postRepository.getRelated(currentId, 'news', limit);
  return posts.map(mapPost);
}

async function getNewsByCategoryInternal(category: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-news");
  cacheTag(`news-by-category-[category]`);
  cacheTag(`news-${category}`);
  cacheLife("days");
  
  const all = await postRepository.getList('news', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const cat = getMetaValue(meta, 'category', '') || getMetaValue(meta, 'type', '');
    return safeLower(cat).replace(/ /g, '-') === safeLower(category);
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function getNewsByTagInternal(tag: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-news");
  cacheTag(`news-by-tag-[tag]`);
  cacheTag(`news-${tag}`);
  cacheLife("days");
  
  const all = await postRepository.getList('news', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const tags = safeArray(getMetaValue(meta, 'tags', []));
    return tags.some(t => safeLower(t).replace(/ /g, '-') === safeLower(tag));
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function incrementNewsViewCountInternal(slug: string): Promise<void> {
  "use cache";
  cacheTag(`news-${slug}`);
  cacheTag(`news-detail-${slug}`);
  cacheLife({ revalidate: 3600 });
  
  await postRepository.incrementViewCount('news', slug);
}

// ----- Result -----
async function getResultsListInternal(
  limit: number = 10,
  offset: number = 0,
  filters?: { popular?: boolean; featured?: boolean }
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-result");
  cacheTag("results-all");
  cacheTag("results-list");
  cacheTag("results-data");
  cacheTag("results-metadata");
  cacheLife("days");
  
  const posts = await postRepository.getList('result', limit, offset, filters);
  return posts.map(mapPost);
}

async function getResultBySlugInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-result");
  cacheTag(`result-[slug]`);
  cacheTag(`result-detail-${slug}`);
  cacheTag(`result-${slug}`);
  cacheLife("days");
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getResultByIdInternal(id: number): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-result");
  cacheTag(`result-[id]`);
  cacheTag(`result-${id}`);
  cacheLife("days");
  
  const post = await postRepository.getById(id);
  return post ? mapPost(post) : null;
}

async function getResultStatsInternal(): Promise<{ total: number; popular: number }> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-result");
  cacheTag("result-counts");
  cacheLife("hours");
  
  const all = await postRepository.getList('result', 1000);
  const total = all.length;
  const popular = all.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true).length;
  return { total, popular };
}

async function getResultsByBoardInternal(boardSlug: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-result");
  cacheTag(`result-by-board-[boardSlug]`);
  cacheTag(`result-${boardSlug}`);
  cacheLife("days");
  
  const all = await postRepository.getList('result', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const board = getMetaValue(meta, 'boardSlug', '') || safeLower(getMetaValue(meta, 'boardName', '')).replace(/\s+/g, '-');
    return board === boardSlug;
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function getResultsByYearInternal(year: number, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-result");
  cacheTag(`result-by-year-[year]`);
  cacheTag(`result-${year}`);
  cacheLife("days");
  
  const all = await postRepository.getList('result', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    return getMetaValue(meta, 'year', 0) === year;
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function getResultsByInstitutionInternal(instituteSlug: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-result");
  cacheTag(`result-by-institution-[instituteSlug]`);
  cacheTag(`result-${instituteSlug}`);
  cacheLife("days");
  
  const all = await postRepository.getList('result', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const inst = getMetaValue(meta, 'instituteSlug', '') || getMetaValue(meta, 'universitySlug', '') || safeLower(getMetaValue(meta, 'instituteName', '')).replace(/\s+/g, '-');
    return inst === instituteSlug;
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function incrementResultViewCountInternal(slug: string): Promise<void> {
  "use cache";
  cacheTag(`result-${slug}`);
  cacheTag(`result-detail-${slug}`);
  cacheLife({ revalidate: 3600 });
  
  await postRepository.incrementViewCount('result', slug);
}

// ----- Scholarship -----
async function getScholarshipsListInternal(
  limit: number = 10,
  offset: number = 0,
  filters?: { featured?: boolean; popular?: boolean; fullyFunded?: boolean; open?: boolean; urgent?: boolean; abroad?: boolean }
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-scholarship");
  cacheTag("scholarships-all");
  cacheTag("scholarships-list");
  cacheTag("scholarships-data");
  cacheTag("scholarships-metadata");
  cacheLife("days");
  
  const posts = await postRepository.getList('scholarship', limit, offset, filters);
  return posts.map(mapPost);
}

async function getScholarshipBySlugInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-scholarship");
  cacheTag(`scholarship-[slug]`);
  cacheTag(`scholarship-detail-${slug}`);
  cacheTag(`scholarship-${slug}`);
  cacheLife("days");
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getScholarshipByIdInternal(id: number): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-scholarship");
  cacheTag(`scholarship-[id]`);
  cacheTag(`scholarship-${id}`);
  cacheLife("days");
  
  const post = await postRepository.getById(id);
  return post ? mapPost(post) : null;
}

async function getScholarshipStatsInternal(): Promise<{ 
  total: number; 
  featured: number; 
  popular: number;
  fullyFunded: number;
  abroad: number;
  open: number;
  urgent: number;
}> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-scholarship");
  cacheTag("scholarship-counts");
  cacheTag("scholarships-stats");
  cacheLife("hours");
  
  const all = await postRepository.getList('scholarship', 1000);
  const total = all.length;
  const featured = all.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true).length;
  const popular = all.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true).length;
  const fullyFunded = all.filter(p => getMetaValue<boolean>(p.meta, 'isFullyFunded', false) === true || safeLower(getMetaValue(p.meta, 'type', '')).includes('full')).length;
  const abroad = all.filter(p => safeLower(getMetaValue(p.meta, 'location', '')) === 'abroad').length;
  const open = all.filter(p => {
    const deadline = safeDate(getMetaValue(p.meta, 'applicationDeadline', null));
    if (!deadline) return true;
    return deadline > new Date();
  }).length;
  const urgent = all.filter(p => {
    const deadline = safeDate(getMetaValue(p.meta, 'applicationDeadline', null));
    if (!deadline) return false;
    const diff = deadline.getTime() - new Date().getTime();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  return { total, featured, popular, fullyFunded, abroad, open, urgent };
}

async function getScholarshipsByLevelInternal(studyLevel: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-scholarship");
  cacheTag(`scholarships-by-level-[studyLevel]`);
  cacheTag(`scholarships-${studyLevel}`);
  cacheLife("days");
  
  const all = await postRepository.getList('scholarship', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const level = getMetaValue(meta, 'studyLevel', '') || getMetaValue(meta, 'level', '');
    return safeLower(level).replace(/ /g, '-') === safeLower(studyLevel);
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function getScholarshipsByTypeInternal(type: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-scholarship");
  cacheTag(`scholarships-by-type-[type]`);
  cacheTag(`scholarships-${type}`);
  cacheLife("days");
  
  const all = await postRepository.getList('scholarship', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const t = getMetaValue(meta, 'type', '') || getMetaValue(meta, 'scholarshipType', '');
    return safeLower(t).replace(/ /g, '-') === safeLower(type);
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function getScholarshipsByProviderInternal(provider: string, limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("posts");
  cacheTag("posts-type-scholarship");
  cacheTag(`scholarships-by-provider-[provider]`);
  cacheTag(`scholarships-${provider}`);
  cacheLife("days");
  
  const all = await postRepository.getList('scholarship', 1000);
  const filtered = all.filter(p => {
    const meta = p.meta || {};
    const prov = getMetaValue(meta, 'provider', '') || getMetaValue(meta, 'organization', '') || getMetaValue(meta, 'organizationName', '');
    return safeLower(prov).replace(/ /g, '-') === safeLower(provider);
  });
  return filtered.slice(0, limit).map(mapPost);
}

async function incrementScholarshipViewCountInternal(slug: string): Promise<void> {
  "use cache";
  cacheTag(`scholarship-${slug}`);
  cacheTag(`scholarship-detail-${slug}`);
  cacheLife({ revalidate: 3600 });
  
  await postRepository.incrementViewCount('scholarship', slug);
}

// ============ EXPORTED SERVICE ============

export const postService = {
  // ----- Generic Methods -----
  async getList(
    type: PostType | 'all',
    limit: number = 10,
    offset: number = 0,
    filters?: { featured?: boolean; popular?: boolean; breaking?: boolean }
  ): Promise<ExtendedPost[]> {
    return getListInternal(type, limit, offset, filters);
  },

  async getDetail(slug: string): Promise<ExtendedPost | null> {
    return getDetailInternal(slug);
  },

  async getRelated(
    currentId: number,
    type: PostType,
    limit: number = 5
  ): Promise<ExtendedPost[]> {
    return getRelatedInternal(currentId, type, limit);
  },

  async getTotalCount(type: PostType | 'all'): Promise<number> {
    return getTotalCountInternal(type);
  },

  async clearCache(
    type?: PostType,
    slug?: string
  ) {
    if (slug) {
      revalidateTag(`detail-${slug}`, "default");
    }
    if (type) {
      revalidateTag(`list-${type}`, "default");
      revalidateTag(`count-${type}`, "default");
    }
    revalidateTag("homepage", "default");
  },

  // ----- Pre-cache Functions -----
  async preCacheAllTypes(limit: number = 10): Promise<void> {
    const types: PostType[] = ['admission', 'result', 'news', 'date_sheet', 'scholarship', 'job', 'blog'];
    await Promise.all(types.map(type => getListInternal(type, limit)));
  },

  async preCacheType(type: PostType, limit: number = 10): Promise<void> {
    await getListInternal(type, limit);
  },

  async preCacheCustom(types: PostType[], limit: number = 10): Promise<void> {
    await Promise.all(types.map(type => getListInternal(type, limit)));
  },

  // ----- Admission Methods -----
  async getAdmissionsData(
    page: number = 1,
    limit: number = 10,
    filter: string = 'all',
    search: string = ''
  ): Promise<{ admissions: ExtendedPost[]; total: number; open: number; closed: number; totalPages: number }> {
    "use cache";
    const cacheKey = `admissions-paginated-${page}-${filter}-${search}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-admission");
    cacheTag("admissions-data");
    cacheTag("admissions-list");
    cacheLife("hours");
    
    const all = await postRepository.getList('admission', 1000);
    let filtered = all;
    
    if (filter === 'open') {
      filtered = all.filter(p => getMetaValue(p.meta, 'status', 'Open') === 'Open');
    } else if (filter === 'closed') {
      filtered = all.filter(p => getMetaValue(p.meta, 'status', 'Open') !== 'Open');
    }
    
    if (search) {
      const q = safeLower(search);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'instituteName', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'cityName', '')).includes(q)
      );
    }
    
    const total = filtered.length;
    const open = filtered.filter(p => getMetaValue(p.meta, 'status', 'Open') === 'Open').length;
    const closed = total - open;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return {
      admissions: paginated.map(mapPost),
      total,
      open,
      closed,
      totalPages
    };
  },

  async getOpenCountForMetadata(): Promise<number> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-admission");
    cacheTag("admissions-metadata");
    cacheTag("admission-counts");
    cacheLife("hours");
    
    const all = await postRepository.getList('admission', 1000);
    return all.filter(p => getMetaValue(p.meta, 'status', 'Open') === 'Open').length;
  },

  async getAdmissionList(
    type: PostType | 'all' = 'admission',
    limit: number = 10
  ): Promise<ExtendedPost[]> {
    return this.getList('admission', limit);
  },

  async getAdmissionBySlug(slug: string): Promise<ExtendedPost | null> {
    return getAdmissionBySlugInternal(slug);
  },

  async getAdmissionDetail(slug: string): Promise<ExtendedPost | null> {
    return getAdmissionBySlugInternal(slug);
  },

  async getAdmissionById(id: number): Promise<ExtendedPost | null> {
    return getAdmissionByIdInternal(id);
  },

  async getAdmissionCounts(): Promise<{ open: number; closed: number; total: number }> {
    return getAdmissionCountsInternal();
  },

  async getFeaturedAdmissions(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-admission");
    cacheTag("featured-admissions");
    cacheLife("days");
    
    const posts = await postRepository.getList('admission', 1000);
    const featured = posts.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    return featured.slice(0, limit).map(mapPost);
  },

  async getFilteredAdmissions(filter: string, search?: string): Promise<ExtendedPost[]> {
    "use cache";
    const cacheKey = `admissions-filtered-${filter}-${search || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-admission");
    cacheTag("admissions-data");
    cacheLife("hours");
    
    const all = await postRepository.getList('admission', 1000);
    let filtered = all;
    
    if (filter === 'open') {
      filtered = filtered.filter(p => getMetaValue(p.meta, 'status', 'Open') === 'Open');
    } else if (filter === 'closed') {
      filtered = filtered.filter(p => getMetaValue(p.meta, 'status', 'Open') !== 'Open');
    }
    
    if (search) {
      const q = safeLower(search);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'instituteName', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'cityName', '')).includes(q)
      );
    }
    
    return filtered.map(mapPost);
  },

  async getPaginatedAdmissions(
    page: number,
    limit: number,
    filter?: string,
    search?: string
  ): Promise<{ admissions: ExtendedPost[]; total: number; totalPages: number }> {
    const data = await this.getAdmissionsData(page, limit, filter || 'all', search || '');
    return {
      admissions: data.admissions,
      total: data.total,
      totalPages: data.totalPages
    };
  },

  async generateAdmissionStaticParams(): Promise<{ slug: string }[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-admission");
    cacheTag("admissions-list");
    cacheLife("days");
    
    const posts = await postRepository.getList('admission', 100);
    return posts.map(p => ({ slug: p.slug }));
  },

  async getAdmissionsHome(limit: number = 4): Promise<ExtendedPost[]> {
    return this.getList('admission', limit);
  },

  // ----- Blog Methods -----
  async getAllBlogs(limit: number = 100): Promise<ExtendedPost[]> {
    return getBlogsListInternal(limit);
  },

  async getPaginatedBlogs(
    filters: { category?: string; q?: string; page?: number },
    limit: number = 12
  ): Promise<{ blogs: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    "use cache";
    const page = filters.page || 1;
    const cacheKey = `blogs-paginated-${page}-${filters.category || 'all'}-${filters.q || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-blog");
    cacheTag("blogs-all");
    cacheTag("blogs-data");
    cacheLife("hours");
    
    const all = await postRepository.getList('blog', 1000);
    let filtered = all;
    
    if (filters.category) {
      filtered = filtered.filter(p => {
        const cat = getMetaValue(p.meta, 'category', 'General');
        return safeLower(cat).replace(/\s+/g, '-') === filters.category;
      });
    }
    
    if (filters.q) {
      const q = safeLower(filters.q);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'authorName', '')).includes(q)
      );
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return {
      blogs: paginated.map(mapPost),
      total,
      totalPages,
      currentPage: page
    };
  },

  async getBlogStats(): Promise<{ total: number; featured: number; popular: number }> {
    return getBlogStatsInternal();
  },

  async getBlogBySlug(slug: string): Promise<ExtendedPost | null> {
    return getBlogBySlugInternal(slug);
  },

  async getBlogList(
    type: PostType | 'all' = 'blog',
    limit: number = 10
  ): Promise<ExtendedPost[]> {
    return this.getList('blog', limit);
  },

  async getFeaturedBlogs(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-blog");
    cacheTag("featured-blogs");
    cacheLife("days");
    
    const posts = await postRepository.getList('blog', 1000);
    const featured = posts.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    return featured.slice(0, limit).map(mapPost);
  },

  async getPopularBlogs(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-blog");
    cacheTag("popular-blogs");
    cacheLife("days");
    
    const posts = await postRepository.getList('blog', 1000);
    const popular = posts.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true);
    return popular.slice(0, limit).map(mapPost);
  },

  async getBlogCategories(): Promise<string[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-blog");
    cacheTag("blog-categories");
    cacheLife("days");
    
    const all = await postRepository.getList('blog', 1000);
    const categories = new Set<string>();
    all.forEach(p => {
      const cat = getMetaValue(p.meta, 'category', 'General');
      categories.add(cat);
    });
    return Array.from(categories);
  },

  async getFilteredBlogs(category?: string, search?: string): Promise<ExtendedPost[]> {
    "use cache";
    const cacheKey = `blogs-filtered-${category || 'all'}-${search || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-blog");
    cacheTag("blogs-all");
    cacheLife("hours");
    
    const all = await postRepository.getList('blog', 1000);
    let filtered = all;
    
    if (category) {
      filtered = filtered.filter(p => {
        const cat = getMetaValue(p.meta, 'category', 'General');
        return safeLower(cat).replace(/\s+/g, '-') === category;
      });
    }
    
    if (search) {
      const q = safeLower(search);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'authorName', '')).includes(q)
      );
    }
    
    return filtered.map(mapPost);
  },

  async getBlogCounts(): Promise<{ total: number; featured: number; popular: number }> {
    return getBlogStatsInternal();
  },

  async generateBlogStaticParams(): Promise<{ slug: string }[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-blog");
    cacheTag("blogs-all");
    cacheLife("days");
    
    const posts = await postRepository.getList('blog', 100);
    return posts.map(p => ({ slug: p.slug }));
  },

  async getRelatedBlogs(
    currentId: number,
    category: string,
    limit: number = 3
  ): Promise<ExtendedPost[]> {
    return getRelatedBlogsInternal(currentId, category, limit);
  },

  async incrementBlogViewCount(slug: string): Promise<void> {
    return incrementBlogViewCountInternal(slug);
  },

  async getBlogsHome(limit: number = 5): Promise<ExtendedPost[]> {
    return this.getList('blog', limit);
  },

  async getBlogById(id: number): Promise<ExtendedPost | null> {
    return getBlogByIdInternal(id);
  },

  // ----- Date Sheet Methods -----
  async getAllDateSheets(limit: number = 100): Promise<ExtendedPost[]> {
    return getDateSheetsListInternal(limit);
  },

  async getDateSheets(
    filters: { board?: string; examType?: string; year?: string; q?: string; page?: number },
    limit: number = 9
  ): Promise<{ dateSheets: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    "use cache";
    const page = filters.page || 1;
    const cacheKey = `date-sheets-paginated-${page}-${filters.board || 'all'}-${filters.examType || 'all'}-${filters.year || 'all'}-${filters.q || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-date_sheet");
    cacheTag("date-sheets-all");
    cacheTag("date-sheets-data");
    cacheTag("date-sheets-metadata");
    cacheLife("hours");
    
    const all = await postRepository.getList('date_sheet', 1000);
    let filtered = all;
    
    if (filters.q) {
      const q = safeLower(filters.q);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'boardName', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'instituteName', '')).includes(q)
      );
    }
    
    if (filters.examType) {
      filtered = filtered.filter(p => {
        const type = getMetaValue(p.meta, 'examType', '') || getMetaValue(p.meta, 'type', '') || 'Annual';
        return safeLower(type) === safeLower(filters.examType || '');
      });
    }
    
    if (filters.year) {
      filtered = filtered.filter(p => getMetaValue(p.meta, 'year', 0) === parseInt(filters.year!));
    }
    
    if (filters.board === 'bise') {
      filtered = filtered.filter(p => getMetaValue(p.meta, 'boardName', null) !== null);
    } else if (filters.board === 'university') {
      filtered = filtered.filter(p => getMetaValue(p.meta, 'instituteName', null) !== null);
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return {
      dateSheets: paginated.map(mapPost),
      total,
      totalPages,
      currentPage: page
    };
  },

  async getDateSheetStats(): Promise<{ total: number; popular: number }> {
    return getDateSheetStatsInternal();
  },

  async getDateSheetBySlug(slug: string): Promise<ExtendedPost | null> {
    return getDateSheetBySlugInternal(slug);
  },

  async getDateSheetList(
    type: PostType | 'all' = 'date_sheet',
    limit: number = 10
  ): Promise<ExtendedPost[]> {
    return this.getList('date_sheet', limit);
  },

  async getDateSheetsData(
    page: number = 1,
    limit: number = 9,
    filter?: string,
    search?: string
  ): Promise<{ dateSheets: ExtendedPost[]; total: number; totalPages: number }> {
    const data = await this.getDateSheets({ q: search, page }, limit);
    return {
      dateSheets: data.dateSheets,
      total: data.total,
      totalPages: data.totalPages
    };
  },

  async getPopularDateSheets(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-date_sheet");
    cacheTag("popular-date-sheets");
    cacheLife("days");
    
    const posts = await postRepository.getList('date_sheet', 1000);
    const popular = posts.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true);
    return popular.slice(0, limit).map(mapPost);
  },

  async getDateSheetCounts(): Promise<{ total: number; popular: number }> {
    return getDateSheetStatsInternal();
  },

  async getDateSheetByBoard(boardSlug: string, year?: number): Promise<ExtendedPost[]> {
    return getDateSheetsByBoardInternal(boardSlug, year);
  },

  async getFilteredDateSheets(filter: string, search?: string): Promise<ExtendedPost[]> {
    "use cache";
    const cacheKey = `date-sheets-filtered-${filter}-${search || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-date_sheet");
    cacheTag("date-sheets-data");
    cacheLife("hours");
    
    const all = await postRepository.getList('date_sheet', 1000);
    let filtered = all;
    
    if (filter === 'bise') {
      filtered = filtered.filter(p => getMetaValue(p.meta, 'boardName', null) !== null);
    } else if (filter === 'university') {
      filtered = filtered.filter(p => getMetaValue(p.meta, 'instituteName', null) !== null);
    }
    
    if (search) {
      const q = safeLower(search);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'boardName', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'instituteName', '')).includes(q)
      );
    }
    
    return filtered.map(mapPost);
  },

  async getPaginatedDateSheets(
    page: number,
    limit: number,
    filter?: string,
    search?: string
  ): Promise<{ dateSheets: ExtendedPost[]; total: number; totalPages: number }> {
    const data = await this.getDateSheets({ q: search, page }, limit);
    return {
      dateSheets: data.dateSheets,
      total: data.total,
      totalPages: data.totalPages
    };
  },

  async generateDateSheetStaticParams(): Promise<{ slug: string }[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-date_sheet");
    cacheTag("date-sheets-list");
    cacheLife("days");
    
    const posts = await postRepository.getList('date_sheet', 100);
    return posts.map(p => ({ slug: p.slug }));
  },

  async incrementDateSheetViewCount(slug: string): Promise<void> {
    return incrementDateSheetViewCountInternal(slug);
  },

  async getDateSheetsByYear(year: number): Promise<ExtendedPost[]> {
    return getDateSheetsByYearInternal(year);
  },

  async getDateSheetsByExamType(examType: string): Promise<ExtendedPost[]> {
    return getDateSheetsByExamTypeInternal(examType);
  },

  async getDateSheetsHome(limit: number = 5): Promise<ExtendedPost[]> {
    return this.getList('date_sheet', limit);
  },

  async getDateSheetById(id: number): Promise<ExtendedPost | null> {
    return getDateSheetByIdInternal(id);
  },

  // ----- Job Methods -----
  async getAllJobs(limit: number = 100): Promise<ExtendedPost[]> {
    return getJobsListInternal(limit);
  },

  async getPaginatedJobs(
    filters: { jobType?: string; location?: string; q?: string; page?: number },
    limit: number = 10
  ): Promise<{ jobs: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    "use cache";
    const page = filters.page || 1;
    const cacheKey = `jobs-paginated-${page}-${filters.jobType || 'all'}-${filters.location || 'all'}-${filters.q || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-job");
    cacheTag("jobs-all");
    cacheTag("jobs-data");
    cacheTag("jobs-metadata");
    cacheLife("hours");
    
    const all = await postRepository.getList('job', 1000);
    let filtered = all;
    
    if (filters.q) {
      const q = safeLower(filters.q);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'company', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'location', '')).includes(q)
      );
    }
    
    if (filters.jobType) {
      filtered = filtered.filter(p => {
        const type = getMetaValue(p.meta, 'jobType', 'Full Time');
        return safeLower(type).replace(/ /g, '-') === filters.jobType;
      });
    }
    
    if (filters.location) {
      filtered = filtered.filter(p => {
        const loc = getMetaValue(p.meta, 'location', 'Pakistan');
        return safeLower(loc).replace(/ /g, '-') === filters.location;
      });
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return {
      jobs: paginated.map(mapPost),
      total,
      totalPages,
      currentPage: page
    };
  },

  async getJobStats(): Promise<{ total: number; featured: number; urgent: number; open: number }> {
    return getJobStatsInternal();
  },

  async getJobBySlug(slug: string): Promise<ExtendedPost | null> {
    return getJobBySlugInternal(slug);
  },

  async getJobList(
    type: PostType | 'all' = 'job',
    limit: number = 10
  ): Promise<ExtendedPost[]> {
    return this.getList('job', limit);
  },

  async getJobsData(
    page: number = 1,
    limit: number = 10,
    filter?: string,
    search?: string
  ): Promise<{ jobs: ExtendedPost[]; total: number; totalPages: number }> {
    const data = await this.getPaginatedJobs({ q: search, page }, limit);
    return {
      jobs: data.jobs,
      total: data.total,
      totalPages: data.totalPages
    };
  },

  async getFeaturedJobs(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-job");
    cacheTag("featured-jobs");
    cacheLife("days");
    
    const posts = await postRepository.getList('job', 1000);
    const featured = posts.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    return featured.slice(0, limit).map(mapPost);
  },

  async getUrgentJobs(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-job");
    cacheTag("urgent-jobs");
    cacheLife("days");
    
    const posts = await postRepository.getList('job', 1000);
    const urgent = posts.filter(p => getMetaValue<boolean>(p.meta, 'isUrgent', false) === true);
    return urgent.slice(0, limit).map(mapPost);
  },

  async getJobCounts(): Promise<{ total: number; featured: number; urgent: number; open: number }> {
    return getJobStatsInternal();
  },

  async getFilteredJobs(filter: string, search?: string): Promise<ExtendedPost[]> {
    "use cache";
    const cacheKey = `jobs-filtered-${filter}-${search || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-job");
    cacheTag("jobs-data");
    cacheLife("hours");
    
    const all = await postRepository.getList('job', 1000);
    let filtered = all;
    
    if (filter === 'featured') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    } else if (filter === 'urgent') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isUrgent', false) === true);
    } else if (filter === 'open') {
      filtered = filtered.filter(p => {
        const deadline = safeDate(getMetaValue(p.meta, 'deadline', null));
        if (!deadline) return true;
        return deadline > new Date();
      });
    }
    
    if (search) {
      const q = safeLower(search);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'company', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'location', '')).includes(q)
      );
    }
    
    return filtered.map(mapPost);
  },

  async getPaginatedJobsWithFilters(
    page: number,
    limit: number,
    filters: { jobType?: string; location?: string; q?: string }
  ): Promise<{ jobs: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    return this.getPaginatedJobs({ ...filters, page }, limit);
  },

  async generateJobStaticParams(): Promise<{ slug: string }[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-job");
    cacheTag("jobs-list");
    cacheLife("days");
    
    const posts = await postRepository.getList('job', 100);
    return posts.map(p => ({ slug: p.slug }));
  },

  async incrementJobViewCount(slug: string): Promise<void> {
    return incrementJobViewCountInternal(slug);
  },

  async getJobsByType(jobType: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getJobsByTypeInternal(jobType, limit);
  },

  async getJobsByLocation(location: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getJobsByLocationInternal(location, limit);
  },

  async getJobsByCompany(company: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getJobsByCompanyInternal(company, limit);
  },

  async getOpenJobs(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-job");
    cacheTag("open-jobs");
    cacheLife("days");
    
    const all = await postRepository.getList('job', 1000);
    const open = all.filter(p => {
      const deadline = safeDate(getMetaValue(p.meta, 'deadline', null));
      if (!deadline) return true;
      return deadline > new Date();
    });
    return open.slice(0, limit).map(mapPost);
  },

  async searchJobs(query: string, limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag(`jobs-search-${query}`);
    cacheTag("posts");
    cacheTag("posts-type-job");
    cacheLife("hours");
    
    const all = await postRepository.getList('job', 1000);
    const q = safeLower(query);
    const filtered = all.filter(p => 
      safeLower(p.title).includes(q) ||
      safeLower(getMetaValue(p.meta, 'company', '')).includes(q) ||
      safeLower(getMetaValue(p.meta, 'location', '')).includes(q)
    );
    return filtered.slice(0, limit).map(mapPost);
  },

  async getJobsHome(limit: number = 5): Promise<ExtendedPost[]> {
    return this.getList('job', limit);
  },

  async getJobById(id: number): Promise<ExtendedPost | null> {
    return getJobByIdInternal(id);
  },

  // ----- News Methods -----
  async getAllNews(limit: number = 100): Promise<ExtendedPost[]> {
    return getNewsListInternal(limit);
  },

  async getNewsData(
    page: number = 1,
    limit: number = 12,
    searchQuery?: string,
    category?: string
  ): Promise<{ news: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    "use cache";
    const cacheKey = `news-paginated-${page}-${category || 'all'}-${searchQuery || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-news");
    cacheTag("news-all");
    cacheTag("news-data");
    cacheTag("news-metadata");
    cacheLife("hours");
    
    const all = await postRepository.getList('news', 1000);
    let filtered = all;
    
    if (category) {
      filtered = filtered.filter(p => {
        const cat = getMetaValue(p.meta, 'category', 'General');
        return safeLower(cat) === safeLower(category);
      });
    }
    
    if (searchQuery) {
      const q = safeLower(searchQuery);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'authorName', '')).includes(q)
      );
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return {
      news: paginated.map(mapPost),
      total,
      totalPages,
      currentPage: page
    };
  },

  async getNewsBySlug(slug: string): Promise<ExtendedPost | null> {
    return getNewsBySlugInternal(slug);
  },

  async getNewsList(
    type: PostType | 'all' = 'news',
    limit: number = 10
  ): Promise<ExtendedPost[]> {
    return this.getList('news', limit);
  },

  async getBreakingNews(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-news");
    cacheTag("breaking-news");
    cacheLife("hours");
    
    const posts = await postRepository.getList('news', 1000);
    const breaking = posts.filter(p => getMetaValue<boolean>(p.meta, 'isBreaking', false) === true);
    return breaking.slice(0, limit).map(mapPost);
  },

  async getFeaturedNews(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-news");
    cacheTag("featured-news");
    cacheLife("days");
    
    const posts = await postRepository.getList('news', 1000);
    const featured = posts.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    return featured.slice(0, limit).map(mapPost);
  },

  async getPopularNews(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-news");
    cacheTag("popular-news");
    cacheLife("days");
    
    const posts = await postRepository.getList('news', 1000);
    const popular = posts.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true);
    return popular.slice(0, limit).map(mapPost);
  },

  async getNewsCounts(): Promise<{ total: number; featured: number; breaking: number; popular: number }> {
    return getNewsStatsInternal();
  },

  async getFilteredNews(filter: string, search?: string): Promise<ExtendedPost[]> {
    "use cache";
    const cacheKey = `news-filtered-${filter}-${search || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-news");
    cacheTag("news-data");
    cacheLife("hours");
    
    const all = await postRepository.getList('news', 1000);
    let filtered = all;
    
    if (filter === 'breaking') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isBreaking', false) === true);
    } else if (filter === 'featured') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    } else if (filter === 'popular') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true);
    }
    
    if (search) {
      const q = safeLower(search);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue<string>(p.meta, 'authorName', '')).includes(q)
      );
    }
    
    return filtered.map(mapPost);
  },

  async getPaginatedNews(
    page: number,
    limit: number,
    filter?: string,
    search?: string
  ): Promise<{ news: ExtendedPost[]; total: number; totalPages: number }> {
    const data = await this.getNewsData(page, limit, search, filter);
    return {
      news: data.news,
      total: data.total,
      totalPages: data.totalPages
    };
  },

  async generateNewsStaticParams(): Promise<{ slug: string }[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-news");
    cacheTag("news-list");
    cacheLife("days");
    
    const posts = await postRepository.getList('news', 100);
    return posts.map(p => ({ slug: p.slug }));
  },

  async incrementNewsViewCount(slug: string): Promise<void> {
    return incrementNewsViewCountInternal(slug);
  },

  async getNewsByCategory(category: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getNewsByCategoryInternal(category, limit);
  },

  async getNewsByTag(tag: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getNewsByTagInternal(tag, limit);
  },

  async searchNews(query: string, limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag(`news-search-${query}`);
    cacheTag("posts");
    cacheTag("posts-type-news");
    cacheLife("hours");
    
    const all = await postRepository.getList('news', 1000);
    const q = safeLower(query);
    const filtered = all.filter(p => 
      safeLower(p.title).includes(q) ||
      safeLower(getMetaValue(p.meta, 'authorName', '')).includes(q)
    );
    return filtered.slice(0, limit).map(mapPost);
  },

  async getRelatedNews(currentId: number, limit: number = 3): Promise<ExtendedPost[]> {
    return getRelatedNewsInternal(currentId, limit);
  },

  async getNewsHome(limit: number = 5): Promise<ExtendedPost[]> {
    return this.getList('news', limit);
  },

  async getNewsById(id: number): Promise<ExtendedPost | null> {
    return getNewsByIdInternal(id);
  },

  // ----- Result Methods -----
  async getAllResults(limit: number = 100): Promise<ExtendedPost[]> {
    return getResultsListInternal(limit);
  },

  async getPaginatedResults(
    filters: { board?: string; year?: string; level?: string; q?: string; page?: number },
    limit: number = 10
  ): Promise<{ results: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    "use cache";
    const page = filters.page || 1;
    const cacheKey = `results-paginated-${page}-${filters.board || 'all'}-${filters.year || 'all'}-${filters.level || 'all'}-${filters.q || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-result");
    cacheTag("results-all");
    cacheTag("results-data");
    cacheTag("results-metadata");
    cacheLife("hours");
    
    const all = await postRepository.getList('result', 1000);
    let filtered = all;
    
    if (filters.q) {
      const q = safeLower(filters.q);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'boardName', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'instituteName', '')).includes(q)
      );
    }
    
    if (filters.board) {
      filtered = filtered.filter(p => {
        const board = getMetaValue(p.meta, 'boardSlug', '') || safeLower(getMetaValue(p.meta, 'boardName', '')).replace(/\s+/g, '-');
        return board === filters.board;
      });
    }
    
    if (filters.year) {
      filtered = filtered.filter(p => getMetaValue(p.meta, 'year', 0) === parseInt(filters.year!));
    }
    
    if (filters.level) {
      const levelMap: Record<string, string[]> = {
        'matric': ['matric', 'ssc', 'secondary'],
        'inter': ['inter', 'hssc', 'intermediate', 'fa', 'fsc', 'ics'],
        'ba': ['ba', 'bsc', 'bachelor'],
        'ma': ['ma', 'msc', 'master'],
      };
      const keywords = levelMap[filters.level] || [filters.level];
      filtered = filtered.filter(p =>
        keywords.some(kw => safeLower(p.title).includes(kw))
      );
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return {
      results: paginated.map(mapPost),
      total,
      totalPages,
      currentPage: page
    };
  },

  async getResultStats(): Promise<{ total: number; popular: number }> {
    return getResultStatsInternal();
  },

  async getResultBySlug(slug: string): Promise<ExtendedPost | null> {
    return getResultBySlugInternal(slug);
  },

  async getResultList(
    type: PostType | 'all' = 'result',
    limit: number = 10
  ): Promise<ExtendedPost[]> {
    return this.getList('result', limit);
  },

  async getResultsData(
    page: number = 1,
    limit: number = 10,
    filter?: string,
    search?: string
  ): Promise<{ results: ExtendedPost[]; total: number; totalPages: number }> {
    const data = await this.getPaginatedResults({ q: search, page }, limit);
    return {
      results: data.results,
      total: data.total,
      totalPages: data.totalPages
    };
  },

  async getPopularResults(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-result");
    cacheTag("popular-results");
    cacheLife("days");
    
    const posts = await postRepository.getList('result', 1000);
    const popular = posts.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true);
    return popular.slice(0, limit).map(mapPost);
  },

  async getResultCounts(): Promise<{ total: number; popular: number }> {
    return getResultStatsInternal();
  },

  async getFilteredResults(filter: string, search?: string): Promise<ExtendedPost[]> {
    "use cache";
    const cacheKey = `results-filtered-${filter}-${search || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-result");
    cacheTag("results-data");
    cacheLife("hours");
    
    const all = await postRepository.getList('result', 1000);
    let filtered = all;
    
    if (filter === 'popular') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true);
    }
    
    if (search) {
      const q = safeLower(search);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'boardName', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'instituteName', '')).includes(q)
      );
    }
    
    return filtered.map(mapPost);
  },

  async getPaginatedResultsWithFilters(
    page: number,
    limit: number,
    filters: { board?: string; year?: string; level?: string; q?: string }
  ): Promise<{ results: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    return this.getPaginatedResults({ ...filters, page }, limit);
  },

  async generateResultStaticParams(): Promise<{ slug: string }[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-result");
    cacheTag("results-list");
    cacheLife("days");
    
    const posts = await postRepository.getList('result', 100);
    return posts.map(p => ({ slug: p.slug }));
  },

  async incrementResultViewCount(slug: string): Promise<void> {
    return incrementResultViewCountInternal(slug);
  },

  async getResultsByBoard(boardSlug: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getResultsByBoardInternal(boardSlug, limit);
  },

  async getResultsByYear(year: number, limit: number = 10): Promise<ExtendedPost[]> {
    return getResultsByYearInternal(year, limit);
  },

  async getResultsByInstitution(instituteSlug: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getResultsByInstitutionInternal(instituteSlug, limit);
  },

  async getLatestResults(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-result");
    cacheTag("recent-results");
    cacheLife("hours");
    
    const posts = await postRepository.getList('result', limit, 0, {});
    return posts.map(mapPost);
  },

  async searchResults(query: string, limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag(`results-search-${query}`);
    cacheTag("posts");
    cacheTag("posts-type-result");
    cacheLife("hours");
    
    const all = await postRepository.getList('result', 1000);
    const q = safeLower(query);
    const filtered = all.filter(p => 
      safeLower(p.title).includes(q) ||
      safeLower(getMetaValue(p.meta, 'boardName', '')).includes(q) ||
      safeLower(getMetaValue(p.meta, 'instituteName', '')).includes(q)
    );
    return filtered.slice(0, limit).map(mapPost);
  },

  async getResultsHome(limit: number = 5): Promise<ExtendedPost[]> {
    return this.getList('result', limit);
  },

  async getFeaturedResults(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-result");
    cacheLife("hours");
    
    const posts = await postRepository.getList('result', 1000);
    const featured = posts.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    return featured.slice(0, limit).map(mapPost);
  },

  async getResultById(id: number): Promise<ExtendedPost | null> {
    return getResultByIdInternal(id);
  },

  // ----- Scholarship Methods -----
  async getAllScholarships(limit: number = 100): Promise<ExtendedPost[]> {
    return getScholarshipsListInternal(limit);
  },

  async getScholarshipStats(): Promise<{ 
    total: number; 
    featured: number; 
    popular: number;
    fullyFunded: number;
    abroad: number;
    open: number;
    urgent: number;
  }> {
    return getScholarshipStatsInternal();
  },

  async getPaginatedScholarships(
    filters: { level?: string; type?: string; location?: string; q?: string; page?: number },
    limit: number = 10
  ): Promise<{ scholarships: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    "use cache";
    const page = filters.page || 1;
    const cacheKey = `scholarships-paginated-${page}-${filters.level || 'all'}-${filters.type || 'all'}-${filters.location || 'all'}-${filters.q || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheTag("scholarships-all");
    cacheTag("scholarships-data");
    cacheTag("scholarships-metadata");
    cacheLife("hours");
    
    const all = await postRepository.getList('scholarship', 1000);
    let filtered = all;
    
    if (filters.q) {
      const q = safeLower(filters.q);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'provider', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'organization', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'studyLevel', '')).includes(q)
      );
    }
    
    if (filters.level) {
      const levelMap: Record<string, string[]> = {
        'matric': ['matric', 'ssc', 'secondary'],
        'inter': ['inter', 'intermediate', 'hssc', 'fa', 'fsc', 'ics'],
        'bs': ['bs', 'bachelor', 'bscs', 'bit', 'bba'],
        'ms': ['ms', 'master', 'masters', 'mphil'],
        'phd': ['phd', 'doctorate', 'doctoral'],
      };
      const keywords = levelMap[filters.level] || [filters.level];
      filtered = filtered.filter(p => {
        const level = getMetaValue(p.meta, 'studyLevel', '');
        return keywords.some(kw => safeLower(level).includes(kw));
      });
    }
    
    if (filters.type) {
      filtered = filtered.filter(p => {
        const type = getMetaValue(p.meta, 'type', 'Merit-Based');
        return safeLower(type).replace(/ /g, '-') === filters.type;
      });
    }
    
    if (filters.location) {
      filtered = filtered.filter(p => {
        const loc = getMetaValue(p.meta, 'location', 'Pakistan');
        return safeLower(loc) === safeLower(filters.location || '');
      });
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return {
      scholarships: paginated.map(mapPost),
      total,
      totalPages,
      currentPage: page
    };
  },

  async getScholarshipBySlug(slug: string): Promise<ExtendedPost | null> {
    return getScholarshipBySlugInternal(slug);
  },

  async getScholarshipList(
    type: PostType | 'all' = 'scholarship',
    limit: number = 10
  ): Promise<ExtendedPost[]> {
    return this.getList('scholarship', limit);
  },

  async getScholarshipsData(
    page: number = 1,
    limit: number = 10,
    filter?: string,
    search?: string
  ): Promise<{ scholarships: ExtendedPost[]; total: number; totalPages: number }> {
    const data = await this.getPaginatedScholarships({ q: search, page }, limit);
    return {
      scholarships: data.scholarships,
      total: data.total,
      totalPages: data.totalPages
    };
  },

  async getFeaturedScholarships(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheTag("featured-scholarships");
    cacheLife("days");
    
    const posts = await postRepository.getList('scholarship', 1000);
    const featured = posts.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    return featured.slice(0, limit).map(mapPost);
  },

  async getPopularScholarships(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheTag("popular-scholarships");
    cacheLife("days");
    
    const posts = await postRepository.getList('scholarship', 1000);
    const popular = posts.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true);
    return popular.slice(0, limit).map(mapPost);
  },

  async getScholarshipCounts(): Promise<{ 
    total: number; 
    featured: number; 
    popular: number;
    fullyFunded: number;
    abroad: number;
    open: number;
    urgent: number;
  }> {
    return getScholarshipStatsInternal();
  },

  async getFilteredScholarships(filter: string, search?: string): Promise<ExtendedPost[]> {
    "use cache";
    const cacheKey = `scholarships-filtered-${filter}-${search || 'none'}`;
    cacheTag(cacheKey);
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheTag("scholarships-data");
    cacheLife("hours");
    
    const all = await postRepository.getList('scholarship', 1000);
    let filtered = all;
    
    if (filter === 'featured') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isFeatured', false) === true);
    } else if (filter === 'popular') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isPopular', false) === true);
    } else if (filter === 'fully-funded') {
      filtered = filtered.filter(p => getMetaValue<boolean>(p.meta, 'isFullyFunded', false) === true || safeLower(getMetaValue<string>(p.meta, 'type', '')).includes('full'));
    } else if (filter === 'abroad') {
      filtered = filtered.filter(p => safeLower(getMetaValue(p.meta, 'location', '')) === 'abroad');
    } else if (filter === 'open') {
      filtered = filtered.filter(p => {
        const deadline = safeDate(getMetaValue(p.meta, 'applicationDeadline', null));
        if (!deadline) return true;
        return deadline > new Date();
      });
    } else if (filter === 'urgent') {
      filtered = filtered.filter(p => {
        const deadline = safeDate(getMetaValue(p.meta, 'applicationDeadline', null));
        if (!deadline) return false;
        const diff = deadline.getTime() - new Date().getTime();
        return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      });
    }
    
    if (search) {
      const q = safeLower(search);
      filtered = filtered.filter(p => 
        safeLower(p.title).includes(q) ||
        safeLower(getMetaValue(p.meta, 'provider', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'organization', '')).includes(q) ||
        safeLower(getMetaValue(p.meta, 'studyLevel', '')).includes(q)
      );
    }
    
    return filtered.map(mapPost);
  },

  async getPaginatedScholarshipsWithFilters(
    page: number,
    limit: number,
    filters: { level?: string; type?: string; location?: string; q?: string }
  ): Promise<{ scholarships: ExtendedPost[]; total: number; totalPages: number; currentPage: number }> {
    return this.getPaginatedScholarships({ ...filters, page }, limit);
  },

  async generateScholarshipStaticParams(): Promise<{ slug: string }[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheTag("scholarships-list");
    cacheLife("days");
    
    const posts = await postRepository.getList('scholarship', 100);
    return posts.map(p => ({ slug: p.slug }));
  },

  async incrementScholarshipViewCount(slug: string): Promise<void> {
    return incrementScholarshipViewCountInternal(slug);
  },

  async getScholarshipsByLevel(studyLevel: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getScholarshipsByLevelInternal(studyLevel, limit);
  },

  async getScholarshipsByType(type: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getScholarshipsByTypeInternal(type, limit);
  },

  async getScholarshipsByProvider(provider: string, limit: number = 10): Promise<ExtendedPost[]> {
    return getScholarshipsByProviderInternal(provider, limit);
  },

  async getOpenScholarships(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheTag("open-scholarships");
    cacheLife("hours");
    
    const all = await postRepository.getList('scholarship', 1000);
    const open = all.filter(p => {
      const deadline = safeDate(getMetaValue(p.meta, 'applicationDeadline', null));
      if (!deadline) return true;
      return deadline > new Date();
    });
    return open.slice(0, limit).map(mapPost);
  },

  async getUrgentScholarships(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheTag("urgent-scholarships");
    cacheLife("hours");
    
    const all = await postRepository.getList('scholarship', 1000);
    const urgent = all.filter(p => {
      const deadline = safeDate(getMetaValue(p.meta, 'applicationDeadline', null));
      if (!deadline) return false;
      const diff = deadline.getTime() - new Date().getTime();
      return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    });
    return urgent.slice(0, limit).map(mapPost);
  },

  async getAbroadScholarships(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheTag("abroad-scholarships");
    cacheLife("days");
    
    const all = await postRepository.getList('scholarship', 1000);
    const abroad = all.filter(p => safeLower(getMetaValue(p.meta, 'location', '')) === 'abroad');
    return abroad.slice(0, limit).map(mapPost);
  },

  async searchScholarships(query: string, limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag(`scholarships-search-${query}`);
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheLife("hours");
    
    const all = await postRepository.getList('scholarship', 1000);
    const q = safeLower(query);
    const filtered = all.filter(p => 
      safeLower(p.title).includes(q) ||
      safeLower(getMetaValue(p.meta, 'provider', '')).includes(q) ||
      safeLower(getMetaValue(p.meta, 'organization', '')).includes(q) ||
      safeLower(getMetaValue(p.meta, 'studyLevel', '')).includes(q)
    );
    return filtered.slice(0, limit).map(mapPost);
  },

  async getScholarshipsHome(limit: number = 4): Promise<ExtendedPost[]> {
    return this.getList('scholarship', limit);
  },

  async getFullyFundedScholarships(limit: number = 10): Promise<ExtendedPost[]> {
    "use cache";
    cacheTag("posts");
    cacheTag("posts-type-scholarship");
    cacheLife("hours");
    
    const all = await postRepository.getList('scholarship', 1000);
    const funded = all.filter(p => getMetaValue<boolean>(p.meta, 'isFullyFunded', false) === true || safeLower(getMetaValue<string>(p.meta, 'type', '')).includes('full'));
    return funded.slice(0, limit).map(mapPost);
  },

  async getScholarshipById(id: number): Promise<ExtendedPost | null> {
    return getScholarshipByIdInternal(id);
  },
};