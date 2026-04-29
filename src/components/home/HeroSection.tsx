import Link from "next/link";
import { PenLine, ArrowRight, Users, TrendingUp, BookOpen, Award } from "lucide-react";
import styles from "./HeroSection.module.css";

const STATS = [
  { icon: PenLine,    value: "50K+",  label: "Articles Published" },
  { icon: Users,      value: "12K+",  label: "Active Writers"     },
  { icon: TrendingUp, value: "2.4M",  label: "Monthly Readers"    },
  { icon: Award,      value: "4.8★",  label: "Writer Rating"      },
];

export function HeroSection() {
  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.blobA} aria-hidden />
      <div className={styles.blobB} aria-hidden />

      <div className={styles.content}>
        <h1 className={styles.headline}>
          Where Great
          <br />
          <span className={styles.gradientWord}>Writing</span> Lives
        </h1>

        <p className={styles.subheadline}>
          A publishing platform for serious writers. Craft your ideas,
          build your audience, and connect with readers who care about depth.
        </p>

        <div className={styles.ctas}>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            <PenLine size={17} />
            Start Writing
          </Link>
          <Link href="/explore" className="btn btn-secondary btn-lg">
            Browse Articles
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className={styles.stats} role="list">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className={styles.stat} role="listitem">
              <div className={styles.statIcon} aria-hidden><Icon size={15} /></div>
              <div>
                <p className={styles.statValue}>{value}</p>
                <p className={styles.statLabel}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.illustration} aria-hidden>
        <HeroCard delay="0s"    tag="Technology" title="The Future of Writing Tools"         author="Sarah Chen"   accent="var(--brand-500)" />
        <HeroCard delay="0.1s"  tag="Design"     title="Building at Scale"                  author="Marcus Reid"  accent="#a78bfa"          />
        <HeroCard delay="0.2s"  tag="Science"    title="Quantum Computing, Explained"       author="Dr. A. Patel" accent="#22c55e"          />
      </div>
    </section>
  );
}

function HeroCard({ delay, tag, title, author, accent }: {
  delay: string; tag: string; title: string; author: string; accent: string;
}) {
  return (
    <div className={styles.heroCard} style={{ animationDelay: delay }}>
      <div className={styles.heroCardTag} style={{ color: accent, borderColor: accent + "40", background: accent + "12" }}>
        {tag}
      </div>
      <p className={styles.heroCardTitle}>{title}</p>
      <div className={styles.heroCardMeta}>
        <div className={styles.miniAvatar} style={{ background: accent }}>{author[0]}</div>
        <span>{author}</span>
      </div>
      <div className={styles.heroCardBar}>
        <div className={styles.heroCardBarFill} style={{ background: accent, width: "60%" }} />
      </div>
    </div>
  );
}
