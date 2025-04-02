import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  driver: "d1",
  dbCredentials: {
    wranglerConfigPath: "./wrangler.jsonc",
    dbName: "ab-testing-db",
  },
} satisfies Config; 