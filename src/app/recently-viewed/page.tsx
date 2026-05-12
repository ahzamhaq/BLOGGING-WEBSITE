"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Clock, Trash2, BookOpen } from "lucide-react";
import {
  readRecentlyViewed,
  clearRecentlyViewed,
  type RecentlyViewedItem,
} from "@/components/article/RecentlyViewedTracker";
import styles from "./recently-viewed.module.css";

function fmtRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RecentlyViewedPage() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(readRecentlyViewed());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    if (!confirm("Clear your recently viewed list?")) return;
    clearRecentlyViewed();
    setItems([]);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <History size={22} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Recently Viewed</h1>
            <p className={styles.subtitle}>Pick up where you left off</p>
          </div>
        </div>
        {items.length > 0 && (
          <button className={styles.clearBtn} onClick={handleClear} type="button">
            <Trash2 size={14} /> Clear history
          </button>
        )}
      </header>

      {!loaded ? (
        <div className={styles.empty}><div className={styles.spinner} /></div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <BookOpen size={44} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Nothing here yet</h2>
          <p className={styles.emptyText}>
            Articles you open will appear here so you can revisit them quickly.
          </p>
          <Link href="/explore" className="btn btn-primary">
            Discover articles
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((it) => (
            <Link key={it.id} href={`/article/${it.slug}`} className={styles.card}>
              {it.coverImage ? (
                <div className={styles.cover}>
                  <img src={it.coverImage} alt="" />
                </div>
              ) : (
                <div className={styles.coverFallback} />
              )}
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span>{it.authorName}</span>
                  <span className={styles.dot}>·</span>
                  <span>{fmtRelative(it.viewedAt)}</span>
                </div>
                <h2 className={styles.cardTitle}>{it.title}</h2>
                <div className={styles.footer}>
                  <Clock size={11} /> {it.readTime} min read
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
