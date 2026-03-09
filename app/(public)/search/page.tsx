// app/(public)/search/page.tsx

import { Suspense } from 'react';
import HeroSection from '@/app/component/sections/Home/HeroSection';
import SearchContent from './SearchContent';

export default function SearchPage() {
  return (
    <div>
      <HeroSection category="home" />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-2">Search Results</h2>
          <p className="text-gray-500">Loading search results...</p>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}