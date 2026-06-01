// /types/cities.types.ts (UPDATE - Add all missing exports)

// Base City type (for list)
export interface City {
  id: number;
  name: string;
  slug: string;
  province: string | null;
  isPopular: boolean | null;
  status: boolean | null;
  createdAt: Date | null;
}

// Complete City Detail (for single page)
export interface CityDetail extends City {
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  population: number | null;
  area: string | null;
}

// City with stats (for list page)
export interface CityWithStats extends City {
  institutesCount: number;
  admissionsCount: number;
  resultsCount: number;
  newsCount: number;
  totalCount: number;
}

// Types for single city page data
export interface Institute {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  logo: string | null;
  isFeatured: boolean | null;
  programsCount: number;
  admissionsCount: number;
  resultsCount: number;
}

export interface Admission {
  id: number;
  slug: string;
  instituteName: string | null;
  instituteSlug: string | null;
  instituteLogo: string | null;
  year: number;
  session: string | null;
  status: string | null;
  expectedCloseDate: Date | null;
}

export interface Result {
  id: number;
  title: string;
  slug: string;
  instituteName: string | null;
  instituteSlug: string | null;
  year: number;
  resultDate: Date | null;
  isPopular: boolean | null;
}

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  isBreaking: boolean | null;
}

export interface CityStats {
  institutes: number;
  admissions: number;
  results: number;
  news: number;
}

export interface SeoMetadata {
  id: number;
  entityType: string;
  entityId: number;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  keywords: string | null;
}