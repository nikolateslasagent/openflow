/**
 * GalleryView — Full-screen comparison gallery for all generated outputs
 * Sprint 6: Filter by model, sort, rate outputs, lightbox navigation, "Use as input"
 */
import { useState, useEffect, useMemo } from "react";

interface Asset {
  url: string;
  type: "image" | "video";
  prompt: string;
  model: string;
  timestamp: number;
}

interface GalleryViewProps {
  assets: Asset[];
  onClose: () => void;
  onUseAsInput: (url: string) => void;
}

function getRatings(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem("openflow_ratings") || "{}"); } catch { return {}; }
}
function setRating(url: string, rating: number) {
  const r = getRatings();
  r[url] = rating;
  localStorage.setItem("openflow_ratings", JSON.stringify(r));
}

export function GalleryView({ assets, onClose, onUseAsInput }: GalleryViewProps) {
  const [filterModel, setFilterModel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");
  const [ratings, setRatings] = useState(getRatings);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const models = useMemo(() => {
    const s = new Set(assets.map(a => a.model));
    return ["all", ...Array.from(s)];
  }, [assets]);

  const filtered = useMemo(() => {
    let list = filterModel === "all" ? assets : assets.filter(a => a.model === filterModel);
    if (sortBy === "rating") {
      list = [...list].sort((a, b) => (ratings[b.url] || 0) - (ratings[a.url] || 0));
    } else {
      list = [...list].sort((a, b) => b.timestamp - a.timestamp);
    }
    return list;
  }, [assets, filterModel, sortBy, ratings]);

  const handleRate = (url: string, stars: number) => {
    setRating(url, stars);
    setRatings(getRatings());
  };

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx(i => i !== null ? Math.min(i + 1, filtered.length - 1) : null);
      if (e.key === "ArrowLeft") setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, filtered.length]);

  const Stars = ({ url }: { url: string }) => {
    const current = ratings[url] || 0;
    return (
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} onClick={(e) => { e.stopPropagation(); handleRate(url, s === current ? 0 : s); }}
            style={{ cursor: "pointer", fontSize: 14, color: s <= current ? "#f59e0b" : "#d1d5db" }}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#f0f0f2", zIndex: 900, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e8e8eb" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>🖼️ Gallery</span>
        <select value={filterModel} onChange={e => setFilterModel(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e8e8eb", fontSize: 12, background: "#f5f5f7" }}>
          {models.map(m => <option key={m} value={m}>{m === "all" ? "All Models" : m}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as "date" | "rating")}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e8e8eb", fontSize: 12, background: "#f5f5f7" }}>
          <option value="date">Sort by Date</option>
          <option value="rating">Sort by Rating</option>
        </select>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtered.length} items</span>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e8e8eb", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✕ Close</button>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {filtered.length === 0 && <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: 60 }}>No outputs yet. Generate some images or videos!</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {filtered.map((asset, i) => (
            <div key={`${asset.url}-${i}`} onClick={() => setLightboxIdx(i)}
              style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8eb", background: "#fff", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
              {asset.type === "video" ? (
                <video src={asset.url} style={{ width: "100%", height: 180, objectFit: "cover" }} muted />
              ) : (
                <img src={asset.url} alt="" loading="lazy" style={{ width: "100%", height: 180, objectFit: "cover" }} />
              )}
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>{asset.model}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.prompt}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                  <Stars url={asset.url} />
                  <button onClick={(e) => { e.stopPropagation(); onUseAsInput(asset.url); onClose(); }}
                    style={{ padding: "3px 8px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>Use as Input</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && filtered[lightboxIdx] && (
        <div onClick={() => setLightboxIdx(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 950, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", position: "relative" }}>
            {lightboxIdx > 0 && (
              <button onClick={() => setLightboxIdx(i => i! - 1)} style={{ position: "absolute", left: -50, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>‹</button>
            )}
            {lightboxIdx < filtered.length - 1 && (
              <button onClick={() => setLightboxIdx(i => i! + 1)} style={{ position: "absolute", right: -50, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>›</button>
            )}
            {filtered[lightboxIdx].type === "video" ? (
              <video src={filtered[lightboxIdx].url} controls autoPlay style={{ maxWidth: "85vw", maxHeight: "80vh", borderRadius: 12 }} />
            ) : (
              <img src={filtered[lightboxIdx].url} alt="" style={{ maxWidth: "85vw", maxHeight: "80vh", borderRadius: 12, objectFit: "contain" }} />
            )}
            <div style={{ textAlign: "center", marginTop: 12, display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
              <Stars url={filtered[lightboxIdx].url} />
              <span style={{ color: "#9ca3af", fontSize: 12 }}>{filtered[lightboxIdx].model}</span>
              <button onClick={() => { onUseAsInput(filtered[lightboxIdx].url); onClose(); }}
                style={{ padding: "6px 14px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Use as Input</button>
              <span style={{ color: "#6b6b75", fontSize: 11 }}>{lightboxIdx + 1} / {filtered.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
