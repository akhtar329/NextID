import { pgTable, unique, serial, varchar, boolean, timestamp, foreignKey, integer, text } from "drizzle-orm/pg-core"
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

export const adminUsers = pgTable("admin_users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: text().notNull(),
	roleId: integer("role_id").notNull(),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [adminRoles.id],
			name: "admin_users_role_id_admin_roles_id_fk"
		}),
	unique("admin_users_email_unique").on(table.email),
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

export const degrees = pgTable("degrees", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	fullForm: varchar("full_form", { length: 100 }),
	levelId: integer("level_id").notNull(),
	displayOrder: integer("display_order").default(0),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	categoryId: integer("category_id").notNull(),
	slug: varchar({ length: 255 }),
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
	unique("degrees_slug_key").on(table.slug),
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
	programId: integer("program_id").notNull(),
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
	name: varchar({ length: 500 }).default('').notNull(),
slug: varchar({ length: 500 }).default('').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "admissions_program_id_programs_id_fk"
		}),
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "admissions_institute_id_institutes_id_fk"
		}),
	unique("admissions_slug_unique").on(table.slug),
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
			name: "results_programId_fkey"
		}),
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutes.id],
			name: "results_instituteId_fkey"
		}),
	unique("results_slug_unique").on(table.slug),
]);
