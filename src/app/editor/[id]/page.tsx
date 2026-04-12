"use client";

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
  ChevronDown, Globe, Lock, Type, Palette, Upload, X
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./EditorPage.module.css";
import { AiAssistant } from "@/components/editor/AiAssistant";
import { VoiceButton } from "@/components/editor/VoiceButton";

type PublishStatus = "draft" | "published";

const FONTS = [
  { label: "Default",          value: ""                 },
  { label: "Inter",            value: "Inter"            },
  { label: "Georgia",          value: "Georgia"          },
  { label: "Times New Roman",  value: "Times New Roman"  },
  { label: "Merriweather",     value: "Merriweather"     },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Lora",             value: "Lora"             },
  { label: "Arial",            value: "Arial"            },
  { label: "Calibri",          value: "Calibri"          },
  { label: "Trebuchet MS",     value: "Trebuchet MS"     },
  { label: "Courier New",      value: "Courier New"      },
];

const SIZES = ["12px","14px","16px","18px","20px","24px","28px","32px","36px","48px"];

const SUGGESTED_TAGS = ["technology","travel","health","lifestyle","coding","food","finance","sports"];

export default function EditorPage() {
  const [title, setTitle]       = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tags, setTags]         = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus]     = useState<PublishStatus>("draft");
  const [showAi, setShowAi]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [wordCountLimit]        = useState(50000);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const sizeMenuRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Color,
      FontSize,
      Placeholder.configure({
        placeholder: "Tell your story…",
        emptyNodeClass: styles.editorPlaceholder,
      }),
      CharacterCount.configure({ limit: wordCountLimit }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
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
    },
  });

  const wordCount = editor?.storage.characterCount.words() ?? 0;
  const charCount = editor?.storage.characterCount.characters() ?? 0;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  // ── Auto-save every 30 seconds ──────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!title.trim() && !editor?.getText().trim()) return;
      // TODO: persist to Supabase /api/articles/draft when API is ready
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 30000);
    return () => clearInterval(interval);
  }, [title, editor]);

  const handleSave = useCallback(async (publish = false) => {
    if (!title.trim()) { toast.error("Please add a title."); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // TODO: API call
    if (publish) {
      setStatus("published");
      toast.success("Article published!");
    } else {
      toast.success("Draft saved.");
    }
    setSaving(false);
  }, [title]);

  const addTag = (t?: string) => {
    const raw = (t ?? tagInput).trim().toLowerCase().replace(/\s+/g, "-");
    if (raw && !tags.includes(raw) && tags.length < 5) {
      setTags([...tags, raw]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const setLink = useCallback(() => {
    const url = window.prompt("URL:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const handleSetFontSize = useCallback((size: string) => {
    editor?.chain().focus().setFontSize(size).run();
    setShowSizeMenu(false);
  }, [editor]);

  const handleSetFontFamily = useCallback((font: string) => {
    if (font) {
      editor?.chain().focus().setFontFamily(font).run();
    } else {
      editor?.chain().focus().unsetFontFamily().run();
    }
    setShowFontMenu(false);
  }, [editor]);

  // Cover image handler
  const handleCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Current font values for display
  const currentFont = (editor?.getAttributes("textStyle")?.fontFamily as string | undefined) ?? "";
  const currentColor = (editor?.getAttributes("textStyle")?.color as string | undefined) ?? "";

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
      { icon: LinkIcon,  label: "Add link",  action: setLink, active: undefined },
      { icon: ImageIcon, label: "Add image", action: () => { const url = window.prompt("Image URL:"); if (url) editor?.chain().focus().setImage({ src: url }).run(); }, active: undefined },
    ],
  ];

  return (
    <div className={styles.layout}>
      {/* ── Top bar ───────────────────────────────────────────── */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.statusBadge} data-status={status}>
            {status === "draft" ? <Lock size={12} /> : <Globe size={12} />}
            {status === "draft" ? "Draft" : "Published"}
          </div>
          {autoSaved && (
            <span className={styles.autoSaved}>Saved</span>
          )}
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
          <div className={styles.publishGroup}>
            <button className="btn btn-primary btn-sm" onClick={() => handleSave(true)} disabled={saving}>
              <Globe size={14} />
              Publish
            </button>
            <button className={`btn btn-primary btn-sm ${styles.publishChevron}`} aria-label="Publish options">
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {/* ── Main editor area ─────────────────────────────── */}
        <main className={styles.main}>
          {/* ── Cover image upload ── */}
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

          {/* ── Title ── */}
          <textarea
            className={styles.titleInput}
            placeholder="Enter your blog title..."
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
          />

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

          {/* ── Formatting toolbar ─────────────────────────── */}
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
                  <span className={styles.selectLabel}>{currentFont || "Font"}</span>
                  <ChevronDown size={11} />
                </button>
                {showFontMenu && (
                  <div className={styles.dropdownMenu}>
                    {FONTS.map((f) => (
                      <button
                        key={f.value}
                        className={`${styles.dropdownItem} ${currentFont === f.value ? styles.dropdownItemActive : ""}`}
                        style={{ fontFamily: f.value || "inherit" }}
                        onClick={() => handleSetFontFamily(f.value)}
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
                  <span className={styles.selectLabel}>Size</span>
                  <ChevronDown size={11} />
                </button>
                {showSizeMenu && (
                  <div className={styles.dropdownMenu}>
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        className={styles.dropdownItem}
                        onClick={() => handleSetFontSize(s)}
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

          {/* ── Tags (below editor) ── */}
          <div className={styles.tagsSection}>
            <hr className={styles.divider} />
            <label className={styles.tagsLabel}>Tags</label>
            <div className={styles.tagsRow}>
              {tags.map((t) => (
                <span key={t} className={styles.tag}>
                  #{t}
                  <button className={styles.tagRemove} onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>×</button>
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
        {showAi && <AiAssistant editor={editor} onClose={() => setShowAi(false)} />}
      </div>
    </div>
  );
}
