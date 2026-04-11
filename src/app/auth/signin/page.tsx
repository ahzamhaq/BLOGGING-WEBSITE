"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Feather, Mail, Lock, Eye, EyeOff, Chrome } from "lucide-react";
import toast from "react-hot-toast";
import styles from "../auth.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } else {
      toast.error("Invalid email or password. Please try again.");
    }
  }

  async function handleGoogle() {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CONFIGURED) {
      toast.error("Google sign-in is not configured yet. Please use email & password.");
      return;
    }
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
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

        <div className={styles.heading}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to continue writing</p>
        </div>

        {/* Google OAuth */}
        <button
          className={styles.oauthBtn}
          onClick={handleGoogle}
          disabled={loading}
          aria-label="Sign in with Google"
        >
          <Chrome size={17} />
          Continue with Google
        </button>

        <div className={styles.divider}><span>or sign in with email</span></div>

        {/* Email + Password */}
        <form onSubmit={handleCredentials} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="signin-email" className={styles.label}>Email address</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="signin-email"
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

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="signin-password" className={styles.label}>Password</label>
              <Link href="/auth/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="signin-password"
                type={showPass ? "text" : "password"}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className={styles.togglePass}
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : "Sign In"}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup">Create one →</Link>
        </p>
      </div>
    </div>
  );
}
