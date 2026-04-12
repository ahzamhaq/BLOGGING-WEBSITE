"use client";

import { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
  Sparkles, X, Send, Loader2, Copy, CheckCheck,
  Wand2, FileText, Lightbulb, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./AiAssistant.module.css";

type Mode = "improve" | "shorten" | "expand" | "tone" | "summarize" | "ideas";

const MODES: { id: Mode; icon: typeof Wand2; label: string; prompt: string }[] = [
  { id: "improve",   icon: Wand2,      label: "Improve",    prompt: "Improve the writing quality, clarity, and flow of this text:" },
  { id: "shorten",   icon: RefreshCw,  label: "Shorten",    prompt: "Rewrite this text to be concise and punchy, keeping the key points:" },
  { id: "expand",    icon: FileText,   label: "Expand",     prompt: "Expand on this text with more detail, examples, and depth:" },
  { id: "ideas",     icon: Lightbulb,  label: "Ideas",      prompt: "Give me 5 creative ideas or angles to write about this topic:" },
  { id: "summarize", icon: Sparkles,   label: "Summarize",  prompt: "Write a compelling 2–3 sentence summary of this article:" },
  { id: "tone",      icon: Wand2,      label: "Tone Fix",   prompt: "Rewrite this in a professional yet conversational tone:" },
];

interface Props { editor: Editor | null; onClose: () => void; }

export function AiAssistant({ editor, onClose }: Props) {
  const [mode, setMode]           = useState<Mode>("improve");
  const [customPrompt, setCustom] = useState("");
  const [result, setResult]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function handleGenerate() {
    const selectedText = editor?.state.selection
      ? editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          " "
        )
      : "";

    const content = selectedText ||
      editor?.getText().slice(0, 2000) ||
      customPrompt;

    if (!content.trim()) {
      toast.error("Select some text or type a prompt first.");
      return;
    }

    const activeMode = MODES.find((m) => m.id === mode)!;
    const finalPrompt = customPrompt || `${activeMode.prompt}\n\n${content}`;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      if (!res.ok) throw new Error("AI request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setResult((prev) => prev + chunk);
        }
      }
    } catch {
      toast.error("AI request failed. Check your Gemini API key.");
    } finally {
      setLoading(false);
    }
  }

  function handleInsert() {
    if (!result || !editor) return;
    // If there's a selection, replace it; otherwise append at cursor
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
      toast.success("Replaced selection with AI result!");
    } else {
      editor.chain().focus().insertContent(result).run();
      toast.success("Inserted into article!");
    }
    setResult("");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  }

  return (
    <aside className={styles.panel} aria-label="AI Writing Assistant">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Sparkles size={15} className={styles.sparkle} />
          <span className={styles.headerTitle}>AI Assistant</span>
          <span className={styles.powered}>Gemini</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close AI assistant">
          <X size={16} />
        </button>
      </div>

      {/* Mode chips */}
      <div className={styles.modes} role="group" aria-label="AI modes">
        {MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`${styles.modeChip} ${mode === id ? styles.modeActive : ""}`}
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Prompt input */}
      <div className={styles.promptArea}>
        <p className={styles.hint}>
          {MODES.find((m) => m.id === mode)?.prompt}
        </p>
        <textarea
          ref={textareaRef}
          className={styles.promptInput}
          placeholder="Or type a custom prompt…"
          value={customPrompt}
          onChange={(e) => setCustom(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate();
          }}
          aria-label="Custom AI prompt"
        />
        <button
          className="btn btn-primary btn-sm"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <Loader2 size={15} className={styles.spin} /> : <Send size={15} />}
          {loading ? "Generating…" : "Generate  (⌘↵)"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <span className={styles.resultLabel}>Result</span>
            <div className={styles.resultActions}>
              <button className={styles.resultBtn} onClick={handleCopy} title="Copy">
                {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <div className={styles.resultText}>{result}</div>
          <button
            className="btn btn-primary btn-sm"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem", gap: "0.4rem" }}
            onClick={handleInsert}
          >
            <Wand2 size={13} />
            Insert into Editor
          </button>
        </div>
      )}
    </aside>
  );
}
