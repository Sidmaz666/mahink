"use client";
import React, { useRef } from "react";
import type { CoverPage, CoverElement } from "@/lib/types";
import ElementNode from "./ElementNode";

// Distinct texture CSS patterns (shared with CoverArt)
const TEXTURE_PAT: Record<string, string> = {
  linen_cover: "repeating-linear-gradient(0deg,rgba(255,255,255,0.08) 0,rgba(255,255,255,0.08) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(90deg,rgba(255,255,255,0.08) 0,rgba(255,255,255,0.08) 1px,transparent 1px,transparent 4px)",
  leather:     "repeating-linear-gradient(33deg,rgba(0,0,0,0.1) 0,rgba(0,0,0,0.1) 1px,transparent 1px,transparent 8px),repeating-linear-gradient(-33deg,rgba(0,0,0,0.1) 0,rgba(0,0,0,0.1) 1px,transparent 1px,transparent 8px)",
  canvas:      "repeating-linear-gradient(0deg,rgba(255,255,255,0.1) 0,rgba(255,255,255,0.1) 2px,transparent 2px,transparent 8px),repeating-linear-gradient(90deg,rgba(255,255,255,0.1) 0,rgba(255,255,255,0.1) 2px,transparent 2px,transparent 8px)",
  marble:      `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.025 0.04' numOctaves='4' seed='5'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E")`,
  paper_cover: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
  grain:       `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23g)' opacity='0.18'/%3E%3C/svg%3E")`,
  weave:       "repeating-linear-gradient(45deg,rgba(255,255,255,0.06) 0,rgba(255,255,255,0.06) 2px,transparent 2px,transparent 10px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.06) 0,rgba(255,255,255,0.06) 2px,transparent 2px,transparent 10px)",
  diamond:     "repeating-linear-gradient(60deg,rgba(255,255,255,0.07) 0,rgba(255,255,255,0.07) 1px,transparent 1px,transparent 12px),repeating-linear-gradient(-60deg,rgba(255,255,255,0.07) 0,rgba(255,255,255,0.07) 1px,transparent 1px,transparent 12px)",
};

interface Props {
  page:      CoverPage;
  pw:        number;   // pixel width of this page at current zoom
  ph:        number;   // pixel height
  selectedId:  string | null;
  editingId:   string | null;
  onSelect:    (id: string | null) => void;
  onUpdateLive:    (id: string, u: Partial<CoverElement>) => void;
  onCommit:    (id: string, u: Partial<CoverElement>) => void;
  onEditingChange: (id: string | null) => void;
  snapGuides?: { x: boolean; y: boolean };
  onSnapGuides?: (g: { x: boolean; y: boolean }) => void;
}

export default function CanvasPage({
  page, pw, ph,
  selectedId, editingId,
  onSelect, onUpdateLive, onCommit, onEditingChange,
  onSnapGuides,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const bg  = page.background;

  // Compute background CSS
  const bgStyle: React.CSSProperties = (() => {
    if (bg.type === "image" && bg.image) {
      return { backgroundImage: `url(${bg.image})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    if (bg.type === "solid") {
      return { backgroundColor: bg.solid || "#1a1a2e" };
    }
    // gradient
    return { background: `linear-gradient(${bg.gradientAngle ?? 135}deg, ${bg.gradientA ?? "#0f2044"}, ${bg.gradientB ?? "#1a4480"})` };
  })();

  const sorted = [...page.elements]
    .filter(el => el.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: pw, height: ph,
        overflow: "hidden",
        flexShrink: 0,
        cursor: "default",
        userSelect: "none",
        ...bgStyle,
      }}
      onClick={() => onSelect(null)}
    >
      {/* Color overlay */}
      {bg.overlayOpacity && bg.overlayOpacity > 0 && (
        <div style={{ position:"absolute", inset:0, background: bg.overlayColor || "#000",
          opacity: bg.overlayOpacity / 100, pointerEvents:"none", mixBlendMode:"multiply" }}/>
      )}

      {/* Texture */}
      {bg.texture && bg.texture !== "none" && TEXTURE_PAT[bg.texture] && (
        <div style={{ position:"absolute", inset:0,
          backgroundImage: TEXTURE_PAT[bg.texture],
          backgroundSize: ["marble","paper_cover","grain"].includes(bg.texture) ? "200px 200px" : undefined,
          mixBlendMode:"overlay", pointerEvents:"none" }}/>
      )}

      {/* Vignette */}
      {bg.vignette && (
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          background: `radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,${((bg.vignetteStrength ?? 60) / 100) * 0.85}) 100%)` }}/>
      )}

      {/* Snap guides */}
      <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:1, background:"rgba(0,170,255,0.55)", pointerEvents:"none", zIndex:9998, display:"none" }} className="snap-guide-v"/>
      <div style={{ position:"absolute", top:"50%", left:0, right:0, height:1, background:"rgba(0,170,255,0.55)", pointerEvents:"none", zIndex:9998, display:"none" }} className="snap-guide-h"/>

      {/* Elements */}
      {sorted.map(el => (
        <ElementNode
          key={el.id}
          el={el}
          pw={pw}
          ph={ph}
          isSelected={selectedId === el.id}
          isEditing={editingId === el.id}
          onSelect={onSelect}
          onUpdateLive={onUpdateLive}
          onCommit={onCommit}
          onEditingChange={onEditingChange}
          onSnapGuides={onSnapGuides}
        />
      ))}
    </div>
  );
}
