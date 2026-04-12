// app/lib/schema.ts

import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
  decimal,
  unique,
  index,
} from "drizzle-orm/pg-core";

/* =========================
📁 CATEGORIES (Engineering, Medical, Business etc)
========================= */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
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
  description: text("description"),
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
  levelId: integer("level_id").references(() => levels.id),
  displayOrder: integer("display_order").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
🎓 PROGRAMS - MASTER DEFINITION (1 row per discipline)
========================= */
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id),

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
  icon: varchar("icon", { length: 100 }),

  totalOfferings: integer("total_offerings").default(0),
  totalAdmissionsOpen: integer("total_admissions_open").default(0),
  averageSalaryRange: varchar("average_salary_range", { length: 100 }),

  isFeatured: boolean("is_featured").default(false),
  isPopular: boolean("is_popular").default(false),
  status: boolean("status").default(true),

  // SEO additional fields
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  focusKeyword: varchar("focus_keyword", { length: 100 }),
  relatedProgramIds: jsonb("related_program_ids"),
  introVideoUrl: varchar("intro_video_url", { length: 500 }),
  graduatesCount: integer("graduates_count"),
  placementRate: integer("placement_rate"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
🎓 PROGRAM OFFERINGS
========================= */
export const programOfferings = pgTable("program_offerings", {
  id: serial("id").primaryKey(),

  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  degreeId: integer("degree_id").notNull().references(() => degrees.id),
  instituteId: integer("institute_id").notNull().references(() => institutes.id),

  customName: varchar("custom_name", { length: 255 }),
  duration: varchar("duration", { length: 50 }),
  feeRange: varchar("fee_range", { length: 100 }),
  specificEligibility: text("specific_eligibility"),
  additionalInfo: text("additional_info"),

  specializations: jsonb("specializations"),

  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueOffering: unique("unique_program_degree_institute").on(
    table.programId,
    table.degreeId,
    table.instituteId
  ),
  idxProgram: index("idx_offering_program").on(table.programId),
  idxInstitute: index("idx_offering_institute").on(table.instituteId),
}));

