"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PenLine, Search, Bell, BookOpen,
  ChevronDown, LogOut, User, LayoutDashboard,
  Settings, Feather, X
} from "lucide-react";
import { ThemePicker } from "@/components/layout/ThemePicker";

import styles from "./Navbar.module.css";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const menuRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close search on Escape
  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "WS";

  return (
    <header className={styles.header} role="banner">
      <a href="#main-content" className={styles.skipLink}>Skip to main content</a>

      <nav className={styles.nav} aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="WriteSpace Home">
          <Feather size={20} strokeWidth={2.2} />
          <span>WriteSpace</span>
        </Link>

        {/* Center links */}
        <div className={styles.navLinks}>
          <Link href="/explore"   className={styles.navLink}>Explore</Link>
          <Link href="/topics"    className={styles.navLink}>Topics</Link>
          <Link href="/community" className={styles.navLink}>Community</Link>
        </div>

        {/* Right actions */}
        <div className={styles.actions}>

          {/* Search */}
          {searchOpen ? (
            <div className={styles.searchExpanded} role="search">
              <Search size={15} className={styles.searchIcon} aria-hidden />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search articles, writers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={styles.searchInput}
                aria-label="Search"
              />
              <button className={styles.searchClose} onClick={closeSearch} aria-label="Close search">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              className={styles.iconBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              aria-expanded={false}
            >
              <Search size={18} />
            </button>
          )}

          {/* Theme picker */}
          <ThemePicker />


          {session ? (
            <>
              {/* Notifications */}
              <button className={styles.iconBtn} aria-label="Notifications">
                <Bell size={17} />
                <span className={styles.notifDot} aria-hidden />
              </button>

              {/* Write CTA */}
              <Link href="/editor/new" className="btn btn-primary btn-sm">
                <PenLine size={14} />
                Write
              </Link>

              {/* User menu */}
              <div className={styles.userMenu} ref={menuRef}>
                <button
                  className={styles.userBtn}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt={user.name ?? "User"} className={styles.userAvatar} />
                  ) : (
                    <span className={`avatar avatar-sm ${styles.userAvatar}`}>{initials}</span>
                  )}
                  <ChevronDown size={13} className={menuOpen ? styles.chevronOpen : styles.chevron} />
                </button>

                {menuOpen && (
                  <div className={styles.dropdown} role="menu">
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownName}>{user?.name ?? "Writer"}</p>
                      <p className={styles.dropdownEmail}>{user?.email}</p>
                    </div>
                    <div className={styles.dropdownDivider} />
                    {[
                      { href: `/profile/${user?.name?.toLowerCase().replace(/\s/g, "")}`, icon: User,          label: "Profile"       },
                      { href: "/dashboard",                                                 icon: LayoutDashboard, label: "Dashboard"     },
                      { href: "/reading-list",                                              icon: BookOpen,        label: "Reading List"  },
                      { href: "/settings",                                                  icon: Settings,        label: "Settings"      },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link key={label} href={href} className={styles.dropdownItem} role="menuitem" onClick={() => setMenuOpen(false)}>
                        <Icon size={14} /> {label}
                      </Link>
                    ))}
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                      onClick={() => signOut({ callbackUrl: "/" })}
                      role="menuitem"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link href="/auth/signup" className="btn btn-primary btn-sm">
                <PenLine size={14} />
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
