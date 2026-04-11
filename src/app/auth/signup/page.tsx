"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Feather, Mail, Lock, Eye, EyeOff, User, Chrome } from "lucide-react";
import toast from "react-hot-toast";
import styles from "../auth.module.css";

export default function SignUpPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()  || !email.trim() || !password.trim()) { toast.error("Please fill all fields."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }

    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.ok) {
      toast.success(`Welcome to WriteSpace, ${name.split(" ")[0]}!`);
      router.push("/");
      router.refresh();
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  const strength = password.length === 0 ? null : password.length < 6 ? "weak" : password.length < 10 ? "good" : "strong";

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
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Join WriteSpace and start publishing</p>
        </div>

        <button className={styles.oauthBtn} onClick={handleGoogle} disabled={loading}>
          <Chrome size={17} /> Continue with Google
        </button>

        <div className={styles.divider}><span>or sign up with email</span></div>

        <form onSubmit={handleSignUp} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="signup-name" className={styles.label}>Full name</label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.inputIcon} />
              <input id="signup-name" type="text" className={styles.input} placeholder="Jane Smith"
                value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required disabled={loading} />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>Email address</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input id="signup-email" type="email" className={styles.input} placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required disabled={loading} />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-password" className={styles.label}>
              Password <span className={styles.hint}>(min. 6 characters)</span>
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input id="signup-password" type={showPass ? "text" : "password"} className={styles.input}
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" required minLength={6} disabled={loading} />
              <button type="button" className={styles.togglePass} onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide" : "Show"}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {strength && (
              <div className={styles.strengthBar}>
                <div className={styles.strengthFill} data-strength={strength} />
              </div>
            )}
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Create Account"}
          </button>
        </form>

        <p className={styles.terms}>
          By creating an account you agree to our{" "}
          <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <p className={styles.switchLink}>
          Already have an account? <Link href="/auth/signin">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
