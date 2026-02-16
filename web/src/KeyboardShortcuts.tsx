/**
 * Sprint 10: Keyboard Shortcuts Help Modal
 */

export function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: "Space", action: "Run selected node" },
    { keys: "Delete / Backspace", action: "Delete selected node(s)" },
    { keys: "Ctrl+S / ⌘S", action: "Save project" },
    { keys: "Ctrl+Z / ⌘Z", action: "Undo" },
    { keys: "Ctrl+Shift+Z / ⌘⇧Z", action: "Redo" },
    { keys: "Ctrl+D / ⌘D", action: "Duplicate selected node(s)" },
    { keys: "Ctrl+V / ⌘V", action: "Paste image from clipboard" },
    { keys: "Double-click canvas", action: "Quick add node search" },
    { keys: "Right-click node", action: "Context menu (note, duplicate, delete)" },
    { keys: "?", action: "Show this help" },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "24px 28px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f2" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.3px" }}>Keyboard Shortcuts</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Speed up your workflow</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e8e8eb", background: "#fff", cursor: "pointer", fontSize: 14, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "16px 28px 28px" }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < shortcuts.length - 1 ? "1px solid #f5f5f7" : "none" }}>
              <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>{s.action}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {s.keys.split(" / ").map((k, j) => (
                  <kbd key={j} style={{ padding: "3px 8px", background: "#f5f5f7", border: "1px solid #e8e8eb", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'SF Mono', 'Fira Code', monospace", boxShadow: "0 1px 0 #d1d5db" }}>
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
