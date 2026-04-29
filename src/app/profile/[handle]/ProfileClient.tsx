"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Heart, Clock, MessageSquare, Eye,
  Award, Star, Settings, Calendar, FileText, Users,
} from "lucide-react";
import { format } from "date-fns";
import { FollowButton } from "@/components/FollowButton";
import styles from "./profile.module.css";

interface Article {
  id: string; slug: string; title: string; subtitle: string | null;
  coverImage: string | null; tags: string[]; readTime: number;
  createdAt: string; likes: number; comments: number; views: number;
}

interface Achievement { emoji: string; label: string; sub: string; }

interface Props {
  handle: string;
  userId: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  createdAt: string;
  followers: number;
  following: number;
  articleCount: number;
  articles: Article[];
  topics: string[];
  achievements: Achievement[];
}

type Tab = "posts" | "about";

export function ProfileClient({
  handle, userId, name, image, bio, createdAt,
  followers, following, articleCount,
  articles, topics, achievements,
}: Props) {
  const [tab, setTab] = useState<Tab>("posts");
  const { data: session, status } = useSession();
  // Compare the logged-in user's ID against the profile owner's ID
  const isOwn = !!(session?.user?.id && userId && session.user.id === userId);
  // Don't render any action button until session is resolved to avoid flash
  const sessionReady = status !== "loading";

  const displayName = name ?? handle;
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Gradient derived from handle (consistent per user)
  const hue = handle.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const bannerGradient = `linear-gradient(135deg, hsl(${hue},60%,18%), hsl(${(hue + 40) % 360},55%,12%))`;
  const avatarGradient = `linear-gradient(135deg, hsl(${hue},70%,45%), hsl(${(hue + 30) % 360},65%,38%))`;

  return (
    <div className={styles.page}>
      {/* ── Banner ─────────────────────────────────────────────── */}
      <div className={styles.banner} style={{ background: bannerGradient }}>
        <div className={styles.bannerOverlay} />
      </div>

      <div className={styles.container}>
        {/* ── Profile header ─────────────────────────────────── */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarRing}>
            {image ? (
              <img src={image} alt={displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarInitials} style={{ background: avatarGradient }}>
                {initials}
              </div>
            )}
          </div>

          <div className={styles.headerActions}>
            {sessionReady && (isOwn ? (
              <Link href="/settings" className="btn btn-ghost btn-sm" aria-label="Edit profile">
                <Settings size={15} />
                Edit Profile
              </Link>
            ) : (
              <FollowButton handle={handle} initialFollowers={followers} />
            ))}
          </div>
        </div>

        {/* ── Identity ───────────────────────────────────────── */}
        <div className={styles.identity}>
          <h1 className={styles.displayName}>{displayName}</h1>
          <p className={styles.handle}>@{handle}</p>
          {bio && <p className={styles.bio}>{bio}</p>}
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <Calendar size={13} />
              Joined {format(new Date(createdAt), "MMMM yyyy")}
            </span>
          </div>
        </div>

        {/* ── Stats bar ──────────────────────────────────────── */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{articleCount}</span>
            <span className={styles.statLabel}>Articles</span>
          </div>
          <div className={styles.statDivider} />
          <Link href={`/profile/${handle}/followers`} className={styles.statItem}>
            <span className={styles.statNum}>{followers.toLocaleString()}</span>
            <span className={styles.statLabel}>Followers</span>
          </Link>
          <div className={styles.statDivider} />
          <Link href={`/profile/${handle}/following`} className={styles.statItem}>
            <span className={styles.statNum}>{following}</span>
            <span className={styles.statLabel}>Following</span>
          </Link>
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <div className={styles.tabRow} role="tablist">
          {(["posts", "about"] as Tab[]).map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "posts" ? <FileText size={14} /> : <Users size={14} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "posts" && articleCount > 0 && (
                <span className={styles.tabCount}>{articleCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ────────────────────────────────────── */}
        <div className={styles.content}>
          {tab === "posts" && (
            <div className={styles.mainCol}>
              {articles.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileText size={40} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
                  <p>No published articles yet.</p>
                </div>
              ) : (
                <div className={styles.articleList}>
                  {articles.map(a => (
                    <Link key={a.id} href={`/article/${a.slug}`} className={styles.articleCard}>
                      {a.coverImage && (
                        <img src={a.coverImage} alt={a.title} className={styles.articleCover} />
                      )}
                      <div className={styles.articleBody}>
                        {a.tags[0] && (
                          <span className={styles.articleTag}>{a.tags[0]}</span>
                        )}
                        <h3 className={styles.articleTitle}>{a.title}</h3>
                        {a.subtitle && (
                          <p className={styles.articleSubtitle}>{a.subtitle}</p>
                        )}
                        <div className={styles.articleMeta}>
                          <span>{format(new Date(a.createdAt), "MMM d, yyyy")}</span>
                          <span className={styles.dot}>·</span>
                          <Clock size={11} /><span>{a.readTime} min read</span>
                          <span className={styles.dot}>·</span>
                          <Heart size={11} /><span>{a.likes}</span>
                          <span className={styles.dot}>·</span>
                          <Eye size={11} /><span>{a.views}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "about" && (
            <div className={styles.mainCol}>
              <div className={styles.aboutGrid}>
                {/* Bio card */}
                <div className={styles.aboutCard}>
                  <h3 className={styles.aboutCardTitle}>About</h3>
                  <p className={styles.aboutBio}>{bio ?? "This writer hasn't added a bio yet."}</p>
                  <div className={styles.aboutMeta}>
                    <div className={styles.aboutMetaRow}>
                      <Calendar size={14} />
                      <span>Joined {format(new Date(createdAt), "MMMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                {achievements.length > 0 && (
                  <div className={styles.aboutCard}>
                    <h3 className={styles.aboutCardTitle}><Award size={15} /> Achievements</h3>
                    <div className={styles.achievements}>
                      {achievements.map(a => (
                        <div key={a.label} className={styles.achievement}>
                          <span className={styles.achievementEmoji}>{a.emoji}</span>
                          <div>
                            <p className={styles.achievementLabel}>{a.label}</p>
                            <p className={styles.achievementSub}>{a.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics */}
                {topics.length > 0 && (
                  <div className={styles.aboutCard}>
                    <h3 className={styles.aboutCardTitle}><Star size={15} /> Topics</h3>
                    <div className={styles.topicPills}>
                      {topics.map(t => (
                        <Link key={t} href={`/explore?q=${encodeURIComponent(t)}`} className={styles.topicPill}>
                          #{t}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
