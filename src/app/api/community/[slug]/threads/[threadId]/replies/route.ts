import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

interface Params { params: Promise<{ slug: string; threadId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { threadId } = await params;
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

  const { threadId } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });

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
