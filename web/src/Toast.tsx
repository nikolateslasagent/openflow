import { useState, useCallback, useRef, useEffect } from "react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

const COLORS = {
  success: { bg: "#dcfce7", border: "#86efac", text: "#166534", icon: "✓" },
  error: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "✕" },
  info: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "ℹ" },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = ++counter.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const ToastContainer = () => (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => {
        const c = COLORS[t.type];
        return (
          <div key={t.id} style={{
            padding: "10px 16px", borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`,
            color: c.text, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", animation: "slideIn 0.2s ease-out",
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}>
            <span>{c.icon}</span> {t.message}
          </div>
        );
      })}
    </div>
  );

  return { addToast, ToastContainer };
}
