import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Users, TrendingUp, Hash, Lock, Clock, Eye, EyeOff } from "lucide-react";
import styles from "./community.module.css";

export const metadata: Metadata = {
  title: "Community — WriteSpace",
  description: "Join topic-based rooms, discuss ideas, and connect with writers on WriteSpace.",
};

type CommunityType = "public" | "request" | "private" | "secret";

interface Room {
  name: string; slug: string; members: string; active: number;
  color: string; emoji: string; desc: string;
  type: CommunityType;
  preview?: { author: string; text: string; time: string }[];
  pinned?: string;
}

const ROOMS: Room[] = [
  {
    name: "Tech & Code", slug: "tech", members: "4.2K", active: 12, color: "#348fff", emoji: "💻",
    desc: "Programming, AI, the web, and everything in between.",
    type: "public",
    pinned: "📌 Community rules updated — please review before posting",
    preview: [
      { author: "Sarah", text: "Is Rust worth learning in 2026?", time: "2m" },
      { author: "Marcus", text: "Just shipped a new OSS project!", time: "5m" },
      { author: "Priya", text: "Hot take: TypeScript is overrated", time: "12m" },
    ],
  },
  {
    name: "Design & UX", slug: "design", members: "2.8K", active: 8, color: "#a78bfa", emoji: "🎨",
    desc: "Visual design, product thinking, and creative craft.",
    type: "public",
    preview: [
      { author: "James", text: "Figma vs Framer — which do you prefer?", time: "8m" },
      { author: "Elena", text: "New design system I built for my startup", time: "1h" },
    ],
  },
  {
    name: "Writing Craft", slug: "writing", members: "3.1K", active: 15, color: "#22c55e", emoji: "✍️",
    desc: "Tips, feedback, and discussions about the writing process.",
    type: "public",
    preview: [
      { author: "Clara", text: "How do you find your writing voice?", time: "3m" },
      { author: "Ahmed", text: "My 30-day writing challenge results", time: "20m" },
      { author: "Yuki", text: "Best resources for improving prose?", time: "45m" },
    ],
  },
  {
    name: "Startups", slug: "startups", members: "5.6K", active: 21, color: "#f97316", emoji: "🚀",
    desc: "Building companies, fundraising, and founder stories.",
    type: "request",
    preview: [
      { author: "Lena", text: "Bootstrapped vs funded — share your experience", time: "10m" },
      { author: "Omar", text: "How I got my first 100 customers", time: "2h" },
    ],
  },
  {
    name: "Science & Nature", slug: "science", members: "1.9K", active: 6, color: "#06b6d4", emoji: "🔬",
    desc: "Research, discoveries, and making science approachable.",
    type: "public",
  },
  {
    name: "Philosophy", slug: "philosophy", members: "2.3K", active: 9, color: "#ec4899", emoji: "🤔",
    desc: "Big ideas, ethics, epistemology, and how to live well.",
    type: "request",
  },
  {
    name: "Productivity", slug: "productivity", members: "3.8K", active: 18, color: "#8b5cf6", emoji: "⚡",
    desc: "Systems, habits, and tools for doing your best work.",
    type: "public",
  },
  {
    name: "Health & Mind", slug: "health", members: "2.1K", active: 7, color: "#10b981", emoji: "🧠",
    desc: "Mental and physical wellbeing, backed by evidence.",
    type: "public",
  },
  {
    name: "Pro Writers Circle", slug: "pro-writers", members: "420", active: 3, color: "#f59e0b", emoji: "👑",
    desc: "Exclusive community for verified professional writers.",
    type: "private",
  },
];

const RECENT_DISCUSSIONS = [
  { room: "Writing Craft",  title: "How do you find your writing voice?",        replies: 34, author: "Sarah Chen",   color: "#22c55e" },
  { room: "Tech & Code",    title: "Is Rust worth learning in 2026?",            replies: 58, author: "Marcus Reid",  color: "#348fff" },
  { room: "Startups",       title: "Bootstrapped vs. funded — which is right?",  replies: 41, author: "J. Okafor",   color: "#f97316" },
  { room: "Philosophy",     title: "Can you live ethically under capitalism?",    replies: 67, author: "Dr. A. Patel", color: "#ec4899" },
  { room: "Productivity",   title: "Your single best morning habit?",            replies: 82, author: "James Okafor", color: "#8b5cf6" },
];

function TypeBadge({ type }: { type: CommunityType }) {
  if (type === "public")  return <span className={`${styles.badge} ${styles.badgePublic}`}><Eye size={10} />Open</span>;
  if (type === "request") return <span className={`${styles.badge} ${styles.badgeRequest}`}><Clock size={10} />Request</span>;
  if (type === "private") return <span className={`${styles.badge} ${styles.badgeLocked}`}><Lock size={10} />Locked</span>;
  return null;
}

