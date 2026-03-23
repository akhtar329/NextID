import { pgTable, unique, serial, varchar, boolean, timestamp, foreignKey, integer, text, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const cities = pgTable("cities", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	province: varchar({ length: 100 }),
	isPopular: boolean("is_popular").default(false),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("cities_slug_unique").on(table.slug),
]);

export const boards = pgTable("boards", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	cityId: integer("city_id"),
	website: varchar({ length: 255 }),
	description: text(),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: "boards_city_id_cities_id_fk"
		}),
	unique("boards_slug_unique").on(table.slug),
]);

export const programs = pgTable("programs", {
	id: serial().primaryKey().notNull(),
	degreeId: integer("degree_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	overview: text(),
	eligibility: text(),
	duration: varchar({ length: 50 }),
	careerScope: text("career_scope"),
	feeRange: varchar("fee_range", { length: 50 }),
	seoTitle: varchar("seo_title", { length: 255 }),
	seoDescription: text("seo_description"),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	isFeatured: boolean("is_featured").default(false),
}, (table) => [
	foreignKey({
			columns: [table.degreeId],
			foreignColumns: [degrees.id],
			name: "programs_degree_id_degrees_id_fk"
		}),
	unique("programs_slug_unique").on(table.slug),
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
	source: varchar({ length: 255 }),
	author: varchar({ length: 100 }),
	isFeatured: boolean("is_featured").default(false),
	isBreaking: boolean("is_breaking").default(false),
	views: integer().default(0),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	status: boolean().default(true),
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

export const institutes = pgTable("institutes", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	cityId: integer("city_id").notNull(),
	description: text(),
	website: varchar({ length: 255 }),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isFeatured: boolean("is_featured").default(false),
}, (table) => [
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: "institutes_city_id_cities_id_fk"
		}),
	unique("institutes_slug_unique").on(table.slug),
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

export const dateSheets = pgTable("date_sheets", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	boardId: integer("board_id"),
	universityId: integer("university_id"),
	examDate: timestamp("exam_date", { mode: 'string' }),
	officialLink: varchar("official_link", { length: 255 }),
	isPopular: boolean("is_popular").default(false),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.boardId],
			foreignColumns: [boards.id],
			name: "date_sheets_board_id_boards_id_fk"
		}),
	foreignKey({
			columns: [table.universityId],
			foreignColumns: [institutes.id],
			name: "date_sheets_university_id_institutes_id_fk"
		}),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("categories_name_unique").on(table.name),
	unique("categories_slug_unique").on(table.slug),
]);

export const programCities = pgTable("program_cities", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	cityId: integer("city_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_cities_program_id_programs_id_fk"
		}),
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: "program_cities_city_id_cities_id_fk"
		}),
]);

export const programInstitutes = pgTable("program_institutes", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	instituteId: integer("institute_id").notNull(),
	status: boolean().default(true),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_institutes_program_id_programs_id_fk"
		}),
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "program_institutes_institute_id_institutes_id_fk"
		}),
]);

export const levels = pgTable("levels", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	fullForm: varchar("full_form", { length: 255 }),
}, (table) => [
	unique("levels_name_unique").on(table.name),
	unique("levels_slug_unique").on(table.slug),
]);

export const admissions = pgTable("admissions", {
	id: serial().primaryKey().notNull(),
	instituteId: integer("institute_id").notNull(),
	year: integer().notNull(),
	session: varchar({ length: 50 }),
	status: varchar({ length: 50 }).notNull(),
	expectedOpenDate: timestamp("expected_open_date", { mode: 'string' }),
	expectedCloseDate: timestamp("expected_close_date", { mode: 'string' }),
	meritInfo: text("merit_info"),
	note: text(),
	officialLink: varchar("official_link", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	name: varchar({ length: 500 }).notNull(),
	slug: varchar({ length: 500 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "admissions_institute_id_institutes_id_fk"
		}),
	unique("admissions_slug_unique").on(table.slug),
]);

export const degrees = pgTable("degrees", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	fullForm: varchar("full_form", { length: 100 }),
	levelId: integer("level_id").notNull(),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	categoryId: integer("category_id").notNull(),
	slug: varchar({ length: 100 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.levelId],
			foreignColumns: [levels.id],
			name: "degrees_level_id_levels_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "degrees_category_id_categories_id_fk"
		}),
	unique("degrees_name_unique").on(table.name),
	unique("degrees_slug_unique").on(table.slug),
]);

