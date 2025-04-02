import { drizzle } from "drizzle-orm/d1";
import { migrate } from "drizzle-orm/d1/migrator";
import * as schema from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export async function runMigrations(db: ReturnType<typeof createDb>) {
  await migrate(db, {
    migrationsFolder: "./src/db/migrations",
  });
}

// Helper function to generate a UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper function to get current timestamp
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
} 