"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import { FollowButton } from "@/components/FollowButton";
import styles from "./followlist.module.css";

interface UserEntry {
  id: string; handle: string; name: string | null;
  image: string | null; bio: string | null;
  followers: number; isFollowing: boolean; isMe: boolean;
}

interface Props {
  handle: string;
  name: string | null;
  type: "followers" | "following";
  count: number;
}

export function FollowListPage({ handle, name, type, count }: Props) {
  const [users,   setUsers]   = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${handle}/${type}`)
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [handle, type]);

  const title = type === "followers"
    ? `People following ${name ?? handle}`
    : `${name ?? handle} is following`;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back header */}
        <div className={styles.header}>
          <Link href={`/profile/${handle}`} className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to profile</span>
          </Link>
          <div className={styles.titleRow}>
            <Users size={18} className={styles.titleIcon} />
            <h1 className={styles.title}>{title}</h1>
            <span className={styles.countBadge}>{count.toLocaleString()}</span>
          </div>
          <div className={styles.tabs}>
            <Link
              href={`/profile/${handle}/followers`}
              className={`${styles.tab} ${type === "followers" ? styles.tabActive : ""}`}
            >
              Followers
            </Link>
            <Link
              href={`/profile/${handle}/following`}
              className={`${styles.tab} ${type === "following" ? styles.tabActive : ""}`}
            >
              Following
            </Link>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 size={28} className={styles.spin} />
            <span>Loading…</span>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={40} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
            <p className={styles.emptyHint}>
              {type === "followers"
                ? "When people follow this writer, they'll appear here."
                : "When this writer follows someone, they'll appear here."}
            </p>
          </div>
        ) : (
          <div className={styles.userList}>
            {users.map(u => {
              const initials = (u.name ?? u.handle).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
              const hue = u.handle.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
              return (
                <div key={u.id} className={styles.userCard}>
                  <Link href={`/profile/${u.handle}`} className={styles.userAvatar}>
                    {u.image ? (
                      <img src={u.image} alt={u.name ?? u.handle} className={styles.avatarImg} />
                    ) : (
                      <div
                        className={styles.avatarInitials}
                        style={{ background: `linear-gradient(135deg, hsl(${hue},70%,45%), hsl(${(hue+30)%360},65%,38%))` }}
                      >
                        {initials}
                      </div>
                    )}
                  </Link>
                  <div className={styles.userInfo}>
                    <Link href={`/profile/${u.handle}`} className={styles.userName}>
                      {u.name ?? u.handle}
                    </Link>
                    <p className={styles.userHandle}>@{u.handle}</p>
                    {u.bio && <p className={styles.userBio}>{u.bio}</p>}
                    <p className={styles.userFollowers}>
                      {u.followers.toLocaleString()} follower{u.followers !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {!u.isMe && (
                    <div className={styles.followAction}>
                      <FollowButton handle={u.handle} initialFollowing={u.isFollowing} size="sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
