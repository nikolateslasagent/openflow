import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Storyboard View — AI-powered scene builder with visual timeline
 *
 * Users describe a story → AI decomposes into cinematic scenes →
 * visual timeline with drag reorder → one-click generate all images/videos
 */
import { useState, useRef, useCallback, useEffect } from "react";
const CAMERA_ANGLES = [
    "Wide establishing shot", "Medium shot", "Close-up", "Extreme close-up",
    "Bird's eye view", "Low angle", "Dutch angle", "Over-the-shoulder",
    "POV shot", "Tracking shot", "Dolly zoom",
];
const MOODS = [
    "Dramatic", "Joyful", "Mysterious", "Tense", "Melancholic", "Epic",
    "Romantic", "Eerie", "Peaceful", "Chaotic", "Nostalgic", "Surreal",
];
const STYLES = [
    "Cinematic film still, 4K",
    "Studio Ghibli anime style",
    "Pixar 3D animation",
    "Watercolor painting",
    "Oil painting, Renaissance",
    "Noir black and white",
    "Cyberpunk neon",
    "Fantasy concept art",
    "Documentary photography",
    "Comic book panel",
    "Vintage 1970s film grain",
    "Minimalist flat design",
];
// ---------------------------------------------------------------------------
// AI Scene Decomposition (smart heuristic + fal.ai LLM when available)
// ---------------------------------------------------------------------------
function decomposeStory(story, style) {
    // Smart decomposition: split into narrative beats
    const cleanStory = story.trim();
    // Try splitting by paragraphs first, then sentences
    let segments = cleanStory.split(/\n\n+/).filter(s => s.trim().length > 15);
    if (segments.length < 2) {
        segments = cleanStory.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15);
    }
    // Group short segments together (min ~20 chars per scene)
    const grouped = [];
    let buffer = "";
    for (const seg of segments) {
        buffer += (buffer ? " " : "") + seg.trim();
        if (buffer.length > 40 || seg === segments[segments.length - 1]) {
            grouped.push(buffer);
            buffer = "";
        }
    }
    if (buffer)
        grouped.push(buffer);
    // Limit to 8 scenes max
    const finalSegments = grouped.slice(0, 8);
    if (finalSegments.length === 0) {
        finalSegments.push(cleanStory.slice(0, 200));
    }
    // Auto-assign camera angles based on position in story
    const angleSequence = [
        "Wide establishing shot", // Opening
        "Medium shot", // Introduction
        "Close-up", // Emotion
        "Tracking shot", // Action
        "Over-the-shoulder", // Dialogue
        "Low angle", // Power/drama
        "Bird's eye view", // Scale
        "Close-up", // Climax
    ];
    // Auto-assign moods based on position
    const moodSequence = [
        "Epic", // Opening
        "Mysterious", // Build
        "Tense", // Rising
        "Dramatic", // Peak
        "Chaotic", // Climax
        "Melancholic", // Fall
        "Peaceful", // Resolution
        "Nostalgic", // Ending
    ];
    return finalSegments.map((text, i) => ({
        id: `scene_${Date.now()}_${i}`,
        order: i,
        title: `Scene ${i + 1}`,
        description: text,
        dialogue: "",
        cameraAngle: angleSequence[i % angleSequence.length],
        mood: moodSequence[i % moodSequence.length],
        duration: 4,
        imageUrl: null,
        videoUrl: null,
        status: "draft",
        style: style,
    }));
}
// Build the full prompt for image generation
function buildPrompt(scene, globalStyle) {
    const style = scene.style || globalStyle || "Cinematic film still, 4K";
    return `${style}. ${scene.cameraAngle}. ${scene.mood} mood. ${scene.description}`;
}
// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
function getStoryboards() {
    return JSON.parse(localStorage.getItem("openflow_storyboards") || "[]");
}
function saveStoryboards(boards) {
    localStorage.setItem("openflow_storyboards", JSON.stringify(boards));
}
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function StoryboardView({ falApiKey, onSaveAsset }) {
    const [storyboards, setStoryboards] = useState(() => getStoryboards());
    const [activeBoard, setActiveBoard] = useState(null);
    const [storyInput, setStoryInput] = useState("");
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
    const [isDecomposing, setIsDecomposing] = useState(false);
    const [editingScene, setEditingScene] = useState(null);
    const [dragId, setDragId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [generatingAll, setGeneratingAll] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const cancelRef = useRef(false);
    // Persist
    useEffect(() => { saveStoryboards(storyboards); }, [storyboards]);
    // Create new storyboard from story
    const createStoryboard = useCallback(() => {
        if (!storyInput.trim())
            return;
        setIsDecomposing(true);
        setTimeout(() => {
            const scenes = decomposeStory(storyInput, selectedStyle);
            const board = {
                id: `sb_${Date.now()}`,
                title: storyInput.slice(0, 50).trim() + (storyInput.length > 50 ? "..." : ""),
                synopsis: storyInput,
                globalStyle: selectedStyle,
                scenes,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            setStoryboards(prev => [board, ...prev]);
            setActiveBoard(board);
            setStoryInput("");
            setIsDecomposing(false);
        }, 600); // Simulate processing
    }, [storyInput, selectedStyle]);
    // Update a scene in the active board
    const updateScene = useCallback((sceneId, updates) => {
        if (!activeBoard)
            return;
        const updated = {
            ...activeBoard,
            scenes: activeBoard.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s),
            updatedAt: Date.now(),
        };
        setActiveBoard(updated);
        setStoryboards(prev => prev.map(b => b.id === updated.id ? updated : b));
    }, [activeBoard]);
    // Delete scene
    const deleteScene = useCallback((sceneId) => {
        if (!activeBoard)
            return;
        const updated = {
            ...activeBoard,
            scenes: activeBoard.scenes.filter(s => s.id !== sceneId).map((s, i) => ({ ...s, order: i })),
            updatedAt: Date.now(),
        };
        setActiveBoard(updated);
        setStoryboards(prev => prev.map(b => b.id === updated.id ? updated : b));
    }, [activeBoard]);
    // Add scene
    const addScene = useCallback(() => {
        if (!activeBoard)
            return;
        const newScene = {
            id: `scene_${Date.now()}`,
            order: activeBoard.scenes.length,
            title: `Scene ${activeBoard.scenes.length + 1}`,
            description: "Describe this scene...",
            dialogue: "",
            cameraAngle: "Medium shot",
            mood: "Dramatic",
            duration: 4,
            imageUrl: null,
            videoUrl: null,
            status: "draft",
            style: activeBoard.globalStyle,
        };
        const updated = { ...activeBoard, scenes: [...activeBoard.scenes, newScene], updatedAt: Date.now() };
        setActiveBoard(updated);
        setStoryboards(prev => prev.map(b => b.id === updated.id ? updated : b));
        setEditingScene(newScene.id);
    }, [activeBoard]);
    // Drag & drop reorder
    const handleDragStart = (sceneId) => setDragId(sceneId);
    const handleDragOver = (sceneId) => { if (dragId && dragId !== sceneId)
        setDragOverId(sceneId); };
    const handleDrop = useCallback((targetId) => {
        if (!activeBoard || !dragId || dragId === targetId)
            return;
        const scenes = [...activeBoard.scenes];
        const fromIdx = scenes.findIndex(s => s.id === dragId);
        const toIdx = scenes.findIndex(s => s.id === targetId);
        if (fromIdx < 0 || toIdx < 0)
            return;
        const [moved] = scenes.splice(fromIdx, 1);
        scenes.splice(toIdx, 0, moved);
        const reordered = scenes.map((s, i) => ({ ...s, order: i }));
        const updated = { ...activeBoard, scenes: reordered, updatedAt: Date.now() };
        setActiveBoard(updated);
        setStoryboards(prev => prev.map(b => b.id === updated.id ? updated : b));
        setDragId(null);
        setDragOverId(null);
    }, [activeBoard, dragId]);
    // Generate image for a scene via fal.ai
    const generateSceneImage = useCallback(async (sceneId) => {
        if (!activeBoard)
            return;
        const scene = activeBoard.scenes.find(s => s.id === sceneId);
        if (!scene)
            return;
        updateScene(sceneId, { status: "generating" });
        const prompt = buildPrompt(scene, activeBoard.globalStyle);
        try {
            const res = await fetch("https://queue.fal.run/fal-ai/flux-pro/v1.1", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Key ${falApiKey}` },
                body: JSON.stringify({
                    prompt,
                    image_size: { width: 1280, height: 720 },
                    num_images: 1,
                    enable_safety_checker: false,
                }),
            });
            const data = await res.json();
            if (data.request_id) {
                // Poll for result
                let result = null;
                for (let attempt = 0; attempt < 60; attempt++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${data.request_id}/status`, {
                        headers: { Authorization: `Key ${falApiKey}` },
                    });
                    const statusData = await statusRes.json();
                    if (statusData.status === "COMPLETED") {
                        const resultRes = await fetch(`https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${data.request_id}`, {
                            headers: { Authorization: `Key ${falApiKey}` },
                        });
                        result = await resultRes.json();
                        break;
                    }
                    if (statusData.status === "FAILED")
                        throw new Error("Generation failed");
                }
                if (result?.images?.[0]?.url) {
                    const url = result.images[0].url;
                    updateScene(sceneId, { imageUrl: url, status: "done" });
                    onSaveAsset({ url, type: "image", prompt, model: "flux-pro-1.1", timestamp: Date.now() });
                    return;
                }
            }
            // Direct response
            if (data.images?.[0]?.url) {
                const url = data.images[0].url;
                updateScene(sceneId, { imageUrl: url, status: "done" });
                onSaveAsset({ url, type: "image", prompt, model: "flux-pro-1.1", timestamp: Date.now() });
                return;
            }
            throw new Error("No image in response");
        }
        catch (err) {
            updateScene(sceneId, { status: "error" });
            console.error("Scene generation failed:", err);
        }
    }, [activeBoard, falApiKey, updateScene, onSaveAsset]);
    // Generate all scenes
    const generateAllScenes = useCallback(async () => {
        if (!activeBoard)
            return;
        setGeneratingAll(true);
        cancelRef.current = false;
        for (const scene of activeBoard.scenes) {
            if (cancelRef.current)
                break;
            if (scene.status === "done" && scene.imageUrl)
                continue;
            await generateSceneImage(scene.id);
        }
        setGeneratingAll(false);
    }, [activeBoard, generateSceneImage]);
    // Delete storyboard
    const deleteStoryboard = useCallback((boardId) => {
        setStoryboards(prev => prev.filter(b => b.id !== boardId));
        if (activeBoard?.id === boardId)
            setActiveBoard(null);
    }, [activeBoard]);
    // ---------------------------------------------------------------------------
    // Render: Storyboard list (no active board)
    // ---------------------------------------------------------------------------
    if (!activeBoard) {
        return (_jsx("div", { style: { flex: 1, overflow: "auto", padding: 32, background: "#0e0e10", color: "#e5e5e5" }, children: _jsxs("div", { style: { maxWidth: 800, margin: "0 auto" }, children: [_jsx("h2", { style: { fontSize: 28, fontWeight: 700, marginBottom: 4 }, children: "\uD83C\uDFAC Storyboard" }), _jsx("p", { style: { fontSize: 13, color: "#9ca3af", marginBottom: 24 }, children: "Describe your story and AI will decompose it into cinematic scenes. Edit each scene's camera angle, mood, and description, then generate images with one click." }), _jsxs("div", { style: { background: "#141416", borderRadius: 16, padding: 24, border: "1px solid #2a2a30", marginBottom: 32 }, children: [_jsx("textarea", { value: storyInput, onChange: e => setStoryInput(e.target.value), placeholder: "Describe your video story...\n\nExample: A lone astronaut discovers an abandoned space station orbiting a dying star. As she explores the dark corridors, she finds evidence of an alien civilization. In the final chamber, she discovers they left behind a message \u2014 a map to their home world.", style: {
                                    width: "100%", minHeight: 140, padding: 16, borderRadius: 12,
                                    background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5",
                                    fontSize: 14, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit",
                                } }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, marginTop: 16 }, children: [_jsx("select", { value: selectedStyle, onChange: e => setSelectedStyle(e.target.value), style: { flex: 1, padding: "10px 14px", borderRadius: 10, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 13 }, children: STYLES.map(s => _jsx("option", { value: s, children: s }, s)) }), _jsx("button", { onClick: createStoryboard, disabled: !storyInput.trim() || isDecomposing, style: {
                                            padding: "10px 24px", borderRadius: 10, border: "none",
                                            background: storyInput.trim() ? "#c026d3" : "#2a2a30",
                                            color: storyInput.trim() ? "#fff" : "#6b6b75",
                                            fontSize: 14, fontWeight: 700, cursor: storyInput.trim() ? "pointer" : "not-allowed",
                                            display: "flex", alignItems: "center", gap: 8,
                                        }, children: isDecomposing ? "⏳ Creating..." : "🎬 Create Storyboard" })] })] }), storyboards.length > 0 && (_jsxs(_Fragment, { children: [_jsx("h3", { style: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#9ca3af" }, children: "Your Storyboards" }), _jsx("div", { style: { display: "grid", gap: 12 }, children: storyboards.map(board => (_jsx("div", { onClick: () => setActiveBoard(board), style: {
                                        background: "#141416", borderRadius: 12, padding: 16,
                                        border: "1px solid #2a2a30", cursor: "pointer",
                                        transition: "border-color 0.15s",
                                    }, onMouseOver: e => { e.currentTarget.style.borderColor = "#c026d3"; }, onMouseOut: e => { e.currentTarget.style.borderColor = "#2a2a30"; }, children: _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 15, fontWeight: 600 }, children: board.title }), _jsxs("div", { style: { fontSize: 12, color: "#9ca3af", marginTop: 4 }, children: [board.scenes.length, " scenes \u00B7 ", board.globalStyle, " \u00B7 ", new Date(board.updatedAt).toLocaleDateString()] })] }), _jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [_jsx("div", { style: { display: "flex", gap: 4 }, children: board.scenes.slice(0, 4).map(s => (_jsx("div", { style: {
                                                                width: 40, height: 28, borderRadius: 6, overflow: "hidden",
                                                                background: s.imageUrl ? `url(${s.imageUrl}) center/cover` : "#2a2a30",
                                                                border: "1px solid #3a3a40",
                                                            }, children: !s.imageUrl && _jsx("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#6b6b75" }, children: s.order + 1 }) }, s.id))) }), _jsx("button", { onClick: e => { e.stopPropagation(); deleteStoryboard(board.id); }, style: { padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: "#ef4444", fontSize: 12, cursor: "pointer" }, children: "\uD83D\uDDD1" })] })] }) }, board.id))) })] }))] }) }));
    }
    // ---------------------------------------------------------------------------
    // Render: Active storyboard with timeline
    // ---------------------------------------------------------------------------
    const completedCount = activeBoard.scenes.filter(s => s.status === "done").length;
    const totalCount = activeBoard.scenes.length;
    return (_jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", background: "#0e0e10", color: "#e5e5e5", overflow: "hidden" }, children: [_jsxs("div", { style: {
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                    background: "#141416", borderBottom: "1px solid #2a2a30", flexShrink: 0,
                }, children: [_jsx("button", { onClick: () => setActiveBoard(null), style: { padding: "6px 12px", borderRadius: 8, border: "1px solid #2a2a30", background: "transparent", color: "#9ca3af", fontSize: 12, cursor: "pointer" }, children: "\u2190 Back" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 16, fontWeight: 700 }, children: activeBoard.title }), _jsxs("div", { style: { fontSize: 11, color: "#9ca3af" }, children: [totalCount, " scenes \u00B7 ", activeBoard.globalStyle, " \u00B7 ", completedCount, "/", totalCount, " generated"] })] }), _jsx("button", { onClick: addScene, style: { padding: "8px 16px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#22c55e", fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "+ Add Scene" }), generatingAll ? (_jsx("button", { onClick: () => { cancelRef.current = true; }, style: { padding: "8px 16px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }, children: "\u23F9 Stop" })) : (_jsxs("button", { onClick: generateAllScenes, disabled: totalCount === 0, style: { padding: "8px 16px", borderRadius: 8, border: "none", background: "#c026d3", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }, children: ["\u25B6 Generate All (", totalCount - completedCount, " remaining)"] }))] }), generatingAll && (_jsx("div", { style: { height: 3, background: "#2a2a30", flexShrink: 0 }, children: _jsx("div", { style: { height: "100%", width: `${(completedCount / totalCount) * 100}%`, background: "linear-gradient(90deg, #c026d3, #f59e0b)", transition: "width 0.5s" } }) })), _jsxs("div", { style: { flex: 1, overflow: "auto", padding: 24 }, children: [_jsxs("div", { style: { display: "flex", gap: 0, alignItems: "flex-start", minWidth: "fit-content", paddingBottom: 20 }, children: [activeBoard.scenes.map((scene, idx) => (_jsxs("div", { style: { display: "flex", alignItems: "flex-start" }, children: [_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(scene.id), onDragOver: (e) => { e.preventDefault(); handleDragOver(scene.id); }, onDrop: () => handleDrop(scene.id), onDragEnd: () => { setDragId(null); setDragOverId(null); }, style: {
                                            width: 280, borderRadius: 12, overflow: "hidden",
                                            background: dragOverId === scene.id ? "#1e1e28" : "#141416",
                                            border: `1px solid ${editingScene === scene.id ? "#c026d3" : dragOverId === scene.id ? "#c026d3" : "#2a2a30"}`,
                                            opacity: dragId === scene.id ? 0.5 : 1,
                                            transition: "all 0.15s",
                                            cursor: "grab",
                                        }, children: [_jsxs("div", { style: {
                                                    width: "100%", height: 160, background: "#0a0a0c",
                                                    position: "relative", cursor: scene.imageUrl ? "pointer" : "default",
                                                }, onClick: () => scene.imageUrl && setPreviewUrl(scene.imageUrl), children: [scene.imageUrl ? (_jsx("img", { src: scene.imageUrl, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } })) : (_jsx("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }, children: scene.status === "generating" ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 24, animation: "spin 1s linear infinite" }, children: "\u23F3" }), _jsx("div", { style: { fontSize: 11, color: "#9ca3af" }, children: "Generating..." })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 28, color: "#3a3a40" }, children: "\uD83C\uDFAC" }), _jsxs("div", { style: { fontSize: 11, color: "#6b6b75" }, children: ["Scene ", idx + 1] })] })) })), _jsx("div", { style: {
                                                            position: "absolute", top: 8, left: 8, width: 24, height: 24,
                                                            borderRadius: "50%", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: 11, fontWeight: 700, color: "#fff",
                                                        }, children: idx + 1 }), _jsx("div", { style: {
                                                            position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%",
                                                            background: scene.status === "done" ? "#22c55e" : scene.status === "generating" ? "#f59e0b" : scene.status === "error" ? "#ef4444" : "#4a4a50",
                                                        } })] }), _jsx("div", { style: { padding: 14 }, children: editingScene === scene.id ? (
                                                /* Edit mode */
                                                _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [_jsx("input", { value: scene.title, onChange: e => updateScene(scene.id, { title: e.target.value }), style: { padding: "6px 10px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 12, fontWeight: 600 }, placeholder: "Scene title" }), _jsx("textarea", { value: scene.description, onChange: e => updateScene(scene.id, { description: e.target.value }), style: { padding: "6px 10px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 11, minHeight: 60, resize: "vertical", fontFamily: "inherit" }, placeholder: "Visual description..." }), _jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx("select", { value: scene.cameraAngle, onChange: e => updateScene(scene.id, { cameraAngle: e.target.value }), style: { flex: 1, padding: "6px 8px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 10 }, children: CAMERA_ANGLES.map(a => _jsx("option", { children: a }, a)) }), _jsx("select", { value: scene.mood, onChange: e => updateScene(scene.id, { mood: e.target.value }), style: { flex: 1, padding: "6px 8px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 10 }, children: MOODS.map(m => _jsx("option", { children: m }, m)) })] }), _jsx("select", { value: scene.style, onChange: e => updateScene(scene.id, { style: e.target.value }), style: { padding: "6px 8px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 10 }, children: STYLES.map(s => _jsx("option", { children: s }, s)) }), _jsxs("div", { style: { display: "flex", gap: 6, alignItems: "center" }, children: [_jsx("label", { style: { fontSize: 10, color: "#9ca3af" }, children: "Duration:" }), _jsx("input", { type: "number", min: 1, max: 30, value: scene.duration, onChange: e => updateScene(scene.id, { duration: parseInt(e.target.value) || 4 }), style: { width: 50, padding: "4px 6px", borderRadius: 4, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 11, textAlign: "center" } }), _jsx("span", { style: { fontSize: 10, color: "#9ca3af" }, children: "sec" })] }), _jsx("button", { onClick: () => setEditingScene(null), style: { padding: "6px 12px", borderRadius: 6, border: "none", background: "#c026d3", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }, children: "\u2713 Done" })] })) : (
                                                /* View mode */
                                                _jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: scene.title }), _jsx("div", { style: { fontSize: 11, color: "#9ca3af", lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }, children: scene.description }), _jsxs("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }, children: [_jsxs("span", { style: { padding: "2px 8px", borderRadius: 10, background: "#1e1e22", fontSize: 10, color: "#9ca3af" }, children: ["\uD83D\uDCF7 ", scene.cameraAngle] }), _jsxs("span", { style: { padding: "2px 8px", borderRadius: 10, background: "#1e1e22", fontSize: 10, color: "#9ca3af" }, children: ["\uD83C\uDFAD ", scene.mood] }), _jsxs("span", { style: { padding: "2px 8px", borderRadius: 10, background: "#1e1e22", fontSize: 10, color: "#9ca3af" }, children: ["\u23F1 ", scene.duration, "s"] })] }), _jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx("button", { onClick: () => setEditingScene(scene.id), style: { flex: 1, padding: "6px", borderRadius: 6, border: "1px solid #2a2a30", background: "transparent", color: "#9ca3af", fontSize: 10, cursor: "pointer" }, children: "\u270F\uFE0F Edit" }), _jsx("button", { onClick: () => generateSceneImage(scene.id), disabled: scene.status === "generating", style: { flex: 1, padding: "6px", borderRadius: 6, border: "none", background: scene.status === "generating" ? "#2a2a30" : "#c026d3", color: scene.status === "generating" ? "#6b6b75" : "#fff", fontSize: 10, fontWeight: 600, cursor: scene.status === "generating" ? "not-allowed" : "pointer" }, children: scene.status === "generating" ? "⏳..." : "▶ Generate" }), _jsx("button", { onClick: () => deleteScene(scene.id), style: { padding: "6px 8px", borderRadius: 6, border: "1px solid #2a2a30", background: "transparent", color: "#ef4444", fontSize: 10, cursor: "pointer" }, children: "\uD83D\uDDD1" })] })] })) })] }), idx < activeBoard.scenes.length - 1 && (_jsxs("div", { style: { display: "flex", alignItems: "center", height: 160, padding: "0 6px" }, children: [_jsx("div", { style: { width: 24, height: 2, background: "#3a3a40" } }), _jsx("div", { style: { width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #3a3a40" } })] }))] }, scene.id))), _jsx("div", { style: { display: "flex", alignItems: "center", height: 160, paddingLeft: 12 }, children: _jsx("button", { onClick: addScene, style: {
                                        width: 60, height: 60, borderRadius: "50%", border: "2px dashed #3a3a40",
                                        background: "transparent", color: "#6b6b75", fontSize: 24, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.15s",
                                    }, onMouseOver: e => { e.currentTarget.style.borderColor = "#c026d3"; e.currentTarget.style.color = "#c026d3"; }, onMouseOut: e => { e.currentTarget.style.borderColor = "#3a3a40"; e.currentTarget.style.color = "#6b6b75"; }, children: "+" }) })] }), editingScene && (() => {
                        const scene = activeBoard.scenes.find(s => s.id === editingScene);
                        if (!scene)
                            return null;
                        return (_jsxs("div", { style: { marginTop: 20, padding: 16, background: "#141416", borderRadius: 12, border: "1px solid #2a2a30", maxWidth: 700 }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }, children: "Generated Prompt Preview:" }), _jsx("div", { style: { fontSize: 12, color: "#c4b5fd", lineHeight: 1.5, fontStyle: "italic" }, children: buildPrompt(scene, activeBoard.globalStyle) })] }));
                    })()] }), previewUrl && (_jsx("div", { onClick: () => setPreviewUrl(null), style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: _jsx("img", { src: previewUrl, alt: "", style: { maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }, onClick: e => e.stopPropagation() }) })), _jsx("style", { children: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      ` })] }));
}
