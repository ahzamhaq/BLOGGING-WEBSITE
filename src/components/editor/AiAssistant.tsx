"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Sparkles, Send, Loader2, Wand2, FileText,
  Lightbulb, RefreshCw, Scissors, AlignJustify,
  BookOpen, Plus, ChevronDown, Copy, CheckCheck, Trash2,
  BarChart2, Eye, Tag, Type, TrendingUp, Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./AiAssistant.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface Props {
  editor: Editor | null;
  title?: string;
  seoScore?: number;
  seoLabel?: string;
  seoColor?: string;
  readabilityScore?: number;
  wordCount?: number;
  readTime?: number;
  tags?: string[];
}

const QUICK_PROMPTS = [
  { icon: BookOpen,     label: "Generate outline",     prompt: (t: string) => `Create a detailed blog post outline for an article titled "${t || "my article"}". Include 5-7 main sections with 2-3 bullet points each.` },
  { icon: Lightbulb,   label: "Write intro",           prompt: (t: string) => `Write a compelling introduction paragraph for a blog post titled "${t || "my article"}". Make it hook the reader immediately.` },
  { icon: Wand2,       label: "Improve selection",     prompt: () => `Improve the selected text in the editor for better clarity and impact.` },
  { icon: RefreshCw,   label: "Suggest title ideas",   prompt: (t: string) => `Suggest 5 creative, SEO-friendly title alternatives for an article about "${t || "this topic"}".` },
  { icon: AlignJustify,label: "Write conclusion",      prompt: (t: string) => `Write a strong conclusion for a blog post titled "${t || "my article"}". Summarize key takeaways and end with a call to action.` },
  { icon: Scissors,    label: "SEO meta description",  prompt: (t: string) => `Write a compelling SEO meta description (150-160 characters) for a blog post titled "${t || "my article"}".` },
  { icon: FileText,    label: "Expand content",        prompt: () => `Take the selected text from the editor and expand it with more detail, examples, and depth.` },
  { icon: Sparkles,    label: "Make it engaging",      prompt: () => `Rewrite the selected text to be more engaging, vivid, and compelling for readers.` },
];

const TRENDING_KEYWORDS = ["AI writing", "productivity", "developer tools", "content strategy", "SEO 2025", "remote work"];

const QUICK_IMPROVE_ACTIONS = [
  { icon: Zap,         label: "Fix grammar",       prompt: () => `Fix any grammar or spelling errors in my article content. Return corrected version.` },
  { icon: TrendingUp,  label: "Boost SEO",         prompt: (t: string) => `Suggest 5 specific ways to improve the SEO of my article titled "${t || "my article"}".` },
  { icon: Eye,         label: "Improve readability",prompt: () => `Suggest ways to improve the readability of my article. Break complex sentences, use active voice.` },
  { icon: Wand2,       label: "Sharpen title",      prompt: (t: string) => `Make this article title more compelling and click-worthy: "${t || "my article"}"` },
];

function uid() { return Math.random().toString(36).slice(2); }

function getEditorContext(editor: Editor | null) {
  if (!editor) return "";
  const { from, to } = editor.state.selection;
  if (from !== to) return editor.state.doc.textBetween(from, to, " ");
  return editor.getText().slice(0, 3000);
}

