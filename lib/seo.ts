
import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/db";
import { posts } from "@/db/schema";
import { revalidatePostCache } from "@/lib/post-cache";

const BASE_URL = "https://www.nextid.pk";
const SITE_NAME = "NextID";

export type EntityType =
  | "post"
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
  slug?: string;
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
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

const DEFAULT_TITLE =
  "Latest Education News, Results & Admissions in Pakistan | NextID";

const DEFAULT_DESCRIPTION =
  "Get latest education news, board results, test dates, admissions updates, and exam information across Pakistan.";

const DEFAULT_IMAGE = "/og-image.png";

const DEFAULT_KEYWORDS = [
  "Pakistan education",
  "university admissions Pakistan",
  "board results Pakistan",
  "education news Pakistan",
  "NextID",
];

function resolveUrl(value: string): string {
  try {
    return new URL(value, BASE_URL).toString();
  } catch {
    return BASE_URL;
  }
}

function normalizePath(value: string): string {
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return value.startsWith("/") ? value : `/${value}`;
}

function uniqueKeywords(keywords: string[]): string[] {
  return Array.from(
    new Set(
      keywords
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    )
  );
}

function isValidPostId(postId: number): boolean {
  return Number.isSafeInteger(postId) && postId > 0;
}

// Fetch SEO metadata from Posts table
async function fetchSeoFromPost(postId: number) {
  if (!isValidPostId(postId)) {
    return null;
  }

  try {
    const db = getDb();

    const [post] = await db
      .select({
        metaTitle: posts.metaTitle,
        metaDescription: posts.metaDescription,
        metaKeywords: posts.metaKeywords,
        canonicalUrl: posts.canonicalUrl,
        robots: posts.robots,
        ogTitle: posts.ogTitle,
        ogDescription: posts.ogDescription,
        ogImage: posts.ogImage,
        twitterCard: posts.twitterCard,
        twitterTitle: posts.twitterTitle,
        twitterDescription: posts.twitterDescription,
        twitterImage: posts.twitterImage,
        focusKeyword: posts.focusKeyword,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return post ?? null;
  } catch (error) {
    console.error(
      `Error fetching SEO for post ${postId}:`,
      error
    );

    return null;
  }
}

// Parse robots string safely
function parseRobotsString(robots: string | null) {
  if (!robots) {
    return {
      index: true,
      follow: true,
    };
  }

  const noIndex = /\bnoindex\b/i.test(robots);
  const noFollow = /\bnofollow\b/i.test(robots);

  return {
    index: !noIndex,
    follow: !noFollow,
  };
}

// Generate JSON-LD Structured Data
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
    url: resolveUrl(url),
    ...(image && {
      image: resolveUrl(image),
    }),
    ...(datePublished && {
      datePublished,
    }),
    ...(dateModified && {
      dateModified,
    }),
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
        itemListElement: breadcrumbs.map(
          (crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: resolveUrl(crumb.url),
          })
        ),
      },
    };
  }

  return base;
}

// Website-level JSON-LD
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

// Generate SEO metadata
export async function generateSEO({
  title,
  description,
  path = "",
  image = DEFAULT_IMAGE,
  noIndex = false,
  keywords = [],
  entityId,
  alternates,
  openGraph,
  twitter,
}: SEOProps = {}): Promise<Metadata> {
  let finalTitle = title || DEFAULT_TITLE;
  let finalDescription =
    description || DEFAULT_DESCRIPTION;

  let finalImage = image;

  let finalCanonical = normalizePath(
    alternates?.canonical || path
  );

  let finalRobots = noIndex
    ? {
        index: false,
        follow: false,
      }
    : {
        index: true,
        follow: true,
      };

  let finalKeywords = [...DEFAULT_KEYWORDS, ...keywords];

  let finalOgTitle = finalTitle;
  let finalOgDescription = finalDescription;

  let finalTwitterTitle = finalTitle;
  let finalTwitterDescription = finalDescription;
  let finalTwitterImage = finalImage;
  let finalTwitterCard:
    | "summary"
    | "summary_large_image" = "summary_large_image";

  // Fetch SEO from Posts table
  if (entityId !== undefined) {
    const dbSeo = await fetchSeoFromPost(entityId);

    if (dbSeo) {
      finalTitle = dbSeo.metaTitle || finalTitle;

      finalDescription =
        dbSeo.metaDescription || finalDescription;

      finalImage = dbSeo.ogImage || finalImage;

      finalCanonical =
        dbSeo.canonicalUrl || finalCanonical;

      if (dbSeo.metaKeywords) {
        finalKeywords = [
          ...finalKeywords,
          ...dbSeo.metaKeywords.split(","),
        ];
      }

      if (dbSeo.focusKeyword) {
        finalKeywords.push(dbSeo.focusKeyword);
      }

      if (dbSeo.robots) {
        finalRobots = parseRobotsString(dbSeo.robots);
      }

      finalOgTitle =
        dbSeo.ogTitle || finalTitle;

      finalOgDescription =
        dbSeo.ogDescription || finalDescription;

      finalTwitterTitle =
        dbSeo.twitterTitle || finalOgTitle;

      finalTwitterDescription =
        dbSeo.twitterDescription || finalOgDescription;

      finalTwitterImage =
        dbSeo.twitterImage || finalImage;

      if (dbSeo.twitterCard === "summary") {
        finalTwitterCard = "summary";
      }
    }
  }

  // Explicit noIndex must always take priority
  if (noIndex) {
    finalRobots = {
      index: false,
      follow: false,
    };
  }

  const canonicalUrl = resolveUrl(finalCanonical);

  const imageUrl = resolveUrl(finalImage);
  const twitterImageUrl = resolveUrl(finalTwitterImage);

  finalKeywords = uniqueKeywords(finalKeywords);

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,

    metadataBase: new URL(BASE_URL),

    alternates: {
      canonical: canonicalUrl,
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
      ...openGraph,
      type: "website",
      url: canonicalUrl,
      title: openGraph?.title || finalOgTitle,
      description:
        openGraph?.description || finalOgDescription,
      siteName: SITE_NAME,
      locale: "en_PK",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: finalOgTitle,
        },
      ],
    },

    twitter: {
      ...twitter,
      card: finalTwitterCard,
      title: twitter?.title || finalTwitterTitle,
      description:
        twitter?.description || finalTwitterDescription,
      images: [twitterImageUrl],
      site: "@nextidpk",
      creator: "@nextidpk",
    },
  };
}

