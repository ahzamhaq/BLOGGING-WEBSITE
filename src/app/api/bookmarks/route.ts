import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        article: {
          include: { author: { select: { name: true, handle: true } } },
        },
      },
    });
    return NextResponse.json(bookmarks);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
