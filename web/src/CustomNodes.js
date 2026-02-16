import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Custom Node Builder — connect any REST API as a workflow node
 */
import { useState } from "react";
const STORAGE_KEY = "openflow_custom_nodes";
export function loadCustomNodes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }
    catch {
        return [];
    }
}
export function saveCustomNodes(nodes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
}
export function CustomNodeBuilder({ onSave }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("custom");
    const [color, setColor] = useState("#a855f7");
    const [inputs, setInputs] = useState([{ name: "input", type: "text" }]);
    const [outputs, setOutputs] = useState([{ name: "output", type: "text" }]);
    const [apiEndpoint, setApiEndpoint] = useState("");
    const [requestTemplate, setRequestTemplate] = useState('{\n  "prompt": "{{input}}"\n}');
    const [responsePath, setResponsePath] = useState("$.result");
    const [saved, setSaved] = useState(false);
    const inputStyle = { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 11, padding: "7px 10px", outline: "none", boxSizing: "border-box", color: "#1a1a1a" };
    const labelStyle = { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4, marginTop: 12 };
    const handleSave = () => {
        if (!name || !apiEndpoint)
            return;
        const node = {
            id: `custom.${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
            name, description, category, color, inputs, outputs, apiEndpoint, requestTemplate, responsePath,
        };
        const existing = loadCustomNodes();
        saveCustomNodes([...existing, node]);
        onSave(node);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setName("");
        setDescription("");
        setApiEndpoint("");
    };
    return (_jsxs("div", { style: { padding: 16 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }, children: "\uD83D\uDD27 Custom Node Builder" }), _jsx("div", { style: { fontSize: 10, color: "#9ca3af", marginBottom: 12 }, children: "Connect any REST API as a workflow node" }), _jsx("div", { style: labelStyle, children: "Node Name *" }), _jsx("input", { value: name, onChange: e => setName(e.target.value), placeholder: "My API Node", style: inputStyle }), _jsx("div", { style: labelStyle, children: "Description" }), _jsx("input", { value: description, onChange: e => setDescription(e.target.value), placeholder: "What does this node do?", style: inputStyle }), _jsxs("div", { style: { display: "flex", gap: 8, marginTop: 12 }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: labelStyle, children: "Category" }), _jsxs("select", { value: category, onChange: e => setCategory(e.target.value), style: { ...inputStyle, cursor: "pointer" }, children: [_jsx("option", { value: "custom", children: "Custom" }), _jsx("option", { value: "tools", children: "Tools" }), _jsx("option", { value: "transform", children: "Transform" }), _jsx("option", { value: "output", children: "Output" })] })] }), _jsxs("div", { style: { width: 60 }, children: [_jsx("div", { style: labelStyle, children: "Color" }), _jsx("input", { type: "color", value: color, onChange: e => setColor(e.target.value), style: { width: "100%", height: 30, border: "none", borderRadius: 8, cursor: "pointer", background: "none" } })] })] }), _jsx("div", { style: labelStyle, children: "Inputs" }), inputs.map((inp, i) => (_jsxs("div", { style: { display: "flex", gap: 4, marginBottom: 4 }, children: [_jsx("input", { value: inp.name, onChange: e => { const n = [...inputs]; n[i].name = e.target.value; setInputs(n); }, placeholder: "name", style: { ...inputStyle, flex: 1 } }), _jsxs("select", { value: inp.type, onChange: e => { const n = [...inputs]; n[i].type = e.target.value; setInputs(n); }, style: { ...inputStyle, width: 80, cursor: "pointer" }, children: [_jsx("option", { value: "text", children: "Text" }), _jsx("option", { value: "image", children: "Image" }), _jsx("option", { value: "number", children: "Number" }), _jsx("option", { value: "select", children: "Select" })] }), inputs.length > 1 && _jsx("button", { onClick: () => setInputs(inputs.filter((_, j) => j !== i)), style: { background: "#fee2e2", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "0 6px", fontSize: 12 }, children: "\u00D7" })] }, i))), _jsx("button", { onClick: () => setInputs([...inputs, { name: "", type: "text" }]), style: { fontSize: 10, color: "#c026d3", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }, children: "+ Add Input" }), _jsx("div", { style: labelStyle, children: "Outputs" }), outputs.map((out, i) => (_jsxs("div", { style: { display: "flex", gap: 4, marginBottom: 4 }, children: [_jsx("input", { value: out.name, onChange: e => { const n = [...outputs]; n[i].name = e.target.value; setOutputs(n); }, placeholder: "name", style: { ...inputStyle, flex: 1 } }), _jsxs("select", { value: out.type, onChange: e => { const n = [...outputs]; n[i].type = e.target.value; setOutputs(n); }, style: { ...inputStyle, width: 80, cursor: "pointer" }, children: [_jsx("option", { value: "text", children: "Text" }), _jsx("option", { value: "image", children: "Image" }), _jsx("option", { value: "number", children: "Number" })] })] }, i))), _jsx("button", { onClick: () => setOutputs([...outputs, { name: "", type: "text" }]), style: { fontSize: 10, color: "#c026d3", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }, children: "+ Add Output" }), _jsx("div", { style: labelStyle, children: "API Endpoint URL *" }), _jsx("input", { value: apiEndpoint, onChange: e => setApiEndpoint(e.target.value), placeholder: "https://api.example.com/v1/generate", style: inputStyle }), _jsx("div", { style: labelStyle, children: "Request Template (JSON)" }), _jsx("textarea", { value: requestTemplate, onChange: e => setRequestTemplate(e.target.value), rows: 4, style: { ...inputStyle, fontFamily: "monospace", fontSize: 10, resize: "vertical" } }), _jsxs("div", { style: { fontSize: 9, color: "#9ca3af", marginTop: 2 }, children: ["Use ", "{{input_name}}", " placeholders for input values"] }), _jsx("div", { style: labelStyle, children: "Response Path (JSONPath)" }), _jsx("input", { value: responsePath, onChange: e => setResponsePath(e.target.value), placeholder: "$.result", style: inputStyle }), _jsx("div", { style: { fontSize: 9, color: "#9ca3af", marginTop: 2 }, children: "Path to extract output from API response" }), _jsx("button", { onClick: handleSave, disabled: !name || !apiEndpoint, style: { width: "100%", marginTop: 16, padding: 10, background: !name || !apiEndpoint ? "#e5e7eb" : "#c026d3", color: !name || !apiEndpoint ? "#9ca3af" : "#fff",
                    border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: !name || !apiEndpoint ? "not-allowed" : "pointer" }, children: saved ? "✓ Saved!" : "Create Custom Node" }), loadCustomNodes().length > 0 && (_jsxs("div", { style: { marginTop: 16 }, children: [_jsx("div", { style: labelStyle, children: "Your Custom Nodes" }), loadCustomNodes().map((n, i) => (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f9f9fb", borderRadius: 8, marginBottom: 4 }, children: [_jsx("div", { style: { width: 8, height: 8, borderRadius: "50%", background: n.color } }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: "#1a1a1a" }, children: n.name }), _jsxs("div", { style: { fontSize: 9, color: "#9ca3af" }, children: [n.apiEndpoint.substring(0, 40), "..."] })] }), _jsx("button", { onClick: () => {
                                    const nodes = loadCustomNodes().filter((_, j) => j !== i);
                                    saveCustomNodes(nodes);
                                    // force re-render
                                    setName(name);
                                }, style: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }, children: "\uD83D\uDDD1" })] }, i)))] }))] }));
}
