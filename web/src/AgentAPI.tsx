/**
 * Sprint 10: Agent API — URL parameter parsing & API docs tab
 */

export interface AgentAction {
  action: "generate" | "workflow" | "batch";
  model?: string;
  prompt?: string;
  template?: string;
  prompts?: string[];
}

export function parseAgentParams(): AgentAction | null {
  const params = new URLSearchParams(window.location.search);
  const action = params.get("action");
  if (!action) return null;

  if (action === "generate") {
    return {
      action: "generate",
      model: params.get("model") || "flux-pro",
      prompt: params.get("prompt") || "",
    };
  }
  if (action === "workflow") {
    return {
      action: "workflow",
      template: params.get("template") || "product-photo",
    };
  }
  if (action === "batch") {
    const rawPrompts = params.get("prompts") || "";
    return {
      action: "batch",
      model: params.get("model") || "flux-pro",
      prompts: rawPrompts.split("|").filter(Boolean),
    };
  }
  return null;
}

export function APIDocsPanel() {
  const baseUrl = window.location.origin + window.location.pathname;

  const examples = [
    {
      title: "Generate a single image",
      url: `${baseUrl}?action=generate&model=flux-pro&prompt=a+beautiful+sunset+over+mountains`,
      description: "Creates a Text-to-Image node with the given model and prompt, then auto-runs it.",
    },
    {
      title: "Load a workflow template",
      url: `${baseUrl}?action=workflow&template=product-photo`,
      description: "Loads a pre-built workflow template. Available: product-photo, social-media-video, storyboard, music-video.",
    },
    {
      title: "Batch generation",
      url: `${baseUrl}?action=batch&prompts=a+cat|a+dog|a+bird&model=flux-fast`,
      description: "Runs multiple prompts in sequence with the specified model. Prompts are pipe-separated.",
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Agent API</div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16, lineHeight: 1.5 }}>
        Trigger OpenFlow actions via URL parameters. AI agents can generate images by simply opening a URL.
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>URL Parameters</div>
      <div style={{ background: "#f5f5f7", borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, lineHeight: 2, color: "#1a1a1a" }}>
          <div><strong>action</strong> = generate | workflow | batch</div>
          <div><strong>model</strong> = flux-pro | flux-fast | dall-e-3 | ...</div>
          <div><strong>prompt</strong> = URL-encoded text prompt</div>
          <div><strong>template</strong> = product-photo | storyboard | ...</div>
          <div><strong>prompts</strong> = prompt1|prompt2|prompt3</div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Examples</div>
      {examples.map((ex, i) => (
        <div key={i} style={{ marginBottom: 12, background: "#f5f5f7", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{ex.title}</div>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6 }}>{ex.description}</div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#c026d3", wordBreak: "break-all", background: "#fff", padding: "6px 8px", borderRadius: 6, border: "1px solid #e8e8eb" }}>
            {ex.url}
          </div>
          <button onClick={() => navigator.clipboard.writeText(ex.url)}
            style={{ marginTop: 6, padding: "4px 10px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            Copy URL
          </button>
        </div>
      ))}

      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 16, marginBottom: 8 }}>Integration</div>
      <div style={{ background: "#0e0e10", borderRadius: 10, padding: 12 }}>
        <pre style={{ fontFamily: "monospace", fontSize: 10, color: "#22c55e", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
{`# Python agent example
import webbrowser

url = "${baseUrl}?action=generate"
url += "&model=flux-pro"
url += "&prompt=a+cyberpunk+city+at+night"

webbrowser.open(url)`}
        </pre>
      </div>
    </div>
  );
}
