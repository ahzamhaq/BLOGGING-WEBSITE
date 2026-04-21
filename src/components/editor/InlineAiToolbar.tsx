"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Sparkles, Wand2, Scissors, AlignJustify, RefreshCw,
  ArrowRight, X, Copy, CheckCheck, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./InlineAiToolbar.module.css";

const QUICK_ACTIONS = [
  { id: "improve",   label: "Improve",   icon: Wand2,        prompt: "Improve the writing quality, clarity, and flow of the following text. Keep the same meaning but make it better written:" },
  { id: "shorten",   label: "Shorten",   icon: Scissors,     prompt: "Rewrite the following text to be more concise and punchy without losing the key points:" },
  { id: "expand",    label: "Expand",    icon: AlignJustify, prompt: "Expand on the following text with more detail, examples, and depth:" },
  { id: "rephrase",  label: "Rephrase",  icon: RefreshCw,    prompt: "Rephrase the following text in a fresh way while keeping the same meaning:" },
  { id: "continue",  label: "Continue",  icon: ArrowRight,   prompt: "Continue writing in the same style and tone after this text. Write the next 2-3 sentences:" },
];

interface SavedSel { from: number; to: number; text: string; }

interface Props { editor: Editor | null; }

export function InlineAiToolbar({ editor }: Props) {
  const [visible, setVisible]           = useState(false);
  const [pos,     setPos]               = useState({ x: 0, y: 0 });
  const [loading, setLoading]           = useState(false);
  const [result,  setResult]            = useState("");
  const [copied,  setCopied]            = useState(false);
  const [activeId, setActiveId]         = useState<string | null>(null);

  const savedSel = useRef<SavedSel | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const hide = useCallback(() => {
    setVisible(false);
    setResult("");
    setActiveId(null);
    savedSel.current = null;
  }, []);

  // ── Track editor selection ───────────────────────────────────────
  useEffect(() => {
    if (!editor) return;

    const onSel = () => {
      const { from, to } = editor.state.selection;
      if (from === to) { hide(); return; }

      const text = editor.state.doc.textBetween(from, to, " ").trim();
      if (text.length < 4) { hide(); return; }

      // Position based on DOM selection bounding box
      const domSel = window.getSelection();
      if (!domSel || domSel.rangeCount === 0) { hide(); return; }
      const rect = domSel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width) { hide(); return; }

      savedSel.current = { from, to, text };
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
      setResult("");
      setActiveId(null);
      setVisible(true);
    };

    editor.on("selectionUpdate", onSel);
    return () => { editor.off("selectionUpdate", onSel); };
  }, [editor, hide]);

  // ── Close on outside click ───────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) hide();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible, hide]);

  // ── Run AI action ────────────────────────────────────────────────
  const runAction = async (actionId: string) => {
    const sel = savedSel.current;
    if (!sel) return;
    const action = QUICK_ACTIONS.find(a => a.id === actionId)!;

    setActiveId(actionId);
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${action.prompt}\n\n"${sel.text}"\n\nReturn only the rewritten text, no explanations or quotes.`,
        }),
      });
      if (!res.ok) throw new Error();

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let full = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += dec.decode(value);
          setResult(full);
        }
      }
    } catch {
      toast.error("AI request failed — check your Gemini API key.");
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Insert actions ───────────────────────────────────────────────
  const doReplace = () => {
    if (!result || !editor || !savedSel.current) return;
    const { from, to } = savedSel.current;
    editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
    toast.success("Selection replaced!");
    hide();
  };

  const doInsertBelow = () => {
    if (!result || !editor || !savedSel.current) return;
    const { to } = savedSel.current;
    editor.chain().focus().insertContentAt(to, "\n" + result).run();
    toast.success("Inserted below!");
    hide();
  };

  const doCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className={styles.root}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Quick action buttons */}
      <div className={styles.bar}>
        <span className={styles.barIcon}><Sparkles size={11} /></span>
        {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.chip} ${activeId === id ? styles.chipActive : ""}`}
            onMouseDown={e => { e.preventDefault(); runAction(id); }}
            disabled={loading}
          >
            {loading && activeId === id
              ? <Loader2 size={10} className={styles.spin} />
              : <Icon size={10} />
            }
            {label}
          </button>
        ))}
        <div className={styles.sep} />
        <button className={styles.closeBtn} onMouseDown={e => { e.preventDefault(); hide(); }}>
          <X size={11} />
        </button>
      </div>

      {/* Result card */}
      {(result || (loading && activeId)) && (
        <div className={styles.resultCard}>
          {result ? (
            <>
              <p className={styles.resultText}>{result}</p>
              <div className={styles.resultActions}>
                <button className={`btn btn-primary btn-sm ${styles.actBtn}`} onMouseDown={e => { e.preventDefault(); doReplace(); }}>
                  Replace
                </button>
                <button className={`btn btn-secondary btn-sm ${styles.actBtn}`} onMouseDown={e => { e.preventDefault(); doInsertBelow(); }}>
                  Insert below
                </button>
                <button className={styles.copyBtn} onMouseDown={e => { e.preventDefault(); doCopy(); }} title="Copy">
                  {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.generating}>
              <Loader2 size={13} className={styles.spin} />
              <span>Generating…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
