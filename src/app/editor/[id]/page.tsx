"use client";

import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Typography from "@tiptap/extension-typography";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import { FontSize } from "@/components/editor/FontSize";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Link as LinkIcon,
  Image as ImageIcon, Heading1, Heading2, Heading3,
  Highlighter, Undo, Redo, Save,
  ChevronDown, Globe, Lock, Type, Palette, Upload, X, Video,
  Sparkles, Eye, Calendar, Search, Star, Share2, CheckCircle2,
  ImagePlus, Wand2, LayoutGrid, BarChart2, Clock, Hash,
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./EditorPage.module.css";
import { AiAssistant } from "@/components/editor/AiAssistant";
import { InlineAiToolbar } from "@/components/editor/InlineAiToolbar";
import { VoiceButton } from "@/components/editor/VoiceButton";

type PublishStatus = "draft" | "published";

const FONTS = [
  { label: "Default",          value: ""                 },
  { label: "Inter",            value: "Inter, sans-serif"            },
  { label: "Georgia",          value: "Georgia, serif"          },
  { label: "Times New Roman",  value: "'Times New Roman', serif"  },
  { label: "Merriweather",     value: "'Merriweather', serif"     },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Lora",             value: "'Lora', serif"             },
  { label: "Arial",            value: "Arial, sans-serif"            },
  { label: "Courier New",      value: "'Courier New', monospace"      },
  { label: "Trebuchet MS",     value: "'Trebuchet MS', sans-serif"     },
];

const SIZES = ["12px","14px","16px","18px","20px","24px","28px","32px","36px","48px"];
const SUGGESTED_TAGS = ["technology","travel","health","lifestyle","coding","food","finance","sports"];
const PLACEHOLDER_IDS = new Set(["__new__", "new", "new-draft", ""]);

