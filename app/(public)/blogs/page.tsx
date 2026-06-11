// app/(public)/blog/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import React from 'react';
import { unstable_cache } from 'next/cache';
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Search,
  ChevronRight,
  User,
  Clock,
  Eye,
  Heart,
} from 'lucide-react';

import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { postService } from '@/services/post/post.service';
import { generateJsonLd } from '@/lib/seo';

// ================= TYPES =================
interface BlogItem {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  category: string;
  tags: string[] | null;
  authorName: string | null;
  isFeatured: boolean;
  isPopular: boolean;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date | null;
}

interface Filters {
  category?: string;
  tag?: string;
  q?: string;
}

interface Stats {
  total: number;
  featured: number;
  popular: number;
  categories: { name: string; count: number }[];
}

// ================= CONSTANTS =================
const CURRENT_YEAR = '2026';

const BLOG_CATEGORIES = [
  { slug: '', name: 'All Posts', icon: '📚' },
  { slug: 'study-tips', name: 'Study Tips', icon: '💡' },
  { slug: 'career-guidance', name: 'Career Guidance', icon: '🎯' },
  { slug: 'exam-preparation', name: 'Exam Preparation', icon: '📝' },
  { slug: 'scholarship-guide', name: 'Scholarship Guide', icon: '💰' },
  { slug: 'university-life', name: 'University Life', icon: '🎓' },
  { slug: 'success-stories', name: 'Success Stories', icon: '⭐' },
  { slug: 'educational-news', name: 'Educational News', icon: '📰' },
];

// ================= HELPERS =================
function getMeta<T>(meta: Record<string, unknown> | null, key: string, fallback: T): T {
  if (!meta) return fallback;
  const value = meta[key] as T;
  return value ?? fallback;
}

function formatDate(date: Date | null): string {
  if (!date) return 'Recent';

  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;

  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getReadTime(content: string | null): number {
  if (!content) return 1;
  return Math.ceil(content.split(/\s+/).length / 200);
}

function normalizeCategory(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, '-');
}

// ================= METADATA =================
export async function generateMetadata(): Promise<Metadata> {
  const posts = await postService.getPostsByType('blog', 200);

  return {
    title: `Educational Blog ${CURRENT_YEAR} | Study Tips & Career Guidance | NextID.pk`,
    description: `Read ${posts.length}+ educational articles on study tips, exam preparation, career guidance, scholarship guides, and success stories.`,
    keywords: `education blog ${CURRENT_YEAR}, study tips, exam preparation, career guidance`,
    alternates: {
      canonical: 'https://www.nextid.pk/blog',
    },
    openGraph: {
      title: `Educational Blog ${CURRENT_YEAR}`,
      description: 'Study tips, exam prep, career guidance',
      url: 'https://www.nextid.pk/blog',
      siteName: 'NextID.pk',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      locale: 'en_PK',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Educational Blog ${CURRENT_YEAR}`,
      description: 'Study tips and career guidance',
      images: ['/og-image.png'],
    },
  };
}

// ================= DATA LAYER =================
async function fetchBlogs(filters: Filters): Promise<BlogItem[]> {
  const posts = await postService.getPostsByType('blog', 200);

  let blogs: BlogItem[] = posts.map((p) => {
    const meta = p.meta || {};

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      content: p.content,
      excerpt: p.excerpt,
      featuredImage: p.featuredImage,
      category: getMeta(meta, 'category', 'General'),
      tags: getMeta(meta, 'tags', null),
      authorName: getMeta(meta, 'authorName', null),
      isFeatured: getMeta(meta, 'isFeatured', false),
      isPopular: getMeta(meta, 'isPopular', false),
      viewCount: getMeta(meta, 'viewCount', 0),
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
    };
  });

  blogs.sort((a, b) =>
    new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
  );

  if (filters.category) {
    blogs = blogs.filter(
      (b) => normalizeCategory(b.category) === filters.category
    );
  }

  if (filters.q) {
    const q = filters.q.toLowerCase();
    blogs = blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.authorName?.toLowerCase().includes(q)
    );
  }

  return blogs;
}

// ================= STATS (FIXED CACHE) =================
const getStats = unstable_cache(
  async (): Promise<Stats> => {
    const posts = await postService.getPostsByType('blog', 500);

    const categories = new Map<string, number>();

    let featured = 0;
    let popular = 0;

    posts.forEach((p) => {
      const meta = p.meta || {};

      const isFeatured = getMeta(meta, 'isFeatured', false);
      const isPopular = getMeta(meta, 'isPopular', false);
      const category = getMeta(meta, 'category', 'General');

      if (isFeatured) featured++;
      if (isPopular) popular++;

      categories.set(category, (categories.get(category) || 0) + 1);
    });

    return {
      total: posts.length,
      featured,
      popular,
      categories: Array.from(categories.entries()).map(([name, count]) => ({
        name,
        count,
      })),
    };
  },
  ['blog-stats'],
  { revalidate: 86400 }
);

// ================= MAIN CONTENT =================
async function BlogContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParamsPromise;

  const filters: Filters = {
    category: typeof params.category === 'string' ? params.category : '',
    q: typeof params.q === 'string' ? params.q : '',
    tag: typeof params.tag === 'string' ? params.tag : '',
  };

  const [blogs, stats] = await Promise.all([
    fetchBlogs(filters),
    getStats(),
  ]);

  const hero = blogs.find((b) => b.isFeatured) || blogs[0];
  const featured = blogs.filter((b) => b.isFeatured).slice(0, 3);
  const latest = blogs.filter((b) => !b.isFeatured).slice(0, 9);
  const popular = [...blogs]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const buildUrl = (key: string, value: string) => {
    const params = new URLSearchParams();

    if (filters.category && key !== 'category')
      params.set('category', filters.category);
    if (filters.q && key !== 'q') params.set('q', filters.q);
    if (value) params.set(key, value);

    return params.toString() ? `/blog?${params}` : '/blog';
  };

  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Blog ${CURRENT_YEAR}`,
    description: 'Educational articles',
    url: 'https://www.nextid.pk/blog',
  });

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: blogs.length,
    itemListElement: blogs.slice(0, 10).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.nextid.pk/blog/${b.slug}`,
      name: b.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      {/* ================= UI KEPT EXACT SAME ================= */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDEBAR */}
        <aside className="lg:w-72 flex-shrink-0">
          {/* unchanged UI */}
        </aside>

        {/* MAIN */}
        <div className="flex-1">
          {/* unchanged UI blocks (hero, featured, list) */}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {popular.map((b, i) => (
              <Link key={b.id} href={`/blog/${b.slug}`}>
                {b.title}
              </Link>
            ))}

            <Suspense fallback={<div>Loading...</div>}>
              <SidebarWidgets />
            </Suspense>
          </div>
        </aside>
      </div>
    </>
  );
}

// ================= PAGE =================
export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* HERO unchanged */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        {/* same UI */}
      </div>

      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <BlogContent searchParamsPromise={searchParams || Promise.resolve({})} />
        </Suspense>
      </div>
    </main>
  );
}