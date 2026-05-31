import type { Book, Chapter } from "./types";
import { getCoverFrontDataUrl } from "./exportCover";

export interface AudiobookExportProgress {
  phase: "preparing" | "recording" | "finalizing";
  pct: number;
  message?: string;
}

const DONE_MARKER = '\n{"type":"done"}\n';

function findSubarray(buf: Uint8Array, marker: Uint8Array): number {
  outer: for (let i = 0; i <= buf.length - marker.length; i++) {
    for (let j = 0; j < marker.length; j++) {
      if (buf[i + j] !== marker[j]) continue outer;
    }
    return i;
  }
  return -1;
}

async function streamExport(
  url: string,
  body: object,
  onProgress?: (p: AudiobookExportProgress) => void,
  mimeType = "audio/wav",
): Promise<Blob> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Export failed");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  const markerBytes = new TextEncoder().encode(DONE_MARKER);
  const allBytes: number[] = [];
  const binaryChunks: Uint8Array[] = [];
  let doneIdx = -1;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (doneIdx === -1) {
      for (let i = 0; i < value.length; i++) allBytes.push(value[i]);
      doneIdx = findSubarray(new Uint8Array(allBytes), markerBytes);
      if (doneIdx !== -1) {
        const text = decoder.decode(new Uint8Array(allBytes.slice(0, doneIdx)));
        for (const line of text.split("\n").filter(Boolean)) {
          try {
            const data = JSON.parse(line);
            if (data.type === "progress") {
              const pct = data.pct ?? 0;
              const phase = pct < 10 ? "preparing" : pct < 90 ? "recording" : "finalizing";
              onProgress?.({ phase, pct, message: data.message });
            }
          } catch {}
        }
        const binaryStart = doneIdx + markerBytes.length;
        const trailing = allBytes.slice(binaryStart);
        if (trailing.length > 0) binaryChunks.push(new Uint8Array(trailing));
      }
    } else {
      binaryChunks.push(value);
    }
  }

  return new Blob(binaryChunks as BlobPart[], { type: mimeType });
}

export async function exportAudiobookAudio(
  book: Book,
  chapters: Chapter[],
  onProgress?: (p: AudiobookExportProgress) => void,
): Promise<void> {
  onProgress?.({ phase: "preparing", pct: 1, message: "Preparing cover..." });
  const coverImage = await getCoverFrontDataUrl(book);

  const blob = await streamExport(
    "/api/export/audiobook",
    { book, chapters, coverImage },
    onProgress,
    "audio/wav",
  );

  onProgress?.({ phase: "finalizing", pct: 99, message: "Downloading..." });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(book.title || "audiobook").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.wav`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAudiobookVideo(
  book: Book,
  chapters: Chapter[],
  onProgress?: (p: AudiobookExportProgress) => void,
): Promise<void> {
  onProgress?.({ phase: "preparing", pct: 1, message: "Preparing cover..." });
  const coverImage = await getCoverFrontDataUrl(book);

  const blob = await streamExport(
    "/api/export/video",
    { book, chapters, coverImage },
    onProgress,
    "video/mp4",
  );

  onProgress?.({ phase: "finalizing", pct: 99, message: "Downloading..." });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(book.title || "audiobook").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`;
  a.click();
  URL.revokeObjectURL(url);
}
