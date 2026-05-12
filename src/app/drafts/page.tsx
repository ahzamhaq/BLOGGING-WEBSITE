"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText, Globe, PenLine, Clock, Heart, MessageCircle,
  Trash2, Edit3, Eye, Search, RefreshCw, BookOpen, Calendar, Send
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./drafts.module.css";

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  tags: string[];
  readTime: number;
  scheduledFor?: string | null;
  parentArticleId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { likes: number; comments: number };
}

type Tab = "drafts" | "scheduled" | "published";

function DraftsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialTab: Tab = tabParam === "scheduled" || tabParam === "published" ? tabParam : "drafts";
  const [tab, setTab]             = useState<Tab>(initialTab);
  const [articles, setArticles]   = useState<Article[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [deleting, setDeleting]   = useState<string | null>(null);

  const load = useCallback(async (filter: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/mine?filter=${filter}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setArticles(data);
    } catch {
      toast.error("Could not load articles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
      return;
    }
    if (status === "authenticated") load(tab);
  }, [status, tab, load, router]);

  const switchTab = (t: Tab) => {
    setTab(t);
    router.replace(`/drafts?tab=${t}`, { scroll: false });
  };

  const handlePublishNow = async (id: string) => {
    if (!confirm("Publish this article right now?")) return;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true, clearSchedule: true }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Article published");
      load(tab);
    } catch {
      toast.error("Failed to publish");
    }
  };

  const handleReschedule = async (id: string, current: string | null) => {
    const initial = current ? new Date(current).toISOString().slice(0, 16) : "";
    const value = window.prompt("Enter new schedule (YYYY-MM-DDTHH:MM, your local time):", initial);
    if (value === null) return;
    if (!value.trim()) return;
    const d = new Date(value);
    if (isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      toast.error("Please pick a valid future date and time");
      return;
    }
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: d.toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Rescheduled to ${d.toLocaleString()}`);
      load(tab);
    } catch {
      toast.error("Failed to reschedule");
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (!confirm("Cancel scheduled publish? The article will move back to Drafts.")) return;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearSchedule: true, published: false }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Schedule cancelled");
      load(tab);
    } catch {
      toast.error("Failed to cancel schedule");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setArticles(prev => prev.filter(a => a.id !== id));
      toast.success("Article deleted.");
    } catch {
      toast.error("Could not delete article.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = articles.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (status === "loading") {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <BookOpen size={22} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>My Writing</h1>
            <p className={styles.subtitle}>Manage your drafts and published articles</p>
          </div>
        </div>
        <Link href="/editor/new" className="btn btn-primary">
          <PenLine size={15} />
          New Article
        </Link>
      </div>

      {/* ── Tabs */}
      <div className={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={tab === "drafts"}
          className={`${styles.tab} ${tab === "drafts" ? styles.tabActive : ""}`}
          onClick={() => switchTab("drafts")}
        >
          <FileText size={15} />
          Drafts
          {tab === "drafts" && !loading && (
            <span className={styles.tabCount}>{filtered.length}</span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={tab === "scheduled"}
          className={`${styles.tab} ${tab === "scheduled" ? styles.tabActive : ""}`}
          onClick={() => switchTab("scheduled")}
        >
          <Calendar size={15} />
          Scheduled
          {tab === "scheduled" && !loading && (
            <span className={styles.tabCount}>{filtered.length}</span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={tab === "published"}
          className={`${styles.tab} ${tab === "published" ? styles.tabActive : ""}`}
          onClick={() => switchTab("published")}
        >
          <Globe size={15} />
          Published
          {tab === "published" && !loading && (
            <span className={styles.tabCount}>{filtered.length}</span>
          )}
        </button>
      </div>

      {/* ── Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search articles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search articles"
          />
        </div>
        <button
          className={`btn btn-ghost btn-sm ${styles.refreshBtn}`}
          onClick={() => load(tab)}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Content */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={`skeleton ${styles.skeletonTitle}`} />
              <div className={`skeleton ${styles.skeletonMeta}`} />
              <div className={`skeleton ${styles.skeletonBody}`} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            {tab === "drafts" ? <FileText size={48} /> : tab === "scheduled" ? <Calendar size={48} /> : <Globe size={48} />}
          </div>
          <h2 className={styles.emptyTitle}>
            {search
              ? "No articles match your search"
              : tab === "drafts"
              ? "No drafts yet"
              : tab === "scheduled"
              ? "No scheduled posts"
              : "Nothing published yet"}
          </h2>
          <p className={styles.emptyText}>
            {search
              ? "Try a different search term."
              : tab === "drafts"
              ? "Start writing and save as draft — it'll appear here."
              : tab === "scheduled"
              ? "Schedule a post from the publish dialog and it'll show up here, ready to go live automatically."
              : "Publish an article to share it with the world."}
          </p>
          {!search && (
            <Link href="/editor/new" className="btn btn-primary">
              <PenLine size={15} />
              Write Something
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(article => (
            <article key={article.id} className={styles.card}>
              {article.coverImage && (
                <div className={styles.cardCover}>
                  <img src={article.coverImage} alt="" className={styles.coverImg} />
                </div>
              )}
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  {article.scheduledFor && !article.published ? (
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "#f59e0b",
                        border: "1px solid rgba(245,158,11,0.3)",
                      }}
                    >
                      <Calendar size={10} /> Scheduled
                    </span>
                  ) : (
                    <span className={`${styles.statusBadge} ${article.published ? styles.statusPublished : styles.statusDraft}`}>
                      {article.published ? <Globe size={10} /> : <FileText size={10} />}
                      {article.published ? "Published" : "Draft"}
                    </span>
                  )}
                  <span className={styles.metaDot}>·</span>
                  <span className={styles.metaDate}>
                    {article.scheduledFor && !article.published
                      ? `Goes live ${new Date(article.scheduledFor).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                      : fmt(article.updatedAt)}
                  </span>
                  {article.readTime > 0 && (
                    <>
                      <span className={styles.metaDot}>·</span>
                      <span className={styles.metaRead}>
                        <Clock size={11} /> {article.readTime} min read
                      </span>
                    </>
                  )}
                </div>

                <h2 className={styles.cardTitle}>{article.title}</h2>
                {article.subtitle && (
                  <p className={styles.cardSubtitle}>{article.subtitle}</p>
                )}
                {article.excerpt && !article.subtitle && (
                  <p className={styles.cardExcerpt}>{article.excerpt}</p>
                )}

                {article.tags.length > 0 && (
                  <div className={styles.tags}>
                    {article.tags.slice(0, 3).map(t => (
                      <span key={t} className={styles.tag}>#{t}</span>
                    ))}
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <div className={styles.cardStats}>
                    <span className={styles.stat}>
                      <Heart size={12} /> {article._count.likes}
                    </span>
                    <span className={styles.stat}>
                      <MessageCircle size={12} /> {article._count.comments}
                    </span>
                  </div>
                  <div className={styles.cardActions}>
                    {article.scheduledFor && !article.published && (
                      <>
                        <button
                          className={`btn btn-ghost btn-sm ${styles.actionBtn}`}
                          onClick={() => handlePublishNow(article.id)}
                          title="Publish immediately"
                          type="button"
                        >
                          <Send size={13} /> Publish Now
                        </button>
                        <button
                          className={`btn btn-ghost btn-sm ${styles.actionBtn}`}
                          onClick={() => handleReschedule(article.id, article.scheduledFor ?? null)}
                          title="Reschedule"
                          type="button"
                        >
                          <Calendar size={13} /> Reschedule
                        </button>
                        <button
                          className={`btn btn-ghost btn-sm ${styles.actionBtn}`}
                          onClick={() => handleCancelSchedule(article.id)}
                          title="Cancel schedule"
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {article.published && (
                      <Link
                        href={`/article/${article.slug}`}
                        className={`btn btn-ghost btn-sm ${styles.actionBtn}`}
                        title="View article"
                      >
                        <Eye size={13} /> View
                      </Link>
                    )}
                    <Link
                      href={`/editor/${article.id}`}
                      className={`btn btn-secondary btn-sm ${styles.actionBtn}`}
                      title="Edit article"
                    >
                      <Edit3 size={13} /> Edit
                    </Link>
                    <button
                      className={`btn btn-ghost btn-sm ${styles.deleteBtn}`}
                      title="Delete article"
                      onClick={() => handleDelete(article.id, article.title)}
                      disabled={deleting === article.id}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DraftsPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "4rem" }} />}>
      <DraftsContent />
    </Suspense>
  );
}
