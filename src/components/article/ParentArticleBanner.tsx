import Link from "next/link";
import { CornerUpLeft } from "lucide-react";
import styles from "./ParentArticleBanner.module.css";

interface Props {
  parent: {
    slug: string;
    title: string;
    author: { name: string | null; handle: string };
  };
}

export function ParentArticleBanner({ parent }: Props) {
  const authorName = parent.author.name ?? parent.author.handle;
  return (
    <Link href={`/article/${parent.slug}`} className={styles.banner}>
      <span className={styles.icon}><CornerUpLeft size={14} /></span>
      <span className={styles.label}>Replying to</span>
      <span className={styles.title}>{parent.title}</span>
      <span className={styles.author}>by {authorName}</span>
    </Link>
  );
}
