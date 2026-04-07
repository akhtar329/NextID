import { pgTable, foreignKey, unique, serial, varchar, integer, timestamp, boolean, text, jsonb, numeric, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



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
	foreignKey({
			columns: [table.boardId],
			foreignColumns: [boards.id],
			name: "date_sheets_board_id_boards_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "date_sheets_institute_id_institutes_id_fk"
		}).onDelete("set null"),
	unique("date_sheets_slug_unique").on(table.slug),
]);

export const blogPosts = pgTable("blog_posts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	excerpt: text(),
	authorId: integer("author_id"),
	authorName: varchar("author_name", { length: 100 }),
	focusKeyword: varchar("focus_keyword", { length: 100 }),
	programId: integer("program_id"),
	categoryId: integer("category_id"),
	featuredImage: varchar("featured_image", { length: 500 }),
	category: varchar({ length: 50 }),
	tags: jsonb(),
	viewCount: integer("view_count").default(0),
	readingTime: integer("reading_time"),
	isFeatured: boolean("is_featured").default(false),
	status: varchar({ length: 20 }).default('draft'),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [adminUsers.id],
			name: "blog_posts_author_id_admin_users_id_fk"
		}),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "blog_posts_program_id_programs_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "blog_posts_category_id_categories_id_fk"
		}),
	unique("blog_posts_slug_unique").on(table.slug),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	description: text(),
	icon: varchar({ length: 100 }),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("categories_name_unique").on(table.name),
	unique("categories_slug_unique").on(table.slug),
]);

export const cities = pgTable("cities", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	province: varchar({ length: 100 }),
	description: text(),
	educationOverview: text("education_overview"),
	imageUrl: varchar("image_url", { length: 500 }),
	thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	population: integer(),
	area: varchar({ length: 50 }),
	totalInstitutes: integer("total_institutes").default(0),
	isPopular: boolean("is_popular").default(false),
	isCapital: boolean("is_capital").default(false),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("cities_slug_unique").on(table.slug),
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

export const careerPaths = pgTable("career_paths", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	jobTitle: varchar("job_title", { length: 150 }).notNull(),
	description: text(),
	startingSalaryMin: integer("starting_salary_min"),
	startingSalaryMax: integer("starting_salary_max"),
	midLevelSalaryMin: integer("mid_level_salary_min"),
	midLevelSalaryMax: integer("mid_level_salary_max"),
	topCompanies: jsonb("top_companies"),
	growthPotential: varchar("growth_potential", { length: 50 }),
	marketDemand: varchar("market_demand", { length: 50 }),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	slug: varchar({ length: 200 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "career_paths_program_id_programs_id_fk"
		}).onDelete("cascade"),
	unique("career_paths_slug_unique").on(table.slug),
]);

export const boards = pgTable("boards", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	cityId: integer("city_id"),
	description: text(),
	website: varchar({ length: 255 }),
	establishedYear: integer("established_year"),
	contactEmail: varchar("contact_email", { length: 255 }),
	contactPhone: varchar("contact_phone", { length: 50 }),
	address: text(),
	logo: varchar({ length: 500 }),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: "boards_city_id_cities_id_fk"
		}),
	unique("boards_slug_unique").on(table.slug),
]);

export const admissions = pgTable("admissions", {
	id: serial().primaryKey().notNull(),
	instituteId: integer("institute_id").notNull(),
	name: varchar({ length: 500 }).notNull(),
	slug: varchar({ length: 500 }).notNull(),
	year: integer().notNull(),
	session: varchar({ length: 50 }),
	status: varchar({ length: 50 }).notNull(),
	openDate: timestamp("open_date", { mode: 'string' }),
	closeDate: timestamp("close_date", { mode: 'string' }),
	expectedOpenDate: timestamp("expected_open_date", { mode: 'string' }),
	expectedCloseDate: timestamp("expected_close_date", { mode: 'string' }),
	eligibility: text(),
	howToApply: text("how_to_apply"),
	requiredDocuments: jsonb("required_documents"),
	feeStructure: jsonb("fee_structure"),
	meritInfo: text("merit_info"),
	note: text(),
	officialLink: varchar("official_link", { length: 255 }),
	applicationLink: varchar("application_link", { length: 255 }),
	featuredImage: varchar("featured_image", { length: 500 }),
	galleryImages: jsonb("gallery_images"),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "admissions_institute_id_institutes_id_fk"
		}),
	unique("admissions_slug_unique").on(table.slug),
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

