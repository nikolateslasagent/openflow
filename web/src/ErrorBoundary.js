import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("🔴 OpenFlow Error Boundary caught an error:");
        console.error(error);
        console.error("Component stack:", errorInfo.componentStack);
        this.setState({ errorInfo });
    }
    render() {
        if (this.state.hasError) {
            const issueUrl = `https://github.com/nikolateslasagent/openflow/issues/new?title=${encodeURIComponent("Bug: " + (this.state.error?.message || "Unknown error"))}&body=${encodeURIComponent("## Error\n```\n" + (this.state.error?.stack || "No stack") + "\n```\n\n## Steps to Reproduce\n1. \n\n## Browser\n" + navigator.userAgent)}`;
            return (_jsx("div", { style: {
                    display: "flex", alignItems: "center", justifyContent: "center",
                    minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', -apple-system, sans-serif",
                    padding: 24,
                }, children: _jsxs("div", { style: {
                        background: "#fff", borderRadius: 20, padding: "48px 40px", maxWidth: 480,
                        textAlign: "center", border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    }, children: [_jsx("div", { style: { fontSize: 48, marginBottom: 16 }, children: "\uD83D\uDE35" }), _jsx("h1", { style: { fontSize: 24, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }, children: "Something went wrong" }), _jsx("p", { style: { fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }, children: "OpenFlow encountered an unexpected error. Your work may have been auto-saved." }), this.state.error && (_jsx("div", { style: {
                                background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                                padding: "12px 16px", marginBottom: 24, textAlign: "left",
                                fontSize: 12, color: "#991b1b", fontFamily: "monospace",
                                maxHeight: 120, overflow: "auto", wordBreak: "break-all",
                            }, children: this.state.error.message })), _jsxs("div", { style: { display: "flex", gap: 12, justifyContent: "center" }, children: [_jsx("button", { onClick: () => window.location.reload(), style: {
                                        padding: "12px 28px", borderRadius: 10, border: "none",
                                        background: "#c026d3", color: "#fff", fontSize: 14,
                                        fontWeight: 600, cursor: "pointer",
                                    }, children: "\u21BB Reload App" }), _jsx("a", { href: issueUrl, target: "_blank", rel: "noopener noreferrer", style: {
                                        padding: "12px 28px", borderRadius: 10, border: "1px solid #e5e7eb",
                                        background: "#fff", color: "#1a1a1a", fontSize: 14,
                                        fontWeight: 600, cursor: "pointer", display: "inline-flex",
                                        alignItems: "center", gap: 6,
                                    }, children: "\uD83D\uDC1B Report Bug" })] })] }) }));
        }
        return this.props.children;
    }
}
