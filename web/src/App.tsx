/**
 * OpenFlow — Visual AI Workflow Builder
 *
 * Fully interactive node canvas with:
 * - Custom node components with real input fields
 * - Properties panel for selected node
 * - Model/provider selection
 * - Run button that executes the workflow
 * - Output preview panel
 */

import { useCallback, useMemo, useState, useRef, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PortDef {
  name: string;
  type: string;
  description: string;
  default?: unknown;
  required?: boolean;
  options?: string[];
}

interface NodeDef {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  inputs: PortDef[];
  outputs: PortDef[];
}

// ---------------------------------------------------------------------------
// Node definitions with real parameters
// ---------------------------------------------------------------------------

const NODE_DEFS: NodeDef[] = [
  {
    id: "text.input",
    name: "Text Input",
    description: "Enter a text prompt",
    category: "input",
    icon: "✏️",
    color: "#6366f1",
    inputs: [],
    outputs: [{ name: "text", type: "string", description: "Text output" }],
  },
  {
    id: "image.text_to_image",
    name: "Text to Image",
    description: "Generate an image from text",
    category: "image",
    icon: "🖼️",
    color: "#ec4899",
    inputs: [
      { name: "prompt", type: "string", description: "Text prompt", required: true },
      { name: "negative_prompt", type: "string", description: "Negative prompt", default: "" },
      { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "flux-dev", "sd-3.5", "dall-e-3", "ideogram-v3", "recraft-v3"] },
      { name: "width", type: "integer", description: "Width", default: 1024, options: ["512", "768", "1024", "1280", "1536"] },
      { name: "height", type: "integer", description: "Height", default: 1024, options: ["512", "768", "1024", "1280", "1536"] },
      { name: "guidance_scale", type: "float", description: "Guidance Scale", default: 7.5 },
      { name: "steps", type: "integer", description: "Steps", default: 30 },
      { name: "seed", type: "integer", description: "Seed (-1 = random)", default: -1 },
    ],
    outputs: [
      { name: "image", type: "image", description: "Generated image" },
      { name: "seed", type: "integer", description: "Seed used" },
    ],
  },
  {
    id: "video.text_to_video",
    name: "Text to Video",
    description: "Generate video from text",
    category: "video",
    icon: "🎬",
    color: "#f59e0b",
    inputs: [
      { name: "prompt", type: "string", description: "Text prompt", required: true },
      { name: "negative_prompt", type: "string", description: "Negative prompt", default: "" },
      { name: "model", type: "string", description: "Model", default: "wan-2.6", options: ["wan-2.6", "kling-2.6", "runway-gen4", "minimax-hailuo", "hunyuan", "veo-3"] },
      { name: "duration", type: "integer", description: "Duration (sec)", default: 4, options: ["2", "4", "6", "8", "10"] },
      { name: "fps", type: "integer", description: "FPS", default: 24, options: ["12", "24", "30"] },
      { name: "width", type: "integer", description: "Width", default: 1280, options: ["512", "768", "1024", "1280"] },
      { name: "height", type: "integer", description: "Height", default: 720, options: ["512", "720", "768", "1024"] },
      { name: "seed", type: "integer", description: "Seed (-1 = random)", default: -1 },
    ],
    outputs: [
      { name: "video", type: "video", description: "Generated video" },
    ],
  },
  {
    id: "image.img_to_img",
    name: "Image to Image",
    description: "Transform an image with a prompt",
    category: "image",
    icon: "🎨",
    color: "#ec4899",
    inputs: [
      { name: "image", type: "image", description: "Input image", required: true },
      { name: "prompt", type: "string", description: "Transform prompt", required: true },
      { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "sd-3.5", "dall-e-3"] },
      { name: "strength", type: "float", description: "Strength (0-1)", default: 0.75 },
    ],
    outputs: [
      { name: "image", type: "image", description: "Transformed image" },
    ],
  },
  {
    id: "transform.upscale",
    name: "Upscale",
    description: "Upscale image resolution",
    category: "transform",
    icon: "🔍",
    color: "#14b8a6",
    inputs: [
      { name: "image", type: "image", description: "Input image", required: true },
      { name: "scale", type: "integer", description: "Scale factor", default: 2, options: ["2", "4"] },
      { name: "model", type: "string", description: "Model", default: "real-esrgan", options: ["real-esrgan", "clarity-upscaler"] },
    ],
    outputs: [
      { name: "image", type: "image", description: "Upscaled image" },
    ],
  },
  {
    id: "transform.inpaint",
    name: "Inpaint",
    description: "Edit parts of an image",
    category: "transform",
    icon: "🖌️",
    color: "#14b8a6",
    inputs: [
      { name: "image", type: "image", description: "Source image", required: true },
      { name: "mask", type: "image", description: "Mask (white = edit area)", required: true },
      { name: "prompt", type: "string", description: "What to paint", required: true },
      { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "sd-3.5"] },
    ],
    outputs: [
      { name: "image", type: "image", description: "Inpainted image" },
    ],
  },
  {
    id: "text.llm",
    name: "LLM Chat",
    description: "Chat with a language model",
    category: "text",
    icon: "🤖",
    color: "#8b5cf6",
    inputs: [
      { name: "prompt", type: "string", description: "Prompt / message", required: true },
      { name: "system", type: "string", description: "System prompt", default: "" },
      { name: "model", type: "string", description: "Model", default: "gpt-4o", options: ["gpt-4o", "claude-3.5-sonnet", "llama-3.1-70b", "gemini-2.0-flash", "mistral-large"] },
      { name: "temperature", type: "float", description: "Temperature", default: 0.7 },
      { name: "max_tokens", type: "integer", description: "Max tokens", default: 2048 },
    ],
    outputs: [
      { name: "text", type: "string", description: "Model response" },
    ],
  },
  {
    id: "output.preview",
    name: "Preview",
    description: "View any output",
    category: "output",
    icon: "👁️",
    color: "#64748b",
    inputs: [
      { name: "input", type: "any", description: "Value to preview", required: true },
    ],
    outputs: [],
  },
];

