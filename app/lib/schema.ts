// app/lib/schema.ts (Updated version)
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  jsonb, 
  boolean,
} from "drizzle-orm/pg-core";

/* =========================
   📁 CATEGORIES (Engineering, Medical, Business etc)
   ========================= */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  displayOrder: integer("display_order").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   📁 LEVELS (Matric, Intermediate, Bachelor etc)
   ========================= */
export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  fullForm: varchar("full_form", { length: 255 }),
  displayOrder: integer("display_order").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 DEGREES (BS, BA, MA etc)
   ========================= */
export const degrees = pgTable("degrees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  fullForm: varchar("full_form", { length: 100 }),
  levelId: integer("level_id").notNull().references(() => levels.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  displayOrder: integer("display_order").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 PROGRAMS (Core Entity)
   ========================= */
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),

  degreeId: integer("degree_id")
    .notNull()
    .references(() => degrees.id),

  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),

  overview: text("overview"),
  eligibility: text("eligibility"),
  duration: varchar("duration", { length: 50 }),
  careerScope: text("career_scope"),
  feeRange: varchar("fee_range", { length: 50 }),

  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),

  isFeatured: boolean("is_featured").default(false),

  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   📁 CITIES
   ========================= */
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  province: varchar("province", { length: 100 }),
  isPopular: boolean("is_popular").default(false),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 INSTITUTES
   ========================= */
export const institutes = pgTable("institutes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),

  type: varchar("type", { length: 50 }).notNull(), // University / College / Govt / Private

  cityId: integer("city_id")
    .notNull()
    .references(() => cities.id),

  description: text("description"),
  website: varchar("website", { length: 255 }),

  isFeatured: boolean("is_featured").default(false),

  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 PROGRAM ↔ INSTITUTE
   ========================= */
export const programInstitutes = pgTable("program_institutes", {
  id: serial("id").primaryKey(),

  programId: integer("program_id")
    .notNull()
    .references(() => programs.id),

  instituteId: integer("institute_id")
    .notNull()
    .references(() => institutes.id),

  status: boolean("status").default(true),
});

/* =========================
   📁 PROGRAM ↔ CITY (SEO Optional)
   ========================= */
export const programCities = pgTable("program_cities", {
  id: serial("id").primaryKey(),

  programId: integer("program_id")
    .notNull()
    .references(() => programs.id),

  cityId: integer("city_id")
    .notNull()
    .references(() => cities.id),
});

/* =========================
   📁 BOARDS
   ========================= */
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),

  cityId: integer("city_id")
    .references(() => cities.id),

  website: varchar("website", { length: 255 }),
  description: text("description"),

  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 ADMISSION ↔ PROGRAM (Junction Table - NEW)
   ========================= */