/* =========================
🎯 PROGRAM SKILLS
========================= */
export const programSkills = pgTable("program_skills", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  skillName: varchar("skill_name", { length: 100 }).notNull(),
  skillCategory: varchar("skill_category", { length: 50 }),
  proficiencyLevel: varchar("proficiency_level", { length: 50 }),
  displayOrder: integer("display_order").default(0),
  slug: varchar("slug", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
💼 CAREER PATHS
========================= */
export const careerPaths = pgTable("career_paths", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  jobTitle: varchar("job_title", { length: 150 }).notNull(),
  description: text("description"),
  startingSalaryMin: integer("starting_salary_min"),
  startingSalaryMax: integer("starting_salary_max"),
  midLevelSalaryMin: integer("mid_level_salary_min"),
  midLevelSalaryMax: integer("mid_level_salary_max"),
  topCompanies: jsonb("top_companies"),
  growthPotential: varchar("growth_potential", { length: 50 }),
  marketDemand: varchar("market_demand", { length: 50 }),
  displayOrder: integer("display_order").default(0),
  status: boolean("status").default(true),
  slug: varchar("slug", { length: 200 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
📚 PROGRAM CURRICULUM
========================= */
export const programCurriculum = pgTable("program_curriculum", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  semester: integer("semester").notNull(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  courseCode: varchar("course_code", { length: 50 }),
  creditHours: integer("credit_hours"),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
❓ PROGRAM FAQs
========================= */
export const programFaqs = pgTable("program_faqs", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  displayOrder: integer("display_order").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
📖 PROGRAM PREREQUISITES
========================= */
export const programPrerequisites = pgTable("program_prerequisites", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(),
  requirement: text("requirement").notNull(),
  isRequired: boolean("is_required").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
🏙️ CITIES
========================= */
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  province: varchar("province", { length: 100 }),
  description: text("description"),
  educationOverview: text("education_overview"),
  imageUrl: varchar("image_url", { length: 500 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  population: integer("population"),
  area: varchar("area", { length: 50 }),
  totalInstitutes: integer("total_institutes").default(0),
  isPopular: boolean("is_popular").default(false),
  isCapital: boolean("is_capital").default(false),
  displayOrder: integer("display_order").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
🏛️ INSTITUTES
========================= */
export const institutes = pgTable("institutes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  ownership: varchar("ownership", { length: 50 }),
  cityId: integer("city_id").notNull().references(() => cities.id),
  address: text("address"),
  description: text("description"),
  about: text("about"),
  facilities: jsonb("facilities"),
  website: varchar("website", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  accreditations: jsonb("accreditations"),
  establishedYear: integer("established_year"),
  logo: varchar("logo", { length: 500 }),
  featuredImage: varchar("featured_image", { length: 500 }),
  galleryImages: jsonb("gallery_images"),
  totalPrograms: integer("total_programs").default(0),
  totalAdmissions: integer("total_admissions").default(0),
  ranking: integer("ranking"),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(false),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
📁 BOARDS
========================= */
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  cityId: integer("city_id").references(() => cities.id),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  establishedYear: integer("established_year"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  logo: varchar("logo", { length: 500 }),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
📝 ADMISSIONS
========================= */
export const admissions = pgTable("admissions", {
  id: serial("id").primaryKey(),
  instituteId: integer("institute_id").notNull().references(() => institutes.id),
  name: varchar("name", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  year: integer("year").notNull(),
  session: varchar("session", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull(),
  openDate: timestamp("open_date"),
  closeDate: timestamp("close_date"),
  expectedOpenDate: timestamp("expected_open_date"),
  expectedCloseDate: timestamp("expected_close_date"),
  eligibility: text("eligibility"),
  howToApply: text("how_to_apply"),
  requiredDocuments: jsonb("required_documents"),
  feeStructure: jsonb("fee_structure"),
  meritInfo: text("merit_info"),
  note: text("note"),
  officialLink: varchar("official_link", { length: 255 }),
  applicationLink: varchar("application_link", { length: 255 }),
  featuredImage: varchar("featured_image", { length: 500 }),
  galleryImages: jsonb("gallery_images"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
📝 ADMISSION OFFERINGS
========================= */
export const admissionOfferings = pgTable("admission_offerings", {
  id: serial("id").primaryKey(),
  admissionId: integer("admission_id").notNull().references(() => admissions.id, { onDelete: 'cascade' }),
  offeringId: integer("offering_id").notNull().references(() => programOfferings.id, { onDelete: 'cascade' }),
  seats: integer("seats"),
  feeAmount: varchar("fee_amount", { length: 100 }),
  specificEligibility: text("specific_eligibility"),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueAdmissionOffering: unique("unique_admission_offering").on(
    table.admissionId,
    table.offeringId
  ),
}));

/* =========================
📊 RESULTS
========================= */
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  instituteId: integer("institute_id").references(() => institutes.id),
  boardId: integer("board_id").references(() => boards.id),
  year: integer("year").notNull(),
  examType: varchar("exam_type", { length: 100 }),
  resultDate: timestamp("result_date"),
  officialLink: varchar("official_link", { length: 255 }),
  featuredImage: varchar("featured_image", { length: 500 }),
  isPopular: boolean("is_popular").default(false),
  viewCount: integer("view_count").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
📊 RESULT OFFERINGS
========================= */
export const resultOfferings = pgTable("result_offerings", {
  id: serial("id").primaryKey(),
  resultId: integer("result_id").notNull().references(() => results.id, { onDelete: 'cascade' }),
  offeringId: integer("offering_id").notNull().references(() => programOfferings.id, { onDelete: 'cascade' }),
  groupName: varchar("group_name", { length: 100 }),
  passPercentage: decimal("pass_percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
📅 DATE SHEETS
========================= */

export const dateSheets = pgTable("date_sheets", {
  id: serial("id").primaryKey(),
  
  // ========== BASIC INFO ==========
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  year: integer("year").notNull(),
  examType: varchar("exam_type", { length: 100 }),
  examDate: timestamp("exam_date"),
  
  // ========== RELATIONS ==========
  boardId: integer("board_id").references(() => boards.id, { onDelete: "set null" }),
  instituteId: integer("institute_id").references(() => institutes.id, { onDelete: "set null" }),
  
  // ========== CONTENT (300-500 words for SEO) ==========
  description: text("description"),  // ✅ SEO ke liye 300-500 words
  
  // ========== DOWNLOADS ==========
  officialLink: varchar("official_link", { length: 500 }),
  downloadLink: varchar("download_link", { length: 500 }),
  pdfFile: varchar("pdf_file", { length: 500 }),
  
  // ========== MEDIA ==========
  featuredImage: varchar("featured_image", { length: 500 }),
  
  // ========== FLAGS ==========
  isPopular: boolean("is_popular").default(false),
  status: boolean("status").default(true),
  
  // ========== STATS ==========
  viewCount: integer("view_count").default(0),
  
  // ========== TIMESTAMPS ==========
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
📰 NEWS
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
  category: varchar("category", { length: 50 }),
  tags: jsonb("tags"),
  source: varchar("source", { length: 255 }),
  sourceUrl: varchar("source_url", { length: 500 }),
  author: varchar("author", { length: 100 }),
  isFeatured: boolean("is_featured").default(false),
  isBreaking: boolean("is_breaking").default(false),
  status: boolean("status").default(true),
  viewCount: integer("view_count").default(0),
  publishedAt: timestamp("published_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
📊 PAGE VIEWS (with referrerDomain for tracking)
========================= */
export const pageViews = pgTable(
  "page_views", 
  {
    id: serial("id").primaryKey(),
    visitorId: varchar("visitor_id", { length: 100 }).notNull(),
    sessionId: varchar("session_id", { length: 100 }).notNull(),
    referrerDomain: varchar("referrer_domain", { length: 100 }),
    pagePath: varchar("page_path", { length: 255 }).notNull(),
    pageTitle: varchar("page_title", { length: 255 }),
    deviceType: varchar("device_type", { length: 50 }),
    browser: varchar("browser", { length: 50 }),
    os: varchar("os", { length: 50 }),
    country: varchar("country", { length: 100 }),
    countryCode: varchar("country_code", { length: 10 }),
    city: varchar("city", { length: 100 }),
    region: varchar("region", { length: 100 }),
    latitude: varchar("latitude", { length: 50 }),
    longitude: varchar("longitude", { length: 50 }),
    timezone: varchar("timezone", { length: 100 }),
    loadTime: integer("load_time"),
    apiLatency: integer("api_latency"),
    referrer: varchar("referrer", { length: 500 }),
    userId: integer("user_id").references(() => adminUsers.id),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // ✅ Indexes for better query performance
    idx_page_views_visitor: index("idx_page_views_visitor").on(table.visitorId),
    idx_page_views_session: index("idx_page_views_session").on(table.sessionId),
    idx_page_views_viewed_at: index("idx_page_views_viewed_at").on(table.viewedAt),
    // ✅ Additional useful indexes
    idx_page_views_page_path: index("idx_page_views_page_path").on(table.pagePath),
    idx_page_views_country: index("idx_page_views_country").on(table.country),
    idx_page_views_city: index("idx_page_views_city").on(table.city),
    idx_page_views_device_type: index("idx_page_views_device_type").on(table.deviceType),
  })
);
/* =========================
👥 VISITOR SESSIONS
========================= */
export const visitorSessions = pgTable(
  "visitor_sessions",
  {
    id: serial("id").primaryKey(),
    visitorId: varchar("visitor_id", { length: 100 }).notNull(),
    sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
    entryPage: varchar("entry_page", { length: 255 }),
    exitPage: varchar("exit_page", { length: 255 }),
    pageViews: integer("page_views").default(1),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    latitude: varchar("latitude", { length: 50 }),
    longitude: varchar("longitude", { length: 50 }),
    deviceType: varchar("device_type", { length: 50 }),
    browser: varchar("browser", { length: 50 }),
    os: varchar("os", { length: 50 }),
    startedAt: timestamp("started_at").defaultNow(),
    lastActive: timestamp("last_active").defaultNow(),
    endedAt: timestamp("ended_at"),
    duration: integer("duration").default(0),
  },
  (table) => ({
    idx_session_visitor: index("idx_session_visitor").on(table.visitorId),
    idx_session_last_active: index("idx_session_last_active").on(table.lastActive),
    idx_session_started_at: index("idx_session_started_at").on(table.startedAt),
  })
);

/* =========================
📈 DAILY STATS
========================= */
export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
⚙️ SYSTEM STATS
========================= */
export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  activeUsers: integer("active_users").default(0),
  totalSessions: integer("total_sessions").default(0),
  avgResponseTime: integer("avg_response_time").default(0),
  errorRate: integer("error_rate").default(0),
  cpuUsage: integer("cpu_usage").default(0),
  memoryUsage: integer("memory_usage").default(0),
  diskUsage: integer("disk_usage").default(0),
  uptime: integer("uptime").default(0),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

/* =========================
🌍 LOCATION CACHE
========================= */
export const locationCache = pgTable("location_cache", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 50 }).notNull().unique(),
  country: varchar("country", { length: 100 }),
  countryCode: varchar("country_code", { length: 10 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  timezone: varchar("timezone", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
🔄 PROGRAM COMPARISONS
========================= */
export const programComparisons = pgTable("program_comparisons", {
  id: serial("id").primaryKey(),
  program1Id: integer("program_1_id").notNull().references(() => programs.id),
  program2Id: integer("program_2_id").notNull().references(() => programs.id),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  comparisonOverview: text("comparison_overview"),
  keyDifferences: jsonb("key_differences"),
  similarities: text("similarities"),
  whichToChoose: text("which_to_choose"),
  viewCount: integer("view_count").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueComparison: unique("unique_program_comparison").on(
    table.program1Id,
    table.program2Id
  ),
}));

/* =========================
⭐ PROGRAM REVIEWS
========================= */
export const programReviews = pgTable("program_reviews", {
  id: serial("id").primaryKey(),
  offeringId: integer("offering_id").notNull().references(() => programOfferings.id),
  reviewerName: varchar("reviewer_name", { length: 100 }),
  reviewerBatch: varchar("reviewer_batch", { length: 50 }),
  reviewerPhoto: varchar("reviewer_photo", { length: 500 }),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 255 }),
  review: text("review").notNull(),
  pros: jsonb("pros"),
  cons: jsonb("cons"),
  helpfulCount: integer("helpful_count").default(0),
  isVerified: boolean("is_verified").default(false),
  isApproved: boolean("is_approved").default(false),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
💰 SCHOLARSHIPS
========================= */
export const scholarships = pgTable("scholarships", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  instituteId: integer("institute_id").references(() => institutes.id),
  organizationName: varchar("organization_name", { length: 255 }),
  description: text("description"),
  eligibility: text("eligibility"),
  coverage: text("coverage"),
  amount: varchar("amount", { length: 100 }),
  programIds: jsonb("program_ids"),
  applicationDeadline: timestamp("application_deadline"),
  year: integer("year").notNull(),
  officialLink: varchar("official_link", { length: 255 }),
  applicationLink: varchar("application_link", { length: 255 }),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
📝 BLOG POSTS
========================= */
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  authorId: integer("author_id").references(() => adminUsers.id),
  authorName: varchar("author_name", { length: 100 }),
  focusKeyword: varchar("focus_keyword", { length: 100 }),
  programId: integer("program_id").references(() => programs.id),
  categoryId: integer("category_id").references(() => categories.id),
  featuredImage: varchar("featured_image", { length: 500 }),
  category: varchar("category", { length: 50 }),
  tags: jsonb("tags"),
  viewCount: integer("view_count").default(0),
  readingTime: integer("reading_time"),
  isFeatured: boolean("is_featured").default(false),
  status: varchar("status", { length: 20 }).default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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