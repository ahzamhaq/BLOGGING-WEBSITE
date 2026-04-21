import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import slugify from "slugify";

// POST /api/articles — create a new draft or published article
export async function POST(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized — please sign in" }, { status: 401 });
    }

    const authorId = session.user.id;

    const body = await req.json();
    const { title, subtitle, content, tags, coverImage, published } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify the user actually exists in DB (in case session is stale)
    const user = await prisma.user.findUnique({ where: { id: authorId } });
    if (!user) {
      return NextResponse.json({ error: "User not found in database. Please sign out and back in." }, { status: 404 });
    }

    // Generate a unique slug
    const base = slugify(title, { lower: true, strict: true }) || `article-${Date.now()}`;
    const existing = await prisma.article.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const slug = existing.length === 0 ? base : `${base}-${Date.now()}`;

    const plainText = (content ?? "").replace(/<[^>]*>/g, "");
    const readTime = Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200));

    const article = await prisma.article.create({
      data: {
        title:      title.trim(),
        subtitle:   subtitle?.trim()   ?? null,
        content:    content            ?? "",
        tags:       Array.isArray(tags) ? tags : [],
        coverImage: coverImage         ?? null,
        published:  published          ?? false,
        authorId,
        slug,
        readTime,
        excerpt:    plainText.slice(0, 200) || null,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("POST /api/articles error:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
