export const POST_TYPES = [
  "admission",
  "result",
  "news",
  "date_sheet",
  "scholarship",
  "blog",
  "job",
] as const;

export type PostType = (typeof POST_TYPES)[number];

/* =========================
🧠 META TYPE (FIXED)
========================= */
export type PostMeta = Record<string, unknown>;

/* =========================
📦 POST TYPE
========================= */
export interface Post {
  id: number;
  slug: string;
  type: PostType;

  title: string;
  content: string | null;
  excerpt: string | null;

  authorId: number | null;
  authorName: string | null;

  featuredImage: string | null;
  actualImage?: string | null;

  isFeatured: boolean | null;
  isBreaking: boolean | null;
  isPopular: boolean | null;

  viewCount: number | null;

  meta: PostMeta | null;

  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}