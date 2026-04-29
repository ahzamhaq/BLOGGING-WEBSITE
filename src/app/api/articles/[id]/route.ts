import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import slugify from "slugify";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, handle: true, image: true, bio: true } } },
    });
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(article);
  } catch (error) {
    console.error("GET /api/articles/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, subtitle, content, tags, coverImage, published } = body;

    // Confirm article belongs to this user
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Regenerate slug when publishing for the first time
    let slug = existing.slug;
    if (published && !existing.published && title) {
      const base = slugify(title, { lower: true, strict: true }) || `article-${Date.now()}`;
      const conflict = await prisma.article.findFirst({ where: { slug: base, NOT: { id } } });
      slug = conflict ? `${base}-${Date.now()}` : base;
    }

    const plainText = ((content ?? existing.content) ?? "").replace(/<[^>]*>/g, "");
    const readTime = Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200));

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title:      title      ?? existing.title,
        subtitle:   subtitle   !== undefined ? (subtitle ?? null) : existing.subtitle,
        content:    content    ?? existing.content,
        tags:       Array.isArray(tags) ? tags : existing.tags,
        coverImage: coverImage !== undefined ? (coverImage ?? null) : existing.coverImage,
        published:  published  ?? existing.published,
        slug,
        readTime,
        excerpt:    plainText.slice(0, 200) || existing.excerpt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/articles/[id] error:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/articles/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
