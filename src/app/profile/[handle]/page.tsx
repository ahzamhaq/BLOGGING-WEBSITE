import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Award, Star, MapPin, Calendar } from "lucide-react";
import styles from "./profile.module.css";
import { ProfileClient } from "./ProfileClient";

interface Props { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = await prisma.user.findUnique({ where: { handle }, select: { name: true, bio: true } });
  if (!user) return { title: "Writer Not Found" };
  return {
    title: `${user.name ?? handle} — WriteSpace`,
    description: user.bio ?? `Read articles by ${user.name ?? handle} on WriteSpace.`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;

  const user = await prisma.user.findUnique({
    where: { handle },
    include: {
      articles: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { likes: true, comments: true, views: true } } },
      },
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) notFound();

  const topics = [...new Set(user.articles.flatMap(a => a.tags))].slice(0, 8);

  const achievements = [
    user.articles.length >= 1  && { emoji: "✍️", label: "Published Writer",  sub: `${user.articles.length} article${user.articles.length !== 1 ? "s" : ""}` },
    user.articles.length >= 5  && { emoji: "📚", label: "Prolific Author",    sub: "5+ articles published" },
    user._count.followers >= 10 && { emoji: "⭐", label: "Growing Audience",   sub: `${user._count.followers} followers` },
    user._count.followers >= 50 && { emoji: "🔥", label: "Rising Star",        sub: "50+ followers" },
    user.articles.length >= 1  && user.articles.reduce((s, a) => s + a._count.likes, 0) >= 10 && { emoji: "❤️", label: "Beloved Writer", sub: "10+ total likes" },
  ].filter(Boolean) as { emoji: string; label: string; sub: string }[];

  const serialisedArticles = user.articles.map(a => ({
    id: a.id, slug: a.slug, title: a.title, subtitle: a.subtitle,
    coverImage: a.coverImage, tags: a.tags, readTime: a.readTime,
    createdAt: a.createdAt.toISOString(),
    likes: a._count.likes, comments: a._count.comments, views: a._count.views,
  }));

  return (
    <ProfileClient
      handle={user.handle}
      userId={user.id}
      name={user.name}
      image={user.image}
      bio={user.bio}
      createdAt={user.createdAt.toISOString()}
      followers={user._count.followers}
      following={user._count.following}
      articleCount={user.articles.length}
      articles={serialisedArticles}
      topics={topics}
      achievements={achievements}
    />
  );
}
