import Link from "next/link";
import { Home, Search, PenLine } from "lucide-react";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.blobA} aria-hidden />
      <div className={styles.blobB} aria-hidden />

      <div className={styles.content}>
        <div className={styles.codeWrapper}>
          <span className={styles.code}>404</span>
          <div className={styles.codeGlow} aria-hidden />
        </div>

        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.subtitle}>
          The article, writer, or page you&apos;re looking for doesn&apos;t exist — or maybe it was moved.
          Let&apos;s get you back on track.
        </p>

        <div className={styles.actions}>
          <Link href="/" className="btn btn-primary btn-lg">
            <Home size={18} />
            Go to Home
          </Link>
          <Link href="/explore" className="btn btn-secondary btn-lg">
            <Search size={18} />
            Explore Articles
          </Link>
          <Link href="/editor/new" className="btn btn-ghost btn-lg">
            <PenLine size={18} />
            Write Something
          </Link>
        </div>
      </div>
    </div>
  );
}
