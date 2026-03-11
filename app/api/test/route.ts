export async function GET() {
  const { Pool } = require("pg");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const result = await pool.query("SELECT 1");
  return Response.json(result.rows);
}