import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { assertCanParticipate } from "@/lib/community-access";

interface Params { params: Promise<{ slug: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { title, body, tag } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  const access = await assertCanParticipate(slug, session.user.id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    const thread = await prisma.communityThread.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        tag: tag ?? "discussion",
        communityId: access.community.id,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, handle: true, image: true } },
        _count: { select: { replies: true, threadLikes: true } },
      },
    });
    return NextResponse.json(thread, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
