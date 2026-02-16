import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TutorialOverlay — First-time user welcome + re-triggerable from Help
 * Sprint 6
 */
import { useState } from "react";
const STEPS = [
    { icon: "🎨", title: "Add a Model", desc: "Click a model from the left toolbar to add a generation node to the canvas." },
    { icon: "✏️", title: "Write a Prompt", desc: "Fill in your prompt and tweak settings, then click Generate on the node." },
    { icon: "🔗", title: "Connect Nodes", desc: "Drag from output handles to input handles to build pipelines — chain image → video, upscale, and more." },
    { icon: "▶️", title: "Run All", desc: "Click 'Run All' in the top bar to execute your entire workflow in order." },
];
export function TutorialOverlay({ onDismiss }) {
    const [step, setStep] = useState(0);
    return (_jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }, children: _jsxs("div", { style: { background: "#fff", borderRadius: 20, padding: "40px 48px", maxWidth: 480, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }, children: [_jsx("div", { style: { fontSize: 40, marginBottom: 8 }, children: STEPS[step].icon }), _jsx("h1", { style: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" }, children: step === 0 ? "Welcome to OpenFlow" : `Step ${step + 1}: ${STEPS[step].title}` }), step === 0 && _jsx("div", { style: { fontSize: 13, color: "#9ca3af", marginBottom: 12 }, children: "AI Video & Image Workflow Builder" }), _jsx("p", { style: { fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "12px 0 24px" }, children: STEPS[step].desc }), _jsx("div", { style: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }, children: STEPS.map((_, i) => (_jsx("div", { style: { width: 8, height: 8, borderRadius: "50%", background: i === step ? "#c026d3" : "#e8e8eb", cursor: "pointer" }, onClick: () => setStep(i) }, i))) }), _jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "center" }, children: [step > 0 && (_jsx("button", { onClick: () => setStep(s => s - 1), style: { padding: "10px 24px", borderRadius: 10, border: "1px solid #e8e8eb", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }, children: "Back" })), step < STEPS.length - 1 ? (_jsx("button", { onClick: () => setStep(s => s + 1), style: { padding: "10px 24px", borderRadius: 10, border: "none", background: "#c026d3", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }, children: "Next" })) : (_jsx("button", { onClick: () => { localStorage.setItem("openflow_tutorial_done", "true"); onDismiss(); }, style: { padding: "10px 24px", borderRadius: 10, border: "none", background: "#c026d3", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }, children: "Got it! \uD83D\uDE80" }))] }), _jsx("button", { onClick: () => { localStorage.setItem("openflow_tutorial_done", "true"); onDismiss(); }, style: { marginTop: 16, background: "none", border: "none", color: "#9ca3af", fontSize: 11, cursor: "pointer" }, children: "Skip tutorial" })] }) }));
}
export function shouldShowTutorial() {
    return !localStorage.getItem("openflow_tutorial_done");
}
