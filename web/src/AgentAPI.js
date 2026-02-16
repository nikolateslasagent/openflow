import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function parseAgentParams() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (!action)
        return null;
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
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }, children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0 }, children: [_jsx("path", { d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" }), _jsx("path", { d: "M2 12h20" }), _jsx("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })] }), " Agent API"] }), _jsx("div", { style: { fontSize: 11, color: "#9ca3af", marginBottom: 16, lineHeight: 1.5 }, children: "Trigger OpenFlow actions via URL parameters. AI agents can generate images by simply opening a URL." }), _jsx("div", { style: { fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }, children: "URL Parameters" }), _jsx("div", { style: { background: "#f5f5f7", borderRadius: 10, padding: 12, marginBottom: 16 }, children: _jsxs("div", { style: { fontFamily: "monospace", fontSize: 10, lineHeight: 2, color: "#1a1a1a" }, children: [_jsxs("div", { children: [_jsx("strong", { children: "action" }), " = generate | workflow | batch"] }), _jsxs("div", { children: [_jsx("strong", { children: "model" }), " = flux-pro | flux-fast | dall-e-3 | ..."] }), _jsxs("div", { children: [_jsx("strong", { children: "prompt" }), " = URL-encoded text prompt"] }), _jsxs("div", { children: [_jsx("strong", { children: "template" }), " = product-photo | storyboard | ..."] }), _jsxs("div", { children: [_jsx("strong", { children: "prompts" }), " = prompt1|prompt2|prompt3"] })] }) }), _jsx("div", { style: { fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }, children: "Examples" }), examples.map((ex, i) => (_jsxs("div", { style: { marginBottom: 12, background: "#f5f5f7", borderRadius: 10, padding: 12 }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }, children: ex.title }), _jsx("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 6 }, children: ex.description }), _jsx("div", { style: { fontFamily: "monospace", fontSize: 9, color: "#c026d3", wordBreak: "break-all", background: "#fff", padding: "6px 8px", borderRadius: 6, border: "1px solid #e8e8eb" }, children: ex.url }), _jsx("button", { onClick: () => navigator.clipboard.writeText(ex.url), style: { marginTop: 6, padding: "4px 10px", background: "#c026d3", color: "#fff", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer" }, children: "Copy URL" })] }, i))), _jsx("div", { style: { fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 16, marginBottom: 8 }, children: "Integration" }), _jsx("div", { style: { background: "#0e0e10", borderRadius: 10, padding: 12 }, children: _jsx("pre", { style: { fontFamily: "monospace", fontSize: 10, color: "#22c55e", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }, children: `# Python agent example
import webbrowser

url = "${baseUrl}?action=generate"
url += "&model=flux-pro"
url += "&prompt=a+cyberpunk+city+at+night"

webbrowser.open(url)` }) })] }));
}
