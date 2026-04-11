"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, TrendingUp, Clock, Flame, Star, Heart, Bookmark } from "lucide-react";
import Link from "next/link";
import styles from "./explore.module.css";

const ALL_ARTICLES = [
  { slug: "future-ai-writing",    tag: "Technology", tagColor: "#348fff", title: "The Future of Writing Tools",                  excerpt: "How software is changing the way we research, draft, and publish — and what writers can do about it.",                author: "Sarah Chen",    authorColor: "#348fff", readTime: "5 min",  likes: 847,  date: "Apr 10", category: "trending" },
  { slug: "design-systems-scale", tag: "Design",     tagColor: "#a78bfa", title: "Design Systems at Scale",                      excerpt: "After three years of iterating, here's what we learned about consistency and the hidden costs of technical debt.", author: "Marcus Reid",   authorColor: "#a78bfa", readTime: "8 min",  likes: 612,  date: "Apr 9",  category: "trending" },
  { slug: "stoicism-productivity",tag: "Philosophy", tagColor: "#ec4899", title: "What Stoics Teach Us About Productivity",       excerpt: "Marcus Aurelius ran a Roman empire. You manage a Slack inbox. The principles are surprisingly similar.",             author: "Dr. A. Patel", authorColor: "#22c55e", readTime: "6 min",  likes: 1243, date: "Apr 8",  category: "top"      },
  { slug: "seed-mistakes",        tag: "Startups",   tagColor: "#f97316", title: "7 Mistakes Raising Our Seed Round",             excerpt: "We raised $2.4M after 11 months of failed attempts. Here's the full, brutally honest story.",                   author: "James Okafor", authorColor: "#f97316", readTime: "10 min", likes: 2108, date: "Apr 7",  category: "top"      },
  { slug: "quantum-computing",    tag: "Science",    tagColor: "#22c55e", title: "Quantum Computing in Plain English",            excerpt: "Qubits, superposition, entanglement — explained without a physics degree.",                                     author: "Dr. A. Patel", authorColor: "#22c55e", readTime: "12 min", likes: 934,  date: "Apr 6",  category: "latest"   },
  { slug: "deep-work-habits",     tag: "Productivity",tagColor:"#8b5cf6", title: "How I Do 6 Hours of Deep Work Every Day",       excerpt: "The exact system I use to protect my focus, eliminate distractions, and produce my best work.",                   author: "James Okafor", authorColor: "#f97316", readTime: "7 min",  likes: 3241, date: "Apr 5",  category: "latest"   },
];

const TABS = [
  { id: "trending", label: "Trending", icon: Flame     },
  { id: "latest",   label: "Latest",   icon: Clock     },
  { id: "top",      label: "Top",      icon: TrendingUp},
  { id: "all",      label: "All",      icon: Star      },
] as const;

type Tab = typeof TABS[number]["id"];

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const [query,     setQuery]     = useState(initialQ);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => { setQuery(initialQ); }, [initialQ]);

  function toggleBookmark(slug: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const filtered = ALL_ARTICLES.filter((a) => {
    const matchTab = activeTab === "all" || a.category === activeTab;
    const matchQ   = !query || a.title.toLowerCase().includes(query.toLowerCase()) ||
                     a.tag.toLowerCase().includes(query.toLowerCase()) ||
                     a.author.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Explore <span className="gradient-text">Ideas</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Thoughtful articles from writers across every discipline.
          </p>
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
        {/* Tabs */}
        <div className={styles.tabs} role="tablist" aria-label="Article filters">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {/* Article list */}
          <div className={styles.articleList}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <p>No articles found{query ? ` for "${query}"` : ""}.</p>
                <button className="btn btn-secondary btn-sm" onClick={() => setQuery("")}>Clear search</button>
              </div>
            ) : (
              filtered.map((a) => (
                <div key={a.slug} className={styles.articleCard}>
                  <div className={styles.articleAccent} style={{ background: a.tagColor }} />
                  <div className={styles.articleBody}>
                    <div className={styles.articleMeta}>
                      <span className={styles.articleTag} style={{ color: a.tagColor }}>{a.tag}</span>
                      <span className={styles.articleDate}>{a.date}</span>
                    </div>
                    <Link href={`/article/${a.slug}`} className={styles.articleTitleLink}>
                      <h2 className={styles.articleTitle}>{a.title}</h2>
                    </Link>
                    <p className={styles.articleExcerpt}>{a.excerpt}</p>
                    <div className={styles.articleFooter}>
                      <div className={styles.authorRow}>
                        <div className="avatar avatar-sm" style={{ background: a.authorColor, fontSize: "0.65rem" }}>
                          {a.author[0]}
                        </div>
                        <span className={styles.authorName}>{a.author}</span>
                        <span className={styles.sep}>·</span>
                        <span className={styles.readTime}>{a.readTime} read</span>
                      </div>
                      <div className={styles.articleActions}>
                        <span className={styles.likes}><Heart size={13} />{a.likes.toLocaleString()}</span>
                        <button
                          className={`${styles.bookmarkBtn} ${bookmarks.has(a.slug) ? styles.bookmarkActive : ""}`}
                          onClick={() => toggleBookmark(a.slug)}
                          aria-label={bookmarks.has(a.slug) ? "Remove bookmark" : "Bookmark"}
                          aria-pressed={bookmarks.has(a.slug)}
                        >
                          <Bookmark size={14} fill={bookmarks.has(a.slug) ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><TrendingUp size={14} /> Trending Topics</h3>
              {["Technology","Design","Startups","Science","Philosophy","Productivity","Health","Psychology"].map((t) => (
                <button key={t} className={styles.sideTag} onClick={() => setQuery(t)}>
                  #{t}
                </button>
              ))}
            </div>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Star size={14} /> Writers to Follow</h3>
              {[
                { name: "Sarah Chen",   handle: "sarahchen",   tag: "Technology", color: "#348fff" },
                { name: "Marcus Reid",  handle: "marcusreid",  tag: "Design",     color: "#a78bfa" },
                { name: "James Okafor",handle: "jamesokafor", tag: "Startups",   color: "#f97316" },
              ].map((w) => (
                <div key={w.handle} className={styles.sideWriter}>
                  <Link href={`/profile/${w.handle}`} className={styles.sideWriterLeft}>
                    <div className="avatar avatar-sm" style={{ background: w.color, fontSize: "0.65rem" }}>{w.name[0]}</div>
                    <div>
                      <p className={styles.sideWriterName}>{w.name}</p>
                      <p className={styles.sideWriterTag} style={{ color: w.color }}>{w.tag}</p>
                    </div>
                  </Link>
                  <Link href={`/profile/${w.handle}`} className="btn btn-secondary btn-sm">Follow</Link>
                </div>
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
