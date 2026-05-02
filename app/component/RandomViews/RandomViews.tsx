'use client';

import { useMemo } from 'react';

interface RandomViewsProps {
  newsId?: number;      // Optional - consistency ke liye
  slug?: string;        // Optional - consistency ke liye
  className?: string;   // Styling ke liye
  showIcon?: boolean;   // 👁️ icon dikhana hai ya nahi
}

export default function RandomViews({ newsId, slug, className = '', showIcon = true }: RandomViewsProps) {
  
  // useMemo with deterministic calculation - NO Math.random()
  const viewCount = useMemo(() => {
    // Consistent seed generation (same input = same output)
    let seed = 0;
    if (newsId) {
      seed = newsId;
    } else if (slug) {
      // Slug se deterministic hash banao
      seed = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    } else {
      // Default seed agar kuch nahi diya
      seed = 1000;
    }
    
    // Deterministic "random-looking" number (same news = same views always)
    // Ye formula har baar same input par same output dega
    let views = 100 + (seed % 5000) + ((seed * 7) % 3000);
    
    // 100 se 10,000 ke beech mein
    views = Math.min(views, 9999);
    views = Math.max(views, 100);
    
    // Format views
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return views.toString();
    }
  }, [newsId, slug]); // Only recalculate when newsId or slug changes
  
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {showIcon && <span>👁️</span>}
      <span>{viewCount}</span>
    </span>
  );
}