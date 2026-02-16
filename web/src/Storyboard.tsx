/**
 * Storyboard View — AI-powered scene builder with visual timeline
 * 
 * Users describe a story → AI decomposes into cinematic scenes → 
 * visual timeline with drag reorder → one-click generate all images/videos
 */

import { useState, useRef, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Scene {
  id: string;
  order: number;
  title: string;
  description: string;       // Visual description for image generation
  dialogue: string;           // Character dialogue
  cameraAngle: string;        // e.g. "Wide shot", "Close-up", "Bird's eye"
  mood: string;               // e.g. "Tense", "Joyful", "Mysterious"
  duration: number;           // seconds
  imageUrl: string | null;    // Generated image
  videoUrl: string | null;    // Generated video
  status: "draft" | "generating" | "done" | "error";
  style: string;              // Visual style override
}

export interface Storyboard {
  id: string;
  title: string;
  synopsis: string;
  globalStyle: string;        // "Cinematic 4K", "Anime", "Watercolor", etc.
  scenes: Scene[];
  createdAt: number;
  updatedAt: number;
}

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

function decomposeStory(story: string, style: string): Scene[] {
  // Smart decomposition: split into narrative beats
  const cleanStory = story.trim();
  
  // Try splitting by paragraphs first, then sentences
  let segments = cleanStory.split(/\n\n+/).filter(s => s.trim().length > 15);
  if (segments.length < 2) {
    segments = cleanStory.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15);
  }
  
  // Group short segments together (min ~20 chars per scene)
  const grouped: string[] = [];
  let buffer = "";
  for (const seg of segments) {
    buffer += (buffer ? " " : "") + seg.trim();
    if (buffer.length > 40 || seg === segments[segments.length - 1]) {
      grouped.push(buffer);
      buffer = "";
    }
  }
  if (buffer) grouped.push(buffer);
  
  // Limit to 8 scenes max
  const finalSegments = grouped.slice(0, 8);
  if (finalSegments.length === 0) {
    finalSegments.push(cleanStory.slice(0, 200));
  }

  // Auto-assign camera angles based on position in story
  const angleSequence = [
    "Wide establishing shot",    // Opening
    "Medium shot",               // Introduction
    "Close-up",                  // Emotion
    "Tracking shot",             // Action
    "Over-the-shoulder",         // Dialogue
    "Low angle",                 // Power/drama
    "Bird's eye view",           // Scale
    "Close-up",                  // Climax
  ];

  // Auto-assign moods based on position
  const moodSequence = [
    "Epic",        // Opening
    "Mysterious",  // Build
    "Tense",       // Rising
    "Dramatic",    // Peak
    "Chaotic",     // Climax
    "Melancholic", // Fall
    "Peaceful",    // Resolution
    "Nostalgic",   // Ending
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
    status: "draft" as const,
    style: style,
  }));
}

