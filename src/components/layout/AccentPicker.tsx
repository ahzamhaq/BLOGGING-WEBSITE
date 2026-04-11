"use client";

import { useAccent, ACCENT_PALETTES, type AccentColor } from "@/components/layout/AccentProvider";
import { Check, Palette } from "lucide-react";
import { useState } from "react";
import styles from "./AccentPicker.module.css";

export function AccentPicker() {
  const { accent, setAccent } = useAccent();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Change accent color"
        title="Change accent color"
      >
        <Palette size={15} />
        <span className={styles.preview} style={{ background: ACCENT_PALETTES.find((p) => p.id === accent)?.hex }} />
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden />
          <div className={styles.panel} role="dialog" aria-label="Accent color picker">
            <p className={styles.panelTitle}>Accent Color</p>
            <div className={styles.grid}>
              {ACCENT_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  className={`${styles.swatch} ${accent === pal.id ? styles.swatchActive : ""}`}
                  style={{ background: pal.hex }}
                  onClick={() => { setAccent(pal.id as AccentColor); setOpen(false); }}
                  aria-label={pal.label}
                  title={pal.label}
                >
                  {accent === pal.id && <Check size={12} strokeWidth={3} />}
                </button>
              ))}
            </div>
            <p className={styles.panelHint}>
              Color applies instantly and is saved across sessions.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
