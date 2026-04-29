"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, Bookmark, MessageCircle, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { ShareModal } from "@/components/ShareModal";
import styles from "./article.module.css";

interface Props {
  articleId: string;
  slug: string;
  title: string;
  likes: number;
  commentsCount?: number;
}

export function ArticleActions({ articleId, slug, title, likes, commentsCount = 0 }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [liked,      setLiked]      = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount,  setLikeCount]  = useState(likes);
  const [pending,    setPending]    = useState(false);

  const articleUrl = typeof window !== "undefined"
    ? `${window.location.origin}/article/${slug}`
    : `/article/${slug}`;

  function requireAuth(action: () => void) {
    if (!session) {
      router.push(`/auth/signup?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    action();
  }

  const handleLike = useCallback(async () => {
    requireAuth(async () => {
      if (pending) return;
      setPending(true);
      const wasLiked = liked;
      setLiked(!wasLiked);
      setLikeCount(c => wasLiked ? c - 1 : c + 1);
      try {
        const res = await fetch(`/api/likes/${articleId}`, { method: "POST" });
        if (!res.ok) throw new Error();
      } catch {
        setLiked(wasLiked);
        setLikeCount(c => wasLiked ? c + 1 : c - 1);
        toast.error("Failed to like article");
      } finally {
        setPending(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, liked, pending, articleId]);

  const handleBookmark = useCallback(async () => {
    requireAuth(async () => {
      if (pending) return;
      setPending(true);
      const wasBookmarked = bookmarked;
      setBookmarked(!wasBookmarked);
      try {
        const res = await fetch(`/api/bookmarks/${articleId}`, { method: "POST" });
        if (!res.ok) throw new Error();
        toast.success(wasBookmarked ? "Removed from reading list" : "Saved to reading list!");
      } catch {
        setBookmarked(wasBookmarked);
        toast.error("Failed to update bookmark");
      } finally {
        setPending(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, bookmarked, pending, articleId]);

  return (
    <aside className={styles.likeBar} aria-label="Article actions">
      <button
        className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ""}`}
        onClick={handleLike}
        aria-label={liked ? "Unlike article" : "Like article"}
        aria-pressed={liked}
        disabled={pending}
      >
        <Heart size={20} fill={liked ? "currentColor" : "none"} />
        <span>{likeCount.toLocaleString()}</span>
      </button>

      <button
        className={styles.likeBtn}
        aria-label="Comments"
        onClick={() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" })}
      >
        <MessageCircle size={20} />
        <span>{commentsCount}</span>
      </button>

      <button
        className={`${styles.likeBtn} ${bookmarked ? styles.bookmarkActive : ""}`}
        onClick={handleBookmark}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
        aria-pressed={bookmarked}
        disabled={pending}
      >
        <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
      </button>

      <ShareModal
        url={articleUrl}
        title={title}
        isPublished
        trigger={
          <button className={styles.likeBtn} aria-label="Share article" type="button">
            <Share2 size={20} />
          </button>
        }
      />
    </aside>
  );
}
