/**
 * OpenClaw — Visual AI Workflow Builder
 *
 * Sprint 2: Dashboard, Asset Manager, Chat, Mini-Apps, New Node Types
 */

import { useCallback, useMemo, useState, useRef, useEffect, type DragEvent } from "react";
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
import { ModelManagerPanel } from "./ModelManager";
import { WorkflowTemplatesPanel } from "./WorkflowTemplates";
import { saveTrainingRecord, getTrainingDataCount, exportTrainingData, getTrainingRecords, clearTrainingData } from "./TrainingData";
import { useToast } from "./Toast";

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

interface Asset {
  url: string;
  type: "image" | "video";
  prompt: string;
  model: string;
  timestamp: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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
      { name: "model", type: "string", description: "Model", default: "flux-2-pro", options: ["flux-2-pro", "flux-2-dev-lora", "flux-2-flex", "flux-pro-1.1-ultra", "flux-pro-1.1", "flux-fast", "nano-banana-pro", "sd-3.5", "dall-e-3", "gpt-image-1.5", "grok-image", "imagen-4", "imagen-3", "imagen-3-fast", "ideogram-v3", "recraft-v3", "reve", "higgsfield-image"] },
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
      { name: "model", type: "string", description: "Model", default: "wan-2.1", options: ["kling-3.0-pro", "kling-2.6-pro", "kling-2.0", "wan-2.1", "wan-2.1-1.3b", "minimax-hailuo", "hunyuan", "luma-ray-2", "ltx-video", "ltx-2-19b", "veo-3.1", "grok-video", "cogvideox-5b", "mochi-v1"] },
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
  // New node types for Sprint 2
  {
    id: "video.img_to_video",
    name: "Image to Video",
    description: "Generate video from an image",
    category: "video",
    icon: "🎥",
    color: "#f59e0b",
    inputs: [
      { name: "image_url", type: "string", description: "Image URL", required: true },
      { name: "prompt", type: "string", description: "Motion prompt", required: true },
      { name: "model", type: "string", description: "Model", default: "minimax-hailuo-i2v", options: ["minimax-hailuo-i2v", "ltx-2-19b", "veo-3.1"] },
      { name: "duration", type: "integer", description: "Duration (sec)", default: 4, options: ["2", "4", "6", "8"] },
    ],
    outputs: [
      { name: "video", type: "video", description: "Generated video" },
    ],
  },
  {
    id: "audio.placeholder",
    name: "Audio / Music",
    description: "Generate audio (coming soon)",
    category: "output",
    icon: "🎵",
    color: "#64748b",
    inputs: [
      { name: "prompt", type: "string", description: "Audio description", required: true },
      { name: "duration", type: "integer", description: "Duration (sec)", default: 10 },
    ],
    outputs: [
      { name: "audio", type: "string", description: "Audio URL" },
    ],
  },
  {
    id: "transform.merge",
    name: "Merge / Composite",
    description: "Combine multiple images side by side",
    category: "transform",
    icon: "🧩",
    color: "#14b8a6",
    inputs: [
      { name: "image_1", type: "string", description: "Image 1 URL", required: true },
      { name: "image_2", type: "string", description: "Image 2 URL", required: true },
      { name: "layout", type: "string", description: "Layout", default: "side-by-side", options: ["side-by-side", "stacked", "grid-2x2"] },
    ],
    outputs: [
      { name: "image", type: "image", description: "Merged image" },
    ],
  },
  // Sprint 4: Advanced Tool Nodes
  {
    id: "tools.prompt_enhancer",
    name: "Prompt Enhancer",
    description: "Expand a basic prompt into a detailed one using AI",
    category: "tools",
    icon: "✨",
    color: "#a855f7",
    inputs: [
      { name: "prompt", type: "string", description: "Basic prompt", required: true },
      { name: "style", type: "string", description: "Style hint", default: "photorealistic", options: ["photorealistic", "cinematic", "anime", "oil painting", "watercolor", "3d render", "pixel art", "sketch"] },
    ],
    outputs: [
      { name: "text", type: "string", description: "Enhanced prompt" },
    ],
  },
  {
    id: "tools.bg_remover",
    name: "Background Remover",
    description: "Remove background from an image",
    category: "tools",
    icon: "🪄",
    color: "#a855f7",
    inputs: [
      { name: "image_url", type: "string", description: "Image URL", required: true },
    ],
    outputs: [
      { name: "image", type: "image", description: "Image with background removed" },
    ],
  },
  {
    id: "tools.face_swap",
    name: "Face Swap",
    description: "Swap faces between images (coming soon)",
    category: "tools",
    icon: "🎭",
    color: "#a855f7",
    inputs: [
      { name: "source_url", type: "string", description: "Source face image URL", required: true },
      { name: "target_url", type: "string", description: "Target image URL", required: true },
    ],
    outputs: [
      { name: "image", type: "image", description: "Face-swapped image" },
    ],
  },
  {
    id: "tools.inpainting",
    name: "Inpainting (AI Mask)",
    description: "Edit image regions using text mask description",
    category: "tools",
    icon: "🖌️",
    color: "#a855f7",
    inputs: [
      { name: "image_url", type: "string", description: "Image URL", required: true },
      { name: "mask_prompt", type: "string", description: "What to mask (e.g. 'the sky')", required: true },
      { name: "prompt", type: "string", description: "What to replace with", required: true },
      { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "sd-3.5"] },
    ],
    outputs: [
      { name: "image", type: "image", description: "Edited image" },
    ],
  },
  {
    id: "image.input",
    name: "Image Input",
    description: "Upload or drop an image",
    category: "input",
    icon: "📷",
    color: "#6366f1",
    inputs: [
      { name: "image_url", type: "string", description: "Image URL or data URL", required: true },
    ],
    outputs: [{ name: "image", type: "image", description: "Image output" }],
  },
  {
    id: "tools.controlnet",
    name: "ControlNet",
    description: "Guided generation with control image",
    category: "tools",
    icon: "🎯",
    color: "#a855f7",
    inputs: [
      { name: "image_url", type: "string", description: "Control image URL", required: true },
      { name: "prompt", type: "string", description: "Generation prompt", required: true },
      { name: "control_type", type: "string", description: "Control type", default: "canny", options: ["canny", "depth", "pose"] },
      { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "sd-3.5"] },
    ],
    outputs: [
      { name: "image", type: "image", description: "Generated image" },
    ],
  },
];

const CATEGORIES: Record<string, string> = {
  input: "Inputs",
  image: "Image",
  video: "Video",
  text: "Text / LLM",
  transform: "Transform",
  output: "Output",
  tools: "Tools",
};

// SVG outlined icons for toolbar and nodes
const SVG_ICONS: Record<string, string> = {
  input: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>`,
  image: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  video: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
  text: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  transform: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
  output: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>`,
  tools: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  run: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  scenes: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="8" y1="2" x2="8" y2="22"/></svg>`,
  save: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  assets: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  chat: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  dashboard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
};

const NODE_ICONS: Record<string, string> = {
  "text.input": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  "image.text_to_image": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  "video.text_to_video": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
  "image.img_to_img": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>`,
  "transform.upscale": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  "transform.inpaint": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
  "text.llm": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  "output.preview": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  "video.img_to_video": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`,
  "audio.placeholder": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  "transform.merge": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="20" height="9" rx="1"/></svg>`,
  "tools.prompt_enhancer": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  "tools.bg_remover": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  "tools.face_swap": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  "tools.inpainting": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>`,
  "image.input": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  "tools.controlnet": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>`,
};

function groupByCategory(defs: NodeDef[]) {
  const g: Record<string, NodeDef[]> = {};
  for (const d of defs) {
    if (!g[d.category]) g[d.category] = [];
    g[d.category].push(d);
  }
  return g;
}

const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation();

// ---------------------------------------------------------------------------
// fal.ai integration
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
  "nano-banana-pro": "fal-ai/nano-banana-pro",
  "grok-image": "fal-ai/grok-imagine-image",
  "wan-2.1": "fal-ai/wan/v2.1",
  "wan-2.1-1.3b": "fal-ai/wan/v2.1/1.3b",
  "kling-3.0-pro": "fal-ai/kling-video/v3/pro/text-to-video",
  "kling-2.6-pro": "fal-ai/kling-video/v2.6/pro/text-to-video",
  "kling-2.0": "fal-ai/kling-video/v2/master/text-to-video",
  "minimax-hailuo": "fal-ai/minimax-video/video-01-live/text-to-video",
  "minimax-hailuo-i2v": "fal-ai/minimax-video/image-to-video",
  "hunyuan": "fal-ai/hunyuan-video",
  "luma-ray-2": "fal-ai/luma-dream-machine",
  "ltx-video": "fal-ai/ltx-video",
  "ltx-2-19b": "fal-ai/ltx-video/ltx-2-19b/image-to-video",
  "veo-3.1": "fal-ai/veo3/v3.1/image-to-video",
  "grok-video": "fal-ai/grok-imagine-video",
  "cogvideox-5b": "fal-ai/cogvideox-5b",
  "mochi-v1": "fal-ai/mochi-v1",
  "real-esrgan": "fal-ai/real-esrgan",
  "clarity-upscaler": "fal-ai/clarity-upscaler",
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
    if (inputs.image_url) body.image_url = inputs.image_url;
    if (isVideo) {
      if (inputs.duration) body.duration = String(Number(inputs.duration)) + "s";
      if (inputs.width && inputs.height) body.video_size = { width: Number(inputs.width), height: Number(inputs.height) };
    } else {
      if (inputs.width) body.image_size = { width: Number(inputs.width), height: Number(inputs.height || inputs.width) };
    }
    if (inputs.guidance_scale) body.guidance_scale = Number(inputs.guidance_scale);
    if (inputs.steps) body.num_inference_steps = Number(inputs.steps);
    if (inputs.seed && Number(inputs.seed) >= 0) body.seed = Number(inputs.seed);
    if (inputs.scale) body.scale = Number(inputs.scale);
    if (inputs.image) body.image_url = inputs.image;

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
// Asset Manager helpers
// ---------------------------------------------------------------------------

