import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  BookOpen, Plus, Search, Settings, ChevronRight, ChevronLeft,
  ChevronDown, ChevronUp, Trash2, Edit3, Download, Moon, Sun,
  Target, BarChart2, Feather, List, Grid, Archive, RotateCcw,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Quote, Minus, Type, Eye, EyeOff, Maximize2, Minimize2,
  Save, Clock, BookMarked, PenTool, Palette, Volume2, VolumeX,
  MoreVertical, Copy, ArrowUp, ArrowDown, CheckCircle, Circle,
  Star, Flame, Calendar, TrendingUp, FileText, X, Menu,
  AlertCircle, Info, Check, Layers, Hash, Mic, MicOff,
  Bookmark, Coffee, CloudRain, Wind, Music, ArrowLeft,
  UploadCloud, DownloadCloud, RefreshCw, Zap, Award,
  GripVertical, Tag, Filter, SortAsc, HelpCircle, User,
  Lock, Unlock, Heart, Share2, Printer, ZoomIn, ZoomOut,
  AlignJustify, Strikethrough, CornerDownLeft, Layout,
  Sidebar, PanelLeft, PanelRight, Columns, Sliders,
  Globe, Scissors, Clipboard, SkipBack, SkipForward,
  Image, Droplets, Layers2, Sparkles, Wand2, Mountain,
  Waves, Leaf, Snowflake, Sun as SunIcon, Flame as FlameIcon,
  Paintbrush, Swatch, Hexagon, Triangle, Square, TextCursorInput
} from "lucide-react";

// ─────────────────────────────────────────────
// RANDOM AUTHOR NAMES
// ─────────────────────────────────────────────
const AUTHOR_FIRST = ["Elara","Dorian","Sylvan","Mira","Jasper","Cleo","Orion","Seraph","Isolde","Cael","Thea","Finn","Lyra","Soren","Vesper","Nico","Rowan","Indra","Zephyr","Lena"];
const AUTHOR_LAST  = ["Voss","Ashford","Crane","Dawnmore","Holt","Vane","Stirling","Marlowe","Finch","Wren","Calder","Lorne","Thorne","Blake","Rivers","Shore","Vale","Morrow","Cross","Reid"];
function randomAuthorName() {
  return `${AUTHOR_FIRST[Math.floor(Math.random()*AUTHOR_FIRST.length)]} ${AUTHOR_LAST[Math.floor(Math.random()*AUTHOR_LAST.length)]}`;
}

// ─────────────────────────────────────────────
// FONTS CATALOGUE — 16 distinctive options
// ─────────────────────────────────────────────
export const FONTS = {
  cormorant:  { id:"cormorant",  label:"Cormorant Garamond", stack:"'Cormorant Garamond',Georgia,serif",    category:"Serif",    feel:"Classical elegance" },
  playfair:   { id:"playfair",   label:"Playfair Display",   stack:"'Playfair Display',Georgia,serif",      category:"Serif",    feel:"Editorial drama" },
  baskerville:{ id:"baskerville",label:"Libre Baskerville",  stack:"'Libre Baskerville',Georgia,serif",     category:"Serif",    feel:"Timeless authority" },
  lora:       { id:"lora",       label:"Lora",               stack:"'Lora',Georgia,serif",                  category:"Serif",    feel:"Warm & readable" },
  crimson:    { id:"crimson",    label:"Crimson Pro",        stack:"'Crimson Pro',Georgia,serif",           category:"Serif",    feel:"Literary warmth" },
  eb_garamond:{ id:"eb_garamond",label:"EB Garamond",        stack:"'EB Garamond',Georgia,serif",           category:"Serif",    feel:"Renaissance scholar" },
  merriweather:{id:"merriweather",label:"Merriweather",      stack:"'Merriweather',Georgia,serif",          category:"Serif",    feel:"Screen comfort" },
  courier:    { id:"courier",    label:"Courier Prime",      stack:"'Courier Prime','Courier New',monospace",category:"Mono",    feel:"Typewriter soul" },
  special:    { id:"special",    label:"Special Elite",      stack:"'Special Elite',cursive",               category:"Display",  feel:"Vintage typeface" },
  dm_serif:   { id:"dm_serif",   label:"DM Serif Display",   stack:"'DM Serif Display',Georgia,serif",      category:"Display",  feel:"Modern editorial" },
  spectral:   { id:"spectral",   label:"Spectral",           stack:"'Spectral',Georgia,serif",              category:"Serif",    feel:"Digital ink" },
  abril:      { id:"abril",      label:"Abril Fatface",      stack:"'Abril Fatface',Georgia,serif",         category:"Display",  feel:"Bold statement" },
  dm_sans:    { id:"dm_sans",    label:"DM Sans",            stack:"'DM Sans',sans-serif",                  category:"Sans",     feel:"Clean & modern" },
  jost:       { id:"jost",       label:"Jost",               stack:"'Jost',sans-serif",                     category:"Sans",     feel:"Geometric clarity" },
  nunito:     { id:"nunito",     label:"Nunito",             stack:"'Nunito',sans-serif",                   category:"Sans",     feel:"Friendly round" },
  source_sans:{ id:"source_sans",label:"Source Serif 4",     stack:"'Source Serif 4',Georgia,serif",        category:"Serif",    feel:"Journalistic" },
};

const GFONTS_URL = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=DM+Serif+Display:ital@0;1&family=Spectral:ital,wght@0,300;0,400;0,600;1,400&family=Abril+Fatface&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Jost:ital,wght@0,300;0,400;0,500;1,400&family=Nunito:ital,wght@0,300;0,400;0,600;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap";

// ─────────────────────────────────────────────
// SVG TEXTURES (inline, no external images)
// ─────────────────────────────────────────────
const TEXTURES = {
  none: { id:"none", label:"None", svg:"" },
  paper: {
    id:"paper", label:"Paper",
    svg:`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(#n)' opacity='0.08'/></svg>`
  },
  linen: {
    id:"linen", label:"Linen",
    svg:`<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect width='4' height='4' fill='none'/><path d='M0 0h4M0 2h4M1 0v4M3 0v4' stroke='currentColor' stroke-width='0.3' opacity='0.12'/></svg>`
  },
  grain: {
    id:"grain", label:"Grain",
    svg:`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='g'><feTurbulence type='turbulence' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100' height='100' filter='url(#g)' opacity='0.06'/></svg>`
  },
  dots: {
    id:"dots", label:"Dots",
    svg:`<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='1' cy='1' r='0.8' fill='currentColor' opacity='0.15'/></svg>`
  },
  ruled: {
    id:"ruled", label:"Ruled",
    svg:`<svg xmlns='http://www.w3.org/2000/svg' width='1' height='28'><line x1='0' y1='27' x2='1' y2='27' stroke='currentColor' stroke-width='0.6' opacity='0.1'/></svg>`
  },
  grid: {
    id:"grid", label:"Grid",
    svg:`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M24 0H0M0 24V0' stroke='currentColor' stroke-width='0.4' opacity='0.1'/></svg>`
  },
  crosshatch: {
    id:"crosshatch", label:"Crosshatch",
    svg:`<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><path d='M0 8L8 0M-1 1L1-1M7 9L9 7' stroke='currentColor' stroke-width='0.5' opacity='0.1'/></svg>`
  },
};

function textureBg(textureId, color = "#000") {
  const t = TEXTURES[textureId];
  if (!t || !t.svg) return "none";
  const colored = t.svg.replace(/currentColor/g, color);
  const encoded = encodeURIComponent(colored);
  return `url("data:image/svg+xml,${encoded}")`;
}

// ─────────────────────────────────────────────
// ENHANCED THEMES — 9 complete systems
// ─────────────────────────────────────────────
export const THEMES = {
  parchment: {
    id:"parchment", name:"Parchment", group:"Light",
    bg:"#f5edd8", surface:"#faf5e9", surfaceAlt:"#ede3cc",
    border:"#d6c9a8", text:"#2c2010", textMuted:"#7a6a50", textFaint:"#b0a080",
    accent:"#8b4513", accentLight:"#bf7040",
    editorBg:"#fdf8ee",
    shadow:"rgba(44,32,16,0.14)",
    font:"cormorant", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 30% 20%, #f0e6c8 0%, #f5edd8 60%, #ede0c0 100%)",
    decorativeColor:"rgba(139,69,19,0.07)",
    badge:"#8b4513", badgeText:"#fff",
  },
  midnight: {
    id:"midnight", name:"Midnight", group:"Dark",
    bg:"#0b0f18", surface:"#131824", surfaceAlt:"#1a2235",
    border:"#252e42", text:"#dde4f0", textMuted:"#7a8aaa", textFaint:"#3d4d6a",
    accent:"#5b9bd5", accentLight:"#82b8e8",
    editorBg:"#0e1420",
    shadow:"rgba(0,0,0,0.5)",
    font:"playfair", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 20% 10%, #111e38 0%, #0b0f18 55%, #08111e 100%)",
    decorativeColor:"rgba(91,155,213,0.06)",
    badge:"#5b9bd5", badgeText:"#0b0f18",
  },
  verdant: {
    id:"verdant", name:"Verdant", group:"Light",
    bg:"#edf4ed", surface:"#f4f9f4", surfaceAlt:"#dfeede",
    border:"#b8d4b5", text:"#162018", textMuted:"#4a6e48", textFaint:"#87a884",
    accent:"#2d6a4f", accentLight:"#52b788",
    editorBg:"#f7faf7",
    shadow:"rgba(20,40,20,0.1)",
    font:"lora", uiFont:"'Jost',sans-serif",
    bgStyle:"radial-gradient(ellipse at 70% 80%, #d8edda 0%, #edf4ed 55%, #e5f0e3 100%)",
    decorativeColor:"rgba(45,106,79,0.06)",
    badge:"#2d6a4f", badgeText:"#fff",
  },
  dusk: {
    id:"dusk", name:"Ember Dusk", group:"Dark",
    bg:"#160c06", surface:"#1e1008", surfaceAlt:"#2a1810",
    border:"#3d2415", text:"#f0dcc8", textMuted:"#b07850", textFaint:"#5a3820",
    accent:"#d4622a", accentLight:"#e8844a",
    editorBg:"#191009",
    shadow:"rgba(0,0,0,0.6)",
    font:"playfair", uiFont:"'Lora',Georgia,serif",
    bgStyle:"radial-gradient(ellipse at 80% 20%, #2a1408 0%, #160c06 55%, #0e0804 100%)",
    decorativeColor:"rgba(212,98,42,0.08)",
    badge:"#d4622a", badgeText:"#fff",
  },
  typewriter: {
    id:"typewriter", name:"Typewriter", group:"Light",
    bg:"#f2ede4", surface:"#f8f4ec", surfaceAlt:"#e8e2d6",
    border:"#c8bfa6", text:"#1a1610", textMuted:"#6b5e48", textFaint:"#a89070",
    accent:"#2c2010", accentLight:"#5a4830",
    editorBg:"#f8f4ec",
    shadow:"rgba(26,22,16,0.16)",
    font:"courier", uiFont:"'Special Elite',cursive",
    bgStyle:"linear-gradient(180deg, #f2ede4 0%, #ede8de 100%)",
    decorativeColor:"rgba(26,22,16,0.06)",
    badge:"#2c2010", badgeText:"#f2ede4",
  },
  arctic: {
    id:"arctic", name:"Arctic", group:"Light",
    bg:"#f0f5f8", surface:"#f8fbfd", surfaceAlt:"#e4edf3",
    border:"#c4d8e4", text:"#0e1e2c", textMuted:"#4a6880", textFaint:"#8aaabb",
    accent:"#0077aa", accentLight:"#2299cc",
    editorBg:"#fafcfe",
    shadow:"rgba(10,30,50,0.1)",
    font:"spectral", uiFont:"'DM Sans',sans-serif",
    bgStyle:"radial-gradient(ellipse at 50% 0%, #ddeef8 0%, #f0f5f8 50%, #e8f2f6 100%)",
    decorativeColor:"rgba(0,119,170,0.05)",
    badge:"#0077aa", badgeText:"#fff",
  },
  noir: {
    id:"noir", name:"Noir", group:"Dark",
    bg:"#111111", surface:"#1a1a1a", surfaceAlt:"#222222",
    border:"#2e2e2e", text:"#e8e8e8", textMuted:"#888888", textFaint:"#444444",
    accent:"#e8d5a0", accentLight:"#f0e4b8",
    editorBg:"#141414",
    shadow:"rgba(0,0,0,0.7)",
    font:"eb_garamond", uiFont:"'DM Sans',sans-serif",
    bgStyle:"linear-gradient(160deg, #161616 0%, #111111 50%, #0e0e0e 100%)",
    decorativeColor:"rgba(232,213,160,0.04)",
    badge:"#e8d5a0", badgeText:"#111111",
  },
  rose: {
    id:"rose", name:"Rose & Cream", group:"Light",
    bg:"#fdf0ee", surface:"#fef8f6", surfaceAlt:"#f8e4e0",
    border:"#e8c4be", text:"#2a1018", textMuted:"#8a4a52", textFaint:"#c08880",
    accent:"#c0392b", accentLight:"#d45a4e",
    editorBg:"#fef9f8",
    shadow:"rgba(42,16,24,0.1)",
    font:"crimson", uiFont:"'Nunito',sans-serif",
    bgStyle:"radial-gradient(ellipse at 30% 70%, #f8ddd8 0%, #fdf0ee 55%, #faeae6 100%)",
    decorativeColor:"rgba(192,57,43,0.05)",
    badge:"#c0392b", badgeText:"#fff",
  },
  aurora: {
    id:"aurora", name:"Aurora", group:"Dark",
    bg:"#08101a", surface:"#0e1824", surfaceAlt:"#14202e",
    border:"#1e2e40", text:"#d8eee8", textMuted:"#5a9070", textFaint:"#2a5040",
    accent:"#3dbf8a", accentLight:"#62d4a4",
    editorBg:"#0a1218",
    shadow:"rgba(0,0,0,0.6)",
    font:"merriweather", uiFont:"'Jost',sans-serif",
    bgStyle:"radial-gradient(ellipse at 60% 40%, #0a2030 0%, #08101a 60%, #060e18 100%)",
    decorativeColor:"rgba(61,191,138,0.07)",
    badge:"#3dbf8a", badgeText:"#08101a",
  },
};

