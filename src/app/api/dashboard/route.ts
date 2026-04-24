import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const [articles, followers, bookmarkCount, views] = await Promise.all([
      prisma.article.findMany({
        where: { authorId: userId },
        include: {
          likes: { select: { id: true } },
          _count: { select: { comments: true, views: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.articleView.findMany({
        where: { article: { authorId: userId } },
        select: { readTime: true, createdAt: true },
      }),
    ]);

    const published = articles.filter(a => a.published);
    const totalLikes = published.reduce((sum, a) => sum + a.likes.length, 0);
    const totalViews = published.reduce((sum, a) => sum + a._count.views, 0);

    // Average read time from real tracked view events (in seconds → minutes)
    const avgReadTimeSec = views.length
      ? views.reduce((s, v) => s + v.readTime, 0) / views.length
      : 0;
    const avgReadTimeMin = Math.round((avgReadTimeSec / 60) * 10) / 10;

    // Follower growth: last 7 days using actual follow createdAt
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const recentFollows = await prisma.follow.findMany({
      where: { followingId: userId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    // Build daily counts for the past 7 days
    const followerGrowth = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const count = recentFollows.filter(f => f.createdAt.toISOString().slice(0, 10) === dateStr).length;
      return { date: dateStr, count };
    });

    // Views per day (last 7)
    const recentViews = await prisma.articleView.findMany({
      where: { article: { authorId: userId }, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });
    const viewsByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const count = recentViews.filter(v => v.createdAt.toISOString().slice(0, 10) === dateStr).length;
      return { date: dateStr, count };
    });

    return NextResponse.json({
      totalArticles: published.length,
      totalLikes,
      totalViews,
      followers,
      avgReadTime: avgReadTimeMin,
      bookmarkCount,
      followerGrowth,   // [{date, count}] × 7 days
      viewsByDay,       // [{date, count}] × 7 days
      recentArticles: published.slice(0, 5).map(a => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        likes: a.likes.length,
        comments: a._count.comments,
        views: a._count.views,
        readTime: a.readTime,
        date: a.createdAt,
      })),
    });
  } catch (err) {
    console.error("[dashboard]", err);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
