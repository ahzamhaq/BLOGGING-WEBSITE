"use client";

import { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MessageSquare, Send, Users, TrendingUp, Pin, ThumbsUp,
  ChevronDown, Hash, Lock, Clock, Eye, Shield, Crown,
  Settings, UserMinus, Star, Bell, Tag, BarChart2, Flame
} from "lucide-react";
import styles from "./room.module.css";

type CommunityType = "public" | "request" | "private";
type MemberRole = "owner" | "moderator" | "member";

interface RoomData {
  name: string; desc: string; color: string; emoji: string;
  members: string; type: CommunityType; tags: string[];
  rules: string[]; weeklyFeatured?: string;
  roles: { name: string; role: MemberRole; color: string }[];
}

const ROOMS: Record<string, RoomData> = {
  tech: {
    name: "Tech & Code", color: "#348fff", emoji: "💻", members: "4.2K",
    type: "public",
    desc: "Programming, AI, the web, and everything in between.",
    tags: ["javascript", "ai", "web-dev", "devops", "open-source"],
    rules: ["No spam or promotional posts", "Be constructive in code reviews", "Share knowledge freely", "Credit original authors"],
    weeklyFeatured: "Is Rust worth learning in 2026?",
    roles: [
      { name: "Sarah Chen", role: "owner", color: "#348fff" },
      { name: "Marcus Reid", role: "moderator", color: "#a78bfa" },
      { name: "Priya Nair", role: "moderator", color: "#22c55e" },
    ],
  },
  design: {
    name: "Design & UX", color: "#a78bfa", emoji: "🎨", members: "2.8K",
    type: "public",
    desc: "Visual design, product thinking, and creative craft.",
    tags: ["figma", "ui-ux", "branding", "typography", "motion"],
    rules: ["Constructive feedback only", "Credit your inspiration sources", "No client work solicitation"],
    roles: [
      { name: "Elena Voss", role: "owner", color: "#a78bfa" },
      { name: "James Park", role: "moderator", color: "#f97316" },
    ],
  },
  writing: {
    name: "Writing Craft", color: "#22c55e", emoji: "✍️", members: "3.1K",
    type: "public",
    desc: "Tips, feedback, and discussions about the writing process.",
    tags: ["fiction", "non-fiction", "editing", "voice", "structure"],
    rules: ["Be kind in feedback", "Specific critique is more helpful", "Share your own work too", "No AI-generated submissions for critique"],
    weeklyFeatured: "How do you find your writing voice?",
    roles: [
      { name: "Clara Mbeki", role: "owner", color: "#22c55e" },
      { name: "Ahmed Hassan", role: "moderator", color: "#f59e0b" },
    ],
  },
  startups: {
    name: "Startups", color: "#f97316", emoji: "🚀", members: "5.6K",
    type: "request",
    desc: "Building companies, fundraising, and founder stories.",
    tags: ["saas", "fundraising", "growth", "product", "b2b"],
    rules: ["No cold pitching to members", "Keep fundraising discussions respectful", "Verified founders get flair", "Share lessons, not just wins"],
    roles: [
      { name: "Jordan Okafor", role: "owner", color: "#f97316" },
      { name: "Lena Kim", role: "moderator", color: "#06b6d4" },
    ],
  },
  science: {
    name: "Science & Nature", color: "#06b6d4", emoji: "🔬", members: "1.9K",
    type: "public",
    desc: "Research, discoveries, and making science approachable.",
    tags: ["biology", "physics", "climate", "space", "research"],
    rules: ["Cite peer-reviewed sources", "Distinguish consensus from debate", "No pseudoscience"],
    roles: [{ name: "Dr. A. Patel", role: "owner", color: "#06b6d4" }],
  },
  philosophy: {
    name: "Philosophy", color: "#ec4899", emoji: "🤔", members: "2.3K",
    type: "request",
    desc: "Big ideas, ethics, epistemology, and how to live well.",
    tags: ["ethics", "epistemology", "metaphysics", "stoicism", "eastern"],
    rules: ["Steelman opposing views", "Define your terms clearly", "Argue ideas, not people"],
    roles: [{ name: "Prof. Amara", role: "owner", color: "#ec4899" }],
  },
  productivity: {
    name: "Productivity", color: "#8b5cf6", emoji: "⚡", members: "3.8K",
    type: "public",
    desc: "Systems, habits, and tools for doing your best work.",
    tags: ["pkm", "gtd", "tools", "habits", "deep-work"],
    rules: ["Share systems that actually work for you", "Be skeptical of productivity hacks", "No affiliate spam"],
    weeklyFeatured: "What's your single best morning habit?",
    roles: [{ name: "James Okafor", role: "owner", color: "#8b5cf6" }],
  },
  health: {
    name: "Health & Mind", color: "#10b981", emoji: "🧠", members: "2.1K",
    type: "public",
    desc: "Mental and physical wellbeing, backed by evidence.",
    tags: ["mental-health", "fitness", "nutrition", "sleep", "mindfulness"],
    rules: ["No medical advice (share resources instead)", "Be trauma-aware", "Cite sources for health claims"],
    roles: [{ name: "Dr. Yuki T.", role: "owner", color: "#10b981" }],
  },
  "pro-writers": {
    name: "Pro Writers Circle", color: "#f59e0b", emoji: "👑", members: "420",
    type: "private",
    desc: "Exclusive community for verified professional writers.",
    tags: ["publishing", "agents", "contracts", "marketing"],
    rules: ["Verified pro writers only", "NDAs apply for business discussions", "Be generous with experience"],
    roles: [{ name: "Clara Mbeki", role: "owner", color: "#f59e0b" }],
  },
};

