/** Global store for model loading state — used by full-screen overlay */

export interface ModelLoadingState {
  active: boolean;
  message?: string;
  progress?: number;
  status?: string;
  /** Current file/shard being downloaded (e.g. "model.safetensors") */
  file?: string;
  /** Optional: file index for multi-shard models (e.g. "File 3 of 12") */
  fileIndex?: number;
  fileTotal?: number;
}

let state: ModelLoadingState = { active: false };
const listeners: Array<(s: ModelLoadingState) => void> = [];

export function getModelLoadingState(): ModelLoadingState {
  return state;
}

export function setModelLoadingState(update: Partial<ModelLoadingState>): void {
  state = { ...state, ...update };
  listeners.forEach((fn) => fn(state));
}

export function subscribeModelLoading(fn: (s: ModelLoadingState) => void): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
