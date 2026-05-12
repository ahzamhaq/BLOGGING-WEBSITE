import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/articles/[id]/replies — list reply posts for an article
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const replies = await prisma.article.findMany({
      where: { parentArticleId: id, published: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        excerpt: true,
        coverImage: true,
        readTime: true,
        createdAt: true,
        author: { select: { name: true, handle: true, image: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    return NextResponse.json(replies);
  } catch (err) {
    console.error("GET /api/articles/[id]/replies error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
