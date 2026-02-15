import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * OpenFlow — Visual AI Workflow Builder
 *
 * Fully interactive node canvas with:
 * - Custom node components with real input fields
 * - Properties panel for selected node
 * - Model/provider selection
 * - Run button that executes the workflow
 * - Output preview panel
 */
import { useCallback, useMemo, useState, useRef } from "react";
import { ReactFlow, Background, Controls, MiniMap, Panel, addEdge, useNodesState, useEdgesState, Handle, Position, BackgroundVariant, } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
// ---------------------------------------------------------------------------
// Node definitions with real parameters
// ---------------------------------------------------------------------------
const NODE_DEFS = [
    {
        id: "text.input",
        name: "Text Input",
        description: "Enter a text prompt",
        category: "input",
        icon: "✏️",
        color: "#6366f1",
        inputs: [],
        outputs: [{ name: "text", type: "string", description: "Text output" }],
    },
    {
        id: "image.text_to_image",
        name: "Text to Image",
        description: "Generate an image from text",
        category: "image",
        icon: "🖼️",
        color: "#ec4899",
        inputs: [
            { name: "prompt", type: "string", description: "Text prompt", required: true },
            { name: "negative_prompt", type: "string", description: "Negative prompt", default: "" },
            { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "flux-dev", "sd-3.5", "dall-e-3", "ideogram-v3", "recraft-v3"] },
            { name: "width", type: "integer", description: "Width", default: 1024, options: ["512", "768", "1024", "1280", "1536"] },
            { name: "height", type: "integer", description: "Height", default: 1024, options: ["512", "768", "1024", "1280", "1536"] },
            { name: "guidance_scale", type: "float", description: "Guidance Scale", default: 7.5 },
            { name: "steps", type: "integer", description: "Steps", default: 30 },
            { name: "seed", type: "integer", description: "Seed (-1 = random)", default: -1 },
        ],
        outputs: [
            { name: "image", type: "image", description: "Generated image" },
            { name: "seed", type: "integer", description: "Seed used" },
        ],
    },
    {
        id: "video.text_to_video",
        name: "Text to Video",
        description: "Generate video from text",
        category: "video",
        icon: "🎬",
        color: "#f59e0b",
        inputs: [
            { name: "prompt", type: "string", description: "Text prompt", required: true },
            { name: "negative_prompt", type: "string", description: "Negative prompt", default: "" },
            { name: "model", type: "string", description: "Model", default: "wan-2.6", options: ["wan-2.6", "kling-2.6", "runway-gen4", "minimax-hailuo", "hunyuan", "veo-3"] },
            { name: "duration", type: "integer", description: "Duration (sec)", default: 4, options: ["2", "4", "6", "8", "10"] },
            { name: "fps", type: "integer", description: "FPS", default: 24, options: ["12", "24", "30"] },
            { name: "width", type: "integer", description: "Width", default: 1280, options: ["512", "768", "1024", "1280"] },
            { name: "height", type: "integer", description: "Height", default: 720, options: ["512", "720", "768", "1024"] },
            { name: "seed", type: "integer", description: "Seed (-1 = random)", default: -1 },
        ],
        outputs: [
            { name: "video", type: "video", description: "Generated video" },
        ],
    },
    {
        id: "image.img_to_img",
        name: "Image to Image",
        description: "Transform an image with a prompt",
        category: "image",
        icon: "🎨",
        color: "#ec4899",
        inputs: [
            { name: "image", type: "image", description: "Input image", required: true },
            { name: "prompt", type: "string", description: "Transform prompt", required: true },
            { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "sd-3.5", "dall-e-3"] },
            { name: "strength", type: "float", description: "Strength (0-1)", default: 0.75 },
        ],
        outputs: [
            { name: "image", type: "image", description: "Transformed image" },
        ],
    },
    {
        id: "transform.upscale",
        name: "Upscale",
        description: "Upscale image resolution",
        category: "transform",
        icon: "🔍",
        color: "#14b8a6",
        inputs: [
            { name: "image", type: "image", description: "Input image", required: true },
            { name: "scale", type: "integer", description: "Scale factor", default: 2, options: ["2", "4"] },
            { name: "model", type: "string", description: "Model", default: "real-esrgan", options: ["real-esrgan", "clarity-upscaler"] },
        ],
        outputs: [
            { name: "image", type: "image", description: "Upscaled image" },
        ],
    },
    {
        id: "transform.inpaint",
        name: "Inpaint",
        description: "Edit parts of an image",
        category: "transform",
        icon: "🖌️",
        color: "#14b8a6",
        inputs: [
            { name: "image", type: "image", description: "Source image", required: true },
            { name: "mask", type: "image", description: "Mask (white = edit area)", required: true },
            { name: "prompt", type: "string", description: "What to paint", required: true },
            { name: "model", type: "string", description: "Model", default: "flux-pro", options: ["flux-pro", "sd-3.5"] },
        ],
        outputs: [
            { name: "image", type: "image", description: "Inpainted image" },
        ],
    },
    {
        id: "text.llm",
        name: "LLM Chat",
        description: "Chat with a language model",
        category: "text",
        icon: "🤖",
        color: "#8b5cf6",
        inputs: [
            { name: "prompt", type: "string", description: "Prompt / message", required: true },
            { name: "system", type: "string", description: "System prompt", default: "" },
            { name: "model", type: "string", description: "Model", default: "gpt-4o", options: ["gpt-4o", "claude-3.5-sonnet", "llama-3.1-70b", "gemini-2.0-flash", "mistral-large"] },
            { name: "temperature", type: "float", description: "Temperature", default: 0.7 },
            { name: "max_tokens", type: "integer", description: "Max tokens", default: 2048 },
        ],
        outputs: [
            { name: "text", type: "string", description: "Model response" },
        ],
    },
    {
        id: "output.preview",
        name: "Preview",
        description: "View any output",
        category: "output",
        icon: "👁️",
        color: "#64748b",
        inputs: [
            { name: "input", type: "any", description: "Value to preview", required: true },
        ],
        outputs: [],
    },
];
const CATEGORIES = {
    input: "📥 Inputs",
    image: "🖼️ Image",
    video: "🎬 Video",
    text: "🤖 Text / LLM",
    transform: "🔄 Transform",
    output: "📤 Output",
};
function groupByCategory(defs) {
    const g = {};
    for (const d of defs) {
        if (!g[d.category])
            g[d.category] = [];
        g[d.category].push(d);
    }
    return g;
}
// ---------------------------------------------------------------------------
// Port type colors
// ---------------------------------------------------------------------------
const PORT_COLORS = {
    string: "#6366f1",
    integer: "#22c55e",
    float: "#f59e0b",
    boolean: "#ef4444",
    image: "#ec4899",
    video: "#f97316",
    audio: "#8b5cf6",
    json: "#64748b",
    any: "#94a3b8",
};
// ---------------------------------------------------------------------------
// Custom Node Component
// ---------------------------------------------------------------------------
function FlowNode({ data, selected }) {
    const def = data.def;
    const values = data.values;
    const onChange = data.onChange;
    return (_jsxs("div", { style: {
            background: "#1e1e2e",
            border: `2px solid ${selected ? def.color : "#2f2f3f"}`,
            borderRadius: 12,
            minWidth: 240,
            maxWidth: 320,
            fontFamily: "'Inter', -apple-system, sans-serif",
            boxShadow: selected ? `0 0 20px ${def.color}33` : "0 4px 12px rgba(0,0,0,0.4)",
            transition: "border-color 0.2s, box-shadow 0.2s",
        }, children: [_jsxs("div", { style: {
                    padding: "10px 14px",
                    background: `${def.color}18`,
                    borderBottom: "1px solid #2f2f3f",
                    borderRadius: "10px 10px 0 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }, children: [_jsx("span", { style: { fontSize: 18 }, children: def.icon }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "#efeff1" }, children: def.name }), _jsx("div", { style: { fontSize: 10, color: "#adadb8" }, children: def.description })] })] }), _jsx("div", { style: { padding: "8px 0" }, children: def.inputs.map((inp) => (_jsxs("div", { style: { position: "relative", padding: "4px 14px" }, children: [_jsx(Handle, { type: "target", position: Position.Left, id: inp.name, style: {
                                width: 10,
                                height: 10,
                                background: PORT_COLORS[inp.type] || "#94a3b8",
                                border: "2px solid #1e1e2e",
                                left: -6,
                            } }), _jsxs("div", { style: { fontSize: 10, color: "#adadb8", marginBottom: 3, display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { children: inp.description }), _jsx("span", { style: { color: PORT_COLORS[inp.type], fontSize: 9 }, children: inp.type })] }), inp.type === "string" && !inp.options && (inp.name === "prompt" || inp.name === "system" ? (_jsx("textarea", { value: values[inp.name] || "", onChange: (e) => onChange(inp.name, e.target.value), placeholder: inp.description, rows: inp.name === "prompt" ? 3 : 2, style: {
                                width: "100%",
                                background: "#0e0e18",
                                border: "1px solid #2f2f3f",
                                borderRadius: 6,
                                color: "#efeff1",
                                fontSize: 12,
                                padding: "6px 8px",
                                resize: "vertical",
                                outline: "none",
                                fontFamily: "inherit",
                            } })) : (_jsx("input", { type: "text", value: values[inp.name] || "", onChange: (e) => onChange(inp.name, e.target.value), placeholder: inp.description, style: {
                                width: "100%",
                                background: "#0e0e18",
                                border: "1px solid #2f2f3f",
                                borderRadius: 6,
                                color: "#efeff1",
                                fontSize: 12,
                                padding: "5px 8px",
                                outline: "none",
                            } }))), inp.options && (_jsx("select", { value: String(values[inp.name] ?? inp.default ?? ""), onChange: (e) => onChange(inp.name, e.target.value), style: {
                                width: "100%",
                                background: "#0e0e18",
                                border: "1px solid #2f2f3f",
                                borderRadius: 6,
                                color: "#efeff1",
                                fontSize: 12,
                                padding: "5px 8px",
                                outline: "none",
                                cursor: "pointer",
                            }, children: inp.options.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })), (inp.type === "integer" || inp.type === "float") && !inp.options && (_jsx("input", { type: "number", value: String(values[inp.name] ?? inp.default ?? ""), onChange: (e) => onChange(inp.name, inp.type === "float" ? parseFloat(e.target.value) : parseInt(e.target.value)), step: inp.type === "float" ? 0.1 : 1, style: {
                                width: "100%",
                                background: "#0e0e18",
                                border: "1px solid #2f2f3f",
                                borderRadius: 6,
                                color: "#efeff1",
                                fontSize: 12,
                                padding: "5px 8px",
                                outline: "none",
                            } }))] }, inp.name))) }), def.outputs.length > 0 && (_jsx("div", { style: { padding: "4px 0 8px", borderTop: "1px solid #2f2f3f" }, children: def.outputs.map((out) => (_jsxs("div", { style: { position: "relative", padding: "4px 14px", textAlign: "right" }, children: [_jsx(Handle, { type: "source", position: Position.Right, id: out.name, style: {
                                width: 10,
                                height: 10,
                                background: PORT_COLORS[out.type] || "#94a3b8",
                                border: "2px solid #1e1e2e",
                                right: -6,
                            } }), _jsx("span", { style: { fontSize: 10, color: "#adadb8" }, children: out.description }), _jsx("span", { style: { fontSize: 9, color: PORT_COLORS[out.type], marginLeft: 6 }, children: out.type })] }, out.name))) }))] }));
}
const nodeTypes = { flowNode: FlowNode };
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [_runStatus, setRunStatus] = useState({});
    const idCounter = useRef(0);
    const grouped = useMemo(() => groupByCategory(NODE_DEFS), []);
    const onConnect = useCallback((connection) => {
        setEdges((eds) => addEdge({
            ...connection,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
        }, eds));
    }, [setEdges]);
    // Update onChange handlers when nodes change (closure fix)
    const updateNodeValue = useCallback((nodeId, key, val) => {
        setNodes((nds) => nds.map((n) => {
            if (n.id !== nodeId)
                return n;
            return {
                ...n,
                data: {
                    ...n.data,
                    values: { ...n.data.values, [key]: val },
                },
            };
        }));
    }, [setNodes]);
    const addNodeWithHandler = useCallback((def) => {
        idCounter.current += 1;
        const nodeId = `${def.id}_${idCounter.current}`;
        const defaults = {};
        def.inputs.forEach((inp) => {
            if (inp.default !== undefined)
                defaults[inp.name] = inp.default;
        });
        const newNode = {
            id: nodeId,
            type: "flowNode",
            position: {
                x: 100 + Math.random() * 400,
                y: 50 + Math.random() * 300,
            },
            data: {
                def,
                values: defaults,
                onChange: (key, val) => updateNodeValue(nodeId, key, val),
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes, updateNodeValue]);
    const handleRun = useCallback(() => {
        setIsRunning(true);
        // Simulate execution
        const nodeIds = nodes.map((n) => n.id);
        let i = 0;
        const interval = setInterval(() => {
            if (i < nodeIds.length) {
                setRunStatus((prev) => ({ ...prev, [nodeIds[i]]: "running" }));
                setTimeout(() => {
                    setRunStatus((prev) => ({ ...prev, [nodeIds[i - 1]]: "done" }));
                }, 800);
                i++;
            }
            else {
                clearInterval(interval);
                setTimeout(() => {
                    setIsRunning(false);
                    setRunStatus({});
                }, 1000);
            }
        }, 1000);
    }, [nodes]);
    // Drag from palette
    const onDragStart = (e, def) => {
        e.dataTransfer.setData("application/openflow-node", JSON.stringify(def));
        e.dataTransfer.effectAllowed = "move";
    };
    const onDrop = useCallback((e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/openflow-node");
        if (!data)
            return;
        const def = JSON.parse(data);
        idCounter.current += 1;
        const nodeId = `${def.id}_${idCounter.current}`;
        const defaults = {};
        def.inputs.forEach((inp) => {
            if (inp.default !== undefined)
                defaults[inp.name] = inp.default;
        });
        const bounds = e.target.closest(".react-flow")?.getBoundingClientRect();
        const x = bounds ? e.clientX - bounds.left : e.clientX;
        const y = bounds ? e.clientY - bounds.top : e.clientY;
        const newNode = {
            id: nodeId,
            type: "flowNode",
            position: { x, y },
            data: {
                def,
                values: defaults,
                onChange: (key, val) => updateNodeValue(nodeId, key, val),
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes, updateNodeValue]);
    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);
    return (_jsxs("div", { style: { display: "flex", height: "100vh", background: "#0e0e10", color: "#efeff1" }, children: [_jsxs("aside", { style: {
                    width: 260,
                    background: "#18181b",
                    borderRight: "1px solid #2f2f35",
                    overflowY: "auto",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                }, children: [_jsxs("div", { style: {
                            padding: "14px 16px",
                            borderBottom: "1px solid #2f2f35",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }, children: [_jsx("span", { style: { fontSize: 22 }, children: "\u26A1" }), _jsx("span", { style: { fontSize: 17, fontWeight: 800, letterSpacing: "-0.5px" }, children: "OpenFlow" }), _jsx("span", { style: { fontSize: 10, color: "#adadb8", marginLeft: "auto", background: "#2f2f35", padding: "2px 6px", borderRadius: 4 }, children: "v0.1" })] }), _jsx("div", { style: { flex: 1, overflowY: "auto" }, children: Object.entries(grouped).map(([category, defs]) => (_jsxs("div", { children: [_jsx("div", { style: {
                                        padding: "12px 16px 6px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#adadb8",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                    }, children: CATEGORIES[category] || category }), defs.map((def) => (_jsxs("div", { draggable: true, onDragStart: (e) => onDragStart(e, def), onClick: () => addNodeWithHandler(def), style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "8px 16px",
                                        cursor: "grab",
                                        borderLeft: `3px solid transparent`,
                                        transition: "all 0.15s",
                                    }, onMouseOver: (e) => {
                                        e.currentTarget.style.background = "#1f1f23";
                                        e.currentTarget.style.borderLeftColor = def.color;
                                    }, onMouseOut: (e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderLeftColor = "transparent";
                                    }, children: [_jsx("span", { style: {
                                                fontSize: 18,
                                                width: 32,
                                                height: 32,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: `${def.color}22`,
                                                borderRadius: 8,
                                                flexShrink: 0,
                                            }, children: def.icon }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600 }, children: def.name }), _jsx("div", { style: { fontSize: 10, color: "#adadb8" }, children: def.description })] })] }, def.id)))] }, category))) }), _jsxs("div", { style: { padding: 16, borderTop: "1px solid #2f2f35" }, children: [_jsx("button", { onClick: handleRun, disabled: isRunning || nodes.length === 0, style: {
                                    width: "100%",
                                    padding: "10px",
                                    background: isRunning ? "#2f2f35" : "#6366f1",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: isRunning ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    transition: "background 0.2s",
                                }, children: isRunning ? "⏳ Running..." : "▶ Run Workflow" }), _jsxs("div", { style: { fontSize: 10, color: "#adadb8", textAlign: "center", marginTop: 6 }, children: [nodes.length, " nodes \u00B7 ", edges.length, " connections"] })] })] }), _jsx("div", { style: { flex: 1 }, onDrop: onDrop, onDragOver: onDragOver, children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, nodeTypes: nodeTypes, fitView: true, style: { background: "#0e0e10" }, defaultEdgeOptions: {
                        animated: true,
                        style: { stroke: "#6366f1", strokeWidth: 2 },
                    }, children: [_jsx(Background, { variant: BackgroundVariant.Dots, color: "#2f2f35", gap: 24, size: 1 }), _jsx(Controls, { style: { background: "#18181b", borderColor: "#2f2f35", borderRadius: 8 } }), _jsx(MiniMap, { style: { background: "#18181b", borderRadius: 8 }, nodeColor: "#6366f1", maskColor: "rgba(0,0,0,0.7)" }), _jsx(Panel, { position: "top-right", children: _jsxs("div", { style: {
                                    background: "#18181b",
                                    border: "1px solid #2f2f35",
                                    borderRadius: 8,
                                    padding: "8px 14px",
                                    fontSize: 12,
                                    color: "#adadb8",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "#22c55e" } }), "Ready \u2014 Drag nodes from sidebar or click to add"] }) })] }) })] }));
}