export const dailyStats = pgTable("daily_stats", {
	id: serial().primaryKey().notNull(),
	date: varchar({ length: 10 }).notNull(),
	totalVisitors: integer("total_visitors").default(0),
	newVisitors: integer("new_visitors").default(0),
	returningVisitors: integer("returning_visitors").default(0),
	totalPageViews: integer("total_page_views").default(0),
	avgTimeOnSite: integer("avg_time_on_site").default(0),
	bounceRate: integer("bounce_rate").default(0),
	topPages: jsonb("top_pages"),
	deviceBreakdown: jsonb("device_breakdown"),
	browserBreakdown: jsonb("browser_breakdown"),
	osBreakdown: jsonb("os_breakdown"),
	countryBreakdown: jsonb("country_breakdown"),
	cityBreakdown: jsonb("city_breakdown"),
	avgLoadTime: integer("avg_load_time").default(0),
	avgApiLatency: integer("avg_api_latency").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("daily_stats_date_unique").on(table.date),
]);

export const levels = pgTable("levels", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	fullForm: varchar("full_form", { length: 255 }),
	description: text(),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("levels_name_unique").on(table.name),
	unique("levels_slug_unique").on(table.slug),
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
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "news_program_id_programs_id_fk"
		}),
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "news_institute_id_institutes_id_fk"
		}),
	foreignKey({
			columns: [table.boardId],
			foreignColumns: [boards.id],
			name: "news_board_id_boards_id_fk"
		}),
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: "news_city_id_cities_id_fk"
		}),
	unique("news_slug_unique").on(table.slug),
]);

export const locationCache = pgTable("location_cache", {
	id: serial().primaryKey().notNull(),
	ip: varchar({ length: 50 }).notNull(),
	country: varchar({ length: 100 }),
	countryCode: varchar("country_code", { length: 10 }),
	city: varchar({ length: 100 }),
	region: varchar({ length: 100 }),
	latitude: varchar({ length: 50 }),
	longitude: varchar({ length: 50 }),
	timezone: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("location_cache_ip_unique").on(table.ip),
]);

export const institutes = pgTable("institutes", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	ownership: varchar({ length: 50 }),
	cityId: integer("city_id").notNull(),
	address: text(),
	description: text(),
	about: text(),
	facilities: jsonb(),
	website: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	accreditations: jsonb(),
	establishedYear: integer("established_year"),
	logo: varchar({ length: 500 }),
	featuredImage: varchar("featured_image", { length: 500 }),
	galleryImages: jsonb("gallery_images"),
	totalPrograms: integer("total_programs").default(0),
	totalAdmissions: integer("total_admissions").default(0),
	ranking: integer(),
	isFeatured: boolean("is_featured").default(false),
	isVerified: boolean("is_verified").default(false),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: "institutes_city_id_cities_id_fk"
		}),
	unique("institutes_slug_unique").on(table.slug),
]);

export const programComparisons = pgTable("program_comparisons", {
	id: serial().primaryKey().notNull(),
	program1Id: integer("program_1_id").notNull(),
	program2Id: integer("program_2_id").notNull(),
	slug: varchar({ length: 255 }).notNull(),
	comparisonOverview: text("comparison_overview"),
	keyDifferences: jsonb("key_differences"),
	similarities: text(),
	whichToChoose: text("which_to_choose"),
	viewCount: integer("view_count").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.program1Id],
			foreignColumns: [programs.id],
			name: "program_comparisons_program_1_id_programs_id_fk"
		}),
	foreignKey({
			columns: [table.program2Id],
			foreignColumns: [programs.id],
			name: "program_comparisons_program_2_id_programs_id_fk"
		}),
	unique("unique_program_comparison").on(table.program1Id, table.program2Id),
	unique("program_comparisons_slug_unique").on(table.slug),
]);

