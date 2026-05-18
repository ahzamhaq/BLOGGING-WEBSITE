import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { assertCanParticipate, assertCanRead } from "@/lib/community-access";

interface Params { params: Promise<{ slug: string; threadId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const { slug, threadId } = await params;

  const access = await assertCanRead(slug, session?.user?.id ?? null);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    const replies = await prisma.threadReply.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true, handle: true, image: true } } },
    });
    return NextResponse.json(replies);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, threadId } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });

  const access = await assertCanParticipate(slug, session.user.id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  // Ensure the thread actually belongs to this community (prevent cross-room reply injection)
  const thread = await prisma.communityThread.findUnique({
    where: { id: threadId },
    select: { communityId: true },
  });
  if (!thread || thread.communityId !== access.community.id) {
    return NextResponse.json({ error: "Thread not found in this community" }, { status: 404 });
  }

  try {
    const reply = await prisma.threadReply.create({
      data: { body: body.trim(), threadId, authorId: session.user.id },
      include: { author: { select: { id: true, name: true, handle: true, image: true } } },
    });
    return NextResponse.json(reply, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}
