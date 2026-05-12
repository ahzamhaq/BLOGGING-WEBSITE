"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, AlertCircle, Loader2 } from "lucide-react";
import type { SaveStatus as Status } from "./useAutoSave";

interface Props {
  status: Status;
  savedAt: number | null;
}

function relTime(then: number, now: number) {
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function SaveStatusIndicator({ status, savedAt }: Props) {
  const [, force] = useState(0);
  // Tick every 30s so "saved 1m ago" updates
  useEffect(() => {
    if (status !== "saved" || !savedAt) return;
    const id = window.setInterval(() => force((x) => x + 1), 30_000);
    return () => window.clearInterval(id);
  }, [status, savedAt]);

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.78rem",
    fontWeight: 500,
    color: "var(--text-muted)",
    minHeight: "20px",
  };

  if (status === "saving") {
    return (
      <span style={baseStyle} aria-live="polite">
        <Loader2 size={13} style={{ animation: "spin 0.9s linear infinite" }} />
        Saving…
      </span>
    );
  }
  if (status === "offline") {
    return (
      <span style={{ ...baseStyle, color: "var(--warning-400, #f59e0b)" }} aria-live="polite">
        <CloudOff size={13} />
        Offline — saved locally
      </span>
    );
  }
  if (status === "error") {
    return (
      <span style={{ ...baseStyle, color: "var(--error-400, #ef4444)" }} aria-live="polite">
        <AlertCircle size={13} />
        Save failed — saved locally
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    return (
      <span style={{ ...baseStyle, color: "var(--success-400, #22c55e)" }} aria-live="polite">
        <CheckCircle2 size={13} />
        Saved {relTime(savedAt, Date.now())}
      </span>
    );
  }
  return <span style={baseStyle} aria-hidden />;
}
