import { createDb } from "@rehearse/db";

// Singleton for server-side use. DATABASE_URL is the Supabase connection string
// (Transaction mode pooler: port 6543) for serverless environments.
let db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!db) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL environment variable is required");
    db = createDb(url);
  }
  return db;
}