const CATEGORIES: Record<string, string> = {
  input: "📥 Inputs",
  image: "🖼️ Image",
  video: "🎬 Video",
  text: "🤖 Text / LLM",
  transform: "🔄 Transform",
  output: "📤 Output",
};

function groupByCategory(defs: NodeDef[]) {
  const g: Record<string, NodeDef[]> = {};
  for (const d of defs) {
    if (!g[d.category]) g[d.category] = [];
    g[d.category].push(d);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Port type colors
// ---------------------------------------------------------------------------

/** Prevent React Flow from capturing keystrokes/clicks in input fields */
const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation();
// ---------------------------------------------------------------------------
// fal.ai integration for real generation
// ---------------------------------------------------------------------------

const FAL_MODELS: Record<string, string> = {
  "flux-pro": "fal-ai/flux-pro/v1.1",
  "flux-dev": "fal-ai/flux/dev",
  "sd-3.5": "fal-ai/stable-diffusion-v35-large",
  "dall-e-3": "fal-ai/dall-e-3",
  "wan-2.6": "fal-ai/wan/v2.1/1.3b",
  "minimax-hailuo": "fal-ai/minimax-video/image-to-video",
  "real-esrgan": "fal-ai/real-esrgan",
};

async function runFalGeneration(
  modelKey: string,
  inputs: Record<string, unknown>,
  apiKey: string,
): Promise<{ url?: string; error?: string }> {
  const falModel = FAL_MODELS[modelKey] || FAL_MODELS["flux-dev"];
  try {
    const body: Record<string, unknown> = { prompt: inputs.prompt || "" };
    if (inputs.negative_prompt) body.negative_prompt = inputs.negative_prompt;
    if (inputs.width) body.image_size = { width: Number(inputs.width), height: Number(inputs.height || inputs.width) };
    if (inputs.guidance_scale) body.guidance_scale = Number(inputs.guidance_scale);
    if (inputs.steps) body.num_inference_steps = Number(inputs.steps);
    if (inputs.seed && Number(inputs.seed) >= 0) body.seed = Number(inputs.seed);

    const resp = await fetch(`https://fal.run/${falModel}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (data.images?.[0]?.url) return { url: data.images[0].url };
    if (data.image?.url) return { url: data.image.url };
    if (data.video?.url) return { url: data.video.url };
    return { error: data.detail || JSON.stringify(data).slice(0, 200) };
  } catch (err: unknown) {
    return { error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Custom Node Component — Clean white elegant design
// ---------------------------------------------------------------------------

function FlowNode({ data, selected }: NodeProps) {
  const def = data.def as NodeDef;
  const values = data.values as Record<string, unknown>;
  const onChange = data.onChange as (key: string, val: unknown) => void;
  const outputUrl = data.outputUrl as string | undefined;
  const nodeStatus = data.status as string | undefined;

  return (
    <div
      style={{
        background: "#ffffff",
        border: selected ? "1.5px solid #d1d5db" : "1px solid #e8e8eb",
        borderRadius: 16,
        minWidth: 220,
        maxWidth: 340,
        fontFamily: "'Inter', -apple-system, 'Helvetica Neue', sans-serif",
        boxShadow: selected
          ? "0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
          : "0 2px 12px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {/* Header — minimal, just the name */}
      <div
        style={{
          padding: "14px 18px 10px",
        }}
      >
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#1a1a1a",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}>
          {def.icon} {def.name}
        </div>
      </div>

      {/* Input handles + fields */}
      <div className="nodrag nowheel" style={{ padding: "8px 0" }}>
        {def.inputs.map((inp) => (
          <div key={inp.name} style={{ position: "relative", padding: "4px 14px" }}>
            <Handle
              type="target"
              position={Position.Left}
              id={inp.name}
              style={{
                width: 9,
                height: 9,
                background: "#d1d5db",
                border: "2px solid #ffffff",
                left: -5,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            />
            {inp.type === "string" && !inp.options && (
              inp.name === "prompt" || inp.name === "system" ? (
                <textarea onKeyDown={stopKeys}
                  value={(values[inp.name] as string) || ""}
                  onChange={(e) => onChange(inp.name, e.target.value)}
                  placeholder={inp.description}
                  rows={inp.name === "prompt" ? 3 : 2}
                  style={{
                    width: "100%",
                    background: "#f5f5f7",
                    border: "none",
                    borderRadius: 10,
                    color: "#1a1a1a",
                    fontSize: 14,
                    padding: "10px 14px",
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                  }}
                />
              ) : (
                <input onKeyDown={stopKeys}
                  type="text"
                  value={(values[inp.name] as string) || ""}
                  onChange={(e) => onChange(inp.name, e.target.value)}
                  placeholder={inp.description}
                  style={{
                    width: "100%",
                    background: "#f5f5f7",
                    border: "none",
                    borderRadius: 10,
                    color: "#1a1a1a",
                    fontSize: 13,
                    padding: "8px 14px",
                    outline: "none",
                  }}
                />
              )
            )}
            {inp.options && (
              <select onKeyDown={stopKeys}
                value={String(values[inp.name] ?? inp.default ?? "")}
                onChange={(e) => onChange(inp.name, e.target.value)}
                style={{
                  width: "100%",
                  background: "#f5f5f7",
                  border: "none",
                  borderRadius: 10,
                  color: "#1a1a1a",
                  fontSize: 13,
                  padding: "8px 14px",
                  outline: "none",
                  cursor: "pointer",
                  WebkitAppearance: "none",
                }}
              >
                {inp.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {(inp.type === "integer" || inp.type === "float") && !inp.options && (
              <input onKeyDown={stopKeys}
                type="number"
                value={String(values[inp.name] ?? inp.default ?? "")}
                onChange={(e) => onChange(inp.name, inp.type === "float" ? parseFloat(e.target.value) : parseInt(e.target.value))}
                step={inp.type === "float" ? 0.1 : 1}
                style={{
                  width: "100%",
                  background: "#f5f5f7",
                  border: "none",
                  borderRadius: 10,
                  color: "#1a1a1a",
                  fontSize: 13,
                  padding: "8px 14px",
                  outline: "none",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Output preview */}
      {outputUrl && (
        <div style={{ padding: "8px 18px 12px" }}>
          {(def.category === "video") ? (
            <video src={outputUrl} controls autoPlay loop muted style={{ width: "100%", borderRadius: 12 }} />
          ) : (
            <img src={outputUrl} alt="output" style={{ width: "100%", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
          )}
        </div>
      )}

      {/* Status indicator */}
      {nodeStatus && (
        <div style={{
          padding: "8px 18px 12px",
          fontSize: 11,
          fontWeight: 500,
          color: nodeStatus === "running" ? "#92400e" : nodeStatus === "done" ? "#166534" : "#991b1b",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: nodeStatus === "running" ? "#f59e0b" : nodeStatus === "done" ? "#22c55e" : "#ef4444",
          }} />
          {nodeStatus === "running" ? "Generating..." : nodeStatus === "done" ? "Complete" : nodeStatus}
        </div>
      )}

      {/* Output handles */}
      {def.outputs.length > 0 && (
        <div style={{ padding: "4px 0 12px" }}>
          {def.outputs.map((out) => (
            <div key={out.name} style={{ position: "relative", padding: "2px 18px", textAlign: "right" }}>
              <Handle
                type="source"
                position={Position.Right}
                id={out.name}
                style={{
                  width: 9,
                  height: 9,
                  background: "#d1d5db",
                  border: "2px solid #ffffff",
                  right: -5,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { flowNode: FlowNode };

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [falApiKey, setFalApiKey] = useState(() => localStorage.getItem("openflow_fal_key") || "");
  const idCounter = useRef(0);

  const grouped = useMemo(() => groupByCategory(NODE_DEFS), []);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Update onChange handlers when nodes change (closure fix)
  const updateNodeValue = useCallback(
    (nodeId: string, key: string, val: unknown) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          return {
            ...n,
            data: {
              ...n.data,
              values: { ...(n.data.values as Record<string, unknown>), [key]: val },
            },
          };
        })
      );
    },
    [setNodes]
  );

  const addNodeWithHandler = useCallback(
    (def: NodeDef) => {
      idCounter.current += 1;
      const nodeId = `${def.id}_${idCounter.current}`;
      const defaults: Record<string, unknown> = {};
      def.inputs.forEach((inp) => {
        if (inp.default !== undefined) defaults[inp.name] = inp.default;
      });

      const newNode: Node = {
        id: nodeId,
        type: "flowNode",
        position: {
          x: 100 + Math.random() * 400,
          y: 50 + Math.random() * 300,
        },
        data: {
          def,
          values: defaults,
          onChange: (key: string, val: unknown) => updateNodeValue(nodeId, key, val),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, updateNodeValue]
  );

  const setNodeData = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, ...patch } };
    }));
  }, [setNodes]);

  const handleRun = useCallback(async () => {
    if (!falApiKey) {
      alert("Enter your fal.ai API key in the sidebar first!");
      return;
    }
    localStorage.setItem("openflow_fal_key", falApiKey);
    setIsRunning(true);

    // Find generation nodes (nodes with a model input)
    const genNodes = nodes.filter((n) => {
      const def = n.data.def as NodeDef;
      return def.inputs.some((inp) => inp.name === "model");
    });

    for (const node of genNodes) {
      const values = node.data.values as Record<string, unknown>;
      const modelKey = (values.model as string) || "flux-dev";

      setNodeData(node.id, { status: "running", outputUrl: undefined });

      const result = await runFalGeneration(modelKey, values, falApiKey);

      if (result.url) {
        setNodeData(node.id, { status: "done", outputUrl: result.url });
      } else {
        setNodeData(node.id, { status: `Error: ${result.error}` });
      }
    }

    setIsRunning(false);
  }, [nodes, falApiKey, setNodeData]);

  // Drag from palette
  const onDragStart = (e: DragEvent, def: NodeDef) => {
    e.dataTransfer.setData("application/openflow-node", JSON.stringify(def));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/openflow-node");
      if (!data) return;
      const def: NodeDef = JSON.parse(data);
      idCounter.current += 1;
      const nodeId = `${def.id}_${idCounter.current}`;
      const defaults: Record<string, unknown> = {};
      def.inputs.forEach((inp) => {
        if (inp.default !== undefined) defaults[inp.name] = inp.default;
      });

      const bounds = (e.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
      const x = bounds ? e.clientX - bounds.left : e.clientX;
      const y = bounds ? e.clientY - bounds.top : e.clientY;

      const newNode: Node = {
        id: nodeId,
        type: "flowNode",
        position: { x, y },
        data: {
          def,
          values: defaults,
          onChange: (key: string, val: unknown) => updateNodeValue(nodeId, key, val),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, updateNodeValue]
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f0f2", color: "#1a1a1a" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 250,
          background: "#ffffff",
          borderRight: "1px solid #e8e8eb",
          overflowY: "auto",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #f0f0f2",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: "#1a1a1a" }}>
            OpenFlow
          </span>
          <span style={{ fontSize: 9, color: "#9ca3af", marginLeft: "auto", background: "#f5f5f7", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
            v0.1
          </span>
        </div>

        {/* Node palette */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {Object.entries(grouped).map(([category, defs]) => (
            <div key={category}>
              <div
                style={{
                  padding: "16px 20px 6px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                {CATEGORIES[category] || category}
              </div>
              {defs.map((def) => (
                <div
                  key={def.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, def)}
                  onClick={() => addNodeWithHandler(def)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 20px",
                    cursor: "grab",
                    borderRadius: 8,
                    margin: "1px 8px",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#f5f5f7";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 15 }}>{def.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{def.name}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{def.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* API Key + Run */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f2" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
              API Key
            </div>
            <input
              type="password"
              value={falApiKey}
              onChange={(e) => setFalApiKey(e.target.value)}
              onKeyDown={stopKeys}
              placeholder="fal-xxxxxxxx"
              style={{
                width: "100%",
                background: "#f5f5f7",
                border: "none",
                borderRadius: 8,
                color: "#1a1a1a",
                fontSize: 11,
                padding: "8px 12px",
                outline: "none",
              }}
            />
            <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 4 }}>
              Free at <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener" style={{ color: "#1a1a1a", fontWeight: 600, textDecoration: "none" }}>fal.ai</a>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          <button
            onClick={handleRun}
            disabled={isRunning || nodes.length === 0}
            style={{
              width: "100%",
              padding: "10px",
              background: isRunning ? "#e5e7eb" : "#1a1a1a",
              color: isRunning ? "#9ca3af" : "#ffffff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: isRunning ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.2s",
              letterSpacing: "-0.2px",
            }}
          >
            {isRunning ? "Generating..." : "Run"}
          </button>
          <div style={{ fontSize: 10, color: "#c4c4c8", textAlign: "center", marginTop: 8 }}>
            {nodes.length} nodes · {edges.length} connections
          </div>
        </div>
      </aside>

      {/* Canvas */}
      <div style={{ flex: 1 }} onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: "#f0f0f2" }}
          defaultEdgeOptions={{
            animated: false,
            style: { stroke: "#d1d5db", strokeWidth: 1.5 },
            type: "smoothstep",
          }}
        >
          <Background variant={BackgroundVariant.Dots} color="#d4d4d8" gap={28} size={1} />
          <Controls
            style={{ background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
          />
          <MiniMap
            style={{ background: "#ffffff", borderRadius: 10, border: "1px solid #e8e8eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            nodeColor="#d1d5db"
            maskColor="rgba(240,240,242,0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
