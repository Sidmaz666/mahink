import type { Book, Chapter, CoverElement, CoverPage, PageBackground } from "./types";
import { COVER_GRADIENTS } from "./constants";
import { buildKdpCoverSpec } from "./kdp";
import JSZip from "jszip";

// ── Canvas dimensions (high-res, 3× card scale) ──
const BASE_W  = 900;   // front / back
const BASE_H  = 1350;
const SPINE_W = 132;   // spine

function angleGradient(
  ctx: CanvasRenderingContext2D,
  angle: number, w: number, h: number,
  a: string, b: string,
): CanvasGradient {
  const rad  = ((angle - 90) * Math.PI) / 180;
  const len  = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
  const cx = w / 2, cy = h / 2;
  const grd = ctx.createLinearGradient(
    cx - Math.sin(rad) * len / 2, cy - Math.cos(rad) * len / 2,
    cx + Math.sin(rad) * len / 2, cy + Math.cos(rad) * len / 2,
  );
  grd.addColorStop(0, a);
  grd.addColorStop(1, b);
  return grd;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function drawBackground(ctx: CanvasRenderingContext2D, bg: PageBackground, w: number, h: number) {
  if (bg.type === "solid") {
    ctx.fillStyle = bg.solid || "#1a1a2e";
    ctx.fillRect(0, 0, w, h);
  } else if (bg.type === "gradient") {
    ctx.fillStyle = angleGradient(ctx, bg.gradientAngle ?? 135, w, h, bg.gradientA ?? "#0f2044", bg.gradientB ?? "#1a4480");
    ctx.fillRect(0, 0, w, h);
  } else if (bg.type === "image" && bg.image) {
    try {
      const img = await loadImage(bg.image);
      // cover-fit
      const sr = img.width  / img.height;
      const dr = w / h;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (sr > dr) { sw = img.height * dr; sx = (img.width - sw) / 2; }
      else         { sh = img.width  / dr; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    } catch { ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0,0,w,h); }
  }

  // Overlay tint
  if (bg.overlayOpacity && bg.overlayOpacity > 0 && bg.overlayColor) {
    ctx.save();
    ctx.globalAlpha = bg.overlayOpacity / 100;
    ctx.fillStyle   = bg.overlayColor;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Vignette
  if (bg.vignette) {
    const strength = ((bg.vignetteStrength ?? 60) / 100) * 0.85;
    const grad = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.25, w/2, h/2, Math.max(w,h)*0.75);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

async function drawElement(ctx: CanvasRenderingContext2D, el: CoverElement, w: number, h: number, scale: number) {
  if (el.visible === false) return;
  const ex = (el.x / 100) * w;
  const ey = (el.y / 100) * h;
  const ew = (el.w / 100) * w;
  const eh = (el.h / 100) * h;
  const cx = ex + ew / 2;
  const cy = ey + eh / 2;
  const fs = (el.fontSize ?? 20) * scale;

  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.translate(cx, cy);
  if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

  if (el.type === "text") {
    const weight = el.fontWeight || "700";
    const style  = el.fontStyle  || "normal";
    ctx.font = `${style} ${weight} ${fs}px ${el.fontFamily || "Georgia, serif"}`;
    ctx.fillStyle   = el.color || "rgba(255,255,255,0.92)";
    ctx.textAlign   = (el.textAlign as CanvasTextAlign) || "center";
    ctx.textBaseline = "middle";
    if (el.textShadow) {
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur  = 8 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * scale;
    }
    // Letter spacing
    const ls = (el.letterSpacing ?? 0) * fs;
    const lh = (el.lineHeight ?? 1.3) * fs;
    const lines = (el.text || "").split("\n");
    lines.forEach((line, i) => {
      const rawText = el.textTransform === "uppercase" ? line.toUpperCase()
                    : el.textTransform === "lowercase" ? line.toLowerCase()
                    : el.textTransform === "capitalize" ? line.replace(/\b\w/g, c => c.toUpperCase())
                    : line;
      const y = (i - lines.length / 2 + 0.5) * lh;
      if (ls !== 0) {
        const chars = rawText.split("");
        const tw = chars.reduce((s, c) => s + ctx.measureText(c).width + ls, 0) - ls;
        let startX = ctx.textAlign === "center" ? -tw/2 : ctx.textAlign === "right" ? -tw : 0;
        ctx.textAlign = "left";
        chars.forEach((c) => {
          ctx.fillText(c, startX, y);
          startX += ctx.measureText(c).width + ls;
        });
      } else {
        ctx.fillText(rawText, 0, y);
      }
    });
    ctx.shadowColor = "transparent";
  }

  if (el.type === "shape") {
    const rx = -ew / 2, ry = -eh / 2;
    const br = (el.borderRadius ?? 0) * scale;
    ctx.beginPath();
    if (el.shapeType === "circle") {
      ctx.ellipse(0, 0, ew/2, eh/2, 0, 0, Math.PI*2);
    } else {
      ctx.roundRect(rx, ry, ew, eh, br);
    }
    if (el.fill) { ctx.fillStyle = el.fill; ctx.fill(); }
    if (el.stroke) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth   = (el.strokeWidth ?? 1) * scale;
      ctx.stroke();
    }
  }

  if (el.type === "divider") {
    ctx.beginPath();
    ctx.moveTo(-ew/2, 0); ctx.lineTo(ew/2, 0);
    ctx.strokeStyle = el.color || "rgba(255,255,255,0.4)";
    ctx.lineWidth   = (el.strokeWidth ?? 1) * scale;
    ctx.stroke();
  }

  if (el.type === "ornament") {
    ctx.font = `${(el.ornamentScale ?? 1) * fs * 1.5}px ${el.fontFamily || "Georgia, serif"}`;
    ctx.fillStyle   = el.color || "rgba(255,255,255,0.75)";
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(el.ornamentChar || "❧", 0, 0);
  }

  if (el.type === "image" && el.src) {
    try {
      const img = await loadImage(el.src);
      const rx = -ew/2, ry = -eh/2;
      ctx.save();
      ctx.rect(rx, ry, ew, eh);
      ctx.clip();
      if ((el.objectFit ?? "cover") === "cover") {
        const sr = img.width  / img.height;
        const dr = ew / eh;
        let sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (sr > dr) { sw = img.height * dr; sx = (img.width - sw)/2; }
        else         { sh = img.width  / dr; sy = (img.height - sh)/2; }
        ctx.drawImage(img, sx, sy, sw, sh, rx, ry, ew, eh);
      } else {
        ctx.drawImage(img, rx, ry, ew, eh);
      }
      ctx.restore();
    } catch { /* skip */ }
  }

  ctx.restore();
}

async function renderPageToCanvas(page: CoverPage, canvasW: number, canvasH: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width  = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;
  const scale = canvasH / 450;   // use height as reference to match ElementNode

  await drawBackground(ctx, page.background, canvasW, canvasH);

  const sorted = [...page.elements]
    .filter(e => e.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sorted) {
    await drawElement(ctx, el, canvasW, canvasH, scale);
  }

  return canvas;
}

/**
 * Creates a "simple" front cover design structure from basic book properties.
 * Used when the user hasn't opened the Cover Designer yet.
 */
function buildSimpleFrontCoverPage(book: Book): CoverPage {
  const bg: PageBackground = book.coverType === "image" 
    ? { type: "image", image: book.coverImage }
    : book.coverType === "solid"
    ? { type: "solid", solid: book.coverSolidColor }
    : {
        type: "gradient",
        gradientA: (COVER_GRADIENTS.find(g => g.id === book.coverGradient) ?? COVER_GRADIENTS[0]).a,
        gradientB: (COVER_GRADIENTS.find(g => g.id === book.coverGradient) ?? COVER_GRADIENTS[0]).b,
        gradientAngle: book.coverAngle ?? 135,
      };

  return {
    background: bg,
    elements: [
      {
        id: "simple-title",
        type: "text",
        name: "Title",
        x: 50, y: 42, w: 80, h: 20,
        text: book.title || "Untitled",
        fontFamily: "Georgia, serif",
        fontSize: 32,
        fontWeight: "700",
        color: "rgba(255,255,255,0.95)",
        textAlign: "center",
        zIndex: 1,
        visible: true,
        opacity: 1,
        rotation: 0,
        locked: true,
      }
    ]
  };
}

function inToPx(value: number, dpi = 300): number {
  return Math.round(value * dpi);
}

async function loadJsPDF(): Promise<void> {
  if (window.jspdf) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.head.appendChild(script);
  });
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png");
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
}

