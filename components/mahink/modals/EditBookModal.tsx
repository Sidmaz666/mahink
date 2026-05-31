"use client";

import { useRef, useState } from "react";
import {
  X, Check, Upload, Trash2,
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Type, ChevronDown, Paintbrush,
} from "lucide-react";
import CoverArt from "../ui/CoverArt";
import { COVER_GRADIENTS, COVER_SOLID_COLORS, COVER_TEXTURES_OVERLAY, GENRES, THEMES } from "@/lib/constants";
import { applyBookCoverToDesign, syncDesignToBookCover } from "@/lib/utils";
import type { Book, Theme } from "@/lib/types";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
interface Props {
  book: Book | null;
  theme: Theme;
  onUpdate: (id: string, updates: Partial<Book>) => void;
  onClose: () => void;
  notify: (msg: string, type?: "ok" | "err") => void;
  onOpenCoverEditor?: (id: string) => void;
}

type CoverTab = "background" | "title" | "credits" | "effects" | "details";

const TABS: { id: CoverTab; label: string }[] = [
  { id: "background", label: "Background" },
  { id: "title",      label: "Title"       },
  { id: "credits",    label: "Credits"     },
  { id: "effects",    label: "Effects"     },
  { id: "details",    label: "Details"     },
];

const TITLE_FONTS = [
  { id: "georgia",     label: "Georgia",            stack: "Georgia,'Times New Roman',serif"        },
  { id: "cormorant",   label: "Cormorant Garamond",  stack: "'Cormorant Garamond',Georgia,serif"     },
  { id: "playfair",    label: "Playfair Display",    stack: "'Playfair Display',Georgia,serif"       },
  { id: "baskerville", label: "Libre Baskerville",   stack: "'Libre Baskerville',Georgia,serif"      },
  { id: "crimson",     label: "Crimson Pro",         stack: "'Crimson Pro',Georgia,serif"            },
  { id: "lora",        label: "Lora",                stack: "'Lora',Georgia,serif"                   },
  { id: "spectral",    label: "Spectral",            stack: "'Spectral',Georgia,serif"               },
  { id: "dm_serif",    label: "DM Serif Display",    stack: "'DM Serif Display',Georgia,serif"       },
  { id: "abril",       label: "Abril Fatface",       stack: "'Abril Fatface',cursive"                },
  { id: "eb_garamond", label: "EB Garamond",         stack: "'EB Garamond',Georgia,serif"            },
  { id: "jost",        label: "Jost",                stack: "'Jost',sans-serif"                      },
  { id: "dm_sans",     label: "DM Sans",             stack: "'DM Sans',sans-serif"                   },
];

const TEXTURE_PREVIEW: Record<string, string> = {
  none:        "none",
  linen_cover: "repeating-linear-gradient(0deg,rgba(0,0,0,0.12) 0,rgba(0,0,0,0.12) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(90deg,rgba(0,0,0,0.12) 0,rgba(0,0,0,0.12) 1px,transparent 1px,transparent 4px)",
  leather:     "repeating-linear-gradient(33deg,rgba(0,0,0,0.15) 0,rgba(0,0,0,0.15) 1px,transparent 1px,transparent 8px),repeating-linear-gradient(-33deg,rgba(0,0,0,0.15) 0,rgba(0,0,0,0.15) 1px,transparent 1px,transparent 8px)",
  canvas:      "repeating-linear-gradient(0deg,rgba(0,0,0,0.13) 0,rgba(0,0,0,0.13) 2px,transparent 2px,transparent 8px),repeating-linear-gradient(90deg,rgba(0,0,0,0.13) 0,rgba(0,0,0,0.13) 2px,transparent 2px,transparent 8px)",
  marble:      `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.04 0.06' numOctaves='4' seed='5'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.5 0 0 0 0 0.6 0 0 0 0 0.8 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E")`,
  paper_cover: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.3'/%3E%3C/svg%3E")`,
  grain:       `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23g)' opacity='0.32'/%3E%3C/svg%3E")`,
  weave:       "repeating-linear-gradient(45deg,rgba(0,0,0,0.1) 0,rgba(0,0,0,0.1) 2px,transparent 2px,transparent 10px),repeating-linear-gradient(-45deg,rgba(0,0,0,0.1) 0,rgba(0,0,0,0.1) 2px,transparent 2px,transparent 10px)",
  diamond:     "repeating-linear-gradient(60deg,rgba(0,0,0,0.11) 0,rgba(0,0,0,0.11) 1px,transparent 1px,transparent 12px),repeating-linear-gradient(-60deg,rgba(0,0,0,0.11) 0,rgba(0,0,0,0.11) 1px,transparent 1px,transparent 12px)",
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const Lbl = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--txt-m)", marginBottom: 7, marginTop: 0 }}>
    {children}
  </p>
);

