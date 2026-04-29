"use client";

import Link from "next/link";
import { Clock, Heart, Bookmark } from "lucide-react";
import styles from "./FeaturedArticles.module.css";

const ARTICLES = [
  {
    id: "1",
    slug: "future-of-ai-writing-tools",
    tag: "Technology",
    tagColor: "#348fff",
    title: "The Future of AI Writing Tools: How Machine Learning is Reshaping Creativity",
    excerpt: "Artificial intelligence is no longer just a buzzword — it's fundamentally changing how writers research, draft, and refine their work. Here's what the next five years look like.",
    author: { name: "Sarah Chen", avatar: "S", color: "#348fff" },
    readTime: "5 min",
    likes: 847,
    featured: true,
  },
  {
    id: "2",
    slug: "design-systems-at-scale",
    tag: "Design",
    tagColor: "#a78bfa",
    title: "Design Systems at Scale: Lessons from Building for 10M Users",
    excerpt: "After three years of iterating on our design system, here's what we learned about consistency, communication, and the hidden costs of technical debt.",
    author: { name: "Marcus Reid", avatar: "M", color: "#a78bfa" },
    readTime: "8 min",
    likes: 612,
    featured: false,
  },
  {
    id: "3",
    slug: "stoicism-modern-productivity",
    tag: "Philosophy",
    tagColor: "#ec4899",
    title: "What Ancient Stoics Can Teach Us About Modern Productivity",
    excerpt: "Marcus Aurelius managed a Roman empire. You manage a Slack inbox. The principles are surprisingly similar — and surprisingly effective.",
    author: { name: "Dr. Aisha Patel", avatar: "A", color: "#22c55e" },
    readTime: "6 min",
    likes: 1243,
    featured: false,
  },
  {
    id: "4",
    slug: "seed-funding-mistakes",
    tag: "Startups",
    tagColor: "#f97316",
    title: "7 Mistakes We Made Raising Our Seed Round (And How to Avoid Them)",
    excerpt: "We raised $2.4M after 11 months of failed attempts. Here's the complete, brutally honest story of what we got wrong — and what finally worked.",
    author: { name: "James Okafor", avatar: "J", color: "#f97316" },
    readTime: "10 min",
    likes: 2108,
    featured: false,
  },
];

export function FeaturedArticles() {
  const [featured, ...rest] = ARTICLES;

  return (
    <section className={styles.section} aria-labelledby="articles-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 id="articles-heading" className={styles.title}>
            <span className="gradient-text">Featured</span> This Week
          </h2>
          <Link href="/explore" className="btn btn-ghost btn-sm">Browse all →</Link>
        </div>

        <div className={styles.grid}>
          {/* Featured large card */}
          <Link href={`/article/${featured.slug}`} className={`${styles.card} ${styles.cardLarge}`}>
            <div className={styles.cardImagePlaceholder} style={{ background: `linear-gradient(135deg, ${featured.tagColor}22, ${featured.tagColor}08)` }}>
              <div className={styles.cardImageAccent} style={{ background: featured.tagColor }} />
            </div>
            <div className={styles.cardBody}>
              <span className={styles.tag} style={{ color: featured.tagColor, background: featured.tagColor + "15", borderColor: featured.tagColor + "30" }}>{featured.tag}</span>
              <h3 className={styles.cardTitle}>{featured.title}</h3>
              <p className={styles.cardExcerpt}>{featured.excerpt}</p>
              <ArticleMeta article={featured} />
            </div>
          </Link>

          {/* Smaller cards */}
          <div className={styles.sideCards}>
            {rest.map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`} className={`${styles.card} ${styles.cardSmall}`}>
                <div className={styles.cardSmallAccent} style={{ background: article.tagColor }} />
                <div className={styles.cardBody}>
                  <span className={styles.tag} style={{ color: article.tagColor, background: article.tagColor + "15", borderColor: article.tagColor + "30" }}>{article.tag}</span>
                  <h3 className={`${styles.cardTitle} ${styles.cardTitleSmall}`}>{article.title}</h3>
                  <ArticleMeta article={article} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArticleMeta({ article }: { article: typeof ARTICLES[0] }) {
  return (
    <div className={styles.meta}>
      <div className={styles.authorRow}>
        <div className="avatar avatar-sm" style={{ background: article.author.color, fontSize: "0.7rem" }}>
          {article.author.avatar}
        </div>
        <span className={styles.authorName}>{article.author.name}</span>
      </div>
      <div className={styles.metaRight}>
        <span className={styles.metaItem}><Clock size={12} />{article.readTime}</span>
        <span className={styles.metaItem}><Heart size={12} />{article.likes.toLocaleString()}</span>
        <button className={styles.bookmarkBtn} onClick={(e) => e.preventDefault()} aria-label="Bookmark article">
          <Bookmark size={14} />
        </button>
      </div>
    </div>
  );
}
