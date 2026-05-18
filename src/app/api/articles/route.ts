import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/db";
import { auth } from "@/auth";
import slugify from "slugify";
import { sanitizeArticleHtml, stripHtml } from "@/lib/sanitize";

// Maximum stored HTML size (500 KB) — guards against payload DoS
const MAX_CONTENT_BYTES = 500_000;

// GET /api/articles — list published articles with optional filter/search
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "latest";
  const q = searchParams.get("q")?.trim() ?? "";
  const cursor = searchParams.get("cursor") ?? null;
  const take = 20;

  // Lazy-publish any scheduled posts whose time has arrived (cron-free approach)
  try {
    await prisma.article.updateMany({
      where: {
        published: false,
        scheduledFor: { lte: new Date() },
      },
      data: { published: true, scheduledFor: null },
    });
  } catch (err) {
    console.warn("Scheduled publish sweep failed:", err);
  }

  const where = {
    published: true,
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { tags: { has: q } },
        { excerpt: { contains: q, mode: "insensitive" as const } },
        { author: { name: { contains: q, mode: "insensitive" as const } } },
        { author: { handle: { contains: q, mode: "insensitive" as const } } },
      ],
    } : {}),
  };

  // "trending" = most liked in last 7 days; "top" = all-time most liked
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (filter === "trending" && !q) {
    Object.assign(where, { createdAt: { gte: sevenDaysAgo } });
  }

  const orderBy = (filter === "top" || filter === "trending")
    ? { likes: { _count: "desc" as const } }
    : { createdAt: "desc" as const };

  try {
    const articles = await withRetry(() => prisma.article.findMany({
      where,
      orderBy,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: { name: true, handle: true, image: true } },
        _count: { select: { likes: true } },
      },
    }));

    const hasMore = articles.length > take;
    const items = hasMore ? articles.slice(0, take) : articles;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ articles: items, nextCursor, hasMore });
  } catch (err) {
    console.error("GET /api/articles error:", err);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

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
    const { title, subtitle, content, tags, coverImage, published, parentArticleId, scheduledFor } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate scheduled date if provided
    let scheduledForDate: Date | null = null;
    if (scheduledFor) {
      const d = new Date(scheduledFor);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid scheduled date" }, { status: 400 });
      }
      scheduledForDate = d;
    }

    // Validate parent article if provided
    if (parentArticleId) {
      const parent = await prisma.article.findUnique({ where: { id: parentArticleId } });
      if (!parent || !parent.published) {
        return NextResponse.json({ error: "Parent article not found" }, { status: 404 });
      }
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

    // Sanitize HTML content server-side before storing (prevents stored XSS).
    const rawContent = typeof content === "string" ? content : "";
    if (Buffer.byteLength(rawContent, "utf8") > MAX_CONTENT_BYTES) {
      return NextResponse.json({ error: "Article content too large" }, { status: 413 });
    }
    const safeContent = sanitizeArticleHtml(rawContent);
    const plainText = stripHtml(safeContent);
    const readTime = Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200));

    // Scheduled posts are stored as unpublished until the schedule fires
    const isScheduled = !!scheduledForDate && scheduledForDate.getTime() > Date.now();
    const finalPublished = isScheduled ? false : (published ?? false);

    const article = await prisma.article.create({
      data: {
        title:      title.trim(),
        subtitle:   subtitle?.trim()   ?? null,
        content:    safeContent,
        tags:       Array.isArray(tags) ? tags : [],
        coverImage: coverImage         ?? null,
        published:  finalPublished,
        scheduledFor: isScheduled ? scheduledForDate : null,
        parentArticleId: parentArticleId ?? null,
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
