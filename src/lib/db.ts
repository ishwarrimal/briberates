import { Pool, type QueryResultRow } from "pg";
import { ensureSchema, seedIfEmpty } from "./seed";

declare global {
  // eslint-disable-next-line no-var
  var __briberatesPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __briberatesInit: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your " +
        "Supabase Postgres connection string.",
    );
  }
  return new Pool({
    connectionString,
    // Supabase requires SSL; the pooler cert is not in the local trust store.
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
}

// Pool is created lazily on first query so that importing this module (e.g. at
// build time) does not require DATABASE_URL to be set.
export function getPool(): Pool {
  return (globalThis.__briberatesPool ??= createPool());
}

// Run schema + seed exactly once per process, lazily on first query.
async function init(): Promise<void> {
  const pool = getPool();
  await ensureSchema(pool);
  await seedIfEmpty(pool);
}
function ensureInit(): Promise<void> {
  return (globalThis.__briberatesInit ??= init());
}

/** Ensure schema + seed have run. Call before using a raw pooled client. */
export function ready(): Promise<void> {
  return ensureInit();
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureInit();
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}
