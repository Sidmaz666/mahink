import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { pipeline, env } from "@huggingface/transformers";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import os from "os";

env.allowLocalModels = true;
env.useBrowserCache = false;
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const W = 1920;
const H = 1080;
const HALF = 960;
const TEXT_X = HALF + 64;
const RIGHT_W = HALF - 64;

type SegType = "book_title" | "author" | "chapter_title" | "paragraph";

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildSegments(book: any, chapters: any[]): { text: string; pauseMs: number; type: SegType }[] {
  const segments: { text: string; pauseMs: number; type: SegType }[] = [];
  segments.push({ text: book?.title || "Untitled", pauseMs: 1200, type: "book_title" });
  const author = book?.author || book?.publishing?.author || "Anonymous";
  segments.push({ text: `by ${author}`, pauseMs: 800, type: "author" });
  for (const ch of chapters) {
    const chTitle = ch.title || "Chapter";
    const clean = stripHtml(ch.content || "");
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || (clean ? [clean] : []);
    segments.push({ text: chTitle, pauseMs: 600, type: "chapter_title" });
    for (let i = 0; i < sentences.length; i++) {
      segments.push({ text: sentences[i].trim(), pauseMs: i < sentences.length - 1 ? 150 : 400, type: "paragraph" });
    }
  }
  return segments;
}

function generateSilence(dSec: number, sr: number): Float32Array {
  return new Float32Array(Math.round(dSec * sr));
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return escapeXml(text);
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.map((l) => escapeXml(l)).join("<br/>");
}

