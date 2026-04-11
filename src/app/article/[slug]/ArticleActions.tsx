"use client";

import { useState } from "react";
import { Heart, Bookmark, Share2, Twitter, Link2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./article.module.css";

interface Props {
  likes: number;
  commentsCount?: number;
}

export function ArticleActions({ likes, commentsCount = 24 }: Props) {
  const [liked,     setLiked]     = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  function handleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  }

  function handleBookmark() {
    setBookmarked((v) => !v);
    toast.success(bookmarked ? "Removed from reading list" : "Saved to reading list!");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  }

  return (
    <aside className={styles.likeBar} aria-label="Article actions">
      <button
        className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ""}`}
        onClick={handleLike}
        aria-label={liked ? "Unlike article" : "Like article"}
        aria-pressed={liked}
      >
        <Heart size={20} fill={liked ? "currentColor" : "none"} />
        <span>{likeCount.toLocaleString()}</span>
      </button>

      <button className={styles.likeBtn} aria-label="Comments">
        <MessageCircle size={20} />
        <span>{commentsCount}</span>
      </button>

      <button
        className={`${styles.likeBtn} ${bookmarked ? styles.bookmarkActive : ""}`}
        onClick={handleBookmark}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
        aria-pressed={bookmarked}
      >
        <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
      </button>

      <button className={styles.likeBtn} aria-label="Share on Twitter">
        <Twitter size={20} />
      </button>

      <button className={styles.likeBtn} onClick={handleCopyLink} aria-label="Copy link">
        <Link2 size={20} />
      </button>

      <button className={styles.likeBtn} aria-label="Share">
        <Share2 size={20} />
      </button>
    </aside>
  );
}
