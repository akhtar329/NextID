import { revalidateTag } from "next/cache";

export type CachedPostType =
  | "admission"
  | "result"
  | "news"
  | "date_sheet"
  | "scholarship"
  | "job"
  | "blog";

const typeTags: Record<CachedPostType, string[]> = {
  admission: ["admissions-data", "admissions-metadata", "sitemap-admission"],
  result: ["results-all", "results-stats", "sitemap-result"],
  news: ["news-all", "news-related", "sitemap-news"],
  date_sheet: ["date-sheets-all", "date-sheets-stats", "sitemap-date_sheet"],
  scholarship: ["scholarships-all", "scholarships-stats", "sitemap-scholarship"],
  job: ["jobs-all", "jobs-stats", "sitemap-job"],
  blog: ["blogs-all", "blogs-stats", "blog-related", "sitemap-blog"],
};

export function getPostCacheTags(type?: string, slug?: string): string[] {
  const tags = new Set([
    "posts",
    "homepage",
    "sidebar-data",
    "sidebar-widgets",
    "search-all-posts",
    "seo",
  ]);

  if (slug) {
    tags.add(`post-${slug}`);
    tags.add(`detail-${slug}`);
  }

  if (type && type in typeTags) {
    const postType = type as CachedPostType;
    tags.add(`posts-type-${postType}`);
    tags.add(`list-${postType}`);
    tags.add(`count-${postType}`);
    for (const tag of typeTags[postType]) {
      tags.add(tag);
    }

    if (slug) {
      const detailPrefix: Record<CachedPostType, string> = {
        admission: "admission-detail",
        result: "result-detail",
        news: "news-detail",
        date_sheet: "date-sheet-detail",
        scholarship: "scholarship-detail",
        job: "job-detail",
        blog: "blog-detail",
      };
      tags.add(`${detailPrefix[postType]}-${slug}`);
    }
  }

  return [...tags];
}

export function revalidatePostCache(type?: string, slug?: string): void {
  for (const tag of getPostCacheTags(type, slug)) {
    revalidateTag(tag, "default");
  }
}
