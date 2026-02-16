/**
 * InteractiveOnboarding — Step-by-step guided walkthrough with highlights
 * Sprint 11
 */
import { useState, useEffect } from "react";

interface OnboardingProps {
  onDismiss: () => void;
}

const STEPS = [
  {
    target: "[data-onboarding='toolbar']",
    fallbackSelector: "aside",
    title: "Pick a Model",
    desc: "Choose from dozens of AI models in the toolbar. Click any model to add it to your canvas.",
    icon: "🎨",
    position: "right" as const,
  },
  {
    target: "[data-onboarding='prompt']",
    fallbackSelector: "textarea",
    title: "Describe What You Want",
    desc: "Write a prompt describing what you'd like to generate. Be specific for best results!",
    icon: "✏️",
    position: "bottom" as const,
  },
  {
    target: "[data-onboarding='generate']",
    fallbackSelector: "button[data-onboarding='generate'], button",
    title: "Click to Create",
    desc: "Hit the Generate button and watch your AI creation come to life. It usually takes 5-30 seconds.",
    icon: "✦",
    position: "bottom" as const,
  },
  {
    target: "[data-onboarding='canvas']",
    fallbackSelector: ".react-flow",
    title: "Build Pipelines",
    desc: "Connect nodes together by dragging from outputs to inputs. Chain image → video, upscale, and more!",
    icon: "🔗",
    position: "center" as const,
  },
];

export function InteractiveOnboarding({ onDismiss }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const s = STEPS[step];
    const el = document.querySelector(s.target) || document.querySelector(s.fallbackSelector || "");
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView?.({ behavior: "smooth", block: "center" });
    } else {
      setHighlightRect(null);
    }
  }, [step]);

  const finish = () => {
    localStorage.setItem("openflow_tutorial_done", "true");
    onDismiss();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const current = STEPS[step];
  const pad = 12;

  return (
    <>
      {/* Overlay with cutout */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1200 }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <mask id="onboarding-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - pad}
                  y={highlightRect.top - pad}
                  width={highlightRect.width + pad * 2}
                  height={highlightRect.height + pad * 2}
                  rx={12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#onboarding-mask)" />
        </svg>

        {/* Pulse ring around highlighted element */}
        {highlightRect && (
          <div style={{
            position: "absolute",
            left: highlightRect.left - pad,
            top: highlightRect.top - pad,
            width: highlightRect.width + pad * 2,
            height: highlightRect.height + pad * 2,
            borderRadius: 12,
            border: "2px solid #c026d3",
            animation: "onboarding-pulse 1.5s ease-in-out infinite",
            pointerEvents: "none",
          }} />
        )}

        {/* Tooltip */}
        <div style={{
          position: "absolute",
          ...(highlightRect && current.position !== "center" ? {
            left: current.position === "right" ? highlightRect.right + 24 : highlightRect.left,
            top: current.position === "bottom" ? highlightRect.bottom + 24 : highlightRect.top,
          } : {
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }),
          background: "#fff",
          borderRadius: 16,
          padding: "24px 28px",
          maxWidth: 340,
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          fontFamily: "'Inter', sans-serif",
          zIndex: 1201,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{current.icon}</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
            Step {step + 1}: {current.title}
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{current.desc}</p>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i === step ? "#c026d3" : i < step ? "#e879f9" : "#e8e8eb",
                cursor: "pointer",
              }} onClick={() => setStep(i)} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={finish} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e8eb", background: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#9ca3af",
            }}>Skip</button>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e8eb", background: "#fff",
                fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#6b7280",
              }}>Back</button>
            )}
            <button onClick={next} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", background: "#c026d3", color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>{step < STEPS.length - 1 ? "Next →" : "Get Started! 🚀"}</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes onboarding-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(192, 38, 211, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(192, 38, 211, 0); }
        }
      `}</style>
    </>
  );
}

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem("openflow_tutorial_done");
}
