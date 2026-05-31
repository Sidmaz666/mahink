import type { Metadata } from "next";
import { GFONTS_URL } from "@/lib/constants";
import ModelLoadingOverlay from "@/components/ModelLoadingOverlay";
import ThemeApplier from "@/components/ThemeApplier";
import "./globals.css";

export const metadata: Metadata = {
  title: "MahInk — Your Writing Companion",
  description: "A beautiful, distraction-free writing studio for books, stories, and ideas.",
};

/**
 * Layer 1 — Inline script (synchronous, before first paint).
 * Reads themeId from `mahink` → `folio_v2` → `mahink-theme` → system pref,
 * then stamps data-theme on <html>. Eliminates flash on initial page load.
 *
 * Layer 2 — <ThemeApplier> client component.
 * Re-stamps data-theme after React hydration in case the reconciler
 * removed the attribute set by the inline script.
 */
const THEME_INIT_SCRIPT = `(function(){try{
  var raw=localStorage.getItem('mahink')||localStorage.getItem('folio_v2');
  var tid;
  if(raw){var d=JSON.parse(raw);tid=d&&d.settings&&d.settings.themeId;}
  if(!tid){var c=localStorage.getItem('mahink-theme');if(c)tid=c;}
  if(!tid){tid=window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches?'mahiDark':'mahiLight';}
  document.documentElement.setAttribute('data-theme',tid);
  localStorage.setItem('mahink-theme',tid);
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Layer 1: synchronous paint-time stamp */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link rel="stylesheet" href={GFONTS_URL}/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@400;600;700&display=swap"/>
      </head>
      <body suppressHydrationWarning>
        {/* Layer 2: post-hydration stamp (guards against reconciler reset) */}
        <ThemeApplier />
        {children}
        <ModelLoadingOverlay />
      </body>
    </html>
  );
}