export const programCurriculum = pgTable("program_curriculum", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	semester: integer().notNull(),
	courseName: varchar("course_name", { length: 255 }).notNull(),
	courseCode: varchar("course_code", { length: 50 }),
	creditHours: integer("credit_hours"),
	description: text(),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_curriculum_program_id_programs_id_fk"
		}).onDelete("cascade"),
]);

export const programFaqs = pgTable("program_faqs", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	question: text().notNull(),
	answer: text().notNull(),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_faqs_program_id_programs_id_fk"
		}).onDelete("cascade"),
]);

export const programPrerequisites = pgTable("program_prerequisites", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	requirement: text().notNull(),
	isRequired: boolean("is_required").default(true),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_prerequisites_program_id_programs_id_fk"
		}).onDelete("cascade"),
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

export const programOfferings = pgTable("program_offerings", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	degreeId: integer("degree_id").notNull(),
	instituteId: integer("institute_id").notNull(),
	customName: varchar("custom_name", { length: 255 }),
	duration: varchar({ length: 50 }),
	feeRange: varchar("fee_range", { length: 100 }),
	specificEligibility: text("specific_eligibility"),
	additionalInfo: text("additional_info"),
	specializations: jsonb(),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_offering_institute").using("btree", table.instituteId.asc().nullsLast().op("int4_ops")),
	index("idx_offering_program").using("btree", table.programId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_offerings_program_id_programs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.degreeId],
			foreignColumns: [degrees.id],
			name: "program_offerings_degree_id_degrees_id_fk"
		}),
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "program_offerings_institute_id_institutes_id_fk"
		}),
	unique("unique_program_degree_institute").on(table.programId, table.degreeId, table.instituteId),
]);

export const pageViews = pgTable("page_views", {
	id: serial().primaryKey().notNull(),
	visitorId: varchar("visitor_id", { length: 100 }).notNull(),
	sessionId: varchar("session_id", { length: 100 }).notNull(),
	referrerDomain: varchar("referrer_domain", { length: 100 }),
	pagePath: varchar("page_path", { length: 255 }).notNull(),
	pageTitle: varchar("page_title", { length: 255 }),
	deviceType: varchar("device_type", { length: 50 }),
	browser: varchar({ length: 50 }),
	os: varchar({ length: 50 }),
	country: varchar({ length: 100 }),
	countryCode: varchar("country_code", { length: 10 }),
	city: varchar({ length: 100 }),
	region: varchar({ length: 100 }),
	latitude: varchar({ length: 50 }),
	longitude: varchar({ length: 50 }),
	timezone: varchar({ length: 100 }),
	loadTime: integer("load_time"),
	apiLatency: integer("api_latency"),
	referrer: varchar({ length: 500 }),
	userId: integer("user_id"),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [adminUsers.id],
			name: "page_views_user_id_admin_users_id_fk"
		}),
]);

export const programReviews = pgTable("program_reviews", {
	id: serial().primaryKey().notNull(),
	offeringId: integer("offering_id").notNull(),
	reviewerName: varchar("reviewer_name", { length: 100 }),
	reviewerBatch: varchar("reviewer_batch", { length: 50 }),
	reviewerPhoto: varchar("reviewer_photo", { length: 500 }),
	rating: integer().notNull(),
	title: varchar({ length: 255 }),
	review: text().notNull(),
	pros: jsonb(),
	cons: jsonb(),
	helpfulCount: integer("helpful_count").default(0),
	isVerified: boolean("is_verified").default(false),
	isApproved: boolean("is_approved").default(false),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.offeringId],
			foreignColumns: [programOfferings.id],
			name: "program_reviews_offering_id_program_offerings_id_fk"
		}),
]);

