import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const ALL_MODELS = [
    // Image Generation (18)
    { key: "flux-2-pro", name: "FLUX 2 Pro", provider: "Black Forest Labs", description: "Top-tier image quality, photorealistic", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "flux-2-dev-lora", name: "FLUX 2 Dev LoRA", provider: "Black Forest Labs", description: "Fine-tunable with LoRA adapters", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "flux-2-flex", name: "FLUX 2 Flex", provider: "Black Forest Labs", description: "Flexible dev model, good balance", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "flux-pro-1.1-ultra", name: "FLUX Pro 1.1 Ultra", provider: "Black Forest Labs", description: "Ultra high quality, best detail", speed: 2, category: "image", nodeDefId: "image.text_to_image" },
    { key: "flux-pro-1.1", name: "FLUX Pro 1.1", provider: "Black Forest Labs", description: "Production-ready, consistent", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "flux-fast", name: "FLUX Fast (Schnell)", provider: "Black Forest Labs", description: "Fastest FLUX model, 4 steps", speed: 5, category: "image", nodeDefId: "image.text_to_image" },
    { key: "nano-banana-pro", name: "Nano Banana Pro", provider: "fal.ai", description: "Lightweight, fast generation", speed: 5, category: "image", nodeDefId: "image.text_to_image" },
    { key: "sd-3.5", name: "Stable Diffusion 3.5", provider: "Stability AI", description: "Latest SD architecture", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "dall-e-3", name: "DALL·E 3", provider: "OpenAI", description: "Great at text rendering, creative", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "gpt-image-1.5", name: "GPT Image 1", provider: "OpenAI", description: "Native GPT image generation", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "grok-image", name: "Grok Image", provider: "xAI", description: "Grok-powered image generation", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "imagen-4", name: "Imagen 4 Preview", provider: "Google", description: "Google's latest, photorealistic", speed: 2, category: "image", nodeDefId: "image.text_to_image" },
    { key: "imagen-3", name: "Imagen 3", provider: "Google", description: "High quality, good prompt following", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "imagen-3-fast", name: "Imagen 3 Fast", provider: "Google", description: "Faster variant of Imagen 3", speed: 4, category: "image", nodeDefId: "image.text_to_image" },
    { key: "ideogram-v3", name: "Ideogram V3", provider: "Ideogram", description: "Best text-in-image rendering", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "recraft-v3", name: "Recraft V3", provider: "Recraft", description: "Design-focused, clean aesthetics", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "reve", name: "Rêve", provider: "Rêve", description: "Artistic, dreamy aesthetic", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    { key: "higgsfield-image", name: "Higgsfield", provider: "Higgsfield", description: "Creative image generation", speed: 3, category: "image", nodeDefId: "image.text_to_image" },
    // Video Generation (14)
    { key: "kling-3.0-pro", name: "Kling 3.0 Pro", provider: "Kuaishou", description: "Best motion quality, cinematic", speed: 1, category: "video", nodeDefId: "video.text_to_video" },
    { key: "kling-2.6-pro", name: "Kling 2.6 Pro", provider: "Kuaishou", description: "Great motion, stable output", speed: 2, category: "video", nodeDefId: "video.text_to_video" },
    { key: "kling-2.0", name: "Kling 2.0", provider: "Kuaishou", description: "Good balance of speed & quality", speed: 3, category: "video", nodeDefId: "video.text_to_video" },
    { key: "wan-2.1", name: "Wan 2.1", provider: "Alibaba", description: "Versatile, great general use", speed: 3, category: "video", nodeDefId: "video.text_to_video" },
    { key: "wan-2.1-1.3b", name: "Wan 2.1 1.3B", provider: "Alibaba", description: "Lightweight, fast generation", speed: 4, category: "video", nodeDefId: "video.text_to_video" },
    { key: "minimax-hailuo", name: "MiniMax Hailuo", provider: "MiniMax", description: "Smooth motion, good aesthetics", speed: 3, category: "video", nodeDefId: "video.text_to_video" },
    { key: "hunyuan", name: "HunyuanVideo", provider: "Tencent", description: "Open-source, diverse styles", speed: 2, category: "video", nodeDefId: "video.text_to_video" },
    { key: "luma-ray-2", name: "Luma Ray 2", provider: "Luma AI", description: "Dream Machine, creative motion", speed: 3, category: "video", nodeDefId: "video.text_to_video" },
    { key: "ltx-video", name: "LTX Video", provider: "Lightricks", description: "Fast, good for short clips", speed: 4, category: "video", nodeDefId: "video.text_to_video" },
    { key: "ltx-2-19b", name: "LTX 2 19B", provider: "Lightricks", description: "High param count, better quality", speed: 2, category: "video", nodeDefId: "video.text_to_video" },
    { key: "veo-3.1", name: "Veo 3.1", provider: "Google", description: "Google's video model", speed: 2, category: "video", nodeDefId: "video.text_to_video" },
    { key: "grok-video", name: "Grok Video", provider: "xAI", description: "Grok-powered video gen", speed: 3, category: "video", nodeDefId: "video.text_to_video" },
    { key: "cogvideox-5b", name: "CogVideoX 5B", provider: "THUDM", description: "Open-source, research quality", speed: 2, category: "video", nodeDefId: "video.text_to_video" },
    { key: "mochi-v1", name: "Mochi V1", provider: "Genmo", description: "Creative, artistic motion", speed: 3, category: "video", nodeDefId: "video.text_to_video" },
    // Image-to-Video (3)
    { key: "minimax-hailuo-i2v", name: "MiniMax I2V", provider: "MiniMax", description: "Image to video, smooth animation", speed: 3, category: "img2vid", nodeDefId: "video.img_to_video" },
    { key: "ltx-2-19b-i2v", name: "LTX 2 I2V", provider: "Lightricks", description: "Image to video, high quality", speed: 2, category: "img2vid", nodeDefId: "video.img_to_video" },
    { key: "veo-3.1-i2v", name: "Veo 3.1 I2V", provider: "Google", description: "Google image-to-video", speed: 2, category: "img2vid", nodeDefId: "video.img_to_video" },
    // Upscale (2)
    { key: "real-esrgan", name: "Real-ESRGAN", provider: "Open Source", description: "Best general upscaler", speed: 4, category: "upscale", nodeDefId: "transform.upscale" },
    { key: "clarity-upscaler", name: "Clarity Upscaler", provider: "fal.ai", description: "Enhanced detail upscaling", speed: 3, category: "upscale", nodeDefId: "transform.upscale" },
];
const CATEGORY_LABELS = {
    image: "Image Generation",
    video: "Video Generation",
    img2vid: "Image-to-Video",
    upscale: "Upscale",
};
const PROVIDER_COLORS = {
    "Black Forest Labs": "#8b5cf6",
    "Stability AI": "#6366f1",
    "OpenAI": "#10b981",
    "Google": "#3b82f6",
    "xAI": "#ef4444",
    "Kuaishou": "#f59e0b",
    "Alibaba": "#f97316",
    "MiniMax": "#ec4899",
    "Tencent": "#06b6d4",
    "Luma AI": "#a855f7",
    "Lightricks": "#14b8a6",
    "Genmo": "#d946ef",
    "THUDM": "#84cc16",
    "Ideogram": "#eab308",
    "Recraft": "#0ea5e9",
    "Rêve": "#c084fc",
    "Higgsfield": "#fb923c",
    "fal.ai": "#c026d3",
    "Open Source": "#6b7280",
};
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem("openflow_fav_models") || "[]");
    }
    catch {
        return [];
    }
}
function toggleFavorite(key) {
    const favs = getFavorites();
    const idx = favs.indexOf(key);
    if (idx >= 0)
        favs.splice(idx, 1);
    else
        favs.push(key);
    localStorage.setItem("openflow_fav_models", JSON.stringify(favs));
    return favs;
}
export function ModelManagerPanel({ onCreateNode }) {
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("all");
    const [favorites, setFavorites] = useState(() => getFavorites());
    const [showFavsOnly, setShowFavsOnly] = useState(false);
    let filtered = ALL_MODELS;
    if (filterCat !== "all")
        filtered = filtered.filter(m => m.category === filterCat);
    if (showFavsOnly)
        filtered = filtered.filter(m => favorites.includes(m.key));
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(m => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q) || m.key.toLowerCase().includes(q));
    }
    const grouped = {};
    for (const m of filtered) {
        const cat = CATEGORY_LABELS[m.category] || m.category;
        if (!grouped[cat])
            grouped[cat] = [];
        grouped[cat].push(m);
    }
    const speedLabel = (s) => "●".repeat(s) + "○".repeat(5 - s);
    return (_jsxs("div", { style: { padding: 16, height: "100%", display: "flex", flexDirection: "column" }, children: [_jsxs("div", { style: { fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }, children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0 }, children: [_jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }), _jsx("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }), _jsx("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" })] }), " Model Manager", _jsxs("span", { style: { fontSize: 10, color: "#9ca3af", fontWeight: 400 }, children: [ALL_MODELS.length, " models"] })] }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Search models...", style: { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", marginBottom: 8, boxSizing: "border-box" } }), _jsxs("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }, children: [["all", "image", "video", "img2vid", "upscale"].map(c => (_jsx("button", { onClick: () => setFilterCat(c), style: {
                            padding: "4px 8px", borderRadius: 6, border: "none", fontSize: 9, fontWeight: 600,
                            background: filterCat === c ? "#c026d3" : "#f5f5f7", color: filterCat === c ? "#fff" : "#6b7280",
                            cursor: "pointer", textTransform: "capitalize",
                        }, children: c === "all" ? "All" : CATEGORY_LABELS[c] || c }, c))), _jsx("button", { onClick: () => setShowFavsOnly(!showFavsOnly), style: {
                            padding: "4px 8px", borderRadius: 6, border: "none", fontSize: 9, fontWeight: 600,
                            background: showFavsOnly ? "#fbbf24" : "#f5f5f7", color: showFavsOnly ? "#fff" : "#6b7280", cursor: "pointer",
                        }, children: "\u2605 Favs" })] }), _jsxs("div", { style: { flex: 1, overflow: "auto" }, children: [Object.entries(grouped).map(([cat, models]) => (_jsxs("div", { children: [_jsxs("div", { style: { fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", padding: "8px 0 4px" }, children: [cat, " (", models.length, ")"] }), models.map(m => (_jsxs("div", { style: { padding: "8px", background: "#fafafa", borderRadius: 10, marginBottom: 4, border: "1px solid #ebebee" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#1a1a1a" }, children: m.name }), _jsx("button", { onClick: () => { setFavorites(toggleFavorite(m.key)); }, style: {
                                                    background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0,
                                                    color: favorites.includes(m.key) ? "#fbbf24" : "#d1d5db",
                                                }, children: "\u2605" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }, children: [_jsx("span", { style: {
                                                    fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                                                    background: (PROVIDER_COLORS[m.provider] || "#6b7280") + "20",
                                                    color: PROVIDER_COLORS[m.provider] || "#6b7280",
                                                }, children: m.provider }), _jsx("span", { style: { fontSize: 9, color: "#9ca3af", letterSpacing: "1px" }, children: speedLabel(m.speed) })] }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 6 }, children: m.description }), _jsx("button", { onClick: () => onCreateNode(m.nodeDefId, m.key), style: {
                                            width: "100%", padding: "6px", background: "#c026d3", color: "#fff", border: "none",
                                            borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                                        }, children: "Create Node \u2192" })] }, m.key)))] }, cat))), filtered.length === 0 && _jsx("div", { style: { fontSize: 11, color: "#9ca3af", textAlign: "center", padding: 20 }, children: "No models found" })] })] }));
}
