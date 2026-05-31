import React from "react";
import type { Book, CoverElement } from "@/lib/types";
import { buildCoverGradient } from "@/lib/utils";

export type CoverSize = "tiny" | "small" | "card" | "large" | "editor";

interface Props {
  book: Book;
  size?: CoverSize;
  page?: "front" | "spine" | "back";
}

const DIMS: Record<CoverSize, { w: number; h: number }> = {
  tiny:   { w: 32,  h: 46  },
  small:  { w: 44,  h: 62  },
  card:   { w: 120, h: 168 },
  large:  { w: 160, h: 224 },
  editor: { w: 220, h: 308 },
};

// Designer base dimensions (match CoverEditorModal PAGE_W/PAGE_H)
const COVER_DESIGNER_W = 300;
const COVER_DESIGNER_H = 450;
const SPINE_W = 44;

// Distinct CSS pattern per texture
const TEXTURE_PATTERN: Record<string, string> = {
  linen_cover: [
    "repeating-linear-gradient(0deg,rgba(255,255,255,0.07) 0,rgba(255,255,255,0.07) 1px,transparent 1px,transparent 4px)",
    "repeating-linear-gradient(90deg,rgba(255,255,255,0.07) 0,rgba(255,255,255,0.07) 1px,transparent 1px,transparent 4px)",
  ].join(","),
  leather: [
    "repeating-linear-gradient(33deg,rgba(0,0,0,0.11) 0,rgba(0,0,0,0.11) 1px,transparent 1px,transparent 8px)",
    "repeating-linear-gradient(-33deg,rgba(0,0,0,0.11) 0,rgba(0,0,0,0.11) 1px,transparent 1px,transparent 8px)",
  ].join(","),
  canvas: [
    "repeating-linear-gradient(0deg,rgba(255,255,255,0.1) 0,rgba(255,255,255,0.1) 2px,transparent 2px,transparent 8px)",
    "repeating-linear-gradient(90deg,rgba(255,255,255,0.1) 0,rgba(255,255,255,0.1) 2px,transparent 2px,transparent 8px)",
  ].join(","),
  marble: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.025 0.04' numOctaves='4' seed='5'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E")`,
  paper_cover: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
  grain: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23g)' opacity='0.18'/%3E%3C/svg%3E")`,
  weave: [
    "repeating-linear-gradient(45deg,rgba(255,255,255,0.06) 0,rgba(255,255,255,0.06) 2px,transparent 2px,transparent 10px)",
    "repeating-linear-gradient(-45deg,rgba(255,255,255,0.06) 0,rgba(255,255,255,0.06) 2px,transparent 2px,transparent 10px)",
  ].join(","),
  diamond: [
    "repeating-linear-gradient(60deg,rgba(255,255,255,0.07) 0,rgba(255,255,255,0.07) 1px,transparent 1px,transparent 12px)",
    "repeating-linear-gradient(-60deg,rgba(255,255,255,0.07) 0,rgba(255,255,255,0.07) 1px,transparent 1px,transparent 12px)",
    "repeating-linear-gradient(0deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 12px)",
  ].join(","),
};

