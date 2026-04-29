import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// POST /api/bookmarks/[articleId] — toggle bookmark
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { articleId } = await params;

  const existing = await prisma.bookmark.findUnique({
    where: { userId_articleId: { userId: session.user.id, articleId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { userId_articleId: { userId: session.user.id, articleId } } });
    return NextResponse.json({ bookmarked: false });
  } else {
    await prisma.bookmark.create({ data: { userId: session.user.id, articleId } });
    return NextResponse.json({ bookmarked: true });
  }
}

// GET /api/bookmarks/[articleId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await auth();
  const { articleId } = await params;
  let bookmarked = false;
  if (session?.user?.id) {
    const b = await prisma.bookmark.findUnique({
      where: { userId_articleId: { userId: session.user.id, articleId } },
    });
    bookmarked = !!b;
  }
  return NextResponse.json({ bookmarked });
}
