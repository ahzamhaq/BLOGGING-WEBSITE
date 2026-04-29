"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, TrendingUp, Clock, Flame, Star, Heart, Bookmark, Loader2 } from "lucide-react";
import Link from "next/link";
import styles from "./explore.module.css";

interface Article {
  id: string; slug: string; title: string; excerpt: string | null;
  tags: string[]; readTime: number; createdAt: string;
  author: { name: string | null; handle: string };
  _count: { likes: number };
}

const TABS = [
  { id: "trending", label: "Trending", icon: Flame      },
  { id: "latest",   label: "Latest",   icon: Clock      },
  { id: "top",      label: "Top",      icon: TrendingUp },
  { id: "all",      label: "All",      icon: Star       },
] as const;
type Tab = typeof TABS[number]["id"];

const TAG_COLORS: Record<string, string> = {
  Technology: "#348fff", Design: "#a78bfa", Philosophy: "#ec4899",
  Startups: "#f97316", Science: "#22c55e", Health: "#06b6d4",
  Productivity: "#8b5cf6", Psychology: "#f59e0b",
};

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? "#64748b";
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const [query,     setQuery]     = useState(initialQ);
  const [articles,  setArticles]  = useState<Article[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => { setQuery(initialQ); }, [initialQ]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ filter: activeTab });
    if (query) params.set("q", query);
    fetch(`/api/articles?${params}`)
      .then(r => r.json())
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [activeTab, query]);

  async function toggleBookmark(articleId: string, slug: string) {
    const res = await fetch(`/api/bookmarks/${articleId}`, { method: "POST" });
    if (res.status === 401) { return; }
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  const primaryTag = (a: Article) => a.tags[0] ?? "General";

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Explore <span className="gradient-text">Ideas</span></h1>
          <p className={styles.heroSubtitle}>Thoughtful articles from writers across every discipline.</p>
          <div className={styles.searchBar}>
            <Search size={17} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search articles, writers, topics…"
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search articles"
            />
            {query && (
              <button className={styles.searchClear} onClick={() => setQuery("")} aria-label="Clear search">×</button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.tabs} role="tablist" aria-label="Article filters">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          <div className={styles.articleList}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite", opacity: 0.5 }} />
              </div>
            ) : articles.length === 0 ? (
              <div className={styles.empty}>
                <p>No articles found{query ? ` for "${query}"` : ""}.</p>
                <button className="btn btn-secondary btn-sm" onClick={() => setQuery("")}>Clear search</button>
              </div>
            ) : (
              articles.map((a) => {
                const tag = primaryTag(a);
                const color = tagColor(tag);
                return (
                  <div key={a.slug} className={styles.articleCard}>
                    <div className={styles.articleAccent} style={{ background: color }} />
                    <div className={styles.articleBody}>
                      <div className={styles.articleMeta}>
                        <span className={styles.articleTag} style={{ color }}>{tag}</span>
                        <span className={styles.articleDate}>
                          {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <Link href={`/article/${a.slug}`} className={styles.articleTitleLink}>
                        <h2 className={styles.articleTitle}>{a.title}</h2>
                      </Link>
                      {a.excerpt && <p className={styles.articleExcerpt}>{a.excerpt}</p>}
                      <div className={styles.articleFooter}>
                        <div className={styles.authorRow}>
                          <div className="avatar avatar-sm" style={{ background: color, fontSize: "0.65rem" }}>
                            {(a.author.name ?? a.author.handle)[0].toUpperCase()}
                          </div>
                          <Link href={`/profile/${a.author.handle}`} className={styles.authorName}>
                            {a.author.name ?? a.author.handle}
                          </Link>
                          <span className={styles.sep}>·</span>
                          <span className={styles.readTime}>{a.readTime} min read</span>
                        </div>
                        <div className={styles.articleActions}>
                          <span className={styles.likes}><Heart size={13} />{a._count.likes.toLocaleString()}</span>
                          <button
                            className={`${styles.bookmarkBtn} ${bookmarks.has(a.slug) ? styles.bookmarkActive : ""}`}
                            onClick={() => toggleBookmark(a.id, a.slug)}
                            aria-label={bookmarks.has(a.slug) ? "Remove bookmark" : "Bookmark"}
                            aria-pressed={bookmarks.has(a.slug)}
                          >
                            <Bookmark size={14} fill={bookmarks.has(a.slug) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><TrendingUp size={14} /> Trending Topics</h3>
              {Object.keys(TAG_COLORS).map((t) => (
                <button key={t} className={styles.sideTag} style={{ color: tagColor(t) }} onClick={() => setQuery(t)}>
                  #{t}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <ExploreContent />
    </Suspense>
  );
}
