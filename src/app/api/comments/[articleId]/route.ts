import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";

const MAX_COMMENT_LENGTH = 5000;

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

  const trimmed = body?.trim() ?? "";
  if (!trimmed) return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  // Verify the article exists (avoid FK error and give a clean 404).
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { authorId: true, title: true, slug: true, published: true },
  });
  if (!article || !article.published) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // If replying to another comment, the parent must exist and belong to the
  // same article. Otherwise an attacker could pass any comment's id as
  // parentId and attach a reply under a different article's thread.
  let parentAuthorId: string | null = null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, articleId: true, authorId: true },
    });
    if (!parent || parent.articleId !== articleId) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }
    parentAuthorId = parent.authorId;
  }

  const comment = await prisma.comment.create({
    data: { body: trimmed, authorId: session.user.id, articleId, parentId: parentId ?? null },
    include: { author: { select: { id: true, name: true, handle: true, image: true } } },
  });

  // Best-effort notifications using the values we already loaded above.
  const actorName = session.user.name ?? "Someone";
  const link = `/article/${article.slug}`;
  if (parentAuthorId) {
    await notify({
      recipientId: parentAuthorId,
      actorId:     session.user.id,
      type:        "reply",
      message:     `${actorName} replied to your comment on "${article.title}"`,
      link,
    });
  } else {
    await notify({
      recipientId: article.authorId,
      actorId:     session.user.id,
      type:        "comment",
      message:     `${actorName} commented on "${article.title}"`,
      link,
    });
  }

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
