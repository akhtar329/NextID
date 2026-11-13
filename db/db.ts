
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Dynamic request ke liye database connection.
 *
 * Hyperdrive connection string sirf request ke runtime context
 * se li jati hai. Module load ya build ke waqt DB connection
 * create nahi hota.
 */
export const getDb = cache(() => {
  const { env } = getCloudflareContext();

  const connectionString = env.HYPERDRIVE.connectionString;

  if (!connectionString) {
    throw new Error("Cloudflare HYPERDRIVE connection string is unavailable");
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    maxUses: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  return drizzle({
    client: pool,
    schema,
  });
});

/**
 * Static generation / SSG / ISR ke liye async database connection.
 */
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });

  const connectionString = env.HYPERDRIVE.connectionString;

  if (!connectionString) {
    throw new Error("Cloudflare HYPERDRIVE connection string is unavailable");
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    maxUses: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  return drizzle({
    client: pool,
    schema,
  });
});

/**
 * Schema exports
 */
export const {
  adminUsers,
  adminRoles,
  permissions,
  userPermissions,
  sessions,
  notifications,
  instituteUsers,
} = schema;
