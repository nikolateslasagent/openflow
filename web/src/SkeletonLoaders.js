import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.3s ease-out forwards; }
`;
const skeletonBase = {
    background: "linear-gradient(90deg, #f0f0f2 25%, #e8e8eb 50%, #f0f0f2 75%)",
    backgroundSize: "800px 100%",
    animation: "shimmer 1.5s infinite linear",
    borderRadius: 10,
};
export function SkeletonStyles() {
    return _jsx("style", { children: shimmerStyle });
}
export function DashboardCardSkeleton() {
    return (_jsxs("div", { style: { padding: 24, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 16 }, children: [_jsx("div", { style: { ...skeletonBase, width: 48, height: 48, borderRadius: 12, marginBottom: 16 } }), _jsx("div", { style: { ...skeletonBase, width: "70%", height: 16, marginBottom: 8 } }), _jsx("div", { style: { ...skeletonBase, width: "50%", height: 12 } })] }));
}
export function AssetGridSkeleton({ count = 8 }) {
    return (_jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }, children: Array.from({ length: count }).map((_, i) => (_jsxs("div", { style: { borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8eb", background: "#fff" }, children: [_jsx("div", { style: { ...skeletonBase, width: "100%", height: 120, borderRadius: 0 } }), _jsxs("div", { style: { padding: "8px 10px" }, children: [_jsx("div", { style: { ...skeletonBase, width: "80%", height: 10, marginBottom: 4 } }), _jsx("div", { style: { ...skeletonBase, width: "50%", height: 10 } })] })] }, i))) }));
}
export function ModelGridSkeleton({ count = 6 }) {
    return (_jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "4px 12px" }, children: Array.from({ length: count }).map((_, i) => (_jsx("div", { style: { ...skeletonBase, height: 36, borderRadius: 8 } }, i))) }));
}
export function HistoryListSkeleton({ count = 6 }) {
    return (_jsx("div", { children: Array.from({ length: count }).map((_, i) => (_jsxs("div", { style: { display: "flex", gap: 8, padding: "8px 6px", marginBottom: 2 }, children: [_jsx("div", { style: { ...skeletonBase, width: 40, height: 40, flexShrink: 0 } }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { ...skeletonBase, width: "80%", height: 10, marginBottom: 6 } }), _jsx("div", { style: { ...skeletonBase, width: "50%", height: 8 } })] })] }, i))) }));
}
export function GenerationSpinner({ text = "Generating..." }) {
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 20 }, children: [_jsx("div", { style: {
                    width: 36, height: 36, border: "3px solid #f0f0f2",
                    borderTop: "3px solid #c026d3", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                } }), _jsx("div", { style: { fontSize: 13, fontWeight: 600, color: "#6b7280" }, children: text }), _jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })] }));
}
