"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme =
  | "midnight" | "forest" | "blush" | "ocean"
  | "sunset" | "monochrome" | "lavender" | "custom";

export interface ThemeDefinition {
  id: Theme;
  label: string;
  vibe: string;
  bg: string;
  accent: string;
  isDark: boolean;
}

export const THEMES: ThemeDefinition[] = [
  { id: "midnight",   label: "Midnight",   vibe: "Dark, focused",     bg: "#050A14", accent: "#3B82F6", isDark: true  },
  { id: "forest",     label: "Forest",     vibe: "Calm, natural",     bg: "#0E1F16", accent: "#C9943A", isDark: true  },
  { id: "blush",      label: "Blush",      vibe: "Soft, creative",    bg: "#FDF6F0", accent: "#E8637A", isDark: false },
  { id: "ocean",      label: "Ocean",      vibe: "Clean, fresh",      bg: "#050D1F", accent: "#00C2CB", isDark: true  },
  { id: "sunset",     label: "Sunset",     vibe: "Warm, energetic",   bg: "#12060F", accent: "#FF5E3A", isDark: true  },
  { id: "monochrome", label: "Monochrome", vibe: "Minimal, serious",  bg: "#FFFFFF", accent: "#333333", isDark: false },
  { id: "lavender",   label: "Lavender",   vibe: "Dreamy, soft",      bg: "#F3F0FF", accent: "#7C3AED", isDark: false },
  { id: "custom",     label: "Custom",     vibe: "Full freedom",      bg: "#0a0e1a", accent: "#348fff", isDark: true  },
];

export interface CustomColors {
  bg: string;
  accent: string;
  text: string;
  surface: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  customColors: CustomColors;
  setCustomColors: (c: CustomColors) => void;
}

const DEFAULT_CUSTOM: CustomColors = {
  bg:      "#0a0e1a",
  accent:  "#348fff",
  text:    "#f0f4ff",
  surface: "#111827",
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "midnight",
  setTheme: () => {},
  customColors: DEFAULT_CUSTOM,
  setCustomColors: () => {},
});

// CSS vars that applyCustomTheme may set as inline styles.
// Kept here so we can wipe them when leaving the "custom" theme.
const CUSTOM_VARS = [
  "--bg-base",
  "--bg-surface",
  "--text-primary",
  "--brand-400",
  "--brand-500",
  "--brand-600",
] as const;

function clearCustomTheme() {
  const root = document.documentElement;
  for (const v of CUSTOM_VARS) root.style.removeProperty(v);
}

function applyCustomTheme(colors: CustomColors) {
  const root = document.documentElement;
  root.style.setProperty("--bg-base",      colors.bg);
  root.style.setProperty("--bg-surface",   colors.surface);
  root.style.setProperty("--text-primary", colors.text);
  root.style.setProperty("--brand-500",    colors.accent);
  root.style.setProperty("--brand-400",    colors.accent);
  root.style.setProperty("--brand-600",    colors.accent);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("midnight");
  const [customColors, setCustomColorsState] = useState<CustomColors>(DEFAULT_CUSTOM);

  useEffect(() => {
    const saved = localStorage.getItem("ws-theme") as Theme | null;
    const savedCustom = localStorage.getItem("ws-custom-colors");
    if (savedCustom) {
      try { setCustomColorsState(JSON.parse(savedCustom)); } catch {}
    }
    const t = saved && THEMES.find(th => th.id === saved) ? saved : "midnight";
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    if (t === "custom" && savedCustom) {
      try { applyCustomTheme(JSON.parse(savedCustom)); } catch {}
    } else {
      clearCustomTheme();
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("ws-theme", t);
    // Inline styles from custom mode would otherwise "stick" and override
    // the preset's stylesheet rules — wipe them first, then reapply only if needed.
    clearCustomTheme();
    if (t === "custom") applyCustomTheme(customColors);
  };

  const setCustomColors = (c: CustomColors) => {
    setCustomColorsState(c);
    localStorage.setItem("ws-custom-colors", JSON.stringify(c));
    if (theme === "custom") applyCustomTheme(c);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
