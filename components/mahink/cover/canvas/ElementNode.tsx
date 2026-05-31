"use client";
import React, { useRef, useEffect, useCallback } from "react";
import type { CoverElement } from "@/lib/types";

const MIN_PCT = 3;

interface Props {
  el:           CoverElement;
  pw:           number;
  ph:           number;
  isSelected:   boolean;
  isEditing:    boolean;
  onSelect:     (id: string | null) => void;
  onUpdateLive: (id: string, u: Partial<CoverElement>) => void;
  onCommit:     (id: string, u: Partial<CoverElement>) => void;
  onEditingChange: (id: string | null) => void;
  onSnapGuides?: (g: { x: boolean; y: boolean }) => void;
}

// ── Resize handle positions ──
const HANDLES = [
  { id: "nw", cx:   0, cy:   0, cursor: "nw-resize" },
  { id: "n",  cx:  50, cy:   0, cursor: "n-resize"  },
  { id: "ne", cx: 100, cy:   0, cursor: "ne-resize"  },
  { id: "e",  cx: 100, cy:  50, cursor: "e-resize"   },
  { id: "se", cx: 100, cy: 100, cursor: "se-resize"  },
  { id: "s",  cx:  50, cy: 100, cursor: "s-resize"   },
  { id: "sw", cx:   0, cy: 100, cursor: "sw-resize"  },
  { id: "w",  cx:   0, cy:  50, cursor: "w-resize"   },
] as const;