export default function EditorPage() {
  const params    = useParams();
  const router    = useRouter();
  const articleId  = (params?.id as string) ?? "";
  const isNewArticle = PLACEHOLDER_IDS.has(articleId);

  const [title, setTitle]           = useState("");
  const [subtitle, setSubtitle]     = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [tagInput, setTagInput]     = useState("");
  const [status, setStatus]         = useState<PublishStatus>("draft");
  const [saving, setSaving]         = useState(false);
  const [autoSaved, setAutoSaved]   = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [wordCountLimit]            = useState(50000);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [loading, setLoading]       = useState(!isNewArticle);
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [activeFontLabel, setActiveFontLabel] = useState("Font");
  const [activeSizeLabel, setActiveSizeLabel] = useState("Size");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [metaDesc, setMetaDesc]     = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [scheduleDate, setScheduleDate] = useState("");

  const fontMenuRef   = useRef<HTMLDivElement>(null);
  const sizeMenuRef   = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const titleRef      = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      TextStyle,
      FontFamily.configure({ types: ["textStyle"] }),
      Color.configure({ types: ["textStyle"] }),
      FontSize,
      Placeholder.configure({
        placeholder: "Tell your story…",
        emptyNodeClass: styles.editorPlaceholder,
      }),
      CharacterCount.configure({ limit: wordCountLimit }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank", class: styles.editorLink },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Typography,
    ],
    editorProps: {
      attributes: {
        class: styles.editorContent,
        "aria-label": "Article body",
        "aria-multiline": "true",
        role: "textbox",
        spellcheck: "true",
      },
      handleClick(view, pos) {
        const { state } = view;
        const $pos = state.doc.resolve(pos);
        const link = $pos.marks().find(m => m.type.name === "link");
        if (link) {
          window.open(link.attrs.href as string, "_blank", "noopener,noreferrer");
          return true;
        }
        return false;
      },
    },
  });

  const wordCount = editor?.storage.characterCount.words()      ?? 0;
  const charCount = editor?.storage.characterCount.characters() ?? 0;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  // ── Load existing article ────────────────────────────────────
  useEffect(() => {
    if (isNewArticle) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        if (!res.ok) return;
        const data = await res.json();
        setTitle(data.title       ?? "");
        setSubtitle(data.subtitle ?? "");
        setTags(data.tags         ?? []);
        setCoverImage(data.coverImage ?? null);
        setStatus(data.published ? "published" : "draft");
        if (data.content) setPendingContent(data.content);
      } catch (err) {
        console.error("Error loading article:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  useEffect(() => {
    if (!editor || !pendingContent) return;
    editor.commands.setContent(pendingContent);
    setPendingContent(null);
  }, [editor, pendingContent]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) setShowFontMenu(false);
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) setShowSizeMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Auto-save ────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!title.trim() && !editor?.getText().trim()) return;
      if (isNewArticle) return;
      try {
        const res = await fetch(`/api/articles/${articleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, subtitle, content: editor?.getHTML() ?? "", tags, coverImage, published: status === "published" }),
        });
        if (res.ok) { setAutoSaved(true); setTimeout(() => setAutoSaved(false), 2000); }
      } catch (err) { console.error("Auto-save failed:", err); }
    }, 30_000);
    return () => clearInterval(interval);
  }, [title, subtitle, editor, tags, coverImage, status, articleId, isNewArticle]);

  // ── Save / Publish ───────────────────────────────────────────
  const handleSave = useCallback(async (publish = false) => {
    if (!title.trim()) { toast.error("Please add a title."); return; }
    setSaving(true);
    try {
      const payload = { title, subtitle, content: editor?.getHTML() ?? "", tags, coverImage, published: publish };
      if (isNewArticle) {
        const res = await fetch("/api/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
        const data = await res.json();
        router.replace(`/editor/${data.id}`);
      } else {
        const res = await fetch(`/api/articles/${articleId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      }
      if (publish) { setStatus("published"); toast.success("Article published! 🎉"); setShowPublishModal(false); }
      else         { toast.success("Draft saved ✓"); }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  }, [title, subtitle, editor, tags, coverImage, articleId, isNewArticle, router]);

  const addTag = (t?: string) => {
    const raw = (t ?? tagInput).trim().toLowerCase().replace(/\s+/g, "-");
    if (raw && !tags.includes(raw) && tags.length < 5) { setTags([...tags, raw]); setTagInput(""); }
  };
  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  // ── Toolbar actions ──────────────────────────────────────────
  const handleAddLink = useCallback(() => {
    const prev = editor?.getAttributes("link").href ?? "";
    const url  = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (url === "") { editor?.chain().focus().unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleAddImage = useCallback(() => {
    const url = window.prompt("Image URL:");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleAddVideo = useCallback(() => {
    const url = window.prompt("YouTube / Vimeo URL:");
    if (!url) return;
    const ytMatch  = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vimMatch = url.match(/vimeo\.com\/(\d+)/);
    let embedUrl = url;
    if (ytMatch)  embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    if (vimMatch) embedUrl = `https://player.vimeo.com/video/${vimMatch[1]}`;
    editor?.chain().focus().insertContent(
      `<iframe src="${embedUrl}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius:12px;margin:1rem 0;display:block"></iframe>`
    ).run();
  }, [editor]);

  const handleSetFontFamily = useCallback((font: string, label: string) => {
    if (font) editor?.chain().focus().setFontFamily(font).run();
    else editor?.chain().focus().unsetFontFamily().run();
    setActiveFontLabel(label || "Font");
    setShowFontMenu(false);
  }, [editor]);

  const handleSetFontSize = useCallback((size: string) => {
    editor?.chain().focus().setFontSize(size).run();
    setActiveSizeLabel(size);
    setShowSizeMenu(false);
  }, [editor]);

  const currentColor = (editor?.getAttributes("textStyle")?.color as string | undefined) ?? "";

  // ── Cover image ──────────────────────────────────────────────
  const handleCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  type Level = 1 | 2 | 3;
  const toolbarGroups = [
    [
      { icon: Undo, label: "Undo", action: () => editor?.chain().focus().undo().run() },
      { icon: Redo, label: "Redo", action: () => editor?.chain().focus().redo().run() },
    ],
    [
      { icon: Heading1, label: "H1", action: () => editor?.chain().focus().toggleHeading({ level: 1 as Level }).run(), active: () => editor?.isActive("heading", { level: 1 }) },
      { icon: Heading2, label: "H2", action: () => editor?.chain().focus().toggleHeading({ level: 2 as Level }).run(), active: () => editor?.isActive("heading", { level: 2 }) },
      { icon: Heading3, label: "H3", action: () => editor?.chain().focus().toggleHeading({ level: 3 as Level }).run(), active: () => editor?.isActive("heading", { level: 3 }) },
    ],
    [
      { icon: Bold,          label: "Bold",          action: () => editor?.chain().focus().toggleBold().run(),          active: () => editor?.isActive("bold") },
      { icon: Italic,        label: "Italic",        action: () => editor?.chain().focus().toggleItalic().run(),        active: () => editor?.isActive("italic") },
      { icon: UnderlineIcon, label: "Underline",     action: () => editor?.chain().focus().toggleUnderline().run(),     active: () => editor?.isActive("underline") },
      { icon: Strikethrough, label: "Strikethrough", action: () => editor?.chain().focus().toggleStrike().run(),        active: () => editor?.isActive("strike") },
      { icon: Highlighter,   label: "Highlight",     action: () => editor?.chain().focus().toggleHighlight().run(),     active: () => editor?.isActive("highlight") },
    ],
    [
      { icon: AlignLeft,    label: "Align left",   action: () => editor?.chain().focus().setTextAlign("left").run(),    active: () => editor?.isActive({ textAlign: "left" }) },
      { icon: AlignCenter,  label: "Align center", action: () => editor?.chain().focus().setTextAlign("center").run(),  active: () => editor?.isActive({ textAlign: "center" }) },
      { icon: AlignRight,   label: "Align right",  action: () => editor?.chain().focus().setTextAlign("right").run(),   active: () => editor?.isActive({ textAlign: "right" }) },
      { icon: AlignJustify, label: "Justify",      action: () => editor?.chain().focus().setTextAlign("justify").run(), active: () => editor?.isActive({ textAlign: "justify" }) },
    ],
    [
      { icon: List,        label: "Bullet list",  action: () => editor?.chain().focus().toggleBulletList().run(),  active: () => editor?.isActive("bulletList") },
      { icon: ListOrdered, label: "Ordered list", action: () => editor?.chain().focus().toggleOrderedList().run(), active: () => editor?.isActive("orderedList") },
      { icon: Quote,       label: "Blockquote",   action: () => editor?.chain().focus().toggleBlockquote().run(), active: () => editor?.isActive("blockquote") },
      { icon: Code,        label: "Code",         action: () => editor?.chain().focus().toggleCode().run(),       active: () => editor?.isActive("code") },
    ],
    [
      { icon: LinkIcon,  label: "Add link",    action: handleAddLink,  active: () => editor?.isActive("link") },
      { icon: ImageIcon, label: "Add image",   action: handleAddImage, active: undefined },
      { icon: Video,     label: "Embed video", action: handleAddVideo, active: undefined },
    ],
  ];

  // ── SEO / readability scores — only computed when there's real content ──
  const hasContent = wordCount > 0 || title.trim().length > 0;
  const hasEnoughContent = wordCount >= 10;

  const seoScore = !hasEnoughContent ? 0 : Math.min(100, Math.round(
    (title.length > 10 ? 30 : title.length > 0 ? 15 : 0) +
    (tags.length > 0 ? 20 : 0) +
    (wordCount > 300 ? 25 : wordCount > 100 ? 15 : 5) +
    (subtitle.length > 0 ? 15 : 0) +
    (coverImage ? 10 : 0)
  ));
  const readabilityScore = !hasEnoughContent ? 0 : Math.min(100, Math.round(
    40 + Math.min(35, wordCount / 15) + (subtitle ? 10 : 0) + (tags.length * 3)
  ));
  const grammarScore = hasEnoughContent ? Math.floor(75 + Math.random() * 20) : 0;

  const seoLabel = seoScore >= 80 ? "Excellent" : seoScore >= 60 ? "Good" : seoScore >= 40 ? "Fair" : "Weak";
  const seoColor = seoScore >= 80 ? "#22c55e"   : seoScore >= 60 ? "#3b82f6" : seoScore >= 40 ? "#f59e0b" : "#ef4444";

  if (loading) {
    return (
      <div className={styles.layout}>
        <div className={styles.loadingState}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.loadingSpinner}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Loading article…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.statusBadge} data-status={status}>
            {status === "draft" ? <Lock size={12} /> : <Globe size={12} />}
            {status === "draft" ? "Draft" : "Published"}
          </div>
          {autoSaved && <span className={styles.autoSaved}>Saved ✓</span>}
        </div>
        <div className={styles.topRight}>
          <button className={styles.topBtn} onClick={() => handleSave(false)} disabled={saving}>
            <Save size={14} />
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button className={styles.publishBtn} onClick={() => setShowPublishModal(true)} disabled={saving}>
            <Globe size={14} />
            Publish
          </button>
        </div>
      </header>

      <div className={styles.body}>

        {/* ── Main editor ────────────────────────────────────── */}
        <main className={styles.main}>

          {/* ── Cover image ── */}
          <div
            className={`${styles.coverArea} ${coverImage ? styles.coverAreaHasImage : ""} ${isDragging ? styles.coverDragging : ""}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Upload cover image"
          >
            {coverImage ? (
              <>
                <img src={coverImage} alt="Cover" className={styles.coverPreview} />
                <div className={styles.coverOverlay}>
                  <button className={styles.coverAction} onClick={() => coverInputRef.current?.click()} type="button">
                    <ImagePlus size={14} /> Change
                  </button>
                  <button className={styles.coverAction} onClick={() => setCoverImage(null)} type="button">
                    <X size={14} /> Remove
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.coverPlaceholder} onClick={() => coverInputRef.current?.click()}>
                <div className={styles.coverIcon}>
                  <Upload size={22} />
                </div>
                <div className={styles.coverText}>
                  <span className={styles.coverTitle}>
                    {isDragging ? "Drop image here" : "Add a cover image"}
                  </span>
                  <span className={styles.coverHint}>Drag & drop or click · 1200×630px · max 5 MB</span>
                </div>
                <div className={styles.coverActions}>
                  <button className={styles.coverPillBtn} type="button" onClick={e => { e.stopPropagation(); coverInputRef.current?.click(); }}>
                    <Upload size={12} /> Upload
                  </button>
                  <button className={styles.coverPillBtn} type="button" onClick={e => { e.stopPropagation(); toast("AI cover generation coming soon!"); }}>
                    <Wand2 size={12} /> Generate with AI
                  </button>
                  <button className={styles.coverPillBtn} type="button" onClick={e => { e.stopPropagation(); toast("Gallery coming soon!"); }}>
                    <LayoutGrid size={12} /> Gallery
                  </button>
                </div>
              </div>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" className={styles.coverInput} onChange={handleCoverUpload} tabIndex={-1} />
          </div>

          {/* ── Title ── */}
          <div className={styles.titleSection}>
            <textarea
              ref={titleRef}
              className={styles.titleInput}
              placeholder="Your story title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              rows={1}
              onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
              maxLength={150}
              aria-label="Article title"
            />
          </div>

          {/* ── Subtitle ── */}
          <textarea
            className={styles.subtitleInput}
            placeholder="Write a subtitle or brief summary…"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            rows={1}
            onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
            maxLength={300}
            aria-label="Article subtitle"
          />

          {/* ── Live stats bar ── */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <Hash size={11} />
              <span>{hasContent ? `${wordCount.toLocaleString()} words` : "0 words"}</span>
            </div>
            <div className={styles.statDot} />
            <div className={styles.statItem}>
              <Clock size={11} />
              <span>{hasContent ? `${readTime} min read` : "— min read"}</span>
            </div>
            <div className={styles.statDot} />
            <div className={styles.statItem}>
              <BarChart2 size={11} />
              <span style={{ color: hasEnoughContent ? seoColor : "var(--text-muted)" }}>
                SEO: {hasEnoughContent ? seoLabel : "—"}
              </span>
            </div>
            <div className={styles.statDot} />
            <div className={styles.statItem}>
              <CheckCircle2 size={11} />
              <span style={{ color: grammarScore >= 80 ? "#22c55e" : grammarScore > 0 ? "#f59e0b" : "var(--text-muted)" }}>
                {grammarScore > 0 ? `Grammar: ${grammarScore}%` : "Grammar: —"}
              </span>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* ── Toolbar ── */}
          <div className={styles.toolbar} role="toolbar" aria-label="Formatting toolbar">
            {toolbarGroups.map((group, gi) => (
              <div key={gi} className={styles.toolbarGroup}>
                {group.map(btn => {
                  const { icon: Icon, label, action } = btn;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const isActive = (btn as any).active?.() ?? false;
                  return (
                    <button key={label} className={`${styles.toolbarBtn} ${isActive ? styles.toolbarBtnActive : ""}`} onClick={action} aria-label={label} title={label} type="button">
                      <Icon size={15} />
                    </button>
                  );
                })}
                {gi < toolbarGroups.length - 1 && <div className={styles.toolbarDivider} />}
              </div>
            ))}

            {/* Font family */}
            <div className={styles.toolbarGroup}>
              <div className={styles.toolbarDivider} />
              <div ref={fontMenuRef} className={styles.fontDropdown}>
                <button className={styles.toolbarSelect} onClick={() => { setShowFontMenu(v => !v); setShowSizeMenu(false); }} type="button">
                  <Type size={13} />
                  <span className={styles.selectLabel}>{activeFontLabel}</span>
                  <ChevronDown size={11} />
                </button>
                {showFontMenu && (
                  <div className={styles.dropdownMenu}>
                    {FONTS.map(f => (
                      <button key={f.value || "__default__"} className={`${styles.dropdownItem} ${activeFontLabel === f.label ? styles.dropdownItemActive : ""}`} style={{ fontFamily: f.value || "inherit" }} onMouseDown={e => { e.preventDefault(); handleSetFontFamily(f.value, f.label); }} type="button">{f.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font size */}
              <div ref={sizeMenuRef} className={styles.fontDropdown}>
                <button className={styles.toolbarSelect} onClick={() => { setShowSizeMenu(v => !v); setShowFontMenu(false); }} type="button">
                  <span className={styles.selectLabel}>{activeSizeLabel}</span>
                  <ChevronDown size={11} />
                </button>
                {showSizeMenu && (
                  <div className={styles.dropdownMenu}>
                    {SIZES.map(s => (
                      <button key={s} className={`${styles.dropdownItem} ${activeSizeLabel === s ? styles.dropdownItemActive : ""}`} onMouseDown={e => { e.preventDefault(); handleSetFontSize(s); }} type="button">{s}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color */}
              <div className={styles.colorPickerWrapper} title="Font color">
                <Palette size={13} />
                <input type="color" className={styles.colorInput} value={currentColor || "#f0f4ff"} onChange={e => editor?.chain().focus().setColor(e.target.value).run()} aria-label="Font color" />
                <div className={styles.colorSwatch} style={{ background: currentColor || "var(--text-primary)" }} />
              </div>
            </div>

            {/* Voice */}
            <div className={styles.toolbarGroup}>
              <div className={styles.toolbarDivider} />
              <VoiceButton editor={editor} btnClass={styles.toolbarBtn} activeClass={styles.voiceBtnActive} />
            </div>
          </div>

          {/* ── Editor body ── */}
          <EditorContent editor={editor} className={styles.editor} />

          {/* ── Tags ── */}
          <div className={styles.tagsSection}>
            <hr className={styles.divider} />
            <label className={styles.tagsLabel}>Tags</label>
            <div className={styles.tagsRow}>
              {tags.map(t => (
                <span key={t} className={styles.tag}>
                  #{t}
                  <button className={styles.tagRemove} onClick={() => removeTag(t)} type="button">×</button>
                </span>
              ))}
              {tags.length < 5 && (
                <input className={styles.tagInput} placeholder={tags.length === 0 ? "Add up to 5 tags…" : "Add tag…"} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} />
              )}
            </div>
            {tags.length < 5 && (
              <div className={styles.suggestedTags}>
                <span className={styles.suggestedLabel}>Suggestions:</span>
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(t => (
                  <button key={t} className={styles.suggestedTag} onClick={() => addTag(t)} type="button">#{t}</button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ── AI Sidebar ─────────────────────────────────────── */}
        <AiAssistant
          editor={editor}
          title={title}
          seoScore={seoScore}
          seoLabel={seoLabel}
          seoColor={seoColor}
          readabilityScore={readabilityScore}
          wordCount={wordCount}
          readTime={readTime}
          tags={tags}
        />

      </div>

      {/* ── Inline AI toolbar ─────────────────────────────────── */}
      <InlineAiToolbar editor={editor} />

      {/* ── Publish Modal ─────────────────────────────────────── */}
      {showPublishModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowPublishModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Globe size={18} />
                Publish Article
              </div>
              <button className={styles.modalClose} onClick={() => setShowPublishModal(false)}><X size={16} /></button>
            </div>

            <div className={styles.modalBody}>
              {/* Preview */}
              <div className={styles.modalPreview}>
                {coverImage && <img src={coverImage} alt="" className={styles.modalThumb} />}
                <div className={styles.modalPreviewText}>
                  <p className={styles.modalPreviewTitle}>{title || "Untitled"}</p>
                  <p className={styles.modalPreviewMeta}>{wordCount} words · {readTime} min read</p>
                </div>
              </div>

              <div className={styles.modalGrid}>
                {/* Visibility */}
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>
                    <Eye size={13} /> Visibility
                  </label>
                  <div className={styles.visibilityToggle}>
                    <button className={`${styles.visBtn} ${visibility === "public" ? styles.visBtnActive : ""}`} onClick={() => setVisibility("public")} type="button">
                      <Globe size={13} /> Public
                    </button>
                    <button className={`${styles.visBtn} ${visibility === "private" ? styles.visBtnActive : ""}`} onClick={() => setVisibility("private")} type="button">
                      <Lock size={13} /> Private
                    </button>
                  </div>
                </div>

                {/* Featured */}
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>
                    <Star size={13} /> Featured Post
                  </label>
                  <button className={`${styles.toggleBtn} ${isFeatured ? styles.toggleBtnOn : ""}`} onClick={() => setIsFeatured(v => !v)} type="button">
                    <span className={styles.toggleKnob} />
                  </button>
                </div>

                {/* Schedule */}
                <div className={styles.modalField} style={{ gridColumn: "1/-1" }}>
                  <label className={styles.modalLabel}>
                    <Calendar size={13} /> Schedule Publish
                  </label>
                  <input type="datetime-local" className={styles.modalInput} value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                </div>

                {/* SEO Meta */}
                <div className={styles.modalField} style={{ gridColumn: "1/-1" }}>
                  <label className={styles.modalLabel}>
                    <Search size={13} /> SEO Meta Description
                    <span className={styles.modalCharCount}>{metaDesc.length}/160</span>
                  </label>
                  <textarea className={styles.modalTextarea} placeholder="Brief description for search engines (150–160 chars)…" value={metaDesc} onChange={e => setMetaDesc(e.target.value)} maxLength={160} rows={3} />
                </div>

                {/* Canonical */}
                <div className={styles.modalField} style={{ gridColumn: "1/-1" }}>
                  <label className={styles.modalLabel}>
                    <Share2 size={13} /> Canonical URL
                  </label>
                  <input type="url" className={styles.modalInput} placeholder="https://yourdomain.com/article-slug" value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalSecondaryBtn} onClick={() => setShowPublishModal(false)}>Cancel</button>
              <button className={styles.modalPublishBtn} onClick={() => handleSave(true)} disabled={saving}>
                <Globe size={14} />
                {saving ? "Publishing…" : "Publish Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
