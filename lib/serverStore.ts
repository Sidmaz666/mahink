// In-memory store for temporary export data to avoid writing to disk cache
// This is used for backend processes (like video/audiobook export) that need 
// to reference data by ID during a multi-step process.

const store = new Map<string, any>();

export function setExportData(id: string, data: any) {
  store.set(id, data);
  // Auto-clean after 10 minutes
  setTimeout(() => store.delete(id), 10 * 60 * 1000);
}

export function getExportData(id: string) {
  return store.get(id);
}

export function removeExportData(id: string) {
  store.delete(id);
}
