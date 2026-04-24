import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

interface Params { params: Promise<{ slug: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  try {
    const community = await prisma.community.findUnique({ where: { slug } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
    });

    if (existing) {
      // Leave
      await prisma.communityMember.delete({
        where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
      });
      return NextResponse.json({ joined: false });
    }

    // Join (for request type, role is still "member" — admin approval is future work)
    await prisma.communityMember.create({
      data: { communityId: community.id, userId: session.user.id, role: "member" },
    });
    return NextResponse.json({ joined: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
