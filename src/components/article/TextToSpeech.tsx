"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import styles from "./TextToSpeech.module.css";

interface Props {
  content: string; // raw HTML
}

function htmlToText(html: string): string {
  if (typeof window === "undefined") return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? "";
}

export function TextToSpeech({ content }: Props) {
  const [playing,  setPlaying]  = useState(false);
  const [paused,   setPaused]   = useState(false);
  const [rate,     setRate]     = useState(1);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up on unmount
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  }, []);

  const play = useCallback(() => {
    if (paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      setPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const text = htmlToText(content);
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = rate;
    utterance.pitch = 1;
    utterance.lang  = "en-US";

    utterance.onend   = () => { setPlaying(false); setPaused(false); };
    utterance.onerror = () => { setPlaying(false); setPaused(false); };

    utterRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
    setPaused(false);
  }, [content, paused, rate]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPlaying(false);
    setPaused(true);
  }, []);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  if (!supported) return null;

  const isActive = playing || paused;

  return (
    <div className={styles.bar}>
      <Volume2 size={14} className={styles.icon} />
      <span className={styles.label}>Listen</span>

      {!playing ? (
        <button className={styles.btn} onClick={play} title={paused ? "Resume" : "Listen to article"} aria-label={paused ? "Resume" : "Play"}>
          <Play size={13} />
          {paused ? "Resume" : "Play"}
        </button>
      ) : (
        <button className={styles.btn} onClick={pause} title="Pause" aria-label="Pause">
          <Pause size={13} />
          Pause
        </button>
      )}

      {isActive && (
        <button className={`${styles.btn} ${styles.btnStop}`} onClick={stop} title="Stop" aria-label="Stop">
          <Square size={13} />
          Stop
        </button>
      )}

      <div className={styles.rateGroup}>
        {[0.75, 1, 1.25, 1.5].map((r) => (
          <button
            key={r}
            className={`${styles.rateBtn} ${rate === r ? styles.rateBtnActive : ""}`}
            onClick={() => { setRate(r); if (playing) { stop(); setTimeout(play, 50); } }}
            title={`${r}× speed`}
          >
            {r}×
          </button>
        ))}
      </div>
    </div>
  );
}