export async function exportCoverPage(book: Book, pageKey: "front" | "spine" | "back") {
  let page: CoverPage | undefined;

  if (book.coverDesign) {
    page = book.coverDesign[pageKey];
  } else if (pageKey === "front") {
    // Fallback: build a simple cover from basic metadata
    page = buildSimpleFrontCoverPage(book);
  }

  if (!page) {
    alert("This part of the cover requires a design. Open the Cover Designer first.");
    return;
  }

  const w = pageKey === "spine" ? SPINE_W : BASE_W;
  const h = BASE_H;
  const canvas = await renderPageToCanvas(page, w, h);
  downloadCanvas(canvas, `${book.title || "cover"}-${pageKey}.png`);
}

/** Returns front cover as data URL for audiobook/video export. Uses coverDesign front or coverImage. */
export async function getCoverFrontDataUrl(book: Book): Promise<string | null> {
  if (book.coverDesign?.front) {
    const canvas = await renderPageToCanvas(book.coverDesign.front, BASE_W, BASE_H);
    return canvas.toDataURL("image/png");
  }
  if (book.coverImage) return book.coverImage;
  
  // Final fallback: render the simple gradient/solid cover
  const simplePage = buildSimpleFrontCoverPage(book);
  const canvas = await renderPageToCanvas(simplePage, BASE_W, BASE_H);
  return canvas.toDataURL("image/png");
}

