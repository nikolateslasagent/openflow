/**
 * WorkflowSharing — Export/import workflows via URL hash
 * Sprint 6
 */

export function encodeWorkflowToUrl(workflow: object): string {
  const json = JSON.stringify(workflow);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `${window.location.origin}${window.location.pathname}#workflow=${base64}`;
}

export function decodeWorkflowFromHash(): object | null {
  const hash = window.location.hash;
  if (!hash.startsWith("#workflow=")) return null;
  try {
    const base64 = hash.slice("#workflow=".length);
    const json = decodeURIComponent(escape(atob(base64)));
    const wf = JSON.parse(json);
    // Clear hash after reading
    window.history.replaceState(null, "", window.location.pathname);
    return wf;
  } catch {
    return null;
  }
}