export default function ElementNode({ el, pw, ph, isSelected, isEditing, onSelect, onUpdateLive, onCommit, onEditingChange, onSnapGuides }: Props) {
  const textRef = useRef<HTMLDivElement>(null);

  // ── Derived px values ──
  const left   = (el.x / 100) * pw;
  const top    = (el.y / 100) * ph;
  const width  = (el.w / 100) * pw;
  const height = (el.h / 100) * ph;
  // Use canvas HEIGHT as scale reference so font sizes are consistent
  // across front (300×450) and narrow spine (44×450) canvases
  const scale  = ph / 450;

  // Focus text editing div
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      const range = document.createRange();
      const sel   = window.getSelection();
      range.selectNodeContents(textRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  // ── Move ──
  const handleMoveDown = useCallback((e: React.MouseEvent) => {
    if (el.locked || isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startEl = { x: el.x, y: el.y };
    let snapX = false, snapY = false;
    const SNAP = 2; // % threshold for snapping to center

    const onMove = (e: MouseEvent) => {
      const dxPct = (e.clientX - startX) / pw * 100;
      const dyPct = (e.clientY - startY) / ph * 100;
      let nx = startEl.x + dxPct;
      let ny = startEl.y + dyPct;
      // Snap to center
      const cx = 50 - el.w / 2;
      const cy = 50 - el.h / 2;
      snapX = Math.abs(nx - cx) < SNAP;
      snapY = Math.abs(ny - cy) < SNAP;
      if (snapX) nx = cx;
      if (snapY) ny = cy;
      onSnapGuides?.({ x: snapX, y: snapY });
      onUpdateLive(el.id, { x: nx, y: ny });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      onSnapGuides?.({ x: false, y: false });
      onCommit(el.id, {});  // flush current live state to history
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [el, pw, ph, isEditing, onUpdateLive, onCommit, onSnapGuides]);

  // ── Resize ──
  const handleResizeDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const orig = { x: el.x, y: el.y, w: el.w, h: el.h };

    const onMove = (e: MouseEvent) => {
      const dxPct = (e.clientX - startX) / pw * 100;
      const dyPct = (e.clientY - startY) / ph * 100;
      let { x, y, w, h } = orig;
      if (handle.includes("e")) w = Math.max(MIN_PCT, w + dxPct);
      if (handle.includes("s")) h = Math.max(MIN_PCT, h + dyPct);
      if (handle.includes("w")) { const nw = Math.max(MIN_PCT, w - dxPct); x += w - nw; w = nw; }
      if (handle.includes("n")) { const nh = Math.max(MIN_PCT, h - dyPct); y += h - nh; h = nh; }
      onUpdateLive(el.id, { x, y, w, h });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      onCommit(el.id, {});
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [el, pw, ph, onUpdateLive, onCommit]);

  // ── Rotate ──
  const handleRotateDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const centerX = left + width  / 2;
    const centerY = top  + height / 2;
    // Convert to page-relative using the canvas container
    const canvas  = (e.currentTarget as HTMLElement).closest("[data-canvas]");
    const rect    = canvas?.getBoundingClientRect();
    const ox = rect ? rect.left : 0;
    const oy = rect ? rect.top  : 0;

    const onMove = (e: MouseEvent) => {
      const mx = e.clientX - ox;
      const my = e.clientY - oy;
      const angle = Math.atan2(my - (centerY), mx - (centerX)) * (180 / Math.PI) + 90;
      onUpdateLive(el.id, { rotation: Math.round(angle) });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      onCommit(el.id, {});
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [el, left, top, width, height, onUpdateLive, onCommit]);

  // ── Double-click: enter text edit ──
  const handleDblClick = useCallback((e: React.MouseEvent) => {
    if (el.type !== "text") return;
    e.stopPropagation();
    onEditingChange(el.id);
  }, [el, onEditingChange]);

  // ── Text blur: commit text ──
  const handleTextBlur = useCallback(() => {
    if (textRef.current) {
      onCommit(el.id, { text: textRef.current.innerText });
    }
    onEditingChange(null);
  }, [el.id, onCommit, onEditingChange]);

  // ── Render element content ──
  const renderContent = () => {
    const fs = (el.fontSize ?? 20) * scale;
    const shadow = el.textShadow ? "0 1px 6px rgba(0,0,0,0.65)" : "none";

    if (el.type === "text") {
      return (
        <div
          ref={textRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={handleTextBlur}
          onKeyDown={(e) => { if (e.key === "Escape") { handleTextBlur(); } }}
          style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent:
              el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
            fontFamily:     el.fontFamily || "Georgia, serif",
            fontSize:       fs,
            fontWeight:     el.fontWeight || "700",
            fontStyle:      el.fontStyle  || "normal",
            textAlign:      el.textAlign  || "center",
            color:          el.color      || "rgba(255,255,255,0.92)",
            letterSpacing:  `${el.letterSpacing ?? 0}em`,
            lineHeight:     el.lineHeight ?? 1.3,
            textTransform:  el.textTransform || "none",
            textShadow:     shadow,
            wordBreak:      "break-word",
            whiteSpace:     "pre-wrap",
            cursor:         isEditing ? "text" : "default",
            outline:        "none",
            padding:        "2px 4px",
            boxSizing:      "border-box",
          }}
        >
          {el.text || ""}
        </div>
      );
    }

    if (el.type === "image") {
      return el.src
        ? <img src={el.src} style={{ width:"100%", height:"100%", objectFit: el.objectFit || "cover", display:"block" }} alt=""/>
        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", fontSize: 12 * scale }}>No image</div>;
    }

    if (el.type === "shape") {
      const r = el.borderRadius ?? 0;
      if (el.shapeType === "circle") {
        return <div style={{ width:"100%", height:"100%", borderRadius:"50%", background: el.fill || "rgba(255,255,255,0.2)", border: el.stroke ? `${el.strokeWidth ?? 1}px solid ${el.stroke}` : "none" }}/>;
      }
      if (el.shapeType === "line") {
        return <div style={{ width:"100%", height: el.strokeWidth ?? 2, background: el.stroke || "rgba(255,255,255,0.5)", alignSelf:"center" }}/>;
      }
      return <div style={{ width:"100%", height:"100%", borderRadius: r, background: el.fill || "rgba(255,255,255,0.15)", border: el.stroke ? `${el.strokeWidth ?? 1}px solid ${el.stroke}` : "none" }}/>;
    }

    if (el.type === "divider") {
      return (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:"100%", height: el.strokeWidth ?? 1, background: el.color || "rgba(255,255,255,0.4)" }}/>
        </div>
      );
    }

    if (el.type === "ornament") {
      return (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily: el.fontFamily || "Georgia, serif",
          fontSize: (el.ornamentScale ?? 1) * fs * 1.5,
          color: el.color || "rgba(255,255,255,0.75)",
          textShadow: shadow,
          userSelect: "none",
        }}>
          {el.ornamentChar || "❧"}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        position:  "absolute",
        left:      left,
        top:       top,
        width:     width,
        height:    height,
        transform: `rotate(${el.rotation || 0}deg)`,
        opacity:   el.opacity ?? 1,
        cursor:    el.locked ? "default" : (isEditing ? "text" : "move"),
        outline:   isSelected ? "1.5px dashed rgba(99,179,237,0.9)" : "none",
        outlineOffset: 1,
        boxSizing: "border-box",
        zIndex:    el.zIndex,
        pointerEvents: el.visible === false ? "none" : "auto",
      }}
      onMouseDown={el.locked ? undefined : handleMoveDown}
      onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
      onDoubleClick={handleDblClick}
    >
      {renderContent()}

      {/* Selection handles */}
      {isSelected && !el.locked && (
        <>
          {HANDLES.map(h => (
            <div
              key={h.id}
              data-handle={h.id}
              onMouseDown={(e) => { e.stopPropagation(); handleResizeDown(e, h.id); }}
              style={{
                position:  "absolute",
                left:      `${h.cx}%`,
                top:       `${h.cy}%`,
                width:     10,
                height:    10,
                marginLeft: -5,
                marginTop:  -5,
                background:  "#fff",
                border:      "1.5px solid #3b82f6",
                borderRadius: 2,
                cursor:      h.cursor,
                zIndex:      9999,
              }}
            />
          ))}

          {/* Rotation handle */}
          <div
            onMouseDown={(e) => { e.stopPropagation(); handleRotateDown(e); }}
            style={{
              position:  "absolute",
              left:      "50%",
              top:       -22,
              width:     12,
              height:    12,
              marginLeft:-6,
              background: "#3b82f6",
              borderRadius: "50%",
              cursor:    "crosshair",
              zIndex:    9999,
              border:    "2px solid #fff",
            }}
          />
          {/* Connector line from rotation handle to element */}
          <div style={{ position:"absolute", left:"calc(50% - 0.5px)", top:-10, width:1, height:10, background:"rgba(59,130,246,0.7)", zIndex:9998 }}/>
        </>
      )}
    </div>
  );
}