export const redirects = pgTable("redirects", {
	id: serial().primaryKey().notNull(),
	fromPath: varchar("from_path", { length: 500 }).notNull(),
	toPath: varchar("to_path", { length: 500 }).notNull(),
	statusCode: integer("status_code").default(301).notNull(),
	hitCount: integer("hit_count").default(0),
	lastHit: timestamp("last_hit", { mode: 'string' }),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("redirects_from_path_unique").on(table.fromPath),
]);

export const scholarships = pgTable("scholarships", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	instituteId: integer("institute_id"),
	organizationName: varchar("organization_name", { length: 255 }),
	description: text(),
	eligibility: text(),
	coverage: text(),
	amount: varchar({ length: 100 }),
	programIds: jsonb("program_ids"),
	applicationDeadline: timestamp("application_deadline", { mode: 'string' }),
	year: integer().notNull(),
	officialLink: varchar("official_link", { length: 255 }),
	applicationLink: varchar("application_link", { length: 255 }),
	isFeatured: boolean("is_featured").default(false),
	viewCount: integer("view_count").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "scholarships_institute_id_institutes_id_fk"
		}),
	unique("scholarships_slug_unique").on(table.slug),
]);

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	sessionToken: varchar("session_token", { length: 255 }).notNull(),
	lastActive: timestamp("last_active", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [adminUsers.id],
			name: "sessions_user_id_admin_users_id_fk"
		}),
	unique("sessions_session_token_unique").on(table.sessionToken),
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
	index("idx_seo_entity").using("btree", table.entityType.asc().nullsLast().op("int4_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	unique("seo_metadata_entity_variation").on(table.entityType, table.entityId, table.variation),
]);

export const programSkills = pgTable("program_skills", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	skillName: varchar("skill_name", { length: 100 }).notNull(),
	skillCategory: varchar("skill_category", { length: 50 }),
	proficiencyLevel: varchar("proficiency_level", { length: 50 }),
	displayOrder: integer("display_order").default(0),
	slug: varchar({ length: 200 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_skills_program_id_programs_id_fk"
		}).onDelete("cascade"),
]);

export const results = pgTable("results", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 500 }).notNull(),
	instituteId: integer("institute_id"),
	boardId: integer("board_id"),
	year: integer().notNull(),
	examType: varchar("exam_type", { length: 100 }),
	resultDate: timestamp("result_date", { mode: 'string' }),
	officialLink: varchar("official_link", { length: 255 }),
	featuredImage: varchar("featured_image", { length: 500 }),
	isPopular: boolean("is_popular").default(false),
	viewCount: integer("view_count").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "results_institute_id_institutes_id_fk"
		}),
	foreignKey({
			columns: [table.boardId],
			foreignColumns: [boards.id],
			name: "results_board_id_boards_id_fk"
		}),
	unique("results_slug_unique").on(table.slug),
]);

export const sitemapEntries = pgTable("sitemap_entries", {
	id: serial().primaryKey().notNull(),
	url: varchar({ length: 500 }).notNull(),
	changeFreq: varchar("change_freq", { length: 20 }).default('weekly'),
	priority: numeric({ precision: 2, scale:  1 }).default('0.5'),
	lastModified: timestamp("last_modified", { mode: 'string' }).defaultNow(),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("sitemap_entries_url_unique").on(table.url),
]);

export const systemStats = pgTable("system_stats", {
	id: serial().primaryKey().notNull(),
	activeUsers: integer("active_users").default(0),
	totalSessions: integer("total_sessions").default(0),
	avgResponseTime: integer("avg_response_time").default(0),
	errorRate: integer("error_rate").default(0),
	cpuUsage: integer("cpu_usage").default(0),
	memoryUsage: integer("memory_usage").default(0),
	diskUsage: integer("disk_usage").default(0),
	uptime: integer().default(0),
	recordedAt: timestamp("recorded_at", { mode: 'string' }).defaultNow().notNull(),
});

