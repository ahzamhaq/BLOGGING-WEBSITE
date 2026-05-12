"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useTheme, THEMES } from "@/components/layout/ThemeProvider";
import {
  User, Bell, Lock, Palette,
  LogOut, Check, Save, ChevronRight,
  Camera, Loader2, AtSign, Eye, EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./settings.module.css";

type Section = "profile" | "appearance" | "notifications" | "security";

interface ProfileData {
  name: string | null;
  handle: string;
  bio: string | null;
  email: string;
  image: string | null;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle]           = useState("");
  const [bio, setBio]                 = useState("");
  const [avatar, setAvatar]           = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Security fields
  const [currentPw, setCurrentPw]     = useState("");
  const [newPw, setNewPw]             = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [savingPw, setSavingPw]       = useState(false);

  const NAV: { id: Section; icon: typeof User; label: string }[] = [
    { id: "profile",       icon: User,    label: "Profile"       },
    { id: "appearance",    icon: Palette, label: "Appearance"    },
    { id: "notifications", icon: Bell,    label: "Notifications" },
    { id: "security",      icon: Lock,    label: "Security"      },
  ];

  // Load profile on mount
  useEffect(() => {
    fetch("/api/profile/update")
      .then(r => r.ok ? r.json() : null)
      .then((data: ProfileData | null) => {
        if (!data) return;
        setProfile(data);
        setDisplayName(data.name ?? "");
        setHandle(data.handle ?? "");
        setBio(data.bio ?? "");
        setAvatar(data.image ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { toast.error("Display name cannot be empty"); return; }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(handle)) {
      toast.error("Handle must be 3–30 characters: letters, numbers, underscores");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, handle, bio, ...(avatar !== profile?.image ? { image: avatar } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
      await updateSession({ name: data.name });
      toast.success("Profile updated!");
      setProfile(prev => prev ? { ...prev, ...data } : data);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { toast.error("Fill in all password fields"); return; }
    if (newPw !== confirmPw) { toast.error("New passwords don't match"); return; }
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update password"); return; }
      toast.success("Password updated!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSavingPw(false);
    }
  };

  const initials = (displayName || session?.user?.name || "W").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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

                {loadingProfile ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                    <Loader2 size={24} style={{ animation: "spin 1s linear infinite", opacity: 0.5 }} />
                  </div>
                ) : (
                  <>
                    {/* Avatar */}
                    <div className={styles.avatarRow}>
                      <div className={styles.avatarWrapper}>
                        {avatar ? (
                          <img src={avatar} alt={displayName} className={styles.avatarImg} />
                        ) : (
                          <div className="avatar avatar-xl" style={{ background: "var(--brand-400)", fontSize: "1.4rem" }}>
                            {initials}
                          </div>
                        )}
                        <button
                          className={styles.avatarOverlay}
                          onClick={() => fileInputRef.current?.click()}
                          type="button"
                          aria-label="Change avatar"
                        >
                          <Camera size={16} />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleAvatarChange}
                        />
                      </div>
                      <div>
                        <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} type="button">
                          Change photo
                        </button>
                        {avatar && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setAvatar(null)}
                            type="button"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            Remove
                          </button>
                        )}
                        <p className={styles.avatarHint}>JPG or PNG. Max 2 MB.</p>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="s-name">Display name</label>
                        <input
                          id="s-name"
                          className="input"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          maxLength={60}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="s-handle">
                          Username <AtSign size={12} style={{ display: "inline", opacity: 0.6 }} />
                        </label>
                        <input
                          id="s-handle"
                          className="input"
                          value={handle}
                          onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          placeholder="yourhandle"
                          maxLength={30}
                        />
                        <span className={styles.fieldHint}>3–30 chars, letters/numbers/underscores</span>
                      </div>
                      <div className={`${styles.field} ${styles.fieldFull}`}>
                        <label className={styles.label} htmlFor="s-bio">
                          Bio
                          <span className={styles.charCount}>{bio.length}/160</span>
                        </label>
                        <textarea
                          id="s-bio"
                          className="input"
                          rows={3}
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          placeholder="Tell readers about yourself…"
                          maxLength={160}
                          style={{ resize: "vertical" }}
                        />
                      </div>
                      <div className={`${styles.field} ${styles.fieldFull}`}>
                        <label className={styles.label}>Email</label>
                        <input
                          className="input"
                          value={profile?.email ?? session?.user?.email ?? ""}
                          readOnly
                          style={{ opacity: 0.6, cursor: "not-allowed" }}
                        />
                        <span className={styles.fieldHint}>Email cannot be changed here.</span>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      style={{ marginTop: "1.5rem" }}
                    >
                      {savingProfile ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
                      {savingProfile ? "Saving…" : "Save Changes"}
                    </button>
                  </>
                )}
              </section>
            )}

            {/* ── Appearance ── */}
            {activeSection === "appearance" && (
              <section>
                <h2 className={styles.sectionTitle}>Appearance</h2>
                <p className={styles.sectionDesc}>Customize how WriteSpace looks and feels for you.</p>

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

                <div className={styles.settingGroup}>
                  <h3 className={styles.groupTitle}>Colors &amp; Accent</h3>
                  <p className={styles.groupDesc}>
                    Use the <strong>Theme Picker</strong> in the navigation bar to customize accent colors — including a fully custom color builder.
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
                    { label: "New followers",              desc: "When someone follows your profile"       },
                    { label: "Article comments",           desc: "When someone comments on your article"   },
                    { label: "Article likes",              desc: "When your article gets liked"            },
                    { label: "Reply posts",                desc: "When someone replies to your article with a post" },
                    { label: "Weekly digest",              desc: "A curated digest of trending articles"   },
                    { label: "New articles from following",desc: "When writers you follow publish"         },
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
                <button className="btn btn-primary" onClick={() => toast.success("Notification preferences saved!")} style={{ marginTop: "1.5rem" }}>
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
                      <div className={styles.passwordWrap}>
                        <input
                          id="s-current-pw"
                          type={showPw ? "text" : "password"}
                          className="input"
                          placeholder="••••••••"
                          value={currentPw}
                          onChange={e => setCurrentPw(e.target.value)}
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)} aria-label="Toggle password visibility">
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="s-new-pw">New password</label>
                      <input id="s-new-pw" type="password" className="input" placeholder="••••••••" value={newPw} onChange={e => setNewPw(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="s-confirm-pw">Confirm new password</label>
                      <input id="s-confirm-pw" type="password" className="input" placeholder="••••••••" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                      {confirmPw && newPw !== confirmPw && (
                        <span className={styles.fieldError}>Passwords don't match</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleChangePassword}
                    disabled={savingPw}
                    style={{ marginTop: "1rem" }}
                  >
                    {savingPw ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
                    {savingPw ? "Updating…" : "Update Password"}
                  </button>
                </div>

                <div className={`${styles.securitySection} ${styles.dangerZone}`}>
                  <h3 className={styles.dangerTitle}>Danger Zone</h3>
                  <p className={styles.groupDesc}>These actions are permanent and cannot be undone.</p>
                  <button
                    className="btn btn-sm"
                    style={{ background: "rgba(239,68,68,0.1)", color: "var(--error-400)", border: "1px solid rgba(239,68,68,0.2)" }}
                    onClick={() => toast.error("Account deletion requires email confirmation. Contact support.")}
                  >
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
