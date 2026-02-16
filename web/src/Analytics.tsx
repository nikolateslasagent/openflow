/**
 * Analytics Dashboard, Cost Estimator, Usage Quotas, Model Comparison
 * Sprint 13
 */
import { useState, useMemo } from "react";
import { getTrainingRecords } from "./TrainingData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Asset {
  url: string;
  type: "image" | "video";
  prompt: string;
  model: string;
  timestamp: number;
}

interface TrainingRecord {
  model: string;
  prompt: string;
  timestamp: number;
  params?: Record<string, unknown>;
  duration_ms?: number;
  output_type?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Cost model
// ---------------------------------------------------------------------------
const MODEL_COSTS: Record<string, number> = {
  // Image models ~$0.01-0.05
  "flux-2-pro": 0.04, "flux-2-dev-lora": 0.03, "flux-2-flex": 0.03,
  "flux-pro-1.1-ultra": 0.05, "flux-pro-1.1": 0.04, "flux-fast": 0.01,
  "nano-banana-pro": 0.01, "sd-3.5": 0.02, "dall-e-3": 0.04,
  "gpt-image-1.5": 0.05, "grok-image": 0.03, "imagen-4": 0.05,
  "imagen-3": 0.04, "imagen-3-fast": 0.02, "ideogram-v3": 0.04,
  "recraft-v3": 0.03, "reve": 0.03, "higgsfield-image": 0.03,
  "flux-pro": 0.04, "real-esrgan": 0.02, "clarity-upscaler": 0.03,
  // Video models ~$0.10-0.50
  "kling-3.0-pro": 0.50, "kling-2.6-pro": 0.40, "kling-2.0": 0.30,
  "wan-2.1": 0.25, "wan-2.1-1.3b": 0.15, "minimax-hailuo": 0.30,
  "hunyuan": 0.20, "luma-ray-2": 0.35, "ltx-video": 0.15,
  "ltx-2-19b": 0.25, "veo-3.1": 0.50, "grok-video": 0.30,
  "cogvideox-5b": 0.20, "mochi-v1": 0.10,
  // LLM
  "gpt-4o-mini": 0.01, "gpt-4o": 0.03, "gpt-4": 0.06,
};

const VIDEO_MODELS = new Set(["kling-3.0-pro", "kling-2.6-pro", "kling-2.0", "wan-2.1", "wan-2.1-1.3b", "minimax-hailuo", "hunyuan", "luma-ray-2", "ltx-video", "ltx-2-19b", "veo-3.1", "grok-video", "cogvideox-5b", "mochi-v1"]);
const LLM_MODELS = new Set(["gpt-4o-mini", "gpt-4o", "gpt-4"]);

function getCost(model: string): number {
  return MODEL_COSTS[model] || 0.03;
}

function getModelType(model: string): "video" | "text" | "image" {
  if (VIDEO_MODELS.has(model)) return "video";
  if (LLM_MODELS.has(model)) return "text";
  return "image";
}

// ---------------------------------------------------------------------------
// SVG Charts (no library)
// ---------------------------------------------------------------------------

function LineChart({ data, width = 320, height = 120 }: { data: { label: string; value: number }[]; width?: number; height?: number }) {
  if (data.length === 0) return <div style={{ color: "#9ca3af", fontSize: 11 }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const pad = { top: 10, right: 10, bottom: 24, left: 30 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * w,
    y: pad.top + h - (d.value / max) * h,
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = line + ` L${points[points.length - 1].x},${pad.top + h} L${points[0].x},${pad.top + h} Z`;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c026d3" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c026d3" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={pad.left} x2={width - pad.right} y1={pad.top + h * (1 - f)} y2={pad.top + h * (1 - f)} stroke="#e8e8eb" strokeWidth="0.5" />
      ))}
      <path d={area} fill="url(#lineGrad)" />
      <path d={line} fill="none" stroke="#c026d3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#c026d3" />
          <text x={p.x} y={pad.top + h + 14} textAnchor="middle" fontSize="8" fill="#9ca3af">{data[i].label}</text>
          <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="7" fill="#6b7280">{data[i].value}</text>
        </g>
      ))}
      {/* Y axis label */}
      <text x={pad.left - 4} y={pad.top + 4} textAnchor="end" fontSize="7" fill="#9ca3af">{max}</text>
      <text x={pad.left - 4} y={pad.top + h} textAnchor="end" fontSize="7" fill="#9ca3af">0</text>
    </svg>
  );
}

