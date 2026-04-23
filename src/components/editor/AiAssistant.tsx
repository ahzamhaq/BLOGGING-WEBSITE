"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Sparkles, X, Send, Loader2, Wand2, FileText,
  Lightbulb, RefreshCw, Scissors, AlignJustify,
  BookOpen, Plus, ChevronDown, Copy, CheckCheck, Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./AiAssistant.module.css";

// ── Types ────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface Props {
  editor: Editor | null;
  onClose: () => void;
  title?: string;        // article title for context
}

// ── Quick prompt templates ───────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: BookOpen,      label: "Generate outline",    prompt: (t: string) => `Create a detailed blog post outline for an article titled "${t || "my article"}". Include 5-7 main sections with 2-3 bullet points each.` },
  { icon: Lightbulb,     label: "Write intro",         prompt: (t: string) => `Write a compelling introduction paragraph for a blog post titled "${t || "my article"}". Make it hook the reader immediately.` },
  { icon: Wand2,         label: "Improve selection",   prompt: () => `Improve the selected text in the editor for better clarity and impact. (Use the selected text from the editor as input)` },
  { icon: RefreshCw,     label: "Suggest title ideas", prompt: (t: string) => `Suggest 5 creative, SEO-friendly title alternatives for an article about "${t || "this topic"}". Make them engaging and specific.` },
  { icon: AlignJustify,  label: "Write conclusion",    prompt: (t: string) => `Write a strong conclusion for a blog post titled "${t || "my article"}". Summarize the key takeaways and end with a call to action.` },
  { icon: Scissors,      label: "SEO meta description",prompt: (t: string) => `Write a compelling SEO meta description (150-160 characters) for a blog post titled "${t || "my article"}".` },
  { icon: FileText,      label: "Expand content",      prompt: () => `Take the selected text from the editor and expand it with more detail, examples, statistics, and depth.` },
  { icon: Sparkles,      label: "Make it engaging",    prompt: () => `Rewrite the selected text to be more engaging, vivid, and compelling for readers.` },
];

// ── Helpers ──────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

function getEditorContext(editor: Editor | null) {
  if (!editor) return "";
  const { from, to } = editor.state.selection;
  if (from !== to) return editor.state.doc.textBetween(from, to, " ");
  return editor.getText().slice(0, 3000);
}

export function AiAssistant({ editor, onClose, title = "" }: Props) {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Send a message ─────────────────────────────────────────────
  const send = useCallback(async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setShowPrompts(false);

    const userMsg: Message = { id: uid(), role: "user", content: text };
    const assistantId = uid();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    // Build context-aware system prompt
    const editorContext = getEditorContext(editor);
    const systemContext = [
      "You are an expert AI writing assistant embedded in a blogging platform.",
      "Help the writer craft high-quality, engaging articles.",
      "Be concise, specific, and actionable.",
      title ? `The article title is: "${title}".` : "",
      editorContext ? `Current article content (excerpt):\n"""\n${editorContext.slice(0, 1500)}\n"""` : "",
      "When generating content, format it cleanly — no unnecessary headers or markdown fencing unless the user explicitly asks.",
    ].filter(Boolean).join("\n");

    const fullPrompt = `${systemContext}\n\nUser request: ${text}`;

    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let errMsg = `AI request failed (${res.status})`;
        try {
          const errData = await res.json();
          errMsg = errData.error ?? errMsg;
        } catch {
          try { errMsg = await res.text() || errMsg; } catch { /* ignore */ }
        }
        throw new Error(errMsg);
      }

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += dec.decode(value);
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: full } : m)
          );
        }
      }

      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m)
      );
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "AI request failed";
      toast.error(msg, { duration: 5000 });
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading, editor, title]);

  // ── Insert AI response into editor ────────────────────────────
  const insertIntoEditor = (content: string) => {
    if (!editor || !content) return;
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().deleteRange({ from, to }).insertContent(content).run();
      toast.success("Replaced selection!");
    } else {
      editor.chain().focus().insertContent(content).run();
      toast.success("Inserted into editor!");
    }
  };

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setShowPrompts(true);
  };

  return (
    <aside className={styles.panel} aria-label="AI Writing Assistant">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.sparkleWrap}><Sparkles size={14} /></div>
          <div>
            <span className={styles.headerTitle}>AI Assistant</span>
            <span className={styles.powered}>Gemini</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button className={styles.headerBtn} onClick={clearChat} title="Clear chat">
              <Trash2 size={13} />
            </button>
          )}
          <button className={styles.headerBtn} onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Context pill ───────────────────────────────────────── */}
      {title && (
        <div className={styles.contextPill}>
          <FileText size={11} />
          <span className={styles.contextText} title={title}>
            {title.length > 35 ? title.slice(0, 35) + "…" : title}
          </span>
        </div>
      )}

      {/* ── Chat area ──────────────────────────────────────────── */}
      <div className={styles.chatArea}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Sparkles size={28} /></div>
            <p className={styles.emptyTitle}>AI Writing Assistant</p>
            <p className={styles.emptyHint}>
              Ask me anything about your article, or use a quick prompt below.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`${styles.msg} ${styles[`msg_${msg.role}`]}`}>
            {msg.role === "assistant" && (
              <div className={styles.msgAvatar}><Sparkles size={11} /></div>
            )}
            <div className={styles.msgBubble}>
              <p className={styles.msgText}>
                {msg.content || (msg.streaming ? "" : "—")}
                {msg.streaming && <span className={styles.cursor}>▌</span>}
              </p>
              {msg.role === "assistant" && !msg.streaming && msg.content && (
                <div className={styles.msgActions}>
                  <button
                    className={styles.msgActionBtn}
                    onClick={() => insertIntoEditor(msg.content)}
                    title="Insert into editor"
                  >
                    <Plus size={11} /> Insert
                  </button>
                  <button
                    className={styles.msgActionBtn}
                    onClick={() => copyMessage(msg.id, msg.content)}
                    title="Copy"
                  >
                    {copiedId === msg.id ? <CheckCheck size={11} /> : <Copy size={11} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick prompts ─────────────────────────────────────── */}
      {showPrompts && messages.length === 0 && (
        <div className={styles.quickSection}>
          <button
            className={styles.quickToggle}
            onClick={() => setShowPrompts(v => !v)}
          >
            <Lightbulb size={12} />
            Quick prompts
            <ChevronDown size={11} style={{ marginLeft: "auto", transform: showPrompts ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
          </button>
          <div className={styles.quickGrid}>
            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                className={styles.quickChip}
                onClick={() => send(prompt(title))}
                disabled={loading}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input area ────────────────────────────────────────── */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrap}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Ask AI anything about your article… (⌘↵ to send)"
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={2}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
            }}
            disabled={loading}
            aria-label="AI prompt input"
          />
          <button
            className={styles.sendBtn}
            onClick={() => send()}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            {loading
              ? <Loader2 size={14} className={styles.spin} />
              : <Send size={14} />
            }
          </button>
        </div>
        {!showPrompts && (
          <button className={styles.showPromptsBtn} onClick={() => setShowPrompts(true)}>
            <Lightbulb size={11} /> Show quick prompts
          </button>
        )}
      </div>
    </aside>
  );
}
