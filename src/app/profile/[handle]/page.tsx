import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, TrendingUp, Users, Settings, Star, Award, Heart, Clock } from "lucide-react";
import styles from "./profile.module.css";
import { FollowButton } from "@/components/FollowButton";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

interface Props { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = await prisma.user.findUnique({ where: { handle }, select: { name: true, bio: true } });
  if (!user) return { title: "Writer Not Found" };
  return { title: `${user.name ?? handle} — Writer Profile`, description: user.bio ?? "" };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;

  const user = await prisma.user.findUnique({
    where: { handle },
    include: {
      articles: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { likes: true } } },
      },
      _count: {
        select: { followers: true, following: true },
      },
    },
  });

  if (!user) notFound();

  const color = "#348fff";

  const STATS = [
    { icon: FileText,   label: "Articles",   value: user.articles.length },
    { icon: Users,      label: "Followers",  value: user._count.followers.toLocaleString() },
    { icon: TrendingUp, label: "Following",  value: user._count.following },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.cover} style={{ background: `linear-gradient(135deg, ${color}25, ${color}08)` }}>
        <div className={styles.coverAccent} style={{ background: color }} />
      </div>

      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            {user.image ? (
              <img src={user.image} alt={user.name ?? handle} className={`avatar avatar-2xl ${styles.avatar}`} style={{ objectFit: "cover" }} />
            ) : (
              <div className={`avatar avatar-2xl ${styles.avatar}`} style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}>
                {(user.name ?? handle)[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.profileTop}>
              <div>
                <h1 className={styles.profileName}>{user.name ?? handle}</h1>
                <p className={styles.profileHandle}>@{user.handle}</p>
              </div>
              <div className={styles.profileActions}>
                <FollowButton handle={user.handle} initialFollowers={user._count.followers} />
                <Link href="/settings" className="btn btn-ghost btn-sm" aria-label="Settings">
                  <Settings size={16} />
                </Link>
              </div>
            </div>

            {user.bio && <p className={styles.profileBio}>{user.bio}</p>}

            <div className={styles.profileMeta}>
              <span>📅 Joined {format(new Date(user.createdAt), "MMMM yyyy")}</span>
            </div>

            <div className={styles.statsRow} role="list">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className={styles.stat} role="listitem">
                  <Icon size={14} />
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.tabs} role="tablist">
          {["Articles", "About"].map((tab, i) => (
            <button key={tab} className={`${styles.tab} ${i === 0 ? styles.tabActive : ""}`} role="tab" aria-selected={i === 0}>
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          <div className={styles.articleGrid}>
            {user.articles.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", opacity: 0.5 }}>
                <p>No published articles yet.</p>
              </div>
            ) : (
              user.articles.map((a) => {
                const tag = a.tags[0] ?? "General";
                const tagColor = "#348fff";
                return (
                  <Link key={a.id} href={`/article/${a.slug}`} className={styles.articleCard}>
                    <div className={styles.articleCardAccent} style={{ background: tagColor }} />
                    <div className={styles.articleCardBody}>
                      <span className={styles.articleTag} style={{ color: tagColor }}>{tag}</span>
                      <h3 className={styles.articleTitle}>{a.title}</h3>
                      <div className={styles.articleMeta}>
                        <span>{format(new Date(a.createdAt), "MMM d")}</span>
                        <span>·</span>
                        <Clock size={11} /><span>{a.readTime} min</span>
                        <span>·</span>
                        <Heart size={11} /><span>{a._count.likes}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><Award size={15} /> Achievements</h3>
              <div className={styles.achievements}>
                {user.articles.length >= 1  && <div className={styles.achievement}><span className={styles.achievementEmoji}>✍️</span><div><p className={styles.achievementLabel}>Published Writer</p><p className={styles.achievementSub}>{user.articles.length} articles</p></div></div>}
                {user._count.followers >= 10 && <div className={styles.achievement}><span className={styles.achievementEmoji}>⭐</span><div><p className={styles.achievementLabel}>Growing Audience</p><p className={styles.achievementSub}>{user._count.followers} followers</p></div></div>}
              </div>
            </div>
            {user.articles.flatMap(a => a.tags).filter(Boolean).length > 0 && (
              <div className={styles.sideCard}>
                <h3 className={styles.sideTitle}><Star size={15} /> Topics</h3>
                <div className={styles.topicPills}>
                  {[...new Set(user.articles.flatMap(a => a.tags))].slice(0, 6).map((t) => (
                    <Link key={t} href={`/topics/${t.toLowerCase().replace(/ /g, "-")}`} className={styles.topicPill}>
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
