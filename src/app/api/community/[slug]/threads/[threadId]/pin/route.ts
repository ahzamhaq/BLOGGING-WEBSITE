import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

interface Params { params: Promise<{ slug: string; threadId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, threadId } = await params;
  try {
    // Only allow moderators/owners
    const community = await prisma.community.findUnique({ where: { slug } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
    });
    if (!membership || !["owner", "moderator"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const thread = await prisma.communityThread.findUnique({ where: { id: threadId } });
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.communityThread.update({
      where: { id: threadId },
      data: { pinned: !thread.pinned },
    });
    return NextResponse.json({ pinned: updated.pinned });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
