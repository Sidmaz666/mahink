"use client";
import { useRef } from "react";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Upload, Trash2, ChevronDown } from "lucide-react";
import type { CoverElement, PageBackground } from "@/lib/types";
import { COVER_GRADIENTS, COVER_SOLID_COLORS, COVER_TEXTURES_OVERLAY } from "@/lib/constants";

// ─── Micro components ───────────────────────────────────────────
const Lbl = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--txt-f)", marginBottom: 6, marginTop: 0 }}>{children}</p>
);

const Row = ({ children, gap = 6 }: { children: React.ReactNode; gap?: number }) => (
  <div style={{ display: "flex", gap, alignItems: "center", flexWrap: "wrap" }}>{children}</div>
);

const Slider = ({ label, min, max, value, step = 1, unit = "", onChange }: { label: string; min: number; max: number; value: number; step?: number; unit?: string; onChange: (v: number) => void }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <Lbl>{label}</Lbl>
      <span style={{ fontSize: 10, color: "var(--txt-f)" }}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: "var(--acc)" }}/>
  </div>
);

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) => (
  <div style={{ marginBottom: 12 }}>
    <Lbl>{label}</Lbl>
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <label style={{ display:"inline-flex", width:32, height:32, borderRadius:7, border:"1px solid var(--brd)", cursor:"pointer", overflow:"hidden", position:"relative", flexShrink:0 }}>
        <div style={{ width:"100%", height:"100%", background: value }}/>
        <input type="color" value={value.startsWith("rgba") ? "#ffffff" : value} onChange={(e) => onChange(e.target.value)}
          style={{ position:"absolute", inset:0, opacity:0, width:"100%", height:"100%", cursor:"pointer" }}/>
      </label>
      <input className="inp" style={{ flex:1, fontSize:11, padding:"4px 8px", fontFamily:"monospace" }}
        value={value} onChange={(e) => onChange(e.target.value)}/>
    </div>
  </div>
);

