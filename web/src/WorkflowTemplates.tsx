export interface WorkflowPipeline {
  name: string;
  icon: string;
  description: string;
  color: string;
  nodes: Array<{ defId: string; values?: Record<string, unknown>; x: number; y: number }>;
  edges: Array<{ from: number; to: number }>;
}

export const WORKFLOW_PIPELINES: WorkflowPipeline[] = [
  {
    name: "Batch Generate",
    icon: "🔄",
    description: "Generate N variations of a prompt with different seeds",
    color: "#6366f1",
    nodes: [
      { defId: "text.input", values: { text: "A majestic castle on a floating island, dramatic clouds, fantasy art, 8k" }, x: 80, y: 200 },
      { defId: "image.text_to_image", values: { model: "flux-pro-1.1", seed: 1, width: 1024, height: 1024 }, x: 480, y: 50 },
      { defId: "image.text_to_image", values: { model: "flux-pro-1.1", seed: 42, width: 1024, height: 1024 }, x: 480, y: 250 },
      { defId: "image.text_to_image", values: { model: "flux-pro-1.1", seed: 123, width: 1024, height: 1024 }, x: 480, y: 450 },
      { defId: "image.text_to_image", values: { model: "flux-pro-1.1", seed: 999, width: 1024, height: 1024 }, x: 480, y: 650 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4 }],
  },
  {
    name: "Style Transfer Pipeline",
    icon: "🎨",
    description: "Image → describe → regenerate in a new style",
    color: "#ec4899",
    nodes: [
      { defId: "image.text_to_image", values: { prompt: "A serene Japanese garden with cherry blossoms", model: "flux-pro-1.1", width: 1024, height: 1024 }, x: 80, y: 150 },
      { defId: "text.llm", values: { prompt: "Describe this image in detail for art recreation", system: "You are an art director. Describe images for recreation in different styles.", model: "gpt-4o" }, x: 480, y: 150 },
      { defId: "image.text_to_image", values: { prompt: "[Described scene] in watercolor painting style", model: "reve", width: 1024, height: 1024 }, x: 880, y: 50 },
      { defId: "image.text_to_image", values: { prompt: "[Described scene] in cyberpunk neon style", model: "ideogram-v3", width: 1024, height: 1024 }, x: 880, y: 300 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }],
  },
  {
    name: "Video Storyboard",
    icon: "🎬",
    description: "Text → scenes → images → videos → merge",
    color: "#f59e0b",
    nodes: [
      { defId: "text.input", values: { text: "A spaceship launches from Earth, flies through an asteroid belt, and lands on a crystal planet" }, x: 80, y: 250 },
      { defId: "image.text_to_image", values: { prompt: "Cinematic: spaceship launching from Earth, fire and smoke, dramatic angle", model: "flux-pro-1.1-ultra", width: 1280, height: 720 }, x: 480, y: 50 },
      { defId: "image.text_to_image", values: { prompt: "Cinematic: spaceship flying through asteroid belt, debris, stars", model: "flux-pro-1.1-ultra", width: 1280, height: 720 }, x: 480, y: 250 },
      { defId: "image.text_to_image", values: { prompt: "Cinematic: spaceship landing on crystal planet, alien landscape", model: "flux-pro-1.1-ultra", width: 1280, height: 720 }, x: 480, y: 450 },
      { defId: "video.text_to_video", values: { prompt: "Spaceship launching, camera follows upward, cinematic", model: "wan-2.1", duration: 4, width: 1280, height: 720 }, x: 880, y: 50 },
      { defId: "video.text_to_video", values: { prompt: "Flying through asteroid belt, dodging rocks, POV", model: "wan-2.1", duration: 4, width: 1280, height: 720 }, x: 880, y: 250 },
      { defId: "video.text_to_video", values: { prompt: "Spaceship landing on alien crystal planet, wide shot", model: "wan-2.1", duration: 4, width: 1280, height: 720 }, x: 880, y: 450 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 1, to: 4 }, { from: 2, to: 5 }, { from: 3, to: 6 }],
  },
  {
    name: "A/B Testing",
    icon: "⚖️",
    description: "Same prompt, different models — compare outputs",
    color: "#14b8a6",
    nodes: [
      { defId: "text.input", values: { text: "A mystical forest with bioluminescent plants, ethereal mist, cinematic lighting" }, x: 80, y: 250 },
      { defId: "image.text_to_image", values: { model: "flux-pro-1.1-ultra", width: 1024, height: 1024 }, x: 480, y: 50 },
      { defId: "image.text_to_image", values: { model: "dall-e-3", width: 1024, height: 1024 }, x: 480, y: 230 },
      { defId: "image.text_to_image", values: { model: "ideogram-v3", width: 1024, height: 1024 }, x: 480, y: 410 },
      { defId: "image.text_to_image", values: { model: "recraft-v3", width: 1024, height: 1024 }, x: 480, y: 590 },
    ],
    edges: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4 }],
  },
];

export function WorkflowTemplatesPanel({ onLoadPipeline }: { onLoadPipeline: (pipeline: WorkflowPipeline) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        🤖 Workflow Templates
      </div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12 }}>Pre-built agent pipelines — click to load onto canvas</div>
      {WORKFLOW_PIPELINES.map(p => (
        <div key={p.name} onClick={() => onLoadPipeline(p)} style={{
          padding: 14, background: "#fafafa", borderRadius: 12, marginBottom: 8,
          border: "1px solid #ebebee", cursor: "pointer", transition: "all 0.15s",
        }}
          onMouseOver={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = "#fff"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "#ebebee"; e.currentTarget.style.background = "#fafafa"; }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{p.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{p.name}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4, marginBottom: 8 }}>{p.description}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 9, padding: "3px 8px", background: p.color + "15", color: p.color, borderRadius: 4, fontWeight: 600 }}>
              {p.nodes.length} nodes
            </span>
            <span style={{ fontSize: 9, padding: "3px 8px", background: "#f5f5f7", color: "#6b7280", borderRadius: 4, fontWeight: 600 }}>
              {p.edges.length} connections
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
