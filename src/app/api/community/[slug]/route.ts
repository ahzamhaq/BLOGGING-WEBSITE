import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

interface Params { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  try {
    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        _count: { select: { members: true, threads: true } },
        members: {
          include: { user: { select: { id: true, name: true, handle: true, image: true } } },
          orderBy: { joinedAt: "asc" },
          take: 10,
        },
        threads: {
          orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
          include: {
            author: { select: { id: true, name: true, handle: true, image: true } },
            _count: { select: { replies: true, threadLikes: true } },
          },
        },
      },
    });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(community);
  } catch {
    return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
  }
}
