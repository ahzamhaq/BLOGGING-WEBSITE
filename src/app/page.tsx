import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Sparkles, Check, TrendingUp, Crown
} from "lucide-react";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "WriteSpace — Where Great Writing Lives",
  description:
    "Discover thoughtful articles from serious writers. Publish your ideas, build your audience, and earn from your work.",
};

const FEED = [
  {
    slug: "neural-writing-prompt",
    cover: "coverA",
    tag: "Technology",
    tagColor: "#5aaeff",
    title: "Neural Writing: Beyond the Prompt",
    excerpt:
      "Examining how systems produce words in sequence and what writers can borrow from the underlying models.",
    author: "Sarah Chen",
    readTime: "6 min",
    date: "Apr 10",
  },
  {
    slug: "haptic-screen-texture",
    cover: "coverB",
    tag: "Design",
    tagColor: "#c4b5fd",
    title: "The Haptic-Screen Texture in Pixels",
    excerpt:
      "How texture returned to the web without skeuomorphism, and why tactile micro-feedback matters again.",
    author: "Marcus Reid",
    readTime: "8 min",
    date: "Apr 9",
  },
  {
    slug: "pro-membership",
    cover: "coverC",
    tag: "Membership",
    tagColor: "#38d5dd",
    title: "What you get with Pro Membership",
    excerpt:
      "An honest breakdown of every Pro feature — ad-free reading, premium fonts, and offline sync included.",
    author: "WriteSpace Team",
    readTime: "4 min",
    date: "Apr 9",
  },
  {
    slug: "death-of-algorithm",
    cover: "coverD",
    tag: "Culture",
    tagColor: "#f5a0b0",
    title: "The Death of the Algorithm",
    excerpt:
      "Why curated feeds are replacing machine-ranked ones, and what that means for writers in 2026.",
    author: "Priya Narayan",
    readTime: "10 min",
    date: "Apr 7",
  },
  {
    slug: "satellite-mesh-silk-road",
    cover: "coverE",
    tag: "Science",
    tagColor: "#6ee7b7",
    title: "Satellite Mesh: The New Silk Road",
    excerpt:
      "Low-orbit constellations are rewiring how information travels — and quietly redrawing borders.",
    author: "Dr. A. Patel",
    readTime: "12 min",
    date: "Apr 6",
  },
  {
    slug: "optimizing-zero-latency",
    cover: "coverF",
    tag: "Engineering",
    tagColor: "#fbbf24",
    title: "Optimizing for Zero Latency",
    excerpt:
      "A deep dive into the 1 ms ambition — how edge compute, protocol tweaks, and pre-fetch get us there.",
    author: "James Okafor",
    readTime: "7 min",
    date: "Apr 5",
  },
];

const TOPICS = [
  "Technology","Design","Startups","Science","Philosophy",
  "Productivity","Psychology","Culture","Engineering",
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.crumb}>
        <span className={styles.crumbAccent}>◆</span>
        <span>Architecture</span>
        <span>·</span>
        <span>Digital Craft</span>
      </div>

      {/* Featured hero */}
      <section className={styles.featured}>
        <div>
          <span className={styles.featuredLabel}>
            <Sparkles size={11} /> Editor&apos;s Pick
          </span>
          <h1 className={styles.featuredTitle}>
            Architecting <em>Digital Solitude</em> in 2026
          </h1>
          <p className={styles.featuredExcerpt}>
            A long read on building interfaces that respect quiet — a boutique
            aesthetic that balances the clinical precision of a terminal with
            the editorial elegance of a printed magazine.
          </p>
          <div className={styles.featuredMeta}>
            <strong>Elias Thorne</strong>
            <span className={styles.featuredDot} />
            <span>Design Lead</span>
            <span className={styles.featuredDot} />
            <span>8 min read</span>
          </div>
          <Link href="/article/digital-solitude" className={styles.featuredBtn}>
            Read story <ArrowRight size={14} />
          </Link>
        </div>
        <div className={styles.featuredVisual}>
          <div className={styles.featuredGrid} />
        </div>
      </section>

      {/* Section head */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Latest Frequency</h2>
          <p className={styles.sectionSub}>
            Curated signals from the writers you follow
          </p>
        </div>
        <Link href="/explore" className={styles.sectionLink}>
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {/* Feed + right panel */}
      <div className={styles.layout}>
        <div className={styles.cards}>
          {FEED.map((a) => (
            <Link key={a.slug} href={`/article/${a.slug}`} className={styles.card}>
              <div className={`${styles.cardCover} ${styles[a.cover]}`} />
              <div className={styles.cardBody}>
                <div className={styles.cardTag} style={{ color: a.tagColor }}>
                  {a.tag}
                </div>
                <h3 className={styles.cardTitle}>{a.title}</h3>
                <p className={styles.cardExcerpt}>{a.excerpt}</p>
                <div className={styles.cardFooter}>
                  <strong>{a.author}</strong>
                  <span>·</span>
                  <span>{a.readTime}</span>
                  <span>·</span>
                  <span>{a.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <aside className={styles.rightPanel}>
          <div className={styles.proCard}>
            <span className={styles.proBadge}>
              <Crown size={11} /> Pro
            </span>
            <h3 className={styles.proTitle}>Pro Membership</h3>
            <p className={styles.proDesc}>
              Unlock premium writing tools, monetize your work, and read without limits.
            </p>
            <ul className={styles.proList}>
              <li><Check size={13} /> Ad-free reading everywhere</li>
              <li><Check size={13} /> Premium fonts & themes</li>
              <li><Check size={13} /> Tip jar and revenue share</li>
              <li><Check size={13} /> Offline sync across devices</li>
            </ul>
            <Link href="/settings" className={styles.proBtn}>
              Upgrade Now <ArrowRight size={13} />
            </Link>
          </div>

          <div className={styles.topicsCard}>
            <h3 className={styles.topicsTitle}>
              <TrendingUp size={13} /> Trending Topics
            </h3>
            <div className={styles.topicsRow}>
              {TOPICS.map((t) => (
                <Link
                  key={t}
                  href={`/explore?q=${encodeURIComponent(t)}`}
                  className={styles.topicChip}
                >
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
