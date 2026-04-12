"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  handle: string;
  initialFollowing?: boolean;
  initialFollowers?: number;
  showCount?: boolean;
  size?: "sm" | "md";
}

export function FollowButton({
  handle,
  initialFollowing = false,
  initialFollowers = 0,
  showCount = false,
  size = "md",
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [following,  setFollowing]  = useState(initialFollowing);
  const [followers,  setFollowers]  = useState(initialFollowers);
  const [loading,    setLoading]    = useState(false);
  const [hydrated,   setHydrated]   = useState(false);

  // Fetch real state once mounted
  useEffect(() => {
    setHydrated(true);
    fetch(`/api/follow/${handle}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setFollowing(data.isFollowing);
          setFollowers(data.followers);
        }
      })
      .catch(() => {});
  }, [handle]);

  const toggle = useCallback(async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    setLoading(true);
    // Optimistic update
    setFollowing((v) => !v);
    setFollowers((c) => following ? c - 1 : c + 1);
    try {
      const res = await fetch(`/api/follow/${handle}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFollowing(data.isFollowing);
      toast.success(data.isFollowing ? `Following @${handle}` : `Unfollowed @${handle}`);
    } catch {
      // Revert on failure
      setFollowing((v) => !v);
      setFollowers((c) => following ? c + 1 : c - 1);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [session, handle, following, router]);

  const btnSize = size === "sm" ? "btn-sm" : "";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <button
        className={`btn ${following ? "btn-secondary" : "btn-primary"} ${btnSize}`}
        onClick={toggle}
        disabled={loading || !hydrated}
        aria-label={following ? `Unfollow @${handle}` : `Follow @${handle}`}
      >
        {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
        {following ? "Following" : "Follow"}
      </button>
      {showCount && followers > 0 && (
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          {followers.toLocaleString()} followers
        </span>
      )}
    </div>
  );
}
