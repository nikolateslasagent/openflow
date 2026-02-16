import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Node Presets — save and restore node configurations
 */
import { useState } from "react";
const STORAGE_KEY = "openflow_node_presets";
export function getPresets() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }
    catch {
        return [];
    }
}
export function savePreset(preset) {
    const presets = getPresets();
    presets.unshift(preset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
export function deletePreset(id) {
    const presets = getPresets().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
export function PresetsPanel({ onCreateNode }) {
    const [presets, setPresets] = useState(getPresets);
    const handleDelete = (id) => {
        deletePreset(id);
        setPresets(getPresets());
    };
    return (_jsxs("div", { style: { padding: 16 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }, children: "\u2B50 My Presets" }), _jsx("div", { style: { fontSize: 10, color: "#9ca3af", marginBottom: 12 }, children: "Saved node configurations" }), presets.length === 0 && (_jsx("div", { style: { fontSize: 11, color: "#9ca3af", textAlign: "center", padding: 20 }, children: "No presets yet. Click the \u2B50 icon on any node to save its settings as a preset." })), presets.map(p => (_jsxs("div", { style: { padding: "10px 12px", background: "#f9f9fb", borderRadius: 10, marginBottom: 6, cursor: "pointer" }, onClick: () => onCreateNode(p.defId, p.values), onMouseOver: e => { e.currentTarget.style.background = "#f0f0f3"; }, onMouseOut: e => { e.currentTarget.style.background = "#f9f9fb"; }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [_jsx("span", { style: { fontSize: 14 }, children: p.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: "#1a1a1a" }, children: p.name }), _jsxs("div", { style: { fontSize: 9, color: "#9ca3af" }, children: [p.defName, " \u00B7 ", new Date(p.createdAt).toLocaleDateString()] })] }), _jsx("button", { onClick: (e) => { e.stopPropagation(); handleDelete(p.id); }, style: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, padding: "2px 4px" }, children: "\uD83D\uDDD1" })] }), _jsx("div", { style: { fontSize: 9, color: "#6b7280", marginTop: 4 }, children: Object.entries(p.values).filter(([, v]) => v !== undefined && v !== "").slice(0, 3).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`).join(" · ") })] }, p.id)))] }));
}
