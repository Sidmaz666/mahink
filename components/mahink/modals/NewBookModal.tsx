"use client";

import { useState } from "react";
import { X, BookOpen } from "lucide-react";
import CoverArt from "../ui/CoverArt";
import { COVER_GRADIENTS, COVER_SOLID_COLORS, COVER_TEXTURES_OVERLAY, GENRES } from "@/lib/constants";
import { TRIM_PRESETS } from "@/lib/kdp";
import { createDefaultPublishingSpec } from "@/lib/utils";
import type { Book, Theme } from "@/lib/types";

type NewBookFields = Pick<Book,
  "title" | "subtitle" | "genre" | "wordGoal" |
  "coverType" | "coverGradient" | "coverSolidColor" | "coverAngle" | "coverTextureOverlay" | "publishing"
>;

interface Props {
  theme: Theme;
  onCreate: (data: NewBookFields) => void;
  onClose: () => void;
}

const DEFAULT_FIELDS: NewBookFields = {
  title: "", subtitle: "", genre: "Novel", wordGoal: 50000,
  coverType: "gradient", coverGradient: "midnight_blue",
  coverSolidColor: "#1a1a2e", coverAngle: 135, coverTextureOverlay: "none",
  publishing: createDefaultPublishingSpec(),
};

export default function NewBookModal({ theme, onCreate, onClose }: Props) {
  const [fields, setFields]   = useState<NewBookFields>(DEFAULT_FIELDS);
  const [coverTab, setCoverTab] = useState<"gradient" | "solid">("gradient");

  const update = (u: Partial<NewBookFields>) => setFields((x) => ({ ...x, ...u }));
  const preview = { ...fields, id: "prev" } as Book;

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>New Book</h2>
          <button className="ibtn tip" data-tip="Close" onClick={onClose}><X size={16}/></button>
        </div>

        {/* Cover preview */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <CoverArt book={preview} size="large"/>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="lbl">Title *</label>
            <input className="inp" value={fields.title} onChange={(e) => update({ title: e.target.value })} placeholder="My Amazing Book" autoFocus/>
          </div>
          <div>
            <label className="lbl">Subtitle</label>
            <input className="inp" value={fields.subtitle} onChange={(e) => update({ subtitle: e.target.value })} placeholder="A story of…"/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="lbl">Genre</label>
              <select className="inp" value={fields.genre} onChange={(e) => update({ genre: e.target.value })}>
                {GENRES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Word Goal</label>
              <input type="number" className="inp" value={fields.wordGoal} onChange={(e) => update({ wordGoal: Number(e.target.value) })} min={0} step={5000}/>
            </div>
          </div>

          <div>
            <label className="lbl">Publishing Targets</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["paperback", "hardcover", "ebook"] as const).map((target) => {
                const active = fields.publishing.formatTargets.includes(target);
                return (
                  <button
                    key={target}
                    className={`tab-pill ${active ? "on" : "off"}`}
                    onClick={() =>
                      update({
                        publishing: {
                          ...fields.publishing,
                          formatTargets: active
                            ? fields.publishing.formatTargets.filter((item) => item !== target)
                            : [...fields.publishing.formatTargets, target],
                        },
                      })
                    }
                  >
                    {target}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="lbl">Trim Size</label>
              <select
                className="inp"
                value={fields.publishing.trim.preset}
                onChange={(e) => {
                  const preset = e.target.value as keyof typeof TRIM_PRESETS;
                  update({
                    publishing: {
                      ...fields.publishing,
                      trim: TRIM_PRESETS[preset] ?? fields.publishing.trim,
                    },
                  });
                }}
              >
                {Object.values(TRIM_PRESETS).map((trim) => (
                  <option key={trim.preset} value={trim.preset}>
                    {trim.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl">Interior Paper</label>
              <select
                className="inp"
                value={fields.publishing.paperType}
                onChange={(e) =>
                  update({
                    publishing: {
                      ...fields.publishing,
                      paperType: e.target.value as Book["publishing"]["paperType"],
                    },
                  })
                }
              >
                <option value="white">White</option>
                <option value="cream">Cream</option>
                <option value="color">Color</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="lbl">Interior Type</label>
              <select
                className="inp"
                value={fields.publishing.interiorType}
                onChange={(e) =>
                  update({
                    publishing: {
                      ...fields.publishing,
                      interiorType: e.target.value as Book["publishing"]["interiorType"],
                    },
                  })
                }
              >
                <option value="black_white">Black & White</option>
                <option value="premium_black_white">Premium B&W</option>
                <option value="standard_color">Standard Color</option>
                <option value="premium_color">Premium Color</option>
              </select>
            </div>
            <div>
              <label className="lbl">Binding Direction</label>
              <select
                className="inp"
                value={fields.publishing.bindingDirection}
                onChange={(e) =>
                  update({
                    publishing: {
                      ...fields.publishing,
                      bindingDirection: e.target.value as Book["publishing"]["bindingDirection"],
                    },
                  })
                }
              >
                <option value="ltr">Left to Right</option>
                <option value="rtl">Right to Left</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {([
              ["bleed", "Interior bleed"],
              ["chapterStartsOnRecto", "Chapters start on right-hand page"],
              ["includePageNumbers", "Include page numbers"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                className={`tab-pill ${fields.publishing[key] ? "on" : "off"}`}
                onClick={() =>
                  update({
                    publishing: {
                      ...fields.publishing,
                      [key]: !fields.publishing[key],
                    },
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: "12px 14px", borderRadius: 10, background: theme.surfaceAlt, fontSize: 12, color: theme.textMuted, lineHeight: 1.65 }}>
            Publishing guide:
            Pick the print and ebook targets you care about first. Trim size, bleed, and interior paper affect page
            count, spine width, and final cover dimensions. These defaults are tuned for common print-on-demand
            marketplace requirements, with the clearest published rules coming from Amazon KDP.
          </div>

          {/* Cover designer */}
          <div>
            <label className="lbl">Cover Design</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {(["gradient", "solid"] as const).map((id) => (
                <button key={id} onClick={() => { setCoverTab(id); update({ coverType: id }); }}
                  className={`tab-pill ${coverTab === id ? "on" : "off"}`} style={{ fontSize: 12, padding: "6px 14px" }}>
                  {id === "gradient" ? "Gradient" : "Solid Color"}
                </button>
              ))}
            </div>

            {coverTab === "gradient" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
                  {COVER_GRADIENTS.map((g) => (
                    <div key={g.id} onClick={() => update({ coverGradient: g.id, coverType: "gradient" })}
                      style={{ height: 36, borderRadius: 8, background: `linear-gradient(${fields.coverAngle}deg,${g.a},${g.b})`, cursor: "pointer",
                        border: `2px solid ${fields.coverGradient === g.id ? "#fff" : "transparent"}`,
                        boxShadow: fields.coverGradient === g.id ? `0 0 0 2px ${theme.accent}` : "none", transition: "all 0.15s" }}
                      title={g.label}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label className="lbl" style={{ margin: 0, whiteSpace: "nowrap" }}>Angle</label>
                  <input type="range" min={0} max={360} value={fields.coverAngle} onChange={(e) => update({ coverAngle: Number(e.target.value) })} style={{ flex: 1, accentColor: theme.accent }}/>
                  <span style={{ fontSize: 12, color: theme.textFaint, minWidth: 36 }}>{fields.coverAngle}°</span>
                </div>
              </>
            )}

            {coverTab === "solid" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {COVER_SOLID_COLORS.map((c) => (
                  <div key={c} onClick={() => update({ coverSolidColor: c, coverType: "solid" })}
                    style={{ width: 32, height: 32, borderRadius: 8, background: c, cursor: "pointer",
                      border: `2px solid ${fields.coverSolidColor === c ? "#fff" : "transparent"}`,
                      boxShadow: fields.coverSolidColor === c ? `0 0 0 2px ${theme.accent}` : "none", transition: "all 0.15s" }}
                  />
                ))}
                <input type="color" value={fields.coverSolidColor} onChange={(e) => update({ coverSolidColor: e.target.value, coverType: "solid" })}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${theme.border}`, cursor: "pointer", padding: 0 }}/>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <label className="lbl">Cover Texture</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {COVER_TEXTURES_OVERLAY.map((t) => (
                  <button key={t.id} onClick={() => update({ coverTextureOverlay: t.id })}
                    style={{ padding: "5px 10px", borderRadius: 7,
                      border: `1px solid ${fields.coverTextureOverlay === t.id ? theme.accent : theme.border}`,
                      background: fields.coverTextureOverlay === t.id ? `${theme.accent}18` : "transparent",
                      cursor: "pointer", fontSize: 11, fontFamily: "var(--ui-font)",
                      color: fields.coverTextureOverlay === t.id ? theme.accent : theme.textMuted,
                      fontWeight: fields.coverTextureOverlay === t.id ? 700 : 400 }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => { if (!fields.title.trim()) return; onCreate(fields); onClose(); }}
            disabled={!fields.title.trim()}
          >
            <BookOpen size={14}/>Create Book
          </button>
        </div>
      </div>
    </div>
  );
}
