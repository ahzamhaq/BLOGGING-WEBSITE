"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PenLine, Eye, Heart, TrendingUp, Users,
  FileText, Clock, ArrowUpRight, Sparkles,
  Loader2, BarChart2, BookOpen,
  Edit3, ExternalLink, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import styles from "./dashboard.module.css";

interface DayPoint { date: string; count: number }

interface DashboardData {
  totalArticles: number;
  totalLikes: number;
  totalViews: number;
  followers: number;
  avgReadTime: number;
  bookmarkCount: number;
  followerGrowth: DayPoint[];
  viewsByDay: DayPoint[];
  recentArticles: {
    id: string; slug: string; title: string;
    likes: number; comments: number; views: number; readTime: number; date: string;
  }[];
}

function Sparkline({ data, color = "var(--brand-500)" }: { data: DayPoint[]; color?: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className={styles.sparkline}>
      {data.map((d, idx) => (
        <div key={idx} className={styles.sparklineCol}>
          <div
            className={styles.sparklineBar}
            style={{
              height: `${Math.max(10, (d.count / max) * 100)}%`,
              background: color,
              opacity: 0.35 + (idx / data.length) * 0.65,
            }}
            title={`${d.date}: ${d.count}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then(r => r.json())
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={28} className={styles.spin} />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!session) redirect("/auth/signin");

  const name     = session.user?.name ?? "Writer";
  const handle   = session.user?.email?.split("@")[0] ?? "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const weekViews     = data?.viewsByDay.reduce((s, d) => s + d.count, 0) ?? 0;
  const weekFollowers = data?.followerGrowth.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <div className={styles.page}>

      {/* ── Welcome header ────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.welcome}>
          <div className={styles.welcomeAvatar}>
            {session.user?.image ? (
              <img src={session.user.image} alt={name} className={styles.welcomeAvatarImg} />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 className={styles.welcomeTitle}>Welcome back, {name.split(" ")[0]}</h1>
            <p className={styles.welcomeSub}>Here's how your writing is performing</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/profile/${handle}`} className="btn btn-ghost btn-sm">
            <BookOpen size={14} />View Profile
          </Link>
          <Link href="/editor/new" className="btn btn-primary btn-sm">
            <PenLine size={14} />New Article
          </Link>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconBlue}`}><Eye size={18} /></div>
            <span className={`${styles.kpiDelta} ${styles.kpiDeltaUp}`}>
              <ArrowUpRight size={11} />{weekViews} this week
            </span>
          </div>
          <p className={styles.kpiValue}>{(data?.totalViews ?? 0).toLocaleString()}</p>
          <p className={styles.kpiLabel}>Total Views</p>
          {data?.viewsByDay && <Sparkline data={data.viewsByDay} color="var(--brand-500)" />}
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}><Heart size={18} /></div>
            <span className={`${styles.kpiDelta} ${styles.kpiDeltaUp}`}>
              <ArrowUpRight size={11} />all articles
            </span>
          </div>
          <p className={styles.kpiValue}>{(data?.totalLikes ?? 0).toLocaleString()}</p>
          <p className={styles.kpiLabel}>Total Likes</p>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconPurple}`}><Users size={18} /></div>
            <span className={`${styles.kpiDelta} ${styles.kpiDeltaUp}`}>
              <ArrowUpRight size={11} />+{weekFollowers} this week
            </span>
          </div>
          <p className={styles.kpiValue}>{(data?.followers ?? 0).toLocaleString()}</p>
          <p className={styles.kpiLabel}>Followers</p>
          {data?.followerGrowth && <Sparkline data={data.followerGrowth} color="#a78bfa" />}
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}><FileText size={18} /></div>
          </div>
          <p className={styles.kpiValue}>{data?.totalArticles ?? 0}</p>
          <p className={styles.kpiLabel}>Published Articles</p>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconTeal}`}><Clock size={18} /></div>
          </div>
          <p className={styles.kpiValue}>{data?.avgReadTime ?? 0}<span className={styles.kpiUnit}> min</span></p>
          <p className={styles.kpiLabel}>Avg Read Time</p>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCardAccent}`}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconBrand}`}><Sparkles size={18} /></div>
          </div>
          <p className={styles.kpiValue}>{data?.bookmarkCount ?? 0}</p>
          <p className={styles.kpiLabel}>Bookmarks Received</p>
        </div>
      </div>

      {/* ── Main content grid ──────────────────────────────────── */}
      <div className={styles.grid}>

        {/* Articles section */}
        <section className={styles.articlesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><FileText size={16} />Your Articles</h2>
            <Link href="/drafts?tab=published" className={styles.viewAllBtn}>View all →</Link>
          </div>

          {!data || data.recentArticles.length === 0 ? (
            <div className={styles.emptyArticles}>
              <Edit3 size={36} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No published articles yet</p>
              <p className={styles.emptyHint}>Share your ideas with the world</p>
              <Link href="/editor/new" className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>
                <PenLine size={14} />Write your first article
              </Link>
            </div>
          ) : (
            <div className={styles.articleTable}>
              <div className={styles.tableHead}>
                <span>Article</span>
                <span>Views</span>
                <span>Likes</span>
                <span>Date</span>
              </div>
              {data.recentArticles.map(a => (
                <div key={a.id} className={styles.tableRow}>
                  <div className={styles.tableTitleCell}>
                    <Link href={`/article/${a.slug}`} className={styles.tableTitle}>{a.title}</Link>
                    <div className={styles.tableSubMeta}>
                      <Clock size={11} />{a.readTime} min
                      <span>·</span>
                      <MessageSquare size={11} />{a.comments}
                    </div>
                  </div>
                  <span className={styles.tableCell}><Eye size={12} />{a.views.toLocaleString()}</span>
                  <span className={styles.tableCell}><Heart size={12} />{a.likes}</span>
                  <span className={styles.tableDate}>{format(new Date(a.date), "MMM d")}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Side panels */}
        <aside className={styles.sidePanels}>

          {/* Follower growth */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <TrendingUp size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Follower Growth</h3>
              <span className={styles.badge}>7 days</span>
            </div>
            <Sparkline data={data?.followerGrowth ?? Array.from({length:7},()=>({date:"",count:0}))} color="#a78bfa" />
            <p className={styles.panelStat}>
              <span className={weekFollowers > 0 ? styles.statGreen : styles.statMuted}>
                +{weekFollowers} this week
              </span>
              <span className={styles.statMuted}>{data?.followers ?? 0} total</span>
            </p>
          </div>

          {/* Views chart */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <BarChart2 size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Article Views</h3>
              <span className={styles.badge}>7 days</span>
            </div>
            <Sparkline data={data?.viewsByDay ?? Array.from({length:7},()=>({date:"",count:0}))} color="var(--brand-500)" />
            <p className={styles.panelStat}>
              <span className={weekViews > 0 ? styles.statBlue : styles.statMuted}>
                {weekViews} this week
              </span>
            </p>
          </div>

          {/* Quick links */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Sparkles size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Quick Actions</h3>
            </div>
            <div className={styles.quickLinks}>
              <Link href="/editor/new"       className={styles.quickLink}><PenLine size={14} />New Article</Link>
              <Link href="/drafts"            className={styles.quickLink}><FileText size={14} />My Drafts</Link>
              <Link href="/settings"          className={styles.quickLink}><Edit3 size={14} />Edit Profile</Link>
              <Link href={`/profile/${handle}`} className={styles.quickLink}><ExternalLink size={14} />View Profile</Link>
            </div>
          </div>

          {/* Monetization teaser */}
          <div className={`${styles.panel} ${styles.monetizePanel}`}>
            <div className={styles.panelHeader}>
              <Sparkles size={15} style={{ color: "#a78bfa" }} />
              <h3 className={styles.panelTitle}>Monetization</h3>
              <span className={styles.comingSoon}>Phase 4</span>
            </div>
            <p className={styles.panelText}>Tip jar, pay-per-article, and writer subscriptions coming soon.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
