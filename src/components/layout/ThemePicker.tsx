"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Palette, X, Users, Share2, Zap } from "lucide-react";
import { useTheme, THEMES, type Theme, type CustomColors } from "./ThemeProvider";
import styles from "./ThemePicker.module.css";

// Fields shown in the custom builder. Three colors is enough visual
// control for most users — surface is derived from bg at apply time.
const CUSTOM_FIELDS: { key: keyof CustomColors; label: string }[] = [
  { key: "bg",     label: "Background Color" },
  { key: "accent", label: "Accent Highlight" },
  { key: "text",   label: "Typography Color" },
];

export function ThemePicker() {
  const { theme, setTheme, customColors, setCustomColors } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CustomColors>(customColors);
  const [mounted, setMounted] = useState(false);

  // Portal needs the DOM — avoid SSR mismatch
  useEffect(() => { setMounted(true); }, []);

  // Keep the draft in sync with current stored customColors when modal opens
  useEffect(() => { if (open) setDraft(customColors); }, [open, customColors]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  function applyPreset(id: Theme) {
    setTheme(id);
  }

  function applyChanges() {
    // If user tweaked the custom colors, switch to custom theme and persist.
    // Otherwise just close — preset was already applied on click.
    const changed =
      draft.bg !== customColors.bg ||
      draft.accent !== customColors.accent ||
      draft.text !== customColors.text ||
      draft.surface !== customColors.surface;
    if (changed) {
      setCustomColors(draft);
      setTheme("custom");
    }
    setOpen(false);
  }

  const previewStyle: React.CSSProperties = {
    ["--previewBg" as string]:     theme === "custom" ? draft.bg     : current.bg,
    ["--previewAccent" as string]: theme === "custom" ? draft.accent : current.accent,
  };

  return (
    <>
      <button
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="Change theme"
        title="Appearance"
      >
        <Palette size={16} />
        <span className={styles.triggerDot} style={{ background: current.accent }} />
      </button>

      {mounted && open && createPortal(
        <div
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Appearance settings"
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={previewStyle}
          >
            {/* ── Left: presets + builder ── */}
            <div className={styles.left}>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Appearance</h2>
                  <p className={styles.subtitle}>Personalize your creative environment</p>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              <div className={styles.sectionLabel}>Presets</div>
              <div className={styles.presetGrid}>
                {THEMES.filter((t) => t.id !== "custom").map((t) => (
                  <button
                    key={t.id}
                    className={`${styles.preset} ${theme === t.id ? styles.presetActive : ""}`}
                    onClick={() => applyPreset(t.id)}
                    aria-pressed={theme === t.id}
                    title={t.vibe}
                  >
                    <div className={styles.presetSwatch} style={{ background: t.bg }}>
                      <div className={styles.presetSwatchAccent} style={{ background: t.accent }} />
                    </div>
                    <span className={styles.presetLabel}>{t.label}</span>
                  </button>
                ))}
              </div>

              <div className={styles.sectionLabel}>Custom Theme Builder</div>
              <div className={styles.builder}>
                {CUSTOM_FIELDS.map(({ key, label }) => (
                  <div key={key} className={styles.builderRow}>
                    <span className={styles.builderLabel}>{label}</span>
                    <span className={styles.builderHex}>{draft[key].toUpperCase()}</span>
                    <button
                      className={styles.builderSwatch}
                      style={{ background: draft[key] }}
                      aria-label={`Pick ${label}`}
                    >
                      <input
                        type="color"
                        value={draft[key]}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, [key]: e.target.value, surface: key === "bg" ? e.target.value : d.surface }))
                        }
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button className={styles.actionBtn}>
                  <Users size={13} /> Community Themes
                </button>
                <button className={styles.actionBtn}>
                  <Share2 size={13} /> Share Preset
                </button>
              </div>
            </div>

            {/* ── Right: live preview ── */}
            <div className={styles.right}>
              <div className={styles.previewLabel}>Live Interface Preview</div>
              <div className={styles.previewWindow}>
                <div className={styles.previewTrafficDots}>
                  <span /><span /><span />
                </div>
                <div className={`${styles.previewBar} ${styles.previewBarMed}`} />
                <div className={`${styles.previewBar} ${styles.previewBarShort}`} />
                <div className={styles.previewCardPreview}>
                  <div className={styles.previewCardIcon} />
                  <div className={styles.previewCardLines}>
                    <div className={`${styles.previewBar} ${styles.previewBarMed}`} />
                    <div className={`${styles.previewBar} ${styles.previewBarShort}`} />
                  </div>
                </div>
                <div className={styles.previewFab} />
              </div>

              <div className={styles.previewSlider}>
                <Zap size={14} />
                <div className={styles.previewSliderTrack}>
                  <div className={styles.previewSliderFill} />
                </div>
              </div>

              <button className={styles.applyBtn} onClick={applyChanges}>
                Apply Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