function BarChart({ data, width = 320, height = 120 }: { data: { label: string; value: number; color?: string }[]; width?: number; height?: number }) {
  if (data.length === 0) return <div style={{ color: "#9ca3af", fontSize: 11 }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(40, (width - 40) / data.length - 8);
  const colors = ["#c026d3", "#6366f1", "#14b8a6", "#f59e0b", "#ec4899"];

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 30);
        const x = 30 + i * (barW + 8);
        return (
          <g key={i}>
            <rect x={x} y={height - 20 - barH} width={barW} height={barH} rx="4" fill={d.color || colors[i % colors.length]} opacity="0.85" />
            <text x={x + barW / 2} y={height - 22 - barH} textAnchor="middle" fontSize="8" fill="#6b7280">{d.value}</text>
            <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize="7" fill="#9ca3af">{d.label.length > 8 ? d.label.slice(0, 8) + "…" : d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart({ data, size = 100 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ color: "#9ca3af", fontSize: 11 }}>No data</div>;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  let startAngle = -Math.PI / 2;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={size} height={size}>
        {data.map((d, i) => {
          const angle = (d.value / total) * Math.PI * 2;
          const endAngle = startAngle + angle;
          const largeArc = angle > Math.PI ? 1 : 0;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
          startAngle = endAngle;
          return <path key={i} d={path} fill={d.color} opacity="0.85" />;
        })}
      </svg>
      <div>
        {data.map(d => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
            <span style={{ fontSize: 10, color: "#6b7280" }}>{d.label}: {d.value} ({total > 0 ? Math.round(d.value / total * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics Dashboard Section (for embedding in Dashboard)
// ---------------------------------------------------------------------------
export function AnalyticsDashboard({ assets }: { assets: Asset[] }) {
  const records: TrainingRecord[] = useMemo(() => {
    try { return getTrainingRecords() as unknown as TrainingRecord[]; } catch { return []; }
  }, []);

  const allItems = useMemo(() => {
    const fromAssets = assets.map(a => ({ model: a.model, type: a.type, timestamp: a.timestamp, prompt: a.prompt }));
    const fromRecords = records.map(r => ({ model: r.model, type: getModelType(r.model), timestamp: r.timestamp, prompt: r.prompt }));
    const merged = [...fromAssets];
    // Add records not already covered by assets (dedupe by timestamp)
    const assetTs = new Set(assets.map(a => a.timestamp));
    fromRecords.forEach(r => { if (!assetTs.has(r.timestamp)) merged.push(r as any); });
    return merged;
  }, [assets, records]);

  // Generations per day (last 7 days)
  const dailyData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const count = allItems.filter(a => a.timestamp >= d.getTime() && a.timestamp < next.getTime()).length;
      days.push({ label: d.toLocaleDateString("en", { weekday: "short" }), value: count });
    }
    return days;
  }, [allItems]);

  // Top 5 models
  const topModels = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach(a => { counts[a.model] = (counts[a.model] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
  }, [allItems]);

  // Type split
  const typeSplit = useMemo(() => {
    let img = 0, vid = 0, txt = 0;
    allItems.forEach(a => { const t = (a as any).type || getModelType(a.model); if (t === "video") vid++; else if (t === "text") txt++; else img++; });
    return [
      { label: "Image", value: img, color: "#ec4899" },
      { label: "Video", value: vid, color: "#f59e0b" },
      { label: "Text", value: txt, color: "#6366f1" },
    ];
  }, [allItems]);

  // Cost estimates
  const costData = useMemo(() => {
    let total = 0;
    const perModel: Record<string, number> = {};
    const perDay: Record<string, number> = {};
    allItems.forEach(a => {
      const c = getCost(a.model);
      total += c;
      perModel[a.model] = (perModel[a.model] || 0) + c;
      const day = new Date(a.timestamp).toLocaleDateString();
      perDay[day] = (perDay[day] || 0) + c;
    });
    const days = Object.keys(perDay).length || 1;
    return { total, avgPerDay: total / days, perModel, perDay };
  }, [allItems]);

  // Budget alert
  const [budgetThreshold] = useState(() => parseFloat(localStorage.getItem("openflow_budget_threshold") || "0"));
  const todayStr = new Date().toLocaleDateString();
  const todaySpend = costData.perDay[todayStr] || 0;
  const overBudget = budgetThreshold > 0 && todaySpend >= budgetThreshold;

  const avgGenTime = useMemo(() => {
    const durations = records.filter(r => r.duration_ms).map(r => r.duration_ms!);
    if (durations.length === 0) return "~12s";
    return (durations.reduce((a, b) => a + b, 0) / durations.length / 1000).toFixed(1) + "s";
  }, [records]);

  // Workflow stats
  const workflowStats = useMemo(() => {
    try {
      const raw = localStorage.getItem("openflow_workflow_stats");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);

  const mostProductiveWorkflow = useMemo(() => {
    const entries = Object.entries(workflowStats) as [string, { runs: number; name: string }][];
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1].runs - a[1].runs)[0];
  }, [workflowStats]);

  return (
    <>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Total Generations", value: allItems.length, icon: "⚡", gradient: "linear-gradient(135deg, #c026d3, #ec4899)" },
          { label: "Avg Gen Time", value: avgGenTime, icon: "⏱", gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
          { label: "Models Used", value: new Set(allItems.map(a => a.model)).size || 0, icon: "🤖", gradient: "linear-gradient(135deg, #14b8a6, #06b6d4)" },
          { label: "Est. Total Cost", value: "$" + costData.total.toFixed(2), icon: "💰", gradient: "linear-gradient(135deg, #f59e0b, #f97316)" },
        ].map(stat => (
          <div key={stat.label} style={{ padding: "18px", background: "#ffffff", border: "1px solid #e8e8eb", borderRadius: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: stat.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "#fff", border: "1px solid #e8e8eb", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>📈 Generations (Last 7 Days)</div>
          <LineChart data={dailyData} width={340} height={130} />
        </div>
        <div style={{ background: "#fff", border: "1px solid #e8e8eb", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>📊 Top Models</div>
          <BarChart data={topModels} width={340} height={130} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "#fff", border: "1px solid #e8e8eb", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>🎯 Generation Types</div>
          <PieChart data={typeSplit} size={100} />
        </div>

        {/* Cost Section */}
        <div style={{ background: "#fff", border: overBudget ? "2px solid #ef4444" : "1px solid #e8e8eb", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>💰 Cost Estimator</div>
          {overBudget && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: "#dc2626", fontWeight: 600 }}>
              ⚠️ Budget Alert! Today's spend (${todaySpend.toFixed(2)}) exceeds threshold (${budgetThreshold.toFixed(2)})
            </div>
          )}
          <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 2 }}>
            Today: <b style={{ color: "#1a1a1a" }}>${todaySpend.toFixed(2)}</b><br />
            Daily avg: <b style={{ color: "#1a1a1a" }}>${costData.avgPerDay.toFixed(2)}</b><br />
            Total est: <b style={{ color: "#1a1a1a" }}>${costData.total.toFixed(2)}</b>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 3 }}>Top cost models:</div>
            {Object.entries(costData.perModel).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m, c]) => (
              <div key={m} style={{ fontSize: 10, color: "#6b7280" }}>{m}: ${c.toFixed(2)}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Productive Workflow */}
      {mostProductiveWorkflow && (
        <div style={{ background: "linear-gradient(135deg, #c026d310, #6366f110)", border: "1px solid #c026d330", borderRadius: 14, padding: 16, marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>🏆 Most Productive Workflow</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#c026d3" }}>{mostProductiveWorkflow[1].name || mostProductiveWorkflow[0]}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{mostProductiveWorkflow[1].runs} runs</div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Usage Quotas Section (for Settings panel)
// ---------------------------------------------------------------------------
export function UsageQuotasSection() {
  const [dailyLimit, setDailyLimit] = useState(() => parseInt(localStorage.getItem("openflow_daily_limit") || "0"));
  const [budgetThreshold, setBudgetThreshold] = useState(() => parseFloat(localStorage.getItem("openflow_budget_threshold") || "0"));

  // Get today's usage count
  const todayUsage = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const lastReset = localStorage.getItem("openflow_quota_reset_date");
    if (lastReset !== today.toDateString()) {
      localStorage.setItem("openflow_quota_reset_date", today.toDateString());
      localStorage.setItem("openflow_today_count", "0");
      return 0;
    }
    return parseInt(localStorage.getItem("openflow_today_count") || "0");
  }, []);

  const pct = dailyLimit > 0 ? Math.min(100, (todayUsage / dailyLimit) * 100) : 0;
  const barColor = pct >= 100 ? "#ef4444" : pct >= 90 ? "#f59e0b" : pct >= 80 ? "#eab308" : "#c026d3";

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Usage Quotas</div>

      <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Daily generation limit (0 = unlimited)</div>
      <input type="number" min="0" value={dailyLimit} onChange={(e) => { const v = parseInt(e.target.value) || 0; setDailyLimit(v); localStorage.setItem("openflow_daily_limit", String(v)); }}
        style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />

      {dailyLimit > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280", marginBottom: 3 }}>
            <span>Today: {todayUsage} / {dailyLimit}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div style={{ width: "100%", height: 6, background: "#e8e8eb", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3, transition: "width 0.3s" }} />
          </div>
          {pct >= 80 && pct < 100 && <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 3 }}>⚠️ Approaching daily limit</div>}
          {pct >= 100 && <div style={{ fontSize: 9, color: "#ef4444", marginTop: 3 }}>🚫 Daily limit reached!</div>}
        </div>
      )}

      <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>Budget alert threshold ($/day, 0 = off)</div>
      <input type="number" min="0" step="0.5" value={budgetThreshold} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setBudgetThreshold(v); localStorage.setItem("openflow_budget_threshold", String(v)); }}
        style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model Comparison Tool (panel)
// ---------------------------------------------------------------------------
const ALL_MODELS = [
  "flux-2-pro", "flux-fast", "flux-pro-1.1-ultra", "sd-3.5", "dall-e-3",
  "gpt-image-1.5", "grok-image", "imagen-4", "ideogram-v3", "recraft-v3",
  "wan-2.1", "kling-3.0-pro", "minimax-hailuo", "luma-ray-2",
];

interface ComparisonResult {
  model: string;
  imageUrl?: string;
  genTime: number;
  cost: number;
  rating: number;
  winner: boolean;
}

export function ModelComparisonPanel({ onGenerate }: { onGenerate?: (model: string, prompt: string) => Promise<{ url: string; time: number } | null> }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [running, setRunning] = useState(false);

  const toggleModel = (m: string) => {
    setSelected(prev => prev.includes(m) ? prev.filter(x => x !== m) : prev.length >= 4 ? prev : [...prev, m]);
  };

  const runComparison = async () => {
    if (!prompt.trim() || selected.length < 2) return;
    setRunning(true);
    const newResults: ComparisonResult[] = [];
    for (const model of selected) {
      const start = Date.now();
      let url: string | undefined;
      try {
        if (onGenerate) {
          const res = await onGenerate(model, prompt);
          url = res?.url;
        }
      } catch {}
      const elapsed = (Date.now() - start) / 1000;
      newResults.push({ model, imageUrl: url, genTime: elapsed, cost: getCost(model), rating: 0, winner: false });
    }
    setResults(newResults);
    setRunning(false);
  };

  const rateModel = (idx: number, rating: number) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, rating } : r));
  };

  const pickWinner = (idx: number) => {
    setResults(prev => prev.map((r, i) => ({ ...r, winner: i === idx })));
    // Save to localStorage for analytics
    const winner = results[idx];
    if (winner) {
      const history = JSON.parse(localStorage.getItem("openflow_comparison_winners") || "[]");
      history.push({ model: winner.model, prompt, timestamp: Date.now() });
      localStorage.setItem("openflow_comparison_winners", JSON.stringify(history));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>⚖️ Compare Models</div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12 }}>Select 2-4 models, enter a prompt, compare results</div>

      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Select Models ({selected.length}/4)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {ALL_MODELS.map(m => (
          <button key={m} onClick={() => toggleModel(m)} style={{
            padding: "4px 8px", borderRadius: 6, border: selected.includes(m) ? "2px solid #c026d3" : "1px solid #e8e8eb",
            background: selected.includes(m) ? "#c026d310" : "#f5f5f7", fontSize: 9, fontWeight: 500,
            color: selected.includes(m) ? "#c026d3" : "#6b7280", cursor: "pointer",
          }}>{m}</button>
        ))}
      </div>

      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter prompt to test..."
        rows={3} style={{ width: "100%", background: "#f5f5f7", border: "none", borderRadius: 10, fontSize: 12, padding: "10px 12px", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }} />

      <button onClick={runComparison} disabled={running || selected.length < 2 || !prompt.trim()}
        style={{ width: "100%", padding: "10px", background: running ? "#e5e7eb" : "#c026d3", color: running ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: running ? "not-allowed" : "pointer", marginBottom: 16 }}>
        {running ? "Generating..." : `Compare ${selected.length} Models ✦`}
      </button>

      {/* Results Grid */}
      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(results.length, 2)}, 1fr)`, gap: 8 }}>
          {results.map((r, i) => (
            <div key={r.model} style={{ background: r.winner ? "#c026d308" : "#fff", border: r.winner ? "2px solid #c026d3" : "1px solid #e8e8eb", borderRadius: 10, padding: 10, textAlign: "center" }}>
              {r.winner && <div style={{ fontSize: 9, fontWeight: 700, color: "#c026d3", marginBottom: 4 }}>🏆 WINNER</div>}
              <div style={{ fontSize: 10, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>{r.model}</div>
              {r.imageUrl ? (
                <img src={r.imageUrl} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 6 }} />
              ) : (
                <div style={{ width: "100%", height: 80, background: "#f5f5f7", borderRadius: 6, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af" }}>No preview</div>
              )}
              <div style={{ fontSize: 9, color: "#6b7280" }}>⏱ {r.genTime.toFixed(1)}s · 💰 ${r.cost.toFixed(2)}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 2, margin: "6px 0" }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => rateModel(i, s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: s <= r.rating ? 1 : 0.3 }}>⭐</button>
                ))}
              </div>
              <button onClick={() => pickWinner(i)} style={{ padding: "4px 10px", background: "#f5f5f7", border: "1px solid #e8e8eb", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer", color: "#1a1a1a" }}>Pick Winner</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workflow Stats Tracker (call after each workflow run)
// ---------------------------------------------------------------------------
export function trackWorkflowRun(workflowName: string, genTimeMs: number, success: boolean) {
  try {
    const stats = JSON.parse(localStorage.getItem("openflow_workflow_stats") || "{}");
    if (!stats[workflowName]) stats[workflowName] = { name: workflowName, runs: 0, totalTime: 0, successes: 0 };
    stats[workflowName].runs++;
    stats[workflowName].totalTime += genTimeMs;
    if (success) stats[workflowName].successes++;
    localStorage.setItem("openflow_workflow_stats", JSON.stringify(stats));
  } catch {}
}

// Increment daily usage counter
export function incrementDailyUsage(): boolean {
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem("openflow_quota_reset_date");
  if (lastReset !== today) {
    localStorage.setItem("openflow_quota_reset_date", today);
    localStorage.setItem("openflow_today_count", "1");
    return true;
  }
  const count = parseInt(localStorage.getItem("openflow_today_count") || "0") + 1;
  localStorage.setItem("openflow_today_count", String(count));
  const limit = parseInt(localStorage.getItem("openflow_daily_limit") || "0");
  if (limit > 0 && count > limit) return false; // over limit
  return true;
}

// ---------------------------------------------------------------------------
// Workflow Stats Display (for Projects panel)
// ---------------------------------------------------------------------------
export function WorkflowStatsInline({ name }: { name: string }) {
  const stats = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem("openflow_workflow_stats") || "{}");
      return all[name] || null;
    } catch { return null; }
  }, [name]);

  if (!stats) return null;
  const successRate = stats.runs > 0 ? Math.round((stats.successes / stats.runs) * 100) : 0;
  return (
    <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
      {stats.runs} runs · {successRate}% success · {(stats.totalTime / stats.runs / 1000).toFixed(1)}s avg
    </div>
  );
}
