"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AccentColor =
  | "blue" | "purple" | "green" | "pink"
  | "orange" | "red" | "gold" | "teal" | "indigo" | "rose";

export interface AccentPalette {
  id: AccentColor;
  label: string;
  hex: string;
  h: number; // HSL hue
  s: number; // HSL saturation %
}

export const ACCENT_PALETTES: AccentPalette[] = [
  { id: "blue",   label: "Blue",   hex: "#348fff", h: 213, s: 100 },
  { id: "purple", label: "Purple", hex: "#8b5cf6", h: 258, s: 90  },
  { id: "green",  label: "Green",  hex: "#22c55e", h: 142, s: 71  },
  { id: "pink",   label: "Pink",   hex: "#ec4899", h: 330, s: 81  },
  { id: "orange", label: "Orange", hex: "#f97316", h: 25,  s: 95  },
  { id: "red",    label: "Red",    hex: "#ef4444", h: 0,   s: 84  },
  { id: "gold",   label: "Gold",   hex: "#f59e0b", h: 38,  s: 92  },
  { id: "teal",   label: "Teal",   hex: "#14b8a6", h: 174, s: 80  },
  { id: "indigo", label: "Indigo", hex: "#6366f1", h: 239, s: 84  },
  { id: "rose",   label: "Rose",   hex: "#fb7185", h: 351, s: 95  },
];

interface AccentContextT {
  accent: AccentColor;
  palette: AccentPalette;
  setAccent: (a: AccentColor) => void;
}

const AccentContext = createContext<AccentContextT>({
  accent:    "blue",
  palette:   ACCENT_PALETTES[0],
  setAccent: () => {},
});

function applyAccent(palette: AccentPalette) {
  const root = document.documentElement;
  const { h, s } = palette;
  // Update every brand token
  root.style.setProperty("--brand-300", `hsl(${h},${s}%,75%)`);
  root.style.setProperty("--brand-400", `hsl(${h},${s}%,62%)`);
  root.style.setProperty("--brand-500", `hsl(${h},${s}%,52%)`);
  root.style.setProperty("--brand-600", `hsl(${h},${s}%,42%)`);
  root.style.setProperty("--brand-700", `hsl(${h},${s}%,30%)`);
  root.style.setProperty("--ring-color", `hsla(${h},${s}%,52%,0.22)`);
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>("blue");

  // Load saved accent on mount
  useEffect(() => {
    const saved = localStorage.getItem("ws-accent") as AccentColor | null;
    if (saved && ACCENT_PALETTES.find((p) => p.id === saved)) {
      setAccentState(saved);
      const pal = ACCENT_PALETTES.find((p) => p.id === saved)!;
      applyAccent(pal);
    }
  }, []);

  function setAccent(a: AccentColor) {
    setAccentState(a);
    localStorage.setItem("ws-accent", a);
    const pal = ACCENT_PALETTES.find((p) => p.id === a)!;
    applyAccent(pal);
  }

  const palette = ACCENT_PALETTES.find((p) => p.id === accent)!;

  return (
    <AccentContext.Provider value={{ accent, palette, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}
