import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef } from "react";
const COLORS = {
    success: { bg: "#dcfce7", border: "#86efac", text: "#166534", icon: "✓" },
    error: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "✕" },
    info: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "ℹ" },
};
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const counter = useRef(0);
    const addToast = useCallback((message, type = "info") => {
        const id = ++counter.current;
        setToasts(t => [...t, { id, message, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    }, []);
    const ToastContainer = () => (_jsx("div", { style: { position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }, children: toasts.map(t => {
            const c = COLORS[t.type];
            return (_jsxs("div", { style: {
                    padding: "10px 16px", borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`,
                    color: c.text, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", animation: "slideIn 0.2s ease-out",
                    fontFamily: "'Inter', -apple-system, sans-serif",
                }, children: [_jsx("span", { children: c.icon }), " ", t.message] }, t.id));
        }) }));
    return { addToast, ToastContainer };
}
