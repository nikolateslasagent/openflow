import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Sprint 10: Generation Queue with Priorities
 */
import { useState, useCallback } from "react";
export function useGenerationQueue() {
    const [queue, setQueue] = useState([]);
    const [paused, setPaused] = useState(false);
    const addToQueue = useCallback((nodeId, prompt, model, priority = false) => {
        const item = {
            id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            nodeId, prompt, model, status: "queued", priority, position: 0,
            estimatedTime: "~12s", addedAt: Date.now(),
        };
        setQueue(prev => {
            const next = priority ? [item, ...prev] : [...prev, item];
            return next.map((q, i) => ({ ...q, position: i + 1 }));
        });
        return item.id;
    }, []);
    const removeFromQueue = useCallback((id) => {
        setQueue(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, position: i + 1 })));
    }, []);
    const updateStatus = useCallback((id, status) => {
        setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    }, []);
    const togglePriority = useCallback((id) => {
        setQueue(prev => {
            const item = prev.find(q => q.id === id);
            if (!item)
                return prev;
            const updated = { ...item, priority: !item.priority };
            const rest = prev.filter(q => q.id !== id);
            const next = updated.priority ? [updated, ...rest] : [...rest, updated];
            return next.map((q, i) => ({ ...q, position: i + 1 }));
        });
    }, []);
    const reorder = useCallback((fromIndex, toIndex) => {
        setQueue(prev => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next.map((q, i) => ({ ...q, position: i + 1 }));
        });
    }, []);
    const clearCompleted = useCallback(() => {
        setQueue(prev => prev.filter(q => q.status !== "done" && q.status !== "error").map((q, i) => ({ ...q, position: i + 1 })));
    }, []);
    return { queue, paused, setPaused, addToQueue, removeFromQueue, updateStatus, togglePriority, reorder, clearCompleted };
}
export function QueuePanel({ queue, paused, onPauseToggle, onTogglePriority, onRemove, onReorder, onClearCompleted }) {
    const [dragIdx, setDragIdx] = useState(null);
    if (queue.length === 0)
        return null;
    const active = queue.filter(q => q.status === "running").length;
    const pending = queue.filter(q => q.status === "queued").length;
    return (_jsxs("div", { style: { position: "fixed", bottom: 16, right: 16, width: 340, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 800, overflow: "hidden" }, children: [_jsxs("div", { style: { padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f5f7", borderBottom: "1px solid #e8e8eb" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("span", { style: { fontSize: 14 }, children: "\uD83D\uDCCB" }), _jsx("span", { style: { fontSize: 13, fontWeight: 700, color: "#1a1a1a" }, children: "Queue" }), _jsxs("span", { style: { padding: "2px 8px", background: "#c026d3", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700 }, children: [pending, " pending"] }), active > 0 && _jsxs("span", { style: { padding: "2px 8px", background: "#f59e0b", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700 }, children: [active, " running"] })] }), _jsxs("div", { style: { display: "flex", gap: 4 }, children: [_jsx("button", { onClick: onPauseToggle, style: { padding: "4px 10px", background: paused ? "#22c55e" : "#f59e0b", color: "#fff", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer" }, children: paused ? "▶ Resume" : "⏸ Pause" }), _jsx("button", { onClick: onClearCompleted, style: { padding: "4px 8px", background: "#f5f5f7", border: "1px solid #e8e8eb", borderRadius: 6, fontSize: 10, cursor: "pointer", color: "#6b7280" }, children: "Clear \u2713" })] })] }), _jsx("div", { style: { maxHeight: 280, overflowY: "auto" }, children: queue.map((item, idx) => (_jsxs("div", { draggable: true, onDragStart: () => setDragIdx(idx), onDragOver: e => { e.preventDefault(); }, onDrop: () => { if (dragIdx !== null && dragIdx !== idx)
                        onReorder(dragIdx, idx); setDragIdx(null); }, style: {
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
                        borderBottom: "1px solid #f5f5f7", cursor: "grab",
                        background: item.status === "running" ? "#fffbeb" : item.status === "done" ? "#f0fdf4" : item.status === "error" ? "#fef2f2" : "transparent",
                        opacity: dragIdx === idx ? 0.5 : 1,
                    }, children: [_jsxs("span", { style: { fontSize: 10, color: "#c4c4c8", fontWeight: 700, width: 16 }, children: ["#", item.position] }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: item.prompt.slice(0, 40) || "No prompt" }), _jsxs("div", { style: { fontSize: 9, color: "#9ca3af" }, children: [item.model, " \u00B7 ", item.estimatedTime] })] }), _jsxs("div", { style: { display: "flex", gap: 4 }, children: [item.status === "running" && _jsx("span", { style: { fontSize: 12 }, children: "\u23F3" }), item.status === "done" && _jsx("span", { style: { fontSize: 12 }, children: "\u2705" }), item.status === "error" && _jsx("span", { style: { fontSize: 12 }, children: "\u274C" }), _jsx("button", { onClick: () => onTogglePriority(item.id), title: "Toggle priority", style: { width: 22, height: 22, borderRadius: 4, border: "none", background: item.priority ? "#fef3c7" : "transparent", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }, children: item.priority ? "⭐" : "☆" }), _jsx("button", { onClick: () => onRemove(item.id), style: { width: 22, height: 22, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }, children: "\u2715" })] })] }, item.id))) })] }));
}
