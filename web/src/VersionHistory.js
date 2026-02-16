import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * VersionHistory — Track and restore node output versions
 * Sprint 11
 */
import { useState, useCallback } from "react";
const STORAGE_KEY = "openflow_versions";
function loadVersions() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }
    catch {
        return [];
    }
}
function persistVersions(versions) {
    // Keep max 500 versions
    if (versions.length > 500)
        versions.length = 500;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
}
export function saveVersion(nodeId, outputUrl, type, prompt, model) {
    const versions = loadVersions();
    const nodeVersions = versions.filter(v => v.nodeId === nodeId);
    const nextVersion = nodeVersions.length > 0 ? Math.max(...nodeVersions.map(v => v.version)) + 1 : 1;
    const version = {
        id: `${nodeId}_v${nextVersion}`,
        nodeId,
        version: nextVersion,
        outputUrl,
        type,
        timestamp: Date.now(),
        prompt,
        model,
    };
    versions.unshift(version);
    persistVersions(versions);
    return version;
}
export function getVersions(nodeId) {
    return loadVersions().filter(v => v.nodeId === nodeId).sort((a, b) => b.version - a.version);
}
export function VersionDropdown({ nodeId, onRestore, onPreview }) {
    const [open, setOpen] = useState(false);
    const [versions, setVersions] = useState([]);
    const toggle = useCallback(() => {
        if (!open)
            setVersions(getVersions(nodeId));
        setOpen(o => !o);
    }, [open, nodeId]);
    if (getVersions(nodeId).length < 2)
        return null;
    return (_jsxs("div", { style: { position: "relative", display: "inline-block" }, children: [_jsxs("button", { onClick: toggle, style: {
                    padding: "4px 10px", borderRadius: 6, border: "1px solid #e8e8eb", background: "#f5f5f7",
                    fontSize: 10, fontWeight: 600, cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", gap: 4,
                }, children: ["\uD83D\uDCCB v", getVersions(nodeId)[0]?.version || 1, " \u25BE"] }), open && (_jsxs("div", { style: {
                    position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#fff", border: "1px solid #e8e8eb",
                    borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 200, maxHeight: 300, overflowY: "auto",
                }, children: [_jsx("div", { style: { padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#9ca3af", borderBottom: "1px solid #f0f0f0" }, children: "Version History" }), versions.map(v => (_jsxs("div", { style: {
                            padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f8f8f8",
                            cursor: "pointer", fontSize: 11,
                        }, onMouseOver: (e) => { e.currentTarget.style.background = "#f5f5f7"; }, onMouseOut: (e) => { e.currentTarget.style.background = "transparent"; }, children: [v.type === "image" && (_jsx("img", { src: v.outputUrl, alt: `v${v.version}`, style: { width: 32, height: 32, borderRadius: 4, objectFit: "cover" }, onClick: () => onPreview?.(v.outputUrl, "image") })), v.type === "video" && (_jsx("div", { onClick: () => onPreview?.(v.outputUrl, "video"), style: { width: 32, height: 32, borderRadius: 4, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }, children: "\u25B6" })), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontWeight: 600, color: "#374151" }, children: ["v", v.version] }), _jsx("div", { style: { fontSize: 9, color: "#9ca3af" }, children: new Date(v.timestamp).toLocaleTimeString() })] }), _jsx("button", { onClick: (e) => { e.stopPropagation(); onRestore(v); setOpen(false); }, style: { padding: "3px 8px", borderRadius: 4, border: "1px solid #e8e8eb", background: "#fff", fontSize: 9, fontWeight: 600, cursor: "pointer", color: "#c026d3" }, children: "Restore" })] }, v.id)))] }))] }));
}
