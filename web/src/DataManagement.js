import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * DataManagement — Sprint 15: Import/Export/Clear all data
 */
import { useState, useRef } from "react";
const STORAGE_KEYS = [
    "openflow_assets",
    "openflow_fal_key",
    "openflow_openai_key",
    "openflow_replicate_key",
    "openflow_dark",
    "openflow_theme",
    "openflow_default_size",
    "openflow_default_model",
    "openflow_quality_preset",
    "openflow_token",
    "openflow_training_data",
    "openflow_node_comments",
    "openflow_versions",
    "openflow_presets",
    "openflow_prompts",
    "openflow_llm_endpoint",
];
function getAllData() {
    const data = {};
    for (const key of STORAGE_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) {
            try {
                data[key] = JSON.parse(val);
            }
            catch {
                data[key] = val;
            }
        }
    }
    // Also grab any openflow_ prefixed keys we missed
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("openflow_") && !(k in data)) {
            const val = localStorage.getItem(k);
            if (val !== null) {
                try {
                    data[k] = JSON.parse(val);
                }
                catch {
                    data[k] = val;
                }
            }
        }
    }
    data._exportedAt = new Date().toISOString();
    data._version = "OpenFlow v1.0";
    return data;
}
export function DataManagementSection({ onToast }) {
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const fileRef = useRef(null);
    const handleExport = () => {
        const data = getAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `openflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        onToast("All data exported!", "success");
    };
    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!data._version && !data._exportedAt) {
                    onToast("Invalid backup file", "error");
                    return;
                }
                let count = 0;
                for (const [key, val] of Object.entries(data)) {
                    if (key.startsWith("_"))
                        continue;
                    localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val));
                    count++;
                }
                onToast(`Imported ${count} data entries! Reloading...`, "success");
                setTimeout(() => window.location.reload(), 1500);
            }
            catch {
                onToast("Failed to parse backup file", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };
    const handleClear = () => {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith("openflow_"))
                localStorage.removeItem(k);
        }
        onToast("All data cleared! Reloading...", "success");
        setTimeout(() => window.location.reload(), 1500);
    };
    const handleExportAssets = () => {
        try {
            const assets = JSON.parse(localStorage.getItem("openflow_assets") || "[]");
            const urls = assets.map((a) => `${a.url}\t${a.model || ""}\t${a.prompt || ""}`).join("\n");
            const blob = new Blob([`# OpenFlow Asset URLs\n# URL\tModel\tPrompt\n${urls}`], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `openflow-assets-${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            onToast(`Exported ${assets.length} asset URLs`, "success");
        }
        catch {
            onToast("No assets to export", "error");
        }
    };
    return (_jsxs("div", { style: { marginTop: 16 }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "var(--of-muted-text, #9ca3af)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }, children: "Data Management" }), _jsx("button", { onClick: handleExport, style: { width: "100%", padding: "8px 12px", background: "var(--of-input-bg, #f5f5f7)", border: "1px solid var(--of-flyout-border, #ebebee)", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "var(--of-body-text, #1a1a1a)", textAlign: "left", marginBottom: 6 }, children: "\uD83D\uDCE6 Export All Data" }), _jsx("input", { ref: fileRef, type: "file", accept: ".json", onChange: handleImport, style: { display: "none" } }), _jsx("button", { onClick: () => fileRef.current?.click(), style: { width: "100%", padding: "8px 12px", background: "var(--of-input-bg, #f5f5f7)", border: "1px solid var(--of-flyout-border, #ebebee)", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "var(--of-body-text, #1a1a1a)", textAlign: "left", marginBottom: 6 }, children: "\uD83D\uDCE5 Import Data" }), _jsx("button", { onClick: handleExportAssets, style: { width: "100%", padding: "8px 12px", background: "var(--of-input-bg, #f5f5f7)", border: "1px solid var(--of-flyout-border, #ebebee)", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "var(--of-body-text, #1a1a1a)", textAlign: "left", marginBottom: 6 }, children: "\uD83D\uDDBC\uFE0F Export Asset URLs" }), !showClearConfirm ? (_jsx("button", { onClick: () => setShowClearConfirm(true), style: { width: "100%", padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#ef4444", textAlign: "left" }, children: "\uD83D\uDDD1\uFE0F Clear All Data" })) : (_jsxs("div", { style: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12 }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#991b1b", marginBottom: 8 }, children: "\u26A0\uFE0F This will delete ALL your data including API keys, assets, presets, and settings. This cannot be undone!" }), _jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx("button", { onClick: handleClear, style: { flex: 1, padding: "8px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }, children: "Yes, Clear Everything" }), _jsx("button", { onClick: () => setShowClearConfirm(false), style: { flex: 1, padding: "8px", background: "#fff", color: "#1a1a1a", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }, children: "Cancel" })] })] }))] }));
}
