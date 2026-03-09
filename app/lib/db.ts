// app/lib/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema'; // Import your schema

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Properly type the db instance with your schema
export const db = drizzle(pool, { schema });