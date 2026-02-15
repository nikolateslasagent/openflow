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
    inputs: [
      { name: "text", type: "string", description: "Text", required: true },
    ],
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
      { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-2-pro", "flux-2-dev-lora", "flux-2-flex", "flux-pro-1.1-ultra", "flux-pro-1.1", "flux-fast", "sd-3.5", "dall-e-3", "gpt-image-1.5", "imagen-4", "imagen-3", "imagen-3-fast", "ideogram-v3", "recraft-v3", "reve", "higgsfield-image"] },
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
      { name: "model", type: "string", description: "Model", default: "wan-2.1", options: ["wan-2.1", "wan-2.1-1.3b", "kling-2.0", "kling-1.6-pro", "minimax-hailuo", "hunyuan", "luma-ray-2", "ltx-video", "grok-video", "cogvideox-5b", "mochi-v1"] },
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
  input: "Inputs",
  image: "Image",
  video: "Video",
  text: "Text / LLM",
  transform: "Transform",
  output: "Output",
};

// SVG outlined icons for toolbar and nodes
const SVG_ICONS: Record<string, string> = {
  input: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>`,
  image: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  video: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
  text: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  transform: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
  output: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>`,
  settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  run: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
};

// Node-level outlined icons
const NODE_ICONS: Record<string, string> = {
  "text.input": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  "image.text_to_image": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  "video.text_to_video": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
  "image.img_to_img": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>`,
  "transform.upscale": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  "transform.inpaint": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
  "text.llm": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  "output.preview": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
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
  "flux-2-pro": "fal-ai/flux-pro/v1.1",
  "flux-2-dev-lora": "fal-ai/flux-lora",
  "flux-2-flex": "fal-ai/flux/dev",
  "flux-pro-1.1-ultra": "fal-ai/flux-pro/v1.1-ultra",
  "flux-pro-1.1": "fal-ai/flux-pro/v1.1",
  "flux-fast": "fal-ai/flux/schnell",
  "flux-pro": "fal-ai/flux-pro/v1.1",
  "flux-dev": "fal-ai/flux/dev",
  "sd-3.5": "fal-ai/stable-diffusion-v35-large",
  "dall-e-3": "fal-ai/dall-e-3",
  "gpt-image-1.5": "fal-ai/gpt-image-1",
  "imagen-4": "fal-ai/imagen4/preview",
  "imagen-3": "fal-ai/imagen3",
  "imagen-3-fast": "fal-ai/imagen3/fast",
  "ideogram-v3": "fal-ai/ideogram/v3",
  "recraft-v3": "fal-ai/recraft-v3",
  "reve": "fal-ai/reve",
  "higgsfield-image": "fal-ai/higgsfield",
  "wan-2.1": "fal-ai/wan/v2.1",
  "wan-2.1-1.3b": "fal-ai/wan/v2.1/1.3b",
  "kling-2.0": "fal-ai/kling-video/v2/master/text-to-video",
  "kling-1.6-pro": "fal-ai/kling-video/v1.6/pro/text-to-video",
  "minimax-hailuo": "fal-ai/minimax-video/video-01-live/text-to-video",
  "minimax-hailuo-i2v": "fal-ai/minimax-video/image-to-video",
  "hunyuan": "fal-ai/hunyuan-video",
  "luma-ray-2": "fal-ai/luma-dream-machine",
  "ltx-video": "fal-ai/ltx-video",
  "grok-video": "fal-ai/grok-imagine-video",
  "cogvideox-5b": "fal-ai/cogvideox-5b",
  "mochi-v1": "fal-ai/mochi-v1",
  "real-esrgan": "fal-ai/real-esrgan",
};

async function runFalGeneration(
  modelKey: string,
  inputs: Record<string, unknown>,
  apiKey: string,
): Promise<{ url?: string; error?: string }> {
  const falModel = FAL_MODELS[modelKey] || FAL_MODELS["flux-dev"];
  try {
    const isVideo = falModel.includes("video") || falModel.includes("wan") || falModel.includes("kling") || falModel.includes("minimax") || falModel.includes("hunyuan") || falModel.includes("luma") || falModel.includes("ltx") || falModel.includes("grok-imagine-video") || falModel.includes("cogvideo") || falModel.includes("mochi");
    const body: Record<string, unknown> = { prompt: inputs.prompt || "" };
    if (inputs.negative_prompt) body.negative_prompt = inputs.negative_prompt;
    if (isVideo) {
      if (inputs.duration) body.duration = String(Number(inputs.duration)) + "s";
      if (inputs.width && inputs.height) body.video_size = { width: Number(inputs.width), height: Number(inputs.height) };
    } else {
      if (inputs.width) body.image_size = { width: Number(inputs.width), height: Number(inputs.height || inputs.width) };
    }
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
        minWidth: 240,
        maxWidth: 340,
        overflow: "visible",
        fontFamily: "'Inter', -apple-system, 'Helvetica Neue', sans-serif",
        boxShadow: selected
          ? "0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
          : "0 2px 12px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#6b7280", display: "flex" }} dangerouslySetInnerHTML={{ __html: NODE_ICONS[def.id] || "" }} />
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#1a1a1a",
          letterSpacing: "-0.2px",
          fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
        }}>
          {def.name}
        </span>
      </div>

      {/* Single input handle */}
      {def.inputs.length > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            width: 10,
            height: 10,
            background: "#d1d5db",
            border: "2px solid #ffffff",
            left: -6,
            top: "50%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
      )}

      {/* Input fields */}
      <div className="nodrag nowheel" style={{ padding: "4px 0 12px" }}>
        {def.inputs.map((inp) => (
          <div key={inp.name} style={{ padding: "3px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af", marginBottom: 3 }}>{inp.description}</div>
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

      {/* Generate button on nodes with model input */}
      {def.inputs.some((inp) => inp.name === "model") && (
        <div style={{ padding: "4px 18px 8px" }}>
          <button
            onClick={() => {
              const onRun = data.onRun as (() => void) | undefined;
              if (onRun) onRun();
            }}
            disabled={nodeStatus === "running"}
            style={{
              width: "100%",
              padding: "10px",
              background: nodeStatus === "running" ? "#e5e7eb" : "#c026d3",
              color: nodeStatus === "running" ? "#9ca3af" : "#0e0e10",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: nodeStatus === "running" ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              letterSpacing: "-0.2px",
            }}
          >
            {nodeStatus === "running" ? "Generating..." : "Generate ✦"}
          </button>
        </div>
      )}

      {/* Output preview */}
      {outputUrl && (
        <div style={{ padding: "8px 18px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>
              {def.category === "video" ? "Video" : def.category === "image" ? "Image" : "Output"}
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af" }}>
              {(values.model as string) || ""}
            </span>
          </div>
        </div>
      )}
      {outputUrl && (
        <div style={{ padding: "0 18px 12px" }}>
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

      {/* Single output handle */}
      {def.outputs.length > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{
            width: 10,
            height: 10,
            background: "#d1d5db",
            border: "2px solid #ffffff",
            right: -6,
            top: "50%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
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
  const [falApiKey, setFalApiKey] = useState(() => localStorage.getItem("openflow_fal_key") || "148ec4ac-aafc-416b-9213-74cacdeefe5e:0dc2faa972e5762ba57fc758b2fd99e8");
  const idCounter = useRef(0);

  const grouped = useMemo(() => groupByCategory(NODE_DEFS), []);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: false,
            type: "smoothstep",
            style: { stroke: "#d1d5db", strokeWidth: 1.5 },
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

  // Use ref so node callbacks always call latest version
  const runSingleNodeRef = useRef<(nodeId: string) => void>(() => {});

  const addNodeWithHandler = useCallback(
    (def: NodeDef, overrides?: Record<string, unknown>) => {
      idCounter.current += 1;
      const nodeId = `${def.id}_${idCounter.current}`;
      const defaults: Record<string, unknown> = {};
      def.inputs.forEach((inp) => {
        if (inp.default !== undefined) defaults[inp.name] = inp.default;
      });
      if (overrides) Object.assign(defaults, overrides);

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
          onRun: () => runSingleNodeRef.current(nodeId),
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

  const runSingleNode = useCallback(async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const key = falApiKey;
    if (!key) { alert("Set your fal.ai API key in Settings first!"); return; }
    localStorage.setItem("openflow_fal_key", key);

    const values = node.data.values as Record<string, unknown>;
    const modelKey = (values.model as string) || "flux-dev";

    setNodeData(nodeId, { status: "running", outputUrl: undefined });
    const result = await runFalGeneration(modelKey, values, key);
    if (result.url) {
      setNodeData(nodeId, { status: "done", outputUrl: result.url });
    } else {
      setNodeData(nodeId, { status: `Error: ${result.error}` });
    }
  }, [nodes, falApiKey, setNodeData]);

  runSingleNodeRef.current = runSingleNode;

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
          onRun: () => runSingleNodeRef.current(nodeId),
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

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const categories = Object.keys(grouped);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f0f2", color: "#1a1a1a", fontFamily: "'SF Pro Display', 'Inter', -apple-system, 'Helvetica Neue', sans-serif" }}>

      {/* Icon strip — dark left toolbar */}
      <nav style={{
        width: 56,
        background: "#0e0e10",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 16,
        flexShrink: 0,
        zIndex: 20,
      }}>
        {/* Logo — circle */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "#c026d3",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#0e0e10", marginBottom: 24,
          cursor: "pointer", letterSpacing: "-0.5px",
        }}
          title="OpenFlow"
          onClick={() => setActivePanel(null)}
        >
          OF
        </div>

        {/* Category icons */}
        {categories.map((cat) => (
          <button
            key={cat}
            title={CATEGORIES[cat] || cat}
            onClick={() => setActivePanel(activePanel === cat ? null : cat)}
            style={{
              width: 38, height: 38, borderRadius: 10,
              border: "none",
              background: activePanel === cat ? "#1e1e22" : "transparent",
              color: activePanel === cat ? "#c026d3" : "#6b6b75",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 4,
              transition: "all 0.15s",
            }}
            onMouseOver={(e) => { if (activePanel !== cat) e.currentTarget.style.color = "#9ca3af"; }}
            onMouseOut={(e) => { if (activePanel !== cat) e.currentTarget.style.color = "#6b6b75"; }}
            dangerouslySetInnerHTML={{ __html: SVG_ICONS[cat] || "" }}
          />
        ))}

        <div style={{ flex: 1 }} />

        {/* Settings */}
        <button
          title="Settings"
          onClick={() => setActivePanel(activePanel === "settings" ? null : "settings")}
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: "none",
            background: activePanel === "settings" ? "#1e1e22" : "transparent",
            color: activePanel === "settings" ? "#c026d3" : "#6b6b75",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 4,
          }}
          dangerouslySetInnerHTML={{ __html: SVG_ICONS.settings }}
        />

        {/* Run */}
        <button
          title="Run workflow"
          onClick={handleRun}
          disabled={isRunning || nodes.length === 0}
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: "none",
            background: isRunning ? "#2a2a30" : "#c026d3",
            color: isRunning ? "#6b6b75" : "#0e0e10",
            cursor: isRunning ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          dangerouslySetInnerHTML={{ __html: SVG_ICONS.run }}
        />
      </nav>

      {/* Flyout panel */}
      {activePanel && (
        <aside style={{
          width: 220,
          background: "#ffffff",
          borderRight: "1px solid #ebebee",
          overflowY: "auto",
          flexShrink: 0,
          zIndex: 15,
          boxShadow: "4px 0 16px rgba(0,0,0,0.03)",
        }}>
          {activePanel === "settings" ? (
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Settings</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                fal.ai API Key
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
                  fontSize: 12,
                  padding: "8px 12px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
                Free at <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener" style={{ color: "#1a1a1a", fontWeight: 600, textDecoration: "none" }}>fal.ai</a>
              </div>
              <div style={{ fontSize: 10, color: "#c4c4c8", marginTop: 20 }}>
                {nodes.length} nodes · {edges.length} connections
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 0" }}>
              <div style={{ padding: "0 16px 10px", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
                {CATEGORIES[activePanel] || activePanel}
              </div>
              {(grouped[activePanel] || []).map((def) => {
                const modelInput = def.inputs.find((inp) => inp.name === "model");
                const models = modelInput?.options || [];
                return (
                  <div key={def.id}>
                    {/* Node type header */}
                    <div
                      draggable
                      onDragStart={(e) => onDragStart(e, def)}
                      onClick={() => { addNodeWithHandler(def); setActivePanel(null); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 16px",
                        cursor: "grab",
                        transition: "background 0.12s",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = "#f5f5f7"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ color: "#6b7280", display: "flex" }} dangerouslySetInnerHTML={{ __html: NODE_ICONS[def.id] || "" }} />
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{def.name}</div>
                    </div>
                    {/* Model grid */}
                    {models.length > 0 && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                        padding: "4px 12px 12px",
                      }}>
                        {models.map((m) => (
                          <button
                            key={m}
                            onClick={() => { addNodeWithHandler(def, { model: m }); setActivePanel(null); }}
                            style={{
                              background: "#f5f5f7",
                              border: "1px solid #ebebee",
                              borderRadius: 8,
                              padding: "8px 6px",
                              cursor: "pointer",
                              fontSize: 10,
                              fontWeight: 500,
                              color: "#1a1a1a",
                              textAlign: "center",
                              transition: "all 0.12s",
                              lineHeight: 1.3,
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "#e8e8eb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "#f5f5f7"; e.currentTarget.style.borderColor = "#ebebee"; }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      )}

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
          <Background variant={BackgroundVariant.Dots} color="#c0c0c6" gap={28} size={1.2} />
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
