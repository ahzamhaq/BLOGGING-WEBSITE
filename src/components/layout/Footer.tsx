import Link from "next/link";
import { Feather, Twitter, Github, Rss } from "lucide-react";
import styles from "./Footer.module.css";

const LINKS = {
  Product:   [
    { label: "Explore",     href: "/explore"     },
    { label: "Topics",      href: "/topics"      },
    { label: "Community",   href: "/community"   },
    { label: "For Writers", href: "/auth/signup"  },
  ],
  Company: [
    { label: "About",       href: "/about"       },
    { label: "Blog",        href: "/blog"        },
    { label: "Careers",     href: "/careers"     },
    { label: "Press",       href: "/press"       },
  ],
  Legal: [
    { label: "Privacy",     href: "/privacy"     },
    { label: "Terms",       href: "/terms"       },
    { label: "Cookie Policy",href: "/cookies"   },
  ],
};

export function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <Feather size={18} />
              <span>WriteSpace</span>
            </Link>
            <p className={styles.tagline}>
              Where great writing lives.
            </p>
            <div className={styles.socials}>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className={styles.socialLink}>
                <Twitter size={16} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={styles.socialLink}>
                <Github size={16} />
              </a>
              <a href="/rss" aria-label="RSS Feed" className={styles.socialLink}>
                <Rss size={16} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group} className={styles.linkGroup}>
              <p className={styles.linkGroupTitle}>{group}</p>
              {links.map(({ label, href }) => (
                <Link key={label} href={href} className={styles.footerLink}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} WriteSpace. All rights reserved.
          </p>
          <p className={styles.madeWith}>
            Built with ♥ for writers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