const INITIAL_THREADS = [
  {
    id: 1, pinned: true,
    author: "Sarah Chen", authorColor: "#348fff", time: "2h ago",
    title: "How do you find your writing voice?",
    body: "I've been writing for 3 years and still feel like I'm searching for it. What practices helped you develop a distinctive voice?",
    likes: 34, replies: 12, tag: "craft",
  },
  {
    id: 2, pinned: false,
    author: "Marcus Reid", authorColor: "#a78bfa", time: "4h ago",
    title: "Is long-form content still worth it in 2026?",
    body: "With everyone's attention spans shrinking, does depth still have an audience? I'd argue yes — but the bar is higher than ever.",
    likes: 28, replies: 9, tag: "strategy",
  },
  {
    id: 3, pinned: false,
    author: "James Okafor", authorColor: "#f97316", time: "6h ago",
    title: "What's the best outlining method you've tried?",
    body: "I've gone through Zettelkasten, mind mapping, the snowflake method… nothing sticks. Looking for something more flexible.",
    likes: 19, replies: 7, tag: "tools",
  },
  {
    id: 4, pinned: false,
    author: "Priya Nair", authorColor: "#22c55e", time: "1d ago",
    title: "Share your daily writing routine",
    body: "Morning pages? Night owl sessions? I'm curious how serious writers structure their day. Drop your routine below.",
    likes: 45, replies: 23, tag: "habits",
  },
];

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === "owner")     return <span className={`${styles.roleBadge} ${styles.roleOwner}`}><Crown size={10} />Owner</span>;
  if (role === "moderator") return <span className={`${styles.roleBadge} ${styles.roleMod}`}><Shield size={10} />Mod</span>;
  return <span className={`${styles.roleBadge} ${styles.roleMember}`}>Member</span>;
}

function JoinButton({ type, color }: { type: CommunityType; color: string }) {
  const [state, setState] = useState<"idle" | "requested" | "joined">("idle");
  if (type === "private") {
    return <button className="btn btn-secondary btn-sm" disabled><Lock size={13} />Invite Only</button>;
  }
  if (type === "request") {
    if (state === "requested") {
      return <button className={`btn btn-secondary btn-sm ${styles.requestedBtn}`} disabled><Clock size={13} />Requested</button>;
    }
    return (
      <button className="btn btn-primary btn-sm" style={{ background: color }} onClick={() => setState("requested")}>
        <Clock size={13} />Request to Join
      </button>
    );
  }
  if (state === "joined") {
    return <button className={`btn btn-secondary btn-sm ${styles.joinedBtn}`}><Bell size={13} />Joined</button>;
  }
  return (
    <button className="btn btn-primary btn-sm" style={{ background: color }} onClick={() => setState("joined")}>
      <Users size={13} />Join Room
    </button>
  );
}

