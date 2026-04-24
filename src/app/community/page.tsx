"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Users, TrendingUp, Hash, Lock, Clock,
  Eye, EyeOff, Plus, X, Loader2, Search
} from "lucide-react";
import styles from "./community.module.css";
import toast from "react-hot-toast";

type CommunityType = "public" | "request" | "private";

interface Thread {
  id: string; title: string;
  author: { name: string | null; handle: string };
}
interface Community {
  id: string; slug: string; name: string; desc: string;
  emoji: string; color: string; type: CommunityType;
  tags: string[];
  _count: { members: number; threads: number };
  threads: Thread[];
}
interface RecentThread {
  id: string; title: string;
  community: { name: string; slug: string; color: string };
  author: { name: string | null; handle: string };
  _count: { replies: number };
}

const EMOJI_OPTIONS = ["💬","💻","🎨","✍️","🚀","🔬","🤔","⚡","🧠","📖","🎯","🌍","🎵","📸","🏋️","🍕","🎮","📚","🌱","💡"];
const COLOR_OPTIONS = ["#348fff","#a78bfa","#22c55e","#f97316","#06b6d4","#ec4899","#8b5cf6","#10b981","#f59e0b","#ef4444","#14b8a6","#f43f5e"];

function TypeBadge({ type }: { type: CommunityType }) {
  if (type === "public")  return <span className={`${styles.badge} ${styles.badgePublic}`}><Eye size={10} />Open</span>;
  if (type === "request") return <span className={`${styles.badge} ${styles.badgeRequest}`}><Clock size={10} />Request</span>;
  if (type === "private") return <span className={`${styles.badge} ${styles.badgeLocked}`}><Lock size={10} />Locked</span>;
  return null;
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Community) => void }) {
  const [name,    setName]    = useState("");
  const [desc,    setDesc]    = useState("");
  const [emoji,   setEmoji]   = useState("💬");
  const [color,   setColor]   = useState("#348fff");
  const [type,    setType]    = useState<CommunityType>("public");
  const [tagInput, setTagInput] = useState("");
  const [tags,    setTags]    = useState<string[]>([]);
  const [rules,   setRules]   = useState<string[]>([""]);
  const [saving,  setSaving]  = useState(false);

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !desc.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), desc: desc.trim(), emoji, color, type, tags,
          rules: rules.filter(r => r.trim()),
        }),
      });
      if (res.status === 401) { toast.error("Sign in to create a community"); return; }
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Failed"); return; }
      const community: Community = await res.json();
      toast.success(`"${community.name}" created!`);
      onCreate(community);
      onClose();
    } catch {
      toast.error("Failed to create community");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create a Community</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Preview */}
          <div className={styles.communityPreview} style={{ borderColor: color + "40", background: color + "08" }}>
            <div style={{ width: 6, background: color, borderRadius: "4px 0 0 4px", alignSelf: "stretch" }} />
            <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{name || "Community Name"}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{desc || "Description…"}</div>
            </div>
          </div>

          <div className={styles.formRow}>
            {/* Emoji picker */}
            <div className={styles.formGroup} style={{ flex: "0 0 auto" }}>
              <label className={styles.formLabel}>Emoji</label>
              <div className={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} type="button"
                    className={`${styles.emojiBtn} ${emoji === e ? styles.emojiBtnActive : ""}`}
                    onClick={() => setEmoji(e)}>{e}</button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className={styles.formGroup} style={{ flex: "0 0 auto" }}>
              <label className={styles.formLabel}>Color</label>
              <div className={styles.colorGrid}>
                {COLOR_OPTIONS.map(c => (
                  <button key={c} type="button"
                    className={`${styles.colorBtn} ${color === c ? styles.colorBtnActive : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Community Name *</label>
            <input
              className={styles.formInput}
              placeholder="e.g. Web Developers Hub"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description *</label>
            <textarea
              className={styles.formTextarea}
              placeholder="What's this community about?"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              maxLength={200}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Type</label>
            <div className={styles.typeButtons}>
              {(["public","request","private"] as CommunityType[]).map(t => (
                <button key={t} type="button"
                  className={`${styles.typeBtn} ${type === t ? styles.typeBtnActive : ""}`}
                  onClick={() => setType(t)}
                >
                  {t === "public" && <><Eye size={13} />Open</>}
                  {t === "request" && <><Clock size={13} />Request</>}
                  {t === "private" && <><Lock size={13} />Private</>}
                </button>
              ))}
            </div>
            <p className={styles.formHint}>
              {type === "public"  && "Anyone can join and post immediately."}
              {type === "request" && "Members must request to join — you approve."}
              {type === "private" && "Invite-only. Won't appear in search."}
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tags <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(helps people find your community)</span></label>
            <div className={styles.tagInputRow}>
              <input
                className={styles.formInput}
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
            </div>
            {tags.length > 0 && (
              <div className={styles.tagList}>
                {tags.map(t => (
                  <span key={t} className={styles.tagChipSmall}>
                    #{t}
                    <button type="button" onClick={() => setTags(p => p.filter(x => x !== t))} aria-label="Remove tag">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rules <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
            {rules.map((rule, i) => (
              <div key={i} className={styles.ruleInputRow}>
                <span className={styles.ruleNum}>{i + 1}</span>
                <input
                  className={styles.formInput}
                  placeholder={`Rule ${i + 1}…`}
                  value={rule}
                  onChange={e => setRules(p => p.map((r, j) => j === i ? e.target.value : r))}
                />
                {rules.length > 1 && (
                  <button type="button" className={styles.removeRuleBtn} onClick={() => setRules(p => p.filter((_, j) => j !== i))}>
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            {rules.length < 8 && (
              <button type="button" className={styles.addRuleBtn} onClick={() => setRules(p => [...p, ""])}>
                <Plus size={13} /> Add rule
              </button>
            )}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: color }}
              disabled={saving || !name.trim() || !desc.trim()}
            >
              {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={15} />}
              Create Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]     = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTag ? `?tag=${encodeURIComponent(activeTag)}` : "";
      const [commRes, threadRes] = await Promise.all([
        fetch(`/api/community${params}`),
        fetch("/api/community/recent-threads"),
      ]);
      const [comm, threads] = await Promise.all([commRes.json(), threadRes.json()]);
      setCommunities(Array.isArray(comm) ? comm : []);
      setRecentThreads(Array.isArray(threads) ? threads : []);
    } catch {
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, [activeTag]);

  useEffect(() => { load(); }, [load]);

  // Collect all unique tags across communities
  const allTags = [...new Set(communities.flatMap(c => c.tags))].sort();

  const filtered = communities.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some(t => t.includes(search.toLowerCase()))
  );

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Join the <span className="gradient-text">Conversation</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Topic-based rooms where writers discuss ideas, share feedback, and connect.
          </p>
          <div className={styles.heroActions}>
            <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>
              <Plus size={17} />Create Community
            </button>
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
        {/* Search + tag filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search communities…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.tagFilterRow}>
            <button
              className={`${styles.tagFilter} ${activeTag === null ? styles.tagFilterActive : ""}`}
              onClick={() => setActiveTag(null)}
            >All</button>
            {allTags.map(t => (
              <button
                key={t}
                className={`${styles.tagFilter} ${activeTag === t ? styles.tagFilterActive : ""}`}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
              >#{t}</button>
            ))}
          </div>
        </div>

        <div className={styles.bodyGrid}>
          <main>
            <div className={styles.mainHeader}>
              <h2 className={styles.sectionTitle}><Hash size={18} />Community Rooms</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                <Plus size={14} />New Community
              </button>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite", opacity: 0.5 }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", opacity: 0.5 }}>
                <p>{search ? `No communities matching "${search}"` : "No communities yet."}</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }} onClick={() => setShowCreate(true)}>
                  <Plus size={14} />Create the first one
                </button>
              </div>
            ) : (
              <div className={styles.roomsGrid} role="list">
                {filtered.map((room) => (
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
                            {room._count.members} members
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className={styles.roomName}>{room.name}</h3>
                    <p className={styles.roomDesc}>{room.desc}</p>

                    {room.tags.length > 0 && (
                      <div className={styles.roomTags}>
                        {room.tags.slice(0, 3).map(t => (
                          <span key={t} className={styles.roomTag}>#{t}</span>
                        ))}
                      </div>
                    )}

                    {room.threads.length > 0 && (
                      <div className={styles.previewList}>
                        {room.threads.map((t) => (
                          <div key={t.id} className={styles.previewItem}>
                            <span className={styles.previewAuthor}>{t.author.name ?? t.author.handle}</span>
                            <span className={styles.previewText}>{t.title}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {room.type === "private" && (
                      <div className={styles.lockedOverlay}>
                        <Lock size={16} /><span>Invite only</span>
                      </div>
                    )}

                    <div className={styles.roomFooter}>
                      <span className={styles.roomMembers}><Users size={12} />{room._count.members} members</span>
                      {room.type === "public"  && <span className={styles.joinHint}>Join →</span>}
                      {room.type === "request" && <span className={styles.requestHint}>Request →</span>}
                      {room.type === "private" && <span className={styles.lockedHint}><Lock size={11} />Locked</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><TrendingUp size={15} />Active Discussions</h3>
              <div className={styles.discussionList}>
                {recentThreads.length === 0 && (
                  <p style={{ opacity: 0.5, fontSize: "0.8rem" }}>No discussions yet. Start one!</p>
                )}
                {recentThreads.map((t) => (
                  <Link key={t.id} href={`/community/${t.community.slug}`} className={styles.discussionLink}>
                    <span className={styles.discussionRoom} style={{ color: t.community.color }}>#{t.community.name}</span>
                    <p className={styles.discussionTitle}>{t.title}</p>
                    <div className={styles.discussionMeta}>
                      <div className="avatar avatar-sm" style={{ background: t.community.color, fontSize: "0.6rem", width: "18px", height: "18px" }}>
                        {(t.author.name ?? t.author.handle)[0].toUpperCase()}
                      </div>
                      <span>{t.author.name ?? t.author.handle}</span>
                      <span>·</span>
                      <MessageSquare size={11} />
                      <span>{t._count.replies}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Users size={15} />Community Types</h3>
              {[
                { icon: <Eye size={13} />, type: "Open", desc: "Anyone can join freely" },
                { icon: <Clock size={13} />, type: "Request", desc: "Apply — admin approves" },
                { icon: <Lock size={13} />, type: "Locked", desc: "Invite-only, link-only" },
                { icon: <EyeOff size={13} />, type: "Secret", desc: "Not discoverable" },
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

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(c) => setCommunities(prev => [c, ...prev])}
        />
      )}
    </div>
  );
}
