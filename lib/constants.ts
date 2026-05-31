import type {
  FontOption,
  Theme,
  CoverGradientPreset,
  CoverTextureOverlay,
  ChapterStatusDef,
} from "./types";

// ─────────────────────────────────────────────
// RANDOM AUTHOR NAMES
// ─────────────────────────────────────────────

const AUTHOR_FIRST = [
  "Elara","Dorian","Sylvan","Mira","Jasper","Cleo","Orion","Seraph",
  "Isolde","Cael","Thea","Finn","Lyra","Soren","Vesper","Nico","Rowan",
  "Indra","Zephyr","Lena",
];
const AUTHOR_LAST = [
  "Voss","Ashford","Crane","Dawnmore","Holt","Vane","Stirling","Marlowe",
  "Finch","Wren","Calder","Lorne","Thorne","Blake","Rivers","Shore","Vale",
  "Morrow","Cross","Reid",
];

export function randomAuthorName(): string {
  const f = AUTHOR_FIRST[Math.floor(Math.random() * AUTHOR_FIRST.length)];
  const l = AUTHOR_LAST[Math.floor(Math.random() * AUTHOR_LAST.length)];
  return `${f} ${l}`;
}

// ─────────────────────────────────────────────
// FONTS CATALOGUE — 16 distinctive options
// ─────────────────────────────────────────────

export const FONTS: Record<string, FontOption> = {
  // Serif — body text
  cormorant:   { id:"cormorant",   label:"Cormorant Garamond", stack:"'Cormorant Garamond',Georgia,serif",     category:"Serif",   feel:"Classical elegance"    },
  playfair:    { id:"playfair",    label:"Playfair Display",   stack:"'Playfair Display',Georgia,serif",       category:"Serif",   feel:"Editorial drama"       },
  baskerville: { id:"baskerville", label:"Libre Baskerville",  stack:"'Libre Baskerville',Georgia,serif",      category:"Serif",   feel:"Timeless authority"    },
  lora:        { id:"lora",        label:"Lora",               stack:"'Lora',Georgia,serif",                   category:"Serif",   feel:"Warm & readable"       },
  crimson:     { id:"crimson",     label:"Crimson Pro",        stack:"'Crimson Pro',Georgia,serif",            category:"Serif",   feel:"Literary warmth"       },
  eb_garamond: { id:"eb_garamond", label:"EB Garamond",        stack:"'EB Garamond',Georgia,serif",            category:"Serif",   feel:"Renaissance scholar"   },
  merriweather:{ id:"merriweather",label:"Merriweather",       stack:"'Merriweather',Georgia,serif",           category:"Serif",   feel:"Screen comfort"        },
  spectral:    { id:"spectral",    label:"Spectral",           stack:"'Spectral',Georgia,serif",               category:"Serif",   feel:"Digital ink"           },
  source_sans: { id:"source_sans", label:"Source Serif 4",     stack:"'Source Serif 4',Georgia,serif",         category:"Serif",   feel:"Journalistic"          },
  literata:    { id:"literata",    label:"Literata",           stack:"'Literata',Georgia,serif",               category:"Serif",   feel:"E‑book optimized"      },
  alegreya:    { id:"alegreya",    label:"Alegreya",          stack:"'Alegreya',Georgia,serif",               category:"Serif",   feel:"Friendly serif"        },
  noto_serif:  { id:"noto_serif",  label:"Noto Serif",        stack:"'Noto Serif',Georgia,serif",             category:"Serif",   feel:"Universal readability" },
  pt_serif:    { id:"pt_serif",    label:"PT Serif",          stack:"'PT Serif',Georgia,serif",               category:"Serif",   feel:"Newspaper style"       },
  libre_caslon:{ id:"libre_caslon",label:"Libre Caslon Text", stack:"'Libre Caslon Text',Georgia,serif",      category:"Serif",   feel:"Classic book"          },
  charis:      { id:"charis",      label:"Charis SIL",         stack:"'Charis SIL',Georgia,serif",              category:"Serif",   feel:"Academic"              },
  // System serifs
  georgia:     { id:"georgia",     label:"Georgia",           stack:"Georgia,'Times New Roman',serif",         category:"Serif",   feel:"System classic"       },
  times:       { id:"times",       label:"Times New Roman",    stack:"'Times New Roman',Times,serif",          category:"Serif",   feel:"Traditional"          },
  palatino:    { id:"palatino",    label:"Palatino",          stack:"Palatino,'Palatino Linotype',serif",    category:"Serif",   feel:"Elegant system"       },
  // Mono
  courier:     { id:"courier",     label:"Courier Prime",      stack:"'Courier Prime','Courier New',monospace",category:"Mono",    feel:"Typewriter soul"       },
  jetbrains:   { id:"jetbrains",   label:"JetBrains Mono",     stack:"'JetBrains Mono',monospace",             category:"Mono",   feel:"Code & notes"         },
  // Display
  special:     { id:"special",     label:"Special Elite",      stack:"'Special Elite',cursive",                category:"Display", feel:"Vintage typeface"      },
  dm_serif:    { id:"dm_serif",    label:"DM Serif Display",   stack:"'DM Serif Display',Georgia,serif",       category:"Display", feel:"Modern editorial"      },
  abril:       { id:"abril",       label:"Abril Fatface",      stack:"'Abril Fatface',Georgia,serif",          category:"Display", feel:"Bold statement"        },
  // Sans
  dm_sans:     { id:"dm_sans",     label:"DM Sans",            stack:"'DM Sans',sans-serif",                   category:"Sans",    feel:"Clean & modern"        },
  jost:        { id:"jost",        label:"Jost",               stack:"'Jost',sans-serif",                      category:"Sans",    feel:"Geometric clarity"     },
  nunito:      { id:"nunito",      label:"Nunito",             stack:"'Nunito',sans-serif",                    category:"Sans",    feel:"Friendly round"        },
  inter:       { id:"inter",       label:"Inter",              stack:"'Inter',sans-serif",                     category:"Sans",    feel:"Modern UI"             },
  open_sans:   { id:"open_sans",   label:"Open Sans",         stack:"'Open Sans',sans-serif",                 category:"Sans",    feel:"Humanist"             },
  // Cursive / handwriting
  dancing:     { id:"dancing",     label:"Dancing Script",    stack:"'Dancing Script',cursive",               category:"Cursive", feel:"Playful script"        },
  great_vibes: { id:"great_vibes", label:"Great Vibes",       stack:"'Great Vibes',cursive",                  category:"Cursive", feel:"Elegant flourish"      },
  pacifico:    { id:"pacifico",    label:"Pacifico",          stack:"'Pacifico',cursive",                     category:"Cursive", feel:"Casual brush"          },
  sacramento:  { id:"sacramento",  label:"Sacramento",        stack:"'Sacramento',cursive",                   category:"Cursive", feel:"Handwritten charm"     },
  caveat:      { id:"caveat",      label:"Caveat",             stack:"'Caveat',cursive",                       category:"Cursive", feel:"Natural handwriting"   },
};

