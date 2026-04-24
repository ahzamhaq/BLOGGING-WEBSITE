"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PenLine, Eye, Heart, TrendingUp, Users,
  BarChart2, FileText, Clock, ArrowUpRight,
  Sparkles, DollarSign, Loader2, MessageSquare
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

function MiniChart({ data, color = "var(--brand-500)" }: { data: DayPoint[]; color?: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const days = ["S","M","T","W","T","F","S"];
  return (
    <div className={styles.miniChart}>
      {data.map((d, i) => (
        <div key={i} className={styles.miniChartCol}>
          <div
            className={styles.miniChartBar}
            style={{
              height: `${Math.max(8, (d.count / max) * 100)}%`,
              background: color,
              opacity: i === data.length - 1 ? 1 : 0.45 + (i / data.length) * 0.45,
            }}
            title={`${d.date}: ${d.count}`}
          />
          <span className={styles.miniChartLabel}>{days[i]}</span>
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
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (!session) redirect("/auth/signin");

  const name = session.user?.name ?? "Writer";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const weekFollowers = data?.followerGrowth.reduce((s, d) => s + d.count, 0) ?? 0;

  const STATS = [
    { icon: FileText,   label: "Published",      value: String(data?.totalArticles ?? 0),        sub: "articles",           positive: true  },
    { icon: Eye,        label: "Total Views",     value: (data?.totalViews ?? 0).toLocaleString(), sub: "page views",        positive: true  },
    { icon: Heart,      label: "Total Likes",     value: (data?.totalLikes ?? 0).toLocaleString(), sub: "across all posts",  positive: true  },
    { icon: Users,      label: "Followers",       value: String(data?.followers ?? 0),            sub: "writers follow you", positive: true  },
    { icon: Clock,      label: "Avg Read Time",   value: `${data?.avgReadTime ?? 0} min`,         sub: "per session",        positive: true  },
    { icon: DollarSign, label: "Revenue",         value: "$0",                                    sub: "Phase 4",            positive: false },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.welcome}>
          <div className="avatar avatar-lg" style={{ background: "linear-gradient(135deg, #1a6ef5, #348fff)" }}>
            {session.user?.image
              ? <img src={session.user.image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : initials}
          </div>
          <div>
            <h1 className={styles.welcomeTitle}>Welcome back, {name.split(" ")[0]} 👋</h1>
            <p className={styles.welcomeSub}>Here&apos;s how your writing is performing</p>
          </div>
        </div>
        <Link href="/editor/new" className="btn btn-primary">
          <PenLine size={16} />New Article
        </Link>
      </div>

      {/* Stats grid */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className={styles.sectionTitle}><BarChart2 size={18} />Overview</h2>
        <div className={styles.statsGrid} role="list">
          {STATS.map(({ icon: Icon, label, value, sub, positive }) => (
            <div key={label} className={styles.statCard} role="listitem">
              <div className={styles.statIcon}><Icon size={18} /></div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{label}</p>
                <p className={styles.statValue}>{value}</p>
              </div>
              <span className={`${styles.statChange} ${positive ? styles.statChangeUp : styles.statChangeLocked}`}>
                {positive ? <ArrowUpRight size={12} /> : <Sparkles size={12} />}
                {sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.grid}>
        {/* Articles table */}
        <section aria-labelledby="articles-heading">
          <div className={styles.sectionHeader}>
            <h2 id="articles-heading" className={styles.sectionTitle}><FileText size={18} />Your Articles</h2>
            <Link href={`/drafts`} className="btn btn-ghost btn-sm">View all →</Link>
          </div>

          {!data || data.recentArticles.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5 }}>
              <p>No published articles yet.</p>
              <Link href="/editor/new" className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>Write your first article</Link>
            </div>
          ) : (
            <div className={styles.articleTable}>
              <div className={styles.tableHeader}>
                <span>Title</span><span>Views</span><span>Likes</span><span>Date</span>
              </div>
              {data.recentArticles.map((a) => (
                <div key={a.id} className={styles.tableRow}>
                  <Link href={`/article/${a.slug}`} className={styles.tableTitle}>{a.title}</Link>
                  <span className={styles.tableCell}><Eye size={13} />{a.views.toLocaleString()}</span>
                  <span className={styles.tableCell}><Heart size={13} />{a.likes}</span>
                  <span className={styles.tableDate}>{format(new Date(a.date), "MMM d")}</span>
                </div>
              ))}
            </div>
          )}

          <Link href="/editor/new" className={`btn btn-secondary ${styles.newArticleBtn}`}>
            <PenLine size={15} />Write New Article
          </Link>
        </section>

        <aside className={styles.sidePanels}>
          {/* Follower Growth — real 7-day chart */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <TrendingUp size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Follower Growth</h3>
              <span className={styles.chartBadge}>Last 7 days</span>
            </div>
            {data?.followerGrowth && data.followerGrowth.some(d => d.count > 0) ? (
              <>
                <MiniChart data={data.followerGrowth} color="var(--brand-500)" />
                <p className={styles.growthLabel}>
                  +{weekFollowers} new follower{weekFollowers !== 1 ? "s" : ""} this week · {data.followers} total
                </p>
              </>
            ) : (
              <>
                <MiniChart data={Array.from({ length: 7 }, (_, i) => ({ date: "", count: 0 }))} />
                <p className={styles.growthLabel} style={{ color: "var(--text-muted)" }}>
                  No new followers yet · {data?.followers ?? 0} total
                </p>
              </>
            )}
          </div>

          {/* Views Chart — real 7-day data */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Eye size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Article Views</h3>
              <span className={styles.chartBadge}>Last 7 days</span>
            </div>
            {data?.viewsByDay && (
              <>
                <MiniChart data={data.viewsByDay} color="#22c55e" />
                <p className={styles.growthLabel} style={{ color: "#4ade80" }}>
                  {data.viewsByDay.reduce((s, d) => s + d.count, 0)} views this week
                </p>
              </>
            )}
          </div>

          {/* Read time insight */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Clock size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Read Time Analytics</h3>
            </div>
            <div className={styles.readTimeStats}>
              <div className={styles.readTimeStat}>
                <span className={styles.readTimeValue}>{data?.avgReadTime ?? 0} min</span>
                <span className={styles.readTimeLabel}>Avg session</span>
              </div>
              <div className={styles.readTimeStat}>
                <span className={styles.readTimeValue}>{data?.totalViews ?? 0}</span>
                <span className={styles.readTimeLabel}>Total reads</span>
              </div>
              <div className={styles.readTimeStat}>
                <span className={styles.readTimeValue}>{data?.totalArticles ?? 0}</span>
                <span className={styles.readTimeLabel}>Articles</span>
              </div>
            </div>
            <p className={styles.panelText} style={{ marginTop: 0 }}>
              Tracked from real reading sessions. Updates as readers visit your articles.
            </p>
          </div>

          {/* Quick start */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Sparkles size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Quick Start</h3>
            </div>
            <p className={styles.panelText}>Start a new article and use AI to get ideas.</p>
            <Link href="/editor/new" className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              <PenLine size={14} />Open Editor
            </Link>
          </div>

          {/* Revenue — locked */}
          <div className={`${styles.panel} ${styles.monetizePanel}`}>
            <div className={styles.panelHeader}>
              <DollarSign size={15} className={styles.monetizeIcon} />
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
