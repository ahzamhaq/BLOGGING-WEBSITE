import Link from "next/link";
import { Hash } from "lucide-react";
import styles from "./TrendingTopics.module.css";

const TOPICS = [
  { name: "Technology",   slug: "technology",   count: "12.4K articles", color: "#348fff" },
  { name: "Design",       slug: "design",       count: "8.7K articles",  color: "#a78bfa" },
  { name: "Science",      slug: "science",      count: "6.2K articles",  color: "#22c55e" },
  { name: "Psychology",   slug: "psychology",   count: "5.1K articles",  color: "#f59e0b" },
  { name: "Startups",     slug: "startups",     count: "9.3K articles",  color: "#f97316" },
  { name: "Health",       slug: "health",       count: "7.8K articles",  color: "#06b6d4" },
  { name: "Philosophy",   slug: "philosophy",   count: "3.4K articles",  color: "#ec4899" },
  { name: "Productivity", slug: "productivity", count: "10.1K articles", color: "#8b5cf6" },
];

export function TrendingTopics() {
  return (
    <section className={styles.section} aria-labelledby="topics-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 id="topics-heading" className={styles.title}>
            Explore by <span className="gradient-text">Topic</span>
          </h2>
          <Link href="/topics" className="btn btn-ghost btn-sm">View all topics →</Link>
        </div>

        <div className={styles.grid} role="list">
          {TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className={styles.topicCard}
              role="listitem"
              style={{ "--topic-color": topic.color } as React.CSSProperties}
            >
              <div className={styles.topicIcon} aria-hidden="true">
                <Hash size={16} />
              </div>
              <div>
                <p className={styles.topicName}>{topic.name}</p>
                <p className={styles.topicCount}>{topic.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
