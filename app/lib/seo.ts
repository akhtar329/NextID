// app/lib/seo.ts
import type { Metadata } from "next";
import { db } from "@/app/lib/db";
import { seoMetadata } from "@/app/lib/schema";
import { eq, and } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

// ✅ Updated EntityType to include 'page'
export type EntityType = 'program' | 'city' | 'board' | 'institute' | 'admission' | 'news' | 'result' | 'dateSheet' | 'page';

type SEOProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  // For database SEO
  entityType?: EntityType;
  entityId?: number;
};

// Default values
const DEFAULT_TITLE = "Latest Education News, Results & Admissions in Pakistan | NextID";
const DEFAULT_DESCRIPTION = "Get latest education news, board results, test dates, admissions updates, and exam information across Pakistan.";
const DEFAULT_IMAGE = "/og-image.png";

/**
 * Fetch SEO metadata from database for a specific entity
 */
export async function fetchSeoMetadata(entityType: EntityType, entityId: number) {
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

/**
 * Generate SEO metadata - Priority: Database SEO > Provided Props > Defaults
 */
export async function generateSEO({
  title,
  description,
  path = "",
  image = DEFAULT_IMAGE,
  noIndex = false,
  entityType,
  entityId,
}: SEOProps = {}): Promise<Metadata> {
  let finalTitle = title || DEFAULT_TITLE;
  let finalDescription = description || DEFAULT_DESCRIPTION;
  let finalImage = image;
  let finalCanonical = path;
  let finalRobots = noIndex ? { index: false, follow: false } : { index: true, follow: true };
  
  // Fetch SEO from database if entityType and entityId are provided
  if (entityType && entityId) {
    const dbSeo = await fetchSeoMetadata(entityType, entityId);
    
    if (dbSeo) {
      // Database SEO takes priority
      finalTitle = dbSeo.metaTitle || finalTitle;
      finalDescription = dbSeo.metaDescription || finalDescription;
      finalImage = dbSeo.ogImage || finalImage;
      finalCanonical = dbSeo.canonicalUrl || path;
      
      // Handle robots from database
      if (dbSeo.robots) {
        finalRobots = {
          index: dbSeo.robots.includes('index'),
          follow: dbSeo.robots.includes('follow'),
        };
      }
    }
  }

  const url = `${BASE_URL}${finalCanonical}`;

  return {
    title: finalTitle,
    description: finalDescription,
    metadataBase: new URL(BASE_URL),

    alternates: {
      canonical: url,
    },

    robots: finalRobots,

    openGraph: {
      type: "website",
      url,
      title: finalTitle,
      description: finalDescription,
      siteName: "NextID",
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
    },
  };
}

/**
 * Save SEO metadata to database
 */
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
      // Update existing
      const [updated] = await db
        .update(seoMetadata)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(seoMetadata.entityType, entityType),
            eq(seoMetadata.entityId, entityId)
          )
        )
        .returning();
      
      return updated;
    } else {
      // Create new
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


/**
 * Synchronous version for static pages (home, about, contact, etc.)
 */

export function generateSEOClient({
  title,
  description,
  path = "",
  image = "/og-image.png",
  noIndex = false,
}: SEOProps = {}): Metadata {
  const url = `${BASE_URL}${path}`;
  const finalTitle = title || DEFAULT_TITLE;
  const finalDescription = description || DEFAULT_DESCRIPTION;

  return {
    title: finalTitle,
    description: finalDescription,
    metadataBase: new URL(BASE_URL),

    alternates: {
      canonical: url,
    },

    robots: {
      index: !noIndex,
      follow: !noIndex,
    },

    openGraph: {
      type: "website",
      url,
      title: finalTitle,
      description: finalDescription,
      siteName: "NextID",
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
    },
  };
}