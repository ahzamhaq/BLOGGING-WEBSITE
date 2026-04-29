"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Feather, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import styles from "../auth.module.css";

function ResetForm() {
  const params  = useSearchParams();
  const token   = params.get("token") ?? "";
  const router  = useRouter();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token)              { toast.error("Invalid reset link.");           return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match.");       return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Something went wrong."); return; }
      setDone(true);
      toast.success("Password updated! Redirecting…");
      setTimeout(() => router.push("/auth/signin"), 2000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.blobA} aria-hidden />
      <div className={styles.blobB} aria-hidden />

      <div className={styles.card}>
        <Link href="/" className={styles.logo}>
          <Feather size={22} />
          <span>WriteSpace</span>
        </Link>

        {done ? (
          <div className={styles.heading}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"1rem", color:"var(--success-400)" }}>
              <CheckCircle2 size={48} strokeWidth={1.6} />
            </div>
            <h1 className={styles.title}>Password updated!</h1>
            <p className={styles.subtitle}>Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <div className={styles.heading}>
              <h1 className={styles.title}>Set new password</h1>
              <p className={styles.subtitle}>Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="rp-password" className={styles.label}>New password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="rp-password"
                    type={showPass ? "text" : "password"}
                    className={styles.input}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button type="button" className={styles.togglePass} onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="rp-confirm" className={styles.label}>Confirm password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="rp-confirm"
                    type={showPass ? "text" : "password"}
                    className={styles.input}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading || !token}>
                {loading ? <span className={styles.spinner} /> : "Update Password"}
              </button>
            </form>

            {!token && (
              <p style={{ color:"var(--error-400)", textAlign:"center", fontSize:"0.85rem" }}>
                This reset link is missing a token. Please request a new one.
              </p>
            )}

            <p className={styles.switchLink}>
              <Link href="/auth/forgot-password">Request a new link</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
