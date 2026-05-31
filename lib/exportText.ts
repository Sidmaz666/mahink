import type { Book, Chapter } from "./types";
import { stripHtml } from "./ai";

function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMarkdownManuscript(book: Book, chapters: Chapter[]): void {
  const content = [
    `# ${book.title}`,
    book.subtitle ? `## ${book.subtitle}` : "",
    "",
    ...chapters.flatMap((chapter) => [
      `## ${chapter.title}`,
      "",
      stripHtml(chapter.content),
      "",
    ]),
  ]
    .filter(Boolean)
    .join("\n");

  downloadText(`${slugify(book.title)}.md`, content);
}

export function exportHtmlManuscript(book: Book, chapters: Chapter[]): void {
  const body = chapters
    .map((chapter) => `<section><h2>${escapeHtml(chapter.title)}</h2>${chapter.content}</section>`)
    .join("\n");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(book.title)}</title></head><body><h1>${escapeHtml(book.title)}</h1>${book.subtitle ? `<h2>${escapeHtml(book.subtitle)}</h2>` : ""}${body}</body></html>`;
  downloadText(`${slugify(book.title)}.html`, html, "text/html;charset=utf-8");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value: string): string {
  return (value || "mahink").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
