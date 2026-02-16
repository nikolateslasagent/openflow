import React, { useState, useRef, useCallback } from "react";

// ---- Types ----
export interface TimelineClip {
  id: string;
  type: "video" | "audio" | "caption";
  url?: string;
  label: string;
  startTime: number; // seconds on timeline
  duration: number;  // seconds
  thumbnail?: string;
  text?: string;     // for captions
}

interface TimelineEditorProps {
  assets: { url: string; type: string; model: string; prompt: string }[];
  onExportVideo: (clips: TimelineClip[]) => void;
}

const TRACK_HEIGHT = 64;
const PX_PER_SEC = 40;
const TRACKS = ["Video", "Audio", "Captions"] as const;

export default function TimelineEditor({ assets, onExportVideo }: TimelineEditorProps) {
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [playheadPos, setPlayheadPos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragOverTrack, setDragOverTrack] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const playTimer = useRef<number | null>(null);
  const idCounter = useRef(0);

  const totalDuration = Math.max(30, ...clips.map(c => c.startTime + c.duration));
  const timelineWidth = totalDuration * PX_PER_SEC;

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (playTimer.current) cancelAnimationFrame(playTimer.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const start = performance.now();
      const startPos = playheadPos;
      const animate = (now: number) => {
        const elapsed = (now - start) / 1000;
        const newPos = startPos + elapsed;
        if (newPos >= totalDuration) {
          setPlayheadPos(0);
          setIsPlaying(false);
          return;
        }
        setPlayheadPos(newPos);
        playTimer.current = requestAnimationFrame(animate);
      };
      playTimer.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, playheadPos, totalDuration]);

  const addClipFromAsset = (asset: { url: string; type: string; prompt: string }, trackType: string) => {
    const type = trackType === "Video" ? "video" : trackType === "Audio" ? "audio" : "caption";
    const existingOnTrack = clips.filter(c => c.type === type);
    const startTime = existingOnTrack.length > 0 ? Math.max(...existingOnTrack.map(c => c.startTime + c.duration)) : 0;
    idCounter.current++;
    setClips(prev => [...prev, {
      id: `clip-${idCounter.current}`,
      type,
      url: asset.url,
      label: asset.prompt?.slice(0, 30) || asset.type,
      startTime,
      duration: asset.type === "video" ? 4 : 5,
      thumbnail: asset.type !== "video" ? asset.url : undefined,
    }]);
  };

  const addCaptionClip = () => {
    const existingCaps = clips.filter(c => c.type === "caption");
    const startTime = existingCaps.length > 0 ? Math.max(...existingCaps.map(c => c.startTime + c.duration)) : 0;
    idCounter.current++;
    setClips(prev => [...prev, {
      id: `clip-${idCounter.current}`,
      type: "caption",
      label: "New Caption",
      text: "Enter caption text...",
      startTime,
      duration: 3,
    }]);
  };

  const removeClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
    if (selectedClipId === id) setSelectedClipId(null);
  };

  const updateClipText = (id: string, text: string) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, text, label: text.slice(0, 30) } : c));
  };

  const videoAssets = assets.filter(a => a.type === "video");
  const audioAssets = assets.filter(a => a.type === "audio");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0e0e10", color: "#e0e0e5", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: "1px solid #1e1e22" }}>
        <button onClick={togglePlay} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: isPlaying ? "#ef4444" : "#22c55e", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>{playheadPos.toFixed(1)}s / {totalDuration.toFixed(0)}s</span>
        <div style={{ flex: 1 }} />
        <button onClick={addCaptionClip} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          💬 Add Caption
        </button>
        <button onClick={() => onExportVideo(clips.filter(c => c.type === "video"))} disabled={clips.filter(c => c.type === "video").length === 0}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#c026d3", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: clips.filter(c => c.type === "video").length === 0 ? 0.4 : 1 }}>
          🎬 Export Video
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Asset pool sidebar */}
        <div style={{ width: 220, borderRight: "1px solid #1e1e22", overflow: "auto", padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6b75", textTransform: "uppercase", marginBottom: 8 }}>Video Clips</div>
          {videoAssets.length === 0 && <div style={{ fontSize: 11, color: "#4a4a50", padding: 8 }}>No video assets yet</div>}
          {videoAssets.map((a, i) => (
            <div key={i} draggable onDragStart={(e) => e.dataTransfer.setData("asset-index", String(i))}
              style={{ padding: 8, background: "#141416", borderRadius: 8, marginBottom: 6, cursor: "grab", border: "1px solid #2a2a30" }}>
              <video src={a.url} style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 6 }} muted />
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.prompt?.slice(0, 40)}</div>
              <button onClick={() => addClipFromAsset(a, "Video")} style={{ marginTop: 4, width: "100%", padding: "4px 0", borderRadius: 6, border: "1px solid #2a2a30", background: "transparent", color: "#c026d3", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>+ Add to Timeline</button>
            </div>
          ))}
          {audioAssets.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6b75", textTransform: "uppercase", marginTop: 16, marginBottom: 8 }}>Audio</div>
              {audioAssets.map((a, i) => (
                <div key={i} style={{ padding: 8, background: "#141416", borderRadius: 8, marginBottom: 6, border: "1px solid #2a2a30" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{a.prompt?.slice(0, 40)}</div>
                  <button onClick={() => addClipFromAsset(a, "Audio")} style={{ marginTop: 4, width: "100%", padding: "4px 0", borderRadius: 6, border: "1px solid #2a2a30", background: "transparent", color: "#22c55e", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>+ Add to Audio Track</button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Timeline tracks */}
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {/* Time ruler */}
          <div style={{ height: 28, borderBottom: "1px solid #1e1e22", position: "sticky", top: 0, background: "#0e0e10", zIndex: 5, display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: 80, flexShrink: 0 }} />
            <div style={{ position: "relative", width: timelineWidth }}>
              {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
                <span key={i} style={{ position: "absolute", left: i * PX_PER_SEC, fontSize: 9, color: "#4a4a50", bottom: 4, transform: "translateX(-50%)" }}>{i}s</span>
              ))}
            </div>
          </div>

          {/* Tracks */}
          {TRACKS.map((track, ti) => {
            const trackType = track === "Video" ? "video" : track === "Audio" ? "audio" : "caption";
            const trackClips = clips.filter(c => c.type === trackType);
            const colors: Record<string, string> = { Video: "#c026d3", Audio: "#22c55e", Captions: "#f59e0b" };
            return (
              <div key={track} style={{ display: "flex", height: TRACK_HEIGHT, borderBottom: "1px solid #1e1e22", background: dragOverTrack === track ? "#1a1a20" : "transparent" }}
                onDragOver={(e) => { e.preventDefault(); setDragOverTrack(track); }}
                onDragLeave={() => setDragOverTrack(null)}
                onDrop={(e) => {
                  setDragOverTrack(null);
                  const idx = e.dataTransfer.getData("asset-index");
                  if (idx && track === "Video") addClipFromAsset(videoAssets[Number(idx)], track);
                }}>
                <div style={{ width: 80, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: colors[track], borderRight: "1px solid #1e1e22" }}>
                  {track}
                </div>
                <div style={{ position: "relative", width: timelineWidth, minHeight: TRACK_HEIGHT }}>
                  {trackClips.map(clip => (
                    <div key={clip.id} onClick={() => setSelectedClipId(clip.id)}
                      style={{
                        position: "absolute", left: clip.startTime * PX_PER_SEC, width: clip.duration * PX_PER_SEC, top: 6, bottom: 6,
                        background: selectedClipId === clip.id ? colors[track] + "44" : colors[track] + "22",
                        border: `1px solid ${colors[track]}${selectedClipId === clip.id ? "" : "66"}`,
                        borderRadius: 6, padding: "4px 6px", overflow: "hidden", cursor: "pointer", fontSize: 10, color: "#e0e0e5",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                      {clip.type === "video" && clip.url && <video src={clip.url} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} muted />}
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{clip.label}</div>
                        <div style={{ fontSize: 8, color: "#6b6b75" }}>{clip.duration}s</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeClip(clip.id); }}
                        style={{ background: "none", border: "none", color: "#6b6b75", cursor: "pointer", fontSize: 10, padding: 0, flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Playhead */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 80 + playheadPos * PX_PER_SEC, width: 2, background: "#ef4444", zIndex: 10, pointerEvents: "none",
          }}>
            <div style={{ width: 10, height: 10, background: "#ef4444", borderRadius: "50%", position: "absolute", top: 0, left: -4 }} />
          </div>
        </div>
      </div>

      {/* Clip inspector */}
      {selectedClipId && (() => {
        const clip = clips.find(c => c.id === selectedClipId);
        if (!clip) return null;
        return (
          <div style={{ borderTop: "1px solid #1e1e22", padding: "12px 20px", display: "flex", gap: 16, alignItems: "center", background: "#111114" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#c026d3" }}>Edit Clip</span>
            <label style={{ fontSize: 11, color: "#9ca3af" }}>Start:
              <input type="number" value={clip.startTime} step={0.5} min={0} onChange={e => setClips(prev => prev.map(c => c.id === selectedClipId ? { ...c, startTime: Number(e.target.value) } : c))}
                style={{ width: 60, marginLeft: 4, padding: "4px 6px", borderRadius: 6, border: "1px solid #2a2a30", background: "#141416", color: "#e0e0e5", fontSize: 11 }} />
            </label>
            <label style={{ fontSize: 11, color: "#9ca3af" }}>Duration:
              <input type="number" value={clip.duration} step={0.5} min={0.5} onChange={e => setClips(prev => prev.map(c => c.id === selectedClipId ? { ...c, duration: Number(e.target.value) } : c))}
                style={{ width: 60, marginLeft: 4, padding: "4px 6px", borderRadius: 6, border: "1px solid #2a2a30", background: "#141416", color: "#e0e0e5", fontSize: 11 }} />
            </label>
            {clip.type === "caption" && (
              <input value={clip.text || ""} onChange={e => updateClipText(selectedClipId, e.target.value)} placeholder="Caption text..."
                style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #2a2a30", background: "#141416", color: "#e0e0e5", fontSize: 12 }} />
            )}
          </div>
        );
      })()}
    </div>
  );
}
