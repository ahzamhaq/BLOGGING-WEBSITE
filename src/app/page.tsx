import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Check, TrendingUp, Crown } from "lucide-react";
import styles from "./home.module.css";
import { auth } from "@/auth";
import { LandingPage } from "@/components/home/LandingPage";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "WriteSpace — Where Great Writing Lives",
  description: "Discover thoughtful articles from serious writers. Publish your ideas, build your audience, and earn from your work.",
};

const TOPICS = [
  "Technology","Design","Startups","Science","Philosophy",
  "Productivity","Psychology","Health","Engineering",
];

const TAG_COLORS: Record<string, string> = {
  Technology: "#5aaeff", Design: "#c4b5fd", Philosophy: "#f5a0b0",
  Startups: "#f97316", Science: "#6ee7b7", Health: "#06b6d4",
  Productivity: "#8b5cf6", Psychology: "#f59e0b", Engineering: "#fbbf24",
};

export default async function HomePage() {
  const session = await auth();
  if (!session) return <LandingPage />;

  // Fetch real articles from DB
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      author: { select: { name: true, handle: true } },
      _count: { select: { likes: true } },
    },
  });

  // Featured = most liked published article
  const featured = await prisma.article.findFirst({
    where: { published: true },
    orderBy: { likes: { _count: "desc" } },
    include: { author: { select: { name: true, handle: true, bio: true } } },
  });

  return (
    <div className={styles.page}>
      <div className={styles.crumb}>
        <span className={styles.crumbAccent}>◆</span>
        <span>Latest</span>
        <span>·</span>
        <span>WriteSpace Feed</span>
      </div>

      {/* Featured hero — real top article or placeholder */}
      {featured ? (
        <section className={styles.featured}>
          <div>
            <span className={styles.featuredLabel}>
              <Sparkles size={11} /> Most Liked
            </span>
            <h1 className={styles.featuredTitle}>{featured.title}</h1>
            {featured.subtitle && <p className={styles.featuredExcerpt}>{featured.subtitle}</p>}
            {!featured.subtitle && featured.excerpt && <p className={styles.featuredExcerpt}>{featured.excerpt}</p>}
            <div className={styles.featuredMeta}>
              <strong>{featured.author.name ?? featured.author.handle}</strong>
              <span className={styles.featuredDot} />
              <span>{featured.readTime} min read</span>
            </div>
            <Link href={`/article/${featured.slug}`} className={styles.featuredBtn}>
              Read story <ArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.featuredVisual}>
            <div className={styles.featuredGrid} />
          </div>
        </section>
      ) : (
        <section className={styles.featured}>
          <div>
            <span className={styles.featuredLabel}><Sparkles size={11} /> Welcome</span>
            <h1 className={styles.featuredTitle}>Start Writing on WriteSpace</h1>
            <p className={styles.featuredExcerpt}>
              Publish your first article, build your audience, and connect with other writers.
            </p>
            <Link href="/editor/new" className={styles.featuredBtn}>
              Write now <ArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.featuredVisual}>
            <div className={styles.featuredGrid} />
          </div>
        </section>
      )}

      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Latest Articles</h2>
          <p className={styles.sectionSub}>Fresh from the WriteSpace community</p>
        </div>
        <Link href="/explore" className={styles.sectionLink}>
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className={styles.layout}>
        <div className={styles.cards}>
          {articles.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", opacity: 0.5, gridColumn: "1/-1" }}>
              <p>No articles yet. Be the first to write!</p>
              <Link href="/editor/new" className="btn btn-primary" style={{ marginTop: "1rem" }}>Write Article</Link>
            </div>
          ) : articles.map((a, i) => {
            const tag = a.tags[0] ?? "General";
            const tagColor = TAG_COLORS[tag] ?? "#64748b";
            const coverClass = `cover${String.fromCharCode(65 + (i % 6))}` as keyof typeof styles;
            return (
              <Link key={a.id} href={`/article/${a.slug}`} className={styles.card}>
                <div className={`${styles.cardCover} ${styles[coverClass] ?? ""}`} />
                <div className={styles.cardBody}>
                  <div className={styles.cardTag} style={{ color: tagColor }}>{tag}</div>
                  <h3 className={styles.cardTitle}>{a.title}</h3>
                  {a.excerpt && <p className={styles.cardExcerpt}>{a.excerpt}</p>}
                  <div className={styles.cardFooter}>
                    <strong>{a.author.name ?? a.author.handle}</strong>
                    <span>·</span>
                    <span>{a.readTime} min</span>
                    <span>·</span>
                    <span>{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <aside className={styles.rightPanel}>
          <div className={styles.proCard}>
            <span className={styles.proBadge}><Crown size={11} /> Pro</span>
            <h3 className={styles.proTitle}>Pro Membership</h3>
            <p className={styles.proDesc}>
              Unlock premium writing tools, monetize your work, and read without limits.
            </p>
            <ul className={styles.proList}>
              <li><Check size={13} /> Ad-free reading everywhere</li>
              <li><Check size={13} /> Premium fonts &amp; themes</li>
              <li><Check size={13} /> Tip jar and revenue share</li>
              <li><Check size={13} /> Offline sync across devices</li>
            </ul>
            <Link href="/settings" className={styles.proBtn}>
              Upgrade Now <ArrowRight size={13} />
            </Link>
          </div>

          <div className={styles.topicsCard}>
            <h3 className={styles.topicsTitle}><TrendingUp size={13} /> Trending Topics</h3>
            <div className={styles.topicsRow}>
              {TOPICS.map((t) => (
                <Link key={t} href={`/explore?q=${encodeURIComponent(t)}`} className={styles.topicChip}>
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
