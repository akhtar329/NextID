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
📝 POSTS (Unified - All SEO merged here)
========================= */
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    
    // ==================== BASIC INFO ====================
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    type: varchar("type", { length: 50 }).notNull(),
    // values: 'admission', 'result', 'news', 'date_sheet', 'scholarship', 'blog', 'job'
    
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content"),
    excerpt: text("excerpt"),
    
    // ==================== AUTHOR ====================
    authorId: integer("author_id").references(() => adminUsers.id),
    authorName: varchar("author_name", { length: 100 }),
    
    // ==================== MEDIA ====================
    featuredImage: varchar("featured_image", { length: 500 }),
    actualImage: varchar("actual_image", { length: 500 }),
    galleryImages: jsonb("gallery_images"),
    
    // ==================== SEO - META TAGS (Core) ====================
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),
    focusKeyword: varchar("focus_keyword", { length: 100 }),
    canonicalUrl: text("canonical_url"),
    robots: varchar("robots", { length: 100 }).default("index, follow"),
    
    // ==================== SEO - OPEN GRAPH (Social Media) ====================
    ogTitle: varchar("og_title", { length: 255 }),
    ogDescription: text("og_description"),
    ogImage: varchar("og_image", { length: 500 }),
    ogType: varchar("og_type", { length: 50 }).default("article"),
    
    // ==================== SEO - TWITTER CARD ====================
    twitterCard: varchar("twitter_card", { length: 50 }).default("summary_large_image"),
    twitterTitle: varchar("twitter_title", { length: 255 }),
    twitterDescription: text("twitter_description"),
    twitterImage: varchar("twitter_image", { length: 500 }),
    
    // ==================== SEO - STRUCTURED DATA (JSON-LD) ====================
    schemaMarkup: jsonb("schema_markup"),
    
    // ==================== SEO - EXTRA BOOST FIELDS ====================
    // For better SEO ranking
    focusKeywordDensity: decimal("focus_keyword_density", { precision: 5, scale: 2 }),
    readabilityScore: integer("readability_score"), // 0-100
    seoScore: integer("seo_score"), // 0-100
    lastSeoAnalysis: timestamp("last_seo_analysis"),
    
    // For better indexing
    priority: decimal("priority", { precision: 2, scale: 1 }).default("0.5"),
    changefreq: varchar("changefreq", { length: 20 }).default("weekly"),
    
    // For breadcrumbs
    breadcrumbTitle: varchar("breadcrumb_title", { length: 255 }),
    
    // For redirects (301 handling)
    oldSlug: varchar("old_slug", { length: 500 }),
    
    // ==================== STATUS & FLAGS ====================
    status: varchar("status", { length: 20 }).default("published"),
    // 'draft', 'published', 'archived'
    
    isFeatured: boolean("is_featured").default(false),
    isPopular: boolean("is_popular").default(false),
    isBreaking: boolean("is_breaking").default(false),
    
    // ==================== STATS ====================
    viewCount: integer("view_count").default(0),
    
    // ==================== TYPE-SPECIFIC DATA ====================
    meta: jsonb("meta"),
    
    // ==================== TAGS ====================
    tags: jsonb("tags"),
    
    // ==================== TIMESTAMPS ====================
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
    
    // SEO Indexes
    idxPostsMetaTitle: index("idx_posts_meta_title").on(table.metaTitle),
    idxPostsFocusKeyword: index("idx_posts_focus_keyword").on(table.focusKeyword),
    idxPostsSeoScore: index("idx_posts_seo_score").on(table.seoScore),
    idxPostsOldSlug: index("idx_posts_old_slug").on(table.oldSlug),
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
    parentId: integer("parent_id"),
    
    userName: varchar("user_name", { length: 100 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }),
    userWebsite: varchar("user_website", { length: 255 }),
    
    comment: text("comment").notNull(),
    
    isApproved: boolean("is_approved").default(false),
    likes: integer("likes").default(0),
    
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 50 }),
    
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    idxCommentPost: index("idx_comment_post").on(table.postId),
    idxCommentApproved: index("idx_comment_approved").on(table.isApproved),
    idxCommentCreated: index("idx_comment_created").on(table.createdAt),
    idxCommentParent: index("idx_comment_parent").on(table.parentId),
  })
);