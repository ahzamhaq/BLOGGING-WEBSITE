import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/likes/[articleId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await auth();
  const { articleId } = await params;

  const count = await prisma.like.count({ where: { articleId } });
  let liked = false;
  if (session?.user?.id) {
    const l = await prisma.like.findUnique({
      where: { userId_articleId: { userId: session.user.id, articleId } },
    });
    liked = !!l;
  }
  return NextResponse.json({ count, liked });
}

// POST /api/likes/[articleId] — toggle like
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { articleId } = await params;

  const existing = await prisma.like.findUnique({
    where: { userId_articleId: { userId: session.user.id, articleId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { userId_articleId: { userId: session.user.id, articleId } } });
    const count = await prisma.like.count({ where: { articleId } });
    return NextResponse.json({ liked: false, count });
  } else {
    await prisma.like.create({ data: { userId: session.user.id, articleId } });
    const count = await prisma.like.count({ where: { articleId } });
    return NextResponse.json({ liked: true, count });
  }
}
