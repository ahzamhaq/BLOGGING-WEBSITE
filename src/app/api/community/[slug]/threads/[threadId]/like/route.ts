import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { assertCanParticipate } from "@/lib/community-access";

interface Params { params: Promise<{ slug: string; threadId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, threadId } = await params;

  const access = await assertCanParticipate(slug, session.user.id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  // Ensure the thread belongs to this community (prevent cross-room like injection)
  const thread = await prisma.communityThread.findUnique({
    where: { id: threadId },
    select: { communityId: true },
  });
  if (!thread || thread.communityId !== access.community.id) {
    return NextResponse.json({ error: "Thread not found in this community" }, { status: 404 });
  }

  try {
    const existing = await prisma.threadLike.findUnique({
      where: { threadId_userId: { threadId, userId: session.user.id } },
    });

    if (existing) {
      await prisma.threadLike.delete({ where: { threadId_userId: { threadId, userId: session.user.id } } });
      const count = await prisma.threadLike.count({ where: { threadId } });
      return NextResponse.json({ liked: false, likes: count });
    }

    await prisma.threadLike.create({ data: { threadId, userId: session.user.id } });
    const count = await prisma.threadLike.count({ where: { threadId } });
    return NextResponse.json({ liked: true, likes: count });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
