import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Hash, Users, TrendingUp, Clock, Heart } from "lucide-react";
import styles from "./topic.module.css";

const TOPICS: Record<string, { name: string; color: string; emoji: string; desc: string; followers: string }> = {
  technology:   { name: "Technology",   color: "#348fff", emoji: "💻", desc: "Programming, AI, software design, and the future of computing.", followers: "12.4K" },
  design:       { name: "Design",       color: "#a78bfa", emoji: "🎨", desc: "Visual design, UX, product thinking, and creative craft.",        followers: "8.7K"  },
  science:      { name: "Science",      color: "#22c55e", emoji: "🔬", desc: "Research, discoveries, and making science approachable.",         followers: "6.2K"  },
  psychology:   { name: "Psychology",   color: "#f59e0b", emoji: "🧠", desc: "Behaviour, cognition, mental health, and how we think.",          followers: "5.1K"  },
  startups:     { name: "Startups",     color: "#f97316", emoji: "🚀", desc: "Founding, fundraising, growth, and founder stories.",             followers: "9.3K"  },
  health:       { name: "Health",       color: "#06b6d4", emoji: "🩺", desc: "Physical and mental wellbeing, evidence-based.",                  followers: "7.8K"  },
  philosophy:   { name: "Philosophy",   color: "#ec4899", emoji: "📖", desc: "Big ideas, ethics, epistemology, and how to live well.",          followers: "3.4K"  },
  productivity: { name: "Productivity", color: "#8b5cf6", emoji: "⚡", desc: "Systems, habits, and tools for doing your best work.",            followers: "10.1K" },
};

const TOPIC_ARTICLES = [
  { slug: "future-ai-writing",     title: "The Future of Writing Tools",           author: "Sarah Chen",    authorColor: "#348fff", readTime: "5 min",  likes: 847,  date: "Apr 10" },
  { slug: "design-systems-scale",  title: "Design Systems at Scale",               author: "Marcus Reid",   authorColor: "#a78bfa", readTime: "8 min",  likes: 612,  date: "Apr 9"  },
  { slug: "stoicism-productivity", title: "What Stoics Teach About Productivity",   author: "Dr. A. Patel", authorColor: "#22c55e", readTime: "6 min",  likes: 1243, date: "Apr 8"  },
  { slug: "deep-work-habits",      title: "6 Hours of Deep Work Every Day",         author: "James Okafor", authorColor: "#f97316", readTime: "7 min",  likes: 3241, date: "Apr 5"  },
  { slug: "quantum-computing",     title: "Quantum Computing in Plain English",     author: "Dr. A. Patel", authorColor: "#22c55e", readTime: "12 min", likes: 934,  date: "Apr 6"  },
];

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

  return (
    <div className={styles.page}>
      {/* Header */}
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
              <span><Users size={13} /> {topic.followers} followers</span>
              <span><Hash size={13} /> {TOPIC_ARTICLES.length} articles</span>
            </div>
            <button className="btn btn-primary" style={{ borderColor: topic.color, background: topic.color }}>
              Follow Topic
            </button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Articles */}
          <main>
            <h2 className={styles.sectionTitle}>
              <TrendingUp size={16} /> Trending in {topic.name}
            </h2>
            <div className={styles.articles}>
              {TOPIC_ARTICLES.map((a, i) => (
                <Link key={a.slug} href={`/article/${a.slug}`} className={styles.articleCard}>
                  <div className={styles.articleNum} style={{ color: topic.color }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className={styles.articleBody}>
                    <h3 className={styles.articleTitle}>{a.title}</h3>
                    <div className={styles.articleMeta}>
                      <div className="avatar avatar-sm" style={{ background: a.authorColor, fontSize: "0.6rem", width: "18px", height: "18px" }}>
                        {a.author[0]}
                      </div>
                      <span>{a.author}</span>
                      <span className={styles.dot}>·</span>
                      <Clock size={11} /><span>{a.readTime} read</span>
                      <span className={styles.dot}>·</span>
                      <Heart size={11} /><span>{a.likes.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={styles.articleDate}>{a.date}</span>
                </Link>
              ))}
            </div>
          </main>

          {/* Sidebar */}
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
                    <span className={styles.relatedCount}>{t.followers}</span>
                  </Link>
                ))}
            </div>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>Top Writers</h3>
              {[
                { name: "Sarah Chen",    handle: "sarahchen",   color: "#348fff" },
                { name: "Marcus Reid",   handle: "marcusreid",  color: "#a78bfa" },
                { name: "Dr. A. Patel", handle: "aishapatel",  color: "#22c55e" },
              ].map((w) => (
                <Link key={w.handle} href={`/profile/${w.handle}`} className={styles.writerRow}>
                  <div className="avatar avatar-sm" style={{ background: w.color, fontSize: "0.65rem" }}>{w.name[0]}</div>
                  <span className={styles.writerName}>{w.name}</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
