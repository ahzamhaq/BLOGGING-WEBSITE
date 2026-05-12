"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "offline" | "error";

export interface DraftSnapshot {
  title: string;
  subtitle: string;
  content: string;
  tags: string[];
  coverImage: string | null;
  updatedAt: number;
}

interface Options {
  /** Stable key for localStorage. Use "new" for unsaved-yet articles. */
  storageKey: string;
  /** Server save callback. Resolve with the saved article id (used to migrate "new" key). */
  serverSave: (snapshot: DraftSnapshot) => Promise<string | null>;
  /** Debounce delay before server save (ms). */
  debounceMs?: number;
  /** Set to true once the editor has finished loading initial content. */
  ready: boolean;
}

const SCHEMA_VERSION = 1;

interface StoredEntry {
  v: number;
  data: DraftSnapshot;
}

export function readDraftFromStorage(storageKey: string): DraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`editor.draft.${storageKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry;
    if (parsed.v !== SCHEMA_VERSION) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function clearDraftFromStorage(storageKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`editor.draft.${storageKey}`);
  } catch {}
}

function writeDraftToStorage(storageKey: string, snapshot: DraftSnapshot) {
  if (typeof window === "undefined") return;
  try {
    const entry: StoredEntry = { v: SCHEMA_VERSION, data: snapshot };
    window.localStorage.setItem(`editor.draft.${storageKey}`, JSON.stringify(entry));
  } catch {
    // Quota exceeded or unavailable — fail silently
  }
}

function snapshotIsEmpty(s: DraftSnapshot) {
  if (s.title.trim()) return false;
  if (s.subtitle.trim()) return false;
  if (s.tags.length > 0) return false;
  if (s.coverImage) return false;
  // Strip HTML tags & whitespace to detect empty TipTap content like "<p></p>"
  const text = s.content.replace(/<[^>]*>/g, "").trim();
  return text.length === 0;
}

export function useAutoSave({ storageKey, serverSave, debounceMs = 1500, ready }: Options) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const lastSnapshotRef = useRef<DraftSnapshot | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const queuedRef = useRef<DraftSnapshot | null>(null);
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  // Online/offline awareness
  useEffect(() => {
    const onOnline = () => {
      // When coming back online, flush any pending snapshot
      if (lastSnapshotRef.current && isDirty) {
        scheduleSave(lastSnapshotRef.current, 0);
      }
    };
    const onOffline = () => setStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  const runSave = useCallback(async (snapshot: DraftSnapshot) => {
    if (inFlightRef.current) {
      queuedRef.current = snapshot;
      return;
    }
    inFlightRef.current = true;
    setStatus("saving");
    try {
      if (!navigator.onLine) {
        setStatus("offline");
        inFlightRef.current = false;
        return;
      }
      const newId = await serverSave(snapshot);
      // If we got back a real id and we were saving under "new", migrate the local entry
      if (newId && storageKeyRef.current === "new") {
        const existing = readDraftFromStorage("new");
        clearDraftFromStorage("new");
        if (existing) writeDraftToStorage(newId, existing);
      }
      setStatus("saved");
      setSavedAt(Date.now());
      setIsDirty(false);
    } catch {
      setStatus("error");
    } finally {
      inFlightRef.current = false;
      // Drain queued snapshot if one came in while we were saving
      const next = queuedRef.current;
      queuedRef.current = null;
      if (next) {
        // Small delay so UI gets a moment to show "saved" before next save
        setTimeout(() => runSave(next), 200);
      }
    }
  }, [serverSave]);

  const scheduleSave = useCallback((snapshot: DraftSnapshot, delayMs: number) => {
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      runSave(snapshot);
    }, delayMs);
  }, [runSave]);

  /** Call from the editor whenever any tracked field changes. */
  const trigger = useCallback((snapshot: DraftSnapshot) => {
    if (!ready) return;
    lastSnapshotRef.current = snapshot;
    // Always write to localStorage immediately — survives refresh/crash
    if (!snapshotIsEmpty(snapshot)) {
      writeDraftToStorage(storageKeyRef.current, snapshot);
    }
    setIsDirty(true);
    if (status !== "saving") setStatus("idle");
    scheduleSave(snapshot, debounceMs);
  }, [ready, status, scheduleSave, debounceMs]);

  /** Force a save immediately (e.g. on Save button click). */
  const flush = useCallback(async () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (lastSnapshotRef.current) {
      await runSave(lastSnapshotRef.current);
    }
  }, [runSave]);

  /** Tell the autosave system the draft is now persisted (e.g. after publish). */
  const markSaved = useCallback(() => {
    setStatus("saved");
    setSavedAt(Date.now());
    setIsDirty(false);
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Cleanup
  useEffect(() => () => {
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
  }, []);

  return { status, savedAt, isDirty, trigger, flush, markSaved };
}