export async function exportCoverSpread(book: Book, chapters?: Chapter[], mode: "preview" | "kdp" = "preview") {
  if (!book.coverDesign) {
    alert("No cover design found. Open the Cover Designer first.");
    return;
  }
  const { front, spine, back } = book.coverDesign;
  const kdpSpec = chapters?.length ? buildKdpCoverSpec(book, chapters) : null;
  const coverWidth = mode === "kdp" && kdpSpec ? inToPx(kdpSpec.trimWidthIn + kdpSpec.bleedIn) : BASE_W;
  const coverHeight = mode === "kdp" && kdpSpec ? inToPx(kdpSpec.fullHeightIn) : BASE_H;
  const spineWidth = mode === "kdp" && kdpSpec ? Math.max(40, inToPx(kdpSpec.spineWidthIn)) : SPINE_W;
  const totalW = coverWidth + spineWidth + coverWidth;
  const spread  = document.createElement("canvas");
  spread.width  = totalW;
  spread.height = coverHeight;
  const ctx = spread.getContext("2d")!;

  // Back (left)
  const backC  = await renderPageToCanvas(back, coverWidth, coverHeight);
  ctx.drawImage(backC, 0, 0);

  // Spine (center)
  const spineC = await renderPageToCanvas(spine, spineWidth, coverHeight);
  ctx.drawImage(spineC, coverWidth, 0);

  // Front (right)
  const frontC = await renderPageToCanvas(front, coverWidth, coverHeight);
  ctx.drawImage(frontC, coverWidth + spineWidth, 0);

  // Fold lines
  ctx.strokeStyle = "rgba(200,200,200,0.5)";
  ctx.lineWidth   = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.moveTo(coverWidth, 0); ctx.lineTo(coverWidth, coverHeight); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(coverWidth + spineWidth, 0); ctx.lineTo(coverWidth + spineWidth, coverHeight); ctx.stroke();

  downloadCanvas(spread, `${book.title || "cover"}-spread.png`);
}

export async function exportKdpCoverPdf(book: Book, chapters: Chapter[]) {
  if (!book.coverDesign) {
    alert("No cover design found. Open the Cover Designer first.");
    return;
  }

  const spec = buildKdpCoverSpec(book, chapters);
  const { front, spine, back } = book.coverDesign;
  const backWidth = inToPx(spec.trimWidthIn + spec.bleedIn);
  const spineWidth = Math.max(40, inToPx(spec.spineWidthIn));
  const fullHeight = inToPx(spec.fullHeightIn);
  const totalWidth = backWidth * 2 + spineWidth;

  const spread = document.createElement("canvas");
  spread.width = totalWidth;
  spread.height = fullHeight;
  const ctx = spread.getContext("2d")!;

  const backCanvas = await renderPageToCanvas(back, backWidth, fullHeight);
  const spineCanvas = await renderPageToCanvas(spine, spineWidth, fullHeight);
  const frontCanvas = await renderPageToCanvas(front, backWidth, fullHeight);
  ctx.drawImage(backCanvas, 0, 0);
  ctx.drawImage(spineCanvas, backWidth, 0);
  ctx.drawImage(frontCanvas, backWidth + spineWidth, 0);

  await loadJsPDF();
  const pdf = new window.jspdf!.jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [spec.fullWidthIn, spec.fullHeightIn],
  });
  pdf.addImage(spread.toDataURL("image/png"), "PNG", 0, 0, spec.fullWidthIn, spec.fullHeightIn);
  pdf.save(`${(book.title || "cover").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-kdp-cover.pdf`);
}

export async function exportCoverZip(book: Book) {
  const zip = new JSZip();

  const getBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise(res => canvas.toBlob(b => res(b!), "image/png"));

  const fP = book.coverDesign?.front || buildSimpleFrontCoverPage(book);
  const fC = await renderPageToCanvas(fP, BASE_W, BASE_H);
  zip.file(`${book.title || "cover"}-front.png`, await getBlob(fC));

  const bP = book.coverDesign?.back || buildSimpleFrontCoverPage(book);
  const bC = await renderPageToCanvas(bP, BASE_W, BASE_H);
  zip.file(`${book.title || "cover"}-back.png`, await getBlob(bC));

  const sP = book.coverDesign?.spine || buildSimpleFrontCoverPage(book);
  const sC = await renderPageToCanvas(sP, SPINE_W, BASE_H);
  zip.file(`${book.title || "cover"}-spine.png`, await getBlob(sC));

  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(book.title || "cover").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-covers.zip`;
  a.click();
}
