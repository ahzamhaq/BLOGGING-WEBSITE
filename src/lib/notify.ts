import { prisma } from "@/lib/db";

const DEDUPE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface NotifyInput {
  recipientId: string;
  actorId: string;
  type: "like" | "comment" | "follow" | "reply";
  message: string;
  link?: string;
  /**
   * Optional dedupe key — if set, suppress creating another notification
   * with the same key for the same recipient within DEDUPE_WINDOW_MS.
   * Use to prevent spam from like/unlike toggling or repeated comments.
   *
   * We store the key inside the message (suffixed `[k:<key>]`) for cheap
   * lookup without altering the Notification schema. The suffix is stripped
   * before display.
   */
  dedupeKey?: string;
}

/**
 * Best-effort notification creation. Never throws; logs and returns false
 * on failure so the calling write-path can still succeed.
 */
export async function notify(input: NotifyInput): Promise<boolean> {
  // Never notify yourself.
  if (input.recipientId === input.actorId) return false;

  try {
    if (input.dedupeKey) {
      const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
      const existing = await prisma.notification.findFirst({
        where: {
          userId: input.recipientId,
          type: input.type,
          createdAt: { gte: since },
          message: { contains: `[k:${input.dedupeKey}]` },
        },
        select: { id: true },
      });
      if (existing) return false;
    }

    const storedMessage = input.dedupeKey
      ? `${input.message} [k:${input.dedupeKey}]`
      : input.message;

    await prisma.notification.create({
      data: {
        userId:  input.recipientId,
        type:    input.type,
        message: storedMessage,
        link:    input.link ?? null,
      },
    });
    return true;
  } catch (err) {
    console.error("[notify] failed:", err);
    return false;
  }
}

/** Strip the internal dedupe suffix from a stored message before display. */
export function cleanMessage(message: string): string {
  return message.replace(/\s*\[k:[^\]]+\]\s*$/, "");
}
