"use client";
import { useEffect } from "react";

function applyTheme() {
  try {
    const raw =
      localStorage.getItem("mahink") || localStorage.getItem("folio_v2");
    let tid: string | undefined;

    if (raw) {
      const d = JSON.parse(raw);
      tid = d?.settings?.themeId;
    }

    if (!tid) {
      const cached = localStorage.getItem("mahink-theme");
      if (cached) tid = cached;
    }

    if (!tid) {
      tid = window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "mahiDark"
        : "mahiLight";
    }

    document.documentElement.setAttribute("data-theme", tid);
    localStorage.setItem("mahink-theme", tid);
  } catch {
    // ignore
  }
}

/**
 * Layer 2 of theme initialisation (Layer 1 is the inline <script> in layout.tsx).
 *
 * - Runs once after React hydration to re-stamp data-theme in case the
 *   reconciler removed the attribute set by the inline script.
 * - Also listens for `storage` events so that theme changes made in another
 *   tab propagate immediately to the homepage.
 */
export default function ThemeApplier() {
  useEffect(() => {
    applyTheme();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "mahink" || e.key === "folio_v2" || e.key === "mahink-theme") {
        applyTheme();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
