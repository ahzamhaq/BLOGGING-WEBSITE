import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

// Prisma 7 config runs before Next.js loads env — load manually
config({ path: ".env" });
config({ path: ".env.local", override: false });

const DIRECT = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const POOLED = process.env.DATABASE_URL ?? "";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Use direct (non-pooled) URL for migrate/push so pgbouncer doesn't interfere
    url: DIRECT,
  },
  migrate: {
    async adapter() {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: DIRECT });
      return new PrismaPg(pool);
    },
  },
});

export { POOLED as runtimeDatabaseUrl };
