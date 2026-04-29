import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// POST /api/articles/view — record an article view with read time
export async function POST(req: NextRequest) {
  const { articleId, readTime } = await req.json();
  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  const session = await auth();

  try {
    await prisma.articleView.create({
      data: {
        articleId,
        userId: session?.user?.id ?? null,
        readTime: Math.min(Math.max(0, readTime ?? 0), 3600), // cap at 1hr
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Non-critical — don't fail the page if tracking fails
    return NextResponse.json({ ok: false });
  }
}
