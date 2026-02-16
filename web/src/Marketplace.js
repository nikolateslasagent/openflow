import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Marketplace — Community workflow templates
 */
import { useState } from "react";
const MARKETPLACE_TEMPLATES = [
    {
        id: "product-photography",
        title: "Product Photography Suite",
        description: "Multi-model comparison for e-commerce — generates product shots in multiple styles simultaneously",
        nodeCount: 8,
        icon: "📸",
        color: "#ec4899",
        category: "E-Commerce",
        downloads: 2847,
        nodes: [
            { defId: "text.input", x: 0, y: 150, values: { text: "Professional product photo of [your product], white background, studio lighting, 8k" } },
            { defId: "image.text_to_image", x: 350, y: 0, values: { model: "flux-2-pro", width: 1024, height: 1024 } },
            { defId: "image.text_to_image", x: 350, y: 200, values: { model: "dall-e-3", width: 1024, height: 1024 } },
            { defId: "image.text_to_image", x: 350, y: 400, values: { model: "ideogram-v3", width: 1024, height: 1024 } },
            { defId: "transform.upscale", x: 700, y: 0, values: { scale: 2 } },
            { defId: "transform.upscale", x: 700, y: 200, values: { scale: 2 } },
            { defId: "transform.upscale", x: 700, y: 400, values: { scale: 2 } },
            { defId: "output.preview", x: 1050, y: 200 },
        ],
        edges: [
            { source: 0, sourceHandle: "text", target: 1, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 2, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 3, targetHandle: "prompt" },
            { source: 1, sourceHandle: "image", target: 4, targetHandle: "image" },
            { source: 2, sourceHandle: "image", target: 5, targetHandle: "image" },
            { source: 3, sourceHandle: "image", target: 6, targetHandle: "image" },
        ],
    },
    {
        id: "social-media-pack",
        title: "Social Media Content Pack",
        description: "Generate images + videos + captions for social media posts in one workflow",
        nodeCount: 7,
        icon: "📱",
        color: "#6366f1",
        category: "Social Media",
        downloads: 4213,
        nodes: [
            { defId: "text.input", x: 0, y: 100, values: { text: "Vibrant lifestyle photo for Instagram, trendy aesthetic, warm tones" } },
            { defId: "text.llm", x: 0, y: 350, values: { prompt: "Write an engaging Instagram caption with hashtags for this post concept:", model: "gpt-4o" } },
            { defId: "image.text_to_image", x: 350, y: 0, values: { model: "flux-2-pro", width: 1080, height: 1080 } },
            { defId: "image.text_to_image", x: 350, y: 200, values: { model: "flux-2-pro", width: 1080, height: 1350 } },
            { defId: "video.text_to_video", x: 350, y: 400, values: { model: "wan-2.1", duration: 4 } },
            { defId: "output.preview", x: 700, y: 100 },
            { defId: "output.preview", x: 700, y: 400 },
        ],
        edges: [
            { source: 0, sourceHandle: "text", target: 2, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 3, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 4, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 1, targetHandle: "prompt" },
        ],
    },
    {
        id: "character-design",
        title: "Character Design Pipeline",
        description: "Concept art → turnaround sheet → style variations for game/animation characters",
        nodeCount: 6,
        icon: "🎭",
        color: "#f59e0b",
        category: "Art & Design",
        downloads: 3156,
        nodes: [
            { defId: "text.input", x: 0, y: 100, values: { text: "Fantasy warrior character, full body, concept art, detailed armor" } },
            { defId: "tools.prompt_enhancer", x: 300, y: 100, values: { style: "cinematic" } },
            { defId: "image.text_to_image", x: 600, y: 0, values: { model: "flux-2-pro" } },
            { defId: "image.text_to_image", x: 600, y: 200, values: { model: "ideogram-v3" } },
            { defId: "image.text_to_image", x: 600, y: 400, values: { model: "recraft-v3" } },
            { defId: "output.preview", x: 950, y: 200 },
        ],
        edges: [
            { source: 0, sourceHandle: "text", target: 1, targetHandle: "prompt" },
            { source: 1, sourceHandle: "text", target: 2, targetHandle: "prompt" },
            { source: 1, sourceHandle: "text", target: 3, targetHandle: "prompt" },
            { source: 1, sourceHandle: "text", target: 4, targetHandle: "prompt" },
        ],
    },
    {
        id: "real-estate-staging",
        title: "Real Estate Virtual Staging",
        description: "Transform empty room photos into beautifully staged interiors with AI",
        nodeCount: 5,
        icon: "🏠",
        color: "#14b8a6",
        category: "Real Estate",
        downloads: 1893,
        nodes: [
            { defId: "image.input", x: 0, y: 100, values: { image_url: "" } },
            { defId: "text.input", x: 0, y: 300, values: { text: "Modern luxury interior design, staged with furniture, warm lighting, real estate photography" } },
            { defId: "image.img_to_img", x: 350, y: 100, values: { model: "flux-pro", strength: 0.6 } },
            { defId: "transform.upscale", x: 700, y: 100, values: { scale: 2 } },
            { defId: "output.preview", x: 1000, y: 100 },
        ],
        edges: [
            { source: 0, sourceHandle: "image", target: 2, targetHandle: "image" },
            { source: 1, sourceHandle: "text", target: 2, targetHandle: "prompt" },
            { source: 2, sourceHandle: "image", target: 3, targetHandle: "image" },
        ],
    },
    {
        id: "youtube-thumbnail",
        title: "YouTube Thumbnail Generator",
        description: "Title + style → eye-catching thumbnails optimized for clicks",
        nodeCount: 5,
        icon: "▶️",
        color: "#ef4444",
        category: "Content Creation",
        downloads: 5621,
        nodes: [
            { defId: "text.input", x: 0, y: 100, values: { text: "Epic gaming moment, bright colors, shocked face expression, bold text overlay area" } },
            { defId: "tools.prompt_enhancer", x: 300, y: 100, values: { style: "cinematic" } },
            { defId: "image.text_to_image", x: 600, y: 0, values: { model: "flux-2-pro", width: 1280, height: 720 } },
            { defId: "image.text_to_image", x: 600, y: 250, values: { model: "dall-e-3", width: 1280, height: 720 } },
            { defId: "output.preview", x: 950, y: 100 },
        ],
        edges: [
            { source: 0, sourceHandle: "text", target: 1, targetHandle: "prompt" },
            { source: 1, sourceHandle: "text", target: 2, targetHandle: "prompt" },
            { source: 1, sourceHandle: "text", target: 3, targetHandle: "prompt" },
        ],
    },
    {
        id: "logo-variations",
        title: "Logo Variations",
        description: "Base concept → multiple style variations for brand identity exploration",
        nodeCount: 6,
        icon: "✦",
        color: "#8b5cf6",
        category: "Branding",
        downloads: 2341,
        nodes: [
            { defId: "text.input", x: 0, y: 150, values: { text: "Minimalist logo design for a tech startup, clean lines, modern" } },
            { defId: "image.text_to_image", x: 350, y: 0, values: { model: "flux-2-pro", width: 1024, height: 1024 } },
            { defId: "image.text_to_image", x: 350, y: 200, values: { model: "ideogram-v3", width: 1024, height: 1024 } },
            { defId: "image.text_to_image", x: 350, y: 400, values: { model: "recraft-v3", width: 1024, height: 1024 } },
            { defId: "image.text_to_image", x: 350, y: 600, values: { model: "dall-e-3", width: 1024, height: 1024 } },
            { defId: "output.preview", x: 700, y: 300 },
        ],
        edges: [
            { source: 0, sourceHandle: "text", target: 1, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 2, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 3, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 4, targetHandle: "prompt" },
        ],
    },
    {
        id: "meme-generator",
        title: "Meme Generator",
        description: "Topic → funny image + text overlay concept for viral memes",
        nodeCount: 4,
        icon: "😂",
        color: "#f97316",
        category: "Fun",
        downloads: 7834,
        nodes: [
            { defId: "text.input", x: 0, y: 100, values: { text: "When you finally fix the bug after 6 hours" } },
            { defId: "text.llm", x: 300, y: 0, values: { prompt: "Generate a funny meme image description for this topic. Be creative and visual:", model: "gpt-4o" } },
            { defId: "image.text_to_image", x: 600, y: 100, values: { model: "flux-fast", width: 1024, height: 1024 } },
            { defId: "output.preview", x: 950, y: 100 },
        ],
        edges: [
            { source: 0, sourceHandle: "text", target: 1, targetHandle: "prompt" },
            { source: 1, sourceHandle: "text", target: 2, targetHandle: "prompt" },
        ],
    },
    {
        id: "training-data",
        title: "Training Data Generator",
        description: "Prompt → batch of varied training images with automatic diversity",
        nodeCount: 7,
        icon: "🧪",
        color: "#06b6d4",
        category: "ML / AI",
        downloads: 1247,
        nodes: [
            { defId: "text.input", x: 0, y: 200, values: { text: "Photo of a golden retriever in various settings" } },
            { defId: "image.text_to_image", x: 350, y: 0, values: { model: "flux-2-pro", seed: 1 } },
            { defId: "image.text_to_image", x: 350, y: 150, values: { model: "flux-2-pro", seed: 42 } },
            { defId: "image.text_to_image", x: 350, y: 300, values: { model: "flux-2-pro", seed: 100 } },
            { defId: "image.text_to_image", x: 350, y: 450, values: { model: "flux-2-dev-lora", seed: 7 } },
            { defId: "image.text_to_image", x: 350, y: 600, values: { model: "sd-3.5", seed: 256 } },
            { defId: "output.preview", x: 700, y: 300 },
        ],
        edges: [
            { source: 0, sourceHandle: "text", target: 1, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 2, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 3, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 4, targetHandle: "prompt" },
            { source: 0, sourceHandle: "text", target: 5, targetHandle: "prompt" },
        ],
    },
];
export { MARKETPLACE_TEMPLATES };
export function MarketplacePanel({ onUseTemplate }) {
    const [search, setSearch] = useState("");
    const [selectedCat, setSelectedCat] = useState(null);
    const categories = [...new Set(MARKETPLACE_TEMPLATES.map(t => t.category))];
    const filtered = MARKETPLACE_TEMPLATES.filter(t => {
        const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
        const matchCat = !selectedCat || t.category === selectedCat;
        return matchSearch && matchCat;
    });
    return (_jsxs("div", { style: { padding: 16, display: "flex", flexDirection: "column", height: "100%" }, children: [_jsx("div", { style: { fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }, children: "\uD83C\uDFEA Marketplace" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Search templates...", style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box", marginBottom: 10 } }), _jsxs("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }, children: [_jsx("button", { onClick: () => setSelectedCat(null), style: { padding: "3px 8px", borderRadius: 6, border: "none", fontSize: 9, fontWeight: 600, cursor: "pointer",
                            background: !selectedCat ? "#c026d3" : "#f0f0f2", color: !selectedCat ? "#fff" : "#6b7280" }, children: "All" }), categories.map(c => (_jsx("button", { onClick: () => setSelectedCat(selectedCat === c ? null : c), style: { padding: "3px 8px", borderRadius: 6, border: "none", fontSize: 9, fontWeight: 600, cursor: "pointer",
                            background: selectedCat === c ? "#c026d3" : "#f0f0f2", color: selectedCat === c ? "#fff" : "#6b7280" }, children: c }, c)))] }), _jsx("div", { style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }, children: filtered.map(template => (_jsxs("div", { style: {
                        padding: 14, background: "#f9f9fb", borderRadius: 12, border: "1px solid #ebebee",
                        transition: "all 0.15s", cursor: "pointer",
                    }, onMouseOver: e => { e.currentTarget.style.borderColor = template.color; e.currentTarget.style.boxShadow = `0 2px 12px ${template.color}15`; }, onMouseOut: e => { e.currentTarget.style.borderColor = "#ebebee"; e.currentTarget.style.boxShadow = "none"; }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 20 }, children: template.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#1a1a1a" }, children: template.title }), _jsx("div", { style: { fontSize: 9, color: "#9ca3af" }, children: template.category })] }), _jsxs("span", { style: { padding: "2px 6px", background: `${template.color}18`, color: template.color, borderRadius: 6, fontSize: 9, fontWeight: 700 }, children: [template.nodeCount, " nodes"] })] }), _jsx("div", { style: { fontSize: 11, color: "#6b7280", lineHeight: 1.5, marginBottom: 8 }, children: template.description }), _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("span", { style: { fontSize: 9, color: "#9ca3af" }, children: ["\u2B07 ", template.downloads.toLocaleString(), " uses"] }), _jsx("button", { onClick: (e) => { e.stopPropagation(); onUseTemplate(template); }, style: { padding: "5px 12px", background: template.color, color: "#fff", border: "none", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer" }, children: "Use Template" })] })] }, template.id))) })] }));
}
