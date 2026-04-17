// app/lib/db.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// ================== SAFE POOL CONFIG ==================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // IMPORTANT for high traffic + Vercel
  max: 5, // DB connections limit (safe start)

  idleTimeoutMillis: 30000, // close idle connections
  connectionTimeoutMillis: 10000, // fail fast if DB slow
});

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

// ================== OPTIONAL: CLEAN EXIT ==================
process.on("exit", () => {
  pool.end();
});