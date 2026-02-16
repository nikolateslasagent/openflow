import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🔴 OpenFlow Error Boundary caught an error:");
    console.error(error);
    console.error("Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const issueUrl = `https://github.com/nikolateslasagent/openflow/issues/new?title=${encodeURIComponent("Bug: " + (this.state.error?.message || "Unknown error"))}&body=${encodeURIComponent("## Error\n```\n" + (this.state.error?.stack || "No stack") + "\n```\n\n## Steps to Reproduce\n1. \n\n## Browser\n" + navigator.userAgent)}`;

      return (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', -apple-system, sans-serif",
          padding: 24,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "48px 40px", maxWidth: 480,
            textAlign: "center", border: "1px solid #e5e7eb",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
              OpenFlow encountered an unexpected error. Your work may have been auto-saved.
            </p>
            {this.state.error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                padding: "12px 16px", marginBottom: 24, textAlign: "left",
                fontSize: 12, color: "#991b1b", fontFamily: "monospace",
                maxHeight: 120, overflow: "auto", wordBreak: "break-all",
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 28px", borderRadius: 10, border: "none",
                  background: "#c026d3", color: "#fff", fontSize: 14,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                ↻ Reload App
              </button>
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "12px 28px", borderRadius: 10, border: "1px solid #e5e7eb",
                  background: "#fff", color: "#1a1a1a", fontSize: 14,
                  fontWeight: 600, cursor: "pointer", display: "inline-flex",
                  alignItems: "center", gap: 6,
                }}
              >
                🐛 Report Bug
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
