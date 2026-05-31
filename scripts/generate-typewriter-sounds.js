#!/usr/bin/env node
/**
 * Downloads typewriter WAV sounds from Big Sound Bank (CC0 / public domain).
 * Run: node scripts/generate-typewriter-sounds.js
 * Output: public/sounds/typewriter-*.wav
 *
 * Sources (all CC0):
 * - Mechanical: https://bigsoundbank.com/typewriter-key-s2842.html
 * - Classic: https://bigsoundbank.com/sound-1065-machine-ecrire.html
 * - Electric: https://bigsoundbank.com/sound-2838-machine-a-ecrire-5.html
 * - Soft: https://bigsoundbank.com/sound-2839-machine-a-ecrire-6.html
 * - Minimal: https://bigsoundbank.com/sound-2841-machine-a-ecrire-8.html
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SOUNDS = [
  { id: "2842", preset: "mechanical", start: 0 },
  { id: "2839", preset: "soft", start: 1.2 },
  { id: "2838", preset: "electric", start: 3.0 },
  { id: "1065", preset: "classic", start: 2.0 },
  { id: "2841", preset: "minimal", start: 2.5 },
];
// Extract from mid-recording to avoid silence at start (longer files have room tone first)
const BASE = "https://bigsoundbank.com/UPLOAD/bwf-en";
const OUT_DIR = path.join(__dirname, "..", "public", "sounds");
const TRIM_SEC = 0.15;

function download(id) {
  return new Promise((resolve, reject) => {
    const url = `${BASE}/${id}`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`${url} returned ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const seen = new Set();
  for (const { id, preset, start } of SOUNDS) {
    try {
      if (!seen.has(id)) {
        const buf = await download(id);
        const rawPath = path.join(OUT_DIR, `_raw_${id}.wav`);
        fs.writeFileSync(rawPath, buf);
        seen.add(id);
      }
      const rawPath = path.join(OUT_DIR, `_raw_${id}.wav`);
      const outPath = path.join(OUT_DIR, `typewriter-${preset}.wav`);
      const tmp = path.join(OUT_DIR, `typewriter-${preset}-trim.wav`);
      execSync(`ffmpeg -y -i "${rawPath}" -ss ${start} -t ${TRIM_SEC} -acodec copy "${tmp}"`, {
        stdio: "ignore",
      });
      fs.renameSync(tmp, outPath);
      console.log(`Created typewriter-${preset}.wav`);
    } catch (e) {
      console.error(`Failed ${preset}:`, e.message);
    }
  }
  for (const id of seen) {
    try {
      fs.unlinkSync(path.join(OUT_DIR, `_raw_${id}.wav`));
    } catch {}
  }

  console.log("Done.");
}

main();
