import { prisma } from "@/lib/db";

export type AccessCheck =
  | { ok: true; community: { id: string; type: string }; role: string | null }
  | { ok: false; status: number; error: string };

/**
 * Verifies a user can participate (post / reply / like / etc.) in a community.
 *
 * Rules:
 *  - Community must exist.
 *  - For `private` rooms: caller MUST be a member.
 *  - For `request` rooms: caller MUST be a member (approved). Future work
 *    will distinguish "pending" requests once that flow is real; today we
 *    treat any membership row as approved.
 *  - For `public` rooms: caller MUST be authenticated, but membership is
 *    not required to participate. (Open chat semantics.)
 *
 * Returns the role for the caller when membership exists, so handlers
 * can additionally enforce moderator-only operations.
 */
export async function assertCanParticipate(
  slug: string,
  userId: string,
): Promise<AccessCheck> {
  const community = await prisma.community.findUnique({
    where: { slug },
    select: { id: true, type: true },
  });
  if (!community) return { ok: false, status: 404, error: "Community not found" };

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
    select: { role: true },
  });

  if ((community.type === "private" || community.type === "request") && !membership) {
    return {
      ok: false,
      status: 403,
      error: "You must be a member of this room to participate.",
    };
  }

  return { ok: true, community, role: membership?.role ?? null };
}

/**
 * Verifies a user can read content (threads, replies) in a community.
 * Private rooms require membership; everything else is readable.
 */
export async function assertCanRead(
  slug: string,
  userId: string | null,
): Promise<AccessCheck> {
  const community = await prisma.community.findUnique({
    where: { slug },
    select: { id: true, type: true },
  });
  if (!community) return { ok: false, status: 404, error: "Community not found" };

  if (community.type === "private") {
    if (!userId) return { ok: false, status: 403, error: "Private room" };
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!membership) return { ok: false, status: 403, error: "Private room" };
    return { ok: true, community, role: membership.role };
  }

  return { ok: true, community, role: null };
}