const Pill = ({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) => (
  <button
    key={id} onClick={onClick}
    style={{
      padding: "5px 13px", borderRadius: 20, fontSize: 12, fontFamily: "var(--ui-font)",
      border: `1px solid ${active ? "var(--acc)" : "var(--brd)"}`,
      background: active ? "var(--acc)" : "transparent",
      color: active ? "#fff" : "var(--txt-m)",
      cursor: "pointer", fontWeight: active ? 600 : 400, transition: "all 0.14s",
    }}
  >{label}</button>
);

const Toggle = ({
  checked, onChange, label,
}: { checked: boolean; onChange: () => void; label: string }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
    <div
      onClick={onChange}
      style={{
        width: 38, height: 20, borderRadius: 10,
        background: checked ? "var(--acc)" : "var(--brd)",
        position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 2, borderRadius: "50%",
        width: 16, height: 16, background: "#fff",
        left: checked ? 19 : 2, transition: "left 0.18s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
      }}/>
    </div>
    <span style={{ fontSize: 13, color: "var(--txt)" }}>{label}</span>
  </label>
);

const AlignBtns = ({
  value, onChange,
}: { value: "left"|"center"|"right"; onChange: (v: "left"|"center"|"right") => void }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {([
      { v: "left"   as const, Icon: AlignLeft,   tip: "Align left"   },
      { v: "center" as const, Icon: AlignCenter, tip: "Align center" },
      { v: "right"  as const, Icon: AlignRight,  tip: "Align right"  },
    ]).map(({ v, Icon, tip }) => (
      <button
        key={v} onClick={() => onChange(v)} data-tip={tip}
        style={{
          width: 34, height: 34, borderRadius: 7, border: `1px solid ${value === v ? "var(--acc)" : "var(--brd)"}`,
          background: value === v ? "var(--acc)" + "18" : "transparent",
          color: value === v ? "var(--acc)" : "var(--txt-m)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.14s",
        }}
      >
        <Icon size={14}/>
      </button>
    ))}
  </div>
);

const Slider = ({
  label, min, max, value, step = 1, unit = "", onChange,
}: { label: string; min: number; max: number; value: number; step?: number; unit?: string; onChange: (v: number) => void }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <Lbl>{label}</Lbl>
      <span style={{ fontSize: 11, color: "var(--txt-f)" }}>{value}{unit}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: "var(--acc)", cursor: "pointer" }}
    />
  </div>
);