export const GFONTS_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=DM+Serif+Display:ital@0;1&family=Spectral:ital,wght@0,300;0,400;0,600;1,400&family=Abril+Fatface&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Jost:ital,wght@0,300;0,400;0,500;1,400&family=Nunito:ital,wght@0,300;0,400;0,600;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&family=Literata:ital,wght@0,400;0,700;1,400&family=Alegreya:ital,wght@0,400;0,700;1,400&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Charis+SIL:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&family=Inter:ital,wght@0,400;0,600;1,400&family=Open+Sans:ital,wght@0,400;0,600;1,400&family=Dancing+Script:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Great+Vibes&family=Pacifico&family=Sacramento&family=Caveat:ital,wght@0,400;0,500;0,600;0,700&display=swap";

// ─────────────────────────────────────────────
// SVG TEXTURES
// ─────────────────────────────────────────────

export const TEXTURES: Record<string, { id: string; label: string; svg: string }> = {
  none:       { id:"none",       label:"None",       svg:"" },
  paper:      { id:"paper",      label:"Paper",      svg:`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(#n)' opacity='0.08'/></svg>` },
  linen:      { id:"linen",      label:"Linen",      svg:`<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect width='4' height='4' fill='none'/><path d='M0 0h4M0 2h4M1 0v4M3 0v4' stroke='currentColor' stroke-width='0.3' opacity='0.12'/></svg>` },
  grain:      { id:"grain",      label:"Grain",      svg:`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='g'><feTurbulence type='turbulence' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100' height='100' filter='url(#g)' opacity='0.06'/></svg>` },
  dots:       { id:"dots",       label:"Dots",       svg:`<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='1' cy='1' r='0.8' fill='currentColor' opacity='0.15'/></svg>` },
  ruled:      { id:"ruled",      label:"Ruled",      svg:`<svg xmlns='http://www.w3.org/2000/svg' width='1' height='28'><line x1='0' y1='27' x2='1' y2='27' stroke='currentColor' stroke-width='0.6' opacity='0.1'/></svg>` },
  grid:       { id:"grid",       label:"Grid",       svg:`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M24 0H0M0 24V0' stroke='currentColor' stroke-width='0.4' opacity='0.1'/></svg>` },
  crosshatch: { id:"crosshatch", label:"Crosshatch", svg:`<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><path d='M0 8L8 0M-1 1L1-1M7 9L9 7' stroke='currentColor' stroke-width='0.5' opacity='0.1'/></svg>` },
};

export function textureBg(textureId: string, color = "#000"): string {
  const t = TEXTURES[textureId];
  if (!t || !t.svg) return "none";
  const colored = t.svg.replace(/currentColor/g, color);
  return `url("data:image/svg+xml,${encodeURIComponent(colored)}")`;
}

// ─────────────────────────────────────────────
// THEMES — 40 complete systems (20 Light + 20 Dark)
// ─────────────────────────────────────────────

