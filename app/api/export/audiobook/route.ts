import { pipeline, env } from "@huggingface/transformers";
import fs from "fs/promises";
import path from "path";
import os from "os";

env.allowLocalModels = true;
env.useBrowserCache = false;

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildSegments(book: any, chapters: any[]): { text: string; pauseMs: number }[] {
  const segments: { text: string; pauseMs: number }[] = [];
  const bookTitle = book?.title || "Untitled";
  segments.push({ text: bookTitle, pauseMs: 1200 });
  const author = book?.author || book?.publishing?.author || "Anonymous";
  segments.push({ text: `by ${author}`, pauseMs: 800 });
  for (const ch of chapters) {
    const chTitle = ch.title || "Chapter";
    const clean = stripHtml(ch.content || "");
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || (clean ? [clean] : []);
    segments.push({ text: chTitle, pauseMs: 600 });
    for (let i = 0; i < sentences.length; i++) {
      segments.push({ text: sentences[i].trim(), pauseMs: i < sentences.length - 1 ? 150 : 400 });
    }
  }
  return segments;
}

function generateSilence(durationSec: number, sampleRate: number): Float32Array {
  return new Float32Array(Math.round(durationSec * sampleRate));
}

export async function POST(req: Request) {
  try {
    const { book, chapters } = await req.json();
    if (!chapters || !chapters.length) return Response.json({ error: "No chapters provided" }, { status: 400 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (pct: number, message: string) => {
          controller.enqueue(encoder.encode(JSON.stringify({ type: "progress", pct, message }) + "\n"));
        };

        sendProgress(2, "Building text segments...");
        const segments = buildSegments(book, chapters);
        sendProgress(5, `Loaded ${segments.length} segments, loading TTS model...`);

        const synthesizer = await pipeline("text-to-speech", "Xenova/mms-tts-eng");
        const sampleRate = 16000;
        const audioParts: Float32Array[] = [];

        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          if (!seg.text) continue;
          const pct = Math.round(5 + ((i + 1) / segments.length) * 83);
          sendProgress(pct, `Generating audio ${i + 1}/${segments.length}...`);

          const out: any = await (synthesizer as any)(seg.text);
          audioParts.push(out.audio as Float32Array);
          if (seg.pauseMs > 0) {
            audioParts.push(generateSilence(seg.pauseMs / 1000, sampleRate));
          }
        }

        sendProgress(90, "Finalizing audio...");

        const totalLength = audioParts.reduce((sum, a) => sum + a.length, 0);
        const pcm = new Float32Array(totalLength);
        let offset = 0;
        for (const part of audioParts) {
          pcm.set(part, offset);
          offset += part.length;
        }

        const dataLength = pcm.length * 2;
        const buffer = Buffer.alloc(44 + dataLength);
        buffer.write("RIFF", 0);
        buffer.writeUInt32LE(36 + dataLength, 4);
        buffer.write("WAVE", 8);
        buffer.write("fmt ", 12);
        buffer.writeUInt32LE(16, 16);
        buffer.writeUInt16LE(1, 20);
        buffer.writeUInt16LE(1, 22);
        buffer.writeUInt32LE(sampleRate, 24);
        buffer.writeUInt32LE(sampleRate * 2, 28);
        buffer.writeUInt16LE(2, 32);
        buffer.writeUInt16LE(16, 34);
        buffer.write("data", 36);
        buffer.writeUInt32LE(dataLength, 40);

        for (let i = 0; i < pcm.length; i++) {
          let s = Math.max(-1, Math.min(1, pcm[i]));
          buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, 44 + i * 2);
        }

        sendProgress(99, "Sending download...");
        controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      },
    });

    return new Response(stream as any, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="audiobook.wav"`,
      },
    });
  } catch (error) {
    console.error("Audiobook Export error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
