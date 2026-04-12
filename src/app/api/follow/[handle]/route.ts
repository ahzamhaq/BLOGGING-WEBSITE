import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/follow/[handle] — check if current user follows this handle
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const session = await auth();
  const { handle } = await params;

  const target = await prisma.user.findUnique({
    where: { handle },
    select: { id: true, _count: { select: { followers: true, following: true } } },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let isFollowing = false;
  if (session?.user?.id) {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: target.id } },
    });
    isFollowing = !!f;
  }

  return NextResponse.json({
    isFollowing,
    followers: target._count.followers,
    following: target._count.following,
  });
}

// POST /api/follow/[handle] — toggle follow
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { handle } = await params;
  const target = await prisma.user.findUnique({ where: { handle }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === session.user.id)
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: session.user.id, followingId: target.id } },
    });
    return NextResponse.json({ isFollowing: false });
  } else {
    await prisma.follow.create({
      data: { followerId: session.user.id, followingId: target.id },
    });
    // Create notification for the followed user
    await prisma.notification.create({
      data: {
        userId:  target.id,
        type:    "follow",
        message: `${session.user.name ?? "Someone"} started following you.`,
        link:    `/profile/${handle}`,
      },
    });
    return NextResponse.json({ isFollowing: true });
  }
}
