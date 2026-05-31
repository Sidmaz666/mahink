import pako from "pako";

/**
 * Encode arbitrary data into a URL-safe, compressed hash string.
 * Uses deflate (level 9) + base64url encoding.
 */
export function encodeShareData(data: unknown): string {
  const json = JSON.stringify(data);
  const compressed = pako.deflate(json, { level: 9 });
  const bytes = new Uint8Array(compressed);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a compressed, URL-safe hash string back into the original data.
 */
export function decodeShareData<T = unknown>(encoded: string): T {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.inflate(bytes, { to: "string" });
  return JSON.parse(decompressed) as T;
}

/**
 * Build a full shareable URL containing the compressed book data in the hash.
 */
export function buildShareUrl(data: unknown): string {
  const encoded = encodeShareData(data);
  const base = window.location.origin + "/app";
  return `${base}#share=${encoded}`;
}

/**
 * Extract shared data from the current URL hash, if present.
 * Returns null if no valid share data is found.
 */
export function getShareDataFromHash<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const match = hash.match(/^#share=(.+)$/);
  if (!match) return null;
  try {
    return decodeShareData<T>(match[1]);
  } catch {
    return null;
  }
}
