"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Heart, Reply, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import styles from "./Comments.module.css";

interface Author {
  id: string;
  name: string | null;
  handle: string;
  image: string | null;
}

interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  likes: number;
  author: Author;
  replies?: CommentData[];
}

interface Props {
  articleId: string;
}

function Avatar({ author, size = "sm" }: { author: Author; size?: "sm" | "md" }) {
  const initials = (author.name ?? author.handle)[0].toUpperCase();
  const colors = ["#348fff","#a78bfa","#f97316","#22c55e","#ec4899","#f59e0b"];
  const color  = colors[author.handle.charCodeAt(0) % colors.length];
  return (
    <div
      className={`avatar avatar-${size}`}
      style={{ background: author.image ? undefined : color, fontSize: size === "sm" ? "0.65rem" : "0.8rem" }}
    >
      {author.image ? <img src={author.image} alt={author.name ?? ""} /> : initials}
    </div>
  );
}

function CommentCard({
  comment,
  articleId,
  depth = 0,
  onDeleted,
}: {
  comment: CommentData;
  articleId: string;
  depth?: number;
  onDeleted: (id: string) => void;
}) {
  const { data: session } = useSession();
  const [liked, setLiked]       = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded]  = useState(true);
  const [replies, setReplies]    = useState<CommentData[]>(comment.replies ?? []);

  function handleLike() {
    if (!session) { toast.error("Sign in to like comments"); return; }
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  }

  async function submitReply() {
    if (!session) { toast.error("Sign in to reply"); return; }
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${articleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim(), parentId: comment.id }),
      });
      if (!res.ok) throw new Error("Failed");
      const newReply: CommentData = await res.json();
      setReplies((prev) => [...prev, newReply]);
      setReplyText("");
      setShowReply(false);
      toast.success("Reply posted!");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${articleId}?commentId=${comment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      onDeleted(comment.id);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const isOwner = session?.user?.id === comment.author.id;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <div className={`${styles.commentCard} ${depth > 0 ? styles.commentReply : ""}`}>
      <div className={styles.commentHeader}>
        <Link href={`/profile/${comment.author.handle}`} className={styles.commentAuthor}>
          <Avatar author={comment.author} />
          <div>
            <span className={styles.authorName}>{comment.author.name ?? comment.author.handle}</span>
            <span className={styles.commentTime}>{timeAgo}</span>
          </div>
        </Link>
        {isOwner && (
          <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Delete comment">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <p className={styles.commentBody}>{comment.body}</p>

      <div className={styles.commentActions}>
        <button
          className={`${styles.actionBtn} ${liked ? styles.actionBtnActive : ""}`}
          onClick={handleLike}
        >
          <Heart size={13} fill={liked ? "currentColor" : "none"} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        {depth === 0 && (
          <button className={styles.actionBtn} onClick={() => setShowReply((v) => !v)}>
            <Reply size={13} />
            Reply
          </button>
        )}
        {depth === 0 && replies.length > 0 && (
          <button className={styles.actionBtn} onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "Hide" : `${replies.length}`} {replies.length === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>

      {showReply && (
        <div className={styles.replyBox}>
          <textarea
            className={styles.replyInput}
            placeholder={`Reply to ${comment.author.name ?? comment.author.handle}…`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
          />
          <div className={styles.replyActions}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowReply(false)}>Cancel</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={submitReply}
              disabled={submitting || !replyText.trim()}
            >
              {submitting ? "Posting…" : "Post reply"}
            </button>
          </div>
        </div>
      )}

      {expanded && replies.length > 0 && (
        <div className={styles.repliesList}>
          {replies.map((r) => (
            <CommentCard
              key={r.id}
              comment={r}
              articleId={articleId}
              depth={depth + 1}
              onDeleted={(id) => setReplies((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Comments({ articleId }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [newBody,  setNewBody]  = useState("");
  const [posting,  setPosting]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${articleId}`);
      if (res.ok) setComments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  async function postComment() {
    if (!session) { toast.error("Sign in to comment"); return; }
    if (!newBody.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/comments/${articleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newBody.trim() }),
      });
      if (!res.ok) throw new Error();
      const c: CommentData = await res.json();
      setComments((prev) => [c, ...prev]);
      setNewBody("");
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="comments-heading">
      <h2 id="comments-heading" className={styles.heading}>
        <MessageCircle size={20} />
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h2>

      {/* Comment input */}
      <div className={styles.inputRow}>
        {session ? (
          <>
            <div className="avatar avatar-sm" style={{ background: "#348fff", fontSize: "0.65rem" }}>
              {(session.user?.name ?? session.user?.email ?? "U")[0].toUpperCase()}
            </div>
            <div className={styles.inputBox}>
              <textarea
                className={styles.commentInput}
                placeholder="Add a thoughtful comment…"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) postComment();
                }}
              />
              {newBody.trim() && (
                <div className={styles.inputActions}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setNewBody("")}>Cancel</button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={postComment}
                    disabled={posting}
                  >
                    {posting ? "Posting…" : "Post comment"}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.signInPrompt}>
            <Link href="/auth/signin" className="btn btn-primary btn-sm">Sign in to comment</Link>
          </div>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className={styles.loading}>Loading comments…</div>
      ) : comments.length === 0 ? (
        <div className={styles.empty}>No comments yet. Be the first!</div>
      ) : (
        <div className={styles.commentList}>
          {comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              articleId={articleId}
              onDeleted={(id) => setComments((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
