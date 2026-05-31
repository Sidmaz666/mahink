"use client";
import { useState } from "react";
import { Plus, Type, Image, Square, Minus, Sparkles, Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { CoverElement, CoverPage } from "@/lib/types";
import { genId } from "@/lib/utils";

interface Props {
  page:         CoverPage;
  pageKey:      "front" | "spine" | "back";
  selectedId:   string | null;
  onSelect:     (id: string) => void;
  onAddElement: (el: CoverElement) => void;
  onUpdateElement: (id: string, u: Partial<CoverElement>) => void;
  onDeleteElement: (id: string) => void;
  onReorder:    (id: string, dir: "up" | "down") => void;
}

const ORNAMENTS = ["❧","✦","◆","◇","✿","❋","✽","•","❖","✠","§","¶","~","≈"];

function makeEl(overrides: Partial<CoverElement>): CoverElement {
  return {
    id: genId(), name: "Element",
    x: 20, y: 20, w: 60, h: 15,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 0,
    type: "text",
    ...overrides,
  };
}

export default function LayersPanel({
  page, selectedId, onSelect, onAddElement,
  onUpdateElement, onDeleteElement, onReorder,
}: Props) {
  const [showOrnPicker, setShowOrnPicker] = useState(false);

  const sorted = [...page.elements].sort((a, b) => b.zIndex - a.zIndex);
  const maxZ   = page.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);

  const addText = () => onAddElement(makeEl({
    type: "text", name: "Text",
    x: 15, y: 40, w: 70, h: 15,
    zIndex: maxZ + 1,
    text: "New Text",
    fontFamily: "Georgia,'Times New Roman',serif",
    fontSize: 28, fontWeight: "700",
    textAlign: "center", color: "rgba(255,255,255,0.92)",
    textShadow: true,
  }));

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onAddElement(makeEl({
          type: "image", name: "Image",
          x: 10, y: 10, w: 80, h: 60,
          zIndex: maxZ + 1,
          src: reader.result as string,
          objectFit: "cover",
        }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addShape = (shapeType: "rect" | "circle") => onAddElement(makeEl({
    type: "shape", name: shapeType === "circle" ? "Circle" : "Rectangle",
    x: 20, y: 30, w: 60, h: 30,
    zIndex: maxZ + 1,
    shapeType,
    fill: "rgba(255,255,255,0.15)",
    stroke: "rgba(255,255,255,0.4)",
    strokeWidth: 1,
  }));

  const addDivider = () => onAddElement(makeEl({
    type: "divider", name: "Divider",
    x: 15, y: 50, w: 70, h: 3,
    zIndex: maxZ + 1,
    color: "rgba(255,255,255,0.45)",
    strokeWidth: 1,
  }));

  const addOrnament = (char: string) => {
    onAddElement(makeEl({
      type: "ornament", name: `Ornament (${char})`,
      x: 35, y: 45, w: 30, h: 10,
      zIndex: maxZ + 1,
      ornamentChar: char,
      ornamentScale: 1,
      color: "rgba(255,255,255,0.7)",
    }));
    setShowOrnPicker(false);
  };

  const s: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8, width: "100%",
    padding: "7px 10px", borderRadius: 7, border: "1px solid var(--brd)",
    background: "transparent", cursor: "pointer", fontSize: 12,
    fontFamily: "var(--ui-font)", color: "var(--txt-m)", transition: "all 0.14s",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Add section */}
      <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--brd)", flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--txt-f)", marginBottom: 10 }}>Add Element</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <button style={s} onClick={addText} data-tip="Add text block">
            <Type size={13}/> Text
          </button>
          <button style={s} onClick={addImage} data-tip="Add image">
            <Image size={13}/> Image
          </button>
          <button style={s} onClick={() => addShape("rect")} data-tip="Add rectangle">
            <Square size={13}/> Rectangle
          </button>
          <button style={s} onClick={() => addShape("circle")} data-tip="Add circle">
            <div style={{ width: 13, height: 13, borderRadius: "50%", border: "1.5px solid currentColor" }}/> Circle
          </button>
          <button style={s} onClick={addDivider} data-tip="Add divider line">
            <Minus size={13}/> Divider
          </button>
          <button style={s} onClick={() => setShowOrnPicker(!showOrnPicker)} data-tip="Add ornament character">
            <Sparkles size={13}/> Ornament
          </button>
          {showOrnPicker && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 4px", background: "var(--surf-alt)", borderRadius: 8 }}>
              {ORNAMENTS.map(c => (
                <button key={c} onClick={() => addOrnament(c)}
                  style={{ width: 26, height: 26, border: "1px solid var(--brd)", background: "transparent",
                    cursor: "pointer", borderRadius: 5, fontFamily: "Georgia, serif", fontSize: 13, color: "var(--txt)" }}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layers list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--txt-f)", marginBottom: 8 }}>
          Layers ({page.elements.length})
        </p>
        {page.elements.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--txt-f)", textAlign: "center", marginTop: 20 }}>No elements yet.<br/>Add one above.</p>
        )}
        {sorted.map((el, i) => {
          const active = selectedId === el.id;
          return (
            <div
              key={el.id}
              onClick={() => onSelect(el.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 8px", borderRadius: 8, marginBottom: 3,
                background: active ? "var(--acc)" + "18" : "transparent",
                border: `1px solid ${active ? "var(--acc)" : "transparent"}`,
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: 11, color: active ? "var(--acc)" : "var(--txt-m)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {el.name || el.type}
              </span>
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                <button data-tip={el.visible ? "Hide" : "Show"}
                  onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { visible: !el.visible }); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"var(--txt-f)", display:"flex", padding:2 }}>
                  {el.visible ? <Eye size={11}/> : <EyeOff size={11}/>}
                </button>
                <button data-tip={el.locked ? "Unlock" : "Lock"}
                  onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { locked: !el.locked }); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"var(--txt-f)", display:"flex", padding:2 }}>
                  {el.locked ? <Lock size={11}/> : <Unlock size={11}/>}
                </button>
                <button data-tip="Move up (↑ in z-order)"
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "up"); }}
                  disabled={i === 0}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"var(--txt-f)", display:"flex", padding:2, opacity: i===0 ? 0.3:1 }}>
                  <ChevronUp size={11}/>
                </button>
                <button data-tip="Move down (↓ in z-order)"
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "down"); }}
                  disabled={i === sorted.length - 1}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"var(--txt-f)", display:"flex", padding:2, opacity: i===sorted.length-1 ? 0.3:1 }}>
                  <ChevronDown size={11}/>
                </button>
                <button data-tip="Delete element"
                  onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#fc8181", display:"flex", padding:2 }}>
                  <Trash2 size={11}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
