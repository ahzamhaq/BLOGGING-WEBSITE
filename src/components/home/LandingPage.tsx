import Link from "next/link";
import { ArrowRight, Feather, PenLine, Users, BookOpen, Sparkles, Star, TrendingUp, Shield } from "lucide-react";
import styles from "./LandingPage.module.css";

const TRENDING = [
  { slug: "future-ai-writing",    title: "The Future of AI Writing Tools",                  tag: "Technology", tagColor: "#348fff", author: "Sarah Chen",    readTime: "5 min" },
  { slug: "design-systems-scale", title: "Design Systems at Scale: Lessons from 10M Users", tag: "Design",     tagColor: "#a78bfa", author: "Marcus Reid",   readTime: "8 min" },
  { slug: "digital-solitude",     title: "Architecting Digital Solitude in 2026",            tag: "Culture",    tagColor: "#f5a0b0", author: "Elias Thorne",  readTime: "8 min" },
  { slug: "neural-writing-prompt",title: "Neural Writing: Beyond the Prompt",                tag: "Technology", tagColor: "#5aaeff", author: "Sarah Chen",    readTime: "6 min" },
  { slug: "death-of-algorithm",   title: "The Death of the Algorithm",                       tag: "Culture",    tagColor: "#f5a0b0", author: "Priya Narayan", readTime: "10 min" },
  { slug: "haptic-screen-texture",title: "The Haptic-Screen Texture in Pixels",              tag: "Design",     tagColor: "#c4b5fd", author: "Marcus Reid",   readTime: "8 min" },
];

const FEATURES = [
  { icon: PenLine,  title: "Powerful Editor",        desc: "A distraction-free editor with AI assistance, voice input, rich formatting, and real-time word count." },
  { icon: Users,    title: "Community Rooms",         desc: "Join topic-based rooms, discuss ideas with writers who care, and build meaningful connections." },
  { icon: BookOpen, title: "Curated Reading",         desc: "A personalised feed based on what you follow — no algorithms, no clickbait, just depth." },
  { icon: Sparkles, title: "AI Writing Assistant",   desc: "Improve, expand, shorten, or get fresh ideas — your AI co-writer is always one click away." },
  { icon: Star,     title: "Pro Monetisation",       desc: "Earn through the tip jar, revenue share, and exclusive Pro membership perks." },
  { icon: Shield,   title: "Privacy First",          desc: "No ads, no data selling. Your writing and your audience belong to you." },
];

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Feather size={13} />
            <span>WriteSpace — Where Great Writing Lives</span>
          </div>
          <h1 className={styles.heroTitle}>
            A home for writing
            <br />
            <em>that actually matters</em>
          </h1>
          <p className={styles.heroSub}>
            Publish your ideas, grow your audience, and connect with readers who care about depth — not just clicks.
          </p>
          <div className={styles.heroActions}>
            <Link href="/auth/signup" className={`btn btn-primary btn-lg ${styles.heroCta}`}>
              Start writing free <ArrowRight size={16} />
            </Link>
            <Link href="/auth/signin" className="btn btn-secondary btn-lg">
              Sign in
            </Link>
          </div>
          <p className={styles.heroNote}>No credit card required · Free forever for readers</p>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className={styles.features}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Everything you need to write seriously</h2>
          <p className={styles.sectionSub}>Built for writers who value craft over vanity metrics.</p>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={styles.featureCard}>
              <div className={styles.featureIcon}><Icon size={20} /></div>
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trending articles ─────────────────────────────────── */}
      <section className={styles.trending}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitleRow}>
            <TrendingUp size={18} />
            <h2 className={styles.sectionTitle}>Trending on WriteSpace</h2>
          </div>
          <p className={styles.sectionSub}>Read for free — sign up to comment, follow, and publish.</p>
        </div>
        <div className={styles.articleGrid}>
          {TRENDING.map((a) => (
            <Link key={a.slug} href={`/article/${a.slug}`} className={styles.articleCard}>
              <span className={styles.articleTag} style={{ color: a.tagColor }}>{a.tag}</span>
              <h3 className={styles.articleTitle}>{a.title}</h3>
              <div className={styles.articleMeta}>
                <strong>{a.author}</strong>
                <span>·</span>
                <span>{a.readTime} read</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────── */}
      <section className={styles.cta}>
        <div className={styles.ctaBg} aria-hidden />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to share your story?</h2>
          <p className={styles.ctaSub}>Join thousands of writers publishing thoughtful work on WriteSpace.</p>
          <Link href="/auth/signup" className={`btn btn-primary btn-lg ${styles.ctaBtn}`}>
            Create free account <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
