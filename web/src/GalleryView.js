import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * GalleryView — Full-screen comparison gallery for all generated outputs
 * Sprint 6: Filter by model, sort, rate outputs, lightbox navigation, "Use as input"
 */
import { useState, useEffect, useMemo } from "react";
function getRatings() {
    try {
        return JSON.parse(localStorage.getItem("openflow_ratings") || "{}");
    }
    catch {
        return {};
    }
}
function setRating(url, rating) {
    const r = getRatings();
    r[url] = rating;
    localStorage.setItem("openflow_ratings", JSON.stringify(r));
}
export function GalleryView({ assets, onClose, onUseAsInput }) {
    const [filterModel, setFilterModel] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [ratings, setRatings] = useState(getRatings);
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const models = useMemo(() => {
        const s = new Set(assets.map(a => a.model));
        return ["all", ...Array.from(s)];
    }, [assets]);
    const filtered = useMemo(() => {
        let list = filterModel === "all" ? assets : assets.filter(a => a.model === filterModel);
        if (sortBy === "rating") {
            list = [...list].sort((a, b) => (ratings[b.url] || 0) - (ratings[a.url] || 0));
        }
        else {
            list = [...list].sort((a, b) => b.timestamp - a.timestamp);
        }
        return list;
    }, [assets, filterModel, sortBy, ratings]);
    const handleRate = (url, stars) => {
        setRating(url, stars);
        setRatings(getRatings());
    };
    // Keyboard nav for lightbox
    useEffect(() => {
        if (lightboxIdx === null)
            return;
        const handler = (e) => {
            if (e.key === "Escape")
                setLightboxIdx(null);
            if (e.key === "ArrowRight")
                setLightboxIdx(i => i !== null ? Math.min(i + 1, filtered.length - 1) : null);
            if (e.key === "ArrowLeft")
                setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxIdx, filtered.length]);
    const Stars = ({ url }) => {
        const current = ratings[url] || 0;
        return (_jsx("div", { style: { display: "flex", gap: 2 }, children: [1, 2, 3, 4, 5].map(s => (_jsx("span", { onClick: (e) => { e.stopPropagation(); handleRate(url, s === current ? 0 : s); }, style: { cursor: "pointer", fontSize: 14, color: s <= current ? "#f59e0b" : "#d1d5db" }, children: "\u2605" }, s))) }));
    };
    return (_jsxs("div", { style: { position: "fixed", inset: 0, background: "#f0f0f2", zIndex: 900, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e8e8eb" }, children: [_jsx("span", { style: { fontSize: 16, fontWeight: 700, color: "#1a1a1a" }, children: "\uD83D\uDDBC\uFE0F Gallery" }), _jsx("select", { value: filterModel, onChange: e => setFilterModel(e.target.value), style: { padding: "6px 10px", borderRadius: 8, border: "1px solid #e8e8eb", fontSize: 12, background: "#f5f5f7" }, children: models.map(m => _jsx("option", { value: m, children: m === "all" ? "All Models" : m }, m)) }), _jsxs("select", { value: sortBy, onChange: e => setSortBy(e.target.value), style: { padding: "6px 10px", borderRadius: 8, border: "1px solid #e8e8eb", fontSize: 12, background: "#f5f5f7" }, children: [_jsx("option", { value: "date", children: "Sort by Date" }), _jsx("option", { value: "rating", children: "Sort by Rating" })] }), _jsxs("span", { style: { fontSize: 12, color: "#9ca3af" }, children: [filtered.length, " items"] }), _jsx("div", { style: { flex: 1 } }), _jsx("button", { onClick: onClose, style: { padding: "6px 16px", borderRadius: 8, border: "1px solid #e8e8eb", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "\u2715 Close" })] }), _jsxs("div", { style: { flex: 1, overflow: "auto", padding: 20 }, children: [filtered.length === 0 && _jsx("div", { style: { textAlign: "center", color: "#9ca3af", fontSize: 14, padding: 60 }, children: "No outputs yet. Generate some images or videos!" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }, children: filtered.map((asset, i) => (_jsxs("div", { onClick: () => setLightboxIdx(i), style: { borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8eb", background: "#fff", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }, onMouseOver: e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }, onMouseOut: e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }, children: [asset.type === "video" ? (_jsx("video", { src: asset.url, style: { width: "100%", height: 180, objectFit: "cover" }, muted: true })) : (_jsx("img", { src: asset.url, alt: "", loading: "lazy", style: { width: "100%", height: 180, objectFit: "cover" } })), _jsxs("div", { style: { padding: "10px 12px" }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: "#1a1a1a" }, children: asset.model }), _jsx("div", { style: { fontSize: 10, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: asset.prompt }), _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }, children: [_jsx(Stars, { url: asset.url }), _jsx("button", { onClick: (e) => { e.stopPropagation(); onUseAsInput(asset.url); onClose(); }, style: { padding: "3px 8px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer" }, children: "Use as Input" })] })] })] }, `${asset.url}-${i}`))) })] }), lightboxIdx !== null && filtered[lightboxIdx] && (_jsx("div", { onClick: () => setLightboxIdx(null), style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 950, display: "flex", alignItems: "center", justifyContent: "center" }, children: _jsxs("div", { onClick: e => e.stopPropagation(), style: { maxWidth: "90vw", maxHeight: "90vh", position: "relative" }, children: [lightboxIdx > 0 && (_jsx("button", { onClick: () => setLightboxIdx(i => i - 1), style: { position: "absolute", left: -50, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }, children: "\u2039" })), lightboxIdx < filtered.length - 1 && (_jsx("button", { onClick: () => setLightboxIdx(i => i + 1), style: { position: "absolute", right: -50, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }, children: "\u203A" })), filtered[lightboxIdx].type === "video" ? (_jsx("video", { src: filtered[lightboxIdx].url, controls: true, autoPlay: true, style: { maxWidth: "85vw", maxHeight: "80vh", borderRadius: 12 } })) : (_jsx("img", { src: filtered[lightboxIdx].url, alt: "", style: { maxWidth: "85vw", maxHeight: "80vh", borderRadius: 12, objectFit: "contain" } })), _jsxs("div", { style: { textAlign: "center", marginTop: 12, display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }, children: [_jsx(Stars, { url: filtered[lightboxIdx].url }), _jsx("span", { style: { color: "#9ca3af", fontSize: 12 }, children: filtered[lightboxIdx].model }), _jsx("button", { onClick: () => { onUseAsInput(filtered[lightboxIdx].url); onClose(); }, style: { padding: "6px 14px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }, children: "Use as Input" }), _jsxs("span", { style: { color: "#6b6b75", fontSize: 11 }, children: [lightboxIdx + 1, " / ", filtered.length] })] })] }) }))] }));
}
