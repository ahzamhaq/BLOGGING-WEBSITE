import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";

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
  }

  await prisma.like.create({ data: { userId: session.user.id, articleId } });

  // Best-effort notification — never blocks the like.
  // Dedupe per actor/article/hour so toggle spam doesn't create multiple alerts.
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { authorId: true, title: true, slug: true },
  });
  if (article) {
    await notify({
      recipientId: article.authorId,
      actorId:     session.user.id,
      type:        "like",
      message:     `${session.user.name ?? "Someone"} liked "${article.title}"`,
      link:        `/article/${article.slug}`,
      dedupeKey:   `like:${session.user.id}:${articleId}`,
    });
  }

  const count = await prisma.like.count({ where: { articleId } });
  return NextResponse.json({ liked: true, count });
}