// ─────────────────────────────────────────────
// COVER GRADIENT PRESETS
// ─────────────────────────────────────────────
const COVER_GRADIENTS = [
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

const COVER_SOLID_COLORS = [
  "#1a1a2e","#16213e","#0f3460","#1b4332","#2d3a3a","#3d0c02",
  "#2d1b00","#4a1040","#1a3a1a","#2a1a08","#0a2a2a","#2a0a0a",
  "#2e2e2e","#1a2a1a","#0e1e3e","#3a1a00",
];

const COVER_TEXTURES_OVERLAY = [
  { id:"none",        label:"None" },
  { id:"linen_cover", label:"Linen",    opacity:0.18 },
  { id:"leather",     label:"Leather",  opacity:0.22 },
  { id:"canvas",      label:"Canvas",   opacity:0.15 },
  { id:"marble",      label:"Marble",   opacity:0.12 },
  { id:"paper_cover", label:"Paper",    opacity:0.14 },
];

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
const STORAGE_KEY = "folio_v2";
function loadData() { try { const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):null; } catch{return null;} }
function saveData(d) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(d)); } catch(e){} }
function genId() { return Math.random().toString(36).slice(2,9)+Date.now().toString(36); }
function countWords(html) { if(!html)return 0; return html.replace(/<[^>]*>/g," ").replace(/&[a-z]+;/g," ").replace(/\s+/g," ").trim().split(" ").filter(w=>w.length>0).length; }
function fmtDate(ts) { if(!ts)return""; const d=new Date(ts); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
function readTime(w) { const m=Math.ceil(w/200); return m<1?"<1 min":m===1?"1 min":`${m} mins`; }

const GENRES = ["Novel","Poetry","Journal","Essay","Short Story","Memoir","Fantasy","Sci-Fi","Romance","Mystery","Thriller","Non-Fiction","Screenplay","Other"];
const CHAPTER_STATUSES = [
  {id:"draft",     label:"Draft",       color:"#7a8aaa"},
  {id:"progress",  label:"In Progress", color:"#f6ad55"},
  {id:"complete",  label:"Complete",    color:"#68d391"},
  {id:"review",    label:"Needs Review",color:"#fc8181"},
  {id:"locked",    label:"Locked",      color:"#a0a0c0"},
];

// ─────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────
function getInitialData() {
  const ex = loadData();
  if(ex) return ex;
  const bookId = genId(), ch1 = genId(), ch2 = genId();
  return {
    settings: {
      authorName: randomAuthorName(),
      authorBio: "",
      themeId: "parchment",
      editorFontId: "cormorant",
      uiFontId: "dm_sans",
      fontSize: 18,
      lineHeight: 1.85,
      paragraphWidth: "medium",
      dailyGoal: 500,
      typewriterMode: false,
      focusModeDefault: false,
      showWordCountAlways: true,
      autosaveInterval: 30,
      spellingCheck: true,
      setupDone: true,
    },
    books: [{
      id:bookId, title:"My First Book", subtitle:"A story waiting to be told",
      genre:"Novel", createdAt:Date.now(), updatedAt:Date.now(),
      coverType:"gradient", coverGradient:"midnight_blue",
      coverSolidColor:"#1a1a2e", coverAngle:135,
      coverTextureOverlay:"none", wordGoal:50000, isArchived:false,
    }],
    chapters: [
      { id:ch1, bookId, title:"Chapter One", sortOrder:0, status:"draft",
        content:"<p>Begin your story here. Every great book starts with a single sentence.</p><p>This editor supports <strong>bold</strong>, <em>italic</em>, headings, blockquotes and more.</p>",
        notes:"Opening scene ideas...", createdAt:Date.now(), updatedAt:Date.now() },
      { id:ch2, bookId, title:"Chapter Two", sortOrder:1, status:"draft",
        content:"<p>The second chapter awaits your words.</p>",
        notes:"", createdAt:Date.now(), updatedAt:Date.now() },
    ],
    sessions: [],
    snapshots: [],
  };
}

// ─────────────────────────────────────────────
// COVER ART RENDERER
// ─────────────────────────────────────────────
function buildCoverGradient(book) {
  if (book.coverType === "solid") return book.coverSolidColor || "#1a1a2e";
  const preset = COVER_GRADIENTS.find(g=>g.id===book.coverGradient) || COVER_GRADIENTS[0];
  const angle = book.coverAngle ?? 135;
  return `linear-gradient(${angle}deg, ${preset.a}, ${preset.b})`;
}

function CoverArt({ book, size="card" }) {
  const dims = { tiny:{w:32,h:46}, small:{w:44,h:62}, card:{w:120,h:168}, large:{w:160,h:224} };
  const {w,h} = dims[size] || dims.card;
  const bg = buildCoverGradient(book);
  const isTiny = size==="tiny"||size==="small";
  const title = (book.title||"Untitled").substring(0,isTiny?0:18);
  const author = (book.authorOverride||"").substring(0,14);

  return (
    <div style={{width:w,height:h,borderRadius:isTiny?2:4,background:bg,position:"relative",overflow:"hidden",flexShrink:0,boxShadow:`-2px 2px 8px rgba(0,0,0,0.3), inset -3px 0 6px rgba(0,0,0,0.2)`}}>
      {/* Spine */}
      <div style={{position:"absolute",left:0,top:0,width:isTiny?3:5,height:"100%",background:"rgba(0,0,0,0.25)"}}/>
      {/* Texture overlay */}
      {book.coverTextureOverlay && book.coverTextureOverlay!=="none" && (
        <div style={{position:"absolute",inset:0,opacity:0.15,backgroundImage:"repeating-linear-gradient(45deg,rgba(255,255,255,0.1) 0px,rgba(255,255,255,0.1) 1px,transparent 1px,transparent 6px)",mixBlendMode:"overlay"}}/>
      )}
      {/* Inner border */}
      {!isTiny&&<div style={{position:"absolute",inset:6,border:"1px solid rgba(255,255,255,0.18)",borderRadius:2,pointerEvents:"none"}}/>}
      {!isTiny&&<div style={{position:"absolute",inset:9,border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:1,pointerEvents:"none"}}/>}
      {/* Decorative diagonal highlight */}
      <div style={{position:"absolute",top:0,right:0,width:w*0.6,height:h*0.4,background:"radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 70%)",pointerEvents:"none"}}/>
      {/* Title text */}
      {!isTiny && title && (
        <div style={{position:"absolute",bottom:28,left:10,right:10}}>
          <div style={{height:"0.5px",background:"rgba(255,255,255,0.4)",marginBottom:8}}/>
          <p style={{fontFamily:"Georgia,serif",fontSize:Math.max(7,Math.min(12,w/11)),fontWeight:700,color:"rgba(255,255,255,0.92)",lineHeight:1.25,wordBreak:"break-word"}}>{title}</p>
          {author && <p style={{fontFamily:"Georgia,serif",fontSize:Math.max(6,w/18),color:"rgba(255,255,255,0.6)",marginTop:3,fontStyle:"italic"}}>{author}</p>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function FolioApp() {
  const [data, setData]                   = useState(getInitialData);
  const [view, setView]                   = useState("library");
  const [activeBookId, setActiveBookId]   = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [mobileDrawer, setMobileDrawer]   = useState(false);
  const [zenMode, setZenMode]             = useState(false);
  const [focusMode, setFocusMode]         = useState(false);
  const [showExport, setShowExport]       = useState(false);
  const [showNewBook, setShowNewBook]     = useState(false);
  const [showBookEdit, setShowBookEdit]   = useState(null);
  const [toast, setToast]                 = useState(null);
  const [searchQ, setSearchQ]             = useState("");
  const [isMobile, setIsMobile]           = useState(window.innerWidth<768);
  const saveTimer = useRef(null);

  useEffect(()=>{ const fn=()=>setIsMobile(window.innerWidth<768); window.addEventListener("resize",fn); return()=>window.removeEventListener("resize",fn); },[]);

  // Persist
  useEffect(()=>{ if(saveTimer.current)clearTimeout(saveTimer.current); saveTimer.current=setTimeout(()=>saveData(data),600); },[data]);

  // Inject fonts
  useEffect(()=>{
    if(document.getElementById("folio-fonts"))return;
    const l=document.createElement("link"); l.id="folio-fonts"; l.rel="stylesheet"; l.href=GFONTS_URL;
    document.head.appendChild(l);
  },[]);

  const notify = useCallback((msg,type="ok")=>{ setToast({msg,type,id:Date.now()}); setTimeout(()=>setToast(null),2800); },[]);
  const upSettings = useCallback((u)=>setData(d=>({...d,settings:{...d.settings,...u}})),[]);

  const theme     = THEMES[data.settings.themeId]||THEMES.parchment;
  const edFont    = FONTS[data.settings.editorFontId]||FONTS.cormorant;
  const activeBook    = useMemo(()=>data.books.find(b=>b.id===activeBookId),[data.books,activeBookId]);
  const bookChapters  = useMemo(()=>data.chapters.filter(c=>c.bookId===activeBookId).sort((a,b)=>a.sortOrder-b.sortOrder),[data.chapters,activeBookId]);
  const activeChapter = useMemo(()=>data.chapters.find(c=>c.id===activeChapterId),[data.chapters,activeChapterId]);

  const openBook = useCallback((bookId)=>{
    setActiveBookId(bookId);
    const chs=data.chapters.filter(c=>c.bookId===bookId).sort((a,b)=>a.sortOrder-b.sortOrder);
    if(chs.length>0)setActiveChapterId(chs[0].id);
    setView("editor");
  },[data.chapters]);

  const createBook = useCallback((bd)=>{
    const id=genId(), cid=genId();
    setData(d=>({...d,
      books:[...d.books,{id,...bd,createdAt:Date.now(),updatedAt:Date.now(),isArchived:false}],
      chapters:[...d.chapters,{id:cid,bookId:id,title:"Chapter One",sortOrder:0,status:"draft",content:"<p>Begin your story here...</p>",notes:"",createdAt:Date.now(),updatedAt:Date.now()}]
    }));
    setActiveBookId(id); setActiveChapterId(cid); setView("editor");
    notify("Book created — happy writing!");
  },[notify]);

  const updateBook   = useCallback((id,u)=>setData(d=>({...d,books:d.books.map(b=>b.id===id?{...b,...u,updatedAt:Date.now()}:b)})),[]);
  const deleteBook   = useCallback((id)=>{
    setData(d=>({...d,books:d.books.filter(b=>b.id!==id),chapters:d.chapters.filter(c=>c.bookId!==id)}));
    if(activeBookId===id){setActiveBookId(null);setView("library");}
    notify("Book deleted");
  },[activeBookId,notify]);

  const addChapter = useCallback(()=>{
    const id=genId(), max=bookChapters.length>0?Math.max(...bookChapters.map(c=>c.sortOrder)):-1;
    setData(d=>({...d,chapters:[...d.chapters,{id,bookId:activeBookId,title:`Chapter ${bookChapters.length+1}`,sortOrder:max+1,status:"draft",content:"<p></p>",notes:"",createdAt:Date.now(),updatedAt:Date.now()}]}));
    setActiveChapterId(id);
    notify("Chapter added");
  },[activeBookId,bookChapters,notify]);

  const updateChapter = useCallback((id,u)=>setData(d=>({...d,chapters:d.chapters.map(c=>c.id===id?{...c,...u,updatedAt:Date.now()}:c)})),[]);
  const deleteChapter = useCallback((id)=>{
    setData(d=>({...d,chapters:d.chapters.filter(c=>c.id!==id)}));
    if(activeChapterId===id){
      const rem=bookChapters.filter(c=>c.id!==id);
      setActiveChapterId(rem.length>0?rem[0].id:null);
    }
    notify("Chapter deleted");
  },[activeChapterId,bookChapters,notify]);

  const moveChapter = useCallback((id,dir)=>{
    const idx=bookChapters.findIndex(c=>c.id===id);
    const si=dir==="up"?idx-1:idx+1;
    if(si<0||si>=bookChapters.length)return;
    const a=bookChapters[idx],b=bookChapters[si];
    setData(d=>({...d,chapters:d.chapters.map(c=>c.id===a.id?{...c,sortOrder:b.sortOrder}:c.id===b.id?{...c,sortOrder:a.sortOrder}:c)}));
  },[bookChapters]);

  const bwc = useMemo(()=>{
    const m={};
    data.chapters.forEach(c=>{m[c.bookId]=(m[c.bookId]||0)+countWords(c.content);});
    return m;
  },[data.chapters]);

  const todayStr   = new Date().toISOString().split("T")[0];
  const todayWords = useMemo(()=>data.sessions.filter(s=>s.date===todayStr).reduce((a,s)=>a+s.words,0),[data.sessions,todayStr]);
  const streak     = useMemo(()=>{
    const dates=[...new Set(data.sessions.map(s=>s.date))].sort();
    if(!dates.length)return 0;
    let n=0,cur=new Date();
    for(let i=0;i<365;i++){
      const d=cur.toISOString().split("T")[0];
      if(dates.includes(d)){n++;cur.setDate(cur.getDate()-1);}else break;
    }
    return n;
  },[data.sessions]);

  const addSession = useCallback((words)=>{
    if(words<=0)return;
    const today=new Date().toISOString().split("T")[0];
    setData(d=>{
      const ex=d.sessions.find(s=>s.date===today);
      if(ex)return{...d,sessions:d.sessions.map(s=>s.date===today?{...s,words:s.words+words}:s)};
      return{...d,sessions:[...d.sessions,{id:genId(),date:today,words}]};
    });
  },[]);

  // CSS vars injected via style prop on root
  const vars = {
    "--bg":theme.bg,"--surf":theme.surface,"--surf-alt":theme.surfaceAlt,
    "--brd":theme.border,"--txt":theme.text,"--txt-m":theme.textMuted,"--txt-f":theme.textFaint,
    "--acc":theme.accent,"--acc-l":theme.accentLight,"--ed-bg":theme.editorBg,
    "--shd":theme.shadow,"--badge":theme.badge,"--badge-txt":theme.badgeText,
    "--ed-font":edFont.stack,"--ui-font":theme.uiFont,
    "--fs":`${data.settings.fontSize}px`,"--lh":data.settings.lineHeight,
  };
  const pw = {narrow:"520px",medium:"680px",wide:"840px",full:"100%"}[data.settings.paragraphWidth]||"680px";

  return (
    <div style={{...vars,fontFamily:"var(--ui-font)",background:"var(--bg)",color:"var(--txt)",minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative",backgroundImage:theme.bgStyle,backgroundAttachment:"fixed"}}>
      <GlobalStyles theme={theme} isMobile={isMobile} pw={pw}/>

      {/* Subtle grain overlay for all themes */}
      <div style={{position:"fixed",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,backgroundRepeat:"repeat",backgroundSize:"180px",pointerEvents:"none",zIndex:9998,mixBlendMode:"overlay"}}/>

      <div style={{position:"relative",zIndex:1,flex:1,display:"flex",flexDirection:"column"}}>
        {view==="library"  && <LibraryView  data={data} theme={theme} isMobile={isMobile} onOpenBook={openBook} onCreateBook={()=>setShowNewBook(true)} onDeleteBook={deleteBook} onUpdateBook={updateBook} bwc={bwc} todayWords={todayWords} streak={streak} searchQ={searchQ} setSearchQ={setSearchQ} setView={setView} upSettings={upSettings} showBookEdit={showBookEdit} setShowBookEdit={setShowBookEdit}/>}
        {view==="editor"   && activeBook && <EditorView data={data} theme={theme} isMobile={isMobile} book={activeBook} chapters={bookChapters} activeChapter={activeChapter} onSelectChapter={setActiveChapterId} onAddChapter={addChapter} onUpdateChapter={updateChapter} onDeleteChapter={deleteChapter} onMoveChapter={moveChapter} onUpdateBook={updateBook} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileDrawer={mobileDrawer} setMobileDrawer={setMobileDrawer} zenMode={zenMode} setZenMode={setZenMode} focusMode={focusMode} setFocusMode={setFocusMode} onExport={()=>setShowExport(true)} onBack={()=>setView("library")} pw={pw} notify={notify} todayWords={todayWords} dailyGoal={data.settings.dailyGoal} addSession={addSession} settings={data.settings}/>}
        {view==="goals"    && <GoalsView    data={data} theme={theme} isMobile={isMobile} todayWords={todayWords} streak={streak} bwc={bwc} upSettings={upSettings} setView={setView}/>}
        {view==="settings" && <SettingsView data={data} theme={theme} isMobile={isMobile} upSettings={upSettings} setView={setView} notify={notify}/>}

        {/* Mobile bottom nav */}
        {isMobile && !zenMode && (
          <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--surf)",borderTop:"1px solid var(--brd)",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
            {[{id:"library",Icon:BookOpen,label:"Library"},{id:"editor",Icon:Edit3,label:"Write",dis:!activeBookId},{id:"goals",Icon:Target,label:"Goals"},{id:"settings",Icon:Settings,label:"Settings"}].map(({id,Icon,label,dis})=>(
              <button key={id} onClick={()=>!dis&&setView(id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 0",cursor:dis?"not-allowed":"pointer",color:view===id?"var(--acc)":"var(--txt-f)",fontSize:10,fontWeight:600,border:"none",background:"none",opacity:dis?0.3:1,fontFamily:"var(--ui-font)",transition:"color 0.15s"}}>
                <Icon size={20}/><span>{label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {showNewBook  && <NewBookModal theme={theme} onCreate={createBook} onClose={()=>setShowNewBook(false)}/>}
      {showBookEdit && <EditBookModal book={data.books.find(b=>b.id===showBookEdit)} theme={theme} onUpdate={updateBook} onClose={()=>setShowBookEdit(null)} notify={notify}/>}
      {showExport   && activeBook && <ExportModal book={activeBook} chapters={bookChapters} theme={theme} settings={data.settings} onClose={()=>setShowExport(false)} notify={notify}/>}

      {toast && (
        <div className="toast-anim" style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?"#fc8181":theme.accent,color:"#fff",padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:600,zIndex:9999,display:"flex",alignItems:"center",gap:8,boxShadow:`0 4px 24px ${theme.shadow}`,whiteSpace:"nowrap"}}>
          <Check size={14}/>{toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// GLOBAL STYLES COMPONENT
// ─────────────────────────────────────────────
function GlobalStyles({theme,isMobile,pw}) {
  return (
    <style>{`
      @import url('${GFONTS_URL}');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-track{background:transparent;}
      ::-webkit-scrollbar-thumb{background:var(--brd);border-radius:3px;}
      ::selection{background:var(--acc);color:#fff;}
      .folio-editor{font-family:var(--ed-font);font-size:var(--fs);line-height:var(--lh);color:var(--txt);outline:none;min-height:400px;max-width:${pw};margin:0 auto;padding:2rem 1.5rem 8rem;}
      .folio-editor p{margin-bottom:1em;}
      .folio-editor h1{font-size:2em;font-weight:700;margin:1em 0 0.4em;line-height:1.2;}
      .folio-editor h2{font-size:1.55em;font-weight:600;margin:0.9em 0 0.3em;line-height:1.25;}
      .folio-editor h3{font-size:1.25em;font-weight:600;margin:0.8em 0 0.3em;}
      .folio-editor blockquote{border-left:3px solid var(--acc);padding:0.4em 0 0.4em 1.2em;margin:1em 0;font-style:italic;opacity:0.8;}
      .folio-editor strong{font-weight:700;}
      .folio-editor em{font-style:italic;}
      .folio-editor u{text-decoration:underline;}
      .folio-editor s{text-decoration:line-through;}
      .folio-editor ul,.folio-editor ol{padding-left:1.5em;margin-bottom:1em;}
      .folio-editor li{margin-bottom:0.25em;}
      .folio-editor hr{border:none;border-top:1px solid var(--brd);margin:2.5em auto;width:35%;}
      .folio-editor [data-placeholder]:empty::before{content:attr(data-placeholder);color:var(--txt-f);font-style:italic;pointer-events:none;}
      .focus-on p{opacity:0.18;transition:opacity 0.3s;}
      .focus-on p:focus-within,.focus-on p:hover{opacity:1;}
      .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-family:var(--ui-font);font-size:13px;font-weight:600;transition:all 0.15s;letter-spacing:0.01em;}
      .btn-primary{background:var(--acc);color:#fff;}
      .btn-primary:hover{filter:brightness(1.12);}
      .btn-primary:active{transform:scale(0.97);}
      .btn-ghost{background:transparent;color:var(--txt-m);}
      .btn-ghost:hover{background:var(--surf-alt);color:var(--txt);}
      .btn-surf{background:var(--surf);border:1px solid var(--brd);color:var(--txt);}
      .btn-surf:hover{background:var(--surf-alt);}
      .ibtn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;border:none;cursor:pointer;background:transparent;color:var(--txt-m);transition:all 0.15s;flex-shrink:0;}
      .ibtn:hover{background:var(--surf-alt);color:var(--txt);}
      .ibtn.on{background:var(--acc);color:#fff;}
      .ibtn:disabled{opacity:0.3;cursor:default;}
      .card{background:var(--surf);border:1px solid var(--brd);border-radius:14px;padding:18px;transition:box-shadow 0.2s,transform 0.18s;}
      .card:hover{box-shadow:0 6px 28px var(--shd);transform:translateY(-1px);}
      .inp{background:var(--surf);border:1px solid var(--brd);border-radius:8px;padding:9px 12px;font-family:var(--ui-font);font-size:14px;color:var(--txt);outline:none;width:100%;transition:border-color 0.15s;-webkit-appearance:none;}
      .inp:focus{border-color:var(--acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 14%,transparent);}
      .ta{background:var(--surf);border:1px solid var(--brd);border-radius:8px;padding:10px 12px;font-family:var(--ui-font);font-size:14px;color:var(--txt);outline:none;width:100%;resize:vertical;transition:border-color 0.15s;}
      .ta:focus{border-color:var(--acc);}
      select.inp{cursor:pointer;}
      .lbl{font-size:11px;font-weight:700;color:var(--txt-m);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;display:block;}
      .modal-wrap{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;}
      .modal{background:var(--surf);border:1px solid var(--brd);border-radius:18px;padding:28px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px var(--shd);}
      .modal-title{font-family:var(--ed-font);font-size:22px;font-weight:600;color:var(--txt);margin-bottom:22px;}
      .ch-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;cursor:pointer;transition:all 0.14s;}
      .ch-item:hover{background:var(--surf-alt);}
      .ch-item.active{background:var(--acc);color:#fff;}
      .ch-item.active .ch-meta{color:rgba(255,255,255,0.65);}
      .ch-meta{font-size:11px;color:var(--txt-f);}
      .pbar{height:4px;background:var(--surf-alt);border-radius:2px;overflow:hidden;}
      .pfill{height:100%;background:var(--acc);border-radius:2px;transition:width 0.4s ease;}
      .bsht{position:fixed;bottom:0;left:0;right:0;background:var(--surf);border-top:1px solid var(--brd);border-radius:20px 20px 0 0;padding:20px;z-index:200;max-height:72vh;overflow-y:auto;box-shadow:0 -8px 40px var(--shd);animation:slideUp 0.28s ease;}
      @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      .fade-in{animation:fadeIn 0.35s ease;}
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      .toast-anim{animation:toastIn 0.3s ease;}
      @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      .wc-badge{position:fixed;bottom:${isMobile?"72px":"18px"};right:18px;background:var(--surf);border:1px solid var(--brd);border-radius:20px;padding:6px 14px;font-size:12px;color:var(--txt-m);display:flex;align-items:center;gap:7px;box-shadow:0 2px 12px var(--shd);z-index:50;font-family:var(--ui-font);}
      .dot-pulse{width:6px;height:6px;border-radius:50%;animation:pulse 2s infinite;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
      .hday{width:12px;height:12px;border-radius:3px;cursor:default;transition:transform 0.1s;}
      .hday:hover{transform:scale(1.3);}
      .tab-pill{padding:8px 16px;border-radius:20px;border:none;cursor:pointer;font-family:var(--ui-font);font-size:13px;font-weight:600;transition:all 0.15s;}
      .tab-pill.on{background:var(--acc);color:#fff;}
      .tab-pill.off{background:transparent;color:var(--txt-m);}
      .tab-pill.off:hover{background:var(--surf-alt);color:var(--txt);}
      @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @media(max-width:767px){.dsk{display:none!important;}}
      @media(min-width:768px){.mob{display:none!important;}}
    `}</style>
  );
}

// ─────────────────────────────────────────────
// LIBRARY VIEW
// ─────────────────────────────────────────────
function LibraryView({data,theme,isMobile,onOpenBook,onCreateBook,onDeleteBook,onUpdateBook,bwc,todayWords,streak,searchQ,setSearchQ,setView,upSettings,setShowBookEdit}) {
  const [vmMode, setVmMode]         = useState("grid");
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [menuOpen, setMenuOpen]     = useState(null);

  const active   = data.books.filter(b=>!b.isArchived);
  const archived = data.books.filter(b=>b.isArchived);
  const source   = showArchived?archived:active;
  const filtered = source.filter(b=>!searchQ||b.title?.toLowerCase().includes(searchQ.toLowerCase())||b.genre?.toLowerCase().includes(searchQ.toLowerCase()));
  const totalW   = Object.values(bwc).reduce((a,b)=>a+b,0);

  return (
    <div className="fade-in" style={{maxWidth:1100,margin:"0 auto",padding:isMobile?"16px 16px 88px":"36px 36px"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:32,flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <div style={{width:40,height:40,borderRadius:12,background:theme.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px ${theme.shadow}`}}>
              <Feather size={20} color="#fff"/>
            </div>
            <h1 style={{fontFamily:theme.font==="playfair"?"'Playfair Display',serif":theme.font==="cormorant"?"'Cormorant Garamond',serif":"'Lora',serif",fontSize:isMobile?30:38,fontWeight:700,color:theme.text,letterSpacing:"-0.03em",lineHeight:1}}>Folio</h1>
          </div>
          <p style={{color:theme.textMuted,fontSize:14}}>Welcome back, <span style={{color:theme.accent,fontWeight:700}}>{data.settings.authorName||"Writer"}</span></p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {!isMobile&&<>
            <button className="btn btn-ghost" onClick={()=>setView("goals")}><Target size={14}/>Goals</button>
            <button className="btn btn-ghost" onClick={()=>setView("settings")}><Settings size={14}/>Settings</button>
          </>}
          <button className="btn btn-primary" onClick={onCreateBook}><Plus size={14}/>New Book</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[{l:"Books",v:active.length,I:BookOpen},{l:"Total Words",v:totalW.toLocaleString(),I:FileText},{l:"Today",v:`${todayWords.toLocaleString()} words`,I:PenTool},{l:"Streak",v:`${streak} day${streak!==1?"s":""}`,I:Flame}].map(({l,v,I})=>(
          <div key={l} className="card" style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <I size={13} color={theme.accentLight}/>
              <span style={{fontSize:10,color:theme.textFaint,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{l}</span>
            </div>
            <span style={{fontFamily:"var(--ed-font)",fontSize:24,fontWeight:700,color:theme.text,lineHeight:1}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:10,marginBottom:18,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:theme.textFaint,pointerEvents:"none"}}/>
          <input className="inp" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search books…" style={{paddingLeft:32}}/>
        </div>
        <button className={`ibtn${vmMode==="grid"?" on":""}`} onClick={()=>setVmMode("grid")}><Grid size={16}/></button>
        <button className={`ibtn${vmMode==="list"?" on":""}`} onClick={()=>setVmMode("list")}><List size={16}/></button>
        {archived.length>0&&<button className={`ibtn${showArchived?" on":""}`} onClick={()=>setShowArchived(!showArchived)}><Archive size={16}/></button>}
      </div>

      {/* Book grid/list */}
      {filtered.length===0?(
        <div style={{textAlign:"center",padding:"72px 20px",color:theme.textFaint}}>
          <BookOpen size={52} style={{marginBottom:18,opacity:0.22}}/>
          <p style={{fontFamily:"var(--ed-font)",fontSize:22,marginBottom:8,color:theme.textMuted}}>{showArchived?"No archived books":"Your library is empty"}</p>
          <p style={{fontSize:14,marginBottom:28}}>{showArchived?"Archive books to see them here":"Begin your writing journey today"}</p>
          {!showArchived&&<button className="btn btn-primary" style={{gap:8}} onClick={onCreateBook}><Plus size={14}/>Create Your First Book</button>}
        </div>
      ):vmMode==="grid"?(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
          {filtered.map(book=>(
            <BookCard key={book.id} book={book} theme={theme} words={bwc[book.id]||0}
              onOpen={()=>onOpenBook(book.id)}
              onEdit={()=>setShowBookEdit(book.id)}
              onArchive={()=>onUpdateBook(book.id,{isArchived:!book.isArchived})}
              onDelete={()=>setConfirmDel(book.id)}/>
          ))}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(book=>(
            <BookRow key={book.id} book={book} theme={theme} words={bwc[book.id]||0}
              onOpen={()=>onOpenBook(book.id)}
              onEdit={()=>setShowBookEdit(book.id)}
              onArchive={()=>onUpdateBook(book.id,{isArchived:!book.isArchived})}
              onDelete={()=>setConfirmDel(book.id)}/>
          ))}
        </div>
      )}

      {confirmDel&&(
        <div className="modal-wrap" onClick={()=>setConfirmDel(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:360}}>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:18}}>
              <div style={{width:42,height:42,borderRadius:12,background:"#fc818122",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={18} color="#fc8181"/></div>
              <div><p style={{fontWeight:700,color:theme.text,fontSize:15}}>Delete this book?</p><p style={{fontSize:13,color:theme.textMuted,marginTop:2}}>All chapters will be lost permanently.</p></div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button className="btn btn-ghost" onClick={()=>setConfirmDel(null)}>Cancel</button>
              <button className="btn" style={{background:"#fc8181",color:"#fff"}} onClick={()=>{onDeleteBook(confirmDel);setConfirmDel(null);}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookCard({book,theme,words,onOpen,onEdit,onArchive,onDelete}) {
  const [open,setOpen]=useState(false);
  const pct=book.wordGoal?Math.min(100,Math.round((words/book.wordGoal)*100)):0;
  return (
    <div className="card" style={{cursor:"pointer",position:"relative",padding:14}} onClick={onOpen}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
        <CoverArt book={book} size="card"/>
      </div>
      <h3 style={{fontFamily:"var(--ed-font)",fontSize:15,fontWeight:600,color:theme.text,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{book.title||"Untitled"}</h3>
      {book.genre&&<span style={{fontSize:10,color:theme.textFaint,textTransform:"uppercase",letterSpacing:"0.07em"}}>{book.genre}</span>}
      <div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:theme.textMuted,fontWeight:500}}>{words.toLocaleString()} words</span>
        {book.wordGoal>0&&<span style={{fontSize:11,color:theme.textFaint}}>{pct}%</span>}
      </div>
      {book.wordGoal>0&&<div className="pbar" style={{marginTop:5}}><div className="pfill" style={{width:`${pct}%`}}/></div>}
      <div style={{position:"absolute",top:10,right:10}} onClick={e=>e.stopPropagation()}>
        <button className="ibtn" style={{width:26,height:26,borderRadius:6}} onClick={()=>setOpen(!open)}><MoreVertical size={13}/></button>
        {open&&(
          <div style={{position:"absolute",right:0,top:"100%",background:theme.surface,border:`1px solid ${theme.border}`,borderRadius:10,padding:6,zIndex:100,minWidth:148,boxShadow:`0 6px 28px ${theme.shadow}`}}>
            {[{I:Edit3,l:"Edit Cover",a:()=>{onEdit();setOpen(false);}},{I:Archive,l:book.isArchived?"Restore":"Archive",a:()=>{onArchive();setOpen(false);}},{I:Trash2,l:"Delete",a:()=>{onDelete();setOpen(false);},danger:true}].map(({I,l,a,danger})=>(
              <button key={l} className="btn btn-ghost" style={{width:"100%",justifyContent:"flex-start",padding:"8px 10px",fontSize:13,color:danger?"#fc8181":"inherit"}} onClick={a}><I size={13}/>{l}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookRow({book,theme,words,onOpen,onEdit,onArchive,onDelete}) {
  const pct=book.wordGoal?Math.min(100,Math.round((words/book.wordGoal)*100)):0;
  return (
    <div className="card" style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",padding:"12px 16px"}} onClick={onOpen}>
      <CoverArt book={book} size="small"/>
      <div style={{flex:1,minWidth:0}}>
        <h3 style={{fontFamily:"var(--ed-font)",fontSize:15,fontWeight:600,color:theme.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{book.title}</h3>
        <div style={{display:"flex",gap:10,marginTop:2,flexWrap:"wrap"}}>
          {book.genre&&<span style={{fontSize:11,color:theme.textFaint}}>{book.genre}</span>}
          <span style={{fontSize:11,color:theme.textFaint}}>{words.toLocaleString()} words</span>
          <span style={{fontSize:11,color:theme.textFaint}}>{fmtDate(book.updatedAt)}</span>
          {book.wordGoal>0&&<span style={{fontSize:11,color:theme.accentLight,fontWeight:600}}>{pct}%</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
        <button className="ibtn" onClick={onEdit}><Edit3 size={14}/></button>
        <button className="ibtn" onClick={onArchive}><Archive size={14}/></button>
        <button className="ibtn" style={{color:"#fc8181"}} onClick={onDelete}><Trash2 size={14}/></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EDITOR VIEW
// ─────────────────────────────────────────────
function EditorView({data,theme,isMobile,book,chapters,activeChapter,onSelectChapter,onAddChapter,onUpdateChapter,onDeleteChapter,onMoveChapter,onUpdateBook,sidebarOpen,setSidebarOpen,mobileDrawer,setMobileDrawer,zenMode,setZenMode,focusMode,setFocusMode,onExport,onBack,pw,notify,todayWords,dailyGoal,addSession,settings}) {
  const edRef   = useRef(null);
  const [showNotes, setShowNotes] = useState(false);
  const [wc, setWc]               = useState(0);
  const [saved, setSaved]         = useState(true);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal]   = useState("");
  const prevContent = useRef("");
  const saveTimer   = useRef(null);

  useEffect(()=>{
    if(activeChapter){ setWc(countWords(activeChapter.content)); prevContent.current=activeChapter.content; }
  },[activeChapter?.id]);

  useEffect(()=>{
    if(edRef.current&&activeChapter&&edRef.current.innerHTML!==activeChapter.content){
      edRef.current.innerHTML=activeChapter.content||"<p></p>";
    }
  },[activeChapter?.id]);

  const exec = useCallback((cmd,val=null)=>{ edRef.current?.focus(); document.execCommand(cmd,false,val); handleChange(); },[]);
  const insertHTML = useCallback((html)=>{ edRef.current?.focus(); document.execCommand("insertHTML",false,html); handleChange(); },[]);

  const handleChange = useCallback(()=>{
    if(!edRef.current||!activeChapter)return;
    const html=edRef.current.innerHTML;
    const nw=countWords(html); const ow=countWords(prevContent.current);
    setWc(nw); setSaved(false);
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      onUpdateChapter(activeChapter.id,{content:html});
      const delta=nw-ow; if(delta>0)addSession(delta);
      prevContent.current=html; setSaved(true);
    },1100);
  },[activeChapter,onUpdateChapter,addSession]);

  const dailyPct=dailyGoal?Math.min(100,(todayWords/dailyGoal)*100):0;

  if(!activeChapter) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:16,color:theme.textFaint}}>
      <BookOpen size={44} style={{opacity:0.25}}/><p style={{fontFamily:"var(--ed-font)",fontSize:20,color:theme.textMuted}}>No chapter selected</p>
      <button className="btn btn-primary" onClick={onAddChapter}><Plus size={14}/>Add First Chapter</button>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      {/* Topbar */}
      {!zenMode&&(
        <div style={{height:52,borderBottom:`1px solid ${theme.border}`,display:"flex",alignItems:"center",padding:"0 12px",gap:8,background:theme.surface,flexShrink:0,zIndex:10}}>
          <button className="ibtn" onClick={onBack}><ArrowLeft size={16}/></button>
          {!isMobile&&<button className="ibtn" onClick={()=>setSidebarOpen(!sidebarOpen)}><PanelLeft size={16}/></button>}
          <div style={{flex:1,minWidth:0}}>
            {editTitle?(
              <input className="inp" value={titleVal} onChange={e=>setTitleVal(e.target.value)}
                onBlur={()=>{onUpdateBook(book.id,{title:titleVal});setEditTitle(false);}}
                onKeyDown={e=>{if(e.key==="Enter"){onUpdateBook(book.id,{title:titleVal});setEditTitle(false);}}}
                style={{maxWidth:280,padding:"4px 8px",fontSize:14,fontFamily:"var(--ed-font)",fontWeight:600}} autoFocus/>
            ):(
              <button onClick={()=>{setTitleVal(book.title);setEditTitle(true);}} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"var(--ed-font)",fontSize:15,fontWeight:700,color:theme.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:280}}>
                {book.title}
              </button>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {!isMobile&&dailyGoal>0&&(
              <div style={{display:"flex",alignItems:"center",gap:6,marginRight:6}}>
                <div style={{width:56,height:4,background:theme.surfaceAlt,borderRadius:2,overflow:"hidden"}}>
                  <div style={{width:`${dailyPct}%`,height:"100%",background:theme.accent,borderRadius:2}}/>
                </div>
                <span style={{fontSize:11,color:theme.textFaint}}>{todayWords}/{dailyGoal}</span>
              </div>
            )}
            {!isMobile&&<button className={`ibtn${showNotes?" on":""}`} onClick={()=>setShowNotes(!showNotes)}><Bookmark size={15}/></button>}
            <button className={`ibtn${focusMode?" on":""}`} onClick={()=>setFocusMode(!focusMode)} title="Focus mode"><Eye size={15}/></button>
            <button className="ibtn" onClick={()=>setZenMode(true)} title="Zen mode"><Maximize2 size={15}/></button>
            {isMobile&&<button className="ibtn" onClick={()=>setMobileDrawer(true)}><List size={15}/></button>}
            <button className="ibtn" onClick={onExport} title="Export PDF"><Download size={15}/></button>
          </div>
        </div>
      )}

      <div style={{display:"flex",height:zenMode?"100vh":"calc(100vh - 52px)",overflow:"hidden"}}>
        {/* Sidebar */}
        {!isMobile&&!zenMode&&sidebarOpen&&(
          <div style={{width:240,borderRight:`1px solid ${theme.border}`,overflowY:"auto",flexShrink:0,background:theme.surface}}>
            <ChapterSidebar chapters={chapters} activeId={activeChapter.id} theme={theme}
              onSelect={onSelectChapter} onAdd={onAddChapter} onDelete={onDeleteChapter}
              onMove={onMoveChapter} onRename={(id,t)=>onUpdateChapter(id,{title:t})}
              onStatus={(id,s)=>onUpdateChapter(id,{status:s})} book={book}/>
          </div>
        )}

        {/* Editor main */}
        <div style={{flex:1,overflowY:"auto",background:theme.editorBg}}>
          {!zenMode&&(
            <div style={{borderBottom:`1px solid ${theme.border}`,background:theme.surface,padding:"5px 10px",display:"flex",alignItems:"center",gap:1,overflowX:"auto",scrollbarWidth:"none"}}>
              <FormatToolbar exec={exec} insertHTML={insertHTML} theme={theme}/>
            </div>
          )}
          <div style={{background:theme.editorBg,minHeight:"100%",padding:isMobile?"0 6px":"0 24px"}}>
            <div style={{maxWidth:pw,margin:"0 auto",paddingTop:28,paddingBottom:8}}>
              <ChapterTitle chapter={activeChapter} theme={theme} onRename={t=>onUpdateChapter(activeChapter.id,{title:t})}/>
            </div>
            <div ref={edRef} className={`folio-editor${focusMode?" focus-on":""}`}
              contentEditable suppressContentEditableWarning onInput={handleChange}
              data-placeholder="Begin writing your story here…"
              style={{minHeight:"calc(100vh - 180px)"}}
            />
          </div>
        </div>

        {/* Notes panel */}
        {!isMobile&&!zenMode&&showNotes&&(
          <div style={{width:268,borderLeft:`1px solid ${theme.border}`,padding:16,overflowY:"auto",flexShrink:0,background:theme.surface}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <span className="lbl" style={{margin:0}}>Chapter Notes</span>
              <button className="ibtn" onClick={()=>setShowNotes(false)}><X size={14}/></button>
            </div>
            <textarea className="ta" rows={10} value={activeChapter.notes||""} onChange={e=>onUpdateChapter(activeChapter.id,{notes:e.target.value})} placeholder="Ideas, research, reminders…"/>
            <div style={{marginTop:18}}>
              <span className="lbl">Status</span>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {CHAPTER_STATUSES.map(s=>(
                  <button key={s.id} onClick={()=>onUpdateChapter(activeChapter.id,{status:s.id})}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:`1px solid ${activeChapter.status===s.id?s.color:theme.border}`,background:activeChapter.status===s.id?s.color+"22":"transparent",cursor:"pointer",fontFamily:"var(--ui-font)",fontSize:12,fontWeight:600,color:activeChapter.status===s.id?s.color:theme.textMuted}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:s.color}}/>{s.label}
                    {activeChapter.status===s.id&&<Check size={11} style={{marginLeft:"auto"}}/>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zen exit */}
      {zenMode&&<button className="ibtn" style={{position:"fixed",top:14,right:14,zIndex:200,background:theme.surface,border:`1px solid ${theme.border}`,width:38,height:38}} onClick={()=>setZenMode(false)}><Minimize2 size={16}/></button>}

      {/* Word count badge */}
      <div className="wc-badge">
        <div className="dot-pulse" style={{background:saved?"#68d391":"#f6ad55"}}/>
        <span>{wc.toLocaleString()} words</span>
        <span style={{color:theme.textFaint}}>·</span>
        <span style={{color:theme.textFaint}}>{readTime(wc)}</span>
      </div>

      {/* Mobile chapter drawer */}
      {isMobile&&mobileDrawer&&(
        <><div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:190}} onClick={()=>setMobileDrawer(false)}/>
        <div className="bsht">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <span style={{fontFamily:"var(--ed-font)",fontSize:17,fontWeight:700,color:theme.text}}>Chapters</span>
            <button className="ibtn" onClick={()=>setMobileDrawer(false)}><X size={16}/></button>
          </div>
          <ChapterSidebar chapters={chapters} activeId={activeChapter.id} theme={theme}
            onSelect={id=>{onSelectChapter(id);setMobileDrawer(false);}}
            onAdd={()=>{onAddChapter();setMobileDrawer(false);}}
            onDelete={onDeleteChapter} onMove={onMoveChapter}
            onRename={(id,t)=>onUpdateChapter(id,{title:t})}
            onStatus={(id,s)=>onUpdateChapter(id,{status:s})} book={book}/>
        </div></>
      )}
    </div>
  );
}

function ChapterTitle({chapter,theme,onRename}) {
  const [ed,setEd]=useState(false); const [v,setV]=useState(chapter.title);
  useEffect(()=>setV(chapter.title),[chapter.id,chapter.title]);
  if(ed) return <input value={v} onChange={e=>setV(e.target.value)}
    onBlur={()=>{onRename(v);setEd(false);}} onKeyDown={e=>{if(e.key==="Enter"){onRename(v);setEd(false);}if(e.key==="Escape")setEd(false);}}
    style={{fontFamily:"var(--ed-font)",fontSize:30,fontWeight:700,color:"var(--txt)",background:"transparent",border:"none",borderBottom:`2px solid var(--acc)`,outline:"none",width:"100%",paddingBottom:4,marginBottom:8}} autoFocus/>;
  return <h2 onClick={()=>setEd(true)} style={{fontFamily:"var(--ed-font)",fontSize:30,fontWeight:700,color:"var(--txt)",cursor:"text",marginBottom:8,lineHeight:1.25}}>{chapter.title}</h2>;
}

// ─────────────────────────────────────────────
// FORMAT TOOLBAR
// ─────────────────────────────────────────────
function FormatToolbar({exec,insertHTML,theme}) {
  const sep = ()=><div style={{width:1,height:20,background:"var(--brd)",margin:"0 3px",flexShrink:0}}/>;
  const B = ({I,cmd,val,tip,action,style:s})=>(
    <button className="ibtn" title={tip} style={{width:30,height:30,borderRadius:5,...s}}
      onClick={()=>action?action():exec(cmd,val||null)} onMouseDown={e=>e.preventDefault()}>
      <I size={14}/>
    </button>
  );
  return <>
    <B I={Bold} cmd="bold" tip="Bold (Ctrl+B)"/>
    <B I={Italic} cmd="italic" tip="Italic (Ctrl+I)"/>
    <B I={Underline} cmd="underline" tip="Underline (Ctrl+U)"/>
    <B I={Strikethrough} cmd="strikethrough" tip="Strikethrough"/>
    {sep()}
    <B I={Hash} cmd="formatBlock" val="h2" tip="Heading 1"/>
    <B I={Type} cmd="formatBlock" val="h3" tip="Heading 2"/>
    <B I={Quote} cmd="formatBlock" val="blockquote" tip="Blockquote"/>
    {sep()}
    <B I={AlignLeft} cmd="justifyLeft" tip="Align left"/>
    <B I={AlignCenter} cmd="justifyCenter" tip="Align center"/>
    <B I={AlignRight} cmd="justifyRight" tip="Align right"/>
    <B I={AlignJustify} cmd="justifyFull" tip="Justify"/>
    {sep()}
    <B I={List} cmd="insertUnorderedList" tip="Bullet list"/>
    <B I={Layers} cmd="insertOrderedList" tip="Numbered list"/>
    {sep()}
    <B I={Minus} tip="Scene break" action={()=>insertHTML('<p style="text-align:center;opacity:0.45;letter-spacing:0.5em;">* * *</p><p><br></p>')}/>
    <B I={CornerDownLeft} tip="Page break marker" action={()=>insertHTML('<hr/><p><br></p>')}/>
    <B I={Quote} tip="Pull quote" action={()=>insertHTML('<blockquote><p>Your quote here…</p></blockquote>')}/>
  </>;
}

// ─────────────────────────────────────────────
// CHAPTER SIDEBAR
// ─────────────────────────────────────────────
function ChapterSidebar({chapters,activeId,theme,onSelect,onAdd,onDelete,onMove,onRename,onStatus,book}) {
  const [renId,setRenId]=useState(null); const [renV,setRenV]=useState("");
  const tw=chapters.reduce((a,c)=>a+countWords(c.content),0);
  return (
    <div style={{padding:"12px 10px",display:"flex",flexDirection:"column",gap:3,height:"100%"}}>
      <div style={{marginBottom:10,padding:"10px 12px",background:theme.surfaceAlt,borderRadius:10}}>
        <p style={{fontFamily:"var(--ed-font)",fontSize:13,fontWeight:700,color:theme.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{book.title}</p>
        <p style={{fontSize:11,color:theme.textFaint,marginTop:2}}>{tw.toLocaleString()} total words</p>
        {book.wordGoal>0&&<div className="pbar" style={{marginTop:6}}><div className="pfill" style={{width:`${Math.min(100,(tw/book.wordGoal)*100)}%`}}/></div>}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 4px",marginBottom:4}}>
        <span className="lbl" style={{margin:0}}>Chapters</span>
        <button className="ibtn" style={{width:24,height:24,borderRadius:6}} onClick={onAdd}><Plus size={13}/></button>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {chapters.map((ch,i)=>{
          const st=CHAPTER_STATUSES.find(s=>s.id===ch.status);
          const cw=countWords(ch.content);
          const isActive=ch.id===activeId;
          return (
            <div key={ch.id} className={`ch-item${isActive?" active":""}`} onClick={()=>onSelect(ch.id)}>
              <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:isActive?"rgba(255,255,255,0.85)":(st?.color||theme.textFaint)}}/>
              <div style={{flex:1,minWidth:0}}>
                {renId===ch.id?(
                  <input value={renV} className="inp" style={{padding:"2px 6px",fontSize:13,color:theme.text}} onClick={e=>e.stopPropagation()}
                    onChange={e=>setRenV(e.target.value)}
                    onBlur={()=>{onRename(ch.id,renV);setRenId(null);}}
                    onKeyDown={e=>{if(e.key==="Enter"){onRename(ch.id,renV);setRenId(null);}}} autoFocus/>
                ):(
                  <p style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:isActive?"#fff":theme.text}}>{ch.title}</p>
                )}
                <p className="ch-meta">{cw>0?`${cw.toLocaleString()} words`:"Empty"}</p>
              </div>
              {isActive&&(
                <div style={{display:"flex",gap:2}} onClick={e=>e.stopPropagation()}>
                  {[{I:Edit3,a:()=>{setRenId(ch.id);setRenV(ch.title);}},{I:ArrowUp,a:()=>onMove(ch.id,"up"),dis:i===0},{I:ArrowDown,a:()=>onMove(ch.id,"down"),dis:i===chapters.length-1}].map(({I,a,dis},k)=>(
                    <button key={k} className="ibtn" style={{width:22,height:22,color:"rgba(255,255,255,0.75)"}} onClick={a} disabled={dis}><I size={11}/></button>
                  ))}
                  <button className="ibtn" style={{width:22,height:22,color:"rgba(255,100,100,0.8)"}} onClick={()=>{if(window.confirm("Delete this chapter?"))onDelete(ch.id);}}><Trash2 size={11}/></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GOALS VIEW (with proper back navigation)
// ─────────────────────────────────────────────
function GoalsView({data,theme,isMobile,todayWords,streak,bwc,upSettings,setView}) {
  const total=Object.values(bwc).reduce((a,b)=>a+b,0);
  const daily=data.settings.dailyGoal||500;
  const pct=Math.min(100,(todayWords/daily)*100);
  const sm=data.sessions; const avgW=sm.length?Math.round(sm.reduce((a,s)=>a+s.words,0)/sm.length):0;
  const sessMap={}; sm.forEach(s=>{sessMap[s.date]=(sessMap[s.date]||0)+s.words;});
  const maxW=Math.max(...Object.values(sessMap),1);
  const today=new Date(); const weeks=[];
  for(let w=51;w>=0;w--){const week=[];for(let d=6;d>=0;d--){const dt=new Date(today);dt.setDate(dt.getDate()-(w*7+d));const k=dt.toISOString().split("T")[0];week.push({k,words:sessMap[k]||0});}weeks.push(week);}
  return (
    <div className="fade-in" style={{maxWidth:820,margin:"0 auto",padding:isMobile?"16px 16px 88px":"36px 36px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
        <button className="ibtn" onClick={()=>setView("library")}><ArrowLeft size={16}/></button>
        <h1 style={{fontFamily:"var(--ed-font)",fontSize:30,fontWeight:700,color:theme.text}}>Writing Goals</h1>
      </div>

      {/* Today */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <p style={{fontFamily:"var(--ed-font)",fontSize:19,fontWeight:700,color:theme.text}}>Today's Goal</p>
            <p style={{fontSize:13,color:theme.textMuted,marginTop:2}}>{todayWords.toLocaleString()} / {daily.toLocaleString()} words</p>
          </div>
          <GoalRing pct={pct} color={theme.accent} size={72}/>
        </div>
        <div className="pbar" style={{height:8}}><div className="pfill" style={{width:`${pct}%`,height:"100%"}}/></div>
        {pct>=100&&<div style={{marginTop:12,padding:"10px 14px",background:theme.accent+"22",borderRadius:9,display:"flex",alignItems:"center",gap:8}}><Award size={15} color={theme.accent}/><span style={{fontSize:13,color:theme.accent,fontWeight:700}}>Daily goal crushed! Excellent work.</span></div>}
        <div style={{marginTop:14}}>
          <label className="lbl">Adjust Daily Goal</label>
          <input type="range" min={50} max={5000} step={50} value={daily} onChange={e=>upSettings({dailyGoal:Number(e.target.value)})} style={{width:"100%",accentColor:theme.accent}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:theme.textFaint,marginTop:3}}><span>50</span><span style={{fontWeight:700,color:theme.accent}}>{daily} words/day</span><span>5,000</span></div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Total Words",v:total.toLocaleString(),I:FileText,c:theme.accent},{l:"Streak",v:`${streak} days`,I:Flame,c:"#f6ad55"},{l:"Books",v:data.books.filter(b=>!b.isArchived).length,I:BookOpen,c:"#68d391"},{l:"Sessions",v:sm.length,I:Clock,c:"#90cdf4"},{l:"Today",v:todayWords.toLocaleString(),I:PenTool,c:theme.accentLight},{l:"Avg / Session",v:avgW,I:TrendingUp,c:"#e2a3f8"}].map(({l,v,I,c})=>(
          <div key={l} className="card" style={{textAlign:"center"}}>
            <I size={20} color={c} style={{marginBottom:8}}/>
            <p style={{fontFamily:"var(--ed-font)",fontSize:24,fontWeight:700,color:theme.text}}>{v}</p>
            <p style={{fontSize:11,color:theme.textFaint,marginTop:3}}>{l}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="card">
        <p style={{fontFamily:"var(--ed-font)",fontSize:17,fontWeight:700,color:theme.text,marginBottom:14}}>Writing Activity — Last 52 Weeks</p>
        <div style={{overflowX:"auto"}}>
          <div style={{display:"flex",gap:3,minWidth:600}}>
            {weeks.map((wk,wi)=>(
              <div key={wi} style={{display:"flex",flexDirection:"column",gap:3}}>
                {wk.map(d=>{
                  const alpha=d.words>0?Math.min(1,0.25+0.75*(d.words/maxW)):0;
                  return <div key={d.k} className="hday" title={`${d.k}: ${d.words} words`} style={{background:d.words>0?`color-mix(in srgb,${theme.accent} ${Math.round(alpha*100)}%,${theme.surfaceAlt})`:theme.surfaceAlt}}/>;
                })}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:4,marginTop:8,alignItems:"center"}}>
            <span style={{fontSize:10,color:theme.textFaint}}>Less</span>
            {[0.2,0.4,0.7,1].map(a=><div key={a} style={{width:10,height:10,borderRadius:3,background:`color-mix(in srgb,${theme.accent} ${Math.round(a*100)}%,${theme.surfaceAlt})`}}/>)}
            <span style={{fontSize:10,color:theme.textFaint}}>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalRing({pct,color,size=80,stroke=6}) {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r, dash=(pct/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color+"25"} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.5s ease"}}/>
      </svg>
      <span style={{position:"absolute",fontFamily:"var(--ui-font)",fontSize:size*0.22,fontWeight:700,color}}>{Math.round(pct)}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// SETTINGS VIEW
// ─────────────────────────────────────────────
function SettingsView({data,theme,isMobile,upSettings,setView,notify}) {
  const [tab,setTab]=useState("appearance");
  const tabs=[{id:"appearance",label:"Appearance",I:Palette},{id:"fonts",label:"Fonts",I:Type},{id:"editor",label:"Editor",I:Edit3},{id:"profile",label:"Profile",I:User},{id:"data",label:"Data",I:DownloadCloud}];
  return (
    <div className="fade-in" style={{maxWidth:740,margin:"0 auto",padding:isMobile?"16px 16px 88px":"36px 36px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
        <button className="ibtn" onClick={()=>setView("library")}><ArrowLeft size={16}/></button>
        <h1 style={{fontFamily:"var(--ed-font)",fontSize:30,fontWeight:700,color:theme.text}}>Settings</h1>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:24,flexWrap:"wrap"}}>
        {tabs.map(({id,label,I})=>(
          <button key={id} className={`tab-pill ${tab===id?"on":"off"}`} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:6}}>
            <I size={14}/>{!isMobile&&label}
          </button>
        ))}
      </div>
      {tab==="appearance" && <AppearanceTab data={data} theme={theme} upSettings={upSettings}/>}
      {tab==="fonts"      && <FontsTab      data={data} theme={theme} upSettings={upSettings}/>}
      {tab==="editor"     && <EditorTab     data={data} theme={theme} upSettings={upSettings}/>}
      {tab==="profile"    && <ProfileTab    data={data} theme={theme} upSettings={upSettings}/>}
      {tab==="data"       && <DataTab       data={data} theme={theme} notify={notify}/>}
    </div>
  );
}

function AppearanceTab({data,theme,upSettings}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <label className="lbl">Theme</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {Object.values(THEMES).map(t=>(
            <div key={t.id} onClick={()=>upSettings({themeId:t.id})}
              style={{padding:"12px 14px",borderRadius:12,border:`2px solid ${data.settings.themeId===t.id?t.accent:t.border}`,cursor:"pointer",background:t.bg,backgroundImage:t.bgStyle,display:"flex",alignItems:"center",gap:10,transition:"all 0.2s"}}>
              <div style={{width:22,height:30,borderRadius:3,background:t.accent,flexShrink:0,boxShadow:`-2px 1px 5px rgba(0,0,0,0.3)`}}/>
              <div>
                <p style={{fontSize:13,fontWeight:700,color:t.text,lineHeight:1}}>{t.name}</p>
                <p style={{fontSize:10,color:t.textMuted,marginTop:2}}>{t.group}</p>
              </div>
              {data.settings.themeId===t.id&&<Check size={14} color={t.accent} style={{marginLeft:"auto"}}/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FontsTab({data,theme,upSettings}) {
  const cats=["Serif","Display","Mono","Sans"];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      {["editorFontId","uiFontId"].map(key=>(
        <div key={key}>
          <label className="lbl">{key==="editorFontId"?"Writing / Editor Font":"UI Interface Font"}</label>
          {cats.map(cat=>{
            const list=Object.values(FONTS).filter(f=>f.category===cat);
            if(!list.length)return null;
            return (
              <div key={cat} style={{marginBottom:14}}>
                <p style={{fontSize:11,color:theme.textFaint,marginBottom:6,fontWeight:600}}>{cat}</p>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {list.map(f=>(
                    <div key={f.id} onClick={()=>upSettings({[key]:f.id})}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,border:`1px solid ${data.settings[key]===f.id?theme.accent:theme.border}`,background:data.settings[key]===f.id?theme.accent+"14":"transparent",cursor:"pointer",transition:"all 0.15s"}}>
                      <div style={{flex:1}}>
                        <span style={{fontSize:18,fontFamily:f.stack,color:theme.text,display:"block",lineHeight:1.2}}>{f.label}</span>
                        <span style={{fontSize:11,color:theme.textFaint,marginTop:2,display:"block"}}>{f.feel}</span>
                      </div>
                      <span style={{fontSize:12,fontFamily:f.stack,color:theme.textMuted,fontStyle:"italic"}}>"The quick brown fox…"</span>
                      {data.settings[key]===f.id&&<Check size={14} color={theme.accent} style={{flexShrink:0}}/>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EditorTab({data,theme,upSettings}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      {[{l:`Font Size — ${data.settings.fontSize}px`,k:"fontSize",min:13,max:24,step:1},{l:`Line Spacing — ${data.settings.lineHeight}×`,k:"lineHeight",min:1.4,max:2.4,step:0.05}].map(({l,k,min,max,step})=>(
        <div key={k}>
          <label className="lbl">{l}</label>
          <input type="range" min={min} max={max} step={step} value={data.settings[k]} onChange={e=>upSettings({[k]:Number(e.target.value)})} style={{width:"100%",accentColor:theme.accent}}/>
        </div>
      ))}
      <div>
        <label className="lbl">Paragraph Width</label>
        <div style={{display:"flex",gap:8}}>
          {["narrow","medium","wide","full"].map(w=>(
            <button key={w} onClick={()=>upSettings({paragraphWidth:w})}
              style={{flex:1,padding:"9px 4px",borderRadius:9,border:`1px solid ${data.settings.paragraphWidth===w?theme.accent:theme.border}`,background:data.settings.paragraphWidth===w?theme.accent+"18":"transparent",cursor:"pointer",fontSize:12,fontFamily:"var(--ui-font)",color:data.settings.paragraphWidth===w?theme.accent:theme.textMuted,fontWeight:data.settings.paragraphWidth===w?700:400,textTransform:"capitalize",transition:"all 0.15s"}}>
              {w}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="lbl">Daily Word Goal</label>
        <input type="number" className="inp" value={data.settings.dailyGoal||500} onChange={e=>upSettings({dailyGoal:Number(e.target.value)})} min={50} max={10000} step={50}/>
      </div>
      <div>
        <label className="lbl">Editor Options</label>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{k:"typewriterMode",l:"Typewriter scroll mode"},{k:"showWordCountAlways",l:"Always show word count badge"},{k:"focusModeDefault",l:"Start in focus mode"},{k:"spellingCheck",l:"Browser spell check"}].map(({k,l})=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:9,border:`1px solid ${theme.border}`,background:theme.surface}}>
              <span style={{fontSize:13,color:theme.text}}>{l}</span>
              <button onClick={()=>upSettings({[k]:!data.settings[k]})} style={{width:40,height:22,borderRadius:20,background:data.settings[k]?theme.accent:theme.surfaceAlt,border:"none",cursor:"pointer",transition:"background 0.2s",position:"relative"}}>
                <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:data.settings[k]?21:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({data,theme,upSettings}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${theme.accent},${theme.accentLight})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontFamily:"var(--ed-font)",color:"#fff",fontWeight:700,flexShrink:0,boxShadow:`0 4px 16px ${theme.shadow}`}}>
          {(data.settings.authorName||"A")[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <label className="lbl">Pen Name / Author Name</label>
          <input className="inp" value={data.settings.authorName||""} onChange={e=>upSettings({authorName:e.target.value})} placeholder="Your author name…"/>
          <p style={{fontSize:11,color:theme.textFaint,marginTop:4}}>Appears on exported PDFs and the library greeting</p>
        </div>
      </div>
      <div>
        <label className="lbl">Author Bio</label>
        <textarea className="ta" rows={4} value={data.settings.authorBio||""} onChange={e=>upSettings({authorBio:e.target.value})} placeholder="A short bio included at the end of exported PDFs…"/>
      </div>
    </div>
  );
}

function DataTab({data,theme,notify}) {
  const size=(()=>{ try{return(new Blob([localStorage.getItem("folio_v2")||""]).size/1024).toFixed(1);}catch{return"?";} })();
  const doExport=()=>{
    const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const u=URL.createObjectURL(b); const a=document.createElement("a");
    a.href=u; a.download=`folio-backup-${new Date().toISOString().split("T")[0]}.json`; a.click(); URL.revokeObjectURL(u);
    notify("Backup exported successfully!");
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><p style={{fontWeight:700,color:theme.text,fontSize:14}}>Local Storage Used</p><p style={{fontSize:12,color:theme.textMuted}}>{size} KB</p></div>
        <BarChart2 size={20} color={theme.accent}/>
      </div>
      <button className="btn btn-surf" onClick={doExport} style={{gap:8,justifyContent:"flex-start"}}><DownloadCloud size={15}/>Export Full Backup (JSON)</button>
      <div style={{padding:"14px 16px",background:theme.surfaceAlt,borderRadius:10,display:"flex",gap:8,alignItems:"flex-start"}}>
        <Info size={14} color={theme.textFaint} style={{flexShrink:0,marginTop:1}}/>
        <p style={{fontSize:12,color:theme.textMuted,lineHeight:1.6}}>All data is stored locally on this device. Your writing never leaves your browser. Export backups regularly to prevent data loss.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NEW BOOK MODAL
// ─────────────────────────────────────────────
function NewBookModal({theme,onCreate,onClose}) {
  const [f,setF]=useState({title:"",subtitle:"",genre:"Novel",wordGoal:50000,coverType:"gradient",coverGradient:"midnight_blue",coverSolidColor:"#1a1a2e",coverAngle:135,coverTextureOverlay:"none"});
  const [coverTab,setCoverTab]=useState("gradient");
  const preview={...f,id:"prev"};
  const up=u=>setF(x=>({...x,...u}));

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h2 className="modal-title" style={{margin:0}}>New Book</h2>
          <button className="ibtn" onClick={onClose}><X size={16}/></button>
        </div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:22}}><CoverArt book={preview} size="large"/></div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label className="lbl">Title *</label><input className="inp" value={f.title} onChange={e=>up({title:e.target.value})} placeholder="My Amazing Book" autoFocus/></div>
          <div><label className="lbl">Subtitle</label><input className="inp" value={f.subtitle} onChange={e=>up({subtitle:e.target.value})} placeholder="A story of…"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label className="lbl">Genre</label><select className="inp" value={f.genre} onChange={e=>up({genre:e.target.value})}>{GENRES.map(g=><option key={g}>{g}</option>)}</select></div>
            <div><label className="lbl">Word Goal</label><input type="number" className="inp" value={f.wordGoal} onChange={e=>up({wordGoal:Number(e.target.value)})} min={0} step={5000}/></div>
          </div>
          {/* Cover designer */}
          <div>
            <label className="lbl">Cover Design</label>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {[{id:"gradient",l:"Gradient"},{id:"solid",l:"Solid Color"}].map(({id,l})=>(
                <button key={id} onClick={()=>{setCoverTab(id);up({coverType:id});}} className={`tab-pill ${coverTab===id?"on":"off"}`} style={{fontSize:12,padding:"6px 14px"}}>{l}</button>
              ))}
            </div>
            {coverTab==="gradient"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                  {COVER_GRADIENTS.map(g=>(
                    <div key={g.id} onClick={()=>up({coverGradient:g.id,coverType:"gradient"})}
                      style={{height:36,borderRadius:8,background:`linear-gradient(${f.coverAngle}deg,${g.a},${g.b})`,cursor:"pointer",border:`2px solid ${f.coverGradient===g.id?"#fff":"transparent"}`,boxShadow:f.coverGradient===g.id?`0 0 0 2px ${theme.accent}`:"none",transition:"all 0.15s"}} title={g.label}/>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <label className="lbl" style={{margin:0,whiteSpace:"nowrap"}}>Angle</label>
                  <input type="range" min={0} max={360} value={f.coverAngle} onChange={e=>up({coverAngle:Number(e.target.value)})} style={{flex:1,accentColor:theme.accent}}/>
                  <span style={{fontSize:12,color:theme.textFaint,minWidth:36}}>{f.coverAngle}°</span>
                </div>
              </>
            )}
            {coverTab==="solid"&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {COVER_SOLID_COLORS.map(c=>(
                  <div key={c} onClick={()=>up({coverSolidColor:c,coverType:"solid"})}
                    style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:`2px solid ${f.coverSolidColor===c?"#fff":"transparent"}`,boxShadow:f.coverSolidColor===c?`0 0 0 2px ${theme.accent}`:"none",transition:"all 0.15s"}}/>
                ))}
                <div style={{position:"relative"}}>
                  <input type="color" value={f.coverSolidColor} onChange={e=>up({coverSolidColor:e.target.value,coverType:"solid"})} style={{width:32,height:32,borderRadius:8,border:`1px solid ${theme.border}`,cursor:"pointer",padding:0}}/>
                </div>
              </div>
            )}
            <div style={{marginTop:12}}>
              <label className="lbl">Cover Texture</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {COVER_TEXTURES_OVERLAY.map(t=>(
                  <button key={t.id} onClick={()=>up({coverTextureOverlay:t.id})} style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${f.coverTextureOverlay===t.id?theme.accent:theme.border}`,background:f.coverTextureOverlay===t.id?theme.accent+"18":"transparent",cursor:"pointer",fontSize:11,fontFamily:"var(--ui-font)",color:f.coverTextureOverlay===t.id?theme.accent:theme.textMuted,fontWeight:f.coverTextureOverlay===t.id?700:400}}>{t.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>{if(!f.title.trim())return;onCreate(f);onClose();}} disabled={!f.title.trim()}><BookOpen size={14}/>Create Book</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EDIT BOOK MODAL (cover redesign)
// ─────────────────────────────────────────────
function EditBookModal({book,theme,onUpdate,onClose,notify}) {
  const [f,setF]=useState(book?{...book}:{});
  const [tab,setTab]=useState("cover");
  if(!book)return null;
  const up=u=>{setF(x=>({...x,...u}));};
  const save=()=>{ onUpdate(book.id,f); onClose(); notify("Book updated!"); };
  const prev={...f,id:"edit-prev"};

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:580}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <h2 className="modal-title" style={{margin:0}}>Edit Book</h2>
          <button className="ibtn" onClick={onClose}><X size={16}/></button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:18}}>
          {[{id:"cover",l:"Cover"},{id:"info",l:"Info"}].map(({id,l})=>(
            <button key={id} className={`tab-pill ${tab===id?"on":"off"}`} onClick={()=>setTab(id)} style={{fontSize:12,padding:"6px 14px"}}>{l}</button>
          ))}
        </div>

        {tab==="cover"&&(
          <>
            <div style={{display:"flex",justifyContent:"center",marginBottom:18}}><CoverArt book={prev} size="large"/></div>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {[{id:"gradient",l:"Gradient"},{id:"solid",l:"Solid"}].map(({id,l})=>(
                <button key={id} className={`tab-pill ${f.coverType===id?"on":"off"}`} onClick={()=>up({coverType:id})} style={{fontSize:12,padding:"6px 14px"}}>{l}</button>
              ))}
            </div>
            {f.coverType==="gradient"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                  {COVER_GRADIENTS.map(g=>(
                    <div key={g.id} onClick={()=>up({coverGradient:g.id})}
                      style={{height:36,borderRadius:8,background:`linear-gradient(${f.coverAngle||135}deg,${g.a},${g.b})`,cursor:"pointer",border:`2px solid ${f.coverGradient===g.id?"#fff":"transparent"}`,boxShadow:f.coverGradient===g.id?`0 0 0 2px ${theme.accent}`:"none"}} title={g.label}/>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <label className="lbl" style={{margin:0}}>Angle</label>
                  <input type="range" min={0} max={360} value={f.coverAngle||135} onChange={e=>up({coverAngle:Number(e.target.value)})} style={{flex:1,accentColor:theme.accent}}/>
                  <span style={{fontSize:12,color:theme.textFaint}}>{f.coverAngle||135}°</span>
                </div>
              </>
            )}
            {f.coverType==="solid"&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
                {COVER_SOLID_COLORS.map(c=>(
                  <div key={c} onClick={()=>up({coverSolidColor:c})} style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:`2px solid ${f.coverSolidColor===c?"#fff":"transparent"}`,boxShadow:f.coverSolidColor===c?`0 0 0 2px ${theme.accent}`:"none"}}/>
                ))}
                <input type="color" value={f.coverSolidColor||"#1a1a2e"} onChange={e=>up({coverSolidColor:e.target.value})} style={{width:32,height:32,borderRadius:8,border:`1px solid ${theme.border}`,cursor:"pointer",padding:0}}/>
              </div>
            )}
            <div>
              <label className="lbl">Cover Texture</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {COVER_TEXTURES_OVERLAY.map(t=>(
                  <button key={t.id} onClick={()=>up({coverTextureOverlay:t.id})} style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${f.coverTextureOverlay===t.id?theme.accent:theme.border}`,background:f.coverTextureOverlay===t.id?theme.accent+"18":"transparent",cursor:"pointer",fontSize:11,fontFamily:"var(--ui-font)",color:f.coverTextureOverlay===t.id?theme.accent:theme.textMuted,fontWeight:f.coverTextureOverlay===t.id?700:400}}>{t.label}</button>
                ))}
              </div>
            </div>
          </>
        )}
        {tab==="info"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label className="lbl">Title</label><input className="inp" value={f.title||""} onChange={e=>up({title:e.target.value})}/></div>
            <div><label className="lbl">Subtitle</label><input className="inp" value={f.subtitle||""} onChange={e=>up({subtitle:e.target.value})}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label className="lbl">Genre</label><select className="inp" value={f.genre||"Novel"} onChange={e=>up({genre:e.target.value})}>{GENRES.map(g=><option key={g}>{g}</option>)}</select></div>
              <div><label className="lbl">Word Goal</label><input type="number" className="inp" value={f.wordGoal||0} onChange={e=>up({wordGoal:Number(e.target.value)})} step={5000}/></div>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"flex-end"}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}><Check size={14}/>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT MODAL + PDF ENGINE
// ─────────────────────────────────────────────
function ExportModal({book,chapters,theme,settings,onClose,notify}) {
  const [o,setO]=useState({template:"novel",paperSize:"a5",includeTitle:true,includeToc:true,includePageNumbers:true,authorName:settings.authorName||"",fontSize:11,lineHeight:1.65});
  const [loading,setLoading]=useState(false);
  const up=u=>setO(x=>({...x,...u}));
  const tw=chapters.reduce((a,c)=>a+countWords(c.content),0);

  const go=async()=>{
    setLoading(true);
    try{ await exportPDF(book,chapters,o,settings); notify("PDF exported!"); onClose(); }
    catch(e){ notify("Export failed: "+e.message,"err"); }
    setLoading(false);
  };

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h2 className="modal-title" style={{margin:0}}>Export to PDF</h2>
          <button className="ibtn" onClick={onClose}><X size={16}/></button>
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center",padding:"12px 16px",background:theme.surfaceAlt,borderRadius:12,marginBottom:20}}>
          <CoverArt book={book} size="small"/>
          <div><p style={{fontFamily:"var(--ed-font)",fontWeight:700,fontSize:16,color:theme.text}}>{book.title}</p><p style={{fontSize:12,color:theme.textMuted,marginTop:2}}>{chapters.length} chapters · {tw.toLocaleString()} words</p></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label className="lbl">Template</label>
              <select className="inp" value={o.template} onChange={e=>up({template:e.target.value})}>
                {[["novel","Novel / Book"],["poetry","Poetry Collection"],["journal","Journal / Diary"],["essay","Essay / Non-fiction"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select></div>
            <div><label className="lbl">Paper Size</label>
              <select className="inp" value={o.paperSize} onChange={e=>up({paperSize:e.target.value})}>
                {[["a5","A5 — Book"],["a4","A4"],["letter","US Letter"],["trade","6×9 Trade"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select></div>
          </div>
          <div><label className="lbl">Author Name in PDF</label><input className="inp" value={o.authorName} onChange={e=>up({authorName:e.target.value})}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label className="lbl">Font Size — {o.fontSize}pt</label><input type="range" min={9} max={16} value={o.fontSize} onChange={e=>up({fontSize:Number(e.target.value)})} style={{width:"100%",accentColor:theme.accent}}/></div>
            <div><label className="lbl">Line Spacing — {o.lineHeight}×</label><input type="range" min={1.3} max={2.2} step={0.05} value={o.lineHeight} onChange={e=>up({lineHeight:Number(e.target.value)})} style={{width:"100%",accentColor:theme.accent}}/></div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["includeTitle","Cover Page"],["includeToc","Table of Contents"],["includePageNumbers","Page Numbers"]].map(([k,l])=>(
              <button key={k} onClick={()=>up({[k]:!o[k]})} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${o[k]?theme.accent:theme.border}`,background:o[k]?theme.accent+"20":"transparent",cursor:"pointer",fontSize:12,fontFamily:"var(--ui-font)",color:o[k]?theme.accent:theme.textMuted,fontWeight:o[k]?700:400,display:"flex",alignItems:"center",gap:6}}>
                {o[k]?<Check size={11}/>:<Circle size={11}/>}{l}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={go} disabled={loading} style={{minWidth:130}}>
            {loading?<><RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/>Generating…</>:<><Download size={14}/>Export PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}

async function exportPDF(book,chapters,opts,settings) {
  if(!window.jspdf){
    await new Promise((res,rej)=>{ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
  }
  const {jsPDF}=window.jspdf;
  const sizes={a4:[210,297],a5:[148,210],letter:[216,279],trade:[152,229]};
  const [pw,ph]=sizes[opts.paperSize]||[148,210];
  const doc=new jsPDF({orientation:"portrait",unit:"mm",format:[pw,ph]});
  const ml=16,mr=pw-16,mt=18,mb=ph-18,cw=mr-ml;
  const fs=opts.fontSize||11,lh=opts.lineHeight||1.65,ls=fs*lh*0.35;
  let pg=1;

  function addPage(){doc.addPage([pw,ph]);pg++;if(opts.includePageNumbers){doc.setFont("times","normal");doc.setFontSize(8);doc.setTextColor(160,160,160);doc.text(String(pg),pw/2,ph-7,{align:"center"});if(opts.authorName)doc.text(opts.authorName,ml,ph-7);if(book.title)doc.text(book.title,mr,ph-7,{align:"right"});}}

  function parseHTML(html){
    const d=document.createElement("div"); d.innerHTML=html||"";
    const b=[]; d.childNodes.forEach(n=>{
      if(n.nodeType===3){const t=n.textContent.trim();if(t)b.push({type:"p",text:t});}
      else if(n.nodeType===1){const tag=n.tagName.toLowerCase(),text=(n.innerText||n.textContent||"").trim();if(!text)return;
        if(tag==="h1")b.push({type:"h1",text});else if(tag==="h2")b.push({type:"h2",text});else if(tag==="h3")b.push({type:"h3",text});
        else if(tag==="blockquote")b.push({type:"quote",text});else if(tag==="hr")b.push({type:"hr"});
        else b.push({type:"p",text});}
    }); return b;
  }

  // Cover
  if(opts.includeTitle){
    const g=COVER_GRADIENTS.find(x=>x.id===book.coverGradient)||COVER_GRADIENTS[0];
    const hex=book.coverType==="solid"?book.coverSolidColor:g.a;
    const hex2=book.coverType==="solid"?book.coverSolidColor:g.b;
    const toRGB=h=>{const r=parseInt(h.slice(1,3),16),gr=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return[r,gr,b];};
    const [r1,g1,b1]=toRGB(hex); const [r2,g2,b2]=toRGB(hex2);
    for(let i=0;i<ph;i++){const t=i/ph;doc.setFillColor(Math.round(r1+(r2-r1)*t),Math.round(g1+(g2-g1)*t),Math.round(b1+(b2-b1)*t));doc.rect(0,i,pw,1,"F");}
    doc.setFillColor(0,0,0);doc.setGState&&doc.setGState(new doc.GState({opacity:0.22}));doc.rect(0,0,5,ph,"F");
    doc.setTextColor(255,255,255);
    doc.setFont("times","bold");doc.setFontSize(Math.min(28,fs*2.4));
    const tl=doc.splitTextToSize(book.title||"Untitled",cw-8);let ty=ph*0.42;
    tl.forEach(l=>{doc.text(l,pw/2,ty,{align:"center"});ty+=9;});
    if(book.subtitle){doc.setFont("times","italic");doc.setFontSize(fs*1.05);doc.setTextColor(255,255,255);doc.setGState&&doc.setGState(new doc.GState({opacity:0.75}));doc.text(book.subtitle,pw/2,ty+5,{align:"center"});}
    if(opts.authorName){doc.setFont("helvetica","normal");doc.setFontSize(fs*0.85);doc.setTextColor(255,255,255);doc.setGState&&doc.setGState(new doc.GState({opacity:0.7}));doc.text(opts.authorName,pw/2,ph*0.83,{align:"center"});}
    addPage();
  }

  // TOC placeholder
  const tocPage=pg;
  if(opts.includeToc){doc.setFont("times","bold");doc.setFontSize(fs*1.7);doc.setTextColor(40,30,20);doc.text("Contents",pw/2,mt+10,{align:"center"});addPage();}

  // Chapters
  const tocEntries=[];
  chapters.forEach((ch,idx)=>{
    tocEntries.push({title:ch.title,page:pg});
    let y=mt+6;
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(130,110,90);doc.text(`Chapter ${idx+1}`,ml,y);y+=8;
    doc.setFont("times","bold");doc.setFontSize(fs*1.5);doc.setTextColor(25,18,10);
    doc.splitTextToSize(ch.title,cw).forEach(l=>{doc.text(l,ml,y);y+=7;});
    doc.setDrawColor(140,110,80);doc.setLineWidth(0.4);doc.line(ml,y+1,mr,y+1);y+=8;
    parseHTML(ch.content).forEach(blk=>{
      if(blk.type==="hr"){doc.setFont("times","normal");doc.setFontSize(fs*0.8);doc.setTextColor(140,120,100);doc.text("* * *",pw/2,y,{align:"center"});y+=ls*2;return;}
      const isBig=["h1","h2","h3"].includes(blk.type);
      if(isBig){const sz={h1:fs*1.35,h2:fs*1.15,h3:fs*1.0};doc.setFontSize(sz[blk.type]);doc.setFont("times","bold");doc.setTextColor(25,18,10);y+=ls*0.5;}
      else if(blk.type==="quote"){doc.setFontSize(fs*0.93);doc.setFont("times","italic");doc.setTextColor(100,80,60);}
      else{doc.setFontSize(fs);doc.setFont("times","normal");doc.setTextColor(25,20,12);}
      const tx=blk.type==="quote"?ml+5:ml;const tw2=blk.type==="quote"?cw-10:cw;
      doc.splitTextToSize(blk.text,tw2).forEach(l=>{if(y>mb-4){addPage();y=mt;}doc.text(l,tx,y);y+=ls;});
      y+=ls*0.4;
    });
    if(idx<chapters.length-1)addPage();
  });

  // Fill TOC
  if(opts.includeToc&&tocEntries.length>0){
    doc.setPage(opts.includeTitle?2:1);
    let ty=mt+24;
    doc.setFont("times","bold");doc.setFontSize(fs*1.7);doc.setTextColor(40,30,20);doc.text("Contents",pw/2,mt+10,{align:"center"});
    tocEntries.forEach(e=>{
      doc.setFont("times","normal");doc.setFontSize(fs);doc.setTextColor(50,40,30);doc.text(e.title,ml,ty);
      doc.setTextColor(150,130,110);doc.text(String(e.page),mr,ty,{align:"right"});
      ty+=7;
    });
  }
  doc.save(`${(book.title||"folio").toLowerCase().replace(/[^a-z0-9]+/g,"-")}.pdf`);
}