export const admissionPrograms = pgTable("admission_programs", {
  id: serial("id").primaryKey(),
  admissionId: integer("admission_id")
    .notNull()
    .references(() => admissions.id, { onDelete: 'cascade' }),
  programId: integer("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 ADMISSIONS (Updated)
   ========================= */
export const admissions = pgTable("admissions", {
  id: serial("id").primaryKey(),
  
  instituteId: integer("institute_id")
    .notNull()
    .references(() => institutes.id),

  name: varchar("name", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),

  year: integer("year").notNull(),
  session: varchar("session", { length: 50 }),

  status: varchar("status", { length: 50 }).notNull(), // Expected / Open / Closed

  expectedOpenDate: timestamp("expected_open_date"),
  expectedCloseDate: timestamp("expected_close_date"),

  meritInfo: text("merit_info"),
  note: text("note"),
  officialLink: varchar("official_link", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   📁 RESULTS
   ========================= */
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),

  programId: integer("program_id").references(() => programs.id),
  instituteId: integer("institute_id").references(() => institutes.id),
  boardId: integer("board_id").references(() => boards.id),
  universityId: integer("university_id").references(() => institutes.id),

  year: integer("year").notNull(),
  resultDate: timestamp("result_date"),
  officialLink: varchar("official_link", { length: 255 }),
  isPopular: boolean("is_popular").default(false),
  status: boolean("status").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   📁 RESULT JUNCTION 
   ========================= */


export const resultPrograms = pgTable("result_programs", {
  id: serial("id").primaryKey(),
  resultId: integer("result_id")
    .notNull()
    .references(() => results.id, { onDelete: 'cascade' }),
  programId: integer("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  groupName: varchar("group_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});


/* =========================
   📁 DATE SHEETS
   ========================= */
export const dateSheets = pgTable("date_sheets", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),

  boardId: integer("board_id")
    .references(() => boards.id),

  universityId: integer("university_id")
    .references(() => institutes.id),

  examDate: timestamp("exam_date"),
  officialLink: varchar("official_link", { length: 255 }),

  isPopular: boolean("is_popular").default(false),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 NEWS
   ========================= */
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),

  programId: integer("program_id").references(() => programs.id),
  instituteId: integer("institute_id").references(() => institutes.id),
  boardId: integer("board_id").references(() => boards.id),
  cityId: integer("city_id").references(() => cities.id),

  imageUrl: varchar("image_url", { length: 500 }),
  source: varchar("source", { length: 255 }),
  author: varchar("author", { length: 100 }),

  isFeatured: boolean("is_featured").default(false),
  isBreaking: boolean("is_breaking").default(false),
  views: integer("views").default(0),

  publishedAt: timestamp("published_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  status: boolean("status").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   📁 ADMIN ROLES
   ========================= */
export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 ADMIN USERS
   ========================= */
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),

  roleId: integer("role_id")
    .notNull()
    .references(() => adminRoles.id),

  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   📁 PAGE VIEWS (Analytics) - ✅ FIXED (Single Definition)
   ========================= */
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  
  // Visitor identification
  visitorId: varchar("visitor_id", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  
  // Page details
  pagePath: varchar("page_path", { length: 255 }).notNull(),
  pageTitle: varchar("page_title", { length: 255 }),
  
  // Device info
  deviceType: varchar("device_type", { length: 50 }),
  browser: varchar("browser", { length: 50 }),
  os: varchar("os", { length: 50 }),
  
  // 🌍 LOCATION INFO - Complete
  country: varchar("country", { length: 100 }),
  countryCode: varchar("country_code", { length: 10 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  timezone: varchar("timezone", { length: 100 }),
  
  // Referrer
  referrer: varchar("referrer", { length: 500 }),
  
  // Timestamps
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   📁 VISITOR SESSIONS
   ========================= */
export const visitorSessions = pgTable("visitor_sessions", {
  id: serial("id").primaryKey(),
  
  visitorId: varchar("visitor_id", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  
  // Session info
  entryPage: varchar("entry_page", { length: 255 }),
  exitPage: varchar("exit_page", { length: 255 }),
  pageViews: integer("page_views").default(1),
  
  // Timestamps
  startedAt: timestamp("started_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
  endedAt: timestamp("ended_at"),
  
  // Duration in seconds
  duration: integer("duration").default(0),
});

/* =========================
   📁 DAILY STATS (Aggregated)
   ========================= */

   export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  
  date: varchar("date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  
  totalVisitors: integer("total_visitors").default(0),
  newVisitors: integer("new_visitors").default(0),
  returningVisitors: integer("returning_visitors").default(0),
  
  totalPageViews: integer("total_page_views").default(0),
  avgTimeOnSite: integer("avg_time_on_site").default(0), // seconds
  
  topPages: jsonb("top_pages"),
  deviceBreakdown: jsonb("device_breakdown"),
  countryBreakdown: jsonb("country_breakdown"),
  
  // ✅ NEW - City breakdown (Pakistan cities specifically)
  cityBreakdown: jsonb("city_breakdown"), // { "Karachi": 150, "Lahore": 120, "Islamabad": 80 }
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});