/**
 * Webhook & HTTP node definitions for Sprint 8
 */
export const WEBHOOK_NODE_DEFS = [
    {
        id: "webhook.trigger",
        name: "Webhook Trigger",
        description: "Generates a unique URL — triggers workflow on POST request",
        category: "input",
        icon: "🔗",
        color: "#06b6d4",
        inputs: [
            { name: "path", type: "string", description: "Webhook path suffix", default: "/my-workflow" },
            { name: "secret", type: "string", description: "Optional auth secret", default: "" },
        ],
        outputs: [
            { name: "body", type: "string", description: "Request body (JSON)" },
            { name: "headers", type: "string", description: "Request headers" },
        ],
    },
    {
        id: "http.request",
        name: "HTTP Request",
        description: "Make arbitrary HTTP calls (GET/POST) with configurable headers and body",
        category: "tools",
        icon: "🌐",
        color: "#06b6d4",
        inputs: [
            { name: "url", type: "string", description: "Request URL", required: true },
            { name: "method", type: "string", description: "HTTP method", default: "POST", options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
            { name: "headers", type: "string", description: "Headers (JSON)", default: '{"Content-Type": "application/json"}' },
            { name: "body", type: "string", description: "Request body", default: "" },
        ],
        outputs: [
            { name: "response", type: "string", description: "Response body" },
            { name: "status", type: "integer", description: "HTTP status code" },
        ],
    },
    {
        id: "webhook.output",
        name: "Output Webhook",
        description: "Sends workflow results to a configured URL when complete",
        category: "output",
        icon: "📤",
        color: "#06b6d4",
        inputs: [
            { name: "url", type: "string", description: "Destination URL", required: true },
            { name: "data", type: "any", description: "Data to send", required: true },
            { name: "headers", type: "string", description: "Custom headers (JSON)", default: '{"Content-Type": "application/json"}' },
        ],
        outputs: [
            { name: "success", type: "string", description: "Success/failure status" },
        ],
    },
];