function getAssets(): Asset[] {
  try {
    return JSON.parse(localStorage.getItem("openflow_assets") || "[]");
  } catch {
    return [];
  }
}

function saveAsset(asset: Asset) {
  const assets = getAssets();
  assets.unshift(asset);
  // Keep max 200
  if (assets.length > 200) assets.length = 200;
  localStorage.setItem("openflow_assets", JSON.stringify(assets));
}

// ---------------------------------------------------------------------------
// Custom Node Component
// ---------------------------------------------------------------------------

function FlowNode({ data, selected }: NodeProps) {
  const def = data.def as NodeDef;
  const values = data.values as Record<string, unknown>;
  const onChange = data.onChange as (key: string, val: unknown) => void;
  const outputUrl = data.outputUrl as string | undefined;
  const nodeStatus = data.status as string | undefined;
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(true);

  const onPreview = data.onPreview as ((url: string, type: "image" | "video") => void) | undefined;
  const isExecuting = data.isExecuting as boolean | undefined;
  const isComplete = nodeStatus === "done" && outputUrl;
  const isFailed = typeof nodeStatus === "string" && nodeStatus.startsWith("Error");
  const showForm = editing || !isComplete;

  const cardStyle = {
    background: "#ffffff",
    border: isExecuting ? "2px solid #f59e0b" : isFailed ? "2px solid #ef4444" : isComplete && !showForm ? "2px solid #22c55e" : selected ? "1.5px solid #d1d5db" : "1px solid #e8e8eb",
    borderRadius: 16,
    minWidth: 260,
    maxWidth: 360,
    overflow: "visible" as const,
    fontFamily: "'Inter', -apple-system, 'Helvetica Neue', sans-serif",
    boxShadow: selected
      ? "0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
      : "0 2px 12px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)",
    transition: "box-shadow 0.2s, border-color 0.2s",
  };

  if (isComplete && !showForm) {
    const model = (values.model as string) || "";
    const prompt = (values.prompt as string) || (values.text as string) || "";
    const w = values.width ? String(values.width) : "";
    const h = values.height ? String(values.height) : "";
    const dur = values.duration ? `${values.duration}s` : "";
    const aspectRatio = w && h ? `${Number(w) > Number(h) ? "16:9" : Number(w) === Number(h) ? "1:1" : "9:16"}` : "";
    const resolution = h ? `${h}p` : "";

    return (
      <div style={cardStyle}>
        <div style={{ padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#6b7280", display: "flex" }} dangerouslySetInnerHTML={{ __html: NODE_ICONS[def.id] || "" }} />
            <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{def.name}</span>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e8e8eb", background: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#6b7280" }}>⋮</button>
            {showMenu && (
              <div style={{ position: "absolute", right: 0, top: 32, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 140, overflow: "hidden" }}>
                {[
                  { label: "Edit Settings", action: () => { setEditing(true); setShowMenu(false); } },
                  { label: "Retry", action: () => { const onRun = data.onRun as (() => void) | undefined; if (onRun) onRun(); setShowMenu(false); } },
                  { label: "Delete", action: () => { const onDelete = data.onDelete as (() => void) | undefined; if (onDelete) onDelete(); setShowMenu(false); } },
                ].map((item) => (
                  <button key={item.label} onClick={item.action} style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", fontSize: 12, fontWeight: 500, color: item.label === "Delete" ? "#ef4444" : "#1a1a1a", cursor: "pointer", textAlign: "left" }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#f5f5f7"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: "0 18px 10px", fontSize: 12, color: "#6b7280", lineHeight: 2 }}>
          {dur && <div>⏱ {dur}</div>}
          {aspectRatio && <div>▢ {aspectRatio}</div>}
          {resolution && <div>◫ {resolution}</div>}
          <div>◎ {model}</div>
          <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 4, fontStyle: "italic" }}>{prompt.length > 60 ? prompt.slice(0, 60) + "..." : prompt}</div>
        </div>
        <div style={{ padding: "0 18px 16px", cursor: "pointer" }} onClick={() => { const isVid = def.category === "video" || def.id === "video.img_to_video"; if (onPreview && outputUrl) onPreview(outputUrl, isVid ? "video" : "image"); }}>
          {def.category === "video" || def.id === "video.img_to_video" ? (
            <video src={outputUrl} controls autoPlay loop muted style={{ width: "100%", maxHeight: 120, borderRadius: 12, objectFit: "cover" }} />
          ) : (
            <img src={outputUrl} alt="output" style={{ width: "100%", maxHeight: 120, borderRadius: 12, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
          )}
          <div style={{ fontSize: 9, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>Click to expand</div>
        </div>
        {def.inputs.length > 0 && <Handle type="target" position={Position.Left} id="in" style={{ width: 10, height: 10, background: "#d1d5db", border: "2px solid #ffffff", left: -6, top: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />}
        {def.outputs.length > 0 && <Handle type="source" position={Position.Right} id="out" style={{ width: 10, height: 10, background: "#d1d5db", border: "2px solid #ffffff", right: -6, top: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#6b7280", display: "flex" }} dangerouslySetInnerHTML={{ __html: NODE_ICONS[def.id] || "" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.2px" }}>{def.name}</span>
      </div>
      {def.inputs.length > 0 && <Handle type="target" position={Position.Left} id="in" style={{ width: 10, height: 10, background: "#d1d5db", border: "2px solid #ffffff", left: -6, top: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />}
      <div className="nodrag nowheel" style={{ padding: "4px 0 12px" }}>
        {def.inputs.map((inp) => (
          <div key={inp.name} style={{ padding: "3px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af", marginBottom: 3 }}>{inp.description}</div>
            {inp.type === "string" && !inp.options && (
              inp.name === "prompt" || inp.name === "system" || inp.name === "text" ? (
                <textarea onKeyDown={stopKeys} value={(values[inp.name] as string) || ""} onChange={(e) => onChange(inp.name, e.target.value)} placeholder={inp.description} rows={3}
                  style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 14, padding: "10px 14px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
              ) : (
                <input onKeyDown={stopKeys} type="text" value={(values[inp.name] as string) || ""} onChange={(e) => onChange(inp.name, e.target.value)} placeholder={inp.description}
                  style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 13, padding: "8px 14px", outline: "none" }} />
              )
            )}
            {inp.options && (
              <select onKeyDown={stopKeys} value={String(values[inp.name] ?? inp.default ?? "")} onChange={(e) => onChange(inp.name, e.target.value)}
                style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 13, padding: "8px 14px", outline: "none", cursor: "pointer", WebkitAppearance: "none" }}>
                {inp.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            )}
            {(inp.type === "integer" || inp.type === "float") && !inp.options && (
              <input onKeyDown={stopKeys} type="number" value={String(values[inp.name] ?? inp.default ?? "")}
                onChange={(e) => onChange(inp.name, inp.type === "float" ? parseFloat(e.target.value) : parseInt(e.target.value))}
                step={inp.type === "float" ? 0.1 : 1}
                style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 13, padding: "8px 14px", outline: "none" }} />
            )}
          </div>
        ))}
      </div>
      {def.inputs.some((inp) => inp.name === "model") && (
        <div style={{ padding: "4px 18px 8px" }}>
          <button onClick={() => { setEditing(false); const onRun = data.onRun as (() => void) | undefined; if (onRun) onRun(); }}
            disabled={nodeStatus === "running"}
            style={{ width: "100%", padding: "10px", background: nodeStatus === "running" ? "#e5e7eb" : "#c026d3", color: nodeStatus === "running" ? "#9ca3af" : "#ffffff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: nodeStatus === "running" ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
            {nodeStatus === "running" ? "Generating..." : "Generate ✦"}
          </button>
        </div>
      )}
      {nodeStatus && nodeStatus !== "done" && (
        <div style={{ padding: "8px 18px 12px", fontSize: 11, fontWeight: 500, color: nodeStatus === "running" ? "#92400e" : "#991b1b", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: nodeStatus === "running" ? "#f59e0b" : "#ef4444" }} />
          {nodeStatus === "running" ? "Generating..." : nodeStatus}
        </div>
      )}
      {nodeStatus === "done" && outputUrl && (
        <div style={{ padding: "4px 18px 12px", cursor: "pointer" }} onClick={() => { const isVid = def.category === "video" || def.id === "video.img_to_video"; if (onPreview && outputUrl) onPreview(outputUrl, isVid ? "video" : "image"); }}>
          {def.category === "video" || def.id === "video.img_to_video" ? (
            <video src={outputUrl} muted style={{ width: "100%", maxHeight: 120, borderRadius: 10, objectFit: "cover" }} />
          ) : (
            <img src={outputUrl} alt="output" style={{ width: "100%", maxHeight: 120, borderRadius: 10, objectFit: "cover" }} />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><span style={{ color: "#22c55e", fontSize: 12 }}>✓</span><span style={{ fontSize: 9, color: "#9ca3af" }}>Done · Click to expand</span></div>
        </div>
      )}
      {isFailed && (
        <div style={{ padding: "4px 18px 8px", display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#ef4444", fontSize: 12 }}>✗</span><span style={{ fontSize: 9, color: "#ef4444" }}>Failed</span></div>
      )}
      {def.outputs.length > 0 && <Handle type="source" position={Position.Right} id="out" style={{ width: 10, height: 10, background: "#d1d5db", border: "2px solid #ffffff", right: -6, top: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />}
    </div>
  );
}

const nodeTypes = { flowNode: FlowNode };

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "'Inter', -apple-system, sans-serif", background: "#0a0a0b", color: "#ffffff", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", maxWidth: 640, minWidth: 400 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "24px 80px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>OC</div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.5px" }}>OpenClaw</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="https://github.com/nikolateslasagent/openflow" target="_blank" rel="noopener" style={{ color: "#9ca3af", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>GitHub</a>
            <button onClick={onEnter} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Get started</button>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1a1a1f", border: "1px solid #2a2a30", borderRadius: 20, padding: "6px 16px", marginBottom: 32, width: "fit-content" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb", letterSpacing: "0.3px" }}>NO SUBSCRIPTIONS & NO MARKUP!</span>
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-2px", margin: "0 0 20px", background: "linear-gradient(to bottom, #ffffff, #a0a0a8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Your Creative<br />Agent</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#9ca3af", margin: "0 0 40px", maxWidth: 420 }}>Imagine anything and bring it to life — from images to sounds to video. All in one place.</p>
        <button onClick={onEnter} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 10, border: "1px solid #333", background: "#ffffff", color: "#0a0a0b", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "fit-content", transition: "transform 0.15s", letterSpacing: "-0.3px" }}
          onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
          Get started for free <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0f0f12 0%, #1a1a22 50%, #0f0f12 100%)" }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(192,38,211,0.15) 0%, transparent 70%)", top: "20%", left: "30%", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", bottom: "20%", right: "20%", filter: "blur(60px)" }} />
        <div style={{ width: 520, background: "#1a1a1f", borderRadius: 12, border: "1px solid #2a2a30", boxShadow: "0 25px 80px rgba(0,0,0,0.5)", overflow: "hidden", position: "relative" }}>
          <div style={{ padding: "12px 16px", display: "flex", gap: 6, borderBottom: "1px solid #2a2a30" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          </div>
          <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #0e0e12 0%, #141418 100%)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, margin: "0 auto 16px", color: "#fff" }}>OC</div>
              <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Your workspace awaits</div>
              <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>18 image models · 14 video models · unlimited creativity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini-App Templates
// ---------------------------------------------------------------------------

interface MiniAppTemplate {
  name: string;
  icon: string;
  description: string;
  color: string;
  nodes: Array<{ defId: string; values?: Record<string, unknown>; x: number; y: number }>;
  edges: Array<{ from: number; to: number }>;
}

const MINI_APPS: MiniAppTemplate[] = [
  {
    name: "Product Photo",
    icon: "📸",
    description: "Generate stunning product photography with AI",
    color: "#ec4899",
    nodes: [
      { defId: "text.input", values: { text: "Professional product photography of a luxury watch on marble, dramatic lighting, 8k" }, x: 100, y: 150 },
      { defId: "image.text_to_image", values: { model: "flux-pro-1.1-ultra", width: 1024, height: 1024 }, x: 500, y: 100 },
      { defId: "transform.upscale", values: { scale: 2, model: "real-esrgan" }, x: 900, y: 150 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
  },
  {
    name: "Social Media Video",
    icon: "📱",
    description: "Create scroll-stopping video content",
    color: "#f59e0b",
    nodes: [
      { defId: "text.input", values: { text: "Colorful abstract shapes morphing and flowing, trendy social media aesthetic, vibrant" }, x: 100, y: 150 },
      { defId: "image.text_to_image", values: { model: "flux-fast", width: 768, height: 1024 }, x: 500, y: 80 },
      { defId: "video.text_to_video", values: { model: "wan-2.1", duration: 4, width: 768, height: 1024 }, x: 500, y: 320 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 0, to: 2 }],
  },
  {
    name: "Storyboard",
    icon: "🎬",
    description: "Build a visual storyboard scene by scene",
    color: "#6366f1",
    nodes: [
      { defId: "image.text_to_image", values: { prompt: "Scene 1: Wide establishing shot, cinematic", model: "flux-pro-1.1", width: 1280, height: 720 }, x: 100, y: 150 },
      { defId: "image.text_to_image", values: { prompt: "Scene 2: Close-up character shot, dramatic lighting", model: "flux-pro-1.1", width: 1280, height: 720 }, x: 500, y: 150 },
      { defId: "image.text_to_image", values: { prompt: "Scene 3: Action sequence, dynamic angle", model: "flux-pro-1.1", width: 1280, height: 720 }, x: 900, y: 150 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
  },
  {
    name: "Music Video",
    icon: "🎵",
    description: "Create AI-powered music video visuals",
    color: "#8b5cf6",
    nodes: [
      { defId: "text.input", values: { text: "Psychedelic neon dreamscape, floating crystals, surreal atmosphere" }, x: 100, y: 200 },
      { defId: "image.text_to_image", values: { model: "reve", width: 1280, height: 720 }, x: 500, y: 100 },
      { defId: "video.text_to_video", values: { model: "wan-2.1", duration: 6, width: 1280, height: 720 }, x: 500, y: 350 },
      { defId: "audio.placeholder", values: { prompt: "Ambient electronic music, dreamy synths", duration: 10 }, x: 900, y: 350 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 2, to: 3 }],
  },
];

// ---------------------------------------------------------------------------
// Dashboard Component
// ---------------------------------------------------------------------------

function Dashboard({ onNewProject, onOpenCanvas, onLoadTemplate, assets }: {
  onNewProject: () => void;
  onOpenCanvas: () => void;
  onLoadTemplate: (template: MiniAppTemplate) => void;
  assets: Asset[];
}) {
  return (
    <div style={{ flex: 1, background: "#f0f0f2", overflow: "auto", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>Welcome back ✦</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Create, generate, and manage your AI workflows</p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { label: "New Project", icon: "◎", desc: "Start with a blank canvas", color: "#c026d3", action: onNewProject },
            { label: "Scene Builder", icon: "🎬", desc: "Build scenes from a story", color: "#6366f1", action: onOpenCanvas },
            { label: "Browse Models", icon: "◫", desc: "18 image + 14 video models", color: "#14b8a6", action: onOpenCanvas },
          ].map((item) => (
            <button key={item.label} onClick={item.action} style={{
              padding: "24px", background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 16,
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.boxShadow = `0 4px 16px ${item.color}20`; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e8e8eb"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)"; }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Mini-Apps / Templates */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 16, letterSpacing: "-0.3px" }}>Templates & Mini-Apps</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            {MINI_APPS.map((app) => (
              <button key={app.name} onClick={() => onLoadTemplate(app)} style={{
                padding: "20px", background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 14,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = app.color; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e8e8eb"; }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{app.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{app.name}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>{app.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Usage Stats */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Usage</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
            {[
              { label: "Images Generated", value: assets.filter(a => a.type === "image").length, icon: "🖼️" },
              { label: "Videos Generated", value: assets.filter(a => a.type === "video").length, icon: "🎬" },
              { label: "Total Assets", value: assets.length, icon: "📦" },
              { label: "Models Available", value: "32+", icon: "🤖" },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "20px", background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 14 }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Assets */}
        {assets.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Recent Assets</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {assets.slice(0, 8).map((asset, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8eb", background: "#fff" }}>
                  {asset.type === "video" ? (
                    <video src={asset.url} style={{ width: "100%", height: 120, objectFit: "cover" }} muted />
                  ) : (
                    <img src={asset.url} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />
                  )}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.prompt || asset.model}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset Manager Panel
// ---------------------------------------------------------------------------

function AssetManagerPanel({ assets }: { assets: Asset[] }) {
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const filtered = filter === "all" ? assets : assets.filter(a => a.type === filter);

  return (
    <>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>🖼️ Asset Manager</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{assets.length} total</div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {(["all", "image", "video"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 600,
              background: filter === f ? "#c026d3" : "#f5f5f7", color: filter === f ? "#fff" : "#6b7280",
              cursor: "pointer", textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: 20 }}>No assets yet. Generate something!</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {filtered.map((asset, i) => (
            <div key={i} onClick={() => setPreviewAsset(asset)} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e8e8eb", cursor: "pointer", background: "#f5f5f7" }}>
              {asset.type === "video" ? (
                <video src={asset.url} style={{ width: "100%", height: 70, objectFit: "cover" }} muted />
              ) : (
                <img src={asset.url} alt="" style={{ width: "100%", height: 70, objectFit: "cover" }} />
              )}
              <div style={{ padding: "4px 6px", fontSize: 8, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.model}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewAsset && (
        <div onClick={() => setPreviewAsset(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 40,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: "90vh", background: "#fff", borderRadius: 16, overflow: "hidden" }}>
            {previewAsset.type === "video" ? (
              <video src={previewAsset.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "70vh" }} />
            ) : (
              <img src={previewAsset.url} alt="" style={{ maxWidth: "100%", maxHeight: "70vh" }} />
            )}
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{previewAsset.model}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{previewAsset.prompt?.slice(0, 80)}</div>
              </div>
              <a href={previewAsset.url} download target="_blank" rel="noopener" style={{
                padding: "8px 16px", background: "#c026d3", color: "#fff", borderRadius: 8,
                fontSize: 12, fontWeight: 600, textDecoration: "none",
              }}>Download</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Chat Panel
// ---------------------------------------------------------------------------

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your AI workflow assistant. I can help you:\n\n• Build creative workflows\n• Choose the right model for your project\n• Suggest prompts and techniques\n\nWhat would you like to create?", timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const TIPS: Record<string, string> = {
    "image": "For images, try flux-pro-1.1-ultra for highest quality, or flux-fast for speed. Use detailed prompts with style, lighting, and mood.",
    "video": "For video, wan-2.1 is great for general use. kling-3.0-pro excels at realistic motion. Keep prompts focused on movement.",
    "upscale": "Use the Upscale node with real-esrgan for 2x or 4x resolution increase. Works best on AI-generated images.",
    "prompt": "Great prompts include: subject, style, lighting, mood, camera angle. Example: 'Cinematic close-up of a crystal dragon, volumetric fog, golden hour lighting, 8k'",
    "help": "Available nodes: Text to Image, Text to Video, Image to Image, Upscale, Inpaint, LLM Chat, Image to Video, Merge. Drag them from the left toolbar!",
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simple keyword matching for tips
    const lower = input.toLowerCase();
    let response = "I'd suggest starting with a Text to Image node — drag one from the Image category in the left toolbar. Try a detailed prompt describing what you want to create!";

    for (const [key, tip] of Object.entries(TIPS)) {
      if (lower.includes(key)) { response = tip; break; }
    }

    if (lower.includes("scene") || lower.includes("story")) {
      response = "Use the Scene Builder (grid icon in the left toolbar) to automatically split a story into connected image nodes. Write your narrative and it'll create a visual storyboard!";
    }
    if (lower.includes("template") || lower.includes("mini")) {
      response = "Check the Dashboard for pre-built templates: Product Photo, Social Media Video, Storyboard, and Music Video. Each one sets up connected nodes ready to generate!";
    }

    await new Promise(r => setTimeout(r, 600));
    setMessages(prev => [...prev, { role: "assistant", content: response, timestamp: Date.now() }]);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px 8px", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>💬 AI Assistant</div>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 16px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
              background: msg.role === "user" ? "#c026d3" : "#f5f5f7",
              color: msg.role === "user" ? "#fff" : "#1a1a1a",
              fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap",
            }}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f5f5f7", fontSize: 12, color: "#9ca3af", display: "inline-block" }}>Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "8px 16px 16px", display: "flex", gap: 6 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
          placeholder="Ask about workflows, models, prompts..."
          style={{ flex: 1, background: "#f5f5f7", border: "none", borderRadius: 10, fontSize: 12, padding: "10px 14px", outline: "none" }} />
        <button onClick={sendMessage} disabled={loading} style={{
          padding: "10px 14px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 10,
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Send</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generation History Panel
// ---------------------------------------------------------------------------

function HistoryPanel({ onRerun }: { onRerun: (record: { model: string; prompt: string; params: Record<string, unknown> }) => void }) {
  const [records, setRecords] = useState(() => getTrainingRecords());
  const [selectedRecord, setSelectedRecord] = useState<null | typeof records[0]>(null);

  const refresh = () => setRecords(getTrainingRecords());

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>🕐 Generation History</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={refresh} style={{ padding: "4px 8px", background: "#f5f5f7", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer", color: "#6b7280" }}>↻</button>
          <button onClick={() => { clearTrainingData(); refresh(); }} style={{ padding: "4px 8px", background: "#fef2f2", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer", color: "#ef4444" }}>Clear</button>
        </div>
      </div>
      {records.length === 0 && <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: 20 }}>No generations yet</div>}
      <div style={{ flex: 1, overflow: "auto" }}>
        {selectedRecord ? (
          <div>
            <button onClick={() => setSelectedRecord(null)} style={{ padding: "4px 8px", background: "#f5f5f7", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer", color: "#6b7280", marginBottom: 12 }}>← Back</button>
            {selectedRecord.output_url && (
              selectedRecord.output_url.includes("video") ? 
                <video src={selectedRecord.output_url} controls style={{ width: "100%", borderRadius: 10, marginBottom: 12 }} /> :
                <img src={selectedRecord.output_url} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 12 }} />
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{selectedRecord.model}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, lineHeight: 1.5 }}>{selectedRecord.prompt}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>⏱ {(selectedRecord.generation_time_ms / 1000).toFixed(1)}s</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12 }}>📅 {new Date(selectedRecord.timestamp).toLocaleString()}</div>
            <button onClick={() => { onRerun({ model: selectedRecord.model, prompt: selectedRecord.prompt, params: selectedRecord.params }); }}
              style={{ width: "100%", padding: "10px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Re-run ✦
            </button>
          </div>
        ) : (
          records.map((r, i) => (
            <div key={i} onClick={() => setSelectedRecord(r)}
              style={{ display: "flex", gap: 8, padding: "8px 6px", cursor: "pointer", borderRadius: 8, marginBottom: 2, transition: "background 0.12s" }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#f5f5f7"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}>
              {r.output_url && <img src={r.output_url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.prompt?.slice(0, 50) || "No prompt"}</div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{r.model} · {(r.generation_time_ms / 1000).toFixed(1)}s · {new Date(r.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<"dashboard" | "canvas" | "assets">("dashboard");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [falApiKey, setFalApiKey] = useState(() => localStorage.getItem("openflow_fal_key") || "148ec4ac-aafc-416b-9213-74cacdeefe5e:0dc2faa972e5762ba57fc758b2fd99e8");
  const [assets, setAssets] = useState<Asset[]>(() => getAssets());
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("openflow_dark") === "true");
  const [executionProgress, setExecutionProgress] = useState<{ current: number; total: number; currentNodeId: string | null; log: string[] } | null>(null);
  const cancelRef = useRef(false);
  const [previewModal, setPreviewModal] = useState<{ url: string; type: "image" | "video" } | null>(null);
  // Undo/Redo
  const [undoStack, setUndoStack] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const skipHistoryRef = useRef(false);
  const idCounter = useRef(0);
  const { addToast, ToastContainer } = useToast();

  const grouped = useMemo(() => groupByCategory(NODE_DEFS), []);

  const refreshAssets = useCallback(() => setAssets(getAssets()), []);

  // Push to undo stack on meaningful changes
  const pushUndo = useCallback(() => {
    setUndoStack(prev => {
      const snap = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
      const next = [...prev, snap];
      if (next.length > 50) next.shift();
      return next;
    });
    setRedoStack([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const state = newStack.pop()!;
      setRedoStack(r => [...r, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
      skipHistoryRef.current = true;
      // Restore nodes with handlers
      const restoredNodes = state.nodes.map((n: Node) => {
        return { ...n, data: { ...n.data, onChange: (key: string, val: unknown) => updateNodeValue(n.id, key, val), onRun: () => runSingleNodeRef.current(n.id), onDelete: () => setNodes((nds: Node[]) => nds.filter((nd: Node) => nd.id !== n.id)), onPreview: (url: string, type: "image" | "video") => setPreviewModal({ url, type }) } };
      });
      setNodes(restoredNodes);
      setEdges(state.edges);
      return newStack;
    });
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const state = newStack.pop()!;
      setUndoStack(u => [...u, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
      skipHistoryRef.current = true;
      const restoredNodes = state.nodes.map((n: Node) => {
        return { ...n, data: { ...n.data, onChange: (key: string, val: unknown) => updateNodeValue(n.id, key, val), onRun: () => runSingleNodeRef.current(n.id), onDelete: () => setNodes((nds: Node[]) => nds.filter((nd: Node) => nd.id !== n.id)), onPreview: (url: string, type: "image" | "video") => setPreviewModal({ url, type }) } };
      });
      setNodes(restoredNodes);
      setEdges(state.edges);
      return newStack;
    });
  }, [nodes, edges, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: false, type: "smoothstep", style: { stroke: "#d1d5db", strokeWidth: 1.5 } }, eds));
    },
    [setEdges]
  );

  const updateNodeValue = useCallback(
    (nodeId: string, key: string, val: unknown) => {
      setNodes((nds) => nds.map((n) => {
        if (n.id !== nodeId) return n;
        return { ...n, data: { ...n.data, values: { ...(n.data.values as Record<string, unknown>), [key]: val } } };
      }));
    },
    [setNodes]
  );

  const runSingleNodeRef = useRef<(nodeId: string) => void>(() => {});

  const setNodeData = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, ...patch } };
    }));
  }, [setNodes]);

  const addNodeWithHandler = useCallback(
    (def: NodeDef, overrides?: Record<string, unknown>) => {
      idCounter.current += 1;
      const nodeId = `${def.id}_${idCounter.current}`;
      const defaults: Record<string, unknown> = {};
      def.inputs.forEach((inp) => { if (inp.default !== undefined) defaults[inp.name] = inp.default; });
      if (overrides) Object.assign(defaults, overrides);

      const newNode: Node = {
        id: nodeId,
        type: "flowNode",
        position: { x: 100 + Math.random() * 400, y: 50 + Math.random() * 300 },
        data: {
          def, values: defaults,
          onChange: (key: string, val: unknown) => updateNodeValue(nodeId, key, val),
          onRun: () => runSingleNodeRef.current(nodeId),
          onDelete: () => { pushUndo(); setNodes((nds: Node[]) => nds.filter((n: Node) => n.id !== nodeId)); },
          onPreview: (url: string, type: "image" | "video") => setPreviewModal({ url, type }),
        },
      };
      setNodes((nds) => [...nds, newNode]);
      return nodeId;
    },
    [setNodes, updateNodeValue]
  );

  const runSingleNode = useCallback(async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const key = falApiKey;
    if (!key) { addToast("Set your fal.ai API key in Settings first!", "error"); return; }
    localStorage.setItem("openflow_fal_key", key);

    const def = node.data.def as NodeDef;
    const values = node.data.values as Record<string, unknown>;
    const modelKey = (values.model as string) || "flux-dev";

    const startTime = Date.now();
    setNodeData(nodeId, { status: "running", outputUrl: undefined });
    const result = await runFalGeneration(modelKey, values, key);
    if (result.url) {
      const genTime = Date.now() - startTime;
      setNodeData(nodeId, { status: "done", outputUrl: result.url });
      const isVideo = def.category === "video" || def.id === "video.img_to_video";
      saveAsset({ url: result.url, type: isVideo ? "video" : "image", prompt: (values.prompt as string) || (values.text as string) || "", model: modelKey, timestamp: Date.now() });
      saveTrainingRecord({ timestamp: Date.now(), model: modelKey, prompt: (values.prompt as string) || "", params: values, output_url: result.url, generation_time_ms: genTime, user_id: "local" });
      refreshAssets();
      addToast(`Generated! (${(genTime / 1000).toFixed(1)}s)`, "success");
    } else {
      setNodeData(nodeId, { status: `Error: ${result.error}` });
      addToast(`Error: ${result.error?.slice(0, 60)}`, "error");
    }
  }, [nodes, falApiKey, setNodeData, refreshAssets, addToast]);

  runSingleNodeRef.current = runSingleNode;

  const handleRun = useCallback(async () => {
    if (!falApiKey) { addToast("Enter your fal.ai API key in Settings!", "error"); return; }
    localStorage.setItem("openflow_fal_key", falApiKey);
    setIsRunning(true);
    cancelRef.current = false;
    pushUndo();

    // Topological sort — include all nodes with a "model" input
    const genNodes = nodes.filter((n) => {
      const def = n.data.def as NodeDef;
      return def.inputs.some((inp) => inp.name === "model");
    });
    const nodeIds = genNodes.map(n => n.id);
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodeIds.forEach(id => { inDegree[id] = 0; adj[id] = []; });
    edges.forEach(e => {
      if (nodeIds.includes(e.source) && nodeIds.includes(e.target)) {
        adj[e.source].push(e.target);
        inDegree[e.target] = (inDegree[e.target] || 0) + 1;
      }
    });
    const queue = nodeIds.filter(id => inDegree[id] === 0);
    const sorted: string[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      sorted.push(id);
      for (const next of (adj[id] || [])) {
        inDegree[next]--;
        if (inDegree[next] === 0) queue.push(next);
      }
    }
    nodeIds.forEach(id => { if (!sorted.includes(id)) sorted.push(id); });

    // Track outputs for data flow
    const outputMap: Record<string, string> = {};
    const log: string[] = [];

    for (let i = 0; i < sorted.length; i++) {
      if (cancelRef.current) { log.push("⛔ Cancelled by user"); setExecutionProgress(prev => prev ? { ...prev, log: [...log] } : null); break; }
      const nodeId = sorted[i];
      const node = genNodes.find(n => n.id === nodeId);
      if (!node) continue;
      const def = node.data.def as NodeDef;

      // Pass output from connected source nodes into this node's inputs
      const incomingEdges = edges.filter(e => e.target === nodeId);
      for (const edge of incomingEdges) {
        const sourceUrl = outputMap[edge.source];
        if (sourceUrl) {
          // Find the source node to determine output type
          const sourceNode = nodes.find(n => n.id === edge.source);
          const sourceDef = sourceNode?.data.def as NodeDef | undefined;
          const sourceOutputType = sourceDef?.outputs[0]?.type;

          // Map source output to appropriate target input
          if (sourceOutputType === "image" || sourceOutputType === "string") {
            // Find the best input to fill: image_url, image, prompt, text, input
            const imageInputs = ["image_url", "image", "source_url", "target_url"];
            const textInputs = ["prompt", "text", "input"];
            const targetInputNames = def.inputs.map(inp => inp.name);

            if (sourceOutputType === "image") {
              const imgField = imageInputs.find(f => targetInputNames.includes(f));
              if (imgField) {
                updateNodeValue(nodeId, imgField, sourceUrl);
                log.push(`📎 Passed image from ${edge.source} → ${nodeId}.${imgField}`);
              }
            } else {
              const txtField = textInputs.find(f => targetInputNames.includes(f));
              if (txtField) {
                updateNodeValue(nodeId, txtField, sourceUrl);
                log.push(`📎 Passed text from ${edge.source} → ${nodeId}.${txtField}`);
              }
            }
          }
        }
      }

      setExecutionProgress({ current: i + 1, total: sorted.length, currentNodeId: nodeId, log: [...log] });
      setNodeData(nodeId, { isExecuting: true });
      log.push(`▶ Running ${def.name}...`);
      setExecutionProgress({ current: i + 1, total: sorted.length, currentNodeId: nodeId, log: [...log] });

      await runSingleNode(nodeId);

      // Grab output URL from node data after run
      setNodes(nds => {
        const n = nds.find(nd => nd.id === nodeId);
        if (n?.data.outputUrl) {
          outputMap[nodeId] = n.data.outputUrl as string;
          log.push(`✅ ${def.name} complete`);
        } else if (n?.data.status && (n.data.status as string).startsWith("Error")) {
          log.push(`❌ ${def.name} failed`);
        }
        return nds.map(nd => nd.id === nodeId ? { ...nd, data: { ...nd.data, isExecuting: false } } : nd);
      });
    }

    setIsRunning(false);
    setExecutionProgress(null);
    if (!cancelRef.current) addToast("All nodes complete!", "success");
  }, [nodes, edges, falApiKey, runSingleNode, addToast, pushUndo, setNodeData, updateNodeValue, setNodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "SELECT") return;
      if (e.key === " " && !e.ctrlKey) {
        e.preventDefault();
        const selected = nodes.find(n => n.selected);
        if (selected) runSingleNodeRef.current(selected.id);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const selected = nodes.filter(n => n.selected);
        if (selected.length) { pushUndo(); setNodes(nds => nds.filter(n => !n.selected)); }
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveProject();
        addToast("Project saved!", "success");
      }
      if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const selected = nodes.filter(n => n.selected);
        if (selected.length) {
          selected.forEach(n => {
            const def = n.data.def as NodeDef;
            const vals = n.data.values as Record<string, unknown>;
            idCounter.current += 1;
            const nodeId = `${def.id}_${idCounter.current}`;
            const newNode: Node = {
              id: nodeId, type: "flowNode",
              position: { x: n.position.x + 40, y: n.position.y + 40 },
              data: { def, values: { ...vals }, onChange: (key: string, val: unknown) => updateNodeValue(nodeId, key, val), onRun: () => runSingleNodeRef.current(nodeId), onDelete: () => setNodes((nds: Node[]) => nds.filter((nd: Node) => nd.id !== nodeId)) },
            };
            setNodes((nds) => [...nds, newNode]);
          });
          addToast(`Duplicated ${selected.length} node(s)`, "success");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nodes, setNodes, addToast, undo, redo]);

  // Clipboard paste for images (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const def = NODE_DEFS.find(d => d.id === "image.input");
            if (def) {
              pushUndo();
              addNodeWithHandler(def, { image_url: dataUrl });
              setCurrentView("canvas");
              addToast("Image pasted as node!", "success");
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addNodeWithHandler, pushUndo, addToast]);

  // Export workflow as JSON
  const exportWorkflow = useCallback(() => {
    const workflow = { nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, defId: (n.data.def as NodeDef).id, values: n.data.values })), edges };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `openflow-workflow-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    addToast("Workflow exported!", "success");
  }, [nodes, edges, addToast]);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem("openflow_dark", String(darkMode));
  }, [darkMode]);

  const onDragStart = (e: DragEvent, def: NodeDef) => {
    e.dataTransfer.setData("application/openflow-node", JSON.stringify(def));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      // Handle file drops (images)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const def = NODE_DEFS.find(d => d.id === "image.input");
            if (def) {
              pushUndo();
              idCounter.current += 1;
              const nodeId = `${def.id}_${idCounter.current}`;
              const bounds = (e.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
              const x = bounds ? e.clientX - bounds.left : e.clientX;
              const y = bounds ? e.clientY - bounds.top : e.clientY;
              const newNode: Node = {
                id: nodeId, type: "flowNode", position: { x, y },
                data: {
                  def, values: { image_url: dataUrl },
                  onChange: (key: string, val: unknown) => updateNodeValue(nodeId, key, val),
                  onRun: () => runSingleNodeRef.current(nodeId),
                  onDelete: () => setNodes((nds: Node[]) => nds.filter((n: Node) => n.id !== nodeId)),
                  onPreview: (url: string, type: "image" | "video") => setPreviewModal({ url, type }),
                  outputUrl: dataUrl, status: "done",
                },
              };
              setNodes((nds) => [...nds, newNode]);
              addToast("Image dropped as node!", "success");
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }
      const data = e.dataTransfer.getData("application/openflow-node");
      if (!data) return;
      const def: NodeDef = JSON.parse(data);
      idCounter.current += 1;
      const nodeId = `${def.id}_${idCounter.current}`;
      const defaults: Record<string, unknown> = {};
      def.inputs.forEach((inp) => { if (inp.default !== undefined) defaults[inp.name] = inp.default; });
      const bounds = (e.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
      const x = bounds ? e.clientX - bounds.left : e.clientX;
      const y = bounds ? e.clientY - bounds.top : e.clientY;
      pushUndo();
      const newNode: Node = {
        id: nodeId, type: "flowNode", position: { x, y },
        data: {
          def, values: defaults,
          onChange: (key: string, val: unknown) => updateNodeValue(nodeId, key, val),
          onRun: () => runSingleNodeRef.current(nodeId),
          onDelete: () => { pushUndo(); setNodes((nds: Node[]) => nds.filter((n: Node) => n.id !== nodeId)); },
          onPreview: (url: string, type: "image" | "video") => setPreviewModal({ url, type }),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, updateNodeValue, pushUndo]
  );

  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const categories = Object.keys(grouped);

  const [sceneStory, setSceneStory] = useState("");
  const [sceneLoading, setSceneLoading] = useState(false);
  const [projectName, setProjectName] = useState("Untitled");
  const [projectsList, setProjectsList] = useState<Array<{id: number; name: string; workflow_json: string; updated_at: string}>>([]);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("openflow_token") || "");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:8000" : "/api";
  const apiHeaders = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` });

  const loadProjects = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/projects`, { headers: apiHeaders() });
      if (res.ok) setProjectsList(await res.json());
    } catch {}
  }, [authToken]);

  const handleAuth = async (mode: "login" | "signup") => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPass }),
      });
      const data = await res.json();
      if (data.token) { setAuthToken(data.token); localStorage.setItem("openflow_token", data.token); }
      else alert(data.detail || "Auth failed");
    } catch { alert("Backend not reachable"); }
  };

  const saveProject = async () => {
    if (!authToken) { alert("Login first"); return; }
    const workflow = JSON.stringify({ nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, defId: (n.data.def as NodeDef).id, values: n.data.values })), edges });
    try {
      await fetch(`${BACKEND_URL}/projects`, { method: "POST", headers: apiHeaders(), body: JSON.stringify({ name: projectName, workflow_json: workflow }) });
      loadProjects();
    } catch { alert("Save failed"); }
  };

  const loadProject = (workflowJson: string) => {
    try {
      const wf = JSON.parse(workflowJson);
      if (!wf.nodes) return;
      const newNodes: Node[] = wf.nodes.map((n: { id: string; position: { x: number; y: number }; defId: string; values: Record<string, unknown> }) => {
        const def = NODE_DEFS.find(d => d.id === n.defId);
        if (!def) return null;
        return {
          id: n.id, type: "flowNode", position: n.position,
          data: {
            def, values: n.values || {},
            onChange: (key: string, val: unknown) => updateNodeValue(n.id, key, val),
            onRun: () => runSingleNodeRef.current(n.id),
            onDelete: () => setNodes((nds: Node[]) => nds.filter((nd: Node) => nd.id !== n.id)),
          },
        };
      }).filter(Boolean) as Node[];
      setNodes(newNodes);
      setEdges(wf.edges || []);
    } catch { alert("Invalid workflow"); }
  };

  const generateScenes = async () => {
    if (!sceneStory.trim()) return;
    setSceneLoading(true);
    try {
      const sentences = sceneStory.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 5);
      const scenePrompts = sentences.length >= 2 ? sentences.map(s => s.trim()) : [
        `Scene 1: ${sceneStory.slice(0, 80)}`,
        `Scene 2: ${sceneStory.slice(80, 160) || sceneStory.slice(0, 80)} from a different angle`,
        `Scene 3: Final moment of "${sceneStory.slice(0, 60)}"`,
      ];
      const imgDef = NODE_DEFS.find(d => d.id === "image.text_to_image")!;
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      scenePrompts.forEach((prompt, i) => {
        idCounter.current += 1;
        const nodeId = `scene_${idCounter.current}`;
        const defaults: Record<string, unknown> = {};
        imgDef.inputs.forEach(inp => { if (inp.default !== undefined) defaults[inp.name] = inp.default; });
        defaults.prompt = `Cinematic film still: ${prompt}`;
        defaults.model = "flux-pro-1.1";
        newNodes.push({
          id: nodeId, type: "flowNode", position: { x: 200 + i * 380, y: 150 },
          data: {
            def: imgDef, values: defaults,
            onChange: (key: string, val: unknown) => updateNodeValue(nodeId, key, val),
            onRun: () => runSingleNodeRef.current(nodeId),
            onDelete: () => setNodes((nds: Node[]) => nds.filter((n: Node) => n.id !== nodeId)),
          },
        });
        if (i > 0) {
          newEdges.push({ id: `scene_edge_${i}`, source: newNodes[i - 1].id, sourceHandle: "out", target: nodeId, targetHandle: "in", animated: false, type: "smoothstep", style: { stroke: "#d1d5db", strokeWidth: 1.5 } });
        }
      });
      setNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
      setActivePanel(null);
      setCurrentView("canvas");
    } catch { alert("Scene generation failed"); }
    setSceneLoading(false);
  };

  const loadTemplate = useCallback((template: MiniAppTemplate) => {
    const newNodes: Node[] = [];
    const nodeIds: string[] = [];

    template.nodes.forEach((tn) => {
      idCounter.current += 1;
      const nodeId = `template_${idCounter.current}`;
      nodeIds.push(nodeId);
      const def = NODE_DEFS.find(d => d.id === tn.defId);
      if (!def) return;
      const defaults: Record<string, unknown> = {};
      def.inputs.forEach(inp => { if (inp.default !== undefined) defaults[inp.name] = inp.default; });
      if (tn.values) Object.assign(defaults, tn.values);

      newNodes.push({
        id: nodeId, type: "flowNode", position: { x: tn.x, y: tn.y },
        data: {
          def, values: defaults,
          onChange: (key: string, val: unknown) => updateNodeValue(nodeId, key, val),
          onRun: () => runSingleNodeRef.current(nodeId),
          onDelete: () => setNodes((nds: Node[]) => nds.filter((n: Node) => n.id !== nodeId)),
        },
      });
    });

    const newEdges: Edge[] = template.edges.map((e, idx) => ({
      id: `tmpl_edge_${idCounter.current}_${idx}`,
      source: nodeIds[e.from], sourceHandle: "out",
      target: nodeIds[e.to], targetHandle: "in",
      animated: false, type: "smoothstep",
      style: { stroke: "#d1d5db", strokeWidth: 1.5 },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setCurrentView("canvas");
  }, [setNodes, setEdges, updateNodeValue]);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f0f2", color: "#1a1a1a", fontFamily: "'SF Pro Display', 'Inter', -apple-system, 'Helvetica Neue', sans-serif" }}>

      {/* Icon strip — dark left toolbar */}
      <nav style={{ width: 56, background: "#0e0e10", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, paddingBottom: 16, flexShrink: 0, zIndex: 20 }}>
        {/* Logo */}
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0e0e10", marginBottom: 24, cursor: "pointer", letterSpacing: "-0.5px" }}
          title="OpenClaw" onClick={() => { setActivePanel(null); setCurrentView("dashboard"); }}>OF</div>

        {/* Dashboard */}
        <button title="Dashboard" onClick={() => { setCurrentView("dashboard"); setActivePanel(null); }}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: currentView === "dashboard" && !activePanel ? "#1e1e22" : "transparent", color: currentView === "dashboard" && !activePanel ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}
          dangerouslySetInnerHTML={{ __html: SVG_ICONS.dashboard }} />

        {/* Category icons */}
        {categories.map((cat) => (
          <button key={cat} title={CATEGORIES[cat] || cat}
            onClick={() => { setCurrentView("canvas"); setActivePanel(activePanel === cat ? null : cat); }}
            style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === cat ? "#1e1e22" : "transparent", color: activePanel === cat ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, transition: "all 0.15s" }}
            onMouseOver={(e) => { if (activePanel !== cat) e.currentTarget.style.color = "#9ca3af"; }}
            onMouseOut={(e) => { if (activePanel !== cat) e.currentTarget.style.color = "#6b6b75"; }}
            dangerouslySetInnerHTML={{ __html: SVG_ICONS[cat] || "" }} />
        ))}

        {/* Model Manager */}
        <button title="Model Manager" onClick={() => { setActivePanel(activePanel === "models" ? null : "models"); }}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "models" ? "#1e1e22" : "transparent", color: activePanel === "models" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </button>

        {/* Workflow Templates */}
        <button title="Workflow Templates" onClick={() => { setActivePanel(activePanel === "workflows" ? null : "workflows"); }}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "workflows" ? "#1e1e22" : "transparent", color: activePanel === "workflows" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><line x1="12" y1="4" x2="12" y2="2"/><line x1="10" y1="2" x2="14" y2="2"/></svg>
        </button>

        <div style={{ flex: 1 }} />

        {/* Asset Manager */}
        <button title="Asset Manager" onClick={() => { setActivePanel(activePanel === "assets" ? null : "assets"); }}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "assets" ? "#1e1e22" : "transparent", color: activePanel === "assets" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}
          dangerouslySetInnerHTML={{ __html: SVG_ICONS.assets }} />

        {/* Chat */}
        <button title="AI Chat" onClick={() => { setActivePanel(activePanel === "chat" ? null : "chat"); }}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "chat" ? "#1e1e22" : "transparent", color: activePanel === "chat" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}
          dangerouslySetInnerHTML={{ __html: SVG_ICONS.chat }} />

        {/* History */}
        <button title="Generation History" onClick={() => { setActivePanel(activePanel === "history" ? null : "history"); }}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "history" ? "#1e1e22" : "transparent", color: activePanel === "history" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>

        {/* Scene Builder */}
        <button title="Scene Builder" onClick={() => { setCurrentView("canvas"); setActivePanel(activePanel === "scenes" ? null : "scenes"); }}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "scenes" ? "#1e1e22" : "transparent", color: activePanel === "scenes" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="2" y1="7" x2="22" y2="7"/><line x1="7" y1="2" x2="7" y2="7"/></svg>
        </button>

        {/* Projects */}
        <button title="Projects" onClick={() => { setActivePanel(activePanel === "projects" ? null : "projects"); loadProjects(); }}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "projects" ? "#1e1e22" : "transparent", color: activePanel === "projects" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </button>

        {/* Settings */}
        <button title="Settings" onClick={() => setActivePanel(activePanel === "settings" ? null : "settings")}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "settings" ? "#1e1e22" : "transparent", color: activePanel === "settings" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}
          dangerouslySetInnerHTML={{ __html: SVG_ICONS.settings }} />

        {/* Run */}
        <button title="Run workflow" onClick={handleRun} disabled={isRunning || nodes.length === 0}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: isRunning ? "#2a2a30" : "#c026d3", color: isRunning ? "#6b6b75" : "#0e0e10", cursor: isRunning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          dangerouslySetInnerHTML={{ __html: SVG_ICONS.run }} />
      </nav>

      {/* Flyout panel */}
      {activePanel && (
        <aside style={{ width: activePanel === "chat" ? 300 : activePanel === "models" ? 280 : 220, background: "#ffffff", borderRight: "1px solid #ebebee", overflowY: "auto", flexShrink: 0, zIndex: 15, boxShadow: "4px 0 16px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
          {activePanel === "models" ? (
            <ModelManagerPanel onCreateNode={(defId, modelKey) => {
              const def = NODE_DEFS.find(d => d.id === defId);
              if (def) { addNodeWithHandler(def, { model: modelKey }); setActivePanel(null); setCurrentView("canvas"); }
            }} />
          ) : activePanel === "workflows" ? (
            <WorkflowTemplatesPanel onLoadPipeline={(pipeline) => { loadTemplate(pipeline); setActivePanel(null); }} />
          ) : activePanel === "assets" ? (
            <AssetManagerPanel assets={assets} />
          ) : activePanel === "chat" ? (
            <ChatPanel />
          ) : activePanel === "scenes" ? (
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>🎬 Scene Builder</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Describe your story</div>
              <textarea value={sceneStory} onChange={(e) => setSceneStory(e.target.value)}
                placeholder="A knight rides through a misty forest, discovers a glowing crystal cave, and meets an ancient dragon..."
                rows={6} style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 12, padding: "10px 12px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }} />
              <button onClick={generateScenes} disabled={sceneLoading || !sceneStory.trim()}
                style={{ width: "100%", marginTop: 10, padding: "10px", background: sceneLoading ? "#e5e7eb" : "#c026d3", color: sceneLoading ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: sceneLoading ? "not-allowed" : "pointer" }}>
                {sceneLoading ? "Generating..." : "Generate Scenes ✦"}
              </button>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>Splits your story into 3-5 scenes as connected image nodes.</div>
            </div>
          ) : activePanel === "projects" ? (
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>📁 Projects</div>
              {!authToken ? (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>LOGIN / SIGNUP</div>
                  <input placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                    style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", marginBottom: 6, boxSizing: "border-box" }} />
                  <input placeholder="Password" type="password" value={authPass} onChange={e => setAuthPass(e.target.value)}
                    style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleAuth("login")} style={{ flex: 1, padding: "8px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Login</button>
                    <button onClick={() => handleAuth("signup")} style={{ flex: 1, padding: "8px", background: "#f5f5f7", color: "#1a1a1a", border: "1px solid #ebebee", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Sign Up</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    <input placeholder="Project name" value={projectName} onChange={e => setProjectName(e.target.value)}
                      style={{ flex: 1, background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none" }} />
                    <button onClick={saveProject} style={{ padding: "8px 12px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Save</button>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>SAVED PROJECTS</div>
                  {projectsList.length === 0 && <div style={{ fontSize: 11, color: "#9ca3af" }}>No projects yet</div>}
                  {projectsList.map(p => (
                    <div key={p.id} onClick={() => { loadProject(p.workflow_json); setCurrentView("canvas"); }}
                      style={{ padding: "8px 10px", background: "#f5f5f7", borderRadius: 8, marginBottom: 4, cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#e8e8eb"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "#f5f5f7"; }}>
                      {p.name}
                      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>{p.updated_at?.slice(0, 16)}</div>
                    </div>
                  ))}
                  <button onClick={() => { setAuthToken(""); localStorage.removeItem("openflow_token"); }}
                    style={{ marginTop: 12, padding: "6px", background: "transparent", border: "none", fontSize: 10, color: "#9ca3af", cursor: "pointer" }}>Logout</button>
                </div>
              )}
            </div>
          ) : activePanel === "history" ? (
            <HistoryPanel onRerun={(record) => {
              const def = NODE_DEFS.find(d => d.id === "image.text_to_image");
              if (def) { addNodeWithHandler(def, { model: record.model, prompt: record.prompt, ...record.params }); setActivePanel(null); setCurrentView("canvas"); }
            }} />
          ) : activePanel === "settings" ? (
            <div style={{ padding: 20, overflow: "auto" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Settings</div>

              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>API Keys</div>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>fal.ai (required)</div>
              <input type="password" value={falApiKey} onChange={(e) => { setFalApiKey(e.target.value); localStorage.setItem("openflow_fal_key", e.target.value); }} onKeyDown={stopKeys}
                placeholder="fal-xxxxxxxx" style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, color: "#1a1a1a", fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>OpenAI (optional)</div>
              <input type="password" value={localStorage.getItem("openflow_openai_key") || ""} onChange={(e) => localStorage.setItem("openflow_openai_key", e.target.value)} onKeyDown={stopKeys}
                placeholder="sk-..." style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, color: "#1a1a1a", fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Replicate (optional)</div>
              <input type="password" value={localStorage.getItem("openflow_replicate_key") || ""} onChange={(e) => localStorage.setItem("openflow_replicate_key", e.target.value)} onKeyDown={stopKeys}
                placeholder="r8_..." style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, color: "#1a1a1a", fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box" }} />
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6, marginBottom: 16 }}>Get keys at <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener" style={{ color: "#1a1a1a", fontWeight: 600, textDecoration: "none" }}>fal.ai</a></div>

              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Generation Defaults</div>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Default image size</div>
              <select value={localStorage.getItem("openflow_default_size") || "1024"} onChange={(e) => localStorage.setItem("openflow_default_size", e.target.value)}
                style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", cursor: "pointer", marginBottom: 6, boxSizing: "border-box" }}>
                <option value="512">512×512</option><option value="768">768×768</option><option value="1024">1024×1024</option><option value="1280">1280×1280</option>
              </select>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Default model</div>
              <select value={localStorage.getItem("openflow_default_model") || "flux-2-pro"} onChange={(e) => localStorage.setItem("openflow_default_model", e.target.value)}
                style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", cursor: "pointer", marginBottom: 6, boxSizing: "border-box" }}>
                <option value="flux-fast">flux-fast (Fast)</option><option value="flux-2-pro">flux-2-pro (Balanced)</option><option value="flux-pro-1.1-ultra">flux-pro-1.1-ultra (Quality)</option>
              </select>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Quality preset</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {["fast", "balanced", "quality"].map(p => (
                  <button key={p} onClick={() => localStorage.setItem("openflow_quality_preset", p)}
                    style={{ flex: 1, padding: "6px", background: (localStorage.getItem("openflow_quality_preset") || "balanced") === p ? "#c026d3" : "#f5f5f7", color: (localStorage.getItem("openflow_quality_preset") || "balanced") === p ? "#fff" : "#6b7280", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{p}</button>
                ))}
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Appearance</div>
              <button onClick={() => setDarkMode(!darkMode)} style={{ width: "100%", padding: "8px 12px", background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#1a1a1a", textAlign: "left", marginBottom: 12 }}>
                {darkMode ? "🌙 Dark Mode ON" : "☀️ Light Mode"}
              </button>

              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Workflow</div>
              <button onClick={exportWorkflow} style={{ width: "100%", padding: "8px 12px", background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#1a1a1a", textAlign: "left", marginBottom: 6 }}>
                📤 Export Workflow JSON
              </button>

              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 12, marginBottom: 6 }}>Training Data</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{getTrainingDataCount()} records collected</div>
              <button onClick={() => { exportTrainingData(); addToast("Training data exported!", "success"); }} style={{ width: "100%", padding: "8px 12px", background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#1a1a1a", textAlign: "left" }}>
                📊 Export Training Data (JSONL)
              </button>

              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 16, marginBottom: 6 }}>About</div>
              <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.8 }}>
                OpenFlow v5.0 — Sprint 5<br />
                <a href="https://github.com/nikolateslasagent/openflow" target="_blank" rel="noopener" style={{ color: "#c026d3", textDecoration: "none" }}>GitHub</a> · <a href="https://openflow-docs.vercel.app" target="_blank" rel="noopener" style={{ color: "#c026d3", textDecoration: "none" }}>Docs</a>
              </div>

              <div style={{ fontSize: 10, color: "#c4c4c8", marginTop: 16 }}>{nodes.length} nodes · {edges.length} connections</div>
              <div style={{ fontSize: 9, color: "#d1d5db", marginTop: 4 }}>Shortcuts: Space=Run, Del=Delete, ⌘S=Save, ⌘D=Duplicate</div>
            </div>
          ) : (
            <div style={{ padding: "16px 0" }}>
              <div style={{ padding: "0 16px 10px", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{CATEGORIES[activePanel] || activePanel}</div>
              {(grouped[activePanel] || []).map((def) => {
                const modelInput = def.inputs.find((inp) => inp.name === "model");
                const models = modelInput?.options || [];
                return (
                  <div key={def.id}>
                    <div draggable onDragStart={(e) => onDragStart(e, def)}
                      onClick={() => { addNodeWithHandler(def); setActivePanel(null); setCurrentView("canvas"); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", cursor: "grab", transition: "background 0.12s" }}
                      onMouseOver={(e) => { e.currentTarget.style.background = "#f5f5f7"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ color: "#6b7280", display: "flex" }} dangerouslySetInnerHTML={{ __html: NODE_ICONS[def.id] || "" }} />
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{def.name}</div>
                    </div>
                    {models.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "4px 12px 12px" }}>
                        {models.map((m) => (
                          <button key={m} onClick={() => { addNodeWithHandler(def, { model: m }); setActivePanel(null); setCurrentView("canvas"); }}
                            style={{ background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, padding: "8px 6px", cursor: "pointer", fontSize: 10, fontWeight: 500, color: "#1a1a1a", textAlign: "center", transition: "all 0.12s", lineHeight: 1.3 }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "#e8e8eb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "#f5f5f7"; e.currentTarget.style.borderColor = "#ebebee"; }}>
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

      {/* Main content area */}
      {currentView === "dashboard" ? (
        <Dashboard
          onNewProject={() => { setNodes([]); setEdges([]); setCurrentView("canvas"); }}
          onOpenCanvas={() => setCurrentView("canvas")}
          onLoadTemplate={loadTemplate}
          assets={assets}
        />
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }} onDrop={onDrop} onDragOver={onDragOver}>
          {/* Execution progress bar */}
          {executionProgress && (
            <div style={{ background: "#1a1a1f", borderBottom: "1px solid #2a2a30", padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>⏳ Running {executionProgress.current}/{executionProgress.total} nodes...</span>
                  <button onClick={() => { cancelRef.current = true; }} style={{ padding: "4px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </div>
                <div style={{ width: "100%", height: 4, background: "#2a2a30", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${(executionProgress.current / executionProgress.total) * 100}%`, height: "100%", background: "linear-gradient(90deg, #c026d3, #f59e0b)", borderRadius: 2, transition: "width 0.3s" }} />
                </div>
              </div>
            </div>
          )}

          {/* Top bar with view tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#0e0e10", borderBottom: "1px solid #1e1e22", flexShrink: 0 }}>
            {/* View tabs */}
            {(["dashboard", "canvas", "assets"] as const).map((view) => (
              <button key={view} onClick={() => setCurrentView(view)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: currentView === view ? "#c026d3" : "#141416",
                  color: currentView === view ? "#fff" : "#9ca3af",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                }}>{view}</button>
            ))}
            <div style={{ width: 1, height: 24, background: "#2a2a30", margin: "0 8px" }} />
            {[
              { label: "New Image", icon: "◫", defId: "image.text_to_image" },
              { label: "New Video", icon: "▶", defId: "video.text_to_video" },
              { label: "Img2Vid", icon: "🎥", defId: "video.img_to_video" },
              { label: "Upscale", icon: "🔍", defId: "transform.upscale" },
            ].map((btn: { label: string; icon: string; defId: string }) => (
              <button key={btn.label} onClick={() => {
                const def = NODE_DEFS.find(d => d.id === btn.defId);
                if (def) addNodeWithHandler(def);
              }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#444"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a30"; }}>
                <span>{btn.icon}</span> {btn.label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            {nodes.filter(n => n.selected).length > 1 && (
              <>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{nodes.filter(n => n.selected).length} selected</span>
                <button onClick={() => {
                  const selected = nodes.filter(n => n.selected);
                  (async () => {
                    for (const n of selected) { await runSingleNode(n.id); }
                    addToast(`Ran ${selected.length} nodes`, "success");
                  })();
                }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#22c55e", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>▶ Run Selected</button>
                <button onClick={() => { setNodes(nds => nds.filter(n => !n.selected)); addToast("Deleted selected", "success"); }}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Delete</button>
              </>
            )}
            <button onClick={() => undo()} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)"
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: undoStack.length > 0 ? "#9ca3af" : "#4a4a50", fontSize: 12, cursor: undoStack.length > 0 ? "pointer" : "not-allowed" }}>↩</button>
            <button onClick={() => redo()} disabled={redoStack.length === 0} title="Redo (Ctrl+Shift+Z)"
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: redoStack.length > 0 ? "#9ca3af" : "#4a4a50", fontSize: 12, cursor: redoStack.length > 0 ? "pointer" : "not-allowed" }}>↪</button>
            <button onClick={exportWorkflow} title="Export workflow"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              📤 Export
            </button>
            <button onClick={handleRun} disabled={isRunning || nodes.length === 0} title="Run All (topological order)"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: isRunning ? "#2a2a30" : "#c026d3", color: isRunning ? "#6b6b75" : "#fff", fontSize: 12, fontWeight: 700, cursor: isRunning ? "not-allowed" : "pointer" }}>
              {isRunning ? "⏳ Running..." : "▶ Run All"}
            </button>
          </div>

          {currentView === "assets" ? (
            <div style={{ flex: 1, overflow: "auto", padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }}>All Assets</h2>
              {assets.length === 0 && <div style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", padding: 60 }}>No assets yet. Generate some images or videos!</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {assets.map((asset, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8eb", background: "#fff" }}>
                    {asset.type === "video" ? (
                      <video src={asset.url} style={{ width: "100%", height: 160, objectFit: "cover" }} controls muted />
                    ) : (
                      <img src={asset.url} alt="" style={{ width: "100%", height: 160, objectFit: "cover" }} />
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>{asset.model}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.prompt}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <a href={asset.url} download target="_blank" rel="noopener" style={{ padding: "4px 10px", background: "#c026d3", color: "#fff", borderRadius: 6, fontSize: 10, fontWeight: 600, textDecoration: "none" }}>Download</a>
                        <span style={{ padding: "4px 8px", background: "#f5f5f7", borderRadius: 6, fontSize: 10, color: "#6b7280" }}>{asset.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
                nodeTypes={nodeTypes} fitView style={{ background: "#f0f0f2" }}
                defaultEdgeOptions={{ animated: isRunning, style: { stroke: "#d1d5db", strokeWidth: 1.5 }, type: "smoothstep" }}>
                <Background variant={BackgroundVariant.Dots} color="#c0c0c6" gap={28} size={1.2} />
                <Controls style={{ background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
                <MiniMap style={{ background: "#ffffff", borderRadius: 10, border: "1px solid #e8e8eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} nodeColor="#d1d5db" maskColor="rgba(240,240,242,0.8)" />
              </ReactFlow>
            </div>
          )}
        </div>
      )}
      {/* Full-size preview modal */}
      {previewModal && (
        <div onClick={() => setPreviewModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, cursor: "pointer" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", position: "relative" }}>
            <button onClick={() => setPreviewModal(null)} style={{ position: "absolute", top: -12, right: -12, width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "none", fontSize: 16, cursor: "pointer", zIndex: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>✕</button>
            {previewModal.type === "video" ? (
              <video src={previewModal.url} controls autoPlay style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12 }} />
            ) : (
              <img src={previewModal.url} alt="preview" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }} />
            )}
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <a href={previewModal.url} download target="_blank" rel="noopener" style={{ padding: "8px 20px", background: "#c026d3", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Download</a>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
      <style>{`
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .react-flow__edge.animated path { stroke-dasharray: 5; animation: flowDash 0.5s linear infinite; }
        @keyframes flowDash { to { stroke-dashoffset: -10; } }
        @media (max-width: 768px) {
          nav { width: 44px !important; }
          nav button { width: 32px !important; height: 32px !important; }
          aside { position: fixed !important; left: 44px !important; top: 0 !important; bottom: 0 !important; width: calc(100vw - 44px) !important; z-index: 100 !important; }
          .react-flow__node { touch-action: none; }
        }
        @media (max-width: 640px) {
          nav span, nav div:first-child { font-size: 10px !important; }
        }
      `}</style>
    </div>
  );
}
