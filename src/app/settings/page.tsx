"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useTheme, THEMES } from "@/components/layout/ThemeProvider";
import {
  User, Bell, Lock, Palette,
  LogOut, Check, Save, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./settings.module.css";

type Section = "profile" | "appearance" | "notifications" | "security";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<Section>("appearance");
  const [displayName, setDisplayName] = useState(session?.user?.name ?? "");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  const NAV: { id: Section; icon: typeof User; label: string }[] = [
    { id: "profile",       icon: User,    label: "Profile"       },
    { id: "appearance",    icon: Palette, label: "Appearance"    },
    { id: "notifications", icon: Bell,    label: "Notifications" },
    { id: "security",      icon: Lock,    label: "Security"      },
  ];

  function handleSave() {
    toast.success("Settings saved!");
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Settings</h1>

        <div className={styles.layout}>
          {/* Sidebar nav */}
          <nav className={styles.sidenav} aria-label="Settings sections">
            {NAV.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`${styles.navItem} ${activeSection === id ? styles.navItemActive : ""}`}
                onClick={() => setActiveSection(id)}
                aria-current={activeSection === id ? "page" : undefined}
              >
                <Icon size={16} />
                {label}
                <ChevronRight size={14} className={styles.navChevron} />
              </button>
            ))}
            <div className={styles.navDivider} />
            <button
              className={`${styles.navItem} ${styles.navItemDanger}`}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </nav>

          {/* Content panels */}
          <div className={styles.panel}>

            {/* ── Profile ── */}
            {activeSection === "profile" && (
              <section>
                <h2 className={styles.sectionTitle}>Profile</h2>
                <p className={styles.sectionDesc}>This information is public on your writer profile.</p>

                <div className={styles.avatarRow}>
                  <div className="avatar avatar-xl" style={{ background: "var(--brand-500)", fontSize: "1.5rem" }}>
                    {session?.user?.name?.[0] ?? "W"}
                  </div>
                  <div>
                    <button className="btn btn-secondary btn-sm">Change photo</button>
                    <p className={styles.avatarHint}>JPG or PNG. Max 2MB.</p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="s-name">Display name</label>
                    <input id="s-name" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="s-handle">Username</label>
                    <input id="s-handle" className="input" value={session?.user?.email?.split("@")[0] ?? ""} readOnly placeholder="username" />
                  </div>
                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor="s-bio">Bio</label>
                    <textarea id="s-bio" className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell readers about yourself…" style={{ resize: "vertical" }} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="s-website">Website</label>
                    <input id="s-website" className="input" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="s-location">Location</label>
                    <input id="s-location" className="input" placeholder="City, Country" />
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: "1.5rem" }}>
                  <Save size={15} /> Save Changes
                </button>
              </section>
            )}

            {/* ── Appearance ── */}
            {activeSection === "appearance" && (
              <section>
                <h2 className={styles.sectionTitle}>Appearance</h2>
                <p className={styles.sectionDesc}>Customize how WriteSpace looks and feels for you.</p>

                {/* Theme */}
                <div className={styles.settingGroup}>
                  <h3 className={styles.groupTitle}>Reading Theme</h3>
                  <div className={styles.themeGrid}>
                    {THEMES.map(({ id, label, bg, accent: accentColor }) => (
                      <button
                        key={id}
                        className={`${styles.themeCard} ${theme === id ? styles.themeCardActive : ""}`}
                        onClick={() => setTheme(id)}
                        aria-pressed={theme === id}
                      >
                        <div className={styles.themePreview} style={{ background: bg, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "4px" }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: accentColor }} />
                        </div>
                        <div className={styles.themeLabel}>
                          <Palette size={13} />
                          {label}
                          {theme === id && <Check size={12} className={styles.themeCheck} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div className={styles.settingGroup}>
                  <h3 className={styles.groupTitle}>Colors &amp; Accent</h3>
                  <p className={styles.groupDesc}>
                    Each theme comes with its own color palette. Use the <strong>Theme Picker</strong> in the navigation bar to customize accent colors — including a fully custom color builder.
                  </p>
                </div>
              </section>
            )}

            {/* ── Notifications ── */}
            {activeSection === "notifications" && (
              <section>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                <p className={styles.sectionDesc}>Choose what you want to be notified about.</p>
                <div className={styles.toggleList}>
                  {[
                    { label: "New followers",         desc: "When someone follows your profile"          },
                    { label: "Article comments",      desc: "When someone comments on your article"      },
                    { label: "Article likes",         desc: "When your article gets liked"               },
                    { label: "Weekly digest",         desc: "A curated digest of trending articles"      },
                    { label: "Community mentions",    desc: "When someone mentions you in a room"        },
                    { label: "New articles from following", desc: "When writers you follow publish"      },
                  ].map(({ label, desc }, i) => (
                    <div key={label} className={styles.toggleItem}>
                      <div>
                        <p className={styles.toggleLabel}>{label}</p>
                        <p className={styles.toggleDesc}>{desc}</p>
                      </div>
                      <label className={styles.toggle}>
                        <input type="checkbox" defaultChecked={i < 4} className={styles.toggleInput} />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: "1.5rem" }}>
                  <Save size={15} /> Save Preferences
                </button>
              </section>
            )}

            {/* ── Security ── */}
            {activeSection === "security" && (
              <section>
                <h2 className={styles.sectionTitle}>Security</h2>
                <p className={styles.sectionDesc}>Manage your account security.</p>

                <div className={styles.securitySection}>
                  <h3 className={styles.groupTitle}>Change Password</h3>
                  <div className={styles.formGrid}>
                    <div className={`${styles.field} ${styles.fieldFull}`}>
                      <label className={styles.label} htmlFor="s-current-pw">Current password</label>
                      <input id="s-current-pw" type="password" className="input" placeholder="••••••••" />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="s-new-pw">New password</label>
                      <input id="s-new-pw" type="password" className="input" placeholder="••••••••" />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="s-confirm-pw">Confirm new password</label>
                      <input id="s-confirm-pw" type="password" className="input" placeholder="••••••••" />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => toast.success("Password updated!")} style={{ marginTop: "1rem" }}>
                    Update Password
                  </button>
                </div>

                <div className={`${styles.securitySection} ${styles.dangerZone}`}>
                  <h3 className={styles.dangerTitle}>Danger Zone</h3>
                  <p className={styles.groupDesc}>These actions are permanent and cannot be undone.</p>
                  <button className="btn btn-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--error-400)", border: "1px solid rgba(239,68,68,0.2)" }}
                    onClick={() => toast.error("Account deletion requires email confirmation.")}>
                    Delete Account
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
