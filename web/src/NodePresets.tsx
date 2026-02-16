/**
 * Node Presets — save and restore node configurations
 */
import { useState } from "react";

export interface NodePreset {
  id: string;
  name: string;
  defId: string;
  defName: string;
  icon: string;
  values: Record<string, unknown>;
  createdAt: number;
}

const STORAGE_KEY = "openflow_node_presets";

export function getPresets(): NodePreset[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export function savePreset(preset: NodePreset) {
  const presets = getPresets();
  presets.unshift(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function deletePreset(id: string) {
  const presets = getPresets().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function PresetsPanel({ onCreateNode }: { onCreateNode: (defId: string, values: Record<string, unknown>) => void }) {
  const [presets, setPresets] = useState<NodePreset[]>(getPresets);

  const handleDelete = (id: string) => {
    deletePreset(id);
    setPresets(getPresets());
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>⭐ My Presets</div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12 }}>Saved node configurations</div>

      {presets.length === 0 && (
        <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: 20 }}>
          No presets yet. Click the ⭐ icon on any node to save its settings as a preset.
        </div>
      )}

      {presets.map(p => (
        <div key={p.id} style={{ padding: "10px 12px", background: "#f9f9fb", borderRadius: 10, marginBottom: 6, cursor: "pointer" }}
          onClick={() => onCreateNode(p.defId, p.values)}
          onMouseOver={e => { e.currentTarget.style.background = "#f0f0f3"; }}
          onMouseOut={e => { e.currentTarget.style.background = "#f9f9fb"; }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{p.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>{p.name}</div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>{p.defName} · {new Date(p.createdAt).toLocaleDateString()}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, padding: "2px 4px" }}>🗑</button>
          </div>
          <div style={{ fontSize: 9, color: "#6b7280", marginTop: 4 }}>
            {Object.entries(p.values).filter(([, v]) => v !== undefined && v !== "").slice(0, 3).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`).join(" · ")}
          </div>
        </div>
      ))}
    </div>
  );
}
