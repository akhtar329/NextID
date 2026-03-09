// app/types/types.ts
export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  source: string | null;
  author: string | null;
  isBreaking: boolean | null;
  views: number | null;
  publishedAt: Date | null;
}

export interface TrendingItem {
  id: number;
  title: string;
  slug: string;
  views: number | null;
  publishedAt: Date | null;
}

export interface Category {
  name: string;
  slug: string;
  count: number;
  icon: string;
}

export function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

export function formatDate(date: Date | null) {
  if (!date) return '';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  
  return d.toLocaleDateString('en-PK', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}