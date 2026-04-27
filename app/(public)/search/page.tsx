// app/(public)/search/page.tsx
import { Metadata } from 'next';
import SearchContent from './SearchContent';

export const metadata: Metadata = {
  title: 'Search Results | NextID.pk',
  description: 'Search for educational content, news, admissions, and results on NextID.pk',
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  
  const q = typeof params.q === 'string' ? params.q : '';
  const page = typeof params.page === 'string' ? params.page : '1';

  return (
    <main className="min-h-screen bg-gray-50">
      <SearchContent searchParams={{ q, page }} />
    </main>
  );
}