// ─────────────────────────────────────────────
// Font picker
// ─────────────────────────────────────────────
const FontPicker = ({
  value, onChange,
}: { value: string | undefined; onChange: (stack: string) => void }) => {
  const [open, setOpen] = useState(false);
  const selected = TITLE_FONTS.find((f) => f.stack === value) ?? TITLE_FONTS[0];
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px", borderRadius: 8, border: "1px solid var(--brd)",
          background: "var(--surf-alt)", color: "var(--txt)", cursor: "pointer",
          fontFamily: selected.stack, fontSize: 14,
        }}
      >
        {selected.label}
        <ChevronDown size={13} style={{ color: "var(--txt-f)", flexShrink: 0 }}/>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "var(--surf)", border: "1px solid var(--brd)", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)", padding: 6,
          maxHeight: 220, overflowY: "auto",
        }}>
          {TITLE_FONTS.map((ft) => (
            <button
              key={ft.id}
              onClick={() => { onChange(ft.stack); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 7,
                border: "none", background: value === ft.stack ? "var(--acc)" + "18" : "transparent",
                color: value === ft.stack ? "var(--acc)" : "var(--txt)",
                fontFamily: ft.stack, fontSize: 14, cursor: "pointer",
              }}
            >
              {ft.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// ColorRow
// ─────────────────────────────────────────────
const TEXT_COLORS = [
  { c: "rgba(255,255,255,0.95)", label: "White" },
  { c: "rgba(255,255,255,0.7)",  label: "Soft white" },
  { c: "#fff8dc",                label: "Cream" },
  { c: "#f0e6d3",                label: "Parchment" },
  { c: "#ffd700",                label: "Gold" },
  { c: "#c8a96e",                label: "Warm gold" },
  { c: "#e8d5b7",                label: "Sand" },
  { c: "#1a1a1a",                label: "Near black" },
  { c: "#2c1810",                label: "Dark sepia" },
];

const ColorRow = ({ value, onChange }: { value: string | undefined; onChange: (c: string) => void }) => (
  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
    {TEXT_COLORS.map(({ c, label }) => (
      <div
        key={c} onClick={() => onChange(c)} data-tip={label}
        style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0, cursor: "pointer",
          background: c.startsWith("rgba") ? c.replace(/,[\d.]+\)/, ",1)").replace("rgba","rgb") : c,
          border: `2.5px solid ${value === c ? "var(--acc)" : "var(--brd)"}`,
          transition: "all 0.12s",
        }}
      />
    ))}
    <label data-tip="Custom colour" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "1.5px dashed var(--brd)", cursor: "pointer", fontSize: 15, color: "var(--txt-m)", position: "relative" }}>
      +
      <input type="color" value={value?.startsWith("rgba") ? "#ffffff" : (value || "#ffffff")} onChange={(e) => onChange(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}/>
    </label>
  </div>
);

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────
export default function EditBookModal({ book, theme, onUpdate, onClose, notify, onOpenCoverEditor }: Props) {
  const [f, setF]    = useState<Partial<Book>>(() => {
    if (!book) return {};
    const base = { ...book };
    if (book.coverDesign) {
      Object.assign(base, syncDesignToBookCover(book.coverDesign));
    }
    return base;
  });
  const [tab, setTab] = useState<CoverTab>("background");
  const imgRef = useRef<HTMLInputElement>(null);

  if (!book) return null;

  const up = (u: Partial<Book>) => setF((x) => ({ ...x, ...u }));
  const save = () => {
    const updates: Partial<Book> = { ...f };
    if (updates.coverDesign) {
      updates.coverDesign = applyBookCoverToDesign(updates.coverDesign, {
        coverType: updates.coverType ?? book.coverType ?? "gradient",
        coverGradient: updates.coverGradient ?? book.coverGradient ?? "midnight_blue",
        coverSolidColor: updates.coverSolidColor ?? book.coverSolidColor ?? "#1a1a2e",
        coverAngle: updates.coverAngle ?? book.coverAngle ?? 135,
      });
    }
    onUpdate(book.id, updates);
    onClose();
    notify("Book updated!");
  };
  const preview = { ...f, id: "edit-prev" } as Book;

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => up({ coverImage: reader.result as string, coverType: "image" });
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 960, width: "96vw", padding: 0, overflow: "hidden",
          display: "flex", flexDirection: "column", maxHeight: "94vh",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid var(--brd)", flexShrink: 0,
        }}>
          <h2 style={{ fontFamily: "var(--ed-font)", fontSize: 18, fontWeight: 700, color: "var(--txt)", margin: 0 }}>
            Cover Editor
          </h2>
          <button className="ibtn tip" data-tip="Close" onClick={onClose}><X size={16}/></button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* Left: Live preview */}
          <div style={{
            width: 290, flexShrink: 0,
            background: "rgba(0,0,0,0.18)",
            borderRight: "1px solid var(--brd)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14, padding: "24px 20px",
          }}>
            <CoverArt book={preview} size="editor"/>
            <p style={{ fontSize: 11, color: "var(--txt-f)", textAlign: "center", lineHeight: 1.6 }}>
              Live preview<br/>updates as you edit
            </p>
          </div>

          {/* Right: Controls */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--brd)", flexShrink: 0, overflowX: "auto" }}>
              {TABS.map(({ id, label }) => (
                <button
                  key={id} onClick={() => setTab(id)}
                  style={{
                    padding: "10px 18px", fontSize: 13, fontFamily: "var(--ui-font)",
                    border: "none", background: "transparent",
                    borderBottom: tab === id ? "2px solid var(--acc)" : "2px solid transparent",
                    color: tab === id ? "var(--acc)" : "var(--txt-m)",
                    fontWeight: tab === id ? 600 : 400,
                    cursor: "pointer", transition: "all 0.14s", marginBottom: -1, whiteSpace: "nowrap",
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 20px" }}>

              {/* ════════════════════════════════════════
                  BACKGROUND
                  ════════════════════════════════════════ */}
              {tab === "background" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

                  {/* Canvas editor launch */}
                  {onOpenCoverEditor && book && (
                    <div style={{ padding:"16px", borderRadius:12, border:"1.5px dashed var(--brd)", background:"var(--surf-alt)" + "44", textAlign:"center" }}>
                      <p style={{ fontSize:13, color:"var(--txt)", marginBottom:8, fontWeight:600 }}>Full Creative Control</p>
                      <p style={{ fontSize:12, color:"var(--txt-m)", marginBottom:12, lineHeight:1.5 }}>Drag &amp; drop text, images, shapes and ornaments freely on Front, Spine &amp; Back covers.</p>
                      <button className="btn btn-primary" style={{ width:"100%" }} onClick={() => onOpenCoverEditor(book.id)}>
                        <Paintbrush size={14}/> Open Cover Designer
                      </button>
                    </div>
                  )}

                  <div>
                    <Lbl>Quick Style</Lbl>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Pill id="gradient" label="Gradient" active={f.coverType !== "solid" && f.coverType !== "image"} onClick={() => up({ coverType: "gradient" })}/>
                      <Pill id="solid"    label="Solid"    active={f.coverType === "solid"}                             onClick={() => up({ coverType: "solid" })}/>
                      <Pill id="image"    label="Photo"    active={f.coverType === "image"}                             onClick={() => up({ coverType: "image" })}/>
                    </div>
                  </div>

                  {/* Gradient */}
                  {f.coverType !== "solid" && f.coverType !== "image" && (
                    <>
                      <div>
                        <Lbl>Gradient Preset</Lbl>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                          {COVER_GRADIENTS.map((g) => (
                            <div
                              key={g.id} onClick={() => up({ coverGradient: g.id })} data-tip={g.label}
                              style={{
                                height: 42, borderRadius: 8,
                                background: `linear-gradient(${f.coverAngle ?? 135}deg,${g.a},${g.b})`,
                                cursor: "pointer",
                                border: `2.5px solid ${f.coverGradient === g.id ? "#fff" : "transparent"}`,
                                boxShadow: f.coverGradient === g.id ? "0 0 0 2px var(--acc)" : "none",
                                transition: "all 0.12s",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <Slider label="Angle" min={0} max={360} value={f.coverAngle ?? 135} unit="°" onChange={(v) => up({ coverAngle: v })}/>
                    </>
                  )}

                  {/* Solid */}
                  {f.coverType === "solid" && (
                    <div>
                      <Lbl>Color</Lbl>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {COVER_SOLID_COLORS.map((c) => (
                          <div
                            key={c} onClick={() => up({ coverSolidColor: c })} data-tip={c}
                            style={{
                              width: 34, height: 34, borderRadius: 8, background: c, cursor: "pointer",
                              border: `2.5px solid ${f.coverSolidColor === c ? "#fff" : "transparent"}`,
                              boxShadow: f.coverSolidColor === c ? "0 0 0 2px var(--acc)" : "none",
                              transition: "all 0.12s",
                            }}
                          />
                        ))}
                        <label data-tip="Custom colour" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:8, border:"1.5px dashed var(--brd)", cursor:"pointer", fontSize:18, color:"var(--txt-m)", position:"relative" }}>
                          +
                          <input type="color" value={f.coverSolidColor || "#1a1a2e"} onChange={(e) => up({ coverSolidColor: e.target.value })} style={{ position:"absolute", inset:0, opacity:0, width:"100%", height:"100%", cursor:"pointer" }}/>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Photo */}
                  {f.coverType === "image" && (
                    <div>
                      <Lbl>Cover Photo</Lbl>
                      {f.coverImage ? (
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <img src={f.coverImage} alt="cover" style={{ width: 56, height: 78, objectFit: "cover", borderRadius: 6, border: "1px solid var(--brd)" }}/>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => imgRef.current?.click()}>
                              <Upload size={13}/> Replace
                            </button>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px", color: "#fc8181" }} onClick={() => up({ coverImage: undefined, coverType: "gradient" })}>
                              <Trash2 size={13}/> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-ghost" style={{ fontSize: 13, padding: "14px 20px", width: "100%", border: "1.5px dashed var(--brd)", borderRadius: 10 }} onClick={() => imgRef.current?.click()}>
                          <Upload size={14}/> Upload Cover Photo
                        </button>
                      )}
                      <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file); e.target.value = ""; }}/>
                    </div>
                  )}

                  {/* Overlay tint (useful for photos) */}
                  {f.coverType === "image" && (
                    <>
                      <div>
                        <Lbl>Overlay Tint Color</Lbl>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {["#000000","#1a1a2e","#1a3a20","#2a0a0a","#1e0a3c","#2a2a00"].map((c) => (
                            <div key={c} onClick={() => up({ coverOverlayColor: c })} data-tip={c}
                              style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: "pointer", border: `2px solid ${f.coverOverlayColor === c ? "var(--acc)" : "var(--brd)"}`, transition: "all 0.12s" }}/>
                          ))}
                          <label data-tip="Custom tint" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:6, border:"1.5px dashed var(--brd)", cursor:"pointer", fontSize:15, color:"var(--txt-m)", position:"relative" }}>
                            +
                            <input type="color" value={f.coverOverlayColor || "#000000"} onChange={(e) => up({ coverOverlayColor: e.target.value })} style={{ position:"absolute", inset:0, opacity:0, width:"100%", height:"100%", cursor:"pointer" }}/>
                          </label>
                        </div>
                      </div>
                      <Slider label="Overlay Opacity" min={0} max={80} value={f.coverOverlayOpacity ?? 0} unit="%" onChange={(v) => up({ coverOverlayOpacity: v })}/>
                    </>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════
                  TITLE
                  ════════════════════════════════════════ */}
              {tab === "title" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

                  <div>
                    <Lbl>Font Family</Lbl>
                    <FontPicker value={f.coverTitleFont} onChange={(s) => up({ coverTitleFont: s })}/>
                  </div>

                  {/* Size */}
                  <div>
                    <Lbl>Size</Lbl>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ label: "S", v: 0.7 }, { label: "M", v: 1.0 }, { label: "L", v: 1.35 }, { label: "XL", v: 1.7 }, { label: "XXL", v: 2.1 }].map(({ label, v }) => (
                        <Pill key={v} id={label} label={label} active={(f.coverTitleSize ?? 1) === v} onClick={() => up({ coverTitleSize: v })}/>
                      ))}
                    </div>
                  </div>

                  {/* Style buttons */}
                  <div>
                    <Lbl>Style</Lbl>
                    <div style={{ display: "flex", gap: 6 }}>
                      {([
                        { key: "coverTitleBold",      icon: <Bold size={14}/>,                               tip: "Bold",          default: true  },
                        { key: "coverTitleItalic",    icon: <Italic size={14}/>,                             tip: "Italic",        default: false },
                        { key: "coverTitleUppercase", icon: <Type size={14}/>,                               tip: "Uppercase",     default: false },
                        { key: "coverTitleShadow",    icon: <span style={{ fontSize: 13 }}>⊕</span>,        tip: "Text shadow",   default: true  },
                      ] as const).map(({ key, icon, tip, default: def }) => {
                        const val = (f[key] as boolean | undefined) ?? def;
                        return (
                          <button
                            key={key} onClick={() => up({ [key]: !val })} data-tip={tip}
                            style={{
                              width: 36, height: 36, borderRadius: 8,
                              border: `1px solid ${val ? "var(--acc)" : "var(--brd)"}`,
                              background: val ? "var(--acc)" + "20" : "transparent",
                              color: val ? "var(--acc)" : "var(--txt-m)",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {icon}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horizontal alignment */}
                  <div>
                    <Lbl>Horizontal Alignment</Lbl>
                    <AlignBtns value={f.coverTitleAlign ?? "center"} onChange={(v) => up({ coverTitleAlign: v })}/>
                  </div>

                  {/* Vertical position */}
                  <Slider label="Vertical Position (↑ top → ↓ bottom)" min={5} max={92} value={f.coverTitleY ?? 72} unit="%" onChange={(v) => up({ coverTitleY: v })}/>

                  {/* Letter spacing */}
                  <Slider label="Letter Spacing" min={0} max={40} value={f.coverTitleLetterSpacing ?? 0} unit="/100em" onChange={(v) => up({ coverTitleLetterSpacing: v })}/>

                  {/* Text color */}
                  <div>
                    <Lbl>Text Color</Lbl>
                    <ColorRow value={f.coverTextColor} onChange={(c) => up({ coverTextColor: c })}/>
                  </div>

                  {/* Series label */}
                  <div>
                    <Lbl>Series / Collection Label</Lbl>
                    <input className="inp" placeholder="e.g. Book One of the Ember Trilogy" value={f.coverSeriesText || ""} onChange={(e) => up({ coverSeriesText: e.target.value })}/>
                    <p style={{ fontSize: 11, color: "var(--txt-f)", marginTop: 5 }}>Appears above the title in small caps</p>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════
                  CREDITS (Subtitle + Author)
                  ════════════════════════════════════════ */}
              {tab === "credits" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                  {/* ── Subtitle ── */}
                  <div style={{ padding: "16px", borderRadius: 10, border: "1px solid var(--brd)", background: "var(--surf-alt)" + "44" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--txt)" }}>Subtitle</span>
                      <Toggle checked={f.coverSubtitleVisible ?? false} onChange={() => up({ coverSubtitleVisible: !(f.coverSubtitleVisible ?? false) })} label={f.coverSubtitleVisible ? "Visible" : "Hidden"}/>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: (f.coverSubtitleVisible ?? false) ? 1 : 0.4, pointerEvents: (f.coverSubtitleVisible ?? false) ? "auto" : "none" }}>
                      <div>
                        <Lbl>Subtitle Text</Lbl>
                        <input className="inp" placeholder="A subtitle for the cover" value={f.coverSubtitleText || ""} onChange={(e) => up({ coverSubtitleText: e.target.value })}/>
                      </div>
                      <div>
                        <Lbl>Font</Lbl>
                        <FontPicker value={f.coverSubtitleFont} onChange={(s) => up({ coverSubtitleFont: s })}/>
                      </div>
                      <div>
                        <Lbl>Size</Lbl>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[{ label: "XS", v: 0.5 }, { label: "S", v: 0.65 }, { label: "M", v: 0.8 }, { label: "L", v: 1.0 }].map(({ label, v }) => (
                            <Pill key={v} id={label} label={label} active={(f.coverSubtitleSize ?? 0.65) === v} onClick={() => up({ coverSubtitleSize: v })}/>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Lbl>Color</Lbl>
                        <ColorRow value={f.coverSubtitleColor} onChange={(c) => up({ coverSubtitleColor: c })}/>
                      </div>
                    </div>
                  </div>

                  {/* ── Author ── */}
                  <div style={{ padding: "16px", borderRadius: 10, border: "1px solid var(--brd)", background: "var(--surf-alt)" + "44" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--txt)" }}>Author Name</span>
                      <Toggle checked={f.coverAuthorVisible ?? !!f.authorOverride} onChange={() => up({ coverAuthorVisible: !(f.coverAuthorVisible ?? !!f.authorOverride) })} label={f.coverAuthorVisible ?? !!f.authorOverride ? "Visible" : "Hidden"}/>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: (f.coverAuthorVisible ?? !!f.authorOverride) ? 1 : 0.4, pointerEvents: (f.coverAuthorVisible ?? !!f.authorOverride) ? "auto" : "none" }}>
                      <div>
                        <Lbl>Name</Lbl>
                        <input className="inp" placeholder="Author name on cover" value={f.authorOverride || ""} onChange={(e) => up({ authorOverride: e.target.value })}/>
                      </div>
                      <div>
                        <Lbl>Size</Lbl>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[{ label: "XS", v: 0.5 }, { label: "S", v: 0.65 }, { label: "M", v: 0.8 }, { label: "L", v: 1.0 }].map(({ label, v }) => (
                            <Pill key={v} id={label} label={label} active={(f.coverAuthorSize ?? 0.65) === v} onClick={() => up({ coverAuthorSize: v })}/>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Lbl>Alignment</Lbl>
                        <AlignBtns value={f.coverAuthorAlign ?? "center"} onChange={(v) => up({ coverAuthorAlign: v })}/>
                      </div>
                      <div>
                        <Lbl>Color</Lbl>
                        <ColorRow value={f.coverAuthorColor} onChange={(c) => up({ coverAuthorColor: c })}/>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════
                  EFFECTS
                  ════════════════════════════════════════ */}
              {tab === "effects" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                  {/* Texture */}
                  <div>
                    <Lbl>Cover Texture</Lbl>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                      {COVER_TEXTURES_OVERLAY.map((t) => {
                        const active = (f.coverTextureOverlay ?? "none") === t.id;
                        const pat = TEXTURE_PREVIEW[t.id];
                        return (
                          <button
                            key={t.id} onClick={() => up({ coverTextureOverlay: t.id })}
                            style={{
                              padding: 0, borderRadius: 10, overflow: "hidden",
                              border: `2px solid ${active ? "var(--acc)" : "var(--brd)"}`,
                              boxShadow: active ? "0 0 0 2px var(--acc)" + "44" : "none",
                              cursor: "pointer", background: "none", transition: "all 0.15s",
                            }}
                          >
                            <div style={{
                              height: 48, background: "#647a9e",
                              backgroundImage: pat,
                              backgroundSize: ["marble","paper_cover","grain"].includes(t.id) ? "80px 80px" : undefined,
                            }}/>
                            <div style={{
                              padding: "6px 10px",
                              background: active ? "var(--acc)" + "18" : "var(--surf-alt)",
                              color: active ? "var(--acc)" : "var(--txt-m)",
                              fontSize: 12, fontWeight: active ? 600 : 400, textAlign: "left",
                            }}>{t.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vignette */}
                  <div style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid var(--brd)", background: "var(--surf-alt)" + "44" }}>
                    <div style={{ marginBottom: f.coverVignette ? 14 : 0 }}>
                      <Toggle checked={f.coverVignette ?? false} onChange={() => up({ coverVignette: !(f.coverVignette ?? false) })} label="Vignette (darken edges)"/>
                    </div>
                    {f.coverVignette && (
                      <Slider label="Vignette Strength" min={20} max={100} value={f.coverVignetteStrength ?? 60} unit="%" onChange={(v) => up({ coverVignetteStrength: v })}/>
                    )}
                  </div>

                  {/* Inner border */}
                  <div style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid var(--brd)", background: "var(--surf-alt)" + "44" }}>
                    <Toggle checked={f.coverShowBorder ?? true} onChange={() => up({ coverShowBorder: !(f.coverShowBorder ?? true) })} label="Inner decorative border"/>
                  </div>

                  {/* Divider */}
                  <div style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid var(--brd)", background: "var(--surf-alt)" + "44" }}>
                    <Toggle checked={f.coverDivider ?? true} onChange={() => up({ coverDivider: !(f.coverDivider ?? true) })} label="Divider line near title"/>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════
                  DETAILS
                  ════════════════════════════════════════ */}
              {tab === "details" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <Lbl>Title</Lbl>
                    <input className="inp" value={f.title || ""} onChange={(e) => up({ title: e.target.value })} placeholder="Book title"/>
                  </div>
                  <div>
                    <Lbl>Subtitle</Lbl>
                    <input className="inp" value={f.subtitle || ""} onChange={(e) => up({ subtitle: e.target.value })} placeholder="Optional subtitle"/>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <Lbl>Genre</Lbl>
                      <select className="inp" value={f.genre || "Novel"} onChange={(e) => up({ genre: e.target.value })}>
                        {GENRES.map((g) => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <Lbl>Word Goal</Lbl>
                      <input type="number" className="inp" value={f.wordGoal ?? 0} onChange={(e) => up({ wordGoal: Number(e.target.value) })} step={5000} min={0}/>
                    </div>
                  </div>
                  <div>
                    <Lbl>Author Name</Lbl>
                    <input className="inp" value={f.authorOverride || ""} onChange={(e) => up({ authorOverride: e.target.value })} placeholder="Shown on the cover"/>
                  </div>
                  <div>
                    <Lbl>Book visual theme</Lbl>
                    <p style={{ fontSize: 11, color: "var(--txt-f)", margin: "0 0 8px", lineHeight: 1.5 }}>
                      Colours the writing canvas and live preview only. App sidebar and dashboard use Settings → Appearance.
                    </p>
                    <select
                      className="inp"
                      value={f.preferredThemeId ?? ""}
                      onChange={(e) => up({ preferredThemeId: e.target.value ? e.target.value : undefined })}
                    >
                      <option value="">Same as app appearance (default)</option>
                      {Object.values(THEMES).map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.group})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

            </div>{/* end scroll */}
          </div>{/* end right */}
        </div>{/* end body */}

        {/* ── Footer ── */}
        <div style={{
          display: "flex", gap: 10, padding: "13px 20px", justifyContent: "flex-end",
          borderTop: "1px solid var(--brd)", flexShrink: 0, background: "var(--surf)",
        }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}><Check size={14}/>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
