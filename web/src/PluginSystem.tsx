/**
 * PluginSystem — Sprint 15: Plugin architecture foundation
 */

import { useState } from "react";

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  status: "enabled" | "disabled" | "coming-soon";
  builtIn: boolean;
  icon: string;
}

const DEFAULT_PLUGINS: Plugin[] = [
  { id: "fal-ai", name: "fal.ai Provider", description: "Primary image & video generation provider. 30+ models.", version: "1.0.0", status: "enabled", builtIn: true, icon: "⚡" },
  { id: "replicate", name: "Replicate Provider", description: "Access thousands of open-source models.", version: "0.1.0", status: "coming-soon", builtIn: false, icon: "🔄" },
  { id: "stability-ai", name: "Stability AI Provider", description: "Stable Diffusion 3.5 and SDXL models.", version: "0.1.0", status: "coming-soon", builtIn: false, icon: "🎨" },
  { id: "openai-dalle", name: "OpenAI DALL·E Provider", description: "DALL·E 3 and GPT Image generation.", version: "0.1.0", status: "coming-soon", builtIn: false, icon: "🤖" },
  { id: "local-sd", name: "Local Stable Diffusion", description: "Run models locally via ComfyUI or Automatic1111.", version: "0.1.0", status: "coming-soon", builtIn: false, icon: "💻" },
];

function getPluginStates(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("openflow_plugin_states") || "{}");
  } catch { return {}; }
}

function setPluginState(id: string, enabled: boolean) {
  const states = getPluginStates();
  states[id] = enabled;
  localStorage.setItem("openflow_plugin_states", JSON.stringify(states));
}

export function PluginsSection() {
  const [plugins] = useState<Plugin[]>(DEFAULT_PLUGINS);
  const [states, setStates] = useState<Record<string, boolean>>(getPluginStates);

  const toggle = (id: string) => {
    const plugin = plugins.find(p => p.id === id);
    if (!plugin || plugin.status === "coming-soon" || plugin.builtIn) return;
    const newVal = !(states[id] ?? plugin.status === "enabled");
    setPluginState(id, newVal);
    setStates(prev => ({ ...prev, [id]: newVal }));
  };

  const isEnabled = (p: Plugin) => {
    if (p.status === "coming-soon") return false;
    if (p.builtIn) return true;
    return states[p.id] ?? p.status === "enabled";
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--of-muted-text, #9ca3af)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
        Plugins
      </div>

      {plugins.map(p => (
        <div key={p.id} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          background: "var(--of-input-bg, #f5f5f7)", borderRadius: 10, marginBottom: 6,
          opacity: p.status === "coming-soon" ? 0.5 : 1,
        }}>
          <span style={{ fontSize: 20 }}>{p.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--of-body-text, #1a1a1a)" }}>
              {p.name}
              {p.builtIn && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--of-accent, #c026d3)", marginLeft: 6, textTransform: "uppercase" }}>Built-in</span>}
              {p.status === "coming-soon" && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--of-muted-text, #9ca3af)", marginLeft: 6, textTransform: "uppercase" }}>Coming Soon</span>}
            </div>
            <div style={{ fontSize: 10, color: "var(--of-muted-text, #6b7280)", marginTop: 2 }}>{p.description}</div>
          </div>
          <button onClick={() => toggle(p.id)} disabled={p.status === "coming-soon" || p.builtIn}
            style={{
              width: 40, height: 22, borderRadius: 50, border: "none", cursor: (p.status === "coming-soon" || p.builtIn) ? "not-allowed" : "pointer",
              background: isEnabled(p) ? "var(--of-accent, #c026d3)" : "#d1d5db",
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 3,
              left: isEnabled(p) ? 21 : 3,
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </button>
        </div>
      ))}

      <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--of-input-bg, #f5f5f7)", borderRadius: 10, fontSize: 11, color: "var(--of-muted-text, #6b7280)", lineHeight: 1.6 }}>
        <strong>Plugin API</strong> — Community plugins coming soon.{" "}
        <a href="https://github.com/nikolateslasagent/openflow/wiki/Plugin-API" target="_blank" rel="noopener" style={{ color: "var(--of-accent, #c026d3)", textDecoration: "none", fontWeight: 600 }}>
          View Docs →
        </a>
      </div>
    </div>
  );
}
