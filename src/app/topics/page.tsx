import type { Metadata } from "next";
import Link from "next/link";
import styles from "./topics.module.css";

export const metadata: Metadata = {
  title: "Topics — WriteSpace",
  description: "Browse all writing topics and categories on WriteSpace.",
};

const TOPICS = [
  { name: "Technology",   slug: "technology",   count: "12.4K", color: "#348fff", emoji: "💻" },
  { name: "Design",       slug: "design",       count: "8.7K",  color: "#a78bfa", emoji: "🎨" },
  { name: "Science",      slug: "science",      count: "6.2K",  color: "#22c55e", emoji: "🔬" },
  { name: "Psychology",   slug: "psychology",   count: "5.1K",  color: "#f59e0b", emoji: "🧠" },
  { name: "Startups",     slug: "startups",     count: "9.3K",  color: "#f97316", emoji: "🚀" },
  { name: "Health",       slug: "health",       count: "7.8K",  color: "#06b6d4", emoji: "🩺" },
  { name: "Philosophy",   slug: "philosophy",   count: "3.4K",  color: "#ec4899", emoji: "📖" },
  { name: "Productivity", slug: "productivity", count: "10.1K", color: "#8b5cf6", emoji: "⚡" },
  { name: "Finance",      slug: "finance",      count: "4.2K",  color: "#10b981", emoji: "💰" },
  { name: "Writing",      slug: "writing",      count: "6.9K",  color: "#64748b", emoji: "✍️"  },
  { name: "Culture",      slug: "culture",      count: "3.8K",  color: "#e11d48", emoji: "🌍" },
  { name: "Education",    slug: "education",    count: "5.5K",  color: "#0ea5e9", emoji: "🎓" },
];

export default function TopicsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Browse by <span className="gradient-text">Topic</span></h1>
        <p className={styles.subtitle}>Find articles and writers you care about.</p>
      </div>
      <div className={styles.container}>
        <div className={styles.grid} role="list">
          {TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className={styles.topicCard}
              role="listitem"
              style={{ "--color": topic.color } as React.CSSProperties}
            >
              <span className={styles.topicEmoji}>{topic.emoji}</span>
              <div>
                <p className={styles.topicName}>{topic.name}</p>
                <p className={styles.topicCount}>{topic.count} articles</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
