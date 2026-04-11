"use client";

import Link from "next/link";
import { UserPlus, FileText, TrendingUp } from "lucide-react";
import styles from "./FeaturedWriters.module.css";

const WRITERS = [
  {
    name: "Sarah Chen",
    handle: "sarahchen",
    bio: "AI researcher & tech writer. Making complex ideas accessible.",
    avatar: "S",
    color: "#348fff",
    followers: "14.2K",
    articles: 89,
    tag: "Technology",
  },
  {
    name: "Marcus Reid",
    handle: "marcusreid",
    bio: "Design systems lead at a Fortune 500. Writing about craft & scale.",
    avatar: "M",
    color: "#a78bfa",
    followers: "9.8K",
    articles: 54,
    tag: "Design",
  },
  {
    name: "Dr. Aisha Patel",
    handle: "aishapatel",
    bio: "Neuroscientist exploring the intersection of mind, behaviour, and culture.",
    avatar: "A",
    color: "#22c55e",
    followers: "22.1K",
    articles: 112,
    tag: "Science",
  },
  {
    name: "James Okafor",
    handle: "jamesokafor",
    bio: "2x founder, seed investor. Writing the startup playbook nobody tells you about.",
    avatar: "J",
    color: "#f97316",
    followers: "31.4K",
    articles: 67,
    tag: "Startups",
  },
];

export function FeaturedWriters() {
  return (
    <section className={styles.section} aria-labelledby="writers-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 id="writers-heading" className={styles.title}>
            Writers Worth <span className="gradient-text">Following</span>
          </h2>
          <Link href="/explore?tab=writers" className="btn btn-ghost btn-sm">
            Discover writers →
          </Link>
        </div>

        <div className={styles.grid} role="list">
          {WRITERS.map((writer) => (
            <div key={writer.handle} className={styles.card} role="listitem">
              {/* Top accent */}
              <div className={styles.cardAccent} style={{ background: `linear-gradient(90deg, ${writer.color}40, transparent)` }} />

              <div className={styles.cardBody}>
                <div className={styles.topRow}>
                  <div className={`avatar avatar-lg ${styles.avatar}`} style={{ background: `linear-gradient(135deg, ${writer.color}cc, ${writer.color})` }}>
                    {writer.avatar}
                  </div>
                  <button className={`btn btn-secondary btn-sm ${styles.followBtn}`} aria-label={`Follow ${writer.name}`}>
                    <UserPlus size={13} />
                    Follow
                  </button>
                </div>

                <div>
                  <Link href={`/profile/${writer.handle}`} className={styles.writerName}>
                    {writer.name}
                  </Link>
                  <span className={styles.writerTag} style={{ color: writer.color }}>
                    {writer.tag}
                  </span>
                  <p className={styles.writerBio}>{writer.bio}</p>
                </div>

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <TrendingUp size={13} />
                    <span className={styles.statValue}>{writer.followers}</span>
                    <span className={styles.statLabel}>followers</span>
                  </div>
                  <div className={styles.statDivider} />
                  <div className={styles.stat}>
                    <FileText size={13} />
                    <span className={styles.statValue}>{writer.articles}</span>
                    <span className={styles.statLabel}>articles</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
