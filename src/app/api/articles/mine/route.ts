import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// GET /api/articles/mine?filter=drafts|published|all
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = req.nextUrl.searchParams.get("filter") ?? "all";

    const where: Record<string, unknown> = { authorId: session.user.id };
    if (filter === "drafts")    where.published = false;
    if (filter === "published") where.published = true;

    const articles = await prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        excerpt: true,
        coverImage: true,
        published: true,
        tags: true,
        readTime: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET /api/articles/mine error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
