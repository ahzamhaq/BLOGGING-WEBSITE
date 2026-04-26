import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
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
