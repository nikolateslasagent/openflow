// Training Data Collector — saves generation metadata as JSONL

export interface TrainingRecord {
  timestamp: number;
  model: string;
  prompt: string;
  params: Record<string, unknown>;
  output_url: string;
  generation_time_ms: number;
  user_id: string;
}

const STORAGE_KEY = "openflow_training_data";

export function saveTrainingRecord(record: TrainingRecord) {
  try {
    const existing = localStorage.getItem(STORAGE_KEY) || "";
    const line = JSON.stringify(record) + "\n";
    localStorage.setItem(STORAGE_KEY, existing + line);
  } catch {
    // Storage full — silently fail
  }
}

export function getTrainingRecords(): TrainingRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || "";
    return data.split("\n").filter(l => l.trim()).map(l => JSON.parse(l)).reverse();
  } catch { return []; }
}

export function clearTrainingData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getTrainingDataCount(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || "";
    return data.split("\n").filter(l => l.trim()).length;
  } catch { return 0; }
}

export function exportTrainingData() {
  const data = localStorage.getItem(STORAGE_KEY) || "";
  const blob = new Blob([data], { type: "application/x-ndjson" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `openflow-training-data-${new Date().toISOString().slice(0, 10)}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}