export const results = pgTable("results", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	boardId: integer("board_id"),
	universityId: integer("university_id"),
	year: integer().notNull(),
	resultDate: timestamp("result_date", { mode: 'string' }),
	officialLink: varchar("official_link", { length: 255 }),
	isPopular: boolean("is_popular").default(false),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	programId: integer("program_id"),
	instituteId: integer("institute_id"),
	slug: varchar({ length: 500 }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.boardId],
			foreignColumns: [boards.id],
			name: "results_board_id_boards_id_fk"
		}),
	foreignKey({
			columns: [table.universityId],
			foreignColumns: [institutes.id],
			name: "results_university_id_institutes_id_fk"
		}),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "results_program_id_programs_id_fk"
		}),
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "results_institute_id_institutes_id_fk"
		}),
	unique("results_slug_unique").on(table.slug),
]);

export const admissionPrograms = pgTable("admission_programs", {
	id: serial().primaryKey().notNull(),
	admissionId: integer("admission_id").notNull(),
	programId: integer("program_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissions.id],
			name: "admission_programs_admission_id_admissions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "admission_programs_program_id_programs_id_fk"
		}).onDelete("cascade"),
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
	topPages: jsonb("top_pages"),
	deviceBreakdown: jsonb("device_breakdown"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	countryBreakdown: jsonb("country_breakdown"),
	cityBreakdown: jsonb("city_breakdown"),
	bounceRate: integer("bounce_rate").default(0),
	browserBreakdown: jsonb("browser_breakdown"),
	osBreakdown: jsonb("os_breakdown"),
	avgLoadTime: integer("avg_load_time").default(0),
	avgApiLatency: integer("avg_api_latency").default(0),
}, (table) => [
	unique("daily_stats_date_unique").on(table.date),
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

export const resultPrograms = pgTable("result_programs", {
	id: serial().primaryKey().notNull(),
	resultId: integer("result_id").notNull(),
	programId: integer("program_id").notNull(),
	groupName: varchar("group_name", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.resultId],
			foreignColumns: [results.id],
			name: "result_programs_result_id_results_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "result_programs_program_id_programs_id_fk"
		}).onDelete("cascade"),
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

export const visitorSessions = pgTable("visitor_sessions", {
	id: serial().primaryKey().notNull(),
	visitorId: varchar("visitor_id", { length: 100 }).notNull(),
	sessionId: varchar("session_id", { length: 100 }).notNull(),
	entryPage: varchar("entry_page", { length: 255 }),
	exitPage: varchar("exit_page", { length: 255 }),
	pageViews: integer("page_views").default(1),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	lastActive: timestamp("last_active", { mode: 'string' }).defaultNow(),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	duration: integer().default(0),
	country: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	latitude: varchar({ length: 50 }),
	longitude: varchar({ length: 50 }),
	deviceType: varchar("device_type", { length: 50 }),
	browser: varchar({ length: 50 }),
	os: varchar({ length: 50 }),
}, (table) => [
	unique("visitor_sessions_session_id_unique").on(table.sessionId),
]);

export const permissions = pgTable("permissions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("permissions_name_unique").on(table.name),
]);

export const pageViews = pgTable("page_views", {
	id: serial().primaryKey().notNull(),
	visitorId: varchar("visitor_id", { length: 100 }).notNull(),
	sessionId: varchar("session_id", { length: 100 }).notNull(),
	pagePath: varchar("page_path", { length: 255 }).notNull(),
	pageTitle: varchar("page_title", { length: 255 }),
	deviceType: varchar("device_type", { length: 50 }),
	browser: varchar({ length: 50 }),
	os: varchar({ length: 50 }),
	country: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	referrer: varchar({ length: 500 }),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	countryCode: varchar("country_code", { length: 10 }),
	region: varchar({ length: 100 }),
	latitude: varchar({ length: 50 }),
	longitude: varchar({ length: 50 }),
	timezone: varchar({ length: 100 }),
	loadTime: integer("load_time"),
	apiLatency: integer("api_latency"),
	userId: integer("user_id"),
	screenSize: varchar("screen_size", { length: 50 }),
	browserVersion: varchar("browser_version", { length: 50 }),
	deviceVendor: varchar("device_vendor", { length: 100 }),
	userAgent: text("user_agent"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [adminUsers.id],
			name: "page_views_user_id_admin_users_id_fk"
		}),
]);
