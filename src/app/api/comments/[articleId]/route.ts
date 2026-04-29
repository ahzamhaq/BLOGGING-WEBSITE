import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/comments/[articleId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await params;
  const comments = await prisma.comment.findMany({
    where:   { articleId, parentId: null },
    include: {
      author:  { select: { id: true, name: true, handle: true, image: true } },
      replies: {
        include: { author: { select: { id: true, name: true, handle: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(comments);
}

// POST /api/comments/[articleId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { articleId } = await params;
  const { body, parentId } = await req.json() as { body: string; parentId?: string };

  if (!body?.trim()) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { body: body.trim(), authorId: session.user.id, articleId, parentId: parentId ?? null },
    include: { author: { select: { id: true, name: true, handle: true, image: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}

// DELETE /api/comments/[articleId]?commentId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  await params; // consume params
  const commentId = new URL(req.url).searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
