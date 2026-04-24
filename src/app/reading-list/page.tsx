"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Clock, Trash2, Grid, List, Loader2 } from "lucide-react";
import styles from "./reading-list.module.css";
import toast from "react-hot-toast";

interface BookmarkItem {
  id: string;
  createdAt: string;
  article: {
    id: string; slug: string; title: string; excerpt: string | null;
    tags: string[]; readTime: number;
    author: { name: string | null; handle: string };
  };
}

const TAG_COLORS: Record<string, string> = {
  Technology: "#348fff", Design: "#a78bfa", Philosophy: "#ec4899",
  Startups: "#f97316", Science: "#22c55e", Health: "#06b6d4",
  Productivity: "#8b5cf6", Psychology: "#f59e0b",
};

export default function ReadingListPage() {
  const [items,   setItems]   = useState<BookmarkItem[]>([]);
  const [layout,  setLayout]  = useState<"list" | "grid">("list");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function removeItem(bookmarkId: string, articleId: string) {
    const res = await fetch(`/api/bookmarks/${articleId}`, { method: "POST" });
    if (!res.ok) { toast.error("Failed to remove"); return; }
    setItems(prev => prev.filter(i => i.id !== bookmarkId));
    toast.success("Removed from reading list");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", opacity: 0.5 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <BookOpen size={24} className={styles.titleIcon} />
              Reading List
            </h1>
            <p className={styles.subtitle}>{items.length} saved article{items.length !== 1 ? "s" : ""}</p>
          </div>
          <div className={styles.controls}>
            <div className={styles.layoutToggle}>
              <button
                className={`${styles.layoutBtn} ${layout === "list" ? styles.layoutBtnActive : ""}`}
                onClick={() => setLayout("list")} aria-label="List view" aria-pressed={layout === "list"}
              ><List size={15} /></button>
              <button
                className={`${styles.layoutBtn} ${layout === "grid" ? styles.layoutBtnActive : ""}`}
                onClick={() => setLayout("grid")} aria-label="Grid view" aria-pressed={layout === "grid"}
              ><Grid size={15} /></button>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <BookOpen size={40} className={styles.emptyIcon} />
            <h2>Your reading list is empty</h2>
            <p>Bookmark articles from Explore to read them later.</p>
            <Link href="/explore" className="btn btn-primary">Browse Articles</Link>
          </div>
        ) : (
          <div className={layout === "grid" ? styles.gridLayout : styles.listLayout}>
            {items.map((item) => {
              const tag = item.article.tags[0] ?? "General";
              const color = TAG_COLORS[tag] ?? "#64748b";
              const savedDate = new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div key={item.id} className={layout === "grid" ? styles.gridCard : styles.listCard}>
                  {layout === "list" && <div className={styles.listAccent} style={{ background: color }} />}
                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardTag} style={{ color }}>{tag}</span>
                      <div className={styles.cardMeta}>
                        <Clock size={11} />
                        <span>{item.article.readTime} min</span>
                        <span>·</span>
                        <span>Saved {savedDate}</span>
                      </div>
                    </div>
                    <Link href={`/article/${item.article.slug}`} className={styles.cardTitleLink}>
                      <h2 className={styles.cardTitle}>{item.article.title}</h2>
                    </Link>
                    {layout === "list" && item.article.excerpt && (
                      <p className={styles.cardExcerpt}>{item.article.excerpt}</p>
                    )}
                    <div className={styles.cardFooter}>
                      <span className={styles.cardAuthor}>
                        By {item.article.author.name ?? item.article.author.handle}
                      </span>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.id, item.article.id)}
                        aria-label={`Remove "${item.article.title}" from reading list`}
                      >
                        <Trash2 size={14} />Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
