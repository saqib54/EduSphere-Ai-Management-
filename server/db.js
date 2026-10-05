import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/edusphere",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

// Helper: run parameterised query and return rows
export async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper: shorthand for returning rows array
export async function rows(sql, params = []) {
  const r = await query(sql, params);
  return r.rows;
}

// Helper: return first row or null
export async function row(sql, params = []) {
  const r = await query(sql, params);
  return r.rows[0] || null;
}

// Helper: return first column of first row (scalar)
export async function scalar(sql, params = []) {
  const r = await query(sql, params);
  const firstRow = r.rows[0];
  if (!firstRow) return null;
  return Object.values(firstRow)[0];
}

export const UPLOADS_PATH = new URL("./uploads", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

export default pool;
