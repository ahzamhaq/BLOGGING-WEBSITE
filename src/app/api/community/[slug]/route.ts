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

// DELETE /api/community/[slug] — owner only
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  try {
    const community = await prisma.community.findUnique({ where: { slug } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
    });
    if (!membership || membership.role !== "owner") {
      return NextResponse.json({ error: "Only the owner can delete this community" }, { status: 403 });
    }

    await prisma.community.delete({ where: { id: community.id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}

// PATCH /api/community/[slug] — owner: lock/unlock or update name/desc
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json();

  try {
    const community = await prisma.community.findUnique({ where: { slug } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
    });
    if (!membership || (membership.role !== "owner" && membership.role !== "moderator")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const updated = await prisma.community.update({
      where: { id: community.id },
      data: {
        ...(body.type   !== undefined && { type: body.type }),
        ...(body.name   !== undefined && { name: body.name }),
        ...(body.desc   !== undefined && { desc: body.desc }),
        ...(body.rules  !== undefined && { rules: body.rules }),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update community" }, { status: 500 });
  }
}
