
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;

type HyperdriveBinding = {
  connectionString: string;
};

type CloudflareBindings = {
  HYPERDRIVE?: HyperdriveBinding;
};

function createDatabase(connectionString: string): Database {
  if (!connectionString) {
    throw new Error(
      "Database connection is not configured. Check HYPERDRIVE or DATABASE_URL."
    );
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    maxUses: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return drizzle({
    client: pool,
    schema,
  });
}

/**
 * Synchronous database client for Cloudflare request handlers.
 * OpenNext provides the Hyperdrive binding through getCloudflareContext().
 */
export const getDb = cache((): Database => {
  let connectionString: string | undefined;

  try {
    const { env } = getCloudflareContext();

    const bindings = env as unknown as CloudflareBindings;

    connectionString = bindings.HYPERDRIVE?.connectionString;
  } catch {
    // Allows local Next.js development without a Cloudflare runtime.
    connectionString = process.env.DATABASE_URL;
  }

  if (!connectionString) {
    throw new Error(
      "HYPERDRIVE binding is unavailable. For local development, configure DATABASE_URL."
    );
  }

  return createDatabase(connectionString);
});

/**
 * Async database client for static routes and build-time contexts.
 */
export const getDbAsync = cache(async (): Promise<Database> => {
  let connectionString: string | undefined;

  try {
    const { env } = await getCloudflareContext({
      async: true,
    });

    const bindings = env as unknown as CloudflareBindings;

    connectionString = bindings.HYPERDRIVE?.connectionString;
  } catch {
    connectionString = process.env.DATABASE_URL;
  }

  if (!connectionString) {
    throw new Error(
      "Database connection is unavailable. Configure HYPERDRIVE or DATABASE_URL."
    );
  }

  return createDatabase(connectionString);
});

/**
 * Backward-compatible database proxy.
 * Existing imports using db.select(), db.insert(), db.update(), etc.
 * do not need immediate changes.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const database = getDb();

    const value = Reflect.get(database, property, database);

    return typeof value === "function"
      ? value.bind(database)
      : value;
  },
});

// Export existing schema tables.
export const {
  adminUsers,
  adminRoles,
  permissions,
  userPermissions,
  sessions,
  notifications,
  instituteUsers,
} = schema;