function buildFrameSvg(book: any, segmentText: string, segType: SegType): string {
  const title = book?.title || "Untitled";
  const subtitle = book?.subtitle || "";
  const author = book?.author || book?.publishing?.author || "Anonymous";
  const fontStack = "'Playfair Display','Georgia',serif";

  let displayText = segmentText;
  let displaySize = 32;
  if (segType === "book_title") { displayText = title; displaySize = 48; }
  else if (segType === "author") { displaySize = 36; }
  else if (segType === "chapter_title") { displaySize = 38; }

  const wrapped = wrapText(displayText, 45);
  const lines = wrapped.split("<br/>");
  const lh = displaySize * 1.45;
  const bh = lines.length * lh;
  const centerY = H / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&amp;display=swap');</style>
  </defs>
  <rect x="${HALF}" y="0" width="${HALF}" height="${H}" fill="#181818" />
  <rect x="${HALF}" y="0" width="1" height="${H}" fill="rgba(255,255,255,0.10)" />
  <text x="${TEXT_X}" y="70" font-family="${fontStack}" font-size="26" font-weight="700" fill="#f0f0f0">${escapeXml(title)}</text>
  ${subtitle ? `<text x="${TEXT_X}" y="104" font-family="${fontStack}" font-size="16" font-weight="400" font-style="italic" fill="rgba(255,255,255,0.65)" >${escapeXml(subtitle)}</text>` : ""}
  <text x="${TEXT_X}" y="${subtitle ? 132 : 104}" font-family="${fontStack}" font-size="14" font-weight="400" fill="rgba(255,255,255,0.45)">by ${escapeXml(author)}</text>
  ${lines.map((l, i) => {
    const y = centerY - bh / 2 + i * lh + displaySize * 0.35;
    return `<text x="${TEXT_X}" y="${Math.round(y)}" font-family="${fontStack}" font-size="${displaySize}" font-weight="400" fill="#f0f0f0">${l}</text>`;
  }).join("\n  ")}
</svg>`;
}

export async function POST(req: Request) {
  try {
    const { book, chapters, coverImage } = await req.json();
    if (!chapters || !chapters.length) return Response.json({ error: "No chapters provided" }, { status: 400 });
    if (!coverImage) return Response.json({ error: "No cover image provided" }, { status: 400 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (pct: number, message: string) => {
          controller.enqueue(encoder.encode(JSON.stringify({ type: "progress", pct, message }) + "\n"));
        };

        const tmpdir = os.tmpdir();
        const sessionId = Date.now().toString() + Math.random().toString(36).slice(2);
        const frameDir = path.join(tmpdir, `frames_${sessionId}`);
        const audioPath = path.join(tmpdir, `audio_${sessionId}.wav`);
        const concatPath = path.join(tmpdir, `concat_${sessionId}.txt`);
        const vidPath = path.join(tmpdir, `video_${sessionId}.mp4`);
        await fs.mkdir(frameDir, { recursive: true });

        sendProgress(2, "Building segments...");
        const segments = buildSegments(book, chapters);

        sendProgress(5, "Loading TTS model...");
        const synthesizer = await pipeline("text-to-speech", "Xenova/mms-tts-eng");
        const sampleRate = 16000;
        const audioParts: Float32Array[] = [];
        const durations: number[] = [];

        sendProgress(8, `Generating audio for ${segments.length} segments...`);
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          if (!seg.text) { durations.push(0); continue; }
          const pct = Math.round(8 + ((i + 1) / segments.length) * 32);
          sendProgress(pct, `TTS audio ${i + 1}/${segments.length}...`);
          const out: any = await (synthesizer as any)(seg.text);
          const audio = out.audio as Float32Array;
          audioParts.push(audio);
          durations.push(audio.length / sampleRate + seg.pauseMs / 1000);
          if (seg.pauseMs > 0) audioParts.push(generateSilence(seg.pauseMs / 1000, sampleRate));
        }

        sendProgress(42, "Writing audio file...");
        const totalLen = audioParts.reduce((s, a) => s + a.length, 0);
        const pcm = new Float32Array(totalLen);
        let off = 0;
        for (const part of audioParts) { pcm.set(part, off); off += part.length; }
        const dataLen = pcm.length * 2;
        const wav = Buffer.alloc(44 + dataLen);
        wav.write("RIFF", 0);
        wav.writeUInt32LE(36 + dataLen, 4);
        wav.write("WAVE", 8);
        wav.write("fmt ", 12);
        wav.writeUInt32LE(16, 16);
        wav.writeUInt16LE(1, 20);
        wav.writeUInt16LE(1, 22);
        wav.writeUInt32LE(sampleRate, 24);
        wav.writeUInt32LE(sampleRate * 2, 28);
        wav.writeUInt16LE(2, 32);
        wav.writeUInt16LE(16, 34);
        wav.write("data", 36);
        wav.writeUInt32LE(dataLen, 40);
        for (let i = 0; i < pcm.length; i++) {
          const s = Math.max(-1, Math.min(1, pcm[i]));
          wav.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, 44 + i * 2);
        }
        await fs.writeFile(audioPath, wav);

        sendProgress(45, "Processing cover...");
        const coverB64 = coverImage.startsWith("data:") ? coverImage.split(",")[1] : coverImage;
        const coverBuf = Buffer.from(coverB64, "base64");

        // Cover on left half - fills entire 960x1080, no margins
        const coverImg = await sharp(coverBuf)
          .resize(HALF, H, { fit: "cover", position: "center" })
          .png()
          .toBuffer();

        sendProgress(48, `Generating ${segments.length} video frames...`);
        const concatLines: string[] = [];
        for (let si = 0; si < segments.length; si++) {
          const seg = segments[si];
          const dur = durations[si];
          if (dur <= 0) continue;

          const pct = Math.round(48 + ((si + 1) / segments.length) * 22);
          sendProgress(pct, `Frame ${si + 1}/${segments.length}...`);

          const svg = buildFrameSvg(book, seg.text, seg.type);
          const svgBuf = Buffer.from(svg);

          const frameBuf = await sharp({
            create: { width: W, height: H, channels: 3, background: { r: 18, g: 18, b: 18 } },
          })
            .composite([
              { input: coverImg, top: 0, left: 0 },
              { input: svgBuf, top: 0, left: 0 },
            ])
            .png()
            .toBuffer();

          const framePath = path.join(frameDir, `f${String(si).padStart(5, "0")}.png`);
          await fs.writeFile(framePath, frameBuf);
          concatLines.push(`file '${framePath.replace(/\\/g, "/")}'`);
          concatLines.push(`duration ${dur.toFixed(3)}`);
        }

        await fs.writeFile(concatPath, concatLines.join("\n"));

        sendProgress(72, "Encoding video with ffmpeg...");
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(concatPath).inputOptions(["-f concat", "-safe 0"])
            .input(audioPath)
            .outputOptions([
              "-c:v libx264", "-tune stillimage",
              "-c:a aac", "-b:a 192k",
              "-pix_fmt yuv420p",
              "-vf", `scale=${W}:${H}`,
              "-shortest",
            ])
            .save(vidPath)
            .on("end", () => resolve())
            .on("error", (err: Error) => reject(err));
        });

        sendProgress(95, "Reading final video...");
        const videoData = await fs.readFile(vidPath);

        sendProgress(99, "Sending download...");
        controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
        controller.enqueue(new Uint8Array(videoData));
        controller.close();

        fs.rm(frameDir, { recursive: true, force: true }).catch(() => {});
        fs.unlink(audioPath).catch(() => {});
        fs.unlink(concatPath).catch(() => {});
        fs.unlink(vidPath).catch(() => {});
      },
    });

    return new Response(stream as any, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="audiobook.mp4"`,
      },
    });
  } catch (error) {
    console.error("Video Export error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
