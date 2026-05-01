"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import styles from "./TextToSpeech.module.css";

interface Props {
  content: string;
}

interface Word {
  text: string;
  start: number;
  end: number;
}

function htmlToText(html: string): string {
  if (typeof window === "undefined") return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? div.innerText ?? "").replace(/\s+/g, " ").trim();
}

function tokenize(text: string): Word[] {
  const words: Word[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    words.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return words;
}

export function TextToSpeech({ content }: Props) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);

  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const charOffsetRef = useRef(0);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  const text = useMemo(() => htmlToText(content), [content]);
  const words = useMemo(() => tokenize(text), [text]);

  const speakFrom = useCallback(
    (charOffset: number) => {
      if (typeof window === "undefined") return;
      const synth = window.speechSynthesis;
      synth.cancel();

      const slice = text.slice(charOffset);
      if (!slice.trim()) {
        setPlaying(false);
        setPaused(false);
        setActiveWordIdx(-1);
        return;
      }

      const u = new SpeechSynthesisUtterance(slice);
      u.rate = rateRef.current;
      u.pitch = 1;
      u.lang = "en-US";

      u.onboundary = (e) => {
        if (e.name && e.name !== "word") return;
        const absChar = charOffset + e.charIndex;
        let idx = -1;
        for (let i = 0; i < words.length; i++) {
          if (words[i].start <= absChar && absChar < words[i].end + 1) {
            idx = i;
            break;
          }
          if (words[i].start > absChar) {
            idx = Math.max(0, i - 1);
            break;
          }
        }
        if (idx === -1 && words.length > 0 && absChar >= words[words.length - 1].start) {
          idx = words.length - 1;
        }
        if (idx >= 0) {
          charOffsetRef.current = words[idx].start;
          setActiveWordIdx(idx);
        }
      };
      u.onend = () => {
        setPlaying(false);
        setPaused(false);
        setActiveWordIdx(-1);
        charOffsetRef.current = 0;
      };
      u.onerror = () => {
        setPlaying(false);
        setPaused(false);
      };

      utterRef.current = u;
      synth.speak(u);
      setPlaying(true);
      setPaused(false);
    },
    [text, words]
  );

  const play = useCallback(() => {
    if (paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      setPaused(false);
      return;
    }
    if (!text.trim()) return;
    charOffsetRef.current = 0;
    setActiveWordIdx(-1);
    speakFrom(0);
  }, [paused, text, speakFrom]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPlaying(false);
    setPaused(true);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setActiveWordIdx(-1);
    charOffsetRef.current = 0;
  }, []);

  const changeRate = useCallback(
    (r: number) => {
      setRate(r);
      rateRef.current = r;
      if (playing || paused) {
        const resumeFrom = charOffsetRef.current;
        speakFrom(resumeFrom);
      }
    },
    [playing, paused, speakFrom]
  );

  // Auto-scroll active word into view inside the panel
  useEffect(() => {
    if (activeWordIdx < 0 || !panelRef.current) return;
    const node = panelRef.current.querySelector<HTMLElement>(
      `[data-word-idx="${activeWordIdx}"]`
    );
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeWordIdx]);

  // Cleanup
  useEffect(
    () => () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    []
  );

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  if (!supported) return null;

  const isActive = playing || paused;

  return (
    <>
      <div className={styles.bar}>
        <Volume2 size={14} className={styles.icon} />
        <span className={styles.label}>Listen</span>

        {!playing ? (
          <button
            className={styles.btn}
            onClick={play}
            title={paused ? "Resume" : "Listen to article"}
            aria-label={paused ? "Resume" : "Play"}
          >
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
          <button
            className={`${styles.btn} ${styles.btnStop}`}
            onClick={stop}
            title="Stop"
            aria-label="Stop"
          >
            <Square size={13} />
            Stop
          </button>
        )}

        <div className={styles.rateGroup}>
          {[0.5, 1, 1.5, 2].map((r) => (
            <button
              key={r}
              className={`${styles.rateBtn} ${rate === r ? styles.rateBtnActive : ""}`}
              onClick={() => changeRate(r)}
              title={`${r}× speed`}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      {isActive && (
        <div ref={panelRef} className={styles.panel} aria-live="polite">
          <div className={styles.panelLabel}>Now reading</div>
          <p className={styles.panelText}>
            {words.map((w, i) => {
              const cls =
                i === activeWordIdx
                  ? `${styles.word} ${styles.wordActive}`
                  : i < activeWordIdx
                  ? `${styles.word} ${styles.wordSpoken}`
                  : styles.word;
              return (
                <span key={i} data-word-idx={i} className={cls}>
                  {w.text}{" "}
                </span>
              );
            })}
          </p>
        </div>
      )}
    </>
  );
}
