import React from "react";

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

const skeletonBase: React.CSSProperties = {
  background: "linear-gradient(90deg, #f0f0f2 25%, #e8e8eb 50%, #f0f0f2 75%)",
  backgroundSize: "800px 100%",
  animation: "shimmer 1.5s infinite linear",
  borderRadius: 10,
};

export function SkeletonStyles() {
  return <style>{shimmerStyle}</style>;
}

export function DashboardCardSkeleton() {
  return (
    <div style={{ padding: 24, background: "#fff", border: "1px solid #e8e8eb", borderRadius: 16 }}>
      <div style={{ ...skeletonBase, width: 48, height: 48, borderRadius: 12, marginBottom: 16 }} />
      <div style={{ ...skeletonBase, width: "70%", height: 16, marginBottom: 8 }} />
      <div style={{ ...skeletonBase, width: "50%", height: 12 }} />
    </div>
  );
}

export function AssetGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8eb", background: "#fff" }}>
          <div style={{ ...skeletonBase, width: "100%", height: 120, borderRadius: 0 }} />
          <div style={{ padding: "8px 10px" }}>
            <div style={{ ...skeletonBase, width: "80%", height: 10, marginBottom: 4 }} />
            <div style={{ ...skeletonBase, width: "50%", height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModelGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "4px 12px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ ...skeletonBase, height: 36, borderRadius: 8 }} />
      ))}
    </div>
  );
}

export function HistoryListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 8, padding: "8px 6px", marginBottom: 2 }}>
          <div style={{ ...skeletonBase, width: 40, height: 40, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...skeletonBase, width: "80%", height: 10, marginBottom: 6 }} />
            <div style={{ ...skeletonBase, width: "50%", height: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GenerationSpinner({ text = "Generating..." }: { text?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 20 }}>
      <div style={{
        width: 36, height: 36, border: "3px solid #f0f0f2",
        borderTop: "3px solid #c026d3", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{text}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
