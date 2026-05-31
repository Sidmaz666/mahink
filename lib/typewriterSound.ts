/**
 * Typewriter sound playback for editor keystrokes.
 * Uses WAV files from public/sounds/ with volume control and throttling.
 */

const PRESETS = ["mechanical", "soft", "electric", "classic", "minimal"] as const;
const THROTTLE_MS = 80;

let lastPlayed = 0;

function getUrl(preset: string): string {
  const safe = PRESETS.includes(preset as (typeof PRESETS)[number]) ? preset : "mechanical";
  return `/sounds/typewriter-${safe}.wav`;
}

/**
 * Play a typewriter sound for the given preset at the given volume.
 * Volume is 0-100; 0 skips playback.
 * Throttled to avoid rapid-fire when holding a key.
 */
export function playTypewriterSound(preset: string, volume: number): void {
  if (typeof window === "undefined") return;
  if (volume <= 0) return;

  const now = Date.now();
  if (now - lastPlayed < THROTTLE_MS) return;
  lastPlayed = now;

  try {
    const audio = new Audio(getUrl(preset));
    audio.volume = Math.min(1, Math.max(0, volume / 100));
    audio.play().catch(() => {});
  } catch {
    // Silently skip if Audio fails (e.g. unsupported, file missing)
  }
}
