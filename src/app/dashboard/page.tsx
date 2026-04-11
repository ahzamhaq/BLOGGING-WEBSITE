"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  PenLine, Eye, Heart, TrendingUp, Users,
  BarChart2, FileText, Clock, ArrowUpRight,
  Sparkles, DollarSign
} from "lucide-react";
import styles from "./dashboard.module.css";

const STATS = [
  { icon: Eye,        label: "Total Views",     value: "24,891", change: "+12%",  positive: true  },
  { icon: Heart,      label: "Total Likes",      value: "1,847",  change: "+8%",   positive: true  },
  { icon: Users,      label: "Followers",        value: "342",    change: "+23",   positive: true  },
  { icon: Clock,      label: "Avg Read Time",    value: "4.2 min",change: "+0.3",  positive: true  },
  { icon: FileText,   label: "Published",        value: "12",     change: "2 this month", positive: true },
  { icon: DollarSign, label: "Revenue (locked)", value: "$0",     change: "Phase 4", positive: false },
];

const RECENT_ARTICLES = [
  { slug: "future-ai-writing",    title: "The Future of AI Writing Tools",        views: 4821, likes: 312, date: "Apr 10" },
  { slug: "stoicism-productivity",title: "What Stoics Teach Us About Productivity",views: 3104, likes: 247, date: "Apr 8"  },
  { slug: "design-systems-scale", title: "Design Systems at Scale",               views: 2890, likes: 198, date: "Apr 9"  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  const name = session.user?.name ?? "Writer";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.welcome}>
          <div className="avatar avatar-lg" style={{ background: "linear-gradient(135deg, #1a6ef5, #348fff)" }}>
            {session.user?.image
              ? <img src={session.user.image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : initials
            }
          </div>
          <div>
            <h1 className={styles.welcomeTitle}>Welcome back, {name.split(" ")[0]} 👋</h1>
            <p className={styles.welcomeSub}>Here&apos;s how your writing is performing</p>
          </div>
        </div>
        <Link href="/editor/new" className="btn btn-primary">
          <PenLine size={16} />
          New Article
        </Link>
      </div>

      {/* Stats grid */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className={styles.sectionTitle}>
          <BarChart2 size={18} />
          Overview
        </h2>
        <div className={styles.statsGrid} role="list">
          {STATS.map(({ icon: Icon, label, value, change, positive }) => (
            <div key={label} className={styles.statCard} role="listitem">
              <div className={styles.statIcon}><Icon size={18} /></div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{label}</p>
                <p className={styles.statValue}>{value}</p>
              </div>
              <span className={`${styles.statChange} ${positive ? styles.statChangeUp : styles.statChangeLocked}`}>
                {positive ? <ArrowUpRight size={12} /> : <Sparkles size={12} />}
                {change}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.grid}>
        {/* Recent articles */}
        <section aria-labelledby="articles-heading">
          <div className={styles.sectionHeader}>
            <h2 id="articles-heading" className={styles.sectionTitle}>
              <FileText size={18} />
              Your Articles
            </h2>
            <Link href="/profile/me" className="btn btn-ghost btn-sm">View all →</Link>
          </div>

          <div className={styles.articleTable}>
            <div className={styles.tableHeader}>
              <span>Title</span>
              <span>Views</span>
              <span>Likes</span>
              <span>Date</span>
            </div>
            {RECENT_ARTICLES.map((a) => (
              <div key={a.slug} className={styles.tableRow}>
                <Link href={`/article/${a.slug}`} className={styles.tableTitle}>
                  {a.title}
                </Link>
                <span className={styles.tableCell}>
                  <Eye size={13} />{a.views.toLocaleString()}
                </span>
                <span className={styles.tableCell}>
                  <Heart size={13} />{a.likes}
                </span>
                <span className={styles.tableDate}>{a.date}</span>
              </div>
            ))}
          </div>

          <Link href="/editor/new" className={`btn btn-secondary ${styles.newArticleBtn}`}>
            <PenLine size={15} />
            Write New Article
          </Link>
        </section>

        {/* Side panel */}
        <aside className={styles.sidePanels}>
          {/* Quick write */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Sparkles size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Quick Start</h3>
            </div>
            <p className={styles.panelText}>
              Ready to write? Start a new article and use the AI assistant to get ideas.
            </p>
            <Link href="/editor/new" className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              <PenLine size={14} />
              Open Editor
            </Link>
          </div>

          {/* Growth */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <TrendingUp size={15} className={styles.panelIcon} />
              <h3 className={styles.panelTitle}>Audience Growth</h3>
            </div>
            <div className={styles.growthChart} aria-label="Follower growth chart (placeholder)">
              {[40, 55, 48, 70, 65, 85, 90].map((h, i) => (
                <div key={i} className={styles.growthBar} style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className={styles.growthLabel}>+23 followers this week</p>
          </div>

          {/* Monetization teaser */}
          <div className={`${styles.panel} ${styles.monetizePanel}`}>
            <div className={styles.panelHeader}>
              <DollarSign size={15} className={styles.monetizeIcon} />
              <h3 className={styles.panelTitle}>Monetization</h3>
              <span className={styles.comingSoon}>Phase 4</span>
            </div>
            <p className={styles.panelText}>
              Tip jar, pay-per-article, and writer subscriptions are coming after the core platform is live.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