export default function CommunityPage() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Join the <span className="gradient-text">Conversation</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Topic-based rooms where writers and readers discuss ideas, share feedback,
            and connect with people who think deeply.
          </p>
          <div className={styles.heroActions}>
            <Link href="/auth/signup" className="btn btn-primary btn-lg">
              <Users size={17} />Join Community
            </Link>
            <div className={styles.typeLegend}>
              <span className={`${styles.badge} ${styles.badgePublic}`}><Eye size={10} />Open</span>
              <span className={`${styles.badge} ${styles.badgeRequest}`}><Clock size={10} />Request</span>
              <span className={`${styles.badge} ${styles.badgeLocked}`}><Lock size={10} />Locked</span>
              <span className={styles.badgeSecret}><EyeOff size={10} />Secret</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.bodyGrid}>
          <main>
            <h2 className={styles.sectionTitle}>
              <Hash size={18} />Community Rooms
            </h2>
            <div className={styles.roomsGrid} role="list">
              {ROOMS.map((room) => (
                <Link
                  key={room.slug}
                  href={`/community/${room.slug}`}
                  className={`${styles.roomCard} ${room.type === "private" ? styles.roomCardLocked : ""}`}
                  role="listitem"
                  style={{ "--room-color": room.color } as React.CSSProperties}
                >
                  <div className={styles.roomTop}>
                    <span className={styles.roomEmoji}>{room.emoji}</span>
                    <div className={styles.roomTopRight}>
                      <TypeBadge type={room.type} />
                      {room.type === "public" && (
                        <div className={styles.roomActive}>
                          <span className={styles.activeDot} />
                          {room.active} online
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className={styles.roomName}>{room.name}</h3>
                  <p className={styles.roomDesc}>{room.desc}</p>

                  {room.pinned && (
                    <div className={styles.pinnedBanner}>{room.pinned}</div>
                  )}

                  {room.preview && room.preview.length > 0 && (
                    <div className={styles.previewList}>
                      {room.preview.map((p, i) => (
                        <div key={i} className={styles.previewItem}>
                          <span className={styles.previewAuthor}>{p.author}</span>
                          <span className={styles.previewText}>{p.text}</span>
                          <span className={styles.previewTime}>{p.time}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {room.type === "private" && (
                    <div className={styles.lockedOverlay}>
                      <Lock size={16} />
                      <span>Invite only</span>
                    </div>
                  )}

                  <div className={styles.roomFooter}>
                    <span className={styles.roomMembers}><Users size={12} />{room.members} members</span>
                    {room.type === "public"  && <span className={styles.joinHint}>Join →</span>}
                    {room.type === "request" && <span className={styles.requestHint}>Request →</span>}
                    {room.type === "private" && <span className={styles.lockedHint}><Lock size={11} />Locked</span>}
                  </div>
                </Link>
              ))}
            </div>
          </main>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><TrendingUp size={15} />Active Discussions</h3>
              <div className={styles.discussionList}>
                {RECENT_DISCUSSIONS.map((d) => (
                  <div key={d.title} className={styles.discussion}>
                    <span className={styles.discussionRoom} style={{ color: d.color }}>#{d.room}</span>
                    <p className={styles.discussionTitle}>{d.title}</p>
                    <div className={styles.discussionMeta}>
                      <div className="avatar avatar-sm" style={{ background: d.color, fontSize: "0.6rem", width: "18px", height: "18px" }}>{d.author[0]}</div>
                      <span>{d.author}</span>
                      <span>·</span>
                      <MessageSquare size={11} />
                      <span>{d.replies}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Users size={15} />Community Types</h3>
              {[
                { icon: <Eye size={13} />, type: "Open", desc: "Anyone can join freely" },
                { icon: <Clock size={13} />, type: "Request", desc: "Apply — admin approves" },
                { icon: <Lock size={13} />, type: "Locked", desc: "Invite-only, link-only" },
                { icon: <EyeOff size={13} />, type: "Secret", desc: "Not discoverable, invite only" },
              ].map((t, i) => (
                <div key={i} className={styles.typeRow}>
                  <span className={styles.typeIcon}>{t.icon}</span>
                  <div>
                    <div className={styles.typeName}>{t.type}</div>
                    <div className={styles.typeDesc}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Hash size={15} />Community Guidelines</h3>
              {["Be respectful and constructive", "Stay on-topic for each room", "No spam or self-promotion", "Cite sources for factual claims", "Welcome diverse perspectives"].map((rule, i) => (
                <div key={i} className={styles.rule}>
                  <span className={styles.ruleNum}>{i + 1}</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
