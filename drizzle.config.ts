import { defineConfig } from 'drizzle-kit';

// D1 is SQLite. Migrations generated here are applied to D1 via `wrangler d1 migrations apply`.
export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
});
