import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

interface Params { params: Promise<{ threadId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { threadId } = await params;
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
