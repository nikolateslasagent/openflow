import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * OpenFlow — Main Application
 *
 * React Flow canvas with a sidebar node palette. Users drag nodes
 * from the palette onto the canvas, connect them, and execute workflows.
 */
import { useCallback, useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, BackgroundVariant, } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
// ---------------------------------------------------------------------------
// Sample node definitions (replaced by API call in production)
// ---------------------------------------------------------------------------
const SAMPLE_NODES = [
    {
        id: "text.input",
        name: "Text Input",
        description: "A text prompt input",
        category: "input",
        icon: "✏️",
        inputs: [],
        outputs: [{ name: "text", type: "string", description: "The text value" }],
    },
    {
        id: "image.text_to_image",
        name: "Text to Image",
        description: "Generate an image from a text prompt",
        category: "image",
        icon: "🖼️",
        inputs: [
            { name: "prompt", type: "string", description: "Text prompt", required: true },
            { name: "model", type: "string", description: "Model to use", default: "flux-pro" },
            { name: "width", type: "integer", description: "Width", default: 1024 },
            { name: "height", type: "integer", description: "Height", default: 1024 },
        ],
        outputs: [{ name: "image", type: "image", description: "Generated image" }],
    },
    {
        id: "video.text_to_video",
        name: "Text to Video",
        description: "Generate a video from a text prompt",
        category: "video",
        icon: "🎬",
        inputs: [
            { name: "prompt", type: "string", description: "Text prompt", required: true },
            { name: "model", type: "string", description: "Model", default: "wan-2.6" },
            { name: "duration", type: "integer", description: "Duration (seconds)", default: 4 },
        ],
        outputs: [{ name: "video", type: "video", description: "Generated video" }],
    },
    {
        id: "image.upscale",
        name: "Upscale",
        description: "Upscale an image to higher resolution",
        category: "transform",
        icon: "🔍",
        inputs: [
            { name: "image", type: "image", description: "Input image", required: true },
            { name: "scale", type: "integer", description: "Scale factor", default: 2 },
        ],
        outputs: [{ name: "image", type: "image", description: "Upscaled image" }],
    },
    {
        id: "output.preview",
        name: "Preview",
        description: "Display the output",
        category: "output",
        icon: "👁️",
        inputs: [
            { name: "input", type: "any", description: "Any value to preview", required: true },
        ],
        outputs: [],
    },
];
// ---------------------------------------------------------------------------
// Category grouping
// ---------------------------------------------------------------------------
const CATEGORIES = {
    input: "📥 Inputs",
    image: "🖼️ Image",
    video: "🎬 Video",
    transform: "🔄 Transform",
    output: "📤 Output",
};
function groupByCategory(nodes) {
    const groups = {};
    for (const node of nodes) {
        const cat = node.category || "general";
        if (!groups[cat])
            groups[cat] = [];
        groups[cat].push(node);
    }
    return groups;
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const grouped = useMemo(() => groupByCategory(SAMPLE_NODES), []);
    const onConnect = useCallback((connection) => {
        setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    }, [setEdges]);
    /** Drop a new node from the palette onto the canvas. */
    const addNode = useCallback((def) => {
        const newNode = {
            id: `${def.id}_${Date.now()}`,
            type: "default",
            position: { x: 250 + Math.random() * 200, y: 100 + Math.random() * 200 },
            data: {
                label: `${def.icon} ${def.name}`,
                nodeType: def.id,
                inputs: def.inputs,
                outputs: def.outputs,
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes]);
    return (_jsxs("div", { style: { display: "flex", height: "100vh", background: "#0e0e10" }, children: [_jsxs("aside", { style: {
                    width: 260,
                    background: "#18181b",
                    borderRight: "1px solid #2f2f35",
                    overflowY: "auto",
                    padding: 0,
                    flexShrink: 0,
                }, children: [_jsxs("div", { style: {
                            padding: "16px",
                            borderBottom: "1px solid #2f2f35",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }, children: [_jsx("span", { style: { fontSize: 20 }, children: "\u26A1" }), _jsx("span", { style: {
                                    fontSize: 16,
                                    fontWeight: 800,
                                    color: "#efeff1",
                                    letterSpacing: "-0.5px",
                                }, children: "OpenFlow" })] }), Object.entries(grouped).map(([category, defs]) => (_jsxs("div", { children: [_jsx("div", { style: {
                                    padding: "12px 16px 6px",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#adadb8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }, children: CATEGORIES[category] || category }), defs.map((def) => (_jsxs("button", { onClick: () => addNode(def), style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    width: "100%",
                                    padding: "8px 16px",
                                    background: "transparent",
                                    border: "none",
                                    color: "#efeff1",
                                    fontSize: 13,
                                    cursor: "pointer",
                                    textAlign: "left",
                                }, onMouseOver: (e) => (e.currentTarget.style.background = "#1f1f23"), onMouseOut: (e) => (e.currentTarget.style.background = "transparent"), children: [_jsx("span", { style: { fontSize: 16 }, children: def.icon }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: def.name }), _jsx("div", { style: { fontSize: 11, color: "#adadb8" }, children: def.description })] })] }, def.id)))] }, category)))] }), _jsx("div", { style: { flex: 1 }, children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, fitView: true, style: { background: "#0e0e10" }, children: [_jsx(Background, { variant: BackgroundVariant.Dots, color: "#2f2f35", gap: 20 }), _jsx(Controls, {}), _jsx(MiniMap, { style: { background: "#18181b" }, nodeColor: "#9147ff", maskColor: "rgba(0,0,0,0.6)" })] }) })] }));
}
