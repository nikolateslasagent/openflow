import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * WorkspaceTabs — Sprint 15: Multiple canvas workspaces
 */
import { useState, useCallback } from "react";
function newWorkspace(index) {
    return {
        id: `ws_${Date.now()}_${index}`,
        name: `Workspace ${index}`,
        nodes: [],
        edges: [],
        dirty: false,
    };
}
export function useWorkspaceTabs() {
    const [workspaces, setWorkspaces] = useState([newWorkspace(1)]);
    const [activeIndex, setActiveIndex] = useState(0);
    const activeWorkspace = workspaces[activeIndex] || workspaces[0];
    const addWorkspace = useCallback(() => {
        setWorkspaces(prev => [...prev, newWorkspace(prev.length + 1)]);
        setActiveIndex(workspaces.length);
    }, [workspaces.length]);
    const closeWorkspace = useCallback((index) => {
        const ws = workspaces[index];
        if (ws.dirty) {
            if (!confirm(`"${ws.name}" has unsaved changes. Close anyway?`))
                return;
        }
        if (workspaces.length <= 1)
            return; // Keep at least one
        setWorkspaces(prev => prev.filter((_, i) => i !== index));
        if (activeIndex >= index && activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
        }
    }, [workspaces, activeIndex]);
    const switchWorkspace = useCallback((index, currentNodes, currentEdges) => {
        // Save current workspace state
        setWorkspaces(prev => prev.map((ws, i) => i === activeIndex ? { ...ws, nodes: currentNodes, edges: currentEdges } : ws));
        setActiveIndex(index);
    }, [activeIndex]);
    const markDirty = useCallback(() => {
        setWorkspaces(prev => prev.map((ws, i) => i === activeIndex ? { ...ws, dirty: true } : ws));
    }, [activeIndex]);
    const renameWorkspace = useCallback((index, name) => {
        setWorkspaces(prev => prev.map((ws, i) => i === index ? { ...ws, name } : ws));
    }, []);
    const saveCurrentState = useCallback((nodes, edges) => {
        setWorkspaces(prev => prev.map((ws, i) => i === activeIndex ? { ...ws, nodes, edges } : ws));
    }, [activeIndex]);
    return { workspaces, activeIndex, activeWorkspace, addWorkspace, closeWorkspace, switchWorkspace, markDirty, renameWorkspace, saveCurrentState };
}
export function WorkspaceTabBar({ workspaces, activeIndex, onSwitch, onAdd, onClose, onRename, }) {
    const [editingIdx, setEditingIdx] = useState(null);
    const [editVal, setEditVal] = useState("");
    return (_jsxs("div", { style: {
            display: "flex", alignItems: "center", gap: 2, padding: "4px 8px",
            background: "var(--of-topbar-bg, #0e0e10)", borderBottom: "1px solid var(--of-topbar-border, #1e1e22)",
            flexShrink: 0, minHeight: 36, overflow: "auto",
        }, children: [workspaces.map((ws, i) => (_jsxs("div", { style: {
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", borderRadius: 6,
                    background: i === activeIndex ? "var(--of-accent, #c026d3)" + "20" : "transparent",
                    border: i === activeIndex ? "1px solid var(--of-accent, #c026d3)" + "40" : "1px solid transparent",
                    cursor: "pointer", transition: "all 0.15s",
                }, onClick: () => onSwitch(i), onDoubleClick: () => { setEditingIdx(i); setEditVal(ws.name); }, children: [editingIdx === i ? (_jsx("input", { autoFocus: true, value: editVal, onChange: e => setEditVal(e.target.value), onBlur: () => { onRename(i, editVal || ws.name); setEditingIdx(null); }, onKeyDown: e => { if (e.key === "Enter") {
                            onRename(i, editVal || ws.name);
                            setEditingIdx(null);
                        } if (e.key === "Escape")
                            setEditingIdx(null); e.stopPropagation(); }, style: { background: "transparent", border: "none", outline: "none", color: "var(--of-accent-text, #fff)", fontSize: 11, fontWeight: 600, width: 80 } })) : (_jsxs("span", { style: { fontSize: 11, fontWeight: 600, color: i === activeIndex ? "var(--of-accent, #c026d3)" : "var(--of-topbar-text, #9ca3af)" }, children: [ws.name, ws.dirty ? " •" : ""] })), workspaces.length > 1 && (_jsx("button", { onClick: (e) => { e.stopPropagation(); onClose(i); }, style: { width: 16, height: 16, borderRadius: 4, border: "none", background: "transparent", color: "var(--of-topbar-text, #9ca3af)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }, onMouseOver: e => e.currentTarget.style.color = "#ef4444", onMouseOut: e => e.currentTarget.style.color = "var(--of-topbar-text, #9ca3af)", children: "\u2715" }))] }, ws.id))), _jsx("button", { onClick: onAdd, style: {
                    width: 26, height: 26, borderRadius: 6, border: "1px solid var(--of-topbar-border, #1e1e22)",
                    background: "transparent", color: "var(--of-topbar-text, #9ca3af)", fontSize: 14,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }, onMouseOver: e => e.currentTarget.style.color = "var(--of-accent, #c026d3)", onMouseOut: e => e.currentTarget.style.color = "var(--of-topbar-text, #9ca3af)", children: "+" })] }));
}