export const THEMES: Record<string, Theme> = {
  // ════════════════════════════════════════════
  // LIGHT THEMES (20)
  // ════════════════════════════════════════════
  // ──────────────────────────────────────────
  // 0. MAHI LIGHT — Ahom manuscript inspired (Mahi = black ink, inkwell)
  mahiLight: {
    id:"mahiLight", name:"Mahi Light", group:"Light",
    bg:"#f8f0e0", surface:"#fffcf4", surfaceAlt:"#ebe0cc",
    border:"#c4a574", text:"#1a1208", textMuted:"#5c4020", textFaint:"#8e7450",
    accent:"#8b2942", accentLight:"#a83250",
    editorBg:"#fffef8", shadow:"rgba(26,18,8,0.18)",
    font:"cormorant", uiFont:"'EB Garamond',Georgia,serif",
    bgStyle:"repeating-linear-gradient(transparent 0px, transparent 27px, rgba(139,41,66,0.07) 27px, rgba(139,41,66,0.07) 28.5px), repeating-linear-gradient(90deg, rgba(196,165,116,0.04) 0 1px, transparent 1px 24px), radial-gradient(ellipse at 30% 20%, #f4e8d0 0%, #f8f0e0 45%, #ebe0cc 100%)",
    decorativeColor:"rgba(139,41,66,0.08)", badge:"#8b2942", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 1. PARCHMENT — aged warm cream, ruled paper
  parchment: {
    id:"parchment", name:"Parchment", group:"Light",
    bg:"#f4e8cc", surface:"#faf4e2", surfaceAlt:"#e8d8b4",
    border:"#c8b480", text:"#181004", textMuted:"#624e2e", textFaint:"#9c8860",
    accent:"#7c3a0e", accentLight:"#b05c28",
    editorBg:"#fdf8ee", shadow:"rgba(24,16,4,0.2)",
    font:"cormorant", uiFont:"'Lora',Georgia,serif",
    bgStyle:"repeating-linear-gradient(transparent, transparent 27px, rgba(150,108,48,0.18) 27px, rgba(150,108,48,0.18) 28.5px), radial-gradient(ellipse at 30% 20%, #ecddb8 0%, #f4e8cc 65%, #e8d8b4 100%)",
    decorativeColor:"rgba(124,58,14,0.08)", badge:"#7c3a0e", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 2. SEPIA STUDIO — rich sepia with crosshatch paper texture
  sepia: {
    id:"sepia", name:"Sepia Studio", group:"Light",
    bg:"#f5edd8", surface:"#fdf6e4", surfaceAlt:"#e8dcc0",
    border:"#c8b08a", text:"#140a00", textMuted:"#5a4422", textFaint:"#948060",
    accent:"#6a3c18", accentLight:"#9a5e30",
    editorBg:"#fdfaf0", shadow:"rgba(20,10,0,0.18)",
    font:"eb_garamond", uiFont:"'Cormorant Garamond',Georgia,serif",
    bgStyle:"repeating-linear-gradient(rgba(90,68,30,0.05) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(90,68,30,0.05) 0 1px, transparent 1px 22px), radial-gradient(ellipse at 50% 50%, #ecdfc4 0%, #f5edd8 65%, #e8dcc0 100%)",
    decorativeColor:"rgba(106,60,24,0.07)", badge:"#6a3c18", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 3. VERDANT — fresh forest green
  verdant: {
    id:"verdant", name:"Verdant", group:"Light",
    bg:"#e6f2e4", surface:"#f0f9ee", surfaceAlt:"#cee4cc",
    border:"#9cc09a", text:"#081808", textMuted:"#2e5630", textFaint:"#5e8860",
    accent:"#1a5430", accentLight:"#2e8050",
    editorBg:"#f4fbf2", shadow:"rgba(8,24,8,0.14)",
    font:"lora", uiFont:"'Jost',sans-serif",
    bgStyle:"radial-gradient(ellipse at 70% 85%, #c0dcc0 0%, #e6f2e4 55%, #d8ecda 100%)",
    decorativeColor:"rgba(26,84,48,0.07)", badge:"#1a5430", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 4. ARCTIC — crisp polar ice
  arctic: {
    id:"arctic", name:"Arctic", group:"Light",
    bg:"#eaf4fa", surface:"#f4fbfe", surfaceAlt:"#d4eaf4",
    border:"#a4c8de", text:"#041424", textMuted:"#2c5a70", textFaint:"#6494aa",
    accent:"#005088", accentLight:"#1278aa",
    editorBg:"#f6fcff", shadow:"rgba(4,20,36,0.12)",
    font:"spectral", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 50% 0%, #bcdff4 0%, #eaf4fa 55%, #d8eef6 100%)",
    decorativeColor:"rgba(0,80,136,0.06)", badge:"#005088", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 5. ROSE & CREAM — romantic blush
  rose: {
    id:"rose", name:"Rose & Cream", group:"Light",
    bg:"#fce8e6", surface:"#fef4f2", surfaceAlt:"#f4d4ce",
    border:"#dca8a0", text:"#200810", textMuted:"#7a3038", textFaint:"#aa6a6a",
    accent:"#9e2018", accentLight:"#c83c30",
    editorBg:"#fef6f4", shadow:"rgba(32,8,16,0.14)",
    font:"crimson", uiFont:"'Nunito',sans-serif",
    bgStyle:"radial-gradient(ellipse at 30% 70%, #f0c8c0 0%, #fce8e6 55%, #f8dcd8 100%)",
    decorativeColor:"rgba(158,32,24,0.07)", badge:"#9e2018", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 6. TYPEWRITER — vintage ruled notebook paper
  typewriter: {
    id:"typewriter", name:"Typewriter", group:"Light",
    bg:"#ece6d8", surface:"#f4eedf", surfaceAlt:"#dcd5c2",
    border:"#b0a48a", text:"#100c06", textMuted:"#524630", textFaint:"#907a5a",
    accent:"#1c1808", accentLight:"#443a20",
    editorBg:"#f4eedf", shadow:"rgba(16,12,6,0.2)",
    font:"courier", uiFont:"'Special Elite',cursive",
    bgStyle:"repeating-linear-gradient(transparent 0px, transparent 28px, rgba(120,90,40,0.22) 28px, rgba(120,90,40,0.22) 29.5px), linear-gradient(180deg, #ece6d8 0%, #e4dece 100%)",
    decorativeColor:"rgba(28,24,8,0.07)", badge:"#1c1808", badgeText:"#ece6d8",
  },
  // ──────────────────────────────────────────
  // 7. IVORY — clean minimal with subtle dot grid
  ivory: {
    id:"ivory", name:"Ivory", group:"Light",
    bg:"#fafaf4", surface:"#ffffff", surfaceAlt:"#f0f0e8",
    border:"#d4d4c8", text:"#0c0c0c", textMuted:"#484844", textFaint:"#88887e",
    accent:"#185490", accentLight:"#2870b8",
    editorBg:"#ffffff", shadow:"rgba(12,12,12,0.1)",
    font:"merriweather", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(circle at 10px 10px, rgba(80,80,160,0.08) 1.5px, transparent 1.5px), linear-gradient(180deg, #fafaf4 0%, #f8f8f2 100%)",
    decorativeColor:"rgba(24,84,144,0.05)", badge:"#185490", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 8. SAGE GARDEN — earthy muted green
  sage: {
    id:"sage", name:"Sage Garden", group:"Light",
    bg:"#edf4e8", surface:"#f6fbf2", surfaceAlt:"#dcecd4",
    border:"#aac8a4", text:"#0a1c0c", textMuted:"#385838", textFaint:"#6e946e",
    accent:"#386840", accentLight:"#548a56",
    editorBg:"#f8fcf4", shadow:"rgba(10,28,12,0.1)",
    font:"lora", uiFont:"'Nunito',sans-serif",
    bgStyle:"radial-gradient(ellipse at 60% 80%, #cce4c4 0%, #edf4e8 55%, #e2f0da 100%)",
    decorativeColor:"rgba(56,104,64,0.06)", badge:"#386840", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 9. GOLDEN HOUR — warm amber sunset [NEW]
  golden: {
    id:"golden", name:"Golden Hour", group:"Light",
    bg:"#fef8e4", surface:"#fffdf2", surfaceAlt:"#f8ecc4",
    border:"#dcc878", text:"#180e00", textMuted:"#6a5010", textFaint:"#a88a3c",
    accent:"#b87800", accentLight:"#e09a00",
    editorBg:"#fffef6", shadow:"rgba(24,14,0,0.14)",
    font:"playfair", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 50% 100%, #f4e080 0%, #fef4d0 45%, #fffef0 100%)",
    decorativeColor:"rgba(184,120,0,0.07)", badge:"#b87800", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 10. LAVENDER MIST — soft purple [NEW]
  lavender: {
    id:"lavender", name:"Lavender Mist", group:"Light",
    bg:"#f2eefb", surface:"#f8f6fe", surfaceAlt:"#e4dcf8",
    border:"#c4b4e8", text:"#14082a", textMuted:"#5c3c88", textFaint:"#9470c0",
    accent:"#5e2ca4", accentLight:"#7c4cc8",
    editorBg:"#faf8ff", shadow:"rgba(20,8,42,0.12)",
    font:"playfair", uiFont:"'Nunito',sans-serif",
    bgStyle:"radial-gradient(ellipse at 50% 0%, #d4bff4 0%, #f2eefb 48%, #eeeaf8 100%)",
    decorativeColor:"rgba(94,44,164,0.07)", badge:"#5e2ca4", badgeText:"#fff",
  },

  // ──────────────────────────────────────────
  // 11. PAPYRUS — ancient Egyptian sand & ochre
  papyrus: {
    id:"papyrus", name:"Papyrus", group:"Light",
    bg:"#f2e6c0", surface:"#faf4d4", surfaceAlt:"#e6d8a4",
    border:"#c8a858", text:"#1a1000", textMuted:"#5c4010", textFaint:"#9e7e30",
    accent:"#8c5c08", accentLight:"#b87c20",
    editorBg:"#fdf6e2", shadow:"rgba(26,16,0,0.2)",
    font:"cormorant", uiFont:"'EB Garamond',Georgia,serif",
    bgStyle:"repeating-linear-gradient(45deg,rgba(160,120,40,0.04) 0,rgba(160,120,40,0.04) 1px,transparent 1px,transparent 12px),radial-gradient(ellipse at 60% 40%, #ecd89c 0%, #f2e6c0 55%, #e8d8a8 100%)",
    decorativeColor:"rgba(140,92,8,0.09)", badge:"#8c5c08", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 12. CLOUD NINE — crisp polar white with sky accents
  cloud: {
    id:"cloud", name:"Cloud Nine", group:"Light",
    bg:"#f0f8ff", surface:"#ffffff", surfaceAlt:"#deeefb",
    border:"#a8d0ee", text:"#040c18", textMuted:"#1e5888", textFaint:"#6090bc",
    accent:"#0068d0", accentLight:"#1888f0",
    editorBg:"#ffffff", shadow:"rgba(4,12,24,0.1)",
    font:"spectral", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 50% -10%, #bcddf8 0%, #e8f5ff 40%, #f0f8ff 100%)",
    decorativeColor:"rgba(0,104,208,0.05)", badge:"#0068d0", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 13. BLOSSOM — cherry blossom soft pink
  blossom: {
    id:"blossom", name:"Blossom", group:"Light",
    bg:"#fff0f8", surface:"#fff8fc", surfaceAlt:"#fcd8ef",
    border:"#e8a8cc", text:"#1c080e", textMuted:"#8c2848", textFaint:"#c070a0",
    accent:"#c82860", accentLight:"#e8507e",
    editorBg:"#fffafd", shadow:"rgba(28,8,14,0.12)",
    font:"crimson", uiFont:"'Nunito',sans-serif",
    bgStyle:"radial-gradient(ellipse at 30% 80%, #f8c0e0 0%, #fff0f8 50%, #fce8f4 100%)",
    decorativeColor:"rgba(200,40,96,0.07)", badge:"#c82860", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 14. MINT FRESH — cool spearmint
  mintfresh: {
    id:"mintfresh", name:"Mint Fresh", group:"Light",
    bg:"#edfaf4", surface:"#f6fef9", surfaceAlt:"#d4f2e4",
    border:"#88d8b4", text:"#041410", textMuted:"#1c6040", textFaint:"#5ea880",
    accent:"#0e7850", accentLight:"#28a870",
    editorBg:"#f4fef8", shadow:"rgba(4,20,16,0.1)",
    font:"lora", uiFont:"'Jost',sans-serif",
    bgStyle:"radial-gradient(ellipse at 80% 20%, #b8ecd8 0%, #edfaf4 52%, #dff6ec 100%)",
    decorativeColor:"rgba(14,120,80,0.06)", badge:"#0e7850", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 15. TERRACOTTA — earthy warm clay
  terracotta: {
    id:"terracotta", name:"Terracotta", group:"Light",
    bg:"#f8ebe0", surface:"#fdf4ec", surfaceAlt:"#ecd8c4",
    border:"#d0a880", text:"#1c0c00", textMuted:"#7a3c18", textFaint:"#b07848",
    accent:"#b04818", accentLight:"#d46030",
    editorBg:"#fef6f0", shadow:"rgba(28,12,0,0.14)",
    font:"playfair", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 40% 90%, #e4b890 0%, #f8ebe0 50%, #f0dece 100%)",
    decorativeColor:"rgba(176,72,24,0.07)", badge:"#b04818", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 16. SLATE SKY — cool grey-blue storm
  slatesky: {
    id:"slatesky", name:"Slate Sky", group:"Light",
    bg:"#eef1f8", surface:"#f6f8fc", surfaceAlt:"#dde4f0",
    border:"#b4c0d8", text:"#080e20", textMuted:"#3848a0", textFaint:"#7888c0",
    accent:"#2448c8", accentLight:"#4068e0",
    editorBg:"#f8fafc", shadow:"rgba(8,14,32,0.1)",
    font:"spectral", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 70% 0%, #c4d0f0 0%, #eef1f8 50%, #e4eaf8 100%)",
    decorativeColor:"rgba(36,72,200,0.06)", badge:"#2448c8", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 17. CHAMPAGNE — luxe effervescent gold
  champagne: {
    id:"champagne", name:"Champagne", group:"Light",
    bg:"#fdf6e0", surface:"#fffcf0", surfaceAlt:"#f4e8b8",
    border:"#d8c068", text:"#160e00", textMuted:"#6a5808", textFaint:"#a89030",
    accent:"#ac7e00", accentLight:"#d4a000",
    editorBg:"#fffef8", shadow:"rgba(22,14,0,0.12)",
    font:"eb_garamond", uiFont:"'Cormorant Garamond',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 50% 0%, #f0d870 0 8%, transparent 60%),radial-gradient(ellipse at 80% 100%, #f4e8a8 0%, #fdf6e0 55%, #f8f0d0 100%)",
    decorativeColor:"rgba(172,126,0,0.07)", badge:"#ac7e00", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 18. FJORD — Nordic blue-white ice
  fjord: {
    id:"fjord", name:"Fjord", group:"Light",
    bg:"#e8f2f8", surface:"#f4f9fc", surfaceAlt:"#cce4f0",
    border:"#8cb8d8", text:"#020e18", textMuted:"#245078", textFaint:"#5888a8",
    accent:"#0a5c9a", accentLight:"#207cc4",
    editorBg:"#f6fbfe", shadow:"rgba(2,14,24,0.1)",
    font:"merriweather", uiFont:"'DM Sans',sans-serif",
    bgStyle:"repeating-linear-gradient(transparent, transparent 30px, rgba(8,100,170,0.04) 30px, rgba(8,100,170,0.04) 31px),radial-gradient(ellipse at 50% -5%, #a8d8f4 0%, #e8f2f8 50%, #dceef8 100%)",
    decorativeColor:"rgba(10,92,154,0.06)", badge:"#0a5c9a", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 19. SUNFLOWER — warm bright amber-yellow
  sunflower: {
    id:"sunflower", name:"Sunflower", group:"Light",
    bg:"#fffbe8", surface:"#ffffe8", surfaceAlt:"#f8f0b0",
    border:"#dcc840", text:"#140c00", textMuted:"#605000", textFaint:"#a08830",
    accent:"#c07800", accentLight:"#e09c00",
    editorBg:"#fffef2", shadow:"rgba(20,12,0,0.12)",
    font:"playfair", uiFont:"'Nunito',sans-serif",
    bgStyle:"radial-gradient(ellipse at 50% 60%, #f4e060 0 15%, transparent 62%),radial-gradient(ellipse at 50% 30%, #fef4b0 0%, #fffbe8 55%, #fffde0 100%)",
    decorativeColor:"rgba(192,120,0,0.07)", badge:"#c07800", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 20. ORCHID — soft dusty mauve
  orchid: {
    id:"orchid", name:"Orchid", group:"Light",
    bg:"#f8eef8", surface:"#fef6fe", surfaceAlt:"#f0d8f4",
    border:"#d4a4d8", text:"#160818", textMuted:"#783880", textFaint:"#b878c0",
    accent:"#883098", accentLight:"#aa50bc",
    editorBg:"#fef8ff", shadow:"rgba(22,8,24,0.12)",
    font:"playfair", uiFont:"'Nunito',sans-serif",
    bgStyle:"radial-gradient(ellipse at 70% 20%, #eabcf0 0%, #f8eef8 50%, #f4e4f8 100%)",
    decorativeColor:"rgba(136,48,152,0.07)", badge:"#883098", badgeText:"#fff",
  },

  // ════════════════════════════════════════════
  // DARK THEMES — first ten (11-20)
  // ════════════════════════════════════════════

  // ──────────────────────────────────────────
  // 10.5. MAHI DARK — Same Ahom manuscript vibe, candlelit folio (matches Mahi Light)
  mahiDark: {
    id:"mahiDark", name:"Mahi Dark", group:"Dark",
    bg:"#161210", surface:"#1e1814", surfaceAlt:"#262018",
    border:"#3c3020", text:"#f5eede", textMuted:"#b8a078", textFaint:"#8e7450",
    accent:"#8b2942", accentLight:"#a83250",
    editorBg:"#181410", shadow:"rgba(0,0,0,0.7)",
    font:"cormorant", uiFont:"'EB Garamond',Georgia,serif",
    bgStyle:"repeating-linear-gradient(transparent 0px, transparent 27px, rgba(139,41,66,0.06) 27px, rgba(139,41,66,0.06) 28.5px), repeating-linear-gradient(90deg, rgba(196,165,116,0.03) 0 1px, transparent 1px 24px), radial-gradient(ellipse at 20% 15%, #1e1814 0%, #161210 50%, #120e0c 100%)",
    decorativeColor:"rgba(139,41,66,0.08)", badge:"#8b2942", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 11. MIDNIGHT — deep navy
  midnight: {
    id:"midnight", name:"Midnight", group:"Dark",
    bg:"#070c18", surface:"#0e1828", surfaceAlt:"#16223a",
    border:"#1e2e4e", text:"#e8f0ff", textMuted:"#8090b8", textFaint:"#445070",
    accent:"#5090d0", accentLight:"#78b0e8",
    editorBg:"#090e1e", shadow:"rgba(0,0,0,0.65)",
    font:"playfair", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 20% 10%, #0e1c3c 0%, #070c18 58%, #040a14 100%)",
    decorativeColor:"rgba(80,144,208,0.07)", badge:"#5090d0", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 12. EMBER DUSK — smouldering orange
  dusk: {
    id:"dusk", name:"Ember Dusk", group:"Dark",
    bg:"#0e0604", surface:"#1c0e08", surfaceAlt:"#2a1610",
    border:"#3c2010", text:"#f8e2cc", textMuted:"#c08860", textFaint:"#7a5038",
    accent:"#e06828", accentLight:"#f08c50",
    editorBg:"#120806", shadow:"rgba(0,0,0,0.7)",
    font:"playfair", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 80% 15%, #2c1608 0%, #0e0604 58%, #0a0402 100%)",
    decorativeColor:"rgba(224,104,40,0.09)", badge:"#e06828", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 13. NOIR — classic black & gold
  noir: {
    id:"noir", name:"Noir", group:"Dark",
    bg:"#0c0c0c", surface:"#181818", surfaceAlt:"#222222",
    border:"#2e2e2e", text:"#f2f2f2", textMuted:"#a8a8a8", textFaint:"#606060",
    accent:"#e8c45a", accentLight:"#f4da80",
    editorBg:"#101010", shadow:"rgba(0,0,0,0.8)",
    font:"eb_garamond", uiFont:"'DM Sans',sans-serif",
    bgStyle:"linear-gradient(155deg, #141414 0%, #0c0c0c 50%, #0a0a0a 100%)",
    decorativeColor:"rgba(232,196,90,0.05)", badge:"#e8c45a", badgeText:"#0c0c0c",
  },
  // ──────────────────────────────────────────
  // 14. AURORA — northern lights
  aurora: {
    id:"aurora", name:"Aurora", group:"Dark",
    bg:"#050e14", surface:"#0a1a24", surfaceAlt:"#102232",
    border:"#182e40", text:"#c8f0e4", textMuted:"#429070", textFaint:"#245840",
    accent:"#20b870", accentLight:"#40d090",
    editorBg:"#070e16", shadow:"rgba(0,0,0,0.68)",
    font:"merriweather", uiFont:"'Jost',sans-serif",
    bgStyle:"radial-gradient(ellipse at 60% 35%, #082434 0%, #050e14 62%, #030c10 100%)",
    decorativeColor:"rgba(32,184,112,0.08)", badge:"#20b870", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 15. OCEAN DEPTHS — deep sea
  ocean: {
    id:"ocean", name:"Ocean Depths", group:"Dark",
    bg:"#030c18", surface:"#081828", surfaceAlt:"#0e2234",
    border:"#143048", text:"#c0e8f8", textMuted:"#3a84aa", textFaint:"#1e5068",
    accent:"#08a0c8", accentLight:"#28bce0",
    editorBg:"#040e1c", shadow:"rgba(0,0,0,0.72)",
    font:"spectral", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 30% 65%, #061e40 0%, #030c18 58%, #020810 100%)",
    decorativeColor:"rgba(8,160,200,0.08)", badge:"#08a0c8", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 16. AMETHYST — rich purple
  amethyst: {
    id:"amethyst", name:"Amethyst", group:"Dark",
    bg:"#0a0614", surface:"#14102a", surfaceAlt:"#1c1838",
    border:"#2a2248", text:"#eae0fc", textMuted:"#8468c0", textFaint:"#4a3878",
    accent:"#9448e0", accentLight:"#b070f8",
    editorBg:"#0c081c", shadow:"rgba(0,0,0,0.68)",
    font:"playfair", uiFont:"'Nunito',sans-serif",
    bgStyle:"radial-gradient(ellipse at 40% 28%, #1a0e44 0%, #0a0614 58%, #070410 100%)",
    decorativeColor:"rgba(148,72,224,0.09)", badge:"#9448e0", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 17. OBSIDIAN — near-black volcanic
  obsidian: {
    id:"obsidian", name:"Obsidian", group:"Dark",
    bg:"#080808", surface:"#101010", surfaceAlt:"#1a1a1a",
    border:"#262626", text:"#f0f0f0", textMuted:"#b0b0b0", textFaint:"#686868",
    accent:"#f06030", accentLight:"#f88858",
    editorBg:"#0c0c0c", shadow:"rgba(0,0,0,0.82)",
    font:"spectral", uiFont:"'Jost',sans-serif",
    bgStyle:"linear-gradient(180deg, #0e0e0e 0%, #080808 60%, #060606 100%)",
    decorativeColor:"rgba(240,96,48,0.06)", badge:"#f06030", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 18. CARBON — charcoal steel [NEW]
  carbon: {
    id:"carbon", name:"Carbon", group:"Dark",
    bg:"#0e1218", surface:"#161e28", surfaceAlt:"#1e2a38",
    border:"#283848", text:"#e4eaf4", textMuted:"#7090b0", textFaint:"#3a5068",
    accent:"#4080cc", accentLight:"#60a0e8",
    editorBg:"#101418", shadow:"rgba(0,0,0,0.65)",
    font:"spectral", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 30% 70%, #182434 0%, #0e1218 60%, #0a0e14 100%)",
    decorativeColor:"rgba(64,128,204,0.07)", badge:"#4080cc", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 19. FOREST NIGHT — deep ancient forest [NEW]
  forest: {
    id:"forest", name:"Forest Night", group:"Dark",
    bg:"#060e06", surface:"#0c180c", surfaceAlt:"#142014",
    border:"#1c2e1c", text:"#d0eccc", textMuted:"#489048", textFaint:"#285828",
    accent:"#38a838", accentLight:"#58c858",
    editorBg:"#080e08", shadow:"rgba(0,0,0,0.7)",
    font:"lora", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 40% 30%, #0c2010 0%, #060e06 60%, #040a04 100%)",
    decorativeColor:"rgba(56,168,56,0.08)", badge:"#38a838", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 20. CRIMSON VAULT — dark gothic red
  crimson: {
    id:"crimson", name:"Crimson Vault", group:"Dark",
    bg:"#0e0408", surface:"#1c0810", surfaceAlt:"#280c18",
    border:"#3c1020", text:"#f4d8e0", textMuted:"#c05070", textFaint:"#7a2840",
    accent:"#c82040", accentLight:"#e84060",
    editorBg:"#10060a", shadow:"rgba(0,0,0,0.72)",
    font:"crimson", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 50% 20%, #2a0a14 0%, #0e0408 58%, #0a0206 100%)",
    decorativeColor:"rgba(200,32,64,0.08)", badge:"#c82040", badgeText:"#fff",
  },

  // ════════════════════════════════════════════
  // DARK THEMES — second ten (21-30)
  // ════════════════════════════════════════════

  // ──────────────────────────────────────────
  // 21. TERMINAL — phosphor-green on black
  terminal: {
    id:"terminal", name:"Terminal", group:"Dark",
    bg:"#000000", surface:"#080808", surfaceAlt:"#0f0f0f",
    border:"#182e18", text:"#b8f0c8", textMuted:"#288848", textFaint:"#104828",
    accent:"#00cc60", accentLight:"#00ff80",
    editorBg:"#030303", shadow:"rgba(0,0,0,0.9)",
    font:"spectral", uiFont:"'Jost',sans-serif",
    bgStyle:"repeating-linear-gradient(transparent 0,transparent 2px,rgba(0,200,80,0.025) 2px,rgba(0,200,80,0.025) 3px),linear-gradient(180deg,#000 0%,#020402 100%)",
    decorativeColor:"rgba(0,204,96,0.07)", badge:"#00cc60", badgeText:"#000",
  },
  // ──────────────────────────────────────────
  // 22. COSMOS — deep-space starfield purple
  cosmos: {
    id:"cosmos", name:"Cosmos", group:"Dark",
    bg:"#040414", surface:"#080828", surfaceAlt:"#101040",
    border:"#1c1c48", text:"#e8e0ff", textMuted:"#6658c8", textFaint:"#303080",
    accent:"#8060e8", accentLight:"#a080ff",
    editorBg:"#060618", shadow:"rgba(0,0,0,0.75)",
    font:"playfair", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(circle at 20% 30%, rgba(80,60,180,0.25) 0 8%, transparent 40%),radial-gradient(circle at 75% 70%, rgba(40,20,120,0.3) 0 12%, transparent 45%),radial-gradient(ellipse at 50% 50%, #080820 0%, #040414 55%, #020210 100%)",
    decorativeColor:"rgba(128,96,232,0.09)", badge:"#8060e8", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 23. LAVA — volcanic molten glow
  lava: {
    id:"lava", name:"Lava", group:"Dark",
    bg:"#0e0600", surface:"#1c0c00", surfaceAlt:"#2e1400",
    border:"#4a1c00", text:"#ffe8c0", textMuted:"#e06820", textFaint:"#8a3c10",
    accent:"#f05000", accentLight:"#ff7020",
    editorBg:"#100800", shadow:"rgba(0,0,0,0.78)",
    font:"playfair", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 50% 100%, #3a1200 0 18%, #1c0800 45%, #0e0600 70%, #0a0400 100%)",
    decorativeColor:"rgba(240,80,0,0.1)", badge:"#f05000", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 24. ABYSS — the darkest navy, near-void depth
  abyss: {
    id:"abyss", name:"Abyss", group:"Dark",
    bg:"#010208", surface:"#02041a", surfaceAlt:"#080e28",
    border:"#101840", text:"#c8d8f8", textMuted:"#3858c0", textFaint:"#162860",
    accent:"#2060e0", accentLight:"#3880ff",
    editorBg:"#01020c", shadow:"rgba(0,0,0,0.88)",
    font:"spectral", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 30% 15%, #04082c 0%, #010208 58%, #000106 100%)",
    decorativeColor:"rgba(32,96,224,0.06)", badge:"#2060e0", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 25. MALACHITE — dark polished green stone
  malachite: {
    id:"malachite", name:"Malachite", group:"Dark",
    bg:"#020c04", surface:"#041808", surfaceAlt:"#0a2410",
    border:"#0e3418", text:"#b0f0c0", textMuted:"#28a840", textFaint:"#186030",
    accent:"#00c840", accentLight:"#20f060",
    editorBg:"#040e06", shadow:"rgba(0,0,0,0.75)",
    font:"merriweather", uiFont:"'Jost',sans-serif",
    bgStyle:"radial-gradient(ellipse at 60% 40%, #062c10 0%, #020c04 55%, #010a02 100%)",
    decorativeColor:"rgba(0,200,64,0.08)", badge:"#00c840", badgeText:"#000",
  },
  // ──────────────────────────────────────────
  // 26. SYNTHWAVE — cyberpunk neon pink & purple
  synthwave: {
    id:"synthwave", name:"Synthwave", group:"Dark",
    bg:"#07020e", surface:"#10061a", surfaceAlt:"#1a0e28",
    border:"#2e1048", text:"#f8e0ff", textMuted:"#b030d8", textFaint:"#6a1888",
    accent:"#d820d8", accentLight:"#f040f0",
    editorBg:"#09030f", shadow:"rgba(0,0,0,0.78)",
    font:"spectral", uiFont:"'Nunito',sans-serif",
    bgStyle:"repeating-linear-gradient(90deg,transparent,transparent 58px,rgba(200,40,220,0.04) 58px,rgba(200,40,220,0.04) 60px),repeating-linear-gradient(transparent,transparent 58px,rgba(200,40,220,0.04) 58px,rgba(200,40,220,0.04) 60px),radial-gradient(ellipse at 50% 100%, #240034 0 20%, #07020e 60%, #040109 100%)",
    decorativeColor:"rgba(216,32,216,0.09)", badge:"#d820d8", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 27. LUNAR — moonlit silver on dark slate
  lunar: {
    id:"lunar", name:"Lunar", group:"Dark",
    bg:"#090c12", surface:"#12161e", surfaceAlt:"#1c2030",
    border:"#2a3244", text:"#dce8f8", textMuted:"#7090c0", textFaint:"#384a6a",
    accent:"#90b8e8", accentLight:"#b8d8ff",
    editorBg:"#0a0d14", shadow:"rgba(0,0,0,0.68)",
    font:"eb_garamond", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 50% -5%, #2a3860 0 12%, #14182a 40%, #090c12 68%, #060810 100%)",
    decorativeColor:"rgba(144,184,232,0.06)", badge:"#90b8e8", badgeText:"#090c12",
  },
  // ──────────────────────────────────────────
  // 28. RUST — dark industrial oxidised metal
  rust: {
    id:"rust", name:"Rust", group:"Dark",
    bg:"#0c0806", surface:"#181008", surfaceAlt:"#241608",
    border:"#3e2010", text:"#f0e0cc", textMuted:"#c07040", textFaint:"#7a4018",
    accent:"#d85018", accentLight:"#f07030",
    editorBg:"#100c08", shadow:"rgba(0,0,0,0.72)",
    font:"lora", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 75% 80%, #2e1408 0%, #0c0806 55%, #090604 100%)",
    decorativeColor:"rgba(216,80,24,0.08)", badge:"#d85018", badgeText:"#fff",
  },
  // ──────────────────────────────────────────
  // 29. INKWELL — black ink with warm gold
  inkwell: {
    id:"inkwell", name:"Inkwell", group:"Dark",
    bg:"#06060a", surface:"#0e0e18", surfaceAlt:"#161620",
    border:"#22222e", text:"#ece8e0", textMuted:"#a09060", textFaint:"#58502e",
    accent:"#d4a840", accentLight:"#f0c858",
    editorBg:"#08080c", shadow:"rgba(0,0,0,0.82)",
    font:"eb_garamond", uiFont:"'Cormorant Garamond',Georgia,serif",
    bgStyle:"repeating-linear-gradient(-45deg,rgba(212,168,64,0.025) 0,rgba(212,168,64,0.025) 1px,transparent 1px,transparent 18px),linear-gradient(180deg, #0a0a10 0%, #06060a 100%)",
    decorativeColor:"rgba(212,168,64,0.06)", badge:"#d4a840", badgeText:"#06060a",
  },
  // ──────────────────────────────────────────
  // 30. GLACIER — arctic dark blue-white
  glacier: {
    id:"glacier", name:"Glacier", group:"Dark",
    bg:"#04080e", surface:"#08101a", surfaceAlt:"#101c28",
    border:"#182840", text:"#c8e8f8", textMuted:"#4888b8", textFaint:"#1e4860",
    accent:"#30c8f8", accentLight:"#50e0ff",
    editorBg:"#050a10", shadow:"rgba(0,0,0,0.72)",
    font:"spectral", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 20% 10%, #0c1c30 0%, #04080e 55%, #02060c 100%)",
    decorativeColor:"rgba(48,200,248,0.07)", badge:"#30c8f8", badgeText:"#000",
  },
};

// ─────────────────────────────────────────────
// COVER DESIGN CONSTANTS
// ─────────────────────────────────────────────

export const COVER_GRADIENTS: CoverGradientPreset[] = [
  { id:"midnight_blue", label:"Midnight Blue",  a:"#0f2044", b:"#1a4480" },
  { id:"forest_deep",   label:"Deep Forest",    a:"#1a3a20", b:"#2d6a4f" },
  { id:"crimson",       label:"Crimson Dusk",   a:"#4a0a0a", b:"#9b2335" },
  { id:"amber_gold",    label:"Amber Gold",     a:"#3d1c02", b:"#b85c00" },
  { id:"violet",        label:"Violet Dream",   a:"#1e0a3c", b:"#6b2fa0" },
  { id:"teal_deep",     label:"Deep Teal",      a:"#042830", b:"#0a6b7a" },
  { id:"charcoal",      label:"Charcoal",       a:"#111111", b:"#333333" },
  { id:"rose_wine",     label:"Rose Wine",      a:"#3a0a18", b:"#8a2040" },
  { id:"sage",          label:"Sage Morning",   a:"#1a2a1a", b:"#4a7a50" },
  { id:"copper",        label:"Copper Sunrise", a:"#2a1208", b:"#9a4a10" },
  { id:"slate_blue",    label:"Slate Blue",     a:"#0e1a2e", b:"#344e7a" },
  { id:"gold_sand",     label:"Gold & Sand",    a:"#2e2000", b:"#8a6c00" },
];

export const COVER_SOLID_COLORS: string[] = [
  "#1a1a2e","#16213e","#0f3460","#1b4332","#2d3a3a","#3d0c02",
  "#2d1b00","#4a1040","#1a3a1a","#2a1a08","#0a2a2a","#2a0a0a",
  "#2e2e2e","#1a2a1a","#0e1e3e","#3a1a00",
];

export const COVER_TEXTURES_OVERLAY: CoverTextureOverlay[] = [
  { id:"none",        label:"None"    },
  { id:"linen_cover", label:"Linen",   opacity:0.18 },
  { id:"leather",     label:"Leather", opacity:0.22 },
  { id:"canvas",      label:"Canvas",  opacity:0.15 },
  { id:"marble",      label:"Marble",  opacity:0.12 },
  { id:"paper_cover", label:"Paper",   opacity:0.14 },
  { id:"grain",       label:"Grain",   opacity:0.20 },
  { id:"weave",       label:"Weave",   opacity:0.16 },
  { id:"diamond",     label:"Diamond", opacity:0.14 },
];

// ─────────────────────────────────────────────
// GENRES & CHAPTER STATUSES
// ─────────────────────────────────────────────

export const GENRES: string[] = [
  "Novel","Poetry","Journal","Essay","Short Story","Memoir",
  "Fantasy","Sci-Fi","Romance","Mystery","Thriller","Non-Fiction",
  "Screenplay","Other",
];

export const CHAPTER_STATUSES: ChapterStatusDef[] = [
  { id:"draft",    label:"Draft",        color:"#7a8aaa" },
  { id:"progress", label:"In Progress",  color:"#f6ad55" },
  { id:"complete", label:"Complete",     color:"#68d391" },
  { id:"review",   label:"Needs Review", color:"#fc8181" },
  { id:"locked",   label:"Locked",       color:"#a0a0c0" },
];

/** Primary app data key. Legacy `folio_v2` is migrated on first read in `lib/utils.ts`. */
export const STORAGE_KEY = "mahink";

export const PARAGRAPH_WIDTHS: Record<string, string> = {
  narrow: "520px",
  medium: "680px",
  wide:   "840px",
  full:   "100%",
};
