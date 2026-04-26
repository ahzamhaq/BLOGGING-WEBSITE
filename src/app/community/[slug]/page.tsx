"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  MessageSquare, Send, Users, TrendingUp, Pin, ThumbsUp,
  ChevronDown, Hash, Lock, Clock, Eye, Shield, Crown,
  Settings, UserMinus, Bell, Tag, BarChart2, Flame, Loader2, Trash2, Unlock
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./room.module.css";

type CommunityType = "public" | "request" | "private";
type MemberRole = "owner" | "moderator" | "member";

interface Author { id: string; name: string | null; handle: string; image: string | null }
interface ThreadData {
  id: string; title: string; body: string; tag: string; pinned: boolean;
  createdAt: string; author: Author;
  _count: { replies: number; threadLikes: number };
}
interface MemberData {
  id: string; role: MemberRole; user: Author;
}
interface CommunityData {
  id: string; slug: string; name: string; desc: string; emoji: string;
  color: string; type: CommunityType; tags: string[]; rules: string[];
  _count: { members: number; threads: number };
  members: MemberData[];
  threads: ThreadData[];
}

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === "owner")     return <span className={`${styles.roleBadge} ${styles.roleOwner}`}><Crown size={10} />Owner</span>;
  if (role === "moderator") return <span className={`${styles.roleBadge} ${styles.roleMod}`}><Shield size={10} />Mod</span>;
  return <span className={`${styles.roleBadge} ${styles.roleMember}`}>Member</span>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [room, setRoom]           = useState<CommunityData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound404, set404]     = useState(false);
  const [threads, setThreads]     = useState<ThreadData[]>([]);
  const [newTitle, setNewTitle]   = useState("");
  const [newPost, setNewPost]     = useState("");
  const [posting, setPosting]     = useState(false);
  const [likedIds, setLikedIds]   = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());
  const [replies, setReplies]     = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [joined, setJoined]       = useState(false);
  const [joining, setJoining]     = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/${slug}`);
      if (res.status === 404) { set404(true); return; }
      const data: CommunityData = await res.json();
      setRoom(data);
      setThreads(data.threads);
      const counts: Record<string, number> = {};
      data.threads.forEach(t => { counts[t.id] = t._count.threadLikes; });
      setLikeCounts(counts);
    } catch {
      toast.error("Failed to load community");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  if (notFound404) notFound();

  async function handleJoin() {
    if (!room) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/community/${slug}/join`, { method: "POST" });
      if (res.status === 401) { toast.error("Sign in to join rooms"); return; }
      const data = await res.json();
      setJoined(data.joined);
      toast.success(data.joined ? "Joined room!" : "Left room");
    } catch {
      toast.error("Failed to update membership");
    } finally {
      setJoining(false);
    }
  }

  async function handleLike(threadId: string) {
    const res = await fetch(`/api/community/${slug}/threads/${threadId}/like`, { method: "POST" });
    if (res.status === 401) { toast.error("Sign in to like"); return; }
    const data = await res.json();
    setLikedIds(prev => {
      const next = new Set(prev);
      data.liked ? next.add(threadId) : next.delete(threadId);
      return next;
    });
    setLikeCounts(prev => ({ ...prev, [threadId]: data.likes }));
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newPost.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/community/${slug}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), body: newPost.trim(), tag: "discussion" }),
      });
      if (res.status === 401) { toast.error("Sign in to post"); return; }
      const thread: ThreadData = await res.json();
      setThreads(prev => [thread, ...prev]);
      setLikeCounts(prev => ({ ...prev, [thread.id]: 0 }));
      setNewTitle("");
      setNewPost("");
      toast.success("Thread posted!");
    } catch {
      toast.error("Failed to post");
    } finally {
      setPosting(false);
    }
  }

  async function handleReply(threadId: string) {
    const text = replies[threadId]?.trim();
    if (!text) return;
    const res = await fetch(`/api/community/${slug}/threads/${threadId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (res.status === 401) { toast.error("Sign in to reply"); return; }
    setThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, _count: { ...t._count, replies: t._count.replies + 1 } } : t
    ));
    setReplies(prev => ({ ...prev, [threadId]: "" }));
    setReplyingTo(null);
    toast.success("Reply posted!");
  }

  async function handlePin(threadId: string) {
    const res = await fetch(`/api/community/${slug}/threads/${threadId}/pin`, { method: "POST" });
    if (res.status === 403) { toast.error("Only moderators can pin"); return; }
    const data = await res.json();
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, pinned: data.pinned } : t));
    toast(data.pinned ? "Thread pinned!" : "Thread unpinned");
  }

  async function handleLock() {
    if (!room) return;
    const newType = room.type === "private" ? "public" : "private";
    const res = await fetch(`/api/community/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType }),
    });
    if (res.status === 403) { toast.error("Only owner/moderator can do this"); return; }
    if (!res.ok) { toast.error("Failed to update"); return; }
    setRoom(prev => prev ? { ...prev, type: newType } : prev);
    toast.success(newType === "private" ? "Community locked (private)" : "Community unlocked (open)");
  }

  async function handleDelete() {
    if (!room) return;
    if (!confirm(`Delete "${room.name}" permanently? This cannot be undone.`)) return;
    const res = await fetch(`/api/community/${slug}`, { method: "DELETE" });
    if (res.status === 403) { toast.error("Only the owner can delete"); return; }
    if (!res.ok) { toast.error("Failed to delete community"); return; }
    toast.success("Community deleted");
    router.push("/community");
  }

  const visibleThreads = activeTag
    ? threads.filter(t => t.tag === activeTag)
    : [...threads].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", opacity: 0.5 }} />
      </div>
    );
  }

  if (!room) return null;

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
            <span className={styles.memberCount}><Users size={14} />{room._count.members} members</span>
            {room.type === "private" ? (
              <button className="btn btn-secondary btn-sm" disabled><Lock size={13} />Invite Only</button>
            ) : (
              <button
                className={`btn btn-sm ${joined ? "btn-secondary" : "btn-primary"}`}
                style={joined ? undefined : { background: room.color }}
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> :
                  joined ? <><Bell size={13} />Joined</> : <><Users size={13} />{room.type === "request" ? "Request to Join" : "Join Room"}</>
                }
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdmin(v => !v)}>
              <Settings size={13} />Admin
            </button>
          </div>
        </div>

        {showAdmin && (
          <div className={styles.adminPanel}>
            <div className={styles.adminGrid}>
              <button
                className={`${styles.adminBtn} ${room.type === "private" ? styles.adminBtnActive : ""}`}
                onClick={handleLock}
              >
                {room.type === "private" ? <><Unlock size={13} />Unlock Community</> : <><Lock size={13} />Lock Community</>}
              </button>
              <button className={styles.adminBtn} onClick={() => toast("Manage members — coming soon", { icon: "👥" })}>
                <Users size={13} />Manage Members
              </button>
              <button className={styles.adminBtn} onClick={() => toast("Analytics — coming soon", { icon: "📊" })}>
                <BarChart2 size={13} />Analytics
              </button>
              <button
                className={`${styles.adminBtn} ${styles.adminBtnDanger}`}
                onClick={handleDelete}
              >
                <Trash2 size={13} />Delete Community
              </button>
            </div>
          </div>
        )}

        <div className={styles.tagsBar}>
          <Tag size={12} className={styles.tagIcon} />
          <button className={`${styles.tagChip} ${activeTag === null ? styles.tagChipActive : ""}`} onClick={() => setActiveTag(null)}>All</button>
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
                  <button type="submit" className="btn btn-primary btn-sm" disabled={posting} aria-label="Post">
                    {posting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </form>

            {/* Threads */}
            <div className={styles.threads}>
              {visibleThreads.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                  <Flame size={32} style={{ margin: "0 auto 0.5rem" }} />
                  <p>No threads yet. Be the first to start a discussion!</p>
                </div>
              )}
              {visibleThreads.map((t) => (
                <div key={t.id} className={`${styles.thread} ${t.pinned ? styles.threadPinned : ""}`}>
                  {t.pinned && (
                    <div className={styles.pinBadge} style={{ color: room.color }}>
                      <Pin size={11} /> Pinned by moderator
                    </div>
                  )}
                  <div className={styles.threadHeader}>
                    <div className="avatar avatar-sm" style={{ background: room.color, fontSize: "0.65rem" }}>
                      {(t.author.name ?? t.author.handle)[0].toUpperCase()}
                    </div>
                    <span className={styles.threadAuthor}>{t.author.name ?? t.author.handle}</span>
                    <span className={styles.threadTime}>{timeAgo(t.createdAt)}</span>
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
                      {likeCounts[t.id] ?? 0}
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        setExpanded(prev => { const n = new Set(prev); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n; });
                        setReplyingTo(r => r === t.id ? null : t.id);
                      }}
                    >
                      <MessageSquare size={14} />{t._count.replies} replies
                      <ChevronDown size={12} style={{ transform: expanded.has(t.id) ? "rotate(180deg)" : "", transition: "transform 0.2s" }} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${t.pinned ? styles.actionBtnActive : styles.actionBtnAdmin}`}
                      title={t.pinned ? "Unpin thread" : "Pin thread"}
                      onClick={() => handlePin(t.id)}
                    >
                      <Pin size={13} />
                    </button>
                  </div>
                  {replyingTo === t.id && (
                    <div className={styles.replyBox}>
                      <input
                        className={styles.replyInput}
                        placeholder="Write a reply…"
                        aria-label="Reply"
                        value={replies[t.id] ?? ""}
                        onChange={(e) => setReplies((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleReply(t.id); }}
                        autoFocus
                      />
                      <button className="btn btn-secondary btn-sm" onClick={() => handleReply(t.id)}>Reply</button>
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
                <div><span>{room._count.members}</span><small>Members</small></div>
                <div><span>{room._count.threads}</span><small>Threads</small></div>
                <div>
                  <span>{room.type === "public" ? "Open" : room.type === "request" ? "Request" : "Private"}</span>
                  <small>Type</small>
                </div>
              </div>
            </div>

            {room.members.length > 0 && (
              <div className={styles.sideCard}>
                <h3 className={styles.sideTitle}><Crown size={14} />Team</h3>
                {room.members.filter(m => m.role !== "member").map((m) => (
                  <div key={m.id} className={styles.memberRow}>
                    <div className="avatar avatar-sm" style={{ background: room.color, fontSize: "0.65rem" }}>
                      {(m.user.name ?? m.user.handle)[0].toUpperCase()}
                    </div>
                    <span className={styles.memberName}>{m.user.name ?? m.user.handle}</span>
                    <RoleBadge role={m.role} />
                  </div>
                ))}
              </div>
            )}

            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Shield size={14} />Rules</h3>
              {room.rules.map((rule, i) => (
                <div key={i} className={styles.rule}>
                  <span className={styles.ruleNum}>{i + 1}</span>
                  <span className={styles.ruleText}>{rule}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
