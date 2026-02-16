/**
 * ThemeEngine — Sprint 15: Multi-theme system with CSS custom properties
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface ThemeDef {
  id: string;
  name: string;
  swatch: string[]; // 3-4 preview colors
  vars: Record<string, string>;
}

export const THEMES: ThemeDef[] = [
  {
    id: "default",
    name: "Default",
    swatch: ["#ffffff", "#0e0e10", "#c026d3", "#f0f0f2"],
    vars: {
      "--of-canvas-bg": "#f0f0f2",
      "--of-canvas-dot": "#c0c0c6",
      "--of-toolbar-bg": "#0e0e10",
      "--of-toolbar-text": "#6b6b75",
      "--of-toolbar-active": "#c026d3",
      "--of-flyout-bg": "#ffffff",
      "--of-flyout-border": "#ebebee",
      "--of-node-bg": "#ffffff",
      "--of-node-border": "#e8e8eb",
      "--of-node-text": "#1a1a1a",
      "--of-node-muted": "#9ca3af",
      "--of-accent": "#c026d3",
      "--of-accent-text": "#ffffff",
      "--of-topbar-bg": "#0e0e10",
      "--of-topbar-border": "#1e1e22",
      "--of-topbar-text": "#9ca3af",
      "--of-input-bg": "#f5f5f7",
      "--of-card-bg": "#ffffff",
      "--of-card-border": "#e8e8eb",
      "--of-body-text": "#1a1a1a",
      "--of-muted-text": "#6b7280",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    swatch: ["#0a0a0f", "#16161e", "#a855f7", "#1e1e2a"],
    vars: {
      "--of-canvas-bg": "#0e0e14",
      "--of-canvas-dot": "#2a2a36",
      "--of-toolbar-bg": "#08080c",
      "--of-toolbar-text": "#555568",
      "--of-toolbar-active": "#a855f7",
      "--of-flyout-bg": "#12121a",
      "--of-flyout-border": "#1e1e2a",
      "--of-node-bg": "#16161e",
      "--of-node-border": "#24243a",
      "--of-node-text": "#e0e0e8",
      "--of-node-muted": "#6b6b80",
      "--of-accent": "#a855f7",
      "--of-accent-text": "#ffffff",
      "--of-topbar-bg": "#08080c",
      "--of-topbar-border": "#1a1a26",
      "--of-topbar-text": "#7a7a90",
      "--of-input-bg": "#1a1a24",
      "--of-card-bg": "#14141c",
      "--of-card-border": "#22223a",
      "--of-body-text": "#e0e0e8",
      "--of-muted-text": "#7a7a90",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    swatch: ["#0c1929", "#132d4a", "#0ea5e9", "#1e3a5f"],
    vars: {
      "--of-canvas-bg": "#0c1929",
      "--of-canvas-dot": "#1e3a5f",
      "--of-toolbar-bg": "#071320",
      "--of-toolbar-text": "#4a7a9f",
      "--of-toolbar-active": "#0ea5e9",
      "--of-flyout-bg": "#0e1e33",
      "--of-flyout-border": "#1a3050",
      "--of-node-bg": "#112640",
      "--of-node-border": "#1e3a5f",
      "--of-node-text": "#d0e8ff",
      "--of-node-muted": "#5a8aaf",
      "--of-accent": "#0ea5e9",
      "--of-accent-text": "#ffffff",
      "--of-topbar-bg": "#071320",
      "--of-topbar-border": "#152940",
      "--of-topbar-text": "#6a9abf",
      "--of-input-bg": "#132d4a",
      "--of-card-bg": "#0e1e33",
      "--of-card-border": "#1a3050",
      "--of-body-text": "#d0e8ff",
      "--of-muted-text": "#6a9abf",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    swatch: ["#1a1008", "#2d1a0a", "#f97316", "#3d2210"],
    vars: {
      "--of-canvas-bg": "#1a1008",
      "--of-canvas-dot": "#3d2210",
      "--of-toolbar-bg": "#120a04",
      "--of-toolbar-text": "#8a6040",
      "--of-toolbar-active": "#f97316",
      "--of-flyout-bg": "#1e1208",
      "--of-flyout-border": "#3a2210",
      "--of-node-bg": "#241808",
      "--of-node-border": "#3d2210",
      "--of-node-text": "#fde8cc",
      "--of-node-muted": "#a07850",
      "--of-accent": "#f97316",
      "--of-accent-text": "#ffffff",
      "--of-topbar-bg": "#120a04",
      "--of-topbar-border": "#2a1808",
      "--of-topbar-text": "#a08060",
      "--of-input-bg": "#2d1a0a",
      "--of-card-bg": "#1e1208",
      "--of-card-border": "#3a2210",
      "--of-body-text": "#fde8cc",
      "--of-muted-text": "#a08060",
    },
  },
];

interface ThemeContextValue {
  theme: ThemeDef;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[0],
  setThemeId: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState(() => localStorage.getItem("openflow_theme") || "default");
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    localStorage.setItem("openflow_theme", id);
  }, []);

  // Apply CSS vars to :root
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(theme.vars)) {
      root.style.setProperty(k, v);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeSelector() {
  const { theme, setThemeId } = useTheme();
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--of-muted-text)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Theme</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {THEMES.map(t => (
          <button key={t.id} onClick={() => setThemeId(t.id)}
            style={{
              padding: 10, background: theme.id === t.id ? "var(--of-accent)" + "18" : "var(--of-input-bg)",
              border: theme.id === t.id ? `2px solid var(--of-accent)` : "1px solid var(--of-flyout-border)",
              borderRadius: 10, cursor: "pointer", textAlign: "left",
            }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              {t.swatch.map((c, i) => (
                <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: c, border: "1px solid rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--of-body-text)" }}>{t.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
