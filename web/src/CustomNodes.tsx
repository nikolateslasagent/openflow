/**
 * Custom Node Builder — connect any REST API as a workflow node
 */
import { useState } from "react";

export interface CustomNodeDef {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  inputs: Array<{ name: string; type: string }>;
  outputs: Array<{ name: string; type: string }>;
  apiEndpoint: string;
  requestTemplate: string;
  responsePath: string;
}

const STORAGE_KEY = "openflow_custom_nodes";

export function loadCustomNodes(): CustomNodeDef[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export function saveCustomNodes(nodes: CustomNodeDef[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
}

export function CustomNodeBuilder({ onSave }: { onSave: (node: CustomNodeDef) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [color, setColor] = useState("#a855f7");
  const [inputs, setInputs] = useState<Array<{ name: string; type: string }>>([{ name: "input", type: "text" }]);
  const [outputs, setOutputs] = useState<Array<{ name: string; type: string }>>([{ name: "output", type: "text" }]);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [requestTemplate, setRequestTemplate] = useState('{\n  "prompt": "{{input}}"\n}');
  const [responsePath, setResponsePath] = useState("$.result");
  const [saved, setSaved] = useState(false);

  const inputStyle = { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 11, padding: "7px 10px", outline: "none", boxSizing: "border-box" as const, color: "#1a1a1a" };
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 4, marginTop: 12 };

  const handleSave = () => {
    if (!name || !apiEndpoint) return;
    const node: CustomNodeDef = {
      id: `custom.${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
      name, description, category, color, inputs, outputs, apiEndpoint, requestTemplate, responsePath,
    };
    const existing = loadCustomNodes();
    saveCustomNodes([...existing, node]);
    onSave(node);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setName(""); setDescription(""); setApiEndpoint("");
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>🔧 Custom Node Builder</div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12 }}>Connect any REST API as a workflow node</div>

      <div style={labelStyle}>Node Name *</div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="My API Node" style={inputStyle} />

      <div style={labelStyle}>Description</div>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this node do?" style={inputStyle} />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={labelStyle}>Category</div>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="custom">Custom</option><option value="tools">Tools</option><option value="transform">Transform</option><option value="output">Output</option>
          </select>
        </div>
        <div style={{ width: 60 }}>
          <div style={labelStyle}>Color</div>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: "100%", height: 30, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }} />
        </div>
      </div>

      <div style={labelStyle}>Inputs</div>
      {inputs.map((inp, i) => (
        <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input value={inp.name} onChange={e => { const n = [...inputs]; n[i].name = e.target.value; setInputs(n); }} placeholder="name" style={{ ...inputStyle, flex: 1 }} />
          <select value={inp.type} onChange={e => { const n = [...inputs]; n[i].type = e.target.value; setInputs(n); }} style={{ ...inputStyle, width: 80, cursor: "pointer" }}>
            <option value="text">Text</option><option value="image">Image</option><option value="number">Number</option><option value="select">Select</option>
          </select>
          {inputs.length > 1 && <button onClick={() => setInputs(inputs.filter((_, j) => j !== i))} style={{ background: "#fee2e2", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "0 6px", fontSize: 12 }}>×</button>}
        </div>
      ))}
      <button onClick={() => setInputs([...inputs, { name: "", type: "text" }])} style={{ fontSize: 10, color: "#c026d3", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }}>+ Add Input</button>

      <div style={labelStyle}>Outputs</div>
      {outputs.map((out, i) => (
        <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input value={out.name} onChange={e => { const n = [...outputs]; n[i].name = e.target.value; setOutputs(n); }} placeholder="name" style={{ ...inputStyle, flex: 1 }} />
          <select value={out.type} onChange={e => { const n = [...outputs]; n[i].type = e.target.value; setOutputs(n); }} style={{ ...inputStyle, width: 80, cursor: "pointer" }}>
            <option value="text">Text</option><option value="image">Image</option><option value="number">Number</option>
          </select>
        </div>
      ))}
      <button onClick={() => setOutputs([...outputs, { name: "", type: "text" }])} style={{ fontSize: 10, color: "#c026d3", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }}>+ Add Output</button>

      <div style={labelStyle}>API Endpoint URL *</div>
      <input value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} placeholder="https://api.example.com/v1/generate" style={inputStyle} />

      <div style={labelStyle}>Request Template (JSON)</div>
      <textarea value={requestTemplate} onChange={e => setRequestTemplate(e.target.value)} rows={4}
        style={{ ...inputStyle, fontFamily: "monospace", fontSize: 10, resize: "vertical" }} />
      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>Use {"{{input_name}}"} placeholders for input values</div>

      <div style={labelStyle}>Response Path (JSONPath)</div>
      <input value={responsePath} onChange={e => setResponsePath(e.target.value)} placeholder="$.result" style={inputStyle} />
      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>Path to extract output from API response</div>

      <button onClick={handleSave} disabled={!name || !apiEndpoint}
        style={{ width: "100%", marginTop: 16, padding: 10, background: !name || !apiEndpoint ? "#e5e7eb" : "#c026d3", color: !name || !apiEndpoint ? "#9ca3af" : "#fff",
          border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: !name || !apiEndpoint ? "not-allowed" : "pointer" }}>
        {saved ? "✓ Saved!" : "Create Custom Node"}
      </button>

      {/* List existing custom nodes */}
      {loadCustomNodes().length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={labelStyle}>Your Custom Nodes</div>
          {loadCustomNodes().map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f9f9fb", borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>{n.name}</div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{n.apiEndpoint.substring(0, 40)}...</div>
              </div>
              <button onClick={() => {
                const nodes = loadCustomNodes().filter((_, j) => j !== i);
                saveCustomNodes(nodes);
                // force re-render
                setName(name);
              }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
