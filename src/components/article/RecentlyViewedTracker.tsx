"use client";

import { useEffect } from "react";

interface Props {
  article: {
    id: string;
    slug: string;
    title: string;
    coverImage?: string | null;
    readTime: number;
    authorName: string;
    authorHandle: string;
  };
}

const STORAGE_KEY = "writespace.recentlyViewed";
const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  readTime: number;
  authorName: string;
  authorHandle: string;
  viewedAt: number;
}

export function pushRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((x) => x.id !== item.id);
    filtered.unshift({ ...item, viewedAt: Date.now() });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
}

export function readRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentlyViewedItem[]) : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
}

// Client component that records a view when an article page mounts
export function RecentlyViewedTracker({ article }: Props) {
  useEffect(() => {
    pushRecentlyViewed({
      id: article.id,
      slug: article.slug,
      title: article.title,
      coverImage: article.coverImage ?? null,
      readTime: article.readTime,
      authorName: article.authorName,
      authorHandle: article.authorHandle,
    });
  }, [article.id, article.slug, article.title, article.coverImage, article.readTime, article.authorName, article.authorHandle]);

  return null;
}