export default function CommunityRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const room = ROOMS[slug];
  if (!room) notFound();

  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [newPost, setNewPost] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [isAdmin] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  function handleLike(id: number) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setThreads((prev) => prev.map((t) =>
      t.id === id ? { ...t, likes: likedIds.has(id) ? t.likes - 1 : t.likes + 1 } : t
    ));
  }

  function handleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim() || !newTitle.trim()) return;
    setThreads((prev) => [{
      id: Date.now(), pinned: false,
      author: "You", authorColor: "#64748b", time: "just now",
      title: newTitle.trim(), body: newPost.trim(),
      likes: 0, replies: 0, tag: "discussion",
    }, ...prev]);
    setNewPost("");
    setNewTitle("");
  }

  const visibleThreads = activeTag
    ? threads.filter(t => t.tag === activeTag)
    : threads;

  return (
    <div className={styles.page}>
      <div className={styles.header} style={{ "--room-color": room.color } as React.CSSProperties}>
        <div className={styles.headerBg} aria-hidden />
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Link href="/community" className={styles.back}><Hash size={14} />All Rooms</Link>
            <span className={styles.emoji}>{room.emoji}</span>
            <div>
              <div className={styles.nameRow}>
                <h1 className={styles.roomName}>{room.name}</h1>
                {room.type === "request" && (
                  <span className={styles.typePill} style={{ color: "#fbbf24", borderColor: "rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.1)" }}>
                    <Clock size={10} />Request to Join
                  </span>
                )}
                {room.type === "private" && (
                  <span className={styles.typePill} style={{ color: "#f87171", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)" }}>
                    <Lock size={10} />Private
                  </span>
                )}
                {room.type === "public" && (
                  <span className={styles.typePill} style={{ color: "#4ade80", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.1)" }}>
                    <Eye size={10} />Open
                  </span>
                )}
              </div>
              <p className={styles.roomDesc}>{room.desc}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.memberCount}><Users size={14} />{room.members} members</span>
            <JoinButton type={room.type} color={room.color} />
            {isAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdmin(v => !v)}>
                <Settings size={13} />Admin
              </button>
            )}
          </div>
        </div>

        {/* Admin Controls Panel */}
        {showAdmin && isAdmin && (
          <div className={styles.adminPanel}>
            <div className={styles.adminGrid}>
              <button className={`${styles.adminBtn} ${styles.adminBtnDanger}`}><Lock size={13} />Lock Community</button>
              <button className={styles.adminBtn}><Users size={13} />Manage Members</button>
              <button className={styles.adminBtn}><Pin size={13} />Pin Announcement</button>
              <button className={styles.adminBtn}><Settings size={13} />Edit Community</button>
              <button className={`${styles.adminBtn} ${styles.adminBtnDanger}`}><UserMinus size={13} />Ban User</button>
              <button className={styles.adminBtn}><BarChart2 size={13} />Analytics</button>
            </div>
          </div>
        )}

        {/* Tags filter */}
        <div className={styles.tagsBar}>
          <Tag size={12} className={styles.tagIcon} />
          <button
            className={`${styles.tagChip} ${activeTag === null ? styles.tagChipActive : ""}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {room.tags.map(tag => (
            <button
              key={tag}
              className={`${styles.tagChip} ${activeTag === tag ? styles.tagChipActive : ""}`}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          <main>
            {/* Weekly featured */}
            {room.weeklyFeatured && (
              <div className={styles.featuredThread}>
                <Flame size={14} className={styles.featuredIcon} />
                <div>
                  <div className={styles.featuredLabel}>Weekly Featured Discussion</div>
                  <div className={styles.featuredTitle}>{room.weeklyFeatured}</div>
                </div>
              </div>
            )}

            {/* New post form */}
            <form className={styles.newPost} onSubmit={handlePost}>
              <div className="avatar avatar-sm" style={{ background: "#64748b", fontSize: "0.65rem", flexShrink: 0 }}>Y</div>
              <div className={styles.newPostFields}>
                <input
                  className={styles.newPostTitle}
                  placeholder="Thread title…"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  aria-label="Thread title"
                />
                <div className={styles.newPostRow}>
                  <input
                    className={styles.newPostInput}
                    placeholder={`Share your thoughts in ${room.name}…`}
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    aria-label="New discussion"
                  />
                  <button type="submit" className="btn btn-primary btn-sm" aria-label="Post"><Send size={14} /></button>
                </div>
              </div>
            </form>

            {/* Threads */}
            <div className={styles.threads}>
              {visibleThreads.map((t) => (
                <div key={t.id} className={`${styles.thread} ${t.pinned ? styles.threadPinned : ""}`}>
                  {t.pinned && (
                    <div className={styles.pinBadge} style={{ color: room.color }}>
                      <Pin size={11} /> Pinned by moderator
                    </div>
                  )}
                  <div className={styles.threadHeader}>
                    <div className="avatar avatar-sm" style={{ background: t.authorColor, fontSize: "0.65rem" }}>{t.author[0]}</div>
                    <span className={styles.threadAuthor}>{t.author}</span>
                    <span className={styles.threadTime}>{t.time}</span>
                    <span className={styles.threadTag}>#{t.tag}</span>
                  </div>
                  <h3 className={styles.threadTitle}>{t.title}</h3>
                  <p className={styles.threadBody}>{t.body}</p>
                  <div className={styles.threadFooter}>
                    <button
                      className={`${styles.actionBtn} ${likedIds.has(t.id) ? styles.actionBtnActive : ""}`}
                      onClick={() => handleLike(t.id)}
                      aria-label="Like"
                      aria-pressed={likedIds.has(t.id)}
                    >
                      <ThumbsUp size={14} fill={likedIds.has(t.id) ? "currentColor" : "none"} />
                      {t.likes}
                    </button>
                    <button className={styles.actionBtn} onClick={() => handleExpand(t.id)}>
                      <MessageSquare size={14} />{t.replies} replies
                      <ChevronDown size={12} style={{ transform: expanded.has(t.id) ? "rotate(180deg)" : "", transition: "transform 0.2s" }} />
                    </button>
                    {isAdmin && (
                      <>
                        <button className={`${styles.actionBtn} ${styles.actionBtnAdmin}`} title="Pin thread"><Pin size={13} /></button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Delete thread">✕</button>
                      </>
                    )}
                  </div>
                  {expanded.has(t.id) && (
                    <div className={styles.replyBox}>
                      <input className={styles.replyInput} placeholder="Write a reply…" aria-label="Reply" />
                      <button className="btn btn-secondary btn-sm">Reply</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </main>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><TrendingUp size={14} />About</h3>
              <p className={styles.sideText}>{room.desc}</p>
              <div className={styles.sideStats}>
                <div><span>{room.members}</span><small>Members</small></div>
                <div><span>{threads.length}</span><small>Threads</small></div>
                <div>
                  <span>{room.type === "public" ? "Open" : room.type === "request" ? "Request" : "Private"}</span>
                  <small>Type</small>
                </div>
              </div>
            </div>

            {/* Member roles */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Crown size={14} />Team</h3>
              {room.roles.map((m, i) => (
                <div key={i} className={styles.memberRow}>
                  <div className="avatar avatar-sm" style={{ background: m.color, fontSize: "0.65rem" }}>{m.name[0]}</div>
                  <span className={styles.memberName}>{m.name}</span>
                  <RoleBadge role={m.role} />
                </div>
              ))}
            </div>

            {/* Community rules */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Shield size={14} />Rules</h3>
              {room.rules.map((rule, i) => (
                <div key={i} className={styles.rule}>
                  <span className={styles.ruleNum}>{i + 1}</span>
                  <span className={styles.ruleText}>{rule}</span>
                </div>
              ))}
            </div>

            {/* Other rooms */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Hash size={14} />Other Rooms</h3>
              {Object.entries(ROOMS)
                .filter(([s]) => s !== slug)
                .slice(0, 4)
                .map(([slug, r]) => (
                  <Link key={slug} href={`/community/${slug}`} className={styles.otherRoom}>
                    <span>{r.emoji}</span>
                    <span className={styles.otherRoomName}>{r.name}</span>
                    {r.type === "private" && <Lock size={10} style={{ color: "#f87171", marginLeft: "auto" }} />}
                  </Link>
                ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
