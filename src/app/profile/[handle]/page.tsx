import type { Metadata } from "next";
import Link from "next/link";
import { FileText, TrendingUp, Users, Settings, Star, Award } from "lucide-react";
import styles from "./profile.module.css";

// Mock profile data — replace with DB query in Phase 1
const PROFILES: Record<string, {
  handle: string; name: string; bio: string; color: string;
  tag: string; followers: number; following: number; articles: number;
  joinedDate: string; website?: string; location?: string;
}> = {
  sarahchen: {
    handle: "sarahchen", name: "Sarah Chen", color: "#348fff", tag: "Technology",
    bio: "AI researcher & tech writer. I make complex ideas accessible for everyone. Former Google Brain. Writing about the future of machine learning, human-computer interaction, and the ethics of AI.",
    followers: 14200, following: 312, articles: 89,
    joinedDate: "March 2024", website: "sarahchen.dev", location: "San Francisco, CA",
  },
  marcusreid: {
    handle: "marcusreid", name: "Marcus Reid", color: "#a78bfa", tag: "Design",
    bio: "Design systems lead at a Fortune 500. Writing about craft, scale, and the beauty of constraints. I believe good design is invisible.",
    followers: 9800, following: 204, articles: 54,
    joinedDate: "June 2024", website: "marcusreid.design", location: "New York, NY",
  },
};

const ARTICLES = [
  { slug: "future-ai-writing",    title: "The Future of AI Writing Tools",           tag: "Technology", tagColor: "#348fff", readTime: "5 min", likes: 847,  date: "Apr 10" },
  { slug: "design-systems-scale", title: "Design Systems at Scale",                  tag: "Design",     tagColor: "#a78bfa", readTime: "8 min", likes: 612,  date: "Apr 9"  },
  { slug: "stoicism-productivity",title: "What Stoics Teach Us About Productivity",  tag: "Philosophy", tagColor: "#ec4899", readTime: "6 min", likes: 1203, date: "Apr 8"  },
  { slug: "seed-mistakes",        title: "7 Mistakes Raising Our Seed Round",        tag: "Startups",   tagColor: "#f97316", readTime: "10 min",likes: 2108, date: "Apr 7"  },
];

interface Props { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = PROFILES[handle];
  if (!profile) return { title: "Writer Not Found" };
  return {
    title: `${profile.name} — Writer Profile`,
    description: profile.bio,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = PROFILES[handle] ?? {
    handle, name: handle, color: "#348fff", tag: "Writer",
    bio: "Writer on WriteSpace.", followers: 0, following: 0, articles: 0,
    joinedDate: "2026",
  };

  const STATS = [
    { icon: FileText,   label: "Articles",   value: profile.articles },
    { icon: Users,      label: "Followers",  value: profile.followers.toLocaleString() },
    { icon: TrendingUp, label: "Following",  value: profile.following },
  ];

  return (
    <div className={styles.page}>
      {/* Cover */}
      <div className={styles.cover} style={{ background: `linear-gradient(135deg, ${profile.color}25, ${profile.color}08)` }}>
        <div className={styles.coverAccent} style={{ background: profile.color }} />
      </div>

      <div className={styles.container}>
        {/* Profile header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <div className={`avatar avatar-2xl ${styles.avatar}`} style={{ background: `linear-gradient(135deg, ${profile.color}cc, ${profile.color})` }}>
              {profile.name[0]}
            </div>
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.profileTop}>
              <div>
                <h1 className={styles.profileName}>{profile.name}</h1>
                <p className={styles.profileHandle}>@{profile.handle}</p>
              </div>
              <div className={styles.profileActions}>
                <button className="btn btn-primary">Follow</button>
                <Link href="/settings" className="btn btn-ghost btn-sm" aria-label="Settings">
                  <Settings size={16} />
                </Link>
              </div>
            </div>

            <p className={styles.profileBio}>{profile.bio}</p>

            <div className={styles.profileMeta}>
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.website && (
                <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                  🔗 {profile.website}
                </a>
              )}
              <span>📅 Joined {profile.joinedDate}</span>
            </div>

            {/* Stats row */}
            <div className={styles.statsRow} role="list">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className={styles.stat} role="listitem">
                  <Icon size={14} />
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs + content */}
        <div className={styles.tabs} role="tablist">
          {["Articles", "About", "Reading List"].map((tab, i) => (
            <button key={tab} className={`${styles.tab} ${i === 0 ? styles.tabActive : ""}`} role="tab" aria-selected={i === 0}>
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {/* Articles list */}
          <div className={styles.articleGrid}>
            {ARTICLES.map((a) => (
              <Link key={a.slug} href={`/article/${a.slug}`} className={styles.articleCard}>
                <div className={styles.articleCardAccent} style={{ background: a.tagColor }} />
                <div className={styles.articleCardBody}>
                  <span className={styles.articleTag} style={{ color: a.tagColor }}>{a.tag}</span>
                  <h3 className={styles.articleTitle}>{a.title}</h3>
                  <div className={styles.articleMeta}>
                    <span>{a.date}</span>
                    <span>·</span>
                    <span>{a.readTime} read</span>
                    <span>·</span>
                    <span>♥ {a.likes.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Award size={15} /> Achievements</h3>
              <div className={styles.achievements}>
                {[
                  { emoji: "🔥", label: "Top Writer",    sub: "Technology" },
                  { emoji: "⭐", label: "1K Followers",  sub: "Milestone"  },
                  { emoji: "✍️", label: "50+ Articles",  sub: "Published"  },
                ].map((a) => (
                  <div key={a.label} className={styles.achievement}>
                    <span className={styles.achievementEmoji}>{a.emoji}</span>
                    <div>
                      <p className={styles.achievementLabel}>{a.label}</p>
                      <p className={styles.achievementSub}>{a.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Star size={15} /> Topics</h3>
              <div className={styles.topicPills}>
                {["Technology", "AI", "Machine Learning", "Design", "Productivity"].map((t) => (
                  <Link key={t} href={`/topics/${t.toLowerCase().replace(/ /g, "-")}`} className={styles.topicPill}>
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
