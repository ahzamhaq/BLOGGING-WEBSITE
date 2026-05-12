"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageSquareReply, Clock, Heart, MessageCircle, CornerDownRight } from "lucide-react";
import styles from "./ReplyThread.module.css";

interface Reply {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImage: string | null;
  readTime: number;
  createdAt: string;
  author: { name: string | null; handle: string; image: string | null };
  _count: { likes: number; comments: number };
}

interface Props {
  articleId: string;
  articleTitle: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ReplyThread({ articleId, articleTitle }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/articles/${articleId}/replies`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled) setReplies(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [articleId]);

  const handleReply = () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/editor/__new__?replyTo=${articleId}`)}`);
      return;
    }
    router.push(`/editor/__new__?replyTo=${articleId}`);
  };

  return (
    <section className={styles.section} aria-label="Reply posts">
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <CornerDownRight size={18} />
            Replies
            {!loading && replies.length > 0 && (
              <span className={styles.count}>{replies.length}</span>
            )}
          </h2>
          <p className={styles.subtitle}>
            Continue the conversation with a full post in response.
          </p>
        </div>
        <button className={styles.replyBtn} onClick={handleReply} type="button">
          <MessageSquareReply size={15} />
          Reply with a Post
        </button>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={`skeleton ${styles.skLine}`} />
              <div className={`skeleton ${styles.skLineShort}`} />
            </div>
          ))}
        </div>
      ) : replies.length === 0 ? (
        <div className={styles.empty}>
          <MessageSquareReply size={32} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            No replies yet. Be the first to respond to{" "}
            <strong>“{articleTitle}”</strong> with your own post.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {replies.map((r) => {
            const initial = (r.author.name ?? r.author.handle)[0]?.toUpperCase() ?? "?";
            return (
              <li key={r.id} className={styles.item}>
                <Link href={`/article/${r.slug}`} className={styles.itemLink}>
                  <div className={styles.itemHeader}>
                    <div className="avatar avatar-sm" style={{ background: "var(--brand-400)" }}>
                      {initial}
                    </div>
                    <div className={styles.itemAuthor}>
                      <span className={styles.authorName}>{r.author.name ?? r.author.handle}</span>
                      <span className={styles.itemMeta}>
                        @{r.author.handle} · {fmt(r.createdAt)} · <Clock size={11} style={{ display: "inline" }} /> {r.readTime} min
                      </span>
                    </div>
                  </div>
                  <h3 className={styles.itemTitle}>{r.title}</h3>
                  {(r.subtitle ?? r.excerpt) && (
                    <p className={styles.itemExcerpt}>{r.subtitle ?? r.excerpt}</p>
                  )}
                  <div className={styles.itemStats}>
                    <span><Heart size={12} /> {r._count.likes}</span>
                    <span><MessageCircle size={12} /> {r._count.comments}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
