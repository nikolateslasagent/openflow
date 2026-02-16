/**
 * ImageEditor — In-app image editing overlay
 * Sprint 11: Crop, Rotate, Flip, Brightness/Contrast, Download, Use as Input
 * Uses Canvas 2D API — no external libraries
 */
import { useState, useRef, useEffect, useCallback } from "react";

interface ImageEditorProps {
  imageUrl: string;
  onClose: () => void;
  onUseAsInput?: (dataUrl: string) => void;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function ImageEditor({ imageUrl, onClose, onUseAsInput }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [cropping, setCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [appliedCrop, setAppliedCrop] = useState<CropRect | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Render to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const src = appliedCrop
      ? { x: appliedCrop.x, y: appliedCrop.y, w: appliedCrop.w, h: appliedCrop.h }
      : { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };

    const isRotated90 = rotation === 90 || rotation === 270;
    const dw = isRotated90 ? src.h : src.w;
    const dh = isRotated90 ? src.w : src.h;

    // Scale to fit max 800x600
    const scale = Math.min(1, 800 / dw, 600 / dh);
    canvas.width = Math.round(dw * scale);
    canvas.height = Math.round(dh * scale);

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const sw = src.w * scale;
    const sh = src.h * scale;
    ctx.drawImage(img, src.x, src.y, src.w, src.h, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();

    // Draw crop overlay
    if (cropRect && cropping) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.setLineDash([]);
    }
  }, [rotation, flipH, flipV, brightness, contrast, cropRect, cropping, appliedCrop]);

  useEffect(() => {
    if (loaded) render();
  }, [loaded, render]);

  const getExportCanvas = useCallback(() => {
    const img = imgRef.current;
    if (!img) return null;
    const src = appliedCrop || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const isRotated90 = rotation === 90 || rotation === 270;
    const dw = isRotated90 ? src.h : src.w;
    const dh = isRotated90 ? src.w : src.h;
    const c = document.createElement("canvas");
    c.width = dw;
    c.height = dh;
    const ctx = c.getContext("2d")!;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.translate(dw / 2, dh / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, src.x, src.y, src.w, src.h, -src.w / 2, -src.h / 2, src.w, src.h);
    return c;
  }, [rotation, flipH, flipV, brightness, contrast, appliedCrop]);

  const handleDownload = () => {
    const c = getExportCanvas();
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "edited-image.png";
    a.click();
  };

  const handleUseAsInput = () => {
    const c = getExportCanvas();
    if (!c || !onUseAsInput) return;
    onUseAsInput(c.toDataURL("image/png"));
    onClose();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropping) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropStart({ x, y });
    setCropRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropping || !cropStart) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropRect({
      x: Math.min(cropStart.x, x),
      y: Math.min(cropStart.y, y),
      w: Math.abs(x - cropStart.x),
      h: Math.abs(y - cropStart.y),
    });
  };

  const handleMouseUp = () => {
    setCropStart(null);
  };

  const applyCrop = () => {
    if (!cropRect || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const prev = appliedCrop || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const scaleX = prev.w / canvas.width;
    const scaleY = prev.h / canvas.height;
    setAppliedCrop({
      x: prev.x + cropRect.x * scaleX,
      y: prev.y + cropRect.y * scaleY,
      w: cropRect.w * scaleX,
      h: cropRect.h * scaleY,
    });
    setCropRect(null);
    setCropping(false);
  };

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: 8,
    border: active ? "2px solid #c026d3" : "1px solid #e8e8eb",
    background: active ? "#fdf4ff" : "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    color: active ? "#c026d3" : "#374151",
    transition: "all 0.15s",
  });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 24, maxWidth: 900, width: "95%", maxHeight: "95vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>🎨 Image Editor</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e8e8eb", background: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => { setCropping(!cropping); setCropRect(null); }} style={btnStyle(cropping)}>✂️ Crop</button>
          {cropping && cropRect && cropRect.w > 5 && (
            <button onClick={applyCrop} style={{ ...btnStyle(), background: "#c026d3", color: "#fff", border: "none" }}>Apply Crop</button>
          )}
          <button onClick={() => setRotation((r) => (r + 90) % 360)} style={btnStyle()}>↻ Rotate 90°</button>
          <button onClick={() => setFlipH((f) => !f)} style={btnStyle(flipH)}>↔ Flip H</button>
          <button onClick={() => setFlipV((f) => !f)} style={btnStyle(flipV)}>↕ Flip V</button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280" }}>
            ☀️ <input type="range" min={20} max={200} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} style={{ width: 80 }} /> {brightness}%
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280" }}>
            ◐ <input type="range" min={20} max={200} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} style={{ width: 80 }} /> {contrast}%
          </div>
          <button onClick={() => { setRotation(0); setFlipH(false); setFlipV(false); setBrightness(100); setContrast(100); setAppliedCrop(null); setCropRect(null); setCropping(false); }} style={btnStyle()}>↺ Reset</button>
        </div>

        {/* Canvas */}
        <div style={{ display: "flex", justifyContent: "center", background: "#f5f5f7", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ maxWidth: "100%", cursor: cropping ? "crosshair" : "default", borderRadius: 8 }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={handleDownload} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #e8e8eb", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>⬇ Download</button>
          {onUseAsInput && (
            <button onClick={handleUseAsInput} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#c026d3", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📥 Use as Input</button>
          )}
        </div>
      </div>
    </div>
  );
}
