import type { Book, Chapter, ExportOptions, AppSettings } from "./types";

export async function exportPDF(
  book: Book,
  chapters: Chapter[],
  opts: ExportOptions,
  settings: AppSettings,
): Promise<void> {
  const exportData = { book, chapters, opts, settings };
  // Generate a random ID for this specific export run
  const id = "folioi_export_" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  
  try {
    localStorage.setItem(id, JSON.stringify(exportData));
  } catch (e) {
    console.error("Local storage error:", e);
    throw new Error("Export data is too large for local browser storage. Try exporting fewer chapters at once.");
  }

  // Open the print preview in a new tab with the localId reference
  window.open(`/preview/pdf?localId=${id}&print=true`, "_blank");
}