export function AiAssistant({
  editor,
  title = "",
  seoScore = 0,
  seoLabel = "Weak",
  seoColor = "#ef4444",
  readabilityScore = 0,
  wordCount = 0,
  readTime = 0,
  tags = [],
}: Props) {
  const [messages,     setMessages]    = useState<Message[]>([]);
  const [input,        setInput]       = useState("");
  const [loading,      setLoading]     = useState(false);
  const [showPrompts,  setShowPrompts] = useState(false);
  const [copiedId,     setCopiedId]    = useState<string | null>(null);
  const [activeTab,    setActiveTab]   = useState<"chat" | "insights">("insights");

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setShowPrompts(false);
    setActiveTab("chat");

    const userMsg: Message       = { id: uid(), role: "user",      content: text };
    const assistantId            = uid();
    const assistantMsg: Message  = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    const editorContext = getEditorContext(editor);
    const systemContext = [
      "You are an expert AI writing assistant embedded in a blogging platform.",
      "Help the writer craft high-quality, engaging articles. Be concise, specific, and actionable.",
      title ? `The article title is: "${title}".` : "",
      editorContext ? `Current article content (excerpt):\n"""\n${editorContext.slice(0, 1500)}\n"""` : "",
      "Format output cleanly — no unnecessary headers or markdown fencing unless explicitly asked.",
    ].filter(Boolean).join("\n");

    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${systemContext}\n\nUser request: ${text}` }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let errMsg = `AI request failed (${res.status})`;
        try { const d = await res.json(); errMsg = d.error ?? errMsg; } catch { /* ignore */ }
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
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: full } : m));
        }
      }

      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
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

  const clearChat = () => { setMessages([]); setShowPrompts(false); };

  // Only show content-based insights when user has actually started writing
  const hasContent = wordCount > 0 || title.trim().length > 0;
  const hasEnoughContent = wordCount >= 10;

  const suggestedTags = hasEnoughContent
    ? ["writing", "productivity", "technology", "design", "startup"].filter(t => !tags.includes(t)).slice(0, 4)
    : [];

  return (
    <aside className={styles.panel} aria-label="AI Writing Assistant">

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.sparkleWrap}><Sparkles size={13} /></div>
          <div>
            <span className={styles.headerTitle}>AI Assistant</span>
            <span className={styles.powered}>Gemini</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button className={styles.headerBtn} onClick={clearChat} title="Clear chat">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "insights" ? styles.tabActive : ""}`} onClick={() => setActiveTab("insights")}>
          <BarChart2 size={12} /> Insights
        </button>
        <button className={`${styles.tab} ${activeTab === "chat" ? styles.tabActive : ""}`} onClick={() => setActiveTab("chat")}>
          <Sparkles size={12} /> Chat
          {messages.length > 0 && <span className={styles.tabBadge}>{messages.filter(m => m.role === "assistant").length}</span>}
        </button>
      </div>

      {/* ── Insights Tab ── */}
      {activeTab === "insights" && (
        <div className={styles.insightsArea}>

          {/* Empty state — shown when nothing is written yet */}
          {!hasContent && (
            <div className={styles.insightsEmptyState}>
              <div className={styles.insightsEmptyIcon}><Sparkles size={22} /></div>
              <p className={styles.insightsEmptyTitle}>Start writing to unlock insights</p>
              <ul className={styles.insightsEmptyList}>
                <li>SEO analysis</li>
                <li>Readability score</li>
                <li>Smart tag suggestions</li>
                <li>AI improvements</li>
              </ul>
            </div>
          )}

          {/* SEO Score card — only when content exists */}
          {hasContent && (
            <div className={styles.scoreCard}>
              <div className={styles.scoreCardHeader}>
                <div className={styles.scoreCardIcon} style={{ background: `${seoColor}18` }}>
                  <TrendingUp size={13} style={{ color: seoColor }} />
                </div>
                <span className={styles.scoreCardTitle}>SEO Score</span>
                <span className={styles.scoreCardValue} style={{ color: seoColor }}>
                  {hasEnoughContent ? `${seoScore}/100` : "—"}
                </span>
              </div>
              <div className={styles.scoreBar}>
                <div className={styles.scoreBarFill} style={{ width: hasEnoughContent ? `${seoScore}%` : "0%", background: seoColor }} />
              </div>
              <span className={styles.scoreCardLabel} style={{ color: hasEnoughContent ? seoColor : "var(--text-muted)" }}>
                {hasEnoughContent ? seoLabel : "Write more to analyze"}
              </span>
            </div>
          )}

          {/* Readability card */}
          {hasContent && (
            <div className={styles.scoreCard}>
              <div className={styles.scoreCardHeader}>
                <div className={styles.scoreCardIcon} style={{ background: "rgba(139,92,246,0.12)" }}>
                  <Eye size={13} style={{ color: "#8b5cf6" }} />
                </div>
                <span className={styles.scoreCardTitle}>Readability</span>
                <span className={styles.scoreCardValue} style={{ color: "#8b5cf6" }}>
                  {hasEnoughContent ? `${readabilityScore}/100` : "—"}
                </span>
              </div>
              <div className={styles.scoreBar}>
                <div className={styles.scoreBarFill} style={{ width: hasEnoughContent ? `${readabilityScore}%` : "0%", background: "#8b5cf6" }} />
              </div>
              <span className={styles.scoreCardLabel} style={{ color: hasEnoughContent ? "#8b5cf6" : "var(--text-muted)" }}>
                {!hasEnoughContent ? "Write more to analyze" : readabilityScore >= 80 ? "Easy to read" : readabilityScore >= 60 ? "Moderate" : "Needs work"}
              </span>
            </div>
          )}

          {/* Stats card — only when there's something to show */}
          {hasContent && (
            <div className={styles.statsCard}>
              <div className={styles.statsCardRow}>
                <span className={styles.statsCardKey}>Words</span>
                <span className={styles.statsCardVal}>{wordCount > 0 ? wordCount.toLocaleString() : "—"}</span>
              </div>
              <div className={styles.statsCardRow}>
                <span className={styles.statsCardKey}>Read time</span>
                <span className={styles.statsCardVal}>{wordCount > 0 ? `${readTime} min` : "—"}</span>
              </div>
              <div className={styles.statsCardRow}>
                <span className={styles.statsCardKey}>Tags added</span>
                <span className={styles.statsCardVal}>{tags.length} / 5</span>
              </div>
            </div>
          )}

          {/* Suggested Tags — only when enough content */}
          {hasEnoughContent && suggestedTags.length > 0 && (
            <div className={styles.insightCard}>
              <div className={styles.insightCardHeader}>
                <Tag size={12} />
                <span>Suggested Tags</span>
              </div>
              <div className={styles.tagChips}>
                {suggestedTags.map(t => (
                  <span key={t} className={styles.tagChip}>#{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Improve — only when there's content to improve */}
          {hasEnoughContent && (
            <div className={styles.insightCard}>
              <div className={styles.insightCardHeader}>
                <Sparkles size={12} />
                <span>Quick Improve</span>
              </div>
              <div className={styles.quickImproveList}>
                {QUICK_IMPROVE_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                  <button key={label} className={styles.quickImproveBtn} onClick={() => send(prompt(title))} disabled={loading} type="button">
                    <Icon size={11} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Keywords — always shown as reference */}
          {hasContent && (
            <div className={styles.insightCard}>
              <div className={styles.insightCardHeader}>
                <TrendingUp size={12} />
                <span>Trending Keywords</span>
              </div>
              <div className={styles.trendingList}>
                {TRENDING_KEYWORDS.map((kw, i) => (
                  <div key={kw} className={styles.trendingItem}>
                    <span className={styles.trendingRank}>#{i + 1}</span>
                    <span className={styles.trendingKw}>{kw}</span>
                    <div className={styles.trendingBar}>
                      <div className={styles.trendingBarFill} style={{ width: `${100 - i * 12}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title Ideas — only when title exists */}
          {title.trim().length > 0 && (
            <div className={styles.insightCard}>
              <div className={styles.insightCardHeader}>
                <Type size={12} />
                <span>Title Ideas</span>
              </div>
              <button className={styles.generateBtn} onClick={() => send(`Suggest 4 creative, SEO-optimized alternative titles for: "${title}". Be specific and compelling.`)} disabled={loading} type="button">
                {loading ? <Loader2 size={11} className={styles.spin} /> : <Sparkles size={11} />}
                Generate title ideas
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Chat Tab ── */}
      {activeTab === "chat" && (
        <>
          <div className={styles.chatArea}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><Sparkles size={24} /></div>
                <p className={styles.emptyTitle}>Ask me anything</p>
                <p className={styles.emptyHint}>Get help with your article, generate content, improve writing, and more.</p>
                <button className={styles.showPromptsBtn} onClick={() => setShowPrompts(v => !v)} type="button">
                  <Lightbulb size={11} /> Quick prompts
                  <ChevronDown size={10} style={{ transform: showPrompts ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
                </button>
              </div>
            )}

            {showPrompts && messages.length === 0 && (
              <div className={styles.quickGrid}>
                {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                  <button key={label} className={styles.quickChip} onClick={() => send(prompt(title))} disabled={loading} type="button">
                    <Icon size={11} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`${styles.msg} ${styles[`msg_${msg.role}`]}`}>
                {msg.role === "assistant" && (
                  <div className={styles.msgAvatar}><Sparkles size={10} /></div>
                )}
                <div className={styles.msgBubble}>
                  <p className={styles.msgText}>
                    {msg.content || (msg.streaming ? "" : "—")}
                    {msg.streaming && <span className={styles.cursor}>▌</span>}
                  </p>
                  {msg.role === "assistant" && !msg.streaming && msg.content && (
                    <div className={styles.msgActions}>
                      <button className={styles.msgActionBtn} onClick={() => insertIntoEditor(msg.content)} title="Insert into editor">
                        <Plus size={11} /> Insert
                      </button>
                      <button className={styles.msgActionBtn} onClick={() => copyMessage(msg.id, msg.content)} title="Copy">
                        {copiedId === msg.id ? <CheckCheck size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div className={styles.inputArea}>
            <div className={styles.inputWrap}>
              <textarea
                ref={inputRef}
                className={styles.input}
                placeholder="Ask AI about your article… (⌘↵ to send)"
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={2}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
                disabled={loading}
                aria-label="AI prompt input"
              />
              <button className={styles.sendBtn} onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send" type="button">
                {loading ? <Loader2 size={14} className={styles.spin} /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
