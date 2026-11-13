
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

declare global {
  var __pgPool: Pool | undefined;
  var __pgShutdownRegistered: boolean | undefined;
}

const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}

export const db = drizzle(pool, { schema });

export const {
  adminUsers,
  adminRoles,
  permissions,
  userPermissions,
  sessions,
  notifications,
  instituteUsers,
} = schema;

if (process.env.NODE_ENV !== "production") {
  const shutdown = async () => {
    try {
      await pool.end();
      console.log("PG pool closed");
    } catch (err) {
      console.error("Error closing pool:", err);
    }
  };

  if (!globalThis.__pgShutdownRegistered) {
    globalThis.__pgShutdownRegistered = true;
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }
}
