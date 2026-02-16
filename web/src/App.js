import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * OpenClaw — Visual AI Workflow Builder
 *
 * Sprint 2: Dashboard, Asset Manager, Chat, Mini-Apps, New Node Types
 */
import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, Handle, Position, BackgroundVariant, } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ModelManagerPanel } from "./ModelManager";
import { WorkflowTemplatesPanel } from "./WorkflowTemplates";
import { saveTrainingRecord, getTrainingDataCount, exportTrainingData, getTrainingRecords, clearTrainingData } from "./TrainingData";
import { useToast } from "./Toast";
import { GalleryView } from "./GalleryView";
import { shouldShowTutorial } from "./TutorialOverlay";
import { ImageEditor } from "./ImageEditor";
import { VideoPreview } from "./VideoPreview";
import { saveVersion, VersionDropdown } from "./VersionHistory";
import { InteractiveOnboarding } from "./InteractiveOnboarding";
import { encodeWorkflowToUrl, decodeWorkflowFromHash } from "./WorkflowSharing";
import { StoryboardView } from "./Storyboard";
import TimelineEditor from "./TimelineEditor";
import { MarketplacePanel, MARKETPLACE_TEMPLATES } from "./Marketplace";
import { CustomNodeBuilder, loadCustomNodes } from "./CustomNodes";
import { WEBHOOK_NODE_DEFS } from "./WebhookNodes";
import { PromptLibraryPanel } from "./PromptLibrary";
import { BatchPanel, BatchResultsGrid } from "./BatchProcessing";
import { PresetsPanel, savePreset } from "./NodePresets";
import { useNotifications, NotificationBell, NotificationPanel } from "./NotificationCenter";
import { useGenerationQueue, QueuePanel } from "./GenerationQueue";
import { KeyboardShortcutsModal } from "./KeyboardShortcuts";
import { parseAgentParams, APIDocsPanel } from "./AgentAPI";
import { AnalyticsDashboard, UsageQuotasSection, ModelComparisonPanel, WorkflowStatsInline, trackWorkflowRun, incrementDailyUsage } from "./Analytics";
// ---------------------------------------------------------------------------
// Node definitions with real parameters
// ---------------------------------------------------------------------------
const NODE_DEFS = [
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
    // Sprint 7: Audio nodes
    {
        id: "audio.tts",
        name: "Text to Speech",
        description: "Generate speech from text using browser SpeechSynthesis",
        category: "audio",
        icon: "🗣️",
        color: "#22c55e",
        inputs: [
            { name: "text", type: "string", description: "Text to speak", required: true },
            { name: "voice", type: "string", description: "Voice", default: "default", options: ["default", "Google US English", "Google UK English Female", "Samantha", "Daniel"] },
            { name: "rate", type: "float", description: "Speed (0.5-2)", default: 1 },
        ],
        outputs: [
            { name: "audio", type: "string", description: "Audio (browser playback)" },
        ],
    },
    {
        id: "audio.music_gen",
        name: "Music Generator",
        description: "Generate background music (MusicGen placeholder)",
        category: "audio",
        icon: "🎶",
        color: "#22c55e",
        inputs: [
            { name: "prompt", type: "string", description: "Music description", required: true },
            { name: "duration", type: "integer", description: "Duration (sec)", default: 10, options: ["5", "10", "15", "30"] },
            { name: "model", type: "string", description: "Model", default: "musicgen-large", options: ["musicgen-large", "musicgen-small"] },
        ],
        outputs: [
            { name: "audio", type: "string", description: "Audio URL" },
        ],
    },
    {
        id: "audio.sfx",
        name: "Sound Effects",
        description: "Generate sound effects (placeholder)",
        category: "audio",
        icon: "🔊",
        color: "#22c55e",
        inputs: [
            { name: "prompt", type: "string", description: "Sound description", required: true },
            { name: "duration", type: "integer", description: "Duration (sec)", default: 3 },
        ],
        outputs: [
            { name: "audio", type: "string", description: "Audio URL" },
        ],
    },
    {
        id: "audio.voiceover",
        name: "Voice-Over",
        description: "Generate voice-over narration for video timeline",
        category: "audio",
        icon: "🎙️",
        color: "#22c55e",
        inputs: [
            { name: "text", type: "string", description: "Narration text", required: true },
            { name: "voice", type: "string", description: "Voice style", default: "narrator", options: ["narrator", "conversational", "dramatic", "news"] },
        ],
        outputs: [
            { name: "audio", type: "string", description: "Voice-over audio" },
        ],
    },
    // Sprint 7: Render node
    {
        id: "video.render",
        name: "Render / Merge Video",
        description: "Concatenate multiple video clips into one",
        category: "video",
        icon: "🎞️",
        color: "#f59e0b",
        inputs: [
            { name: "video_1", type: "string", description: "Video 1 URL", required: true },
            { name: "video_2", type: "string", description: "Video 2 URL", required: true },
            { name: "video_3", type: "string", description: "Video 3 URL (optional)", default: "" },
            { name: "video_4", type: "string", description: "Video 4 URL (optional)", default: "" },
            { name: "transition", type: "string", description: "Transition", default: "cut", options: ["cut", "crossfade", "fade-black"] },
        ],
        outputs: [
            { name: "video", type: "video", description: "Merged video" },
        ],
    },
    // Sprint 7: Captions node
    {
        id: "captions.generate",
        name: "Caption Generator",
        description: "Generate SRT subtitles from video content",
        category: "tools",
        icon: "💬",
        color: "#f59e0b",
        inputs: [
            { name: "video_url", type: "string", description: "Video URL", required: true },
            { name: "prompt", type: "string", description: "Video description (helps accuracy)", default: "" },
            { name: "style", type: "string", description: "Caption style", default: "standard", options: ["standard", "dramatic", "minimal", "verbose"] },
        ],
        outputs: [
            { name: "srt", type: "string", description: "SRT subtitle text" },
            { name: "preview", type: "string", description: "Caption preview" },
        ],
    },
    // Sprint 12: Style Transfer
    {
        id: "image.style_transfer",
        name: "Style Reference",
        description: "Generate an image in the style of a reference image",
        category: "image",
        icon: "🎨",
        color: "#ec4899",
        inputs: [
            { name: "style_image_url", type: "string", description: "Style reference image URL", required: true },
            { name: "content_prompt", type: "string", description: "Content prompt", required: true },
            { name: "style_strength", type: "float", description: "Style strength (0-1)", default: 0.75 },
            { name: "model", type: "string", description: "Model", default: "ip-adapter", options: ["ip-adapter", "flux-pro", "sd-3.5"] },
        ],
        outputs: [
            { name: "image", type: "image", description: "Styled image" },
        ],
    },
    // Sprint 12: Image Variations
    {
        id: "image.variations",
        name: "Image Variations",
        description: "Generate multiple variations of an image",
        category: "image",
        icon: "🔀",
        color: "#ec4899",
        inputs: [
            { name: "image_url", type: "string", description: "Source image URL", required: true },
            { name: "prompt", type: "string", description: "Variation prompt (optional)", default: "" },
            { name: "num_variations", type: "integer", description: "Number of variations", default: 4, options: ["2", "3", "4", "6", "8"] },
            { name: "variation_strength", type: "float", description: "Variation strength (0-1)", default: 0.5 },
            { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "sd-3.5"] },
        ],
        outputs: [
            { name: "image", type: "image", description: "Selected variation" },
            { name: "all_images", type: "string", description: "All variation URLs (JSON)" },
        ],
    },
    // Sprint 12: Outpainting / Extend
    {
        id: "image.outpaint",
        name: "Outpaint / Extend",
        description: "Extend an image beyond its borders",
        category: "image",
        icon: "↔️",
        color: "#ec4899",
        inputs: [
            { name: "image_url", type: "string", description: "Source image URL", required: true },
            { name: "prompt", type: "string", description: "What to fill in extended area", default: "" },
            { name: "direction", type: "string", description: "Direction", default: "all", options: ["left", "right", "up", "down", "all"] },
            { name: "extend_pixels", type: "integer", description: "Extend amount (px)", default: 256, options: ["128", "256", "512", "768"] },
            { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "sd-3.5"] },
        ],
        outputs: [
            { name: "image", type: "image", description: "Extended image" },
        ],
    },
    ...WEBHOOK_NODE_DEFS,
];
const CATEGORIES = {
    input: "Inputs",
    image: "Image",
    video: "Video",
    audio: "Audio",
    text: "Text / LLM",
    transform: "Transform",
    output: "Output",
    tools: "Tools",
    custom: "Custom",
};
// SVG outlined icons for toolbar and nodes
const SVG_ICONS = {
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
    storyboard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
    timeline: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><rect x="3" y="5" width="6" height="4" rx="1"/><rect x="11" y="5" width="8" height="4" rx="1"/><rect x="5" y="15" width="10" height="4" rx="1"/><rect x="17" y="15" width="4" height="4" rx="1"/></svg>`,
};
const NODE_ICONS = {
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
    "image.style_transfer": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    "image.variations": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/></svg>`,
    "image.outpaint": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"/><path d="M6 2v4"/><path d="M18 2v4"/><path d="M6 18v4"/><path d="M18 18v4"/><path d="M2 6h4"/><path d="M2 18h4"/><path d="M18 6h4"/><path d="M18 18h4"/></svg>`,
    "image.input": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    "tools.controlnet": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>`,
};
function groupByCategory(defs) {
    const g = {};
    for (const d of defs) {
        if (!g[d.category])
            g[d.category] = [];
        g[d.category].push(d);
    }
    return g;
}
const stopKeys = (e) => e.stopPropagation();
// ---------------------------------------------------------------------------
// fal.ai integration
// ---------------------------------------------------------------------------
const FAL_MODELS = {
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
    "ip-adapter": "fal-ai/ip-adapter-face-id",
};
async function runFalGeneration(modelKey, inputs, apiKey) {
    const falModel = FAL_MODELS[modelKey] || FAL_MODELS["flux-dev"];
    try {
        const isVideo = falModel.includes("video") || falModel.includes("wan") || falModel.includes("kling") || falModel.includes("minimax") || falModel.includes("hunyuan") || falModel.includes("luma") || falModel.includes("ltx") || falModel.includes("grok-imagine-video") || falModel.includes("cogvideo") || falModel.includes("mochi");
        const body = { prompt: inputs.prompt || "" };
        if (inputs.negative_prompt)
            body.negative_prompt = inputs.negative_prompt;
        if (inputs.image_url)
            body.image_url = inputs.image_url;
        if (isVideo) {
            if (inputs.duration)
                body.duration = String(Number(inputs.duration)) + "s";
            if (inputs.width && inputs.height)
                body.video_size = { width: Number(inputs.width), height: Number(inputs.height) };
        }
        else {
            if (inputs.width)
                body.image_size = { width: Number(inputs.width), height: Number(inputs.height || inputs.width) };
        }
        if (inputs.guidance_scale)
            body.guidance_scale = Number(inputs.guidance_scale);
        if (inputs.steps)
            body.num_inference_steps = Number(inputs.steps);
        if (inputs.seed && Number(inputs.seed) >= 0)
            body.seed = Number(inputs.seed);
        if (inputs.scale)
            body.scale = Number(inputs.scale);
        if (inputs.image)
            body.image_url = inputs.image;
        const resp = await fetch(`https://fal.run/${falModel}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Key ${apiKey}`,
            },
            body: JSON.stringify(body),
        });
        const data = await resp.json();
        if (data.images?.[0]?.url)
            return { url: data.images[0].url };
        if (data.image?.url)
            return { url: data.image.url };
        if (data.video?.url)
            return { url: data.video.url };
        return { error: data.detail || JSON.stringify(data).slice(0, 200) };
    }
    catch (err) {
        return { error: String(err) };
    }
}
// ---------------------------------------------------------------------------
// Asset Manager helpers
// ---------------------------------------------------------------------------
function getAssets() {
    try {
        return JSON.parse(localStorage.getItem("openflow_assets") || "[]");
    }
    catch {
        return [];
    }
}
function saveAsset(asset) {
    const assets = getAssets();
    assets.unshift(asset);
    // Keep max 200
    if (assets.length > 200)
        assets.length = 200;
    localStorage.setItem("openflow_assets", JSON.stringify(assets));
}
// ---------------------------------------------------------------------------
// Custom Node Component
// ---------------------------------------------------------------------------
function FlowNode({ data, selected }) {
    const def = data.def;
    const values = data.values;
    const onChange = data.onChange;
    const outputUrl = data.outputUrl;
    const nodeStatus = data.status;
    const [showMenu, setShowMenu] = useState(false);
    const [editing, setEditing] = useState(true);
    const onPreview = data.onPreview;
    const isExecuting = data.isExecuting;
    const isComplete = nodeStatus === "done" && outputUrl;
    const isFailed = typeof nodeStatus === "string" && nodeStatus.startsWith("Error");
    const showForm = editing || !isComplete;
    const cardStyle = {
        background: "#ffffff",
        border: isExecuting ? "2px solid #f59e0b" : isFailed ? "2px solid #ef4444" : isComplete && !showForm ? "2px solid #22c55e" : selected ? "1.5px solid #d1d5db" : "1px solid #e8e8eb",
        borderRadius: 16,
        minWidth: 260,
        maxWidth: 360,
        overflow: "visible",
        fontFamily: "'Inter', -apple-system, 'Helvetica Neue', sans-serif",
        boxShadow: selected
            ? "0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
            : "0 2px 12px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.2s, border-color 0.2s",
    };
    if (isComplete && !showForm) {
        const model = values.model || "";
        const prompt = values.prompt || values.text || "";
        const w = values.width ? String(values.width) : "";
        const h = values.height ? String(values.height) : "";
        const dur = values.duration ? `${values.duration}s` : "";
        const aspectRatio = w && h ? `${Number(w) > Number(h) ? "16:9" : Number(w) === Number(h) ? "1:1" : "9:16"}` : "";
        const resolution = h ? `${h}p` : "";
        return (_jsxs("div", { style: cardStyle, children: [_jsxs("div", { style: { padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("span", { style: { color: "#6b7280", display: "flex" }, dangerouslySetInnerHTML: { __html: NODE_ICONS[def.id] || "" } }), _jsx("span", { style: { color: "#22c55e", fontSize: 14 }, children: "\u2713" }), _jsx("span", { style: { fontSize: 12, fontWeight: 600, color: "#1a1a1a" }, children: def.name })] }), _jsxs("div", { style: { position: "relative" }, children: [_jsx("button", { onClick: () => setShowMenu(!showMenu), style: { width: 28, height: 28, borderRadius: 6, border: "1px solid #e8e8eb", background: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#6b7280" }, children: "\u22EE" }), showMenu && (_jsx("div", { style: { position: "absolute", right: 0, top: 32, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 140, overflow: "hidden" }, children: [
                                        { label: "Edit Settings", action: () => { setEditing(true); setShowMenu(false); } },
                                        { label: "Retry", action: () => { const onRun = data.onRun; if (onRun)
                                                onRun(); setShowMenu(false); } },
                                        { label: "⭐ Save Preset", action: () => { const onSavePreset = data.onSavePreset; if (onSavePreset)
                                                onSavePreset(); setShowMenu(false); } },
                                        { label: "Delete", action: () => { const onDelete = data.onDelete; if (onDelete)
                                                onDelete(); setShowMenu(false); } },
                                    ].map((item) => (_jsx("button", { onClick: item.action, style: { width: "100%", padding: "10px 14px", border: "none", background: "transparent", fontSize: 12, fontWeight: 500, color: item.label === "Delete" ? "#ef4444" : "#1a1a1a", cursor: "pointer", textAlign: "left" }, onMouseOver: (e) => { e.currentTarget.style.background = "#f5f5f7"; }, onMouseOut: (e) => { e.currentTarget.style.background = "transparent"; }, children: item.label }, item.label))) }))] })] }), _jsxs("div", { style: { padding: "0 18px 10px", fontSize: 12, color: "#6b7280", lineHeight: 2 }, children: [dur && _jsxs("div", { children: ["\u23F1 ", dur] }), aspectRatio && _jsxs("div", { children: ["\u25A2 ", aspectRatio] }), resolution && _jsxs("div", { children: ["\u25EB ", resolution] }), _jsxs("div", { children: ["\u25CE ", model] }), _jsx("div", { style: { color: "#9ca3af", fontSize: 11, marginTop: 4, fontStyle: "italic" }, children: prompt.length > 60 ? prompt.slice(0, 60) + "..." : prompt }), _jsx("div", { style: { marginTop: 6 }, children: _jsx(VersionDropdown, { nodeId: data.nodeId || "unknown", onRestore: (v) => {
                                    const onRestoreVersion = data.onRestoreVersion;
                                    if (onRestoreVersion)
                                        onRestoreVersion(v.outputUrl);
                                }, onPreview: onPreview }) })] }), _jsxs("div", { style: { padding: "0 18px 16px", cursor: "pointer" }, onClick: () => { const isVid = def.category === "video" || def.id === "video.img_to_video"; if (onPreview && outputUrl)
                        onPreview(outputUrl, isVid ? "video" : "image"); }, children: [def.category === "video" || def.id === "video.img_to_video" ? (_jsx("video", { src: outputUrl, controls: true, autoPlay: true, loop: true, muted: true, style: { width: "100%", maxHeight: 120, borderRadius: 12, objectFit: "cover" } })) : (_jsx("img", { src: outputUrl, alt: "output", style: { width: "100%", maxHeight: 120, borderRadius: 12, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } })), _jsx("div", { style: { fontSize: 9, color: "#9ca3af", textAlign: "center", marginTop: 4 }, children: "Click to expand" })] }), def.inputs.length > 0 && _jsx(Handle, { type: "target", position: Position.Left, id: "in", style: { width: 10, height: 10, background: "#d1d5db", border: "2px solid #ffffff", left: -6, top: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } }), def.outputs.length > 0 && _jsx(Handle, { type: "source", position: Position.Right, id: "out", style: { width: 10, height: 10, background: "#d1d5db", border: "2px solid #ffffff", right: -6, top: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } })] }));
    }
    return (_jsxs("div", { style: cardStyle, children: [_jsxs("div", { style: { padding: "14px 18px 10px", display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("span", { style: { color: "#6b7280", display: "flex" }, dangerouslySetInnerHTML: { __html: NODE_ICONS[def.id] || "" } }), _jsx("span", { style: { fontSize: 12, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.2px" }, children: def.name })] }), def.inputs.length > 0 && _jsx(Handle, { type: "target", position: Position.Left, id: "in", style: { width: 10, height: 10, background: "#d1d5db", border: "2px solid #ffffff", left: -6, top: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } }), _jsx("div", { className: "nodrag nowheel", style: { padding: "4px 0 12px" }, children: def.inputs.map((inp) => (_jsxs("div", { style: { padding: "3px 18px" }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 500, color: "#9ca3af", marginBottom: 3 }, children: inp.description }), inp.type === "string" && !inp.options && (inp.name === "prompt" || inp.name === "system" || inp.name === "text" ? (_jsx("textarea", { onKeyDown: stopKeys, value: values[inp.name] || "", onChange: (e) => onChange(inp.name, e.target.value), placeholder: inp.description, rows: 3, style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 14, padding: "10px 14px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 } })) : (_jsx("input", { onKeyDown: stopKeys, type: "text", value: values[inp.name] || "", onChange: (e) => onChange(inp.name, e.target.value), placeholder: inp.description, style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 13, padding: "8px 14px", outline: "none" } }))), inp.options && (_jsx("select", { onKeyDown: stopKeys, value: String(values[inp.name] ?? inp.default ?? ""), onChange: (e) => onChange(inp.name, e.target.value), style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 13, padding: "8px 14px", outline: "none", cursor: "pointer", WebkitAppearance: "none" }, children: inp.options.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })), (inp.type === "integer" || inp.type === "float") && !inp.options && (_jsx("input", { onKeyDown: stopKeys, type: "number", value: String(values[inp.name] ?? inp.default ?? ""), onChange: (e) => onChange(inp.name, inp.type === "float" ? parseFloat(e.target.value) : parseInt(e.target.value)), step: inp.type === "float" ? 0.1 : 1, style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 13, padding: "8px 14px", outline: "none" } }))] }, inp.name))) }), def.inputs.some((inp) => inp.name === "model") && (_jsx("div", { style: { padding: "4px 18px 8px" }, children: _jsx("button", { onClick: () => { setEditing(false); const onRun = data.onRun; if (onRun)
                        onRun(); }, disabled: nodeStatus === "running", style: { width: "100%", padding: "10px", background: nodeStatus === "running" ? "#e5e7eb" : "#c026d3", color: nodeStatus === "running" ? "#9ca3af" : "#ffffff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: nodeStatus === "running" ? "not-allowed" : "pointer", transition: "background 0.15s" }, children: nodeStatus === "running" ? "Generating..." : "Generate ✦" }) })), nodeStatus && nodeStatus !== "done" && (_jsxs("div", { style: { padding: "8px 18px 12px", fontSize: 11, fontWeight: 500, color: nodeStatus === "running" ? "#92400e" : "#991b1b", display: "flex", alignItems: "center", gap: 6 }, children: [_jsx("span", { style: { width: 5, height: 5, borderRadius: "50%", background: nodeStatus === "running" ? "#f59e0b" : "#ef4444" } }), nodeStatus === "running" ? "Generating..." : nodeStatus] })), nodeStatus === "done" && outputUrl && (_jsxs("div", { style: { padding: "4px 18px 12px", cursor: "pointer" }, onClick: () => { const isVid = def.category === "video" || def.id === "video.img_to_video"; const isLLM = def.id === "text.llm" || def.id === "tools.prompt_enhancer"; if (!isLLM && onPreview && outputUrl)
                    onPreview(outputUrl, isVid ? "video" : "image"); }, children: [def.id === "text.llm" || def.id === "tools.prompt_enhancer" ? (_jsx("div", { style: { background: "#f5f5f7", borderRadius: 10, padding: "10px 12px", fontSize: 11, color: "#1a1a1a", lineHeight: 1.5, maxHeight: 150, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }, children: data.llmResponse || outputUrl })) : def.category === "video" || def.id === "video.img_to_video" ? (_jsx("video", { src: outputUrl, muted: true, style: { width: "100%", maxHeight: 120, borderRadius: 10, objectFit: "cover" } })) : (_jsx("img", { src: outputUrl, alt: "output", style: { width: "100%", maxHeight: 120, borderRadius: 10, objectFit: "cover" } })), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4, marginTop: 4 }, children: [_jsx("span", { style: { color: "#22c55e", fontSize: 12 }, children: "\u2713" }), _jsxs("span", { style: { fontSize: 9, color: "#9ca3af" }, children: ["Done", def.id !== "text.llm" && def.id !== "tools.prompt_enhancer" ? " · Click to expand" : ""] })] })] })), isFailed && (_jsxs("div", { style: { padding: "4px 18px 8px", display: "flex", alignItems: "center", gap: 4 }, children: [_jsx("span", { style: { color: "#ef4444", fontSize: 12 }, children: "\u2717" }), _jsx("span", { style: { fontSize: 9, color: "#ef4444" }, children: "Failed" })] })), def.outputs.length > 0 && _jsx(Handle, { type: "source", position: Position.Right, id: "out", style: { width: 10, height: 10, background: "#d1d5db", border: "2px solid #ffffff", right: -6, top: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } })] }));
}
const MemoFlowNode = React.memo(FlowNode);
const nodeTypes = { flowNode: MemoFlowNode };
// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
function LandingPage({ onEnter }) {
    return (_jsxs("div", { style: { display: "flex", height: "100vh", width: "100vw", fontFamily: "'Inter', -apple-system, sans-serif", background: "#0a0a0b", color: "#ffffff", overflow: "hidden" }, children: [_jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", maxWidth: 640, minWidth: 400 }, children: [_jsxs("div", { style: { position: "absolute", top: 0, left: 0, right: 0, padding: "24px 80px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [_jsx("div", { style: { width: 32, height: 32, borderRadius: "50%", background: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }, children: "OC" }), _jsx("span", { style: { fontSize: 16, fontWeight: 700, letterSpacing: "-0.5px" }, children: "OpenClaw" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 24 }, children: [_jsx("a", { href: "https://github.com/nikolateslasagent/openflow", target: "_blank", rel: "noopener", style: { color: "#9ca3af", fontSize: 13, textDecoration: "none", fontWeight: 500 }, children: "GitHub" }), _jsx("button", { onClick: onEnter, style: { padding: "8px 20px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }, children: "Get started" })] })] }), _jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: 8, background: "#1a1a1f", border: "1px solid #2a2a30", borderRadius: 20, padding: "6px 16px", marginBottom: 32, width: "fit-content" }, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" } }), _jsx("span", { style: { fontSize: 12, fontWeight: 600, color: "#e5e7eb", letterSpacing: "0.3px" }, children: "NO SUBSCRIPTIONS & NO MARKUP!" })] }), _jsxs("h1", { style: { fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-2px", margin: "0 0 20px", background: "linear-gradient(to bottom, #ffffff, #a0a0a8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: ["Your Creative", _jsx("br", {}), "Agent"] }), _jsx("p", { style: { fontSize: 16, lineHeight: 1.6, color: "#9ca3af", margin: "0 0 40px", maxWidth: 420 }, children: "Imagine anything and bring it to life \u2014 from images to sounds to video. All in one place." }), _jsxs("button", { onClick: onEnter, style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 10, border: "1px solid #333", background: "#ffffff", color: "#0a0a0b", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "fit-content", transition: "transform 0.15s", letterSpacing: "-0.3px" }, onMouseOver: (e) => { e.currentTarget.style.transform = "translateY(-1px)"; }, onMouseOut: (e) => { e.currentTarget.style.transform = "translateY(0)"; }, children: ["Get started for free ", _jsx("span", { style: { fontSize: 16 }, children: "\u2192" })] })] }), _jsxs("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0f0f12 0%, #1a1a22 50%, #0f0f12 100%)" }, children: [_jsx("div", { style: { position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(192,38,211,0.15) 0%, transparent 70%)", top: "20%", left: "30%", filter: "blur(60px)" } }), _jsx("div", { style: { position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", bottom: "20%", right: "20%", filter: "blur(60px)" } }), _jsxs("div", { style: { width: 520, background: "#1a1a1f", borderRadius: 12, border: "1px solid #2a2a30", boxShadow: "0 25px 80px rgba(0,0,0,0.5)", overflow: "hidden", position: "relative" }, children: [_jsxs("div", { style: { padding: "12px 16px", display: "flex", gap: 6, borderBottom: "1px solid #2a2a30" }, children: [_jsx("span", { style: { width: 10, height: 10, borderRadius: "50%", background: "#ef4444" } }), _jsx("span", { style: { width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" } }), _jsx("span", { style: { width: 10, height: 10, borderRadius: "50%", background: "#22c55e" } })] }), _jsx("div", { style: { height: 360, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #0e0e12 0%, #141418 100%)" }, children: _jsxs("div", { style: { textAlign: "center" }, children: [_jsx("div", { style: { width: 48, height: 48, borderRadius: "50%", background: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, margin: "0 auto 16px", color: "#fff" }, children: "OC" }), _jsx("div", { style: { fontSize: 14, color: "#6b7280", fontWeight: 500 }, children: "Your workspace awaits" }), _jsx("div", { style: { fontSize: 11, color: "#4b5563", marginTop: 4 }, children: "18 image models \u00B7 14 video models \u00B7 unlimited creativity" })] }) })] })] })] }));
}
const MINI_APPS = [
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
function Dashboard({ onNewProject, onOpenCanvas, onLoadTemplate, assets }) {
    return (_jsx("div", { style: { flex: 1, background: "#f0f0f2", overflow: "auto", fontFamily: "'Inter', -apple-system, sans-serif" }, children: _jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: "40px 48px" }, children: [_jsxs("div", { style: { marginBottom: 40 }, children: [_jsx("h1", { style: { fontSize: 28, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-0.5px" }, children: "Welcome back \u2726" }), _jsx("p", { style: { fontSize: 14, color: "#9ca3af", margin: 0 }, children: "Create, generate, and manage your AI workflows" })] }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }, children: [
                        { label: "New Project", icon: "◎", desc: "Start with a blank canvas", color: "#c026d3", action: onNewProject },
                        { label: "Scene Builder", icon: "🎬", desc: "Build scenes from a story", color: "#6366f1", action: onOpenCanvas },
                        { label: "Browse Models", icon: "◫", desc: "18 image + 14 video models", color: "#14b8a6", action: onOpenCanvas },
                    ].map((item) => (_jsxs("button", { onClick: item.action, style: {
                            padding: "24px", background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 16,
                            cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        }, onMouseOver: (e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.boxShadow = `0 4px 16px ${item.color}20`; }, onMouseOut: (e) => { e.currentTarget.style.borderColor = "#e8e8eb"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)"; }, children: [_jsx("div", { style: { fontSize: 28, marginBottom: 12 }, children: item.icon }), _jsx("div", { style: { fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }, children: item.label }), _jsx("div", { style: { fontSize: 12, color: "#9ca3af" }, children: item.desc })] }, item.label))) }), _jsxs("div", { style: { marginBottom: 40 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 16, letterSpacing: "-0.3px" }, children: "Templates & Mini-Apps" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: MINI_APPS.map((app) => (_jsxs("button", { onClick: () => onLoadTemplate(app), style: {
                                    padding: "20px", background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 14,
                                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                                }, onMouseOver: (e) => { e.currentTarget.style.borderColor = app.color; }, onMouseOut: (e) => { e.currentTarget.style.borderColor = "#e8e8eb"; }, children: [_jsx("div", { style: { fontSize: 24, marginBottom: 10 }, children: app.icon }), _jsx("div", { style: { fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }, children: app.name }), _jsx("div", { style: { fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }, children: app.description })] }, app.name))) })] }), _jsxs("div", { style: { marginBottom: 40 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 16, letterSpacing: "-0.3px" }, children: "\uD83C\uDFEA Featured from Marketplace" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }, children: MARKETPLACE_TEMPLATES.slice(0, 4).map((t) => (_jsxs("button", { onClick: () => onLoadTemplate({ name: t.title, description: t.description, icon: t.icon, color: t.color, nodes: t.nodes.map(n => ({ defId: n.defId, x: n.x, y: n.y, values: n.values || {} })), edges: t.edges }), style: {
                                    padding: "20px", background: `linear-gradient(135deg, ${t.color}08, ${t.color}15)`, border: `1px solid ${t.color}30`, borderRadius: 16,
                                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                                }, onMouseOver: (e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${t.color}20`; }, onMouseOut: (e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }, children: [_jsx("span", { style: { fontSize: 24 }, children: t.icon }), _jsxs("span", { style: { padding: "2px 8px", background: `${t.color}20`, color: t.color, borderRadius: 8, fontSize: 9, fontWeight: 700 }, children: [t.nodeCount, " nodes"] })] }), _jsx("div", { style: { fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }, children: t.title }), _jsx("div", { style: { fontSize: 11, color: "#6b7280", lineHeight: 1.4 }, children: t.description }), _jsxs("div", { style: { fontSize: 9, color: "#9ca3af", marginTop: 8 }, children: ["\u2B07 ", t.downloads.toLocaleString(), " uses"] })] }, t.id))) })] }), _jsxs("div", { style: { marginBottom: 40 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }, children: "\uD83D\uDCCA Analytics & Insights" }), _jsx(AnalyticsDashboard, { assets: assets })] }), _jsxs("div", { style: { marginBottom: 40 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }, children: "Recent Activity" }), _jsx("div", { style: { background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 16, overflow: "hidden" }, children: assets.length === 0 ? (_jsx("div", { style: { padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }, children: "No activity yet \u2014 start generating!" })) : (assets.slice(0, 10).map((asset, i) => (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < Math.min(assets.length, 10) - 1 ? "1px solid #f0f0f2" : "none" }, children: [_jsx("div", { style: { width: 36, height: 36, borderRadius: 8, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }, children: asset.type === "video" ? "🎬" : "🖼️" }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { fontSize: 12, fontWeight: 500, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: ["Generated ", asset.type, " with ", asset.model] }), _jsx("div", { style: { fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: asset.prompt || "No prompt" })] }), _jsx("div", { style: { fontSize: 9, color: "#c4c4c8", whiteSpace: "nowrap" }, children: new Date(asset.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })] }, i)))) })] }), assets.length > 0 && (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }, children: "Recent Assets" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }, children: assets.slice(0, 8).map((asset, i) => (_jsxs("div", { style: { borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8eb", background: "#fff" }, children: [asset.type === "video" ? (_jsx("video", { src: asset.url, style: { width: "100%", height: 120, objectFit: "cover" }, muted: true })) : (_jsx("img", { src: asset.url, alt: "", style: { width: "100%", height: 120, objectFit: "cover" } })), _jsx("div", { style: { padding: "8px 10px" }, children: _jsx("div", { style: { fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: asset.prompt || asset.model }) })] }, i))) })] }))] }) }));
}
// ---------------------------------------------------------------------------
// Asset Manager Panel
// ---------------------------------------------------------------------------
function AssetManagerPanel({ assets }) {
    const [filter, setFilter] = useState("all");
    const [previewAsset, setPreviewAsset] = useState(null);
    const filtered = filter === "all" ? assets : assets.filter(a => a.type === filter);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: "#1a1a1a" }, children: "\uD83D\uDDBC\uFE0F Asset Manager" }), _jsxs("div", { style: { fontSize: 10, color: "#9ca3af" }, children: [assets.length, " total"] })] }), _jsx("div", { style: { display: "flex", gap: 4, marginBottom: 12 }, children: ["all", "image", "video"].map((f) => (_jsx("button", { onClick: () => setFilter(f), style: {
                                padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 600,
                                background: filter === f ? "#c026d3" : "#f5f5f7", color: filter === f ? "#fff" : "#6b7280",
                                cursor: "pointer", textTransform: "capitalize",
                            }, children: f }, f))) }), filtered.length === 0 && _jsx("div", { style: { fontSize: 11, color: "#9ca3af", textAlign: "center", padding: 20 }, children: "No assets yet. Generate something!" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }, children: filtered.map((asset, i) => (_jsxs("div", { onClick: () => setPreviewAsset(asset), style: { borderRadius: 8, overflow: "hidden", border: "1px solid #e8e8eb", cursor: "pointer", background: "#f5f5f7" }, children: [asset.type === "video" ? (_jsx("video", { src: asset.url, style: { width: "100%", height: 70, objectFit: "cover" }, muted: true })) : (_jsx("img", { src: asset.url, alt: "", style: { width: "100%", height: 70, objectFit: "cover" } })), _jsx("div", { style: { padding: "4px 6px", fontSize: 8, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: asset.model })] }, i))) })] }), previewAsset && (_jsx("div", { onClick: () => setPreviewAsset(null), style: {
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 40,
                }, children: _jsxs("div", { onClick: (e) => e.stopPropagation(), style: { maxWidth: 800, maxHeight: "90vh", background: "#fff", borderRadius: 16, overflow: "hidden" }, children: [previewAsset.type === "video" ? (_jsx("video", { src: previewAsset.url, controls: true, autoPlay: true, style: { maxWidth: "100%", maxHeight: "70vh" } })) : (_jsx("img", { src: previewAsset.url, alt: "", style: { maxWidth: "100%", maxHeight: "70vh" } })), _jsxs("div", { style: { padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#1a1a1a" }, children: previewAsset.model }), _jsx("div", { style: { fontSize: 11, color: "#9ca3af", marginTop: 2 }, children: previewAsset.prompt?.slice(0, 80) })] }), _jsx("a", { href: previewAsset.url, download: true, target: "_blank", rel: "noopener", style: {
                                        padding: "8px 16px", background: "#c026d3", color: "#fff", borderRadius: 8,
                                        fontSize: 12, fontWeight: 600, textDecoration: "none",
                                    }, children: "Download" })] })] }) }))] }));
}
// ---------------------------------------------------------------------------
// Chat Panel
// ---------------------------------------------------------------------------
function ChatPanel() {
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! I'm your AI workflow assistant. I can help you:\n\n• Build creative workflows\n• Choose the right model for your project\n• Suggest prompts and techniques\n\nWhat would you like to create?", timestamp: Date.now() },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const TIPS = {
        "image": "For images, try flux-pro-1.1-ultra for highest quality, or flux-fast for speed. Use detailed prompts with style, lighting, and mood.",
        "video": "For video, wan-2.1 is great for general use. kling-3.0-pro excels at realistic motion. Keep prompts focused on movement.",
        "upscale": "Use the Upscale node with real-esrgan for 2x or 4x resolution increase. Works best on AI-generated images.",
        "prompt": "Great prompts include: subject, style, lighting, mood, camera angle. Example: 'Cinematic close-up of a crystal dragon, volumetric fog, golden hour lighting, 8k'",
        "help": "Available nodes: Text to Image, Text to Video, Image to Image, Upscale, Inpaint, LLM Chat, Image to Video, Merge. Drag them from the left toolbar!",
    };
    const sendMessage = async () => {
        if (!input.trim())
            return;
        const userMsg = { role: "user", content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        // Simple keyword matching for tips
        const lower = input.toLowerCase();
        let response = "I'd suggest starting with a Text to Image node — drag one from the Image category in the left toolbar. Try a detailed prompt describing what you want to create!";
        for (const [key, tip] of Object.entries(TIPS)) {
            if (lower.includes(key)) {
                response = tip;
                break;
            }
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
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", height: "100%" }, children: [_jsx("div", { style: { padding: "16px 20px 8px", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }, children: "\uD83D\uDCAC AI Assistant" }), _jsxs("div", { style: { flex: 1, overflow: "auto", padding: "8px 16px" }, children: [messages.map((msg, i) => (_jsx("div", { style: { marginBottom: 12, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }, children: _jsx("div", { style: {
                                maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
                                background: msg.role === "user" ? "#c026d3" : "#f5f5f7",
                                color: msg.role === "user" ? "#fff" : "#1a1a1a",
                                fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap",
                            }, children: msg.content }) }, i))), loading && (_jsx("div", { style: { marginBottom: 12 }, children: _jsx("div", { style: { padding: "10px 14px", borderRadius: 12, background: "#f5f5f7", fontSize: 12, color: "#9ca3af", display: "inline-block" }, children: "Thinking..." }) })), _jsx("div", { ref: bottomRef })] }), _jsxs("div", { style: { padding: "8px 16px 16px", display: "flex", gap: 6 }, children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => { if (e.key === "Enter")
                            sendMessage(); }, placeholder: "Ask about workflows, models, prompts...", style: { flex: 1, background: "#f5f5f7", border: "none", borderRadius: 10, fontSize: 12, padding: "10px 14px", outline: "none" } }), _jsx("button", { onClick: sendMessage, disabled: loading, style: {
                            padding: "10px 14px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 10,
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }, children: "Send" })] })] }));
}
// ---------------------------------------------------------------------------
// Generation History Panel
// ---------------------------------------------------------------------------
function HistoryPanel({ onRerun }) {
    const [records, setRecords] = useState(() => getTrainingRecords());
    const [selectedRecord, setSelectedRecord] = useState(null);
    const refresh = () => setRecords(getTrainingRecords());
    return (_jsxs("div", { style: { padding: 20, display: "flex", flexDirection: "column", height: "100%" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: "#1a1a1a" }, children: "\uD83D\uDD50 Generation History" }), _jsxs("div", { style: { display: "flex", gap: 4 }, children: [_jsx("button", { onClick: refresh, style: { padding: "4px 8px", background: "#f5f5f7", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer", color: "#6b7280" }, children: "\u21BB" }), _jsx("button", { onClick: () => { clearTrainingData(); refresh(); }, style: { padding: "4px 8px", background: "#fef2f2", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer", color: "#ef4444" }, children: "Clear" })] })] }), records.length === 0 && _jsx("div", { style: { fontSize: 11, color: "#9ca3af", textAlign: "center", padding: 20 }, children: "No generations yet" }), _jsx("div", { style: { flex: 1, overflow: "auto" }, children: selectedRecord ? (_jsxs("div", { children: [_jsx("button", { onClick: () => setSelectedRecord(null), style: { padding: "4px 8px", background: "#f5f5f7", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer", color: "#6b7280", marginBottom: 12 }, children: "\u2190 Back" }), selectedRecord.output_url && (selectedRecord.output_url.includes("video") ?
                            _jsx("video", { src: selectedRecord.output_url, controls: true, style: { width: "100%", borderRadius: 10, marginBottom: 12 } }) :
                            _jsx("img", { src: selectedRecord.output_url, alt: "", style: { width: "100%", borderRadius: 10, marginBottom: 12 } })), _jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }, children: selectedRecord.model }), _jsx("div", { style: { fontSize: 11, color: "#6b7280", marginBottom: 8, lineHeight: 1.5 }, children: selectedRecord.prompt }), _jsxs("div", { style: { fontSize: 10, color: "#9ca3af", marginBottom: 4 }, children: ["\u23F1 ", (selectedRecord.generation_time_ms / 1000).toFixed(1), "s"] }), _jsxs("div", { style: { fontSize: 10, color: "#9ca3af", marginBottom: 12 }, children: ["\uD83D\uDCC5 ", new Date(selectedRecord.timestamp).toLocaleString()] }), _jsx("button", { onClick: () => { onRerun({ model: selectedRecord.model, prompt: selectedRecord.prompt, params: selectedRecord.params }); }, style: { width: "100%", padding: "10px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "Re-run \u2726" })] })) : (records.map((r, i) => (_jsxs("div", { onClick: () => setSelectedRecord(r), style: { display: "flex", gap: 8, padding: "8px 6px", cursor: "pointer", borderRadius: 8, marginBottom: 2, transition: "background 0.12s" }, onMouseOver: (e) => { e.currentTarget.style.background = "#f5f5f7"; }, onMouseOut: (e) => { e.currentTarget.style.background = "transparent"; }, children: [r.output_url && _jsx("img", { src: r.output_url, alt: "", style: { width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }, onError: (e) => { e.target.style.display = "none"; } }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: r.prompt?.slice(0, 50) || "No prompt" }), _jsxs("div", { style: { fontSize: 9, color: "#9ca3af" }, children: [r.model, " \u00B7 ", (r.generation_time_ms / 1000).toFixed(1), "s \u00B7 ", new Date(r.timestamp).toLocaleTimeString()] })] })] }, i)))) })] }));
}
// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
    const [showLanding, setShowLanding] = useState(true);
    const [currentView, setCurrentView] = useState("dashboard");
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [falApiKey, setFalApiKey] = useState(() => localStorage.getItem("openflow_fal_key") || "148ec4ac-aafc-416b-9213-74cacdeefe5e:0dc2faa972e5762ba57fc758b2fd99e8");
    const [assets, setAssets] = useState(() => getAssets());
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("openflow_dark") === "true");
    const [executionProgress, setExecutionProgress] = useState(null);
    const cancelRef = useRef(false);
    const [previewModal, setPreviewModal] = useState(null);
    // Undo/Redo
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const skipHistoryRef = useRef(false);
    const idCounter = useRef(0);
    const { addToast, ToastContainer } = useToast();
    const [showGallery, setShowGallery] = useState(false);
    const [showTutorial, setShowTutorial] = useState(() => shouldShowTutorial());
    const [nodeComments, setNodeComments] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("openflow_node_comments") || "{}");
        }
        catch {
            return {};
        }
    });
    const [contextMenu, setContextMenu] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [batchJobs, setBatchJobs] = useState([]);
    const [batchRunning, setBatchRunning] = useState(false);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddPos, setQuickAddPos] = useState({ x: 400, y: 300 });
    const [quickAddSearch, setQuickAddSearch] = useState("");
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [canvasSearch, setCanvasSearch] = useState(false);
    const [canvasSearchTerm, setCanvasSearchTerm] = useState("");
    const { notifications, addNotification, markAllRead, clearAll: clearNotifications, unreadCount } = useNotifications();
    const generationQueue = useGenerationQueue();
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    // suppress unused warnings
    void showGallery;
    void showTutorial;
    void contextMenu;
    void editingComment;
    const grouped = useMemo(() => groupByCategory(NODE_DEFS), []);
    const refreshAssets = useCallback(() => setAssets(getAssets()), []);
    // Push to undo stack on meaningful changes
    const pushUndo = useCallback(() => {
        setUndoStack(prev => {
            const snap = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
            const next = [...prev, snap];
            if (next.length > 50)
                next.shift();
            return next;
        });
        setRedoStack([]);
    }, [nodes, edges]);
    const undo = useCallback(() => {
        setUndoStack(prev => {
            if (prev.length === 0)
                return prev;
            const newStack = [...prev];
            const state = newStack.pop();
            setRedoStack(r => [...r, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
            skipHistoryRef.current = true;
            // Restore nodes with handlers
            const restoredNodes = state.nodes.map((n) => {
                return { ...n, data: { ...n.data, onChange: (key, val) => updateNodeValue(n.id, key, val), onRun: () => runSingleNodeRef.current(n.id), onDelete: () => setNodes((nds) => nds.filter((nd) => nd.id !== n.id)), onPreview: (url, type) => setPreviewModal({ url, type }) } };
            });
            setNodes(restoredNodes);
            setEdges(state.edges);
            return newStack;
        });
    }, [nodes, edges, setNodes, setEdges]);
    const redo = useCallback(() => {
        setRedoStack(prev => {
            if (prev.length === 0)
                return prev;
            const newStack = [...prev];
            const state = newStack.pop();
            setUndoStack(u => [...u, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
            skipHistoryRef.current = true;
            const restoredNodes = state.nodes.map((n) => {
                return { ...n, data: { ...n.data, onChange: (key, val) => updateNodeValue(n.id, key, val), onRun: () => runSingleNodeRef.current(n.id), onDelete: () => setNodes((nds) => nds.filter((nd) => nd.id !== n.id)), onPreview: (url, type) => setPreviewModal({ url, type }) } };
            });
            setNodes(restoredNodes);
            setEdges(state.edges);
            return newStack;
        });
    }, [nodes, edges, setNodes, setEdges]);
    const onConnect = useCallback((connection) => {
        setEdges((eds) => addEdge({ ...connection, animated: false, type: "smoothstep", style: { stroke: "#d1d5db", strokeWidth: 1.5 } }, eds));
    }, [setEdges]);
    const updateNodeValue = useCallback((nodeId, key, val) => {
        setNodes((nds) => nds.map((n) => {
            if (n.id !== nodeId)
                return n;
            return { ...n, data: { ...n.data, values: { ...n.data.values, [key]: val } } };
        }));
    }, [setNodes]);
    const runSingleNodeRef = useRef(() => { });
    const setNodeData = useCallback((nodeId, patch) => {
        setNodes((nds) => nds.map((n) => {
            if (n.id !== nodeId)
                return n;
            return { ...n, data: { ...n.data, ...patch } };
        }));
    }, [setNodes]);
    const addNodeWithHandler = useCallback((def, overrides) => {
        idCounter.current += 1;
        const nodeId = `${def.id}_${idCounter.current}`;
        const defaults = {};
        def.inputs.forEach((inp) => { if (inp.default !== undefined)
            defaults[inp.name] = inp.default; });
        if (overrides)
            Object.assign(defaults, overrides);
        const newNode = {
            id: nodeId,
            type: "flowNode",
            position: { x: 100 + Math.random() * 400, y: 50 + Math.random() * 300 },
            data: {
                def, values: defaults, nodeId,
                onChange: (key, val) => updateNodeValue(nodeId, key, val),
                onRun: () => runSingleNodeRef.current(nodeId),
                onDelete: () => { pushUndo(); setNodes((nds) => nds.filter((n) => n.id !== nodeId)); },
                onPreview: (url, type) => setPreviewModal({ url, type }),
                onSavePreset: () => saveNodeAsPreset(nodeId),
                onRestoreVersion: (url) => setNodeData(nodeId, { outputUrl: url, status: "done" }),
            },
        };
        setNodes((nds) => [...nds, newNode]);
        return nodeId;
    }, [setNodes, updateNodeValue]);
    const runSingleNode = useCallback(async (nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node)
            return;
        const key = falApiKey;
        const def = node.data.def;
        const values = node.data.values;
        const modelKey = values.model || "flux-dev";
        const startTime = Date.now();
        setNodeData(nodeId, { status: "running", outputUrl: undefined });
        // LLM node — route through OpenAI-compatible API
        if (def.id === "text.llm" || def.id === "tools.prompt_enhancer") {
            const openaiKey = localStorage.getItem("openflow_openai_key") || "";
            if (!openaiKey) {
                setNodeData(nodeId, { status: "Error: Set OpenAI API key in Settings" });
                addToast("Set your OpenAI API key in Settings!", "error");
                return;
            }
            try {
                const llmModel = def.id === "tools.prompt_enhancer" ? "gpt-4o-mini" : (modelKey || "gpt-4o");
                const systemPrompt = def.id === "tools.prompt_enhancer"
                    ? `You are a prompt enhancement expert. Take the user's basic prompt and expand it into a detailed, vivid prompt optimized for AI image generation. Style hint: ${values.style || "photorealistic"}. Output ONLY the enhanced prompt, nothing else.`
                    : (values.system || "You are a helpful assistant.");
                const userMessage = values.prompt || values.text || "";
                const temperature = Number(values.temperature) || 0.7;
                const maxTokens = Number(values.max_tokens) || 2048;
                // Determine API base — support OpenAI, or any compatible endpoint
                const apiBase = localStorage.getItem("openflow_llm_endpoint") || "https://api.openai.com/v1";
                const resp = await fetch(`${apiBase}/chat/completions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
                    body: JSON.stringify({
                        model: llmModel,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userMessage },
                        ],
                        temperature,
                        max_tokens: maxTokens,
                    }),
                });
                const data = await resp.json();
                const reply = data.choices?.[0]?.message?.content || data.error?.message || "No response";
                const genTime = Date.now() - startTime;
                // Store text output as outputUrl for data flow (text nodes pass text through outputUrl)
                setNodeData(nodeId, { status: "done", outputUrl: reply, llmResponse: reply });
                saveVersion(nodeId, reply, "text", values.prompt || "", modelKey);
                addToast(`LLM responded! (${(genTime / 1000).toFixed(1)}s)`, "success");
            }
            catch (err) {
                setNodeData(nodeId, { status: `Error: ${String(err)}` });
                addToast(`LLM Error: ${String(err).slice(0, 60)}`, "error");
            }
            return;
        }
        // Sprint 12: Style Transfer node
        if (def.id === "image.style_transfer") {
            if (!key) {
                addToast("Set your fal.ai API key in Settings first!", "error");
                return;
            }
            try {
                const styleStrength = Number(values.style_strength) || 0.75;
                const falModel = modelKey === "ip-adapter" ? "fal-ai/ip-adapter-face-id" : (FAL_MODELS[modelKey] || "fal-ai/flux-pro/v1.1");
                const body = {
                    prompt: values.content_prompt || "",
                    image_url: values.style_image_url || "",
                    strength: styleStrength,
                };
                if (modelKey === "ip-adapter") {
                    body.face_image_url = values.style_image_url;
                }
                const resp = await fetch(`https://fal.run/${falModel}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Key ${key}` },
                    body: JSON.stringify(body),
                });
                const data = await resp.json();
                const url = data.images?.[0]?.url || data.image?.url;
                if (url) {
                    const genTime = Date.now() - startTime;
                    setNodeData(nodeId, { status: "done", outputUrl: url });
                    saveAsset({ url, type: "image", prompt: values.content_prompt || "", model: modelKey, timestamp: Date.now() });
                    addToast(`Style transfer done! (${(genTime / 1000).toFixed(1)}s)`, "success");
                }
                else {
                    setNodeData(nodeId, { status: `Error: ${data.detail || JSON.stringify(data).slice(0, 200)}` });
                }
            }
            catch (err) {
                setNodeData(nodeId, { status: `Error: ${String(err)}` });
            }
            return;
        }
        // Sprint 12: Image Variations node
        if (def.id === "image.variations") {
            if (!key) {
                addToast("Set your fal.ai API key in Settings first!", "error");
                return;
            }
            try {
                const numVariations = Number(values.num_variations) || 4;
                const strength = Number(values.variation_strength) || 0.5;
                const falModel = FAL_MODELS[modelKey] || "fal-ai/flux-pro/v1.1";
                const results = [];
                for (let i = 0; i < numVariations; i++) {
                    const body = {
                        prompt: values.prompt || "variation",
                        image_url: values.image_url || "",
                        strength: strength + (i * 0.05),
                        seed: Math.floor(Math.random() * 999999) + i,
                    };
                    const resp = await fetch(`https://fal.run/${falModel}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Key ${key}` },
                        body: JSON.stringify(body),
                    });
                    const data = await resp.json();
                    const url = data.images?.[0]?.url || data.image?.url;
                    if (url)
                        results.push(url);
                }
                if (results.length > 0) {
                    const genTime = Date.now() - startTime;
                    setNodeData(nodeId, { status: "done", outputUrl: results[0], variationUrls: results });
                    saveAsset({ url: results[0], type: "image", prompt: values.prompt || "variations", model: modelKey, timestamp: Date.now() });
                    addToast(`Generated ${results.length} variations! (${(genTime / 1000).toFixed(1)}s)`, "success");
                }
                else {
                    setNodeData(nodeId, { status: "Error: No variations generated" });
                }
            }
            catch (err) {
                setNodeData(nodeId, { status: `Error: ${String(err)}` });
            }
            return;
        }
        // Sprint 12: Outpainting node
        if (def.id === "image.outpaint") {
            if (!key) {
                addToast("Set your fal.ai API key in Settings first!", "error");
                return;
            }
            try {
                const direction = values.direction || "all";
                const extendPx = Number(values.extend_pixels) || 256;
                const falModel = FAL_MODELS[modelKey] || "fal-ai/flux-pro/v1.1";
                // Build creative outpainting via inpainting with extended canvas
                const body = {
                    prompt: values.prompt || "seamless extension of the scene",
                    image_url: values.image_url || "",
                    image_size: direction === "left" || direction === "right"
                        ? { width: 1024 + extendPx, height: 1024 }
                        : direction === "up" || direction === "down"
                            ? { width: 1024, height: 1024 + extendPx }
                            : { width: 1024 + extendPx, height: 1024 + extendPx },
                    strength: 0.85,
                };
                const resp = await fetch(`https://fal.run/${falModel}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Key ${key}` },
                    body: JSON.stringify(body),
                });
                const data = await resp.json();
                const url = data.images?.[0]?.url || data.image?.url;
                if (url) {
                    const genTime = Date.now() - startTime;
                    setNodeData(nodeId, { status: "done", outputUrl: url });
                    saveAsset({ url, type: "image", prompt: values.prompt || "outpaint", model: modelKey, timestamp: Date.now() });
                    addToast(`Outpaint done! (${(genTime / 1000).toFixed(1)}s)`, "success");
                }
                else {
                    setNodeData(nodeId, { status: `Error: ${data.detail || JSON.stringify(data).slice(0, 200)}` });
                }
            }
            catch (err) {
                setNodeData(nodeId, { status: `Error: ${String(err)}` });
            }
            return;
        }
        // Standard fal.ai generation
        if (!key) {
            addToast("Set your fal.ai API key in Settings first!", "error");
            return;
        }
        localStorage.setItem("openflow_fal_key", key);
        const result = await runFalGeneration(modelKey, values, key);
        if (result.url) {
            const genTime = Date.now() - startTime;
            setNodeData(nodeId, { status: "done", outputUrl: result.url });
            const isVideo = def.category === "video" || def.id === "video.img_to_video";
            saveVersion(nodeId, result.url, isVideo ? "video" : "image", values.prompt || "", modelKey);
            saveAsset({ url: result.url, type: isVideo ? "video" : "image", prompt: values.prompt || values.text || "", model: modelKey, timestamp: Date.now() });
            saveTrainingRecord({ timestamp: Date.now(), model: modelKey, prompt: values.prompt || "", params: values, output_url: result.url, generation_time_ms: genTime, user_id: "local" });
            refreshAssets();
            addToast(`Generated! (${(genTime / 1000).toFixed(1)}s)`, "success");
            addNotification("success", "Generation complete", `${modelKey}: ${(values.prompt || "").slice(0, 60)}`, nodeId);
        }
        else {
            setNodeData(nodeId, { status: `Error: ${result.error}` });
            addToast(`Error: ${result.error?.slice(0, 60)}`, "error");
            addNotification("error", "Generation failed", result.error?.slice(0, 80) || "Unknown error", nodeId);
        }
    }, [nodes, falApiKey, setNodeData, refreshAssets, addToast]);
    runSingleNodeRef.current = runSingleNode;
    // Batch processing
    const runBatch = useCallback(async (prompts, model) => {
        if (!falApiKey) {
            addToast("Set your fal.ai API key first!", "error");
            return;
        }
        setBatchRunning(true);
        const jobs = prompts.map((p, i) => ({ index: i, prompt: p, status: "pending" }));
        setBatchJobs([...jobs]);
        for (let i = 0; i < jobs.length; i++) {
            jobs[i] = { ...jobs[i], status: "running" };
            setBatchJobs([...jobs]);
            const result = await runFalGeneration(model, { prompt: jobs[i].prompt }, falApiKey);
            if (result.url) {
                jobs[i] = { ...jobs[i], status: "done", result: result.url };
                saveAsset({ url: result.url, type: "image", prompt: jobs[i].prompt, model, timestamp: Date.now() });
            }
            else {
                jobs[i] = { ...jobs[i], status: "error", error: result.error };
            }
            setBatchJobs([...jobs]);
        }
        setBatchRunning(false);
        refreshAssets();
        addToast(`Batch complete! ${jobs.filter(j => j.status === "done").length}/${jobs.length} succeeded`, "success");
        addNotification("success", "Batch finished", `${jobs.filter(j => j.status === "done").length}/${jobs.length} succeeded`);
    }, [falApiKey, addToast, refreshAssets]);
    // Auto-layout nodes in a grid
    const autoLayout = useCallback(() => {
        pushUndo();
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const gapX = 320, gapY = 350;
        setNodes(nds => nds.map((n, i) => ({
            ...n,
            position: { x: 100 + (i % cols) * gapX, y: 100 + Math.floor(i / cols) * gapY },
        })));
        addToast("Nodes arranged!", "success");
    }, [nodes.length, pushUndo, setNodes, addToast]);
    // Save node as preset
    const saveNodeAsPreset = useCallback((nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node)
            return;
        const def = node.data.def;
        const values = node.data.values;
        const presetName = window.prompt("Preset name:", def.name + " preset") || def.name + " preset";
        const preset = {
            id: `preset_${Date.now()}`,
            name: presetName,
            defId: def.id,
            defName: def.name,
            icon: def.icon,
            values: { ...values },
            createdAt: Date.now(),
        };
        savePreset(preset);
        addToast(`Saved preset "${presetName}"!`, "success");
    }, [nodes, addToast]);
    const handleRun = useCallback(async () => {
        if (!falApiKey) {
            addToast("Enter your fal.ai API key in Settings!", "error");
            return;
        }
        localStorage.setItem("openflow_fal_key", falApiKey);
        setIsRunning(true);
        cancelRef.current = false;
        pushUndo();
        // Topological sort — include all nodes with a "model" input
        const genNodes = nodes.filter((n) => {
            const def = n.data.def;
            return def.inputs.some((inp) => inp.name === "model");
        });
        const nodeIds = genNodes.map(n => n.id);
        const inDegree = {};
        const adj = {};
        nodeIds.forEach(id => { inDegree[id] = 0; adj[id] = []; });
        edges.forEach(e => {
            if (nodeIds.includes(e.source) && nodeIds.includes(e.target)) {
                adj[e.source].push(e.target);
                inDegree[e.target] = (inDegree[e.target] || 0) + 1;
            }
        });
        const queue = nodeIds.filter(id => inDegree[id] === 0);
        const sorted = [];
        while (queue.length) {
            const id = queue.shift();
            sorted.push(id);
            for (const next of (adj[id] || [])) {
                inDegree[next]--;
                if (inDegree[next] === 0)
                    queue.push(next);
            }
        }
        nodeIds.forEach(id => { if (!sorted.includes(id))
            sorted.push(id); });
        // Track outputs for data flow
        const outputMap = {};
        const log = [];
        for (let i = 0; i < sorted.length; i++) {
            if (cancelRef.current) {
                log.push("⛔ Cancelled by user");
                setExecutionProgress(prev => prev ? { ...prev, log: [...log] } : null);
                break;
            }
            const nodeId = sorted[i];
            const node = genNodes.find(n => n.id === nodeId);
            if (!node)
                continue;
            const def = node.data.def;
            // Pass output from connected source nodes into this node's inputs
            const incomingEdges = edges.filter(e => e.target === nodeId);
            for (const edge of incomingEdges) {
                const sourceUrl = outputMap[edge.source];
                if (sourceUrl) {
                    // Find the source node to determine output type
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    const sourceDef = sourceNode?.data.def;
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
                        }
                        else {
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
                    outputMap[nodeId] = n.data.outputUrl;
                    log.push(`✅ ${def.name} complete`);
                }
                else if (n?.data.status && n.data.status.startsWith("Error")) {
                    log.push(`❌ ${def.name} failed`);
                }
                return nds.map(nd => nd.id === nodeId ? { ...nd, data: { ...nd.data, isExecuting: false } } : nd);
            });
        }
        setIsRunning(false);
        setExecutionProgress(null);
        if (!cancelRef.current) {
            addToast("All nodes complete!", "success");
            trackWorkflowRun(projectName || "untitled", 0, true);
            incrementDailyUsage();
        }
    }, [nodes, edges, falApiKey, runSingleNode, addToast, pushUndo, setNodeData, updateNodeValue, setNodes]);
    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")
                return;
            if (e.key === " " && !e.ctrlKey) {
                e.preventDefault();
                const selected = nodes.find(n => n.selected);
                if (selected)
                    runSingleNodeRef.current(selected.id);
            }
            if (e.key === "Delete" || e.key === "Backspace") {
                const selected = nodes.filter(n => n.selected);
                if (selected.length) {
                    pushUndo();
                    setNodes(nds => nds.filter(n => !n.selected));
                }
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
            if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
                e.preventDefault();
                setShowShortcuts(s => !s);
                return;
            }
            if (e.key === "a" && (e.ctrlKey || e.metaKey) && currentView === "canvas") {
                e.preventDefault();
                setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
                addToast(`Selected ${nodes.length} nodes`, "success");
                return;
            }
            if (e.key === "f" && (e.ctrlKey || e.metaKey) && currentView === "canvas") {
                e.preventDefault();
                setCanvasSearch(true);
                return;
            }
            if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const selected = nodes.filter(n => n.selected);
                if (selected.length) {
                    selected.forEach(n => {
                        const def = n.data.def;
                        const vals = n.data.values;
                        idCounter.current += 1;
                        const nodeId = `${def.id}_${idCounter.current}`;
                        const newNode = {
                            id: nodeId, type: "flowNode",
                            position: { x: n.position.x + 40, y: n.position.y + 40 },
                            data: { def, values: { ...vals }, onChange: (key, val) => updateNodeValue(nodeId, key, val), onRun: () => runSingleNodeRef.current(nodeId), onDelete: () => setNodes((nds) => nds.filter((nd) => nd.id !== nodeId)) },
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
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items)
                return;
            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (!file)
                        return;
                    const reader = new FileReader();
                    reader.onload = () => {
                        const dataUrl = reader.result;
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
        const workflow = { nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, defId: n.data.def.id, values: n.data.values, comment: nodeComments[n.id] })), edges };
        const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `openflow-workflow-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast("Workflow exported!", "success");
    }, [nodes, edges, addToast]);
    // Dark mode effect
    useEffect(() => {
        localStorage.setItem("openflow_dark", String(darkMode));
    }, [darkMode]);
    // Persist node comments
    useEffect(() => {
        localStorage.setItem("openflow_node_comments", JSON.stringify(nodeComments));
    }, [nodeComments]);
    // Agent API: parse URL params on load
    useEffect(() => {
        const agentAction = parseAgentParams();
        if (!agentAction)
            return;
        setShowLanding(false);
        if (agentAction.action === "generate" && agentAction.prompt) {
            const def = NODE_DEFS.find(d => d.id === "image.text_to_image");
            if (def) {
                const nodeId = addNodeWithHandler(def, { model: agentAction.model, prompt: agentAction.prompt });
                setCurrentView("canvas");
                addToast("Agent: Auto-generating...", "info");
                setTimeout(() => runSingleNodeRef.current(nodeId), 500);
            }
        }
        else if (agentAction.action === "workflow") {
            const templateMap = { "product-photo": 0, "social-media-video": 1, "storyboard": 2, "music-video": 3 };
            const idx = templateMap[agentAction.template || ""] ?? 0;
            if (MINI_APPS[idx]) {
                loadTemplate(MINI_APPS[idx]);
                addToast(`Agent: Loaded ${MINI_APPS[idx].name}`, "info");
            }
        }
        else if (agentAction.action === "batch" && agentAction.prompts?.length) {
            runBatch(agentAction.prompts, agentAction.model || "flux-pro");
            setCurrentView("canvas");
        }
        // Clear URL params after processing
        window.history.replaceState({}, "", window.location.pathname);
    }, []);
    // Workflow sharing: check URL hash on load
    useEffect(() => {
        const wf = decodeWorkflowFromHash();
        if (wf && wf.nodes) {
            if (confirm("A shared workflow was found in the URL. Import it?")) {
                loadProject(JSON.stringify(wf));
                setShowLanding(false);
                setCurrentView("canvas");
                addToast("Workflow imported from shared link!", "success");
            }
        }
    }, []);
    const onDragStart = (e, def) => {
        e.dataTransfer.setData("application/openflow-node", JSON.stringify(def));
        e.dataTransfer.effectAllowed = "move";
    };
    const onDrop = useCallback((e) => {
        e.preventDefault();
        // Handle file drops (images)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result;
                    const def = NODE_DEFS.find(d => d.id === "image.input");
                    if (def) {
                        pushUndo();
                        idCounter.current += 1;
                        const nodeId = `${def.id}_${idCounter.current}`;
                        const bounds = e.target.closest(".react-flow")?.getBoundingClientRect();
                        const x = bounds ? e.clientX - bounds.left : e.clientX;
                        const y = bounds ? e.clientY - bounds.top : e.clientY;
                        const newNode = {
                            id: nodeId, type: "flowNode", position: { x, y },
                            data: {
                                def, values: { image_url: dataUrl },
                                onChange: (key, val) => updateNodeValue(nodeId, key, val),
                                onRun: () => runSingleNodeRef.current(nodeId),
                                onDelete: () => setNodes((nds) => nds.filter((n) => n.id !== nodeId)),
                                onPreview: (url, type) => setPreviewModal({ url, type }),
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
        if (!data)
            return;
        const def = JSON.parse(data);
        idCounter.current += 1;
        const nodeId = `${def.id}_${idCounter.current}`;
        const defaults = {};
        def.inputs.forEach((inp) => { if (inp.default !== undefined)
            defaults[inp.name] = inp.default; });
        const bounds = e.target.closest(".react-flow")?.getBoundingClientRect();
        const x = bounds ? e.clientX - bounds.left : e.clientX;
        const y = bounds ? e.clientY - bounds.top : e.clientY;
        pushUndo();
        const newNode = {
            id: nodeId, type: "flowNode", position: { x, y },
            data: {
                def, values: defaults,
                onChange: (key, val) => updateNodeValue(nodeId, key, val),
                onRun: () => runSingleNodeRef.current(nodeId),
                onDelete: () => { pushUndo(); setNodes((nds) => nds.filter((n) => n.id !== nodeId)); },
                onPreview: (url, type) => setPreviewModal({ url, type }),
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes, updateNodeValue, pushUndo]);
    const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
    const [activePanel, setActivePanel] = useState(null);
    const categories = Object.keys(grouped);
    const [sceneStory, setSceneStory] = useState("");
    const [sceneLoading, setSceneLoading] = useState(false);
    const [projectName, setProjectName] = useState("Untitled");
    const [projectsList, setProjectsList] = useState([]);
    const [authToken, setAuthToken] = useState(() => localStorage.getItem("openflow_token") || "");
    const [authEmail, setAuthEmail] = useState("");
    const [authPass, setAuthPass] = useState("");
    const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:8000" : "/api";
    const apiHeaders = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` });
    const loadProjects = useCallback(async () => {
        if (!authToken)
            return;
        try {
            const res = await fetch(`${BACKEND_URL}/projects`, { headers: apiHeaders() });
            if (res.ok)
                setProjectsList(await res.json());
        }
        catch { }
    }, [authToken]);
    const handleAuth = async (mode) => {
        try {
            const res = await fetch(`${BACKEND_URL}/auth/${mode}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: authEmail, password: authPass }),
            });
            const data = await res.json();
            if (data.token) {
                setAuthToken(data.token);
                localStorage.setItem("openflow_token", data.token);
            }
            else
                alert(data.detail || "Auth failed");
        }
        catch {
            alert("Backend not reachable");
        }
    };
    const saveProject = async () => {
        if (!authToken) {
            alert("Login first");
            return;
        }
        const workflow = JSON.stringify({ nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, defId: n.data.def.id, values: n.data.values })), edges });
        try {
            await fetch(`${BACKEND_URL}/projects`, { method: "POST", headers: apiHeaders(), body: JSON.stringify({ name: projectName, workflow_json: workflow }) });
            loadProjects();
        }
        catch {
            alert("Save failed");
        }
    };
    const loadProject = (workflowJson) => {
        try {
            const wf = JSON.parse(workflowJson);
            if (!wf.nodes)
                return;
            const newNodes = wf.nodes.map((n) => {
                const def = NODE_DEFS.find(d => d.id === n.defId);
                if (!def)
                    return null;
                return {
                    id: n.id, type: "flowNode", position: n.position,
                    data: {
                        def, values: n.values || {},
                        onChange: (key, val) => updateNodeValue(n.id, key, val),
                        onRun: () => runSingleNodeRef.current(n.id),
                        onDelete: () => setNodes((nds) => nds.filter((nd) => nd.id !== n.id)),
                    },
                };
            }).filter(Boolean);
            setNodes(newNodes);
            setEdges(wf.edges || []);
        }
        catch {
            alert("Invalid workflow");
        }
    };
    const generateScenes = async () => {
        if (!sceneStory.trim())
            return;
        setSceneLoading(true);
        try {
            const sentences = sceneStory.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 5);
            const scenePrompts = sentences.length >= 2 ? sentences.map(s => s.trim()) : [
                `Scene 1: ${sceneStory.slice(0, 80)}`,
                `Scene 2: ${sceneStory.slice(80, 160) || sceneStory.slice(0, 80)} from a different angle`,
                `Scene 3: Final moment of "${sceneStory.slice(0, 60)}"`,
            ];
            const imgDef = NODE_DEFS.find(d => d.id === "image.text_to_image");
            const newNodes = [];
            const newEdges = [];
            scenePrompts.forEach((prompt, i) => {
                idCounter.current += 1;
                const nodeId = `scene_${idCounter.current}`;
                const defaults = {};
                imgDef.inputs.forEach(inp => { if (inp.default !== undefined)
                    defaults[inp.name] = inp.default; });
                defaults.prompt = `Cinematic film still: ${prompt}`;
                defaults.model = "flux-pro-1.1";
                newNodes.push({
                    id: nodeId, type: "flowNode", position: { x: 200 + i * 380, y: 150 },
                    data: {
                        def: imgDef, values: defaults,
                        onChange: (key, val) => updateNodeValue(nodeId, key, val),
                        onRun: () => runSingleNodeRef.current(nodeId),
                        onDelete: () => setNodes((nds) => nds.filter((n) => n.id !== nodeId)),
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
        }
        catch {
            alert("Scene generation failed");
        }
        setSceneLoading(false);
    };
    const loadTemplate = useCallback((template) => {
        const newNodes = [];
        const nodeIds = [];
        template.nodes.forEach((tn) => {
            idCounter.current += 1;
            const nodeId = `template_${idCounter.current}`;
            nodeIds.push(nodeId);
            const def = NODE_DEFS.find(d => d.id === tn.defId);
            if (!def)
                return;
            const defaults = {};
            def.inputs.forEach(inp => { if (inp.default !== undefined)
                defaults[inp.name] = inp.default; });
            if (tn.values)
                Object.assign(defaults, tn.values);
            newNodes.push({
                id: nodeId, type: "flowNode", position: { x: tn.x, y: tn.y },
                data: {
                    def, values: defaults,
                    onChange: (key, val) => updateNodeValue(nodeId, key, val),
                    onRun: () => runSingleNodeRef.current(nodeId),
                    onDelete: () => setNodes((nds) => nds.filter((n) => n.id !== nodeId)),
                },
            });
        });
        const newEdges = template.edges.map((e, idx) => ({
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
        return _jsx(LandingPage, { onEnter: () => setShowLanding(false) });
    }
    return (_jsxs("div", { style: { display: "flex", height: "100vh", background: "#f0f0f2", color: "#1a1a1a", fontFamily: "'SF Pro Display', 'Inter', -apple-system, 'Helvetica Neue', sans-serif" }, children: [_jsxs("nav", { style: { width: 56, background: "#0e0e10", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, paddingBottom: 16, flexShrink: 0, zIndex: 20 }, children: [_jsx("div", { style: { width: 36, height: 36, borderRadius: "50%", background: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0e0e10", marginBottom: 24, cursor: "pointer", letterSpacing: "-0.5px" }, title: "OpenClaw", onClick: () => { setActivePanel(null); setCurrentView("dashboard"); }, children: "OF" }), _jsx("button", { title: "Dashboard", onClick: () => { setCurrentView("dashboard"); setActivePanel(null); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: currentView === "dashboard" && !activePanel ? "#1e1e22" : "transparent", color: currentView === "dashboard" && !activePanel ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, dangerouslySetInnerHTML: { __html: SVG_ICONS.dashboard } }), _jsx("button", { title: "Storyboard", onClick: () => { setCurrentView("storyboard"); setActivePanel(null); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: currentView === "storyboard" ? "#1e1e22" : "transparent", color: currentView === "storyboard" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, dangerouslySetInnerHTML: { __html: SVG_ICONS.storyboard } }), _jsx("button", { title: "Timeline", onClick: () => { setCurrentView("timeline"); setActivePanel(null); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: currentView === "timeline" ? "#1e1e22" : "transparent", color: currentView === "timeline" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, dangerouslySetInnerHTML: { __html: SVG_ICONS.timeline } }), categories.map((cat) => (_jsx("button", { title: CATEGORIES[cat] || cat, onClick: () => { setCurrentView("canvas"); setActivePanel(activePanel === cat ? null : cat); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === cat ? "#1e1e22" : "transparent", color: activePanel === cat ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, transition: "all 0.15s" }, onMouseOver: (e) => { if (activePanel !== cat)
                            e.currentTarget.style.color = "#9ca3af"; }, onMouseOut: (e) => { if (activePanel !== cat)
                            e.currentTarget.style.color = "#6b6b75"; }, dangerouslySetInnerHTML: { __html: SVG_ICONS[cat] || "" } }, cat))), _jsx("button", { title: "Model Manager", onClick: () => { setActivePanel(activePanel === "models" ? null : "models"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "models" ? "#1e1e22" : "transparent", color: activePanel === "models" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }), _jsx("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }), _jsx("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" })] }) }), _jsx("button", { title: "Workflow Templates", onClick: () => { setActivePanel(activePanel === "workflows" ? null : "workflows"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "workflows" ? "#1e1e22" : "transparent", color: activePanel === "workflows" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "11", width: "18", height: "10", rx: "2" }), _jsx("circle", { cx: "9", cy: "16", r: "1" }), _jsx("circle", { cx: "15", cy: "16", r: "1" }), _jsx("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }), _jsx("line", { x1: "12", y1: "4", x2: "12", y2: "2" }), _jsx("line", { x1: "10", y1: "2", x2: "14", y2: "2" })] }) }), _jsx("div", { style: { flex: 1 } }), _jsx("button", { title: "Asset Manager", onClick: () => { setActivePanel(activePanel === "assets" ? null : "assets"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "assets" ? "#1e1e22" : "transparent", color: activePanel === "assets" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, dangerouslySetInnerHTML: { __html: SVG_ICONS.assets } }), _jsx("button", { title: "Compare Models", onClick: () => { setActivePanel(activePanel === "compare" ? null : "compare"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "compare" ? "#1e1e22" : "transparent", color: activePanel === "compare" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, fontSize: 18 }, children: "\u2696\uFE0F" }), _jsx("button", { title: "AI Chat", onClick: () => { setActivePanel(activePanel === "chat" ? null : "chat"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "chat" ? "#1e1e22" : "transparent", color: activePanel === "chat" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, dangerouslySetInnerHTML: { __html: SVG_ICONS.chat } }), _jsx("button", { title: "Generation History", onClick: () => { setActivePanel(activePanel === "history" ? null : "history"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "history" ? "#1e1e22" : "transparent", color: activePanel === "history" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("polyline", { points: "12 6 12 12 16 14" })] }) }), _jsx("button", { title: "Scene Builder", onClick: () => { setCurrentView("canvas"); setActivePanel(activePanel === "scenes" ? null : "scenes"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "scenes" ? "#1e1e22" : "transparent", color: activePanel === "scenes" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "2", y: "2", width: "20", height: "20", rx: "2" }), _jsx("line", { x1: "2", y1: "7", x2: "22", y2: "7" }), _jsx("line", { x1: "7", y1: "2", x2: "7", y2: "7" })] }) }), _jsx("button", { title: "Projects", onClick: () => { setActivePanel(activePanel === "projects" ? null : "projects"); loadProjects(); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "projects" ? "#1e1e22" : "transparent", color: activePanel === "projects" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) }) }), _jsx("button", { title: "Prompt Library", onClick: () => { setActivePanel(activePanel === "prompts" ? null : "prompts"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "prompts" ? "#1e1e22" : "transparent", color: activePanel === "prompts" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }), _jsx("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })] }) }), _jsx("button", { title: "Batch Processing", onClick: () => { setActivePanel(activePanel === "batch" ? null : "batch"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "batch" ? "#1e1e22" : "transparent", color: activePanel === "batch" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7" })] }) }), _jsx("button", { title: "My Presets", onClick: () => { setActivePanel(activePanel === "presets" ? null : "presets"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "presets" ? "#1e1e22" : "transparent", color: activePanel === "presets" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }) }) }), _jsx("button", { title: "Agent API", onClick: () => { setActivePanel(activePanel === "api" ? null : "api"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "api" ? "#1e1e22" : "transparent", color: activePanel === "api" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), _jsx("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })] }) }), _jsx("button", { title: "Marketplace", onClick: () => { setActivePanel(activePanel === "marketplace" ? null : "marketplace"); }, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "marketplace" ? "#1e1e22" : "transparent", color: activePanel === "marketplace" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" }), _jsx("line", { x1: "3", x2: "21", y1: "6", y2: "6" }), _jsx("path", { d: "M16 10a4 4 0 0 1-8 0" })] }) }), _jsx("button", { title: "Settings", onClick: () => setActivePanel(activePanel === "settings" ? null : "settings"), style: { width: 38, height: 38, borderRadius: 10, border: "none", background: activePanel === "settings" ? "#1e1e22" : "transparent", color: activePanel === "settings" ? "#c026d3" : "#6b6b75", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }, dangerouslySetInnerHTML: { __html: SVG_ICONS.settings } }), _jsx("button", { title: "Run workflow", onClick: handleRun, disabled: isRunning || nodes.length === 0, style: { width: 38, height: 38, borderRadius: 10, border: "none", background: isRunning ? "#2a2a30" : "#c026d3", color: isRunning ? "#6b6b75" : "#0e0e10", cursor: isRunning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, dangerouslySetInnerHTML: { __html: SVG_ICONS.run } })] }), activePanel && (_jsx("aside", { "data-onboarding": "toolbar", style: { width: 280, background: "#ffffff", borderRight: "1px solid #ebebee", overflowY: "auto", flexShrink: 0, zIndex: 15, boxShadow: "4px 0 16px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", animation: "slideFlyout 0.2s ease-out" }, children: activePanel === "api" ? (_jsx(APIDocsPanel, {})) : activePanel === "prompts" ? (_jsx(PromptLibraryPanel, { onUsePrompt: () => { addToast("Prompt copied!", "success"); }, onCreateNode: (p) => {
                        const def = NODE_DEFS.find(d => d.id === "image.text_to_image");
                        if (def) {
                            addNodeWithHandler(def, { prompt: p });
                            setActivePanel(null);
                            setCurrentView("canvas");
                        }
                    } })) : activePanel === "batch" ? (_jsx(BatchPanel, { onRunBatch: runBatch, isRunning: batchRunning })) : activePanel === "presets" ? (_jsx(PresetsPanel, { onCreateNode: (defId, values) => {
                        const def = NODE_DEFS.find(d => d.id === defId);
                        if (def) {
                            addNodeWithHandler(def, values);
                            setActivePanel(null);
                            setCurrentView("canvas");
                        }
                    } })) : activePanel === "customnodes" ? (_jsx(CustomNodeBuilder, { onSave: (customNode) => {
                        addToast(`Custom node "${customNode.name}" created!`, "success");
                    } })) : activePanel === "marketplace" ? (_jsx(MarketplacePanel, { onUseTemplate: (template) => {
                        // Convert marketplace template to workflow nodes
                        const newNodes = template.nodes.map((n) => {
                            const def = NODE_DEFS.find(d => d.id === n.defId);
                            if (!def)
                                return null;
                            idCounter.current++;
                            const nodeId = `${def.id}_${idCounter.current}`;
                            const defaults = {};
                            def.inputs.forEach((inp) => { if (inp.default !== undefined)
                                defaults[inp.name] = inp.default; });
                            return {
                                id: nodeId, type: "flowNode", position: { x: n.x + 100, y: n.y + 100 },
                                data: { def, values: { ...defaults, ...n.values },
                                    onChange: (key, val) => updateNodeValue(nodeId, key, val),
                                    onRun: () => runSingleNodeRef.current(nodeId),
                                    onDelete: () => { pushUndo(); setNodes((nds) => nds.filter((nd) => nd.id !== nodeId)); },
                                    onPreview: (url, type) => setPreviewModal({ url, type }),
                                },
                            };
                        }).filter(Boolean);
                        pushUndo();
                        setNodes((nds) => [...nds, ...newNodes]);
                        setActivePanel(null);
                        setCurrentView("canvas");
                        addToast(`Loaded "${template.title}" — ${template.nodeCount} nodes`, "success");
                    } })) : activePanel === "compare" ? (_jsx(ModelComparisonPanel, {})) : activePanel === "models" ? (_jsx(ModelManagerPanel, { onCreateNode: (defId, modelKey) => {
                        const def = NODE_DEFS.find(d => d.id === defId);
                        if (def) {
                            addNodeWithHandler(def, { model: modelKey });
                            setActivePanel(null);
                            setCurrentView("canvas");
                        }
                    } })) : activePanel === "workflows" ? (_jsx(WorkflowTemplatesPanel, { onLoadPipeline: (pipeline) => { loadTemplate(pipeline); setActivePanel(null); } })) : activePanel === "assets" ? (_jsx(AssetManagerPanel, { assets: assets })) : activePanel === "chat" ? (_jsx(ChatPanel, {})) : activePanel === "scenes" ? (_jsxs("div", { style: { padding: 20 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }, children: "\uD83C\uDFAC Scene Builder" }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }, children: "Describe your story" }), _jsx("textarea", { value: sceneStory, onChange: (e) => setSceneStory(e.target.value), placeholder: "A knight rides through a misty forest, discovers a glowing crystal cave, and meets an ancient dragon...", rows: 6, style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, color: "#1a1a1a", fontSize: 12, padding: "10px 12px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" } }), _jsx("button", { onClick: generateScenes, disabled: sceneLoading || !sceneStory.trim(), style: { width: "100%", marginTop: 10, padding: "10px", background: sceneLoading ? "#e5e7eb" : "#c026d3", color: sceneLoading ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: sceneLoading ? "not-allowed" : "pointer" }, children: sceneLoading ? "Generating..." : "Generate Scenes ✦" }), _jsx("div", { style: { fontSize: 10, color: "#9ca3af", marginTop: 8 }, children: "Splits your story into 3-5 scenes as connected image nodes." })] })) : activePanel === "projects" ? (_jsxs("div", { style: { padding: 20 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }, children: "\uD83D\uDCC1 Projects" }), !authToken ? (_jsxs("div", { children: [_jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }, children: "LOGIN / SIGNUP" }), _jsx("input", { placeholder: "Email", value: authEmail, onChange: e => setAuthEmail(e.target.value), style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", marginBottom: 6, boxSizing: "border-box" } }), _jsx("input", { placeholder: "Password", type: "password", value: authPass, onChange: e => setAuthPass(e.target.value), style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", marginBottom: 8, boxSizing: "border-box" } }), _jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx("button", { onClick: () => handleAuth("login"), style: { flex: 1, padding: "8px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }, children: "Login" }), _jsx("button", { onClick: () => handleAuth("signup"), style: { flex: 1, padding: "8px", background: "#f5f5f7", color: "#1a1a1a", border: "1px solid #ebebee", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }, children: "Sign Up" })] })] })) : (_jsxs("div", { children: [_jsxs("div", { style: { display: "flex", gap: 6, marginBottom: 12 }, children: [_jsx("input", { placeholder: "Project name", value: projectName, onChange: e => setProjectName(e.target.value), style: { flex: 1, background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none" } }), _jsx("button", { onClick: saveProject, style: { padding: "8px 12px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }, children: "Save" })] }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }, children: "SAVED PROJECTS" }), projectsList.length === 0 && _jsx("div", { style: { fontSize: 11, color: "#9ca3af" }, children: "No projects yet" }), projectsList.map(p => (_jsxs("div", { onClick: () => { loadProject(p.workflow_json); setCurrentView("canvas"); }, style: { padding: "8px 10px", background: "#f5f5f7", borderRadius: 8, marginBottom: 4, cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#1a1a1a" }, onMouseOver: e => { e.currentTarget.style.background = "#e8e8eb"; }, onMouseOut: e => { e.currentTarget.style.background = "#f5f5f7"; }, children: [p.name, _jsx("div", { style: { fontSize: 9, color: "#9ca3af", marginTop: 2 }, children: p.updated_at?.slice(0, 16) }), _jsx(WorkflowStatsInline, { name: p.name })] }, p.id))), _jsx("button", { onClick: () => { setAuthToken(""); localStorage.removeItem("openflow_token"); }, style: { marginTop: 12, padding: "6px", background: "transparent", border: "none", fontSize: 10, color: "#9ca3af", cursor: "pointer" }, children: "Logout" })] }))] })) : activePanel === "history" ? (_jsx(HistoryPanel, { onRerun: (record) => {
                        const def = NODE_DEFS.find(d => d.id === "image.text_to_image");
                        if (def) {
                            addNodeWithHandler(def, { model: record.model, prompt: record.prompt, ...record.params });
                            setActivePanel(null);
                            setCurrentView("canvas");
                        }
                    } })) : activePanel === "settings" ? (_jsxs("div", { style: { padding: 20, overflow: "auto" }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }, children: "Settings" }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }, children: "API Keys" }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 4 }, children: "fal.ai (required)" }), _jsx("input", { type: "password", value: falApiKey, onChange: (e) => { setFalApiKey(e.target.value); localStorage.setItem("openflow_fal_key", e.target.value); }, onKeyDown: stopKeys, placeholder: "fal-xxxxxxxx", style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, color: "#1a1a1a", fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box", marginBottom: 6 } }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 4 }, children: "OpenAI (optional)" }), _jsx("input", { type: "password", value: localStorage.getItem("openflow_openai_key") || "", onChange: (e) => localStorage.setItem("openflow_openai_key", e.target.value), onKeyDown: stopKeys, placeholder: "sk-...", style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, color: "#1a1a1a", fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box", marginBottom: 6 } }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 4 }, children: "Replicate (optional)" }), _jsx("input", { type: "password", value: localStorage.getItem("openflow_replicate_key") || "", onChange: (e) => localStorage.setItem("openflow_replicate_key", e.target.value), onKeyDown: stopKeys, placeholder: "r8_...", style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, color: "#1a1a1a", fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box" } }), _jsxs("div", { style: { fontSize: 10, color: "#9ca3af", marginTop: 6, marginBottom: 16 }, children: ["Get keys at ", _jsx("a", { href: "https://fal.ai/dashboard/keys", target: "_blank", rel: "noopener", style: { color: "#1a1a1a", fontWeight: 600, textDecoration: "none" }, children: "fal.ai" })] }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }, children: "Generation Defaults" }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 4 }, children: "Default image size" }), _jsxs("select", { value: localStorage.getItem("openflow_default_size") || "1024", onChange: (e) => localStorage.setItem("openflow_default_size", e.target.value), style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", cursor: "pointer", marginBottom: 6, boxSizing: "border-box" }, children: [_jsx("option", { value: "512", children: "512\u00D7512" }), _jsx("option", { value: "768", children: "768\u00D7768" }), _jsx("option", { value: "1024", children: "1024\u00D71024" }), _jsx("option", { value: "1280", children: "1280\u00D71280" })] }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 4 }, children: "Default model" }), _jsxs("select", { value: localStorage.getItem("openflow_default_model") || "flux-2-pro", onChange: (e) => localStorage.setItem("openflow_default_model", e.target.value), style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", cursor: "pointer", marginBottom: 6, boxSizing: "border-box" }, children: [_jsx("option", { value: "flux-fast", children: "flux-fast (Fast)" }), _jsx("option", { value: "flux-2-pro", children: "flux-2-pro (Balanced)" }), _jsx("option", { value: "flux-pro-1.1-ultra", children: "flux-pro-1.1-ultra (Quality)" })] }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 4 }, children: "Quality preset" }), _jsx("div", { style: { display: "flex", gap: 4, marginBottom: 16 }, children: ["fast", "balanced", "quality"].map(p => (_jsx("button", { onClick: () => localStorage.setItem("openflow_quality_preset", p), style: { flex: 1, padding: "6px", background: (localStorage.getItem("openflow_quality_preset") || "balanced") === p ? "#c026d3" : "#f5f5f7", color: (localStorage.getItem("openflow_quality_preset") || "balanced") === p ? "#fff" : "#6b7280", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }, children: p }, p))) }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }, children: "Appearance" }), _jsx("button", { onClick: () => setDarkMode(!darkMode), style: { width: "100%", padding: "8px 12px", background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#1a1a1a", textAlign: "left", marginBottom: 12 }, children: darkMode ? "🌙 Dark Mode ON" : "☀️ Light Mode" }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }, children: "Workflow" }), _jsx("button", { onClick: exportWorkflow, style: { width: "100%", padding: "8px 12px", background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#1a1a1a", textAlign: "left", marginBottom: 6 }, children: "\uD83D\uDCE4 Export Workflow JSON" }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 12, marginBottom: 6 }, children: "Training Data" }), _jsxs("div", { style: { fontSize: 11, color: "#6b7280", marginBottom: 6 }, children: [getTrainingDataCount(), " records collected"] }), _jsx("button", { onClick: () => { exportTrainingData(); addToast("Training data exported!", "success"); }, style: { width: "100%", padding: "8px 12px", background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#1a1a1a", textAlign: "left" }, children: "\uD83D\uDCCA Export Training Data (JSONL)" }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 16, marginBottom: 6 }, children: "Custom Nodes" }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 6 }, children: "Connect any REST API as a workflow node" }), _jsx("button", { onClick: () => setActivePanel("customnodes"), style: { width: "100%", padding: "8px 12px", background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#1a1a1a", textAlign: "left", marginBottom: 6 }, children: "\uD83D\uDD27 Create Custom Node" }), _jsxs("div", { style: { fontSize: 10, color: "#9ca3af", marginBottom: 6 }, children: [loadCustomNodes().length, " custom nodes created"] }), _jsx(UsageQuotasSection, {}), _jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 16, marginBottom: 6 }, children: "About" }), _jsxs("div", { style: { fontSize: 11, color: "#6b7280", lineHeight: 1.8 }, children: ["OpenFlow v13.0 \u2014 Sprint 13", _jsx("br", {}), _jsx("a", { href: "https://github.com/nikolateslasagent/openflow", target: "_blank", rel: "noopener", style: { color: "#c026d3", textDecoration: "none" }, children: "GitHub" }), " \u00B7 ", _jsx("a", { href: "https://openflow-docs.vercel.app", target: "_blank", rel: "noopener", style: { color: "#c026d3", textDecoration: "none" }, children: "Docs" })] }), _jsxs("div", { style: { fontSize: 10, color: "#c4c4c8", marginTop: 16 }, children: [nodes.length, " nodes \u00B7 ", edges.length, " connections"] }), _jsx("div", { style: { fontSize: 9, color: "#d1d5db", marginTop: 4 }, children: "Shortcuts: Space=Run, Del=Delete, \u2318S=Save, \u2318D=Duplicate" })] })) : (_jsxs("div", { style: { padding: "16px 0" }, children: [_jsx("div", { style: { padding: "0 16px 10px", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }, children: CATEGORIES[activePanel] || activePanel }), (grouped[activePanel] || []).map((def) => {
                            const modelInput = def.inputs.find((inp) => inp.name === "model");
                            const models = modelInput?.options || [];
                            return (_jsxs("div", { children: [_jsxs("div", { draggable: true, onDragStart: (e) => onDragStart(e, def), onClick: () => { addNodeWithHandler(def); setActivePanel(null); setCurrentView("canvas"); }, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", cursor: "grab", transition: "background 0.12s" }, onMouseOver: (e) => { e.currentTarget.style.background = "#f5f5f7"; }, onMouseOut: (e) => { e.currentTarget.style.background = "transparent"; }, children: [_jsx("span", { style: { color: "#6b7280", display: "flex" }, dangerouslySetInnerHTML: { __html: NODE_ICONS[def.id] || "" } }), _jsx("div", { style: { fontSize: 13, fontWeight: 500, color: "#1a1a1a" }, children: def.name })] }), models.length > 0 && (_jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "4px 12px 12px" }, children: models.map((m) => (_jsx("button", { onClick: () => { addNodeWithHandler(def, { model: m }); setActivePanel(null); setCurrentView("canvas"); }, style: { background: "#f5f5f7", border: "1px solid #ebebee", borderRadius: 8, padding: "8px 6px", cursor: "pointer", fontSize: 10, fontWeight: 500, color: "#1a1a1a", textAlign: "center", transition: "all 0.12s", lineHeight: 1.3 }, onMouseOver: (e) => { e.currentTarget.style.background = "#e8e8eb"; e.currentTarget.style.borderColor = "#d1d5db"; }, onMouseOut: (e) => { e.currentTarget.style.background = "#f5f5f7"; e.currentTarget.style.borderColor = "#ebebee"; }, children: m }, m))) }))] }, def.id));
                        })] })) })), currentView === "dashboard" ? (_jsx(Dashboard, { onNewProject: () => { setNodes([]); setEdges([]); setCurrentView("canvas"); }, onOpenCanvas: () => setCurrentView("canvas"), onLoadTemplate: loadTemplate, assets: assets })) : (_jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column" }, onDrop: onDrop, onDragOver: onDragOver, children: [executionProgress && (_jsx("div", { style: { background: "#1a1a1f", borderBottom: "1px solid #2a2a30", padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }, children: _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }, children: [_jsxs("span", { style: { fontSize: 12, fontWeight: 600, color: "#f59e0b" }, children: ["\u23F3 Running ", executionProgress.current, "/", executionProgress.total, " nodes..."] }), _jsx("button", { onClick: () => { cancelRef.current = true; }, style: { padding: "4px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }, children: "Cancel" })] }), _jsx("div", { style: { width: "100%", height: 4, background: "#2a2a30", borderRadius: 2, overflow: "hidden" }, children: _jsx("div", { style: { width: `${(executionProgress.current / executionProgress.total) * 100}%`, height: "100%", background: "linear-gradient(90deg, #c026d3, #f59e0b)", borderRadius: 2, transition: "width 0.3s" } }) })] }) })), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#0e0e10", borderBottom: "1px solid #1e1e22", flexShrink: 0 }, children: [["dashboard", "canvas", "storyboard", "timeline", "assets"].map((view) => (_jsx("button", { onClick: () => setCurrentView(view), style: {
                                    padding: "8px 16px", borderRadius: 8, border: "none",
                                    background: currentView === view ? "#c026d3" : "#141416",
                                    color: currentView === view ? "#fff" : "#9ca3af",
                                    fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                                }, children: view }, view))), _jsx("div", { style: { width: 1, height: 24, background: "#2a2a30", margin: "0 8px" } }), [
                                { label: "New Image", icon: "◫", defId: "image.text_to_image" },
                                { label: "New Video", icon: "▶", defId: "video.text_to_video" },
                                { label: "Img2Vid", icon: "🎥", defId: "video.img_to_video" },
                                { label: "Upscale", icon: "🔍", defId: "transform.upscale" },
                            ].map((btn) => (_jsxs("button", { onClick: () => {
                                    const def = NODE_DEFS.find(d => d.id === btn.defId);
                                    if (def)
                                        addNodeWithHandler(def);
                                }, style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }, onMouseOver: (e) => { e.currentTarget.style.borderColor = "#444"; }, onMouseOut: (e) => { e.currentTarget.style.borderColor = "#2a2a30"; }, children: [_jsx("span", { children: btn.icon }), " ", btn.label] }, btn.label))), _jsx("div", { style: { flex: 1 } }), nodes.filter(n => n.selected).length > 1 && (_jsxs(_Fragment, { children: [_jsxs("span", { style: { fontSize: 11, color: "#9ca3af" }, children: [nodes.filter(n => n.selected).length, " selected"] }), _jsx("button", { onClick: () => {
                                            const selected = nodes.filter(n => n.selected);
                                            (async () => {
                                                for (const n of selected) {
                                                    await runSingleNode(n.id);
                                                }
                                                addToast(`Ran ${selected.length} nodes`, "success");
                                            })();
                                        }, style: { padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#22c55e", fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "\u25B6 Run Selected" }), _jsx("button", { onClick: () => { setNodes(nds => nds.filter(n => !n.selected)); addToast("Deleted selected", "success"); }, style: { padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "\uD83D\uDDD1 Delete" })] })), _jsx("button", { onClick: autoLayout, title: "Auto-layout", style: { padding: "8px 10px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, cursor: "pointer" }, children: "\u229E" }), _jsx("button", { onClick: () => setSnapToGrid(s => !s), title: "Snap to grid", style: { padding: "8px 10px", borderRadius: 8, border: "1px solid #2a2a30", background: snapToGrid ? "#2a2a30" : "#141416", color: snapToGrid ? "#c026d3" : "#9ca3af", fontSize: 12, cursor: "pointer" }, children: "\u22A1" }), _jsx("button", { onClick: () => undo(), disabled: undoStack.length === 0, title: "Undo (Ctrl+Z)", style: { padding: "8px 10px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: undoStack.length > 0 ? "#9ca3af" : "#4a4a50", fontSize: 12, cursor: undoStack.length > 0 ? "pointer" : "not-allowed" }, children: "\u21A9" }), _jsx("button", { onClick: () => redo(), disabled: redoStack.length === 0, title: "Redo (Ctrl+Shift+Z)", style: { padding: "8px 10px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: redoStack.length > 0 ? "#9ca3af" : "#4a4a50", fontSize: 12, cursor: redoStack.length > 0 ? "pointer" : "not-allowed" }, children: "\u21AA" }), _jsx("button", { onClick: () => setShowGallery(true), title: "Gallery view", style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "\uD83D\uDDBC\uFE0F Gallery" }), _jsx("button", { onClick: () => {
                                    const workflow = { nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, defId: n.data.def.id, values: n.data.values, comment: nodeComments[n.id] })), edges };
                                    const url = encodeWorkflowToUrl(workflow);
                                    navigator.clipboard.writeText(url).then(() => addToast("Share link copied to clipboard!", "success")).catch(() => { prompt("Copy this link:", url); });
                                }, title: "Share workflow", style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "\uD83D\uDD17 Share" }), _jsx("button", { onClick: () => {
                                    const collabUrl = `${window.location.origin}${window.location.pathname}?collab=${Date.now().toString(36)}`;
                                    navigator.clipboard.writeText(collabUrl).then(() => addToast("Collaboration link copied!", "success")).catch(() => prompt("Copy this link:", collabUrl));
                                }, title: "Invite collaborator", style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "\uD83D\uDC65 Invite" }), _jsx(NotificationBell, { notifications: notifications, unreadCount: unreadCount, onOpen: () => setShowNotifPanel(!showNotifPanel) }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }, children: [_jsx("div", { style: { fontSize: 10, color: "#6b6b75" }, children: "Last edited just now" }), _jsx("div", { style: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #c026d3, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }, children: "Y" })] }), _jsx("button", { onClick: () => setShowTutorial(true), title: "Help / Tutorial", style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, cursor: "pointer" }, children: "\u2753" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx("button", { onClick: () => setShowExportMenu(v => !v), title: "Export", style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "\uD83D\uDCE4 Export \u25BE" }), showExportMenu && (_jsxs("div", { style: { position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#1a1a1e", border: "1px solid #2a2a30", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 200, minWidth: 180, padding: 4 }, children: [_jsx("button", { onClick: () => { exportWorkflow(); setShowExportMenu(false); }, style: { width: "100%", padding: "8px 12px", background: "none", border: "none", fontSize: 12, cursor: "pointer", textAlign: "left", borderRadius: 6, color: "#e0e0e5" }, onMouseOver: e => e.currentTarget.style.background = "#2a2a30", onMouseOut: e => e.currentTarget.style.background = "none", children: "\uD83D\uDCCB JSON Workflow" }), _jsx("button", { onClick: () => {
                                                    const el = document.querySelector(".react-flow");
                                                    if (el) {
                                                        // @ts-expect-error dynamic CDN import
                                                        import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm").then((mod) => {
                                                            mod.default(el).then((c) => { const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "openflow-canvas.png"; a.click(); });
                                                        }).catch(() => { exportWorkflow(); });
                                                    }
                                                    setShowExportMenu(false);
                                                }, style: { width: "100%", padding: "8px 12px", background: "none", border: "none", fontSize: 12, cursor: "pointer", textAlign: "left", borderRadius: 6, color: "#e0e0e5" }, onMouseOver: e => e.currentTarget.style.background = "#2a2a30", onMouseOut: e => e.currentTarget.style.background = "none", children: "\uD83D\uDDBC\uFE0F PNG Screenshot" }), _jsx("button", { onClick: () => {
                                                    const storyPages = nodes.map(n => {
                                                        const def = n.data.def;
                                                        const vals = n.data.values;
                                                        return { type: def.id, prompt: vals.prompt || "", model: vals.model || "", output: n.data.output };
                                                    });
                                                    const win = window.open("", "_blank");
                                                    if (win) {
                                                        win.document.write("<html><head><title>OpenFlow Storyboard</title><style>body{font-family:sans-serif;margin:0}@media print{.page{page-break-after:always}}.page{padding:40px;max-width:800px;margin:0 auto;border-bottom:1px solid #eee}img,video{max-width:100%;max-height:400px;border-radius:8px}</style></head><body>");
                                                        storyPages.forEach((p, i) => {
                                                            win.document.write(`<div class="page"><h2>Scene ${i + 1}: ${p.type}</h2><p><b>Prompt:</b> ${p.prompt || "N/A"}</p><p><b>Model:</b> ${p.model || "N/A"}</p>`);
                                                            if (p.output)
                                                                win.document.write(`<img src="${p.output}" />`);
                                                            win.document.write("</div>");
                                                        });
                                                        win.document.write("<script>setTimeout(()=>window.print(),500)<\/script></body></html>");
                                                        win.document.close();
                                                    }
                                                    setShowExportMenu(false);
                                                }, style: { width: "100%", padding: "8px 12px", background: "none", border: "none", fontSize: 12, cursor: "pointer", textAlign: "left", borderRadius: 6, color: "#e0e0e5" }, onMouseOver: e => e.currentTarget.style.background = "#2a2a30", onMouseOut: e => e.currentTarget.style.background = "none", children: "\uD83D\uDCC4 PDF Storyboard" })] }))] }), _jsx("button", { onClick: handleRun, disabled: isRunning || nodes.length === 0, title: "Run All (topological order)", style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: isRunning ? "#2a2a30" : "#c026d3", color: isRunning ? "#6b6b75" : "#fff", fontSize: 12, fontWeight: 700, cursor: isRunning ? "not-allowed" : "pointer" }, children: isRunning ? "⏳ Running..." : "▶ Run All" })] }), currentView === "timeline" ? (_jsx(TimelineEditor, { assets: assets, onExportVideo: (clips) => {
                            if (clips.length === 0)
                                return;
                            // MVP: open all video URLs in sequence / generate download links
                            const urls = clips.filter(c => c.url).map(c => c.url);
                            const win = window.open("", "_blank");
                            if (win) {
                                win.document.write("<html><head><title>Export Preview</title><style>body{background:#000;color:#fff;font-family:sans-serif;padding:20px}video{max-width:100%;margin:10px 0;border-radius:8px}</style></head><body><h2>🎬 Exported Video Sequence</h2>");
                                urls.forEach((u, i) => win.document.write(`<div><h3>Clip ${i + 1}</h3><video src="${u}" controls autoplay ${i > 0 ? "" : ""}></video><br><a href="${u}" download style="color:#c026d3">Download Clip ${i + 1}</a></div>`));
                                win.document.write("</body></html>");
                                win.document.close();
                            }
                            addToast(`Exported ${urls.length} clips`, "success");
                        } })) : currentView === "storyboard" ? (_jsx(StoryboardView, { falApiKey: falApiKey, onSaveAsset: (asset) => { setAssets(prev => [asset, ...prev]); } })) : currentView === "assets" ? (_jsxs("div", { style: { flex: 1, overflow: "auto", padding: 32 }, children: [_jsx("h2", { style: { fontSize: 20, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }, children: "All Assets" }), assets.length === 0 && _jsx("div", { style: { fontSize: 14, color: "#9ca3af", textAlign: "center", padding: 60 }, children: "No assets yet. Generate some images or videos!" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }, children: assets.map((asset, i) => (_jsxs("div", { style: { borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8eb", background: "#fff" }, children: [asset.type === "video" ? (_jsx("video", { src: asset.url, style: { width: "100%", height: 160, objectFit: "cover" }, controls: true, muted: true })) : (_jsx("img", { src: asset.url, alt: "", style: { width: "100%", height: 160, objectFit: "cover" } })), _jsxs("div", { style: { padding: "10px 12px" }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: "#1a1a1a" }, children: asset.model }), _jsx("div", { style: { fontSize: 10, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: asset.prompt }), _jsxs("div", { style: { display: "flex", gap: 6, marginTop: 8 }, children: [_jsx("a", { href: asset.url, download: true, target: "_blank", rel: "noopener", style: { padding: "4px 10px", background: "#c026d3", color: "#fff", borderRadius: 6, fontSize: 10, fontWeight: 600, textDecoration: "none" }, children: "Download" }), _jsx("span", { style: { padding: "4px 8px", background: "#f5f5f7", borderRadius: 6, fontSize: 10, color: "#6b7280" }, children: asset.type })] })] })] }, i))) })] })) : (_jsxs("div", { style: { flex: 1 }, children: [_jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, nodeTypes: nodeTypes, fitView: true, style: { background: "#f0f0f2" }, snapToGrid: snapToGrid, snapGrid: [20, 20], onNodeContextMenu: (e, node) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id }); }, onClick: () => setContextMenu(null), onDoubleClick: (e) => {
                                    // Quick-add node search on double-click empty canvas
                                    const target = e.target;
                                    if (target.classList.contains("react-flow__pane") || target.closest(".react-flow__pane")) {
                                        setQuickAddPos({ x: e.clientX, y: e.clientY });
                                        setQuickAddSearch("");
                                        setQuickAddOpen(true);
                                    }
                                }, defaultEdgeOptions: { animated: isRunning, style: { stroke: "#d1d5db", strokeWidth: 1.5 }, type: "smoothstep" }, children: [_jsx(Background, { variant: BackgroundVariant.Dots, color: "#c0c0c6", gap: 28, size: 1.2 }), _jsx(Controls, { style: { background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" } }), _jsx(MiniMap, { style: { background: "#ffffff", borderRadius: 10, border: "1px solid #e8e8eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }, nodeColor: "#d1d5db", maskColor: "rgba(240,240,242,0.8)" })] }), _jsx("button", { onClick: () => {
                                    const _allX = nodes.map(n => n.position.x);
                                    void _allX;
                                    if (nodes.length === 0)
                                        return;
                                    addToast("Fit to view!", "success");
                                }, style: { position: "absolute", top: 12, right: 12, zIndex: 20, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }, title: "Fit View", children: "\u229E Fit View" }), canvasSearch && (_jsxs("div", { style: { position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 30, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 10, padding: "8px 12px", display: "flex", gap: 8, alignItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }, children: [_jsx("input", { autoFocus: true, placeholder: "Search nodes...", value: canvasSearchTerm, onChange: e => {
                                            setCanvasSearchTerm(e.target.value);
                                            const term = e.target.value.toLowerCase();
                                            if (term) {
                                                setNodes((nds) => nds.map((n) => {
                                                    const def = n.data.def;
                                                    const match = def.name.toLowerCase().includes(term) || def.id.toLowerCase().includes(term);
                                                    return { ...n, selected: match };
                                                }));
                                            }
                                        }, onKeyDown: e => { if (e.key === "Escape") {
                                            setCanvasSearch(false);
                                            setCanvasSearchTerm("");
                                        } e.stopPropagation(); }, style: { border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 8px", fontSize: 12, width: 200, outline: "none" } }), _jsxs("span", { style: { fontSize: 10, color: "#9ca3af" }, children: [nodes.filter(n => n.selected).length, " found"] }), _jsx("button", { onClick: () => { setCanvasSearch(false); setCanvasSearchTerm(""); }, style: { background: "none", border: "none", cursor: "pointer", fontSize: 14 }, children: "\u2715" })] })), _jsxs("div", { style: { position: "absolute", left: "45%", top: "40%", pointerEvents: "none", zIndex: 50, transition: "all 2s ease" }, children: [_jsx("svg", { width: "16", height: "20", viewBox: "0 0 16 20", fill: "#c026d3", children: _jsx("path", { d: "M0 0L16 12L8 12L4 20L0 0Z" }) }), _jsx("span", { style: { position: "absolute", left: 16, top: 8, background: "#c026d3", color: "#fff", fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }, children: "You" })] }), nodes.filter(n => nodeComments[n.id]).map(n => (_jsxs("div", { style: { position: "absolute", left: (n.position?.x || 0) + 270, top: (n.position?.y || 0) - 10, width: 120, minHeight: 60, background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: 8, fontSize: 10, color: "#713f12", fontFamily: "'Inter', sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", zIndex: 5, pointerEvents: "auto" }, onDoubleClick: () => setEditingComment(n.id), children: [editingComment === n.id ? (_jsx("textarea", { autoFocus: true, value: nodeComments[n.id] || "", onChange: e => setNodeComments(c => ({ ...c, [n.id]: e.target.value })), onBlur: () => setEditingComment(null), onKeyDown: e => { if (e.key === "Escape")
                                            setEditingComment(null); e.stopPropagation(); }, style: { width: "100%", minHeight: 40, background: "transparent", border: "none", fontSize: 10, color: "#713f12", resize: "vertical", outline: "none", fontFamily: "inherit" } })) : (_jsx("div", { style: { whiteSpace: "pre-wrap", wordBreak: "break-word" }, children: nodeComments[n.id] })), _jsx("button", { onClick: () => setNodeComments(c => { const nc = { ...c }; delete nc[n.id]; return nc; }), style: { position: "absolute", top: 2, right: 4, background: "none", border: "none", fontSize: 10, color: "#ca8a04", cursor: "pointer", padding: 0 }, children: "\u2715" })] }, `comment-${n.id}`))), contextMenu && (_jsxs("div", { style: { position: "fixed", left: contextMenu.x, top: contextMenu.y, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 100, padding: 4, minWidth: 160 }, children: [_jsx("button", { onClick: () => { setNodeComments(c => ({ ...c, [contextMenu.nodeId]: c[contextMenu.nodeId] || "Note..." })); setEditingComment(contextMenu.nodeId); setContextMenu(null); }, style: { width: "100%", padding: "8px 12px", background: "none", border: "none", fontSize: 12, cursor: "pointer", textAlign: "left", borderRadius: 6, color: "#1a1a1a" }, onMouseOver: e => e.currentTarget.style.background = "#f5f5f7", onMouseOut: e => e.currentTarget.style.background = "none", children: "\uD83D\uDCDD Add Note" }), _jsx("button", { onClick: () => { const n = nodes.find(nd => nd.id === contextMenu.nodeId); if (n) {
                                            const def = n.data.def;
                                            const vals = n.data.values;
                                            idCounter.current++;
                                            addNodeWithHandler(def, vals);
                                        } setContextMenu(null); }, style: { width: "100%", padding: "8px 12px", background: "none", border: "none", fontSize: 12, cursor: "pointer", textAlign: "left", borderRadius: 6, color: "#1a1a1a" }, onMouseOver: e => e.currentTarget.style.background = "#f5f5f7", onMouseOut: e => e.currentTarget.style.background = "none", children: "\uD83D\uDCCB Duplicate" }), _jsx("button", { onClick: () => { pushUndo(); setNodes(nds => nds.filter(n => n.id !== contextMenu.nodeId)); setContextMenu(null); }, style: { width: "100%", padding: "8px 12px", background: "none", border: "none", fontSize: 12, cursor: "pointer", textAlign: "left", borderRadius: 6, color: "#ef4444" }, onMouseOver: e => e.currentTarget.style.background = "#fef2f2", onMouseOut: e => e.currentTarget.style.background = "none", children: "\uD83D\uDDD1 Delete" })] }))] }))] })), quickAddOpen && (_jsx("div", { style: { position: "fixed", inset: 0, zIndex: 900 }, onClick: () => setQuickAddOpen(false), children: _jsxs("div", { onClick: e => e.stopPropagation(), style: { position: "absolute", left: quickAddPos.x - 150, top: quickAddPos.y - 20, width: 300, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", padding: 8 }, children: [_jsx("input", { autoFocus: true, value: quickAddSearch, onChange: e => setQuickAddSearch(e.target.value), placeholder: "Search nodes...", onKeyDown: e => {
                                if (e.key === "Escape")
                                    setQuickAddOpen(false);
                                if (e.key === "Enter") {
                                    const q = quickAddSearch.toLowerCase();
                                    const def = NODE_DEFS.find(d => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
                                    if (def) {
                                        addNodeWithHandler(def);
                                        setQuickAddOpen(false);
                                        setCurrentView("canvas");
                                    }
                                }
                            }, style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box", color: "#1a1a1a", marginBottom: 4 } }), _jsx("div", { style: { maxHeight: 250, overflowY: "auto" }, children: NODE_DEFS.filter(d => {
                                if (!quickAddSearch.trim())
                                    return true;
                                const q = quickAddSearch.toLowerCase();
                                return d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
                            }).slice(0, 12).map(def => (_jsxs("div", { onClick: () => { addNodeWithHandler(def); setQuickAddOpen(false); setCurrentView("canvas"); }, style: { padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 8, color: "#1a1a1a" }, onMouseOver: e => e.currentTarget.style.background = "#f5f5f7", onMouseOut: e => e.currentTarget.style.background = "transparent", children: [_jsx("span", { children: def.icon }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: def.name }), _jsx("div", { style: { fontSize: 10, color: "#9ca3af" }, children: def.category })] })] }, def.id))) })] }) })), _jsx(BatchResultsGrid, { jobs: batchJobs }), previewModal && previewModal.type === "image" && (_jsx(ImageEditor, { imageUrl: previewModal.url, onClose: () => setPreviewModal(null), onUseAsInput: (dataUrl) => {
                    const def = NODE_DEFS.find(d => d.id === "image.input");
                    if (def) {
                        addNodeWithHandler(def, { image_url: dataUrl });
                        setCurrentView("canvas");
                        addToast("Added edited image as Input node!", "success");
                    }
                    setPreviewModal(null);
                } })), previewModal && previewModal.type === "video" && (_jsx(VideoPreview, { videoUrl: previewModal.url, onClose: () => setPreviewModal(null) })), showGallery && (_jsx(GalleryView, { assets: assets, onClose: () => setShowGallery(false), onUseAsInput: (url) => {
                    const def = NODE_DEFS.find(d => d.id === "image.input");
                    if (def) {
                        addNodeWithHandler(def, { image_url: url });
                        setCurrentView("canvas");
                        addToast("Added as Image Input node!", "success");
                    }
                } })), showTutorial && _jsx(InteractiveOnboarding, { onDismiss: () => setShowTutorial(false) }), showShortcuts && _jsx(KeyboardShortcutsModal, { onClose: () => setShowShortcuts(false) }), showNotifPanel && (_jsx(NotificationPanel, { notifications: notifications, onClose: () => setShowNotifPanel(false), onMarkAllRead: () => { markAllRead(); }, onClear: () => { clearNotifications(); setShowNotifPanel(false); } })), _jsx(QueuePanel, { queue: generationQueue.queue, paused: generationQueue.paused, onPauseToggle: () => generationQueue.setPaused(p => !p), onTogglePriority: generationQueue.togglePriority, onRemove: generationQueue.removeFromQueue, onReorder: generationQueue.reorder, onClearCompleted: generationQueue.clearCompleted }), _jsx(ToastContainer, {}), _jsx("style", { children: `
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideFlyout { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
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
      ` })] }));
}
