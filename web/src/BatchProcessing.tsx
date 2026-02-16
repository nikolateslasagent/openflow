/**
 * Batch Processing UI — run multiple generations from comma-separated or line-separated values
 */
import { useState } from "react";

interface BatchJob {
  index: number;
  prompt: string;
  status: "pending" | "running" | "done" | "error";
  result?: string;
  error?: string;
}

export function BatchPanel({ onRunBatch, isRunning }: {
  onRunBatch: (prompts: string[], model: string) => void;
  isRunning: boolean;
}) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState("flux-2-pro");
  const [splitMode, setSplitMode] = useState<"comma" | "line">("line");

  const prompts = input.trim()
    ? (splitMode === "comma" ? input.split(",") : input.split("\n")).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>⚡ Batch Processing</div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12 }}>Generate multiple variations at once</div>

      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Model</div>
      <select value={model} onChange={e => setModel(e.target.value)}
        style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", cursor: "pointer", marginBottom: 8, boxSizing: "border-box", color: "#1a1a1a" }}>
        <option value="flux-2-pro">Flux 2 Pro</option>
        <option value="flux-fast">Flux Fast</option>
        <option value="flux-pro-1.1-ultra">Flux Pro Ultra</option>
        <option value="sd-3.5">SD 3.5</option>
        <option value="dall-e-3">DALL-E 3</option>
        <option value="gpt-image-1.5">GPT Image</option>
      </select>

      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <button onClick={() => setSplitMode("line")}
          style={{ flex: 1, padding: "5px", borderRadius: 6, border: "none", background: splitMode === "line" ? "#c026d3" : "#f5f5f7", color: splitMode === "line" ? "#fff" : "#6b7280", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
          One per line
        </button>
        <button onClick={() => setSplitMode("comma")}
          style={{ flex: 1, padding: "5px", borderRadius: 6, border: "none", background: splitMode === "comma" ? "#c026d3" : "#f5f5f7", color: splitMode === "comma" ? "#fff" : "#6b7280", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
          Comma separated
        </button>
      </div>

      <textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder={splitMode === "line" ? "A sunset over the ocean\nA cat in a spacesuit\nA futuristic city at night" : "sunset, cat in space, futuristic city"}
        rows={6}
        style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, fontSize: 12, padding: "10px 12px", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", color: "#1a1a1a" }} />

      <div style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 8px" }}>
        {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} detected
      </div>

      <button onClick={() => onRunBatch(prompts, model)} disabled={isRunning || prompts.length === 0}
        style={{ width: "100%", padding: 10, background: isRunning || prompts.length === 0 ? "#e5e7eb" : "#c026d3", color: isRunning || prompts.length === 0 ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: isRunning || prompts.length === 0 ? "not-allowed" : "pointer" }}>
        {isRunning ? "⏳ Running..." : `▶ Run Batch (${prompts.length})`}
      </button>
    </div>
  );
}

export function BatchResultsGrid({ jobs }: { jobs: BatchJob[] }) {
  if (jobs.length === 0) return null;
  const done = jobs.filter(j => j.status === "done").length;
  const running = jobs.find(j => j.status === "running");

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 500, maxWidth: 500, maxHeight: 400, overflow: "auto", padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>⚡ Batch Results</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
        {running ? `Generating ${done + 1}/${jobs.length}...` : `${done}/${jobs.length} complete`}
      </div>
      <div style={{ width: "100%", height: 4, background: "#f5f5f7", borderRadius: 2, marginBottom: 12 }}>
        <div style={{ height: "100%", background: "#c026d3", borderRadius: 2, width: `${(done / jobs.length) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
        {jobs.map((job, i) => (
          <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e8e8eb", background: job.status === "running" ? "#faf5ff" : "#fff" }}>
            {job.result ? (
              <img src={job.result} alt="" style={{ width: "100%", height: 80, objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: 80, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af" }}>
                {job.status === "running" ? "⏳" : job.status === "error" ? "❌" : "⏸"}
              </div>
            )}
            <div style={{ padding: "4px 6px", fontSize: 9, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {job.prompt.slice(0, 30)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
