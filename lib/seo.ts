// app/lib/seo.ts

import type { Metadata } from "next";
import { db } from "@/db/db";
import { seoMetadata } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cacheTag } from 'next/cache';

const BASE_URL = "https://www.nextid.pk";
const SITE_NAME = "NextID";

export type EntityType =
  | "program"
  | "city"
  | "board"
  | "institute"
  | "admission"
  | "news"
  | "result"
  | "dateSheet"
  | "page";

type SEOProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  alternates?: {
    canonical?: string;
  };
  entityType?: EntityType;
  entityId?: number;
  openGraph?: Metadata['openGraph'];
  twitter?: Metadata['twitter'];
};

type JsonLdType =
  | "WebSite"
  | "WebPage"
  | "Article"
  | "EducationalOrganization"
  | "Course"
  | "Event";

type JsonLdProps = {
  type: JsonLdType;
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumbs?: { name: string; url: string }[];
};

const DEFAULT_TITLE = "Latest Education News, Results & Admissions in Pakistan | NextID";
const DEFAULT_DESCRIPTION = "Get latest education news, board results, test dates, admissions updates, and exam information across Pakistan.";
const DEFAULT_IMAGE = "/og-image.png";
const DEFAULT_KEYWORDS = [
  "Pakistan education",
  "university admissions Pakistan",
  "board results Pakistan",
  "education news Pakistan",
  "NextID",
];

// ✅ Fetch SEO from DB - Using 'use cache' instead of unstable_cache
async function fetchSeoMetadata(entityType: EntityType, entityId: number) {
  'use cache';
  cacheTag('seo');
  
  try {
    const [metadata] = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, entityType),
          eq(seoMetadata.entityId, entityId)
        )
      )
      .limit(1);

    return metadata || null;
  } catch (error) {
    console.error(`Error fetching SEO metadata for ${entityType}/${entityId}:`, error);
    return null;
  }
}

// ✅ Parse robots string safely
function parseRobotsString(robots: string) {
  const noIndex = /\bnoindex\b/i.test(robots);
  const noFollow = /\bnofollow\b/i.test(robots);
  return {
    index: !noIndex,
    follow: !noFollow,
  };
}

// ✅ Generate JSON-LD Structured Data
export function generateJsonLd({
  type,
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  breadcrumbs,
}: JsonLdProps): object {
  const base = {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url,
    ...(image && { image: `${BASE_URL}${image}` }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
  };

  if (breadcrumbs && breadcrumbs.length > 0) {
    return {
      ...base,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      },
    };
  }

  return base;
}

// ✅ Website-level JSON-LD
export function generateWebsiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
      sameAs: [
        "https://www.facebook.com/nextidpk",
        "https://www.instagram.com/nextidpk",
        "https://twitter.com/nextidpk",
      ],
    },
  };
}

// ✅ Async generateSEO
export async function generateSEO({
  title,
  description,
  path = "",
  image = DEFAULT_IMAGE,
  noIndex = false,
  keywords = [],
  entityType,
  entityId,
}: SEOProps = {}): Promise<Metadata> {
  let finalTitle = title || DEFAULT_TITLE;
  let finalDescription = description || DEFAULT_DESCRIPTION;
  let finalImage = image;
  let finalCanonical = path;
  let finalRobots = noIndex
    ? { index: false, follow: false }
    : { index: true, follow: true };

  // ✅ DB SEO fetch
  if (entityType && entityId) {
    const dbSeo = await fetchSeoMetadata(entityType, entityId);

    if (dbSeo) {
      finalTitle = dbSeo.metaTitle || finalTitle;
      finalDescription = dbSeo.metaDescription || finalDescription;
      finalImage = dbSeo.ogImage || finalImage;
      finalCanonical = dbSeo.canonicalUrl || path;

      if (dbSeo.robots) {
        finalRobots = parseRobotsString(dbSeo.robots);
      }
    }
  }

  const url = `${BASE_URL}${finalCanonical}`;
  const finalKeywords = [...DEFAULT_KEYWORDS, ...keywords];

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    robots: {
      ...finalRobots,
      googleBot: {
        index: finalRobots.index,
        follow: finalRobots.follow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url,
      title: finalTitle,
      description: finalDescription,
      siteName: SITE_NAME,
      locale: "en_PK",
      images: [
        {
          url: `${BASE_URL}${finalImage}`,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [`${BASE_URL}${finalImage}`],
      site: "@nextidpk",
      creator: "@nextidpk",
    },
  };
}

// ✅ Sync generateSEOClient
export function generateSEOClient({
  title,
  description,
  path = "",
  image = DEFAULT_IMAGE,
  noIndex = false,
  keywords = [],
}: SEOProps = {}): Metadata {
  const url = `${BASE_URL}${path}`;
  const finalTitle = title || DEFAULT_TITLE;
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const finalKeywords = [...DEFAULT_KEYWORDS, ...keywords];

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url,
      title: finalTitle,
      description: finalDescription,
      siteName: SITE_NAME,
      locale: "en_PK",
      images: [
        {
          url: `${BASE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [`${BASE_URL}${image}`],
      site: "@nextidpk",
      creator: "@nextidpk",
    },
  };
}

// ✅ Save SEO to DB
export async function saveSeoMetadata(
  entityType: EntityType,
  entityId: number,
  data: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }
) {
  try {
    const existing = await fetchSeoMetadata(entityType, entityId);

    if (existing) {
      const [updated] = await db
        .update(seoMetadata)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(seoMetadata.entityType, entityType),
            eq(seoMetadata.entityId, entityId)
          )
        )
        .returning();

      return updated;
    } else {
      const [created] = await db
        .insert(seoMetadata)
        .values({
          entityType,
          entityId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return created;
    }
  } catch (error) {
    console.error(`Error saving SEO metadata for ${entityType}/${entityId}:`, error);
    return null;
  }
}

// ✅ Add cacheLife helper if not already defined
declare module 'next/cache' {
  export function cacheLife(profile: 'days' | 'hours' | 'minutes' | 'seconds'): void;
}