export const visitorSessions = pgTable("visitor_sessions", {
	id: serial().primaryKey().notNull(),
	visitorId: varchar("visitor_id", { length: 100 }).notNull(),
	sessionId: varchar("session_id", { length: 100 }).notNull(),
	entryPage: varchar("entry_page", { length: 255 }),
	exitPage: varchar("exit_page", { length: 255 }),
	pageViews: integer("page_views").default(1),
	country: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	latitude: varchar({ length: 50 }),
	longitude: varchar({ length: 50 }),
	deviceType: varchar("device_type", { length: 50 }),
	browser: varchar({ length: 50 }),
	os: varchar({ length: 50 }),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	lastActive: timestamp("last_active", { mode: 'string' }).defaultNow(),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	duration: integer().default(0),
}, (table) => [
	unique("visitor_sessions_session_id_unique").on(table.sessionId),
]);

export const admissionOfferings = pgTable("admission_offerings", {
	id: serial().primaryKey().notNull(),
	admissionId: integer("admission_id").notNull(),
	offeringId: integer("offering_id").notNull(),
	seats: integer(),
	feeAmount: varchar("fee_amount", { length: 100 }),
	specificEligibility: text("specific_eligibility"),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissions.id],
			name: "admission_offerings_admission_id_admissions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.offeringId],
			foreignColumns: [programOfferings.id],
			name: "admission_offerings_offering_id_program_offerings_id_fk"
		}).onDelete("cascade"),
	unique("unique_admission_offering").on(table.admissionId, table.offeringId),
]);

export const programs = pgTable("programs", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	categoryId: integer("category_id"),
	shortDescription: text("short_description"),
	detailedOverview: text("detailed_overview"),
	whatYouLearn: text("what_you_learn"),
	whyStudyThis: text("why_study_this"),
	careerOutlook: text("career_outlook"),
	industryDemand: text("industry_demand"),
	typicalDuration: varchar("typical_duration", { length: 50 }),
	typicalFeeRange: varchar("typical_fee_range", { length: 100 }),
	commonEligibility: text("common_eligibility"),
	featuredImage: varchar("featured_image", { length: 500 }),
	icon: varchar({ length: 100 }),
	totalOfferings: integer("total_offerings").default(0),
	totalAdmissionsOpen: integer("total_admissions_open").default(0),
	averageSalaryRange: varchar("average_salary_range", { length: 100 }),
	isFeatured: boolean("is_featured").default(false),
	isPopular: boolean("is_popular").default(false),
	status: boolean().default(true),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	focusKeyword: varchar("focus_keyword", { length: 100 }),
	relatedProgramIds: jsonb("related_program_ids"),
	introVideoUrl: varchar("intro_video_url", { length: 500 }),
	graduatesCount: integer("graduates_count"),
	placementRate: integer("placement_rate"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "programs_category_id_categories_id_fk"
		}),
	unique("programs_name_unique").on(table.name),
	unique("programs_slug_unique").on(table.slug),
]);

export const degrees = pgTable("degrees", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	fullForm: varchar("full_form", { length: 100 }),
	levelId: integer("level_id"),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.levelId],
			foreignColumns: [levels.id],
			name: "degrees_level_id_levels_id_fk"
		}),
	unique("degrees_name_unique").on(table.name),
	unique("degrees_slug_unique").on(table.slug),
]);

export const resultOfferings = pgTable("result_offerings", {
	id: serial().primaryKey().notNull(),
	resultId: integer("result_id").notNull(),
	offeringId: integer("offering_id").notNull(),
	groupName: varchar("group_name", { length: 100 }),
	passPercentage: numeric("pass_percentage", { precision: 5, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.resultId],
			foreignColumns: [results.id],
			name: "result_offerings_result_id_results_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.offeringId],
			foreignColumns: [programOfferings.id],
			name: "result_offerings_offering_id_program_offerings_id_fk"
		}).onDelete("cascade"),
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
