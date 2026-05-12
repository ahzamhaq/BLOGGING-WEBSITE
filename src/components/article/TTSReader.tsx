"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Play, Pause, Square, Volume2, SkipBack, SkipForward,
  Target, MousePointer2,
} from "lucide-react";
import styles from "./TTSReader.module.css";

interface Props { html: string }
interface Token { text: string; start: number; end: number }

const RATES = [0.5, 1, 1.25, 1.5, 2] as const;
const FOLLOW_RESUME_DELAY_MS = 3500;

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function TTSReader({ html }: Props) {
  const [supported, setSupported] = useState(true);
  // "idle" | "playing" | "paused"
  const [playState, setPlayState] = useState<"idle" | "playing" | "paused">("idle");
  const [rate, setRate] = useState(1);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [bodyText, setBodyText] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [followOn, setFollowOn] = useState(true);
  const [showFloating, setShowFloating] = useState(false);
  // true when user is manually scrolling (suppresses auto-follow temporarily)
  const [userScrolling, setUserScrolling] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // charOffsetRef = start char of the CURRENTLY HIGHLIGHTED word (updated by onboundary)
  const charOffsetRef = useRef(0);
  // pauseOffsetRef = char offset saved at pause time (what Resume should restart from)
  const pauseOffsetRef = useRef(0);

  const rateRef = useRef(rate);
  const stoppingRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const userScrollTimerRef = useRef<number | null>(null);
  const userScrollingRef = useRef(false);
  const prevActiveSpanRef = useRef<HTMLElement | null>(null);

  // Ref mirrors of state for use inside event handlers / intervals
  const followOnRef = useRef(followOn);
  const playStateRef = useRef<"idle" | "playing" | "paused">("idle");

  rateRef.current = rate;
  followOnRef.current = followOn;
  playStateRef.current = playState;

  // ── Persist follow preference ────────────────────────────────
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("tts.follow");
      if (v === "0") setFollowOn(false);
    } catch {}
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem("tts.follow", followOn ? "1" : "0"); } catch {}
  }, [followOn]);

  // ── Tokenize article body once ───────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) { setSupported(false); return; }
    const root = bodyRef.current;
    if (!root) return;
    root.innerHTML = html;

    let idx = 0;
    let charPos = 0;
    const localTokens: Token[] = [];
    const fullParts: string[] = [];

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE", "CODE", "PRE"].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        return n.textContent && n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) textNodes.push(node as Text);

    textNodes.forEach((tn) => {
      const txt = tn.textContent ?? "";
      if (!txt) return;
      const frag = document.createDocumentFragment();
      const re = /(\s+)|(\S+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(txt)) !== null) {
        if (m[1]) {
          frag.appendChild(document.createTextNode(m[1]));
          fullParts.push(m[1]);
          charPos += m[1].length;
        } else if (m[2]) {
          const span = document.createElement("span");
          span.className = styles.word;
          span.dataset.ttsIdx = String(idx);
          span.textContent = m[2];
          frag.appendChild(span);
          localTokens.push({ text: m[2], start: charPos, end: charPos + m[2].length });
          fullParts.push(m[2]);
          charPos += m[2].length;
          idx++;
        }
      }
      tn.parentNode?.replaceChild(frag, tn);
    });

    setTokens(localTokens);
    setBodyText(fullParts.join(""));
  }, [html]);

  // ── Detect manual scroll (ref-only, no rerenders) ────────────
  useEffect(() => {
    const markUserScroll = () => {
      if (programmaticScrollRef.current) return;
      userScrollingRef.current = true;
      setUserScrolling(true);
      if (userScrollTimerRef.current) window.clearTimeout(userScrollTimerRef.current);
      userScrollTimerRef.current = window.setTimeout(() => {
        userScrollingRef.current = false;
        setUserScrolling(false);
      }, FOLLOW_RESUME_DELAY_MS);
    };
    const onWheel = () => markUserScroll();
    const onTouch = () => markUserScroll();
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        const t = e.target as HTMLElement | null;
        if (t && t.getAttribute("role") === "slider") return;
        markUserScroll();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("keydown", onKey);
      if (userScrollTimerRef.current) window.clearTimeout(userScrollTimerRef.current);
    };
  }, []);

  // ── Highlight active word + auto-scroll ──────────────────────
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    const prev = prevActiveSpanRef.current;
    if (prev) {
      prev.classList.remove(styles.wordActive);
      prev.classList.add(styles.wordSpoken);
    }
    if (activeIdx < 0) {
      root.querySelectorAll<HTMLElement>("." + styles.wordSpoken)
        .forEach((s) => s.classList.remove(styles.wordSpoken));
      prevActiveSpanRef.current = null;
      return;
    }
    const next = root.querySelector<HTMLElement>(`[data-tts-idx="${activeIdx}"]`);
    if (next) {
      next.classList.remove(styles.wordSpoken);
      next.classList.add(styles.wordActive);
      prevActiveSpanRef.current = next;

      if (followOnRef.current && !userScrollingRef.current) {
        const rect = next.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.top < vh * 0.2 || rect.bottom > vh * 0.8) {
          const targetY = window.scrollY + rect.top - vh * 0.4;
          programmaticScrollRef.current = true;
          window.scrollTo({ top: targetY, behavior: "smooth" });
          window.setTimeout(() => { programmaticScrollRef.current = false; }, 800);
        }
      }
    }
  }, [activeIdx]);

  // ── Floating bar visibility ───────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const tb = toolbarRef.current;
      if (!tb || playStateRef.current === "idle") {
        setShowFloating(false);
        return;
      }
      setShowFloating(tb.getBoundingClientRect().bottom < 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [playState]);

  // ── Core: start speaking from a char offset ───────────────────
  const speakFromCharOffset = useCallback((charOffset: number) => {
    if (typeof window === "undefined") return;
    if (!bodyText.trim()) return;
    const synth = window.speechSynthesis;

    stoppingRef.current = true;
    synth.cancel();
    stoppingRef.current = false;

    const slice = bodyText.slice(charOffset);
    if (!slice.trim()) {
      charOffsetRef.current = 0;
      pauseOffsetRef.current = 0;
      setPlayState("idle");
      setActiveIdx(-1);
      return;
    }

    const u = new SpeechSynthesisUtterance(slice);
    u.rate = rateRef.current;
    u.pitch = 1;
    u.lang = "en-US";

    u.onboundary = (e) => {
      if (e.name && e.name !== "word") return;
      const abs = charOffset + e.charIndex;
      let lo = 0, hi = tokens.length - 1, found = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (tokens[mid].start <= abs && abs < tokens[mid].end + 1) { found = mid; break; }
        if (tokens[mid].start < abs) lo = mid + 1; else hi = mid - 1;
      }
      if (found === -1 && tokens.length > 0) found = Math.min(tokens.length - 1, Math.max(0, lo - 1));
      if (found >= 0) {
        charOffsetRef.current = tokens[found].start;
        setActiveIdx(found);
      }
    };
    u.onend = () => {
      if (stoppingRef.current) return;
      charOffsetRef.current = 0;
      pauseOffsetRef.current = 0;
      setPlayState("idle");
      setActiveIdx(-1);
    };
    u.onerror = (e) => {
      if (stoppingRef.current) return;
      if ((e as SpeechSynthesisErrorEvent).error === "interrupted") return;
      setPlayState("idle");
    };

    utterRef.current = u;
    setTimeout(() => { try { synth.speak(u); } catch {} }, 30);
    setPlayState("playing");
  }, [bodyText, tokens]);

  // ── Play ─────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (playStateRef.current === "paused") {
      speakFromCharOffset(pauseOffsetRef.current);
    } else {
      speakFromCharOffset(charOffsetRef.current || 0);
    }
  }, [speakFromCharOffset]);

  // ── Pause — cancel and save exact position ───────────────────
  const pauseSpeech = useCallback(() => {
    if (playStateRef.current !== "playing") return;
    // Snapshot current word position before cancelling
    pauseOffsetRef.current = charOffsetRef.current;
    stoppingRef.current = true;
    window.speechSynthesis.cancel();
    stoppingRef.current = false;
    setPlayState("paused");
    // activeIdx stays — highlight remains visible while paused
  }, []);

  // ── Stop ─────────────────────────────────────────────────────
  const stop = useCallback(() => {
    stoppingRef.current = true;
    window.speechSynthesis.cancel();
    stoppingRef.current = false;
    charOffsetRef.current = 0;
    pauseOffsetRef.current = 0;
    setPlayState("idle");
    setActiveIdx(-1);
  }, []);

  // ── Change rate mid-playback ──────────────────────────────────
  const changeRate = useCallback((r: number) => {
    setRate(r);
    rateRef.current = r;
    const ps = playStateRef.current;
    if (ps === "playing") {
      speakFromCharOffset(charOffsetRef.current);
    } else if (ps === "paused") {
      // Stay paused at same offset, just update rate for next play
    }
  }, [speakFromCharOffset]);

  // ── Seek to a specific word index ────────────────────────────
  const seekToWord = useCallback((idx: number, localTokens?: Token[]) => {
    const toks = localTokens ?? tokens;
    if (idx < 0 || idx >= toks.length) return;
    const offset = toks[idx].start;
    charOffsetRef.current = offset;
    setActiveIdx(idx);

    const ps = playStateRef.current;
    if (ps === "playing") {
      speakFromCharOffset(offset);
    } else if (ps === "paused") {
      // Update pauseOffset so Resume continues from the new position
      pauseOffsetRef.current = offset;
      // Don't restart speech — stay paused, just move the highlight
    }
    // idle: just move the highlight so user can see where they'll start from
  }, [tokens, speakFromCharOffset]);

  // ── Skip sentences forward / backward ────────────────────────
  const skipSentences = useCallback((dir: 1 | -1) => {
    if (tokens.length === 0) return;
    const cur = activeIdx >= 0 ? activeIdx : 0;
    let found = -1;
    const isEnd = (t: string) => /[.!?]$/.test(t);
    if (dir === 1) {
      for (let j = cur; j < tokens.length; j++) {
        if (isEnd(tokens[j].text)) { found = Math.min(j + 1, tokens.length - 1); break; }
      }
      if (found === -1) found = Math.min(cur + 20, tokens.length - 1);
    } else {
      let passed = false;
      for (let j = cur - 1; j >= 0; j--) {
        if (isEnd(tokens[j].text)) {
          if (passed) { found = j + 1; break; }
          passed = true;
        }
      }
      if (found === -1) found = 0;
    }
    seekToWord(found);
  }, [activeIdx, tokens, seekToWord]);

  // ── Alt/Shift+click word to seek ─────────────────────────────
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const handler = (e: MouseEvent) => {
      const span = (e.target as HTMLElement).closest<HTMLElement>("[data-tts-idx]");
      if (!span || !(e.altKey || e.shiftKey)) return;
      e.preventDefault();
      const idx = Number(span.dataset.ttsIdx);
      seekToWord(idx);
      if (playStateRef.current === "idle") speakFromCharOffset(tokens[idx]?.start ?? 0);
    };
    root.addEventListener("click", handler);
    return () => root.removeEventListener("click", handler);
  }, [seekToWord, speakFromCharOffset, tokens]);

  // ── Chrome long-text keep-alive ───────────────────────────────
  useEffect(() => {
    if (playState !== "playing") return;
    const id = window.setInterval(() => {
      if (playStateRef.current === "playing") {
        speakFromCharOffset(charOffsetRef.current);
      }
    }, 12000);
    return () => window.clearInterval(id);
  }, [playState, speakFromCharOffset]);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => () => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  // ── Jump to currently highlighted word ────────────────────────
  const jumpToActive = useCallback(() => {
    const root = bodyRef.current;
    if (!root || activeIdx < 0) return;
    const active = root.querySelector<HTMLElement>(`[data-tts-idx="${activeIdx}"]`);
    if (!active) return;
    const rect = active.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - window.innerHeight * 0.4;
    programmaticScrollRef.current = true;
    window.scrollTo({ top: targetY, behavior: "smooth" });
    if (userScrollTimerRef.current) window.clearTimeout(userScrollTimerRef.current);
    userScrollingRef.current = false;
    setUserScrolling(false);
    window.setTimeout(() => { programmaticScrollRef.current = false; }, 800);
  }, [activeIdx]);

  // ── Follow toggle — clear manual-scroll state when turning Follow back on ──
  const toggleFollow = useCallback(() => {
    setFollowOn((v) => {
      const next = !v;
      if (next) {
        // Switching to Follow: clear any lingering manual-scroll suppression
        if (userScrollTimerRef.current) window.clearTimeout(userScrollTimerRef.current);
        userScrollingRef.current = false;
        setUserScrolling(false);
      }
      return next;
    });
  }, []);

  // ── Derived display values ────────────────────────────────────
  const totalWords = tokens.length;
  const progressPct = totalWords > 0 && activeIdx >= 0 ? ((activeIdx + 1) / totalWords) * 100 : 0;
  const wordsPerSec = (160 / 60) * rate;
  const elapsedSec = activeIdx >= 0 ? (activeIdx + 1) / wordsPerSec : 0;
  const totalSec = totalWords > 0 ? totalWords / wordsPerSec : 0;

  const onSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalWords === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekToWord(Math.min(totalWords - 1, Math.max(0, Math.floor(pct * totalWords))));
  };
  const onSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalWords === 0) return setHoverIdx(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setHoverIdx(Math.min(totalWords - 1, Math.max(0, Math.floor(pct * totalWords))));
  };

  if (!supported) return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;

  const isPlaying = playState === "playing";
  const isPaused = playState === "paused";
  const isActive = isPlaying || isPaused;

  return (
    <>
      <div ref={toolbarRef} className={styles.toolbar}>
        <div className={styles.controls}>
          <Volume2 size={14} className={styles.icon} />
          <span className={styles.label}>Listen</span>

          <button
            className={styles.iconBtn}
            onClick={() => skipSentences(-1)}
            title="Previous sentence"
            aria-label="Previous sentence"
            disabled={!isActive}
          >
            <SkipBack size={14} />
          </button>

          {!isPlaying ? (
            <button
              className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
              onClick={play}
              title={isPaused ? "Resume" : "Play"}
              aria-label={isPaused ? "Resume" : "Play"}
            >
              <Play size={15} />
            </button>
          ) : (
            <button
              className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
              onClick={pauseSpeech}
              title="Pause"
              aria-label="Pause"
            >
              <Pause size={15} />
            </button>
          )}

          <button
            className={styles.iconBtn}
            onClick={() => skipSentences(1)}
            title="Next sentence"
            aria-label="Next sentence"
            disabled={!isActive}
          >
            <SkipForward size={14} />
          </button>

          {isActive && (
            <button
              className={`${styles.iconBtn} ${styles.iconBtnStop}`}
              onClick={stop}
              title="Stop"
              aria-label="Stop"
            >
              <Square size={13} />
            </button>
          )}

          <div className={styles.rateGroup} role="group" aria-label="Playback speed">
            {RATES.map((r) => (
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

          <button
            className={`${styles.followBtn} ${followOn ? styles.followBtnOn : ""}`}
            onClick={toggleFollow}
            title={followOn ? "Auto-scroll: ON — click to switch to Manual" : "Manual mode — click to turn Auto-scroll ON"}
            aria-pressed={followOn}
          >
            {followOn ? <Target size={13} /> : <MousePointer2 size={13} />}
            <span>{followOn ? "Follow" : "Manual"}</span>
          </button>
        </div>

        <div className={styles.seekRow}>
          <span className={styles.time}>{fmtTime(elapsedSec)}</span>
          <div
            className={styles.seekTrack}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={totalWords}
            aria-valuenow={Math.max(0, activeIdx)}
            tabIndex={0}
            onClick={onSeekClick}
            onMouseMove={onSeekHover}
            onMouseLeave={() => setHoverIdx(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") seekToWord(Math.min(totalWords - 1, (activeIdx < 0 ? 0 : activeIdx) + 1));
              else if (e.key === "ArrowLeft") seekToWord(Math.max(0, (activeIdx < 0 ? 0 : activeIdx) - 1));
            }}
          >
            <div className={styles.seekFill} style={{ width: `${progressPct}%` }} />
            <div className={styles.seekThumb} style={{ left: `${progressPct}%` }} />
            {hoverIdx !== null && (
              <div className={styles.seekHover} style={{ left: `${(hoverIdx / Math.max(1, totalWords - 1)) * 100}%` }}>
                word {hoverIdx + 1}/{totalWords}
              </div>
            )}
          </div>
          <span className={styles.time}>{fmtTime(totalSec)}</span>
        </div>

        <div className={styles.hint}>
          <span>Tip: <kbd>Alt</kbd>+click any word to read from there</span>
          {followOn && userScrolling && isActive && (
            <button className={styles.resumeFollow} onClick={jumpToActive}>
              Jump to reading position
            </button>
          )}
        </div>
      </div>

      <div ref={bodyRef} className="prose" />

      {showFloating && (
        <div className={styles.floating} role="region" aria-label="Now reading">
          <div className={styles.floatingInner}>
            {!isPlaying ? (
              <button className={`${styles.iconBtn} ${styles.iconBtnPrimary}`} onClick={play} aria-label={isPaused ? "Resume" : "Play"}>
                <Play size={15} />
              </button>
            ) : (
              <button className={`${styles.iconBtn} ${styles.iconBtnPrimary}`} onClick={pauseSpeech} aria-label="Pause">
                <Pause size={15} />
              </button>
            )}
            <button className={`${styles.iconBtn} ${styles.iconBtnStop}`} onClick={stop} aria-label="Stop">
              <Square size={13} />
            </button>
            <div className={styles.floatingProgress}>
              <div className={styles.floatingFill} style={{ width: `${progressPct}%` }} />
            </div>
            <select
              className={styles.floatingRate}
              value={rate}
              onChange={(e) => changeRate(parseFloat(e.target.value))}
              aria-label="Playback speed"
            >
              {RATES.map((r) => <option key={r} value={r}>{r}×</option>)}
            </select>
            <button
              className={`${styles.followBtn} ${followOn ? styles.followBtnOn : ""}`}
              onClick={toggleFollow}
              aria-pressed={followOn}
              title={followOn ? "Follow on" : "Manual"}
            >
              {followOn ? <Target size={13} /> : <MousePointer2 size={13} />}
            </button>
            {followOn && userScrolling && (
              <button className={styles.jumpBtn} onClick={jumpToActive} title="Jump to reading position">
                Jump
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
