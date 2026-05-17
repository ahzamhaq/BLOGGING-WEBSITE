import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Prefer DIRECT_URL (port 5432) — pg driver adapter doesn't use pgbouncer
  // Fall back to DATABASE_URL with pgbouncer params stripped
  let connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  if (!process.env.DIRECT_URL && connectionString) {
    const url = new URL(connectionString);
    url.searchParams.delete("pgbouncer");
    url.searchParams.delete("connection_limit");
    connectionString = url.toString();
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Wrapper that retries once on connection failure (handles transient Supabase drops)
export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isConnError =
      msg.includes("Can't reach database") ||
      msg.includes("Connection refused") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("Connection reset");

    if (retries > 0 && isConnError) {
      await new Promise((r) => setTimeout(r, 500));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}
