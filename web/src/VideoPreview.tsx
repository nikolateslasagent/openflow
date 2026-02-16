/**
 * VideoPreview — Full-featured video preview modal
 * Sprint 11: Play/pause, seek, volume, fullscreen, speed, loop, side-by-side, frame step
 */
import { useState, useRef, useEffect, useCallback } from "react";

interface VideoPreviewProps {
  videoUrl: string;
  compareUrl?: string;
  onClose: () => void;
}

export function VideoPreview({ videoUrl, compareUrl: initialCompareUrl, onClose }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const compareRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [showCompare, setShowCompare] = useState(false);
  const [compareUrl, setCompareUrl] = useState(initialCompareUrl || "");

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("loadedmetadata", onMeta); };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
    if (compareRef.current) {
      if (v.paused) compareRef.current.pause(); else compareRef.current.play();
    }
  }, []);

  const seek = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
    if (compareRef.current) compareRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const stepFrame = (dir: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + dir / 30));
    if (compareRef.current) { compareRef.current.pause(); compareRef.current.currentTime = v.currentTime; }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); stepFrame(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); stepFrame(1); }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, onClose]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
    if (compareRef.current) compareRef.current.playbackRate = speed;
  }, [speed]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const fullscreen = () => {
    const el = document.querySelector(".video-preview-container");
    if (el) (el as HTMLElement).requestFullscreen?.();
  };

  const btnStyle: React.CSSProperties = {
    padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
      <div className="video-preview-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: showCompare ? "95vw" : "90vw", width: "100%", maxHeight: "95vh" }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", zIndex: 2 }}>✕</button>

        {/* Video(s) */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 16 }}>
          <video ref={videoRef} src={videoUrl} autoPlay loop={loop} muted={volume === 0} style={{ maxWidth: showCompare ? "48vw" : "85vw", maxHeight: "70vh", borderRadius: 12 }} />
          {showCompare && compareUrl && (
            <video ref={compareRef} src={compareUrl} autoPlay loop={loop} muted={volume === 0} style={{ maxWidth: "48vw", maxHeight: "70vh", borderRadius: 12 }} />
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {/* Seek */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "80%", maxWidth: 700 }}>
            <span style={{ color: "#9ca3af", fontSize: 11, minWidth: 36 }}>{formatTime(currentTime)}</span>
            <input type="range" min={0} max={duration || 1} step={0.01} value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#c026d3" }} />
            <span style={{ color: "#9ca3af", fontSize: 11, minWidth: 36 }}>{formatTime(duration)}</span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => stepFrame(-1)} style={btnStyle}>⏮ Frame</button>
            <button onClick={togglePlay} style={{ ...btnStyle, background: "rgba(192,38,211,0.3)" }}>{playing ? "⏸ Pause" : "▶ Play"}</button>
            <button onClick={() => stepFrame(1)} style={btnStyle}>Frame ⏭</button>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#9ca3af", fontSize: 11 }}>🔊</span>
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={(e) => { setVolume(Number(e.target.value)); if (videoRef.current) videoRef.current.volume = Number(e.target.value); }}
                style={{ width: 60, accentColor: "#c026d3" }} />
            </div>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
              style={{ ...btnStyle, background: "rgba(255,255,255,0.1)", WebkitAppearance: "none" as const }}>
              {[0.25, 0.5, 1, 1.5, 2].map(s => <option key={s} value={s}>{s}x</option>)}
            </select>
            <button onClick={() => setLoop(!loop)} style={{ ...btnStyle, ...(loop ? { borderColor: "#c026d3", color: "#c026d3" } : {}) }}>🔁 Loop</button>
            <button onClick={fullscreen} style={btnStyle}>⛶ Fullscreen</button>
            <button onClick={() => setShowCompare(!showCompare)} style={{ ...btnStyle, ...(showCompare ? { borderColor: "#c026d3", color: "#c026d3" } : {}) }}>⧉ Compare</button>
          </div>

          {/* Compare URL input */}
          {showCompare && !initialCompareUrl && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="text" placeholder="Paste second video URL..." value={compareUrl} onChange={(e) => setCompareUrl(e.target.value)}
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, width: 300, outline: "none" }} />
            </div>
          )}

          <div style={{ color: "#6b7280", fontSize: 10, marginTop: 4 }}>← → Frame step · Space Play/Pause · Esc Close</div>
        </div>
      </div>
    </div>
  );
}
