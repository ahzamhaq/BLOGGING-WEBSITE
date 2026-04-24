import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Hash, Users, TrendingUp, Clock, Heart } from "lucide-react";
import styles from "./topic.module.css";
import { prisma } from "@/lib/db";

const TOPICS: Record<string, { name: string; color: string; emoji: string; desc: string }> = {
  technology:   { name: "Technology",   color: "#348fff", emoji: "💻", desc: "Programming, AI, software design, and the future of computing." },
  design:       { name: "Design",       color: "#a78bfa", emoji: "🎨", desc: "Visual design, UX, product thinking, and creative craft."        },
  science:      { name: "Science",      color: "#22c55e", emoji: "🔬", desc: "Research, discoveries, and making science approachable."         },
  psychology:   { name: "Psychology",   color: "#f59e0b", emoji: "🧠", desc: "Behaviour, cognition, mental health, and how we think."          },
  startups:     { name: "Startups",     color: "#f97316", emoji: "🚀", desc: "Founding, fundraising, growth, and founder stories."             },
  health:       { name: "Health",       color: "#06b6d4", emoji: "🩺", desc: "Physical and mental wellbeing, evidence-based."                  },
  philosophy:   { name: "Philosophy",   color: "#ec4899", emoji: "📖", desc: "Big ideas, ethics, epistemology, and how to live well."          },
  productivity: { name: "Productivity", color: "#8b5cf6", emoji: "⚡", desc: "Systems, habits, and tools for doing your best work."            },
};

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = TOPICS[slug];
  if (!topic) return { title: "Topic Not Found" };
  return { title: `${topic.name} — WriteSpace`, description: topic.desc };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = TOPICS[slug];
  if (!topic) notFound();

  // Fetch real articles matching this tag (case-insensitive via contains approach)
  const articles = await prisma.article.findMany({
    where: {
      published: true,
      tags: { has: topic.name },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: { select: { name: true, handle: true } },
      _count: { select: { likes: true } },
    },
  });

  // Also try slug-based tag match as fallback
  const articlesBySlug = articles.length === 0
    ? await prisma.article.findMany({
        where: { published: true, tags: { has: slug } },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          author: { select: { name: true, handle: true } },
          _count: { select: { likes: true } },
        },
      })
    : articles;

  const displayArticles = articlesBySlug;

  // Count followers (how many users have bookmarked articles with this tag — proxy metric)
  const followerCount = await prisma.article.count({ where: { published: true, tags: { has: topic.name } } });

  return (
    <div className={styles.page}>
      <div className={styles.hero} style={{ background: `linear-gradient(160deg, ${topic.color}14, transparent 60%)` }}>
        <div className={styles.heroBorder} style={{ background: topic.color }} />
        <div className={styles.heroContent}>
          <span className={styles.emoji}>{topic.emoji}</span>
          <div>
            <h1 className={styles.title}>{topic.name}</h1>
            <p className={styles.desc}>{topic.desc}</p>
          </div>
          <div className={styles.heroActions}>
            <div className={styles.heroStats}>
              <span><Users size={13} /> {followerCount} articles</span>
              <span><Hash size={13} /> {displayArticles.length} published</span>
            </div>
            <button className="btn btn-primary" style={{ borderColor: topic.color, background: topic.color }}>
              Follow Topic
            </button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          <main>
            <h2 className={styles.sectionTitle}>
              <TrendingUp size={16} /> {displayArticles.length > 0 ? `Trending in ${topic.name}` : `No articles in ${topic.name} yet`}
            </h2>
            {displayArticles.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", opacity: 0.5 }}>
                <p>Be the first to write about {topic.name}!</p>
                <Link href="/editor/new" className="btn btn-primary" style={{ marginTop: "1rem" }}>Write Article</Link>
              </div>
            ) : (
              <div className={styles.articles}>
                {displayArticles.map((a, i) => (
                  <Link key={a.id} href={`/article/${a.slug}`} className={styles.articleCard}>
                    <div className={styles.articleNum} style={{ color: topic.color }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className={styles.articleBody}>
                      <h3 className={styles.articleTitle}>{a.title}</h3>
                      <div className={styles.articleMeta}>
                        <div className="avatar avatar-sm" style={{ background: topic.color, fontSize: "0.6rem", width: "18px", height: "18px" }}>
                          {(a.author.name ?? a.author.handle)[0].toUpperCase()}
                        </div>
                        <span>{a.author.name ?? a.author.handle}</span>
                        <span className={styles.dot}>·</span>
                        <Clock size={11} /><span>{a.readTime} min read</span>
                        <span className={styles.dot}>·</span>
                        <Heart size={11} /><span>{a._count.likes}</span>
                      </div>
                    </div>
                    <span className={styles.articleDate}>
                      {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </main>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>Related Topics</h3>
              {Object.entries(TOPICS)
                .filter(([s]) => s !== slug)
                .slice(0, 5)
                .map(([s, t]) => (
                  <Link key={s} href={`/topics/${s}`} className={styles.relatedTopic}>
                    <span>{t.emoji}</span>
                    <span className={styles.relatedName}>{t.name}</span>
                  </Link>
                ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