const TITLE_FONTS = [
  { label: "Georgia",            stack: "Georgia,'Times New Roman',serif"       },
  { label: "Cormorant Garamond", stack: "'Cormorant Garamond',Georgia,serif"    },
  { label: "Playfair Display",   stack: "'Playfair Display',Georgia,serif"      },
  { label: "Libre Baskerville",  stack: "'Libre Baskerville',Georgia,serif"     },
  { label: "Crimson Pro",        stack: "'Crimson Pro',Georgia,serif"           },
  { label: "Lora",               stack: "'Lora',Georgia,serif"                  },
  { label: "Spectral",           stack: "'Spectral',Georgia,serif"              },
  { label: "DM Serif Display",   stack: "'DM Serif Display',Georgia,serif"      },
  { label: "Abril Fatface",      stack: "'Abril Fatface',cursive"               },
  { label: "EB Garamond",        stack: "'EB Garamond',Georgia,serif"           },
  { label: "Jost",               stack: "'Jost',sans-serif"                     },
  { label: "DM Sans",            stack: "'DM Sans',sans-serif"                  },
  { label: "Source Serif 4",     stack: "'Source Serif 4',Georgia,serif"        },
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

const ORNAMENTS = ["❧","✦","◆","◇","✿","❋","✽","•","❖","✠","§","¶","~","≈","✸","❀","✾","★","✩","※","·","∙","–","—","═","─","≡","∞","♦","♠","♣"];

interface Props {
  selected:   CoverElement | null;
  background: PageBackground;
  onUpdate:   (u: Partial<CoverElement>) => void;
  onCommit:   (u: Partial<CoverElement>) => void;
  onBgUpdate: (u: Partial<PageBackground>) => void;
}

export default function PropertiesPanel({ selected, background: bg, onUpdate, onCommit, onBgUpdate }: Props) {
  const imgRef = useRef<HTMLInputElement>(null);
  const up = (u: Partial<CoverElement>) => { onUpdate(u); onCommit(u); };

  // ── Section: Element position / transform (common) ──
  const PositionSection = () => (
    <div style={{ padding: "14px 0", borderTop: "1px solid var(--brd)" }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--txt)", marginBottom: 12 }}>Position & Transform</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {([["X", "x", -500, 500], ["Y", "y", -500, 500], ["W", "w", 1, 1000], ["H", "h", 1, 1000]] as const).map(([lbl, key, mn, mx]) => (
          <div key={key}>
            <Lbl>{lbl} (%)</Lbl>
            <input type="number" className="inp" style={{ padding:"4px 8px", fontSize:12 }}
              min={mn} max={mx} value={Math.round(selected![key])}
              onChange={(e) => up({ [key]: Number(e.target.value) })}/>
          </div>
        ))}
      </div>
      <Slider label="Rotation" min={-180} max={180} value={selected?.rotation ?? 0} unit="°" onChange={(v) => up({ rotation: v })}/>
      <Slider label="Opacity"  min={0}    max={1}   step={0.05} value={selected?.opacity ?? 1} onChange={(v) => up({ opacity: v })}/>
    </div>
  );

  // ── TEXT panel ──
  const TextPanel = () => {
    const el = selected!;
    const selFont = TITLE_FONTS.find(f => f.stack === el.fontFamily) ?? TITLE_FONTS[0];
    return (
      <div>
        {/* Content */}
        <div style={{ marginBottom: 14 }}>
          <Lbl>Text Content</Lbl>
          <textarea className="ta" rows={3} style={{ fontSize: 13, resize: "vertical" }}
            value={el.text || ""} onChange={(e) => up({ text: e.target.value })}/>
        </div>

        {/* Font */}
        <div style={{ marginBottom: 14 }}>
          <Lbl>Font Family</Lbl>
          <div style={{ position: "relative" }}>
            <select className="inp" style={{ fontFamily: selFont.stack, fontSize: 13 }}
              value={el.fontFamily || TITLE_FONTS[0].stack}
              onChange={(e) => up({ fontFamily: e.target.value })}>
              {TITLE_FONTS.map(f => <option key={f.label} value={f.stack} style={{ fontFamily: f.stack }}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <Slider label="Font Size" min={6} max={120} value={el.fontSize ?? 28} unit="px" onChange={(v) => up({ fontSize: v })}/>

        {/* Style toggles */}
        <div style={{ marginBottom: 14 }}>
          <Lbl>Style</Lbl>
          <Row>
            {([
              { icon: <Bold size={13}/>, key: "fontWeight", on: "700", off: "400", tip: "Bold"    },
              { icon: <Italic size={13}/>, key: "fontStyle", on: "italic", off: "normal", tip: "Italic" },
            ] as const).map(({ icon, key, on, off, tip }) => {
              const active = el[key] === on || (key === "fontWeight" && el[key] === undefined && on === "700");
              return (
                <button key={key} data-tip={tip}
                  onClick={() => up({ [key]: active ? off : on })}
                  style={{ width:34, height:34, borderRadius:7, border:`1px solid ${active ? "var(--acc)" : "var(--brd)"}`,
                    background: active ? "var(--acc)" + "20" : "transparent", color: active ? "var(--acc)" : "var(--txt-m)",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {icon}
                </button>
              );
            })}
            {/* Uppercase */}
            <button data-tip="Uppercase"
              onClick={() => up({ textTransform: el.textTransform === "uppercase" ? "none" : "uppercase" })}
              style={{ height:34, padding:"0 10px", borderRadius:7, border:`1px solid ${el.textTransform==="uppercase" ? "var(--acc)" : "var(--brd)"}`,
                background: el.textTransform==="uppercase" ? "var(--acc)" + "20" : "transparent", color: el.textTransform==="uppercase" ? "var(--acc)" : "var(--txt-m)",
                cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"0.05em" }}>
              AA
            </button>
            {/* Shadow */}
            <button data-tip="Text shadow"
              onClick={() => up({ textShadow: !el.textShadow })}
              style={{ height:34, padding:"0 10px", borderRadius:7, border:`1px solid ${el.textShadow ? "var(--acc)" : "var(--brd)"}`,
                background: el.textShadow ? "var(--acc)" + "20" : "transparent", color: el.textShadow ? "var(--acc)" : "var(--txt-m)",
                cursor:"pointer", fontSize:11 }}>
              ☁
            </button>
          </Row>
        </div>

        {/* Alignment */}
        <div style={{ marginBottom: 14 }}>
          <Lbl>Alignment</Lbl>
          <Row>
            {([{v:"left",Icon:AlignLeft},{v:"center",Icon:AlignCenter},{v:"right",Icon:AlignRight}] as const).map(({v,Icon}) => (
              <button key={v} onClick={() => up({ textAlign: v })} data-tip={`Align ${v}`}
                style={{ width:34, height:34, borderRadius:7, border:`1px solid ${(el.textAlign??'center')===v ? "var(--acc)" : "var(--brd)"}`,
                  background:(el.textAlign??'center')===v ? "var(--acc)"+"20" : "transparent", color:(el.textAlign??'center')===v ? "var(--acc)" : "var(--txt-m)",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={13}/>
              </button>
            ))}
          </Row>
        </div>

        <ColorPicker label="Color" value={el.color || "rgba(255,255,255,0.92)"} onChange={(c) => up({ color: c })}/>
        <Slider label="Letter Spacing" min={0} max={0.5} step={0.01} value={el.letterSpacing ?? 0} onChange={(v) => up({ letterSpacing: v })}/>
        <Slider label="Line Height"    min={0.8} max={3}   step={0.05} value={el.lineHeight ?? 1.3}  onChange={(v) => up({ lineHeight: v })}/>
        <PositionSection/>
      </div>
    );
  };

  // ── IMAGE panel ──
  const ImagePanel = () => {
    const el = selected!;
    return (
      <div>
        <div style={{ marginBottom: 14 }}>
          {el.src
            ? <img src={el.src} style={{ width:"100%", borderRadius:8, border:"1px solid var(--brd)", objectFit:"cover", maxHeight:120 }} alt=""/>
            : <div style={{ height:80, borderRadius:8, border:"1.5px dashed var(--brd)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--txt-f)", fontSize:12 }}>No image</div>
          }
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <button className="btn btn-ghost" style={{ flex:1, fontSize:12 }} onClick={() => imgRef.current?.click()}>
            <Upload size={12}/> {el.src ? "Replace" : "Upload"}
          </button>
          {el.src && <button className="btn btn-ghost" style={{ fontSize:12, color:"#fc8181" }} onClick={() => up({ src: undefined })}>
            <Trash2 size={12}/>
          </button>}
        </div>
        <input ref={imgRef} type="file" accept="image/*" style={{ display:"none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => up({ src: reader.result as string });
            reader.readAsDataURL(file);
            e.target.value = "";
          }}/>
        <div style={{ marginBottom:14 }}>
          <Lbl>Fit</Lbl>
          <Row>
            {(["cover","contain","fill"] as const).map(v => (
              <button key={v} onClick={() => up({ objectFit: v })}
                style={{ padding:"5px 10px", borderRadius:7, border:`1px solid ${(el.objectFit??'cover')===v?"var(--acc)":"var(--brd)"}`,
                  background:(el.objectFit??'cover')===v?"var(--acc)"+"18":"transparent", color:(el.objectFit??'cover')===v?"var(--acc)":"var(--txt-m)",
                  cursor:"pointer", fontSize:11 }}>
                {v}
              </button>
            ))}
          </Row>
        </div>
        <PositionSection/>
      </div>
    );
  };

  // ── SHAPE panel ──
  const ShapePanel = () => {
    const el = selected!;
    return (
      <div>
        <div style={{ marginBottom:14 }}>
          <Lbl>Shape Type</Lbl>
          <Row>
            {(["rect","circle","line"] as const).map(v => (
              <button key={v} onClick={() => up({ shapeType: v })}
                style={{ padding:"5px 10px", borderRadius:7, border:`1px solid ${(el.shapeType??'rect')===v?"var(--acc)":"var(--brd)"}`,
                  background:(el.shapeType??'rect')===v?"var(--acc)"+"18":"transparent", color:(el.shapeType??'rect')===v?"var(--acc)":"var(--txt-m)",
                  cursor:"pointer", fontSize:11, fontFamily:"var(--ui-font)" }}>
                {v}
              </button>
            ))}
          </Row>
        </div>
        <ColorPicker label="Fill"   value={el.fill   || "rgba(255,255,255,0.15)"} onChange={(c) => up({ fill: c })}/>
        <ColorPicker label="Stroke" value={el.stroke || "rgba(255,255,255,0.4)"}  onChange={(c) => up({ stroke: c })}/>
        <Slider label="Stroke Width" min={0} max={20} value={el.strokeWidth ?? 1} unit="px" onChange={(v) => up({ strokeWidth: v })}/>
        {el.shapeType !== "circle" && el.shapeType !== "line" && (
          <Slider label="Corner Radius" min={0} max={50} value={el.borderRadius ?? 0} unit="px" onChange={(v) => up({ borderRadius: v })}/>
        )}
        <PositionSection/>
      </div>
    );
  };

  // ── ORNAMENT panel ──
  const OrnamentPanel = () => {
    const el = selected!;
    return (
      <div>
        <div style={{ marginBottom:14 }}>
          <Lbl>Character</Lbl>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {ORNAMENTS.map(c => (
              <button key={c} onClick={() => up({ ornamentChar: c })}
                style={{ width:28, height:28, border:`1px solid ${el.ornamentChar===c?"var(--acc)":"var(--brd)"}`,
                  background: el.ornamentChar===c?"var(--acc)"+"18":"transparent",
                  cursor:"pointer", borderRadius:6, fontFamily:"Georgia,serif", fontSize:13, color:"var(--txt)" }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <ColorPicker label="Color" value={el.color || "rgba(255,255,255,0.7)"} onChange={(c) => up({ color: c })}/>
        <Slider label="Scale" min={0.5} max={5} step={0.1} value={el.ornamentScale ?? 1} onChange={(v) => up({ ornamentScale: v })}/>
        <PositionSection/>
      </div>
    );
  };

  // ── DIVIDER panel ──
  const DividerPanel = () => {
    const el = selected!;
    return (
      <div>
        <ColorPicker label="Color"        value={el.color || "rgba(255,255,255,0.4)"} onChange={(c) => up({ color: c })}/>
        <Slider label="Thickness" min={1} max={12} value={el.strokeWidth ?? 1} unit="px" onChange={(v) => up({ strokeWidth: v })}/>
        <PositionSection/>
      </div>
    );
  };

  // ── BACKGROUND panel ──
  const BgPanel = () => (
    <div>
      <p style={{ fontSize:13, fontWeight:600, color:"var(--txt)", marginBottom:14 }}>Page Background</p>

      <div style={{ marginBottom:16 }}>
        <Lbl>Type</Lbl>
        <Row>
          {(["gradient","solid","image"] as const).map(v => (
            <button key={v} onClick={() => onBgUpdate({ type: v })}
              style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${bg.type===v?"var(--acc)":"var(--brd)"}`,
                background:bg.type===v?"var(--acc)":"transparent", color:bg.type===v?"#fff":"var(--txt-m)",
                cursor:"pointer", fontSize:12, fontWeight:bg.type===v?600:400 }}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </Row>
      </div>

      {bg.type === "gradient" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {COVER_GRADIENTS.map(g => (
              <div key={g.id} onClick={() => onBgUpdate({ gradientA: g.a, gradientB: g.b })} data-tip={g.label}
                style={{ height:36, borderRadius:8, background:`linear-gradient(${bg.gradientAngle??135}deg,${g.a},${g.b})`,
                  cursor:"pointer", border:`2px solid ${bg.gradientA===g.a?"#fff":"transparent"}`,
                  boxShadow:bg.gradientA===g.a?"0 0 0 2px var(--acc)":"none", transition:"all 0.12s" }}/>
            ))}
          </div>
          <ColorPicker label="Color A" value={bg.gradientA || "#0f2044"} onChange={(c) => onBgUpdate({ gradientA: c })}/>
          <ColorPicker label="Color B" value={bg.gradientB || "#1a4480"} onChange={(c) => onBgUpdate({ gradientB: c })}/>
          <Slider label="Angle" min={0} max={360} value={bg.gradientAngle ?? 135} unit="°" onChange={(v) => onBgUpdate({ gradientAngle: v })}/>
        </>
      )}

      {bg.type === "solid" && (
        <>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
            {COVER_SOLID_COLORS.map(c => (
              <div key={c} onClick={() => onBgUpdate({ solid: c })} data-tip={c}
                style={{ width:28, height:28, borderRadius:6, background:c, cursor:"pointer",
                  border:`2px solid ${bg.solid===c?"#fff":"transparent"}`,
                  boxShadow:bg.solid===c?"0 0 0 2px var(--acc)":"none", transition:"all 0.12s" }}/>
            ))}
          </div>
          <ColorPicker label="Color" value={bg.solid || "#1a1a2e"} onChange={(c) => onBgUpdate({ solid: c })}/>
        </>
      )}

      {bg.type === "image" && (
        <div style={{ marginBottom:14 }}>
          {bg.image
            ? <img src={bg.image} style={{ width:"100%", borderRadius:8, border:"1px solid var(--brd)", maxHeight:120, objectFit:"cover" }} alt=""/>
            : <div style={{ height:80, borderRadius:8, border:"1.5px dashed var(--brd)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--txt-f)", fontSize:12 }}>No image</div>
          }
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button className="btn btn-ghost" style={{ flex:1, fontSize:12 }}
              onClick={() => { const i=document.createElement("input"); i.type="file"; i.accept="image/*"; i.onchange=()=>{ const f=i.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>onBgUpdate({image:r.result as string}); r.readAsDataURL(f); }; i.click(); }}>
              <Upload size={12}/> Upload
            </button>
            {bg.image && <button className="btn btn-ghost" style={{ fontSize:12, color:"#fc8181" }} onClick={() => onBgUpdate({ image: undefined, type: "gradient" })}><Trash2 size={12}/></button>}
          </div>
        </div>
      )}

      {/* Photo tint (useful when type=image) */}
      {bg.type === "image" && (
        <>
          <ColorPicker label="Overlay Tint" value={bg.overlayColor || "#000000"} onChange={(c) => onBgUpdate({ overlayColor: c })}/>
          <Slider label="Overlay Opacity" min={0} max={80} value={bg.overlayOpacity ?? 0} unit="%" onChange={(v) => onBgUpdate({ overlayOpacity: v })}/>
        </>
      )}

      <div style={{ borderTop:"1px solid var(--brd)", paddingTop:14, marginTop:4 }}>
        <Lbl>Texture Overlay</Lbl>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:14 }}>
          {COVER_TEXTURES_OVERLAY.map(t => {
            const active = (bg.texture ?? "none") === t.id;
            return (
              <button key={t.id} onClick={() => onBgUpdate({ texture: t.id })}
                style={{ padding:0, borderRadius:8, overflow:"hidden", border:`2px solid ${active?"var(--acc)":"var(--brd)"}`, cursor:"pointer", background:"none" }}>
                <div style={{ height:36, background:"#647a9e", backgroundImage:TEXTURE_PREVIEW[t.id], backgroundSize:["marble","paper_cover","grain"].includes(t.id)?"80px 80px":undefined }}/>
                <div style={{ padding:"4px 6px", background:active?"var(--acc)"+"18":"var(--surf-alt)", color:active?"var(--acc)":"var(--txt-m)", fontSize:10, fontWeight:active?600:400 }}>{t.label}</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <div onClick={() => onBgUpdate({ vignette: !bg.vignette })}
              style={{ width:36, height:20, borderRadius:10, background:bg.vignette?"var(--acc)":"var(--brd)", position:"relative", transition:"background 0.2s", cursor:"pointer", flexShrink:0 }}>
              <div style={{ position:"absolute", top:2, borderRadius:"50%", width:16, height:16, background:"#fff", left:bg.vignette?17:2, transition:"left 0.18s", boxShadow:"0 1px 4px rgba(0,0,0,0.25)" }}/>
            </div>
            <span style={{ fontSize:12, color:"var(--txt)" }}>Vignette (dark edges)</span>
          </label>
        </div>
        {bg.vignette && <Slider label="Vignette Strength" min={20} max={100} value={bg.vignetteStrength??60} unit="%" onChange={(v) => onBgUpdate({ vignetteStrength: v })}/>}
      </div>
    </div>
  );

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"14px 14px 20px" }}>
      {!selected && <BgPanel/>}
      {selected?.type === "text"     && <TextPanel/>}
      {selected?.type === "image"    && <ImagePanel/>}
      {selected?.type === "shape"    && <ShapePanel/>}
      {selected?.type === "divider"  && <DividerPanel/>}
      {selected?.type === "ornament" && <OrnamentPanel/>}
    </div>
  );
}
