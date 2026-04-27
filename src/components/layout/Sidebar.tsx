"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  Feather, Home, Compass, Users, Bookmark, FileText, Globe,
  PenLine, Search, Menu,
  LayoutDashboard, User as UserIcon, Settings, LogOut, ChevronUp,
  Code2, Palette, Rocket, Pen, Plus
} from "lucide-react";
import { ThemePicker } from "@/components/layout/ThemePicker";
import { NotificationsDropdown } from "@/components/layout/NotificationsDropdown";
import styles from "./Sidebar.module.css";

// These slugs match the seeded communities in the DB
const COMMUNITIES = [
  { slug: "tech",     name: "Tech & Code",   icon: Code2   },
  { slug: "design",   name: "Design & UX",   icon: Palette },
  { slug: "startups", name: "Startups",       icon: Rocket  },
  { slug: "writing",  name: "Writing Craft",  icon: Pen     },
];

interface NavLink {
  href: string;
  label: string;
  icon: typeof Home;
  count?: number;
}

const MAIN_LINKS: NavLink[] = [
  { href: "/",             label: "Home",         icon: Home      },
  { href: "/explore",      label: "Discover",     icon: Compass   },
  { href: "/community",    label: "Rooms",        icon: Users     },
  { href: "/reading-list", label: "Bookmarks",    icon: Bookmark  },
  { href: "/drafts",       label: "Drafts",       icon: FileText  },
  { href: "/drafts?tab=published", label: "Publications", icon: Globe },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [search,     setSearch]     = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close the mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function isActive(href: string) {
    const hrefPath = href.split("?")[0];
    const hrefQuery = href.includes("?") ? href.split("?")[1] : null;
    if (hrefPath === "/") return pathname === "/" && !hrefQuery;
    // For links with query params (like Publications), match both path and query
    if (hrefQuery) {
      return pathname === hrefPath && typeof window !== "undefined" && window.location.search.includes(hrefQuery);
    }
    // For /drafts, only highlight if NOT on the published tab
    if (hrefPath === "/drafts") {
      return pathname === "/drafts" && (typeof window === "undefined" || !window.location.search.includes("tab=published"));
    }
    return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/explore?q=${encodeURIComponent(search.trim())}`);
    }
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "WS";
  const handle = user?.email?.split("@")[0];

  return (
    <>
      {/* Backdrop (mobile only) */}
      {mobileOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.open : ""}`}
        aria-label="Main navigation"
      >
        <Link href="/" className={styles.logo}>
          <Feather size={20} strokeWidth={2.2} />
          <span>WriteSpace</span>
        </Link>

        <nav className={styles.nav}>
          {MAIN_LINKS.map(({ href, label, icon: Icon, count }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive(href) ? styles.navItemActive : ""}`}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon size={16} />
              {label}
              {typeof count === "number" && <span className={styles.navCount}>{count}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sectionLabel}>Communities</div>
        <div className={styles.communitiesList}>
          {COMMUNITIES.map(({ slug, name, icon: Icon }) => (
            <Link key={slug} href={`/community/${slug}`} className={styles.communityItem}>
              <Icon size={14} strokeWidth={1.75} />
              <span className={styles.communityName}>{name}</span>
            </Link>
          ))}
          <Link href="/community" className={styles.communityItem}>
            <Plus size={14} strokeWidth={1.75} />
            <span className={styles.communityName}>Explore more</span>
          </Link>
        </div>

        {/* Footer: write CTA + user */}
        <div className={styles.footer}>
          {user ? (
            <>
              <Link href="/editor/new" className={styles.writeBtn}>
                <PenLine size={15} />
                Write a story
              </Link>
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  className={styles.userRow}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <span className="avatar avatar-sm">{initials}</span>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name ?? "Writer"}</div>
                    <div className={styles.userHandle}>@{handle ?? "you"}</div>
                  </div>
                  <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />
                </button>
                {menuOpen && (
                  <div className={styles.userMenu} role="menu">
                    <Link href={`/profile/${handle}`} className={styles.userMenuItem} role="menuitem">
                      <UserIcon size={14} /> Profile
                    </Link>
                    <Link href="/dashboard" className={styles.userMenuItem} role="menuitem">
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <Link href="/settings" className={styles.userMenuItem} role="menuitem">
                      <Settings size={14} /> Settings
                    </Link>
                    <div className={styles.userMenuDivider} />
                    <button
                      className={`${styles.userMenuItem} ${styles.userMenuDanger}`}
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.guestActions}>
              <Link href="/auth/signup" className={styles.writeBtn}>
                <PenLine size={15} />
                Get Started
              </Link>
              <Link href="/auth/signin" className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Shell wrapping the entire right column */}
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <button
            className={styles.mobileOpen}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className={styles.topSearch} role="search">
            <Search size={15} />
            <input
              type="search"
              className={styles.topSearchInput}
              placeholder="Search articles, writers, topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKey}
              aria-label="Search"
            />
          </div>

          <div className={styles.topActions}>
            <ThemePicker />
            {session && <NotificationsDropdown />}
          </div>
        </header>

        <div className={styles.shellInner}>{children}</div>
      </div>
    </>
  );
}
