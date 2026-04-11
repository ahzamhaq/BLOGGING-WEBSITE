"use client";

import Link from "next/link";
import { useState } from "react";
import { Feather, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    // TODO: wire to real API
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
    toast.success("If that email exists, a reset link is on its way.");
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

        {sent ? (
          <>
            <div className={styles.heading}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  color: "var(--success-400)",
                }}
              >
                <CheckCircle2 size={48} strokeWidth={1.6} />
              </div>
              <h1 className={styles.title}>Check your inbox</h1>
              <p className={styles.subtitle}>
                We sent a password reset link to <strong>{email}</strong>. The link
                is valid for 30 minutes.
              </p>
            </div>

            <button
              className={`btn btn-secondary ${styles.submitBtn}`}
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Use a different email
            </button>

            <p className={styles.switchLink}>
              <Link href="/auth/signin">
                <ArrowLeft size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className={styles.heading}>
              <h1 className={styles.title}>Reset your password</h1>
              <p className={styles.subtitle}>
                Enter the email associated with your account and we&apos;ll send you
                a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="fp-email" className={styles.label}>
                  Email address
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="fp-email"
                    type="email"
                    className={styles.input}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? <span className={styles.spinner} /> : "Send reset link"}
              </button>
            </form>

            <p className={styles.switchLink}>
              Remember it?{" "}
              <Link href="/auth/signin">
                <ArrowLeft size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