export default function CoverArt({ book, size = "card", page = "front" }: Props) {
  let { w, h } = DIMS[size];
  const isTiny  = size === "tiny";
  
  if (page === "spine") {
     w = Math.max(12, Math.round(w * (SPINE_W / COVER_DESIGNER_W)));
  }

  const bg      = buildCoverGradient(book);

  // ── If book has a canvas coverDesign, render from that ──
  if (book.coverDesign) {
    // If specific page key doesn't exist in design, should we fall back?
    // User wants back/spine to NOT be the front title when missing.
    const designPage = book.coverDesign[page];
    if (designPage) {
      return <CoverArtFromDesign book={book} w={w} h={h} size={size} page={page}/>;
    }
  }
  
  // Standard Mode: hide title/author if it's not the front.
  const isFront = page === "front";
  const pad     = Math.max(6, w * 0.05);
  /** Extra inset on the spine side so left/right-aligned type clears the faux spine */
  const spineClear = isTiny ? 0 : Math.min(16, Math.max(8, Math.round(w * 0.07)));

  /* ── Resolve all settings with sensible defaults ── */
  const titleText    = isFront || page === "spine" ? (book.title || "Untitled").substring(0, 48) : "";
  const authorText   = isFront ? (book.authorOverride || "").substring(0, 24) : "";

  const textColor    = book.coverTextColor       ?? "rgba(255,255,255,0.92)";
  const titleFont    = book.coverTitleFont        ?? "Georgia,'Times New Roman',serif";
  const titleBold    = book.coverTitleBold        ?? true;
  const titleItalic  = book.coverTitleItalic      ?? false;
  const titleUpper   = book.coverTitleUppercase   ?? false;
  const titleAlign   = book.coverTitleAlign       ?? "center";
  const titleY       = book.coverTitleY           ?? 72;
  const titleSizeMul = book.coverTitleSize        ?? 1;
  const titleLS      = (book.coverTitleLetterSpacing ?? 0) / 100;
  const titleShadow  = book.coverTitleShadow      ?? true;

  const subtitleVisible = book.coverSubtitleVisible ?? false;
  const subtitleText    = (book.coverSubtitleText || "").substring(0, 40);
  const subtitleFont    = book.coverSubtitleFont   ?? titleFont;
  const subtitleColor   = book.coverSubtitleColor  ?? textColor.replace(/[\d.]+\)$/, "0.65)");
  const subtitleSizeMul = book.coverSubtitleSize   ?? 0.65;

  const authorVisible = book.coverAuthorVisible ?? (!!authorText);
  const authorColor   = book.coverAuthorColor   ?? textColor.replace(/[\d.]+\)$/, "0.65)");
  const authorAlign   = book.coverAuthorAlign   ?? titleAlign;
  const authorSizeMul = book.coverAuthorSize    ?? 0.65;

  const symmetricPad = { left: pad, right: pad };
  function coverTextInsets(align: "left" | "center" | "right"): { left: number; right: number } {
    if (align === "center") return symmetricPad;
    if (align === "left") return { left: pad + spineClear, right: pad };
    return { left: pad, right: pad + spineClear };
  }
  const titleAuthorInsets = coverTextInsets(titleAlign);
  const authorInsets = coverTextInsets(authorAlign);

  const seriesText   = (book.coverSeriesText || "").substring(0, 30);
  const showBorder   = book.coverShowBorder   ?? false;
  const showDivider  = book.coverDivider      ?? false;
  const vignette     = book.coverVignette     ?? false;
  const vigStrength  = (book.coverVignetteStrength ?? 60) / 100;
  const overlayColor = book.coverOverlayColor   ?? "rgba(0,0,0,0)";
  const overlayOpacity = (book.coverOverlayOpacity ?? 0) / 100;

  const texturePat = (() => {
    const id = book.coverTextureOverlay;
    if (!id || id === "none") return null;
    return TEXTURE_PATTERN[id] ?? null;
  })();

  /* ── Font sizes scaled to cover width ── */
  const baseSize   = isTiny ? 5.5 : Math.max(7, Math.min(13, w / 11));
  const titlePx    = Math.round(baseSize * titleSizeMul);
  const subPx      = Math.round(baseSize * subtitleSizeMul);
  const authorPx   = Math.round(baseSize * authorSizeMul);
  const seriesPx   = Math.max(isTiny ? 4 : 5, Math.round(baseSize * 0.55));

  const shadow = titleShadow ? "0 1px 6px rgba(0,0,0,0.6)" : "none";

  /* ── Clamp Y so text never bleeds outside cover ── */
  let clampedY = Math.max(8, Math.min(88, titleY));
  if (isTiny || size === "small") clampedY = Math.min(clampedY, 55); 
  const authorBottom = Math.max(isTiny ? 4 : 10, pad);

  return (
    <div style={{
      width: w, height: h,
      borderRadius: isTiny ? 2 : 5,
      background: bg,
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: "-3px 3px 12px rgba(0,0,0,0.4), inset -4px 0 8px rgba(0,0,0,0.2)",
    }}>

      {/* ── Photo layer ── */}
      {book.coverImage && book.coverType === "image" && (
        <img
          src={book.coverImage} alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      {/* ── Color overlay / tint ── */}
      {overlayOpacity > 0 && (
        <div style={{
          position: "absolute", inset: 0,
          background: overlayColor,
          opacity: overlayOpacity,
          pointerEvents: "none",
          mixBlendMode: "multiply",
        }}/>
      )}

      {/* ── Texture pattern ── */}
      {texturePat && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: texturePat,
          backgroundSize: ["marble","paper_cover","grain"].includes(book.coverTextureOverlay) ? "200px 200px" : undefined,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}/>
      )}

      {/* ── Vignette ── */}
      {vignette && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${vigStrength * 0.88}) 100%)`,
          pointerEvents: "none",
        }}/>
      )}

      {/* ── Spine shadow (only for front/back to simulate a hinge) ── */}
      {page !== "spine" && (
        <div style={{
          position: "absolute", left: 0, top: 0,
          width: isTiny ? 3 : 6, height: "100%",
          background: "rgba(0,0,0,0.28)",
        }}/>
      )}
      {/* ── Realistic Spine Curvature ── */}
      {page === "spine" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none", zIndex: 1
        }}/>
      )}

      {/* ── Inner decorative borders ── */}
      {!isTiny && showBorder && page !== "spine" && (() => {
        const borderScale = size === 'small' ? 0.3 : size === 'card' ? 0.5 : 1;
        const insetA = Math.max(2, Math.round(w * 0.04));
        const insetB = Math.max(4, Math.round(w * 0.06));
        return (
          <>
            <div style={{ position:"absolute", inset: insetA, border:`${Math.max(1, 1 * borderScale)}px solid rgba(255,255,255,0.2)`, borderRadius:2, pointerEvents:"none" }}/>
            <div style={{ position:"absolute", inset: insetB, border:`${Math.max(0.5, 0.5 * borderScale)}px solid rgba(255,255,255,0.1)`, borderRadius:1, pointerEvents:"none" }}/>
          </>
        );
      })()}

      {/* ── Gloss highlight ── */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: w * 0.65, height: h * 0.45,
        background: "radial-gradient(ellipse at 80% 15%, rgba(255,255,255,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* ── Series / collection name (top) ── */}
      {!isTiny && seriesText && (
        <div style={{
          position: "absolute",
          top: pad * 0.8,
          left: titleAuthorInsets.left,
          right: titleAuthorInsets.right,
          textAlign: titleAlign,
        }}>
          <p style={{
            fontFamily: titleFont,
            fontSize: seriesPx,
            color: textColor.replace(/[\d.]+\)$/, "0.5)"),
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textShadow: shadow,
          }}>{seriesText}</p>
        </div>
      )}

      {/* ── Title block (floats at Y%) ── */}
      {!isTiny && titleText && (
        page === "spine" ? (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            pointerEvents: "none",
          }}>
            <div style={{
              transform: "rotate(-90deg)",
              width: `${h * 0.9}px`,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column"
            }}>
              <p style={{
                fontFamily: titleFont,
                fontSize: Math.min(titlePx, Math.max(8, w * 0.65)),
                fontWeight: titleBold ? 700 : 400,
                fontStyle: titleItalic ? "italic" : "normal",
                color: textColor,
                letterSpacing: `${titleLS}em`,
                lineHeight: 1.1,
                textTransform: titleUpper ? "uppercase" : "none",
                textShadow: titleShadow ? "0 0 4px rgba(0,0,0,0.6)" : "none",
                margin: 0,
                whiteSpace: "nowrap",
              }}>{titleText}</p>
            </div>
          </div>
        ) : (
          <div style={{
            position: "absolute",
            left: titleAuthorInsets.left,
            right: titleAuthorInsets.right,
            top: `${clampedY}%`,
            transform: "translateY(-50%)",
            textAlign: titleAlign,
            zIndex: 2,
            boxSizing: "border-box",
          }}>
            {/* Top divider (shows when title is in center/bottom position) */}
            {showDivider && clampedY > 20 && (
              <div style={{
                height: "0.5px",
                background: textColor.replace(/[\d.]+\)$/, "0.35)"),
                marginBottom: 6,
              }}/>
            )}

            <p style={{
              fontFamily: titleFont,
              fontSize: titlePx,
              fontWeight: titleBold ? 700 : 400,
              fontStyle: titleItalic ? "italic" : "normal",
              color: textColor,
              letterSpacing: `${titleLS}em`,
              lineHeight: 1.15,
              textTransform: titleUpper ? "uppercase" : "none",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              textShadow: shadow,
              margin: 0,
              maxWidth: "100%",
              display: (isTiny || size === "small") ? "-webkit-box" : "block",
              WebkitLineClamp: isTiny ? 2 : size === "small" ? 3 : "none",
              WebkitBoxOrient: "vertical",
              overflow: (isTiny || size === "small") ? "hidden" : "visible",
            }}>{titleText}</p>

            {/* Subtitle */}
            {subtitleVisible && subtitleText && (
              <p style={{
                fontFamily: subtitleFont,
                fontSize: subPx,
                color: subtitleColor,
                marginTop: 4,
                fontStyle: "italic",
                lineHeight: 1.3,
                textShadow: titleShadow ? "0 1px 4px rgba(0,0,0,0.5)" : "none",
              }}>{subtitleText}</p>
            )}

            {/* Bottom divider */}
            {showDivider && clampedY <= 20 && (
              <div style={{
                height: "0.5px",
                background: textColor.replace(/[\d.]+\)$/, "0.35)"),
                marginTop: 6,
              }}/>
            )}
          </div>
        )
      )}

      {/* ── Author block (anchored near bottom) ── */}
      {!isTiny && authorVisible && authorText && (
        <div style={{
          position: "absolute",
          bottom: authorBottom,
          left: authorInsets.left,
          right: authorInsets.right,
          textAlign: authorAlign,
          zIndex: 2,
        }}>
          <p style={{
            fontFamily: titleFont,
            fontSize: authorPx,
            color: authorColor,
            fontStyle: "italic",
            letterSpacing: "0.03em",
            textShadow: titleShadow ? "0 1px 3px rgba(0,0,0,0.5)" : "none",
          }}>{authorText}</p>
        </div>
      )}
    </div>
  );
}

// ── CoverArt rendered from a full CoverDesign ────────────────────────────
// Renders at Designer base size (300×450 or 44×450 for spine) then CSS-scales to fit,
// so line breaks and layout match the Cover Designer exactly.
function CoverArtFromDesign({ book, w, h, size, page: pageKey = "front" }: { book: Book; w: number; h: number; size: CoverSize; page?: "front"|"spine"|"back" }) {
  const design = book.coverDesign!;
  const page   = design[pageKey] ?? design.front;
  const bg     = page.background;

  const innerW = pageKey === "spine" ? SPINE_W : COVER_DESIGNER_W;
  const innerH = COVER_DESIGNER_H;
  const scale  = 1; // Always render at Designer scale so layout (including line breaks) matches exactly
  const scaleFactor = Math.min(w / innerW, h / innerH);

  const bgStyle: React.CSSProperties = (() => {
    if (bg.type === "image" && bg.image) return { backgroundImage: `url(${bg.image})`, backgroundSize: "cover", backgroundPosition: "center" };
    if (bg.type === "solid")             return { backgroundColor: bg.solid || "#1a1a2e" };
    return { background: `linear-gradient(${bg.gradientAngle ?? 135}deg, ${bg.gradientA ?? "#0f2044"}, ${bg.gradientB ?? "#1a4480"})` };
  })();

  const sorted = [...page.elements]
    .filter(el => el.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  const renderEl = (el: CoverElement) => {
    const left   = `${el.x}%`;
    const top    = `${el.y}%`;
    const ew     = `${el.w}%`;
    const eh     = `${el.h}%`;
    const fs     = (el.fontSize ?? 20) * scale;
    const shadow = el.textShadow ? "0 1px 4px rgba(0,0,0,0.7)" : "none";

    const base: React.CSSProperties = {
      position: "absolute", left, top, width: ew, height: eh,
      transform: `rotate(${el.rotation || 0}deg)`,
      opacity: el.opacity ?? 1,
      zIndex: el.zIndex,
      display: "flex", alignItems: "center",
      justifyContent: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
      overflow: "hidden",
    };

    if (el.type === "text") return (
      <div key={el.id} style={{ ...base,
        overflow:      "visible",
        fontFamily:    el.fontFamily  || "Georgia, serif",
        fontSize:      fs,
        fontWeight:    el.fontWeight  || "700",
        fontStyle:     el.fontStyle   || "normal",
        textAlign:     el.textAlign   || "center",
        color:         el.color       || "rgba(255,255,255,0.92)",
        letterSpacing: `${el.letterSpacing ?? 0}em`,
        lineHeight:    el.lineHeight  ?? 1.3,
        textTransform: el.textTransform || "none",
        textShadow:    shadow,
        wordBreak:     "break-word", whiteSpace: "pre-wrap",
        padding:       "2px 4px", boxSizing: "border-box",
      }}>{el.text || ""}</div>
    );

    if (el.type === "image" && el.src) return (
      <div key={el.id} style={base}><img src={el.src} style={{ width:"100%", height:"100%", objectFit: el.objectFit || "cover" }} alt=""/></div>
    );

    if (el.type === "shape") return (
      <div key={el.id} style={{ ...base, display:"block",
        background: el.fill    || "rgba(255,255,255,0.15)",
        border: el.stroke ? `${(el.strokeWidth??1)*scale}px solid ${el.stroke}` : "none",
        borderRadius: el.shapeType === "circle" ? "50%" : el.borderRadius ?? 0,
      }}/>
    );

    if (el.type === "divider") return (
      <div key={el.id} style={{ ...base, display:"block",
        height: Math.max(1, (el.strokeWidth ?? 1) * scale),
        background: el.color || "rgba(255,255,255,0.4)",
        top: `calc(${el.y}% + ${el.h / 2}%)`,
      }}/>
    );

    if (el.type === "ornament") return (
      <div key={el.id} style={{ ...base,
        overflow:   "visible",
        fontFamily: el.fontFamily || "Georgia, serif",
        fontSize:   (el.ornamentScale ?? 1) * fs * 1.5,
        color:      el.color || "rgba(255,255,255,0.75)",
        textShadow: shadow,
      }}>{el.ornamentChar || "❧"}</div>
    );

    return null;
  };

  const innerContent = (
    <>
      {bg.overlayOpacity && bg.overlayOpacity > 0 && (
        <div style={{ position:"absolute", inset:0, background: bg.overlayColor || "#000", opacity: bg.overlayOpacity/100, pointerEvents:"none" }}/>
      )}
      {bg.texture && bg.texture !== "none" && TEXTURE_PATTERN[bg.texture] && (
        <div style={{ position:"absolute", inset:0, backgroundImage: TEXTURE_PATTERN[bg.texture], mixBlendMode:"overlay", pointerEvents:"none" }}/>
      )}
      {bg.vignette && (
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          background: `radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,${((bg.vignetteStrength ?? 60)/100)*0.85}) 100%)` }}/>
      )}
      {sorted.map(renderEl)}
    </>
  );

  const scaledW = innerW * scaleFactor;
  const scaledH = innerH * scaleFactor;

  return (
    <div style={{
      position: "relative",
      width: w,
      height: h,
      overflow: "hidden",
      flexShrink: 0,
      borderRadius: size === "card" || size === "large" || size === "editor" ? 3 : 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ width: scaledW, height: scaledH, flexShrink: 0, overflow: "hidden" }}>
        <div
          style={{
            width: innerW,
            height: innerH,
            position: "relative",
            overflow: "hidden",
            transform: `scale(${scaleFactor})`,
            transformOrigin: "top left",
            ...bgStyle,
          }}
        >
          {innerContent}
        </div>
      </div>
    </div>
  );
}
