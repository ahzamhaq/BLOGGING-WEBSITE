"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Heart, UserPlus, MessageCircle, Reply, X, CheckCheck } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import styles from "./NotificationsDropdown.module.css";

interface Notif {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  like:    <Heart    size={14} />,
  follow:  <UserPlus size={14} />,
  comment: <MessageCircle size={14} />,
  reply:   <Reply    size={14} />,
};

// Mock notifications shown before DB is connected
const MOCK: Notif[] = [
  { id: "1", type: "like",    message: "Sarah Chen liked your article",           link: "/article/future-ai-writing",    read: false, createdAt: new Date(Date.now() - 5  * 60000).toISOString() },
  { id: "2", type: "follow",  message: "Marcus Reid started following you",        link: "/profile/marcusreid",           read: false, createdAt: new Date(Date.now() - 23 * 60000).toISOString() },
  { id: "3", type: "comment", message: "Dr. A. Patel commented on your article",   link: "/article/design-systems-scale", read: true,  createdAt: new Date(Date.now() - 2  * 3600000).toISOString() },
  { id: "4", type: "reply",   message: "James Okafor replied to your comment",     link: "/article/deep-work-habits",     read: true,  createdAt: new Date(Date.now() - 6  * 3600000).toISOString() },
  { id: "5", type: "like",    message: "3 people liked your article",              link: "/article/stoicism-productivity",read: true,  createdAt: new Date(Date.now() - 1  * 86400000).toISOString() },
];

export function NotificationsDropdown() {
  const { data: session } = useSession();
  const [open,  setOpen]  = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => { setMounted(true); }, []);

  // Load real notifications only when authenticated
  useEffect(() => {
    if (!session?.user) { setNotifs([]); return; }
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setNotifs(data); })
      .catch(() => {});
  }, [session?.user?.id]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !dropRef.current?.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const markAllRead = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    if (session?.user) {
      await fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    }
  }, [session]);

  const dismiss = useCallback(async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    if (session?.user) {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" }).catch(() => {});
    }
  }, [session]);

  // Position dropdown below the button
  function getDropStyle(): React.CSSProperties {
    if (!btnRef.current) return {};
    const rect = btnRef.current.getBoundingClientRect();
    return {
      position: "fixed",
      top:  rect.bottom + 8,
      right: window.innerWidth - rect.right,
    };
  }

  return (
    <>
      <button
        ref={btnRef}
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={17} />
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {mounted && open && createPortal(
        <div ref={dropRef} className={styles.dropdown} style={getDropStyle()}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Notifications</span>
            {unread > 0 && (
              <button className={styles.markAllBtn} onClick={markAllRead}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className={styles.empty}>You&apos;re all caught up!</div>
          ) : (
            <ul className={styles.list} role="list">
              {notifs.map((n) => {
                const icon = TYPE_ICON[n.type] ?? <Bell size={14} />;
                const time = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });
                const inner = (
                  <li key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ""}`}>
                    <span className={`${styles.icon} ${styles[`icon_${n.type}`] ?? ""}`}>{icon}</span>
                    <div className={styles.itemContent}>
                      <p className={styles.message}>{n.message}</p>
                      <span className={styles.time}>{time}</span>
                    </div>
                    <button
                      className={styles.dismissBtn}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(n.id); }}
                      aria-label="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </li>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className={styles.itemLink}>
                    {inner}
                  </Link>
                ) : inner;
              })}
            </ul>
          )}

          <div className={styles.footer}>
            <Link href="/notifications" className={styles.footerLink} onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
