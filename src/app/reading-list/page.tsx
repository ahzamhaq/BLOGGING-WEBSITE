"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Trash2, Filter, Grid, List } from "lucide-react";
import styles from "./reading-list.module.css";

const SAVED = [
  { slug: "future-ai-writing",    tag: "Technology", tagColor: "#348fff", title: "The Future of Writing Tools",           excerpt: "How software is changing research, drafting, and publishing.",                     author: "Sarah Chen",    readTime: "5 min",  savedDate: "Apr 10" },
  { slug: "stoicism-productivity",tag: "Philosophy", tagColor: "#ec4899", title: "What Stoics Teach Us About Productivity",excerpt: "Principles from Marcus Aurelius that still work surprisingly well.",              author: "Dr. A. Patel", readTime: "6 min",  savedDate: "Apr 9"  },
  { slug: "design-systems-scale", tag: "Design",     tagColor: "#a78bfa", title: "Design Systems at Scale",               excerpt: "After three years, here's what we learned about consistency and technical debt.", author: "Marcus Reid",   readTime: "8 min",  savedDate: "Apr 8"  },
  { slug: "quantum-computing",    tag: "Science",    tagColor: "#22c55e", title: "Quantum Computing in Plain English",     excerpt: "Qubits, superposition, entanglement — explained without a physics degree.",       author: "Dr. A. Patel", readTime: "12 min", savedDate: "Apr 7"  },
  { slug: "deep-work-habits",     tag: "Productivity",tagColor:"#8b5cf6", title: "6 Hours of Deep Work Every Day",        excerpt: "The exact system I use to protect my focus and produce my best work.",             author: "James Okafor", readTime: "7 min",  savedDate: "Apr 6"  },
];

export default function ReadingListPage() {
  const [items, setItems]   = useState(SAVED);
  const [layout, setLayout] = useState<"list" | "grid">("list");

  function removeItem(slug: string) {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <BookOpen size={24} className={styles.titleIcon} />
              Reading List
            </h1>
            <p className={styles.subtitle}>{items.length} saved articles</p>
          </div>
          <div className={styles.controls}>
            <button className="btn btn-ghost btn-sm">
              <Filter size={14} /> Filter
            </button>
            <div className={styles.layoutToggle}>
              <button
                className={`${styles.layoutBtn} ${layout === "list" ? styles.layoutBtnActive : ""}`}
                onClick={() => setLayout("list")} aria-label="List view" aria-pressed={layout === "list"}
              >
                <List size={15} />
              </button>
              <button
                className={`${styles.layoutBtn} ${layout === "grid" ? styles.layoutBtnActive : ""}`}
                onClick={() => setLayout("grid")} aria-label="Grid view" aria-pressed={layout === "grid"}
              >
                <Grid size={15} />
              </button>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <BookOpen size={40} className={styles.emptyIcon} />
            <h2>Your reading list is empty</h2>
            <p>Save articles from Explore to read them later.</p>
            <Link href="/explore" className="btn btn-primary">Browse Articles</Link>
          </div>
        ) : (
          <div className={layout === "grid" ? styles.gridLayout : styles.listLayout}>
            {items.map((item) => (
              <div key={item.slug} className={layout === "grid" ? styles.gridCard : styles.listCard}>
                {/* Accent */}
                {layout === "list" && (
                  <div className={styles.listAccent} style={{ background: item.tagColor }} />
                )}

                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardTag} style={{ color: item.tagColor }}>{item.tag}</span>
                    <div className={styles.cardMeta}>
                      <Clock size={11} />
                      <span>{item.readTime}</span>
                      <span>·</span>
                      <span>Saved {item.savedDate}</span>
                    </div>
                  </div>
                  <Link href={`/article/${item.slug}`} className={styles.cardTitleLink}>
                    <h2 className={styles.cardTitle}>{item.title}</h2>
                  </Link>
                  {layout === "list" && (
                    <p className={styles.cardExcerpt}>{item.excerpt}</p>
                  )}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardAuthor}>By {item.author}</span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.slug)}
                      aria-label={`Remove "${item.title}" from reading list`}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
