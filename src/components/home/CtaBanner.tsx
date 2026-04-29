import Link from "next/link";
import { PenLine, BarChart2, Users, ShieldCheck } from "lucide-react";
import styles from "./CtaBanner.module.css";

const FEATURES = [
  { icon: PenLine,    label: "Distraction-free editor" },
  { icon: BarChart2,  label: "Deep analytics"          },
  { icon: Users,      label: "Built-in audience"       },
  { icon: ShieldCheck,label: "You own your content"    },
];

export function CtaBanner() {
  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <div className={styles.blobLeft}  aria-hidden />
      <div className={styles.blobRight} aria-hidden />

      <div className={styles.container}>
        <h2 id="cta-heading" className={styles.title}>
          Your writing deserves
          <br />
          a <span className="gradient-text">better home</span>
        </h2>

        <p className={styles.subtitle}>
          WriteSpace gives serious writers the tools they need to publish,
          grow, and connect with an audience that values their work.
        </p>

        <div className={styles.features}>
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className={styles.feature}>
              <Icon size={14} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.ctas}>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            <PenLine size={17} />
            Create Your Account
          </Link>
          <Link href="/explore" className="btn btn-secondary btn-lg">
            Explore Platform
          </Link>
        </div>
      </div>
    </section>
  );
}
