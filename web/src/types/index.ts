/**
 * Core TypeScript types for OpenFlow.
 *
 * These types mirror the backend data models and are used throughout
 * the frontend for type-safe workflow editing and execution.
 */

// ---------------------------------------------------------------------------
// Port & Node definitions (from node registry)
// ---------------------------------------------------------------------------

/** Supported data types for node connections. */
export type PortType =
  | "string"
  | "integer"
  | "float"
  | "boolean"
  | "image"
  | "video"
  | "audio"
  | "json"
  | "any";

/** A typed input or output slot on a node. */
export interface PortDefinition {
  name: string;
  type: PortType;
  description: string;
  default?: unknown;
  required?: boolean;
  options?: string[];
}

/** A node type definition from the registry. */
export interface NodeDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
}

// ---------------------------------------------------------------------------
// Workflow graph
// ---------------------------------------------------------------------------

/** Position on the canvas. */
export interface Position {
  x: number;
  y: number;
}

/** A node instance in a workflow. */
export interface WorkflowNode {
  id: string;
  type: string; // Maps to NodeDefinition.id
  position: Position;
  data: Record<string, unknown>; // Static input values set by the user
}

/** A connection between two node ports. */
export interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle: string; // Output port name
  target: string;
  targetHandle: string; // Input port name
}

/** A complete workflow. */
export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Execution & Generation
// ---------------------------------------------------------------------------

/** Status of a node during execution. */
export type NodeStatus = "pending" | "running" | "completed" | "error" | "cancelled";

/** Real-time progress update from the WebSocket. */
export interface ProgressUpdate {
  nodeId: string;
  status: NodeStatus;
  data: {
    latencyMs?: number;
    outputs?: Record<string, unknown>;
    error?: string;
  };
}

/** A logged generation record (from the data collector). */
export interface GenerationRecord {
  id: string;
  runId: string;
  workflowId: string;
  nodeId: string;
  nodeType: string;
  timestamp: string;
  provider: string;
  model: string;
  type: "image" | "video" | "text" | "audio" | "transform" | "other";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  metrics: {
    latencyMs: number;
    costUsd?: number;
  };
  videoMeta?: {
    motionScore?: number;
    cameraMovement?: string;
    sceneTransitions?: number;
    faceCount?: number;
    textOverlay?: boolean;
    aspectRatio?: string;
    codec?: string;
    bitrateKbps?: number;
  };
}

// ---------------------------------------------------------------------------
// UI State
// ---------------------------------------------------------------------------

/** Which panel is open in the sidebar. */
export type SidebarPanel = "nodes" | "properties" | "output" | "gallery";

/** Category for grouping nodes in the palette. */
export interface NodeCategory {
  id: string;
  name: string;
  icon: string;
  nodes: NodeDefinition[];
}
