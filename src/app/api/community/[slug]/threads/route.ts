import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

interface Params { params: Promise<{ slug: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { title, body, tag } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  try {
    const community = await prisma.community.findUnique({ where: { slug } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const thread = await prisma.communityThread.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        tag: tag ?? "discussion",
        communityId: community.id,
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
