import { pgTable, index, foreignKey, serial, integer, varchar, text, boolean, timestamp, unique, jsonb, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const postComments = pgTable("post_comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	parentId: integer("parent_id"),
	userName: varchar("user_name", { length: 100 }).notNull(),
	userEmail: varchar("user_email", { length: 255 }),
	userWebsite: varchar("user_website", { length: 255 }),
	comment: text().notNull(),
	isApproved: boolean("is_approved").default(false),
	likes: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_comment_post").using("btree", table.postId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_comments_post_id_fkey"
		}).onDelete("cascade"),
]);

export const dateSheets = pgTable("date_sheets", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	boardId: integer("board_id"),
	instituteId: integer("institute_id"),
	examType: varchar("exam_type", { length: 100 }),
	examDate: timestamp("exam_date", { mode: 'string' }),
	year: integer().notNull(),
	officialLink: varchar("official_link", { length: 500 }),
	downloadLink: varchar("download_link", { length: 500 }),
	featuredImage: varchar("featured_image", { length: 500 }),
	pdfFile: varchar("pdf_file", { length: 500 }),
	isPopular: boolean("is_popular").default(false),
	viewCount: integer("view_count").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	description: text(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
}, (table) => [
	unique("date_sheets_slug_unique").on(table.slug),
]);

export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	slug: varchar({ length: 500 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text(),
	excerpt: text(),
	authorId: integer("author_id"),
	authorName: varchar("author_name", { length: 100 }),
	featuredImage: varchar("featured_image", { length: 500 }),
	galleryImages: jsonb("gallery_images"),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	focusKeyword: varchar("focus_keyword", { length: 100 }),
	status: varchar({ length: 20 }).default('published'),
	isFeatured: boolean("is_featured").default(false),
	isPopular: boolean("is_popular").default(false),
	isBreaking: boolean("is_breaking").default(false),
	viewCount: integer("view_count").default(0),
	meta: jsonb(),
	tags: jsonb(),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	actualImage: varchar("actual_image", { length: 500 }),
	metaKeywords: text("meta_keywords"),
	canonicalUrl: text("canonical_url"),
	robots: varchar({ length: 100 }).default('index, follow'),
	ogTitle: varchar("og_title", { length: 255 }),
	ogDescription: text("og_description"),
	ogImage: varchar("og_image", { length: 500 }),
	ogType: varchar("og_type", { length: 50 }).default('article'),
	twitterCard: varchar("twitter_card", { length: 50 }).default('summary_large_image'),
	twitterTitle: varchar("twitter_title", { length: 255 }),
	twitterDescription: text("twitter_description"),
	twitterImage: varchar("twitter_image", { length: 500 }),
	schemaMarkup: jsonb("schema_markup"),
	focusKeywordDensity: numeric("focus_keyword_density", { precision: 5, scale:  2 }),
	readabilityScore: integer("readability_score"),
	seoScore: integer("seo_score"),
	lastSeoAnalysis: timestamp("last_seo_analysis", { mode: 'string' }),
	priority: numeric({ precision: 2, scale:  1 }).default('0.5'),
	changefreq: varchar({ length: 20 }).default('weekly'),
	breadcrumbTitle: varchar("breadcrumb_title", { length: 255 }),
	oldSlug: varchar("old_slug", { length: 500 }),
}, (table) => [
	index("idx_posts_published_at").using("btree", table.publishedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_posts_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_posts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_posts_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [adminUsers.id],
			name: "posts_author_id_fkey"
		}),
	unique("posts_slug_key").on(table.slug),
]);

export const adminRoles = pgTable("admin_roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("admin_roles_name_unique").on(table.name),
]);

export const adminUsers = pgTable("admin_users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: text().notNull(),
	roleId: integer("role_id").notNull(),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	passwordResetToken: text("password_reset_token"),
	passwordResetExpires: timestamp("password_reset_expires", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [adminRoles.id],
			name: "admin_users_role_id_admin_roles_id_fk"
		}),
	unique("admin_users_email_unique").on(table.email),
]);

export const news = pgTable("news", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	excerpt: text(),
	programId: integer("program_id"),
	instituteId: integer("institute_id"),
	boardId: integer("board_id"),
	cityId: integer("city_id"),
	imageUrl: varchar("image_url", { length: 500 }),
	category: varchar({ length: 50 }),
	tags: jsonb(),
	source: varchar({ length: 255 }),
	sourceUrl: varchar("source_url", { length: 500 }),
	author: varchar({ length: 100 }),
	isFeatured: boolean("is_featured").default(false),
	isBreaking: boolean("is_breaking").default(false),
	status: boolean().default(true),
	viewCount: integer("view_count").default(0),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("news_slug_unique").on(table.slug),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: varchar({ length: 20 }).notNull(),
	title: text().notNull(),
	message: text().notNull(),
	read: boolean().default(false),
	link: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [adminUsers.id],
			name: "notifications_user_id_admin_users_id_fk"
		}).onDelete("cascade"),
]);

export const permissions = pgTable("permissions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("permissions_name_unique").on(table.name),
]);

export const seoMetadata = pgTable("seo_metadata", {
	id: serial().primaryKey().notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: integer("entity_id").notNull(),
	variation: varchar({ length: 50 }).default('default'),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	metaKeywords: text("meta_keywords"),
	canonicalUrl: text("canonical_url"),
	robots: varchar({ length: 100 }).default('index, follow'),
	schemaMarkup: jsonb("schema_markup"),
	ogTitle: varchar("og_title", { length: 255 }),
	ogDescription: text("og_description"),
	ogImage: varchar("og_image", { length: 500 }),
	ogType: varchar("og_type", { length: 50 }).default('website'),
	twitterCard: varchar("twitter_card", { length: 50 }).default('summary_large_image'),
	twitterTitle: varchar("twitter_title", { length: 255 }),
	twitterDescription: text("twitter_description"),
	twitterImage: varchar("twitter_image", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_seo_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	unique("seo_metadata_entity_variation").on(table.entityType, table.entityId, table.variation),
]);

export const userPermissions = pgTable("user_permissions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	permissionId: integer("permission_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [adminUsers.id],
			name: "user_permissions_user_id_admin_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "user_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
]);
