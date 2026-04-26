import Link from "next/link";
import { Feather } from "lucide-react";
import styles from "./Footer.module.css";

const NAV_LINKS = [
  { label: "Explore",     href: "/explore"    },
  { label: "Topics",      href: "/topics"     },
  { label: "Community",   href: "/community"  },
  { label: "For Writers", href: "/auth/signup" },
];

export function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.inner}>
          {/* Brand */}
          <Link href="/" className={styles.logo}>
            <Feather size={16} />
            <span>WriteSpace</span>
          </Link>

          {/* Nav links — horizontal */}
          <nav className={styles.nav} aria-label="Footer navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className={styles.navLink}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className={styles.copy}>
            © {new Date().getFullYear()} WriteSpace
          </p>
        </div>
      </div>
    </footer>
  );
}
