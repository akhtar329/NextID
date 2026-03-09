// app/(public)/search/page.tsx
// ✅ SIMPLE VERSION

"use client";

import { useSearchParams } from 'next/navigation';
import HeroSection from '@/app/component/sections/Home/HeroSection';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const category = searchParams.get('category') || '';
  
  return (
    <div>
      <HeroSection category={category || 'home'} />
      
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">Search Results</h2>
        <p className="text-gray-600 mb-6">
          Showing results for: "{query}" {city && `in ${city}`}
        </p>
        
        <p className="text-gray-500">Loading search results...</p>
      </div>
    </div>
  );
}