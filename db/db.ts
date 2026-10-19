// app/lib/db.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// ================== ENV GUARD ==================
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not set in environment variables");
}

// ================== GLOBAL SINGLETON (HMR-safe) ==================
// Next.js dev mode mein hot reload pe naya pool banne se rokta hai.
// Vercel/serverless mein har cold start pe fresh pool milega.

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,

    // High traffic + Vercel safe config
    max: 5,                        // max DB connections per instance
    idleTimeoutMillis: 30000,      // close idle connections after 30s
    connectionTimeoutMillis: 10000, // fail fast if DB is slow

    // Managed DB (Neon / Supabase / Railway) ke liye SSL
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

// Dev mode mein global pe store karo taake HMR pe reuse ho
if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}

// ================== DRIZZLE INSTANCE ==================
export const db = drizzle(pool, { schema });

// ================== TABLE EXPORTS ==================
export const {
  adminUsers,
  adminRoles,
  permissions,
  userPermissions,
  sessions,
  notifications,
} = schema;

// ================== CLEAN EXIT (dev only, safe) ==================
// NOTE: process.on("exit") async pool.end() ke liye reliable nahi hota.
// Isliye sirf dev mein graceful shutdown handle karte hain.
if (process.env.NODE_ENV !== "production") {
  const shutdown = async () => {
    try {
      await pool.end();
      console.log("🛑 PG pool closed (dev shutdown)");
    } catch (err) {
      console.error("Error closing pool:", err);
    }
  };

  // Sirf ek baar register karo (HMR ke wajah se multiple na ho)
  if (!(globalThis as any).__pgShutdownRegistered) {
    (globalThis as any).__pgShutdownRegistered = true;
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }
}