import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const session = await auth();

  const target = await prisma.user.findUnique({
    where: { handle },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const follows = await prisma.follow.findMany({
    where: { followingId: target.id },
    include: {
      follower: {
        select: { id: true, handle: true, name: true, image: true, bio: true,
          _count: { select: { followers: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Check which of these the current user also follows
  let currentUserFollowing: Set<string> = new Set();
  if (session?.user?.id) {
    const myFollows = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    currentUserFollowing = new Set(myFollows.map(f => f.followingId));
  }

  const users = follows.map(f => ({
    id: f.follower.id,
    handle: f.follower.handle,
    name: f.follower.name,
    image: f.follower.image,
    bio: f.follower.bio,
    followers: f.follower._count.followers,
    isFollowing: currentUserFollowing.has(f.follower.id),
    isMe: session?.user?.id === f.follower.id,
  }));

  return NextResponse.json({ users, total: users.length });
}
