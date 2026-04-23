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
  Highlighter, Sparkles, Undo, Redo, Save,
  ChevronDown, Globe, Lock, Type, Palette, Upload, X, Video,
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

// IDs that mean "this is a brand-new article, not saved yet"
const PLACEHOLDER_IDS = new Set(["__new__", "new", "new-draft", ""]);

export default function EditorPage() {
  const params   = useParams();
  const router   = useRouter();
  const articleId = (params?.id as string) ?? "";
  const isNewArticle = PLACEHOLDER_IDS.has(articleId);

  const [title, setTitle]           = useState("");
  const [subtitle, setSubtitle]     = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [tagInput, setTagInput]     = useState("");
  const [status, setStatus]         = useState<PublishStatus>("draft");
  const [showAi, setShowAi]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [autoSaved, setAutoSaved]   = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [wordCountLimit]            = useState(50000);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [loading, setLoading]       = useState(!isNewArticle); // true while fetching existing article

  // Holds raw article content to inject once the editor is initialized
  const [pendingContent, setPendingContent] = useState<string | null>(null);

  // Track current font/size for showing in dropdown button
  const [activeFontLabel, setActiveFontLabel] = useState("Font");
  const [activeSizeLabel, setActiveSizeLabel] = useState("Size");

  const fontMenuRef   = useRef<HTMLDivElement>(null);
  const sizeMenuRef   = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const titleRef      = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit includes text-style — we pass our own so disable its default
      }),
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
        openOnClick: false, // we handle via handleClick below so we can open in new tab
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
      // Single click opens link in new tab; Ctrl/Cmd+click also works
      handleClick(view, pos, event) {
        const { state } = view;
        const $pos = state.doc.resolve(pos);
        const link = $pos.marks().find(m => m.type.name === "link");
        if (link) {
          const href = link.attrs.href as string;
          window.open(href, "_blank", "noopener,noreferrer");
          return true;
        }
        return false;
      },
    },
  });

  const wordCount = editor?.storage.characterCount.words()      ?? 0;
  const charCount = editor?.storage.characterCount.characters() ?? 0;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  // ── Load existing article from DB on mount ───────────────────
  useEffect(() => {
    if (isNewArticle) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        if (!res.ok) { console.error("Failed to load article", res.status); return; }
        const data = await res.json();
        setTitle(data.title       ?? "");
        setSubtitle(data.subtitle ?? "");
        setTags(data.tags         ?? []);
        setCoverImage(data.coverImage ?? null);
        setStatus(data.published ? "published" : "draft");
        // Store content to be injected once editor is ready
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

  // ── Inject loaded content once editor is initialised ─────────
  useEffect(() => {
    if (!editor || !pendingContent) return;
    editor.commands.setContent(pendingContent);
    setPendingContent(null);
  }, [editor, pendingContent]);

  // Close dropdowns on outside-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) setShowFontMenu(false);
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) setShowSizeMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Auto-save every 30 s ─────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!title.trim() && !editor?.getText().trim()) return;
      if (isNewArticle) return; // nothing saved yet, skip auto-save
      try {
        const res = await fetch(`/api/articles/${articleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, subtitle,
            content:    editor?.getHTML() ?? "",
            tags, coverImage,
            published:  status === "published",
          }),
        });
        if (res.ok) {
          setAutoSaved(true);
          setTimeout(() => setAutoSaved(false), 2000);
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [title, subtitle, editor, tags, coverImage, status, articleId]);

  // ── Save / Publish ───────────────────────────────────────────
  const handleSave = useCallback(async (publish = false) => {
    if (!title.trim()) { toast.error("Please add a title."); return; }

    setSaving(true);
    try {
      const payload = {
        title, subtitle,
        content:   editor?.getHTML() ?? "",
        tags, coverImage,
        published: publish,
      };

      if (isNewArticle) {
        // Create a brand-new article via POST
        const res = await fetch("/api/articles", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        // Redirect to the real article id so future saves use PUT
        router.replace(`/editor/${data.id}`);
      } else {
        // Update existing article via PUT
        const res = await fetch(`/api/articles/${articleId}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
      }

      if (publish) { setStatus("published"); toast.success("Article published! 🎉"); }
      else         { toast.success("Draft saved ✓"); }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Save error:", msg);
      toast.error(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  }, [title, subtitle, editor, tags, coverImage, articleId, isNewArticle, router]);

  const addTag = (t?: string) => {
    const raw = (t ?? tagInput).trim().toLowerCase().replace(/\s+/g, "-");
    if (raw && !tags.includes(raw) && tags.length < 5) {
      setTags([...tags, raw]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // ── Toolbar actions ──────────────────────────────────────────
  const handleAddLink = useCallback(() => {
    const prev = editor?.getAttributes("link").href ?? "";
    const url  = window.prompt("Enter URL:", prev);
    if (url === null) return; // cancelled
    if (url === "")  { editor?.chain().focus().unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleAddImage = useCallback(() => {
    const url = window.prompt("Image URL (or paste a web URL):");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleAddVideo = useCallback(() => {
    const url = window.prompt("YouTube / Vimeo URL:");
    if (!url) return;
    // Convert youtube watch URL to embed
    const ytMatch   = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vimMatch  = url.match(/vimeo\.com\/(\d+)/);
    let embedUrl = url;
    if (ytMatch)  embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    if (vimMatch) embedUrl = `https://player.vimeo.com/video/${vimMatch[1]}`;
    // Insert an iframe node via raw HTML
    editor?.chain().focus().insertContent(
      `<iframe src="${embedUrl}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius:12px;margin:1rem 0;display:block"></iframe>`
    ).run();
  }, [editor]);

  const handleSetFontFamily = useCallback((font: string, label: string) => {
    editor?.chain().focus().run(); // ensure focus first
    if (font) {
      editor?.chain().focus().setFontFamily(font).run();
    } else {
      editor?.chain().focus().unsetFontFamily().run();
    }
    setActiveFontLabel(label || "Font");
    setShowFontMenu(false);
  }, [editor]);

  const handleSetFontSize = useCallback((size: string) => {
    editor?.chain().focus().run();
    editor?.chain().focus().setFontSize(size).run();
    setActiveSizeLabel(size);
    setShowSizeMenu(false);
  }, [editor]);

  const currentColor = (editor?.getAttributes("textStyle")?.color as string | undefined) ?? "";

  // Cover image
  const handleCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Image must be under 5 MB.");    return; }
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
      { icon: AlignLeft,    label: "Align left",    action: () => editor?.chain().focus().setTextAlign("left").run(),    active: () => editor?.isActive({ textAlign: "left" }) },
      { icon: AlignCenter,  label: "Align center",  action: () => editor?.chain().focus().setTextAlign("center").run(),  active: () => editor?.isActive({ textAlign: "center" }) },
      { icon: AlignRight,   label: "Align right",   action: () => editor?.chain().focus().setTextAlign("right").run(),   active: () => editor?.isActive({ textAlign: "right" }) },
      { icon: AlignJustify, label: "Justify",       action: () => editor?.chain().focus().setTextAlign("justify").run(), active: () => editor?.isActive({ textAlign: "justify" }) },
    ],
    [
      { icon: List,        label: "Bullet list",  action: () => editor?.chain().focus().toggleBulletList().run(),  active: () => editor?.isActive("bulletList") },
      { icon: ListOrdered, label: "Ordered list", action: () => editor?.chain().focus().toggleOrderedList().run(), active: () => editor?.isActive("orderedList") },
      { icon: Quote,       label: "Blockquote",   action: () => editor?.chain().focus().toggleBlockquote().run(), active: () => editor?.isActive("blockquote") },
      { icon: Code,        label: "Code",         action: () => editor?.chain().focus().toggleCode().run(),       active: () => editor?.isActive("code") },
    ],
    [
      { icon: LinkIcon,  label: "Add link",  action: handleAddLink,  active: () => editor?.isActive("link") },
      { icon: ImageIcon, label: "Add image", action: handleAddImage, active: undefined },
      { icon: Video,     label: "Embed video", action: handleAddVideo, active: undefined },
    ],
  ];

  if (loading) {
    return (
      <div className={styles.layout}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-secondary)", fontSize: "1rem", gap: "0.75rem" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Loading article…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
          <div className={styles.wordStats}>
            <span>{wordCount.toLocaleString()} words</span>
            <span>·</span>
            <span>{readTime} min read</span>
            <span>·</span>
            <span>{charCount.toLocaleString()} chars</span>
          </div>
        </div>
        <div className={styles.topRight}>
          <button
            className={`btn btn-ghost btn-sm ${showAi ? styles.aiBtnActive : ""}`}
            onClick={() => setShowAi(!showAi)}
            aria-pressed={showAi}
          >
            <Sparkles size={15} />
            AI Assistant
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleSave(false)} disabled={saving}>
            <Save size={14} />
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleSave(true)} disabled={saving}>
            <Globe size={14} />
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {/* ── Main editor area ──────────────────────────────── */}
        <main className={styles.main}>

          {/* ── Cover image ── */}
          <div
            className={`${styles.coverArea} ${coverImage ? styles.coverAreaHasImage : ""}`}
            onClick={() => coverInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload cover image"
          >
            {coverImage ? (
              <>
                <img src={coverImage} alt="Cover" className={styles.coverPreview} />
                <button
                  className={styles.coverRemove}
                  onClick={(e) => { e.stopPropagation(); setCoverImage(null); }}
                  aria-label="Remove cover image"
                  type="button"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <div className={styles.coverPlaceholder}>
                <Upload size={24} />
                <span>Add a cover image</span>
                <span className={styles.coverHint}>Recommended: 1200 × 630px, under 5 MB</span>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className={styles.coverInput}
              onChange={handleCoverUpload}
              tabIndex={-1}
            />
          </div>

          {/* ── Title section ── */}
          <div className={styles.titleSection}>
            <span className={styles.titleLabel}>Title</span>
            <textarea
              ref={titleRef}
              className={styles.titleInput}
              placeholder="Enter your blog title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={1}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }}
              maxLength={150}
              aria-label="Article title"
              id="article-title"
            />
            {title && (
              <span className={styles.titleCharCount}>{title.length} / 150</span>
            )}
          </div>

          {/* ── Subtitle ── */}
          <textarea
            className={styles.subtitleInput}
            placeholder="Add a subtitle (optional)…"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={1}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
            maxLength={300}
            aria-label="Article subtitle"
          />

          <hr className={styles.divider} />

          {/* ── Formatting toolbar ──────────────────────────── */}
          <div className={styles.toolbar} role="toolbar" aria-label="Formatting toolbar">
            {toolbarGroups.map((group, gi) => (
              <div key={gi} className={styles.toolbarGroup}>
                {group.map((btn) => {
                  const { icon: Icon, label, action } = btn;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const isActive = (btn as any).active?.() ?? false;
                  return (
                    <button
                      key={label}
                      className={`${styles.toolbarBtn} ${isActive ? styles.toolbarBtnActive : ""}`}
                      onClick={action}
                      aria-label={label}
                      title={label}
                      type="button"
                    >
                      <Icon size={15} />
                    </button>
                  );
                })}
                {gi < toolbarGroups.length - 1 && <div className={styles.toolbarDivider} />}
              </div>
            ))}

            {/* ── Font family dropdown ── */}
            <div className={styles.toolbarGroup}>
              <div className={styles.toolbarDivider} />
              <div ref={fontMenuRef} className={styles.fontDropdown}>
                <button
                  className={styles.toolbarSelect}
                  onClick={() => { setShowFontMenu(v => !v); setShowSizeMenu(false); }}
                  title="Font family"
                  type="button"
                  aria-label="Font family"
                >
                  <Type size={13} />
                  <span className={styles.selectLabel}>{activeFontLabel}</span>
                  <ChevronDown size={11} />
                </button>
                {showFontMenu && (
                  <div className={styles.dropdownMenu}>
                    {FONTS.map((f) => (
                      <button
                        key={f.value || "__default__"}
                        className={`${styles.dropdownItem} ${activeFontLabel === f.label ? styles.dropdownItemActive : ""}`}
                        style={{ fontFamily: f.value || "inherit" }}
                        onMouseDown={(e) => {
                          e.preventDefault(); // keep editor focus
                          handleSetFontFamily(f.value, f.label);
                        }}
                        type="button"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Font size dropdown ── */}
              <div ref={sizeMenuRef} className={styles.fontDropdown}>
                <button
                  className={styles.toolbarSelect}
                  onClick={() => { setShowSizeMenu(v => !v); setShowFontMenu(false); }}
                  title="Font size"
                  type="button"
                  aria-label="Font size"
                >
                  <span className={styles.selectLabel}>{activeSizeLabel}</span>
                  <ChevronDown size={11} />
                </button>
                {showSizeMenu && (
                  <div className={styles.dropdownMenu}>
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        className={`${styles.dropdownItem} ${activeSizeLabel === s ? styles.dropdownItemActive : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault(); // keep editor focus
                          handleSetFontSize(s);
                        }}
                        type="button"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Font color picker ── */}
              <div className={styles.colorPickerWrapper} title="Font color">
                <Palette size={13} />
                <input
                  type="color"
                  className={styles.colorInput}
                  value={currentColor || "#f0f4ff"}
                  onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                  aria-label="Font color"
                />
                <div className={styles.colorSwatch} style={{ background: currentColor || "var(--text-primary)" }} />
              </div>
            </div>

            {/* ── Voice button ── */}
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
              {tags.map((t) => (
                <span key={t} className={styles.tag}>
                  #{t}
                  <button className={styles.tagRemove} onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`} type="button">×</button>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  className={styles.tagInput}
                  placeholder={tags.length === 0 ? "Add up to 5 tags…" : "Add tag…"}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                  aria-label="Add tag"
                />
              )}
            </div>
            {tags.length < 5 && (
              <div className={styles.suggestedTags}>
                <span className={styles.suggestedLabel}>Suggestions:</span>
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map((t) => (
                  <button key={t} className={styles.suggestedTag} onClick={() => addTag(t)} type="button">
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ── AI assistant panel ── */}
        {showAi && <AiAssistant editor={editor} onClose={() => setShowAi(false)} title={title} />}
      </div>

      {/* ── Inline AI toolbar (floats above selected text, global) ── */}
      <InlineAiToolbar editor={editor} />
    </div>
  );
}
