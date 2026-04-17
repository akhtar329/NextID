import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  admissions,
  results,
  news,
  institutes,
} from "./schema";

// ================= ADMISSIONS =================
export const AdmissionRepository = {
  async getAll(limit = 20) {
    return db
      .select()
      .from(admissions)
      .orderBy(desc(admissions.year))
      .limit(limit);
  },

  async getBySlug(slug: string) {
    return db
      .select()
      .from(admissions)
      .where(eq(admissions.slug, slug))
      .then((r) => r[0]);
  },
};

// ================= RESULTS =================
export const ResultRepository = {
  async getAll(limit = 20) {
    return db
      .select()
      .from(results)
      .orderBy(desc(results.year))
      .limit(limit);
  },

  async getBySlug(slug: string) {
    return db
      .select()
      .from(results)
      .where(eq(results.slug, slug))
      .then((r) => r[0]);
  },
};

// ================= NEWS =================
export const NewsRepository = {
  async getAll(limit = 20) {
    return db
      .select()
      .from(news)
      .orderBy(desc(news.publishedAt))
      .limit(limit);
  },

  async getBySlug(slug: string) {
    return db
      .select()
      .from(news)
      .where(eq(news.slug, slug))
      .then((r) => r[0]);
  },
};