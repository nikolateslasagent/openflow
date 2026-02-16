/**
 * OpenFlow API client with auth
 */

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getToken(): string | null {
  return localStorage.getItem("openflow_token");
}

function setToken(token: string) {
  localStorage.setItem("openflow_token", token);
}

function clearToken() {
  localStorage.removeItem("openflow_token");
}

function getUser(): { id: string; email: string; username: string } | null {
  const raw = localStorage.getItem("openflow_user");
  return raw ? JSON.parse(raw) : null;
}

function setUser(user: { id: string; email: string; username: string }) {
  localStorage.setItem("openflow_user", JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem("openflow_user");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (resp.status === 401) {
    clearToken();
    clearUser();
    throw new Error("Unauthorized");
  }
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || "API error");
  }
  return resp.json();
}

// Auth
export async function signup(email: string, username: string, password: string) {
  const data = await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export function logout() {
  clearToken();
  clearUser();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export { getUser, getToken };

// Projects
export async function listProjects() {
  return apiFetch("/projects");
}

export async function createProject(name: string, description = "") {
  return apiFetch("/projects", { method: "POST", body: JSON.stringify({ name, description }) });
}

// Workflows
export async function listWorkflows(projectId: string) {
  return apiFetch(`/projects/${projectId}/workflows`);
}

export async function createWorkflow(projectId: string, name: string, data: object) {
  return apiFetch(`/projects/${projectId}/workflows`, {
    method: "POST",
    body: JSON.stringify({ name, data }),
  });
}

export async function updateWorkflow(workflowId: string, data: object) {
  return apiFetch(`/workflows/${workflowId}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

// Generate via backend proxy
export async function generateViaBackend(model: string, inputs: Record<string, unknown>, projectId?: string) {
  return apiFetch("/generate", {
    method: "POST",
    body: JSON.stringify({ model, inputs, project_id: projectId }),
  });
}

// Assets
export async function listAssets(limit = 50, offset = 0) {
  return apiFetch(`/assets?limit=${limit}&offset=${offset}`);
}

// Scene Builder
export async function buildScenes(story: string, numScenes = 4, style = "cinematic") {
  return apiFetch("/scene-builder", {
    method: "POST",
    body: JSON.stringify({ story, num_scenes: numScenes, style }),
  });
}