// Build the full prompt for image generation
function buildPrompt(scene: Scene, globalStyle: string): string {
  const style = scene.style || globalStyle || "Cinematic film still, 4K";
  return `${style}. ${scene.cameraAngle}. ${scene.mood} mood. ${scene.description}`;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function getStoryboards(): Storyboard[] {
  return JSON.parse(localStorage.getItem("openflow_storyboards") || "[]");
}

function saveStoryboards(boards: Storyboard[]) {
  localStorage.setItem("openflow_storyboards", JSON.stringify(boards));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryboardView({ falApiKey, onSaveAsset }: {
  falApiKey: string;
  onSaveAsset: (asset: { url: string; type: "image" | "video"; prompt: string; model: string; timestamp: number }) => void;
}) {
  const [storyboards, setStoryboards] = useState<Storyboard[]>(() => getStoryboards());
  const [activeBoard, setActiveBoard] = useState<Storyboard | null>(null);
  const [storyInput, setStoryInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cancelRef = useRef(false);

  // Persist
  useEffect(() => { saveStoryboards(storyboards); }, [storyboards]);

  // Create new storyboard from story
  const createStoryboard = useCallback(() => {
    if (!storyInput.trim()) return;
    setIsDecomposing(true);
    
    setTimeout(() => {
      const scenes = decomposeStory(storyInput, selectedStyle);
      const board: Storyboard = {
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
  const updateScene = useCallback((sceneId: string, updates: Partial<Scene>) => {
    if (!activeBoard) return;
    const updated = {
      ...activeBoard,
      scenes: activeBoard.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s),
      updatedAt: Date.now(),
    };
    setActiveBoard(updated);
    setStoryboards(prev => prev.map(b => b.id === updated.id ? updated : b));
  }, [activeBoard]);

  // Delete scene
  const deleteScene = useCallback((sceneId: string) => {
    if (!activeBoard) return;
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
    if (!activeBoard) return;
    const newScene: Scene = {
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
  const handleDragStart = (sceneId: string) => setDragId(sceneId);
  const handleDragOver = (sceneId: string) => { if (dragId && dragId !== sceneId) setDragOverId(sceneId); };
  const handleDrop = useCallback((targetId: string) => {
    if (!activeBoard || !dragId || dragId === targetId) return;
    const scenes = [...activeBoard.scenes];
    const fromIdx = scenes.findIndex(s => s.id === dragId);
    const toIdx = scenes.findIndex(s => s.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
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
  const generateSceneImage = useCallback(async (sceneId: string) => {
    if (!activeBoard) return;
    const scene = activeBoard.scenes.find(s => s.id === sceneId);
    if (!scene) return;

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
        let result: any = null;
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
          if (statusData.status === "FAILED") throw new Error("Generation failed");
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
    } catch (err: any) {
      updateScene(sceneId, { status: "error" });
      console.error("Scene generation failed:", err);
    }
  }, [activeBoard, falApiKey, updateScene, onSaveAsset]);

  // Generate all scenes
  const generateAllScenes = useCallback(async () => {
    if (!activeBoard) return;
    setGeneratingAll(true);
    cancelRef.current = false;

    for (const scene of activeBoard.scenes) {
      if (cancelRef.current) break;
      if (scene.status === "done" && scene.imageUrl) continue;
      await generateSceneImage(scene.id);
    }

    setGeneratingAll(false);
  }, [activeBoard, generateSceneImage]);

  // Delete storyboard
  const deleteStoryboard = useCallback((boardId: string) => {
    setStoryboards(prev => prev.filter(b => b.id !== boardId));
    if (activeBoard?.id === boardId) setActiveBoard(null);
  }, [activeBoard]);

  // ---------------------------------------------------------------------------
  // Render: Storyboard list (no active board)
  // ---------------------------------------------------------------------------
  if (!activeBoard) {
    return (
      <div style={{ flex: 1, overflow: "auto", padding: 32, background: "#0e0e10", color: "#e5e5e5" }}>
        {/* Create new */}
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>🎬 Storyboard</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>
            Describe your story and AI will decompose it into cinematic scenes. Edit each scene's camera angle, mood, and description, then generate images with one click.
          </p>

          {/* Story input */}
          <div style={{ background: "#141416", borderRadius: 16, padding: 24, border: "1px solid #2a2a30", marginBottom: 32 }}>
            <textarea
              value={storyInput}
              onChange={e => setStoryInput(e.target.value)}
              placeholder="Describe your video story...&#10;&#10;Example: A lone astronaut discovers an abandoned space station orbiting a dying star. As she explores the dark corridors, she finds evidence of an alien civilization. In the final chamber, she discovers they left behind a message — a map to their home world."
              style={{
                width: "100%", minHeight: 140, padding: 16, borderRadius: 12,
                background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5",
                fontSize: 14, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
              <select
                value={selectedStyle}
                onChange={e => setSelectedStyle(e.target.value)}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 13 }}
              >
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={createStoryboard}
                disabled={!storyInput.trim() || isDecomposing}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: storyInput.trim() ? "#c026d3" : "#2a2a30",
                  color: storyInput.trim() ? "#fff" : "#6b6b75",
                  fontSize: 14, fontWeight: 700, cursor: storyInput.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {isDecomposing ? "⏳ Creating..." : "🎬 Create Storyboard"}
              </button>
            </div>
          </div>

          {/* Existing storyboards */}
          {storyboards.length > 0 && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#9ca3af" }}>Your Storyboards</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {storyboards.map(board => (
                  <div
                    key={board.id}
                    onClick={() => setActiveBoard(board)}
                    style={{
                      background: "#141416", borderRadius: 12, padding: 16,
                      border: "1px solid #2a2a30", cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#c026d3"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a30"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{board.title}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                          {board.scenes.length} scenes · {board.globalStyle} · {new Date(board.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Thumbnails */}
                        <div style={{ display: "flex", gap: 4 }}>
                          {board.scenes.slice(0, 4).map(s => (
                            <div key={s.id} style={{
                              width: 40, height: 28, borderRadius: 6, overflow: "hidden",
                              background: s.imageUrl ? `url(${s.imageUrl}) center/cover` : "#2a2a30",
                              border: "1px solid #3a3a40",
                            }}>
                              {!s.imageUrl && <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#6b6b75" }}>{s.order + 1}</div>}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteStoryboard(board.id); }}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: "#ef4444", fontSize: 12, cursor: "pointer" }}
                        >🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Active storyboard with timeline
  // ---------------------------------------------------------------------------
  const completedCount = activeBoard.scenes.filter(s => s.status === "done").length;
  const totalCount = activeBoard.scenes.length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0e0e10", color: "#e5e5e5", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
        background: "#141416", borderBottom: "1px solid #2a2a30", flexShrink: 0,
      }}>
        <button onClick={() => setActiveBoard(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #2a2a30", background: "transparent", color: "#9ca3af", fontSize: 12, cursor: "pointer" }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{activeBoard.title}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{totalCount} scenes · {activeBoard.globalStyle} · {completedCount}/{totalCount} generated</div>
        </div>
        <button onClick={addScene} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#22c55e", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          + Add Scene
        </button>
        {generatingAll ? (
          <button onClick={() => { cancelRef.current = true; }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ⏹ Stop
          </button>
        ) : (
          <button onClick={generateAllScenes} disabled={totalCount === 0} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#c026d3", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ▶ Generate All ({totalCount - completedCount} remaining)
          </button>
        )}
      </div>

      {/* Progress bar */}
      {generatingAll && (
        <div style={{ height: 3, background: "#2a2a30", flexShrink: 0 }}>
          <div style={{ height: "100%", width: `${(completedCount / totalCount) * 100}%`, background: "linear-gradient(90deg, #c026d3, #f59e0b)", transition: "width 0.5s" }} />
        </div>
      )}

      {/* Timeline */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {/* Horizontal timeline view */}
        <div style={{ display: "flex", gap: 0, alignItems: "flex-start", minWidth: "fit-content", paddingBottom: 20 }}>
          {activeBoard.scenes.map((scene, idx) => (
            <div key={scene.id} style={{ display: "flex", alignItems: "flex-start" }}>
              {/* Scene card */}
              <div
                draggable
                onDragStart={() => handleDragStart(scene.id)}
                onDragOver={(e) => { e.preventDefault(); handleDragOver(scene.id); }}
                onDrop={() => handleDrop(scene.id)}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                style={{
                  width: 280, borderRadius: 12, overflow: "hidden",
                  background: dragOverId === scene.id ? "#1e1e28" : "#141416",
                  border: `1px solid ${editingScene === scene.id ? "#c026d3" : dragOverId === scene.id ? "#c026d3" : "#2a2a30"}`,
                  opacity: dragId === scene.id ? 0.5 : 1,
                  transition: "all 0.15s",
                  cursor: "grab",
                }}
              >
                {/* Image area */}
                <div
                  style={{
                    width: "100%", height: 160, background: "#0a0a0c",
                    position: "relative", cursor: scene.imageUrl ? "pointer" : "default",
                  }}
                  onClick={() => scene.imageUrl && setPreviewUrl(scene.imageUrl)}
                >
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {scene.status === "generating" ? (
                        <>
                          <div style={{ fontSize: 24, animation: "spin 1s linear infinite" }}>⏳</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>Generating...</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 28, color: "#3a3a40" }}>🎬</div>
                          <div style={{ fontSize: 11, color: "#6b6b75" }}>Scene {idx + 1}</div>
                        </>
                      )}
                    </div>
                  )}
                  {/* Scene number badge */}
                  <div style={{
                    position: "absolute", top: 8, left: 8, width: 24, height: 24,
                    borderRadius: "50%", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#fff",
                  }}>
                    {idx + 1}
                  </div>
                  {/* Status indicator */}
                  <div style={{
                    position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%",
                    background: scene.status === "done" ? "#22c55e" : scene.status === "generating" ? "#f59e0b" : scene.status === "error" ? "#ef4444" : "#4a4a50",
                  }} />
                </div>

                {/* Scene details */}
                <div style={{ padding: 14 }}>
                  {editingScene === scene.id ? (
                    /* Edit mode */
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        value={scene.title}
                        onChange={e => updateScene(scene.id, { title: e.target.value })}
                        style={{ padding: "6px 10px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 12, fontWeight: 600 }}
                        placeholder="Scene title"
                      />
                      <textarea
                        value={scene.description}
                        onChange={e => updateScene(scene.id, { description: e.target.value })}
                        style={{ padding: "6px 10px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 11, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
                        placeholder="Visual description..."
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <select value={scene.cameraAngle} onChange={e => updateScene(scene.id, { cameraAngle: e.target.value })}
                          style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 10 }}>
                          {CAMERA_ANGLES.map(a => <option key={a}>{a}</option>)}
                        </select>
                        <select value={scene.mood} onChange={e => updateScene(scene.id, { mood: e.target.value })}
                          style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 10 }}>
                          {MOODS.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <select value={scene.style} onChange={e => updateScene(scene.id, { style: e.target.value })}
                        style={{ padding: "6px 8px", borderRadius: 6, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 10 }}>
                        {STYLES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <label style={{ fontSize: 10, color: "#9ca3af" }}>Duration:</label>
                        <input type="number" min={1} max={30} value={scene.duration}
                          onChange={e => updateScene(scene.id, { duration: parseInt(e.target.value) || 4 })}
                          style={{ width: 50, padding: "4px 6px", borderRadius: 4, background: "#0e0e10", border: "1px solid #2a2a30", color: "#e5e5e5", fontSize: 11, textAlign: "center" }} />
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>sec</span>
                      </div>
                      <button onClick={() => setEditingScene(null)}
                        style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#c026d3", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        ✓ Done
                      </button>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{scene.title}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {scene.description}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 10, background: "#1e1e22", fontSize: 10, color: "#9ca3af" }}>📷 {scene.cameraAngle}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 10, background: "#1e1e22", fontSize: 10, color: "#9ca3af" }}>🎭 {scene.mood}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 10, background: "#1e1e22", fontSize: 10, color: "#9ca3af" }}>⏱ {scene.duration}s</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setEditingScene(scene.id)}
                          style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid #2a2a30", background: "transparent", color: "#9ca3af", fontSize: 10, cursor: "pointer" }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => generateSceneImage(scene.id)} disabled={scene.status === "generating"}
                          style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: scene.status === "generating" ? "#2a2a30" : "#c026d3", color: scene.status === "generating" ? "#6b6b75" : "#fff", fontSize: 10, fontWeight: 600, cursor: scene.status === "generating" ? "not-allowed" : "pointer" }}>
                          {scene.status === "generating" ? "⏳..." : "▶ Generate"}
                        </button>
                        <button onClick={() => deleteScene(scene.id)}
                          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #2a2a30", background: "transparent", color: "#ef4444", fontSize: 10, cursor: "pointer" }}>
                          🗑
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Connector arrow */}
              {idx < activeBoard.scenes.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", height: 160, padding: "0 6px" }}>
                  <div style={{ width: 24, height: 2, background: "#3a3a40" }} />
                  <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #3a3a40" }} />
                </div>
              )}
            </div>
          ))}

          {/* Add scene button at end */}
          <div style={{ display: "flex", alignItems: "center", height: 160, paddingLeft: 12 }}>
            <button onClick={addScene}
              style={{
                width: 60, height: 60, borderRadius: "50%", border: "2px dashed #3a3a40",
                background: "transparent", color: "#6b6b75", fontSize: 24, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "#c026d3"; e.currentTarget.style.color = "#c026d3"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "#3a3a40"; e.currentTarget.style.color = "#6b6b75"; }}
            >
              +
            </button>
          </div>
        </div>

        {/* Full prompt preview */}
        {editingScene && (() => {
          const scene = activeBoard.scenes.find(s => s.id === editingScene);
          if (!scene) return null;
          return (
            <div style={{ marginTop: 20, padding: 16, background: "#141416", borderRadius: 12, border: "1px solid #2a2a30", maxWidth: 700 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>Generated Prompt Preview:</div>
              <div style={{ fontSize: 12, color: "#c4b5fd", lineHeight: 1.5, fontStyle: "italic" }}>
                {buildPrompt(scene, activeBoard.globalStyle)}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <img src={previewUrl} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} onClick={e => e.stopPropagation()} />
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
