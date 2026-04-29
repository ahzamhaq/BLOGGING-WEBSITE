"use client";

import { useEffect, useRef } from "react";

export function ReadTimeTracker({ articleId }: { articleId: string }) {
  const startRef  = useRef(Date.now());
  const sentRef   = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    sentRef.current  = false;

    function send() {
      if (sentRef.current) return;
      sentRef.current = true;
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      // Use sendBeacon so it fires even on tab close
      const blob = new Blob(
        [JSON.stringify({ articleId, readTime: seconds })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/articles/view", blob);
    }

    window.addEventListener("beforeunload", send);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") send();
    });

    return () => {
      window.removeEventListener("beforeunload", send);
      send();
    };
  }, [articleId]);

  return null;
}
