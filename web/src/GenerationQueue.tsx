/**
 * Sprint 10: Generation Queue with Priorities
 */
import { useState, useCallback } from "react";

export interface QueueItem {
  id: string;
  nodeId: string;
  prompt: string;
  model: string;
  status: "queued" | "running" | "done" | "error";
  priority: boolean;
  position: number;
  estimatedTime?: string;
  addedAt: number;
}

export function useGenerationQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [paused, setPaused] = useState(false);

  const addToQueue = useCallback((nodeId: string, prompt: string, model: string, priority = false) => {
    const item: QueueItem = {
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

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, position: i + 1 })));
  }, []);

  const updateStatus = useCallback((id: string, status: QueueItem["status"]) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  }, []);

  const togglePriority = useCallback((id: string) => {
    setQueue(prev => {
      const item = prev.find(q => q.id === id);
      if (!item) return prev;
      const updated = { ...item, priority: !item.priority };
      const rest = prev.filter(q => q.id !== id);
      const next = updated.priority ? [updated, ...rest] : [...rest, updated];
      return next.map((q, i) => ({ ...q, position: i + 1 }));
    });
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
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

export function QueuePanel({ queue, paused, onPauseToggle, onTogglePriority, onRemove, onReorder, onClearCompleted }: {
  queue: QueueItem[];
  paused: boolean;
  onPauseToggle: () => void;
  onTogglePriority: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onClearCompleted: () => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  if (queue.length === 0) return null;

  const active = queue.filter(q => q.status === "running").length;
  const pending = queue.filter(q => q.status === "queued").length;

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, width: 340, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 800, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f5f7", borderBottom: "1px solid #e8e8eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>📋</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>Queue</span>
          <span style={{ padding: "2px 8px", background: "#c026d3", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{pending} pending</span>
          {active > 0 && <span style={{ padding: "2px 8px", background: "#f59e0b", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{active} running</span>}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onPauseToggle} style={{ padding: "4px 10px", background: paused ? "#22c55e" : "#f59e0b", color: "#fff", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button onClick={onClearCompleted} style={{ padding: "4px 8px", background: "#f5f5f7", border: "1px solid #e8e8eb", borderRadius: 6, fontSize: 10, cursor: "pointer", color: "#6b7280" }}>Clear ✓</button>
        </div>
      </div>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {queue.map((item, idx) => (
          <div key={item.id}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={() => { if (dragIdx !== null && dragIdx !== idx) onReorder(dragIdx, idx); setDragIdx(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              borderBottom: "1px solid #f5f5f7", cursor: "grab",
              background: item.status === "running" ? "#fffbeb" : item.status === "done" ? "#f0fdf4" : item.status === "error" ? "#fef2f2" : "transparent",
              opacity: dragIdx === idx ? 0.5 : 1,
            }}>
            <span style={{ fontSize: 10, color: "#c4c4c8", fontWeight: 700, width: 16 }}>#{item.position}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.prompt.slice(0, 40) || "No prompt"}
              </div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>{item.model} · {item.estimatedTime}</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {item.status === "running" && <span style={{ fontSize: 12 }}>⏳</span>}
              {item.status === "done" && <span style={{ fontSize: 12 }}>✅</span>}
              {item.status === "error" && <span style={{ fontSize: 12 }}>❌</span>}
              <button onClick={() => onTogglePriority(item.id)} title="Toggle priority"
                style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: item.priority ? "#fef3c7" : "transparent", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.priority ? "⭐" : "☆"}
              </button>
              <button onClick={() => onRemove(item.id)} style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