// Client-side SEO metadata
export function generateSEOClient({
  title,
  description,
  path = "",
  image = DEFAULT_IMAGE,
  noIndex = false,
  keywords = [],
  alternates,
  openGraph,
  twitter,
}: SEOProps = {}): Metadata {
  const finalTitle = title || DEFAULT_TITLE;

  const finalDescription =
    description || DEFAULT_DESCRIPTION;

  const finalKeywords = uniqueKeywords([
    ...DEFAULT_KEYWORDS,
    ...keywords,
  ]);

  const canonicalUrl = resolveUrl(
    alternates?.canonical || normalizePath(path)
  );

  const imageUrl = resolveUrl(image);

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,

    metadataBase: new URL(BASE_URL),

    alternates: {
      canonical: canonicalUrl,
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
      ...openGraph,
      type: "website",
      url: canonicalUrl,
      title: openGraph?.title || finalTitle,
      description:
        openGraph?.description || finalDescription,
      siteName: SITE_NAME,
      locale: "en_PK",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
    },

    twitter: {
      ...twitter,
      card: "summary_large_image",
      title: twitter?.title || finalTitle,
      description:
        twitter?.description || finalDescription,
      images: [imageUrl],
      site: "@nextidpk",
      creator: "@nextidpk",
    },
  };
}

// Save SEO metadata to Posts table
export async function saveSeoMetadata(
  postId: number,
  data: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    focusKeyword?: string;
  }
) {
  if (!isValidPostId(postId)) {
    return null;
  }

  try {
    const db = getDb();

    const [updated] = await db
      .update(posts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning({
        id: posts.id,
        type: posts.type,
        slug: posts.slug,
      });

    if (updated) {
      revalidatePostCache(updated.type, updated.slug);
    }

    return updated ?? null;
  } catch (error) {
    console.error(
      `Error saving SEO for post ${postId}:`,
      error
    );

    return null;
  }
}

// Get SEO for a post by slug
export async function getSeoBySlug(slug: string) {
  const cleanSlug = slug.trim();

  if (
    !cleanSlug ||
    cleanSlug.length > 255
  ) {
    return null;
  }

  try {
    const db = getDb();

    const [post] = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        type: posts.type,
        metaTitle: posts.metaTitle,
        metaDescription: posts.metaDescription,
        metaKeywords: posts.metaKeywords,
        canonicalUrl: posts.canonicalUrl,
        robots: posts.robots,
        ogTitle: posts.ogTitle,
        ogDescription: posts.ogDescription,
        ogImage: posts.ogImage,
        twitterTitle: posts.twitterTitle,
        twitterDescription: posts.twitterDescription,
        twitterImage: posts.twitterImage,
        focusKeyword: posts.focusKeyword,
        featuredImage: posts.featuredImage,
        excerpt: posts.excerpt,
        content: posts.content,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.slug, cleanSlug))
      .limit(1);

    if (!post) {
      return null;
    }

    return {
      ...post,

      metaDescription:
        post.metaDescription || post.excerpt,

      ogTitle:
        post.ogTitle || post.metaTitle || post.title,

      ogDescription:
        post.ogDescription ||
        post.metaDescription ||
        post.excerpt,

      ogImage:
        post.ogImage || post.featuredImage,

      twitterTitle:
        post.twitterTitle ||
        post.metaTitle ||
        post.title,

      twitterDescription:
        post.twitterDescription ||
        post.metaDescription ||
        post.excerpt,

      twitterImage:
        post.twitterImage ||
        post.ogImage ||
        post.featuredImage,
    };
  } catch (error) {
    console.error(
      `Error getting SEO for slug ${cleanSlug}:`,
      error
    );

    return null;
  }
}
