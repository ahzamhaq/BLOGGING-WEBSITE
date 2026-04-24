import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag")?.trim();

  try {
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: "asc" },
      where: tag ? { tags: { has: tag } } : undefined,
      include: {
        _count: { select: { members: true, threads: true } },
        threads: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { author: { select: { name: true, handle: true } } },
        },
      },
    });
    return NextResponse.json(communities);
  } catch {
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, desc, emoji, color, type, tags, rules } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!desc?.trim()) return NextResponse.json({ error: "Description is required" }, { status: 400 });

  const base = slugify(name, { lower: true, strict: true }) || `room-${Date.now()}`;
  const existing = await prisma.community.findUnique({ where: { slug: base } });
  const slug = existing ? `${base}-${Date.now().toString(36)}` : base;

  try {
    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        desc: desc.trim(),
        emoji: emoji ?? "💬",
        color: color ?? "#348fff",
        type: type ?? "public",
        tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
        rules: Array.isArray(rules) ? rules.filter(Boolean) : [],
        slug,
        members: {
          create: { userId: session.user.id, role: "owner" },
        },
      },
      include: { _count: { select: { members: true, threads: true } } },
    });
    return NextResponse.json(community, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
  }
}
