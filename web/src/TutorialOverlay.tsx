/**
 * TutorialOverlay — First-time user welcome + re-triggerable from Help
 * Sprint 6
 */
import { useState } from "react";

interface TutorialOverlayProps {
  onDismiss: () => void;
}

const STEPS = [
  { icon: "🎨", title: "Add a Model", desc: "Click a model from the left toolbar to add a generation node to the canvas." },
  { icon: "✏️", title: "Write a Prompt", desc: "Fill in your prompt and tweak settings, then click Generate on the node." },
  { icon: "🔗", title: "Connect Nodes", desc: "Drag from output handles to input handles to build pipelines — chain image → video, upscale, and more." },
  { icon: "▶️", title: "Run All", desc: "Click 'Run All' in the top bar to execute your entire workflow in order." },
];

export function TutorialOverlay({ onDismiss }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 48px", maxWidth: 480, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{STEPS[step].icon}</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" }}>
          {step === 0 ? "Welcome to OpenFlow" : `Step ${step + 1}: ${STEPS[step].title}`}
        </h1>
        {step === 0 && <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>AI Video & Image Workflow Builder</div>}
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "12px 0 24px" }}>{STEPS[step].desc}</p>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === step ? "#c026d3" : "#e8e8eb", cursor: "pointer" }} onClick={() => setStep(i)} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #e8e8eb", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#c026d3", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Next</button>
          ) : (
            <button onClick={() => { localStorage.setItem("openflow_tutorial_done", "true"); onDismiss(); }}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#c026d3", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Got it! 🚀</button>
          )}
        </div>

        <button onClick={() => { localStorage.setItem("openflow_tutorial_done", "true"); onDismiss(); }}
          style={{ marginTop: 16, background: "none", border: "none", color: "#9ca3af", fontSize: 11, cursor: "pointer" }}>Skip tutorial</button>
      </div>
    </div>
  );
}

export function shouldShowTutorial(): boolean {
  return !localStorage.getItem("openflow_tutorial_done");
}
