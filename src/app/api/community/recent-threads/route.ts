import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const threads = await prisma.communityThread.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        community: { select: { name: true, slug: true, color: true } },
        author: { select: { name: true, handle: true } },
        _count: { select: { replies: true } },
      },
    });
    return NextResponse.json(threads);
  } catch {
    return NextResponse.json([]);
  }
}
