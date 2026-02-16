import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * VideoPreview — Full-featured video preview modal
 * Sprint 11: Play/pause, seek, volume, fullscreen, speed, loop, side-by-side, frame step
 */
import { useState, useRef, useEffect, useCallback } from "react";
export function VideoPreview({ videoUrl, compareUrl: initialCompareUrl, onClose }) {
    const videoRef = useRef(null);
    const compareRef = useRef(null);
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
        if (!v)
            return;
        const onTime = () => setCurrentTime(v.currentTime);
        const onMeta = () => setDuration(v.duration);
        v.addEventListener("timeupdate", onTime);
        v.addEventListener("loadedmetadata", onMeta);
        return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("loadedmetadata", onMeta); };
    }, []);
    const togglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v)
            return;
        if (v.paused) {
            v.play();
            setPlaying(true);
        }
        else {
            v.pause();
            setPlaying(false);
        }
        if (compareRef.current) {
            if (v.paused)
                compareRef.current.pause();
            else
                compareRef.current.play();
        }
    }, []);
    const seek = (t) => {
        if (videoRef.current)
            videoRef.current.currentTime = t;
        if (compareRef.current)
            compareRef.current.currentTime = t;
        setCurrentTime(t);
    };
    const stepFrame = (dir) => {
        const v = videoRef.current;
        if (!v)
            return;
        v.pause();
        setPlaying(false);
        v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + dir / 30));
        if (compareRef.current) {
            compareRef.current.pause();
            compareRef.current.currentTime = v.currentTime;
        }
    };
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                stepFrame(-1);
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                stepFrame(1);
            }
            if (e.key === " ") {
                e.preventDefault();
                togglePlay();
            }
            if (e.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [togglePlay, onClose]);
    useEffect(() => {
        if (videoRef.current)
            videoRef.current.playbackRate = speed;
        if (compareRef.current)
            compareRef.current.playbackRate = speed;
    }, [speed]);
    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };
    const fullscreen = () => {
        const el = document.querySelector(".video-preview-container");
        if (el)
            el.requestFullscreen?.();
    };
    const btnStyle = {
        padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
    };
    return (_jsx("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }, children: _jsxs("div", { className: "video-preview-container", onClick: (e) => e.stopPropagation(), style: { maxWidth: showCompare ? "95vw" : "90vw", width: "100%", maxHeight: "95vh" }, children: [_jsx("button", { onClick: onClose, style: { position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", zIndex: 2 }, children: "\u2715" }), _jsxs("div", { style: { display: "flex", gap: 16, justifyContent: "center", marginBottom: 16 }, children: [_jsx("video", { ref: videoRef, src: videoUrl, autoPlay: true, loop: loop, muted: volume === 0, style: { maxWidth: showCompare ? "48vw" : "85vw", maxHeight: "70vh", borderRadius: 12 } }), showCompare && compareUrl && (_jsx("video", { ref: compareRef, src: compareUrl, autoPlay: true, loop: loop, muted: volume === 0, style: { maxWidth: "48vw", maxHeight: "70vh", borderRadius: 12 } }))] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, width: "80%", maxWidth: 700 }, children: [_jsx("span", { style: { color: "#9ca3af", fontSize: 11, minWidth: 36 }, children: formatTime(currentTime) }), _jsx("input", { type: "range", min: 0, max: duration || 1, step: 0.01, value: currentTime, onChange: (e) => seek(Number(e.target.value)), style: { flex: 1, accentColor: "#c026d3" } }), _jsx("span", { style: { color: "#9ca3af", fontSize: 11, minWidth: 36 }, children: formatTime(duration) })] }), _jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }, children: [_jsx("button", { onClick: () => stepFrame(-1), style: btnStyle, children: "\u23EE Frame" }), _jsx("button", { onClick: togglePlay, style: { ...btnStyle, background: "rgba(192,38,211,0.3)" }, children: playing ? "⏸ Pause" : "▶ Play" }), _jsx("button", { onClick: () => stepFrame(1), style: btnStyle, children: "Frame \u23ED" }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [_jsx("span", { style: { color: "#9ca3af", fontSize: 11 }, children: "\uD83D\uDD0A" }), _jsx("input", { type: "range", min: 0, max: 1, step: 0.05, value: volume, onChange: (e) => { setVolume(Number(e.target.value)); if (videoRef.current)
                                                videoRef.current.volume = Number(e.target.value); }, style: { width: 60, accentColor: "#c026d3" } })] }), _jsx("select", { value: speed, onChange: (e) => setSpeed(Number(e.target.value)), style: { ...btnStyle, background: "rgba(255,255,255,0.1)", WebkitAppearance: "none" }, children: [0.25, 0.5, 1, 1.5, 2].map(s => _jsxs("option", { value: s, children: [s, "x"] }, s)) }), _jsx("button", { onClick: () => setLoop(!loop), style: { ...btnStyle, ...(loop ? { borderColor: "#c026d3", color: "#c026d3" } : {}) }, children: "\uD83D\uDD01 Loop" }), _jsx("button", { onClick: fullscreen, style: btnStyle, children: "\u26F6 Fullscreen" }), _jsx("button", { onClick: () => setShowCompare(!showCompare), style: { ...btnStyle, ...(showCompare ? { borderColor: "#c026d3", color: "#c026d3" } : {}) }, children: "\u29C9 Compare" })] }), showCompare && !initialCompareUrl && (_jsx("div", { style: { display: "flex", gap: 8, alignItems: "center" }, children: _jsx("input", { type: "text", placeholder: "Paste second video URL...", value: compareUrl, onChange: (e) => setCompareUrl(e.target.value), style: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, width: 300, outline: "none" } }) })), _jsx("div", { style: { color: "#6b7280", fontSize: 10, marginTop: 4 }, children: "\u2190 \u2192 Frame step \u00B7 Space Play/Pause \u00B7 Esc Close" })] })] }) }));
}
