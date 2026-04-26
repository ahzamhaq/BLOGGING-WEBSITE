import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Twitter, Link2, Bookmark } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import styles from "./article.module.css";
import { ArticleActions } from "./ArticleActions";
import { Comments } from "./Comments";
import { FollowButton } from "@/components/FollowButton";
import { TextToSpeech } from "@/components/article/TextToSpeech";
import { ReadTimeTracker } from "@/components/article/ReadTimeTracker";
import { prisma } from "@/lib/db";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { title: true, subtitle: true, excerpt: true, coverImage: true },
  });
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.subtitle ?? article.excerpt ?? "",
    openGraph: article.coverImage ? { images: [article.coverImage] } : undefined,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, handle: true, image: true, bio: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!article || !article.published) notFound();

  const publishedAt = format(new Date(article.createdAt), "MMMM d, yyyy");
  const authorColor = "#348fff"; // fallback brand color — could store per-user

  // First tag for display
  const primaryTag = article.tags[0] ?? "General";

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header ─────────────────────────────────────────── */}
        <header className={styles.header}>
          {primaryTag && (
            <Link
              href={`/topics/${primaryTag.toLowerCase()}`}
              className={styles.tag}
              style={{ color: authorColor, background: authorColor + "15", borderColor: authorColor + "30" }}
            >
              {primaryTag}
            </Link>
          )}
          <h1 className={styles.title}>{article.title}</h1>
          {article.subtitle && <p className={styles.subtitle}>{article.subtitle}</p>}

          <div className={styles.authorBar}>
            <Link href={`/profile/${article.author.handle}`} className={styles.authorLink}>
              <div className="avatar avatar-md" style={{ background: authorColor }}>
                {(article.author.name ?? article.author.handle)[0].toUpperCase()}
              </div>
              <div>
                <p className={styles.authorName}>{article.author.name ?? article.author.handle}</p>
                <p className={styles.authorMeta}>
                  {publishedAt} · <Clock size={12} style={{ display: "inline" }} /> {article.readTime} min read
                </p>
              </div>
            </Link>
            <div className={styles.headerActions}>
              <FollowButton handle={article.author.handle} size="sm" />
              <Link href="#" className="btn btn-ghost btn-sm" aria-label="Share on Twitter"><Twitter size={14} /></Link>
              <Link href="#" className="btn btn-ghost btn-sm" aria-label="Copy link"><Link2 size={14} /></Link>
              <Link href="#" className="btn btn-ghost btn-sm" aria-label="Bookmark"><Bookmark size={14} /></Link>
            </div>
          </div>
        </header>

        {/* ── Read-time tracker (fires on leave) ─────────────── */}
        <ReadTimeTracker articleId={article.id} />

        {/* ── Text-to-speech ─────────────────────────────────── */}
        <div style={{ margin: "0 0 1rem" }}>
          <TextToSpeech content={article.content} />
        </div>

        {/* ── Cover image or accent bar ───────────────────────── */}
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className={styles.coverImg}
          />
        ) : (
          <div
            className={styles.heroImage}
            style={{ background: `linear-gradient(135deg, ${authorColor}18, ${authorColor}06)` }}
          >
            <div className={styles.heroImageAccent} style={{ background: authorColor }} />
          </div>
        )}

        {/* ── Article body ────────────────────────────────────── */}
        <div className={styles.bodyGrid}>
          {/* Like / bookmark sidebar */}
          <ArticleActions
            articleId={article.id}
            likes={article._count.likes}
            commentsCount={article._count.comments}
          />

          {/* Prose — rendered from stored HTML (supports links, images, iframes) */}
          <article
            className="prose"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* ── Author card ─────────────────────────────────────── */}
        <div className={styles.authorCard}>
          <div className="avatar avatar-xl" style={{ background: authorColor }}>
            {(article.author.name ?? article.author.handle)[0].toUpperCase()}
          </div>
          <div className={styles.authorCardInfo}>
            <p className={styles.authorCardLabel}>Written by</p>
            <Link href={`/profile/${article.author.handle}`} className={styles.authorCardName}>
              {article.author.name ?? article.author.handle}
            </Link>
            {article.author.bio && (
              <p className={styles.authorCardBio}>{article.author.bio}</p>
            )}
            <FollowButton handle={article.author.handle} size="sm" />
          </div>
        </div>

        {/* ── Comments ────────────────────────────────────────── */}
        <Comments articleId={article.id} />
      </div>
    </div>
  );
}
