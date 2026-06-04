// db/schema.ts

import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
  unique,
  index,
  decimal,
} from "drizzle-orm/pg-core";

/* =========================
👤 ADMIN ROLES
========================= */
export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
👤 ADMIN USERS
========================= */
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  roleId: integer("role_id").notNull().references(() => adminRoles.id),
  lastLogin: timestamp("last_login"),
  status: boolean("status").default(true),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
🔐 PERMISSIONS
========================= */
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
🔐 USER PERMISSIONS
========================= */
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
🔑 SESSIONS
========================= */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => adminUsers.id),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
🔔 NOTIFICATIONS
========================= */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 20 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
🔍 SEO METADATA
========================= */
export const seoMetadata = pgTable("seo_metadata", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id").notNull(),
  variation: varchar("variation", { length: 50 }).default("default"),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  robots: varchar("robots", { length: 100 }).default("index, follow"),
  schemaMarkup: jsonb("schema_markup"),
  ogTitle: varchar("og_title", { length: 255 }),
  ogDescription: text("og_description"),
  ogImage: varchar("og_image", { length: 500 }),
  ogType: varchar("og_type", { length: 50 }).default("website"),
  twitterCard: varchar("twitter_card", { length: 50 }).default("summary_large_image"),
  twitterTitle: varchar("twitter_title", { length: 255 }),
  twitterDescription: text("twitter_description"),
  twitterImage: varchar("twitter_image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueEntityVariation: unique("seo_metadata_entity_variation").on(
    table.entityType,
    table.entityId,
    table.variation
  ),
  idxEntity: index("idx_seo_entity").on(table.entityType, table.entityId),
}));

/* =========================
📝 POSTS (UNIFIED TABLE - Sab kuch yahan)
========================= */
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    
    // Basic Info
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    type: varchar("type", { length: 50 }).notNull(),
    // type values: 'admission', 'result', 'news', 'date_sheet', 'scholarship', 'blog', 'job'
    
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content"),
    excerpt: text("excerpt"),
    
    // Author (relation to adminUsers)
    authorId: integer("author_id").references(() => adminUsers.id),
    authorName: varchar("author_name", { length: 100 }),
    
    // Media
    featuredImage: varchar("featured_image", { length: 500 }),
    actualImage: varchar("actual_image", { length: 500 }), // ✅ Added for image mapping
    galleryImages: jsonb("gallery_images"),
    
    // SEO
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    focusKeyword: varchar("focus_keyword", { length: 100 }),
    
    // Status & Flags
    status: varchar("status", { length: 20 }).default("published"),
    // 'draft', 'published', 'archived'
    
    isFeatured: boolean("is_featured").default(false),
    isPopular: boolean("is_popular").default(false),
    isBreaking: boolean("is_breaking").default(false),
    
    // Stats
    viewCount: integer("view_count").default(0),
    
    // Type-specific data (JSON)
    meta: jsonb("meta"),
    
    // Tags (JSON array)
    tags: jsonb("tags"),
    
    // Timestamps
    publishedAt: timestamp("published_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Indexes for better performance
    idxPostsSlug: index("idx_posts_slug").on(table.slug),
    idxPostsType: index("idx_posts_type").on(table.type),
    idxPostsStatus: index("idx_posts_status").on(table.status),
    idxPostsPublishedAt: index("idx_posts_published_at").on(table.publishedAt),
    idxPostsFeatured: index("idx_posts_featured").on(table.isFeatured),
    idxPostsPopular: index("idx_posts_popular").on(table.isPopular),
    idxPostsAuthor: index("idx_posts_author").on(table.authorId),
    idxPostsCreatedAt: index("idx_posts_created_at").on(table.createdAt),
  })
);

/* =========================
💬 POST COMMENTS
========================= */
export const postComments = pgTable(
  "post_comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    parentId: integer("parent_id"), // For nested replies (NULL = top-level comment)
    
    // User info
    userName: varchar("user_name", { length: 100 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }),
    userWebsite: varchar("user_website", { length: 255 }),
    
    // Comment content
    comment: text("comment").notNull(),
    
    // Moderation
    isApproved: boolean("is_approved").default(false),
    likes: integer("likes").default(0),
    
    // Tracking
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 50 }),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Indexes
    idxCommentPost: index("idx_comment_post").on(table.postId),
    idxCommentApproved: index("idx_comment_approved").on(table.isApproved),
    idxCommentCreated: index("idx_comment_created").on(table.createdAt),
    idxCommentParent: index("idx_comment_parent").on(table.parentId),
  })
);

/* =========================
🔀 REDIRECTS
========================= */
export const redirects = pgTable("redirects", {
  id: serial("id").primaryKey(),
  fromPath: varchar("from_path", { length: 500 }).notNull().unique(),
  toPath: varchar("to_path", { length: 500 }).notNull(),
  statusCode: integer("status_code").notNull().default(301),
  hitCount: integer("hit_count").default(0),
  lastHit: timestamp("last_hit"),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
🗺️ SITEMAP ENTRIES
========================= */
export const sitemapEntries = pgTable("sitemap_entries", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 500 }).notNull().unique(),
  changeFreq: varchar("change_freq", { length: 20 }).default("weekly"),
  priority: decimal("priority", { precision: 2, scale: 1 }).default("0.5"),
  lastModified: timestamp("last_modified").defaultNow(),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});