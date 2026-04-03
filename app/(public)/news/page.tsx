import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { news } from '@/app/lib/schema';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';
import type { NewsItem, Category } from '@/app/types/types';

export const metadata: Metadata = {
  title: 'Education News Pakistan 2026 | Latest Updates | NextID.pk',
  description: 'Stay updated with latest education news in Pakistan: admissions, results, scholarships, board announcements & university updates.',
  alternates: { canonical: 'https://www.nextid.pk/news' },
};

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getReadTime(content: string | null): string {
  if (!content) return '1 min read';
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

async function getNews() {
  const conditions = [eq(news.status, true)];
  const data = await db.select({
    id: news.id,
    title: news.title,
    slug: news.slug,
    excerpt: news.excerpt,
    content: news.content,
    imageUrl: news.imageUrl,
    publishedAt: news.publishedAt,
    isBreaking: news.isBreaking,
  }).from(news).where(and(...conditions)).orderBy(desc(news.isBreaking), desc(news.publishedAt));

  return data as NewsItem[];
}

async function getCategoryCounts(): Promise<Category[]> {
  return [
    { name: 'Admissions', slug: 'admissions', count: 156, icon: '' },
    { name: 'Results', slug: 'results', count: 243, icon: '' },
    { name: 'Universities', slug: 'universities', count: 198, icon: '' },
    { name: 'Boards', slug: 'boards', count: 167, icon: '' },
    { name: 'Cities', slug: 'cities', count: 120, icon: '' },
    { name: 'Programs', slug: 'programs', count: 110, icon: '' },
  ];
}

function NewsCard({ item, isFeatured = false }: { item: NewsItem; isFeatured?: boolean }) {
  if (isFeatured) {
    return (
      <Link href={`/news/${item.slug}`} className="block mb-6 rounded-xl shadow-lg overflow-hidden">
        <img src={item.imageUrl || '/placeholder.jpg'} alt={item.title} className="w-full h-64 object-cover" />
        <div className="p-4">
          <h2 className="font-bold text-2xl mb-2">{item.title}</h2>
          <p className="text-gray-700 line-clamp-2">{item.excerpt}</p>
        </div>
      </Link>
    );
  }
  return (
    <Link href={`/news/${item.slug}`} className="block rounded-lg border p-3 hover:shadow-md">
      <h3 className="font-semibold text-md mb-1 line-clamp-2">{item.title}</h3>
      <p className="text-gray-600 text-sm line-clamp-2">{item.excerpt}</p>
      <span className="text-xs text-gray-400 mt-1 block">{formatDate(item.publishedAt)} • {getReadTime(item.content)}</span>
    </Link>
  );
}

export default async function NewsPage() {
  const allNews = await getNews();
  const categories = await getCategoryCounts();

  const featured = allNews[0];
  const latestSix = allNews.slice(1, 7);

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Featured News */}
      {featured && <NewsCard item={featured} isFeatured={true} />}

      {/* Latest 6 News in 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {latestSix.map(n => <NewsCard key={n.id} item={n} />)}
      </div>

      {/* Pagination Placeholder */}
      <div className="flex justify-center mb-8">
        <button className="px-4 py-2 border rounded hover:bg-gray-100">Previous</button>
        <button className="px-4 py-2 border rounded ml-2 hover:bg-gray-100">Next</button>
      </div>

      {/* Education Sections - Newspaper Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.slug} className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="font-bold mb-2">{cat.name}</h4>
            <p className="text-gray-600 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Latest {cat.name} news and updates from Pakistan's education sector.</p>
          </div>
        ))}
      </div>
    </main>
  );
}
