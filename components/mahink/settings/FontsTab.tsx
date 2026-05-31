"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { FONTS } from "@/lib/constants";
import type { AppData, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  upSettings: (u: Partial<AppData["settings"]>) => void;
}

const FONT_CATEGORIES = ["Serif", "Display", "Mono", "Sans", "Cursive"] as const;

const CAT_DESCRIPTIONS: Record<string, string> = {
  Serif:   "Classic book typography — ideal for long-form prose",
  Display: "Decorative & expressive — great for titles and mood",
  Mono:    "Typewriter-style — perfect for scripts and drafts",
  Sans:    "Clean & modern — UI-friendly readability",
  Cursive: "Handwriting & script — personal, elegant flourishes",
};

export default function FontsTab({ data, theme, upSettings }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    for (const key of ["editorFontId", "uiFontId"] as const) {
      init[key] = {};
      for (const cat of FONT_CATEGORIES) {
        init[key][cat] = true;
      }
    }
    return init;
  });

  const toggle = (key: string, cat: string) =>
    setCollapsed((p) => ({ ...p, [key]: { ...p[key], [cat]: !p[key]?.[cat] } }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {(["editorFontId", "uiFontId"] as const).map((key) => (
        <div key={key}>
          <div style={{ marginBottom: 14 }}>
            <label className="lbl" style={{ marginBottom: 4 }}>
              {key === "editorFontId" ? "Writing / Editor Font" : "UI Interface Font"}
            </label>
            <p style={{ fontSize: 12, color: theme.textMuted }}>
              {key === "editorFontId"
                ? "Applied to all text you write in the editor"
                : "Applied to menus, buttons, labels and the entire app UI"}
            </p>
          </div>

          {FONT_CATEGORIES.map((cat) => {
            const list = Object.values(FONTS).filter((f) => f.category === cat);
            if (!list.length) return null;
            const isOpen = !collapsed[key]?.[cat];
            const selected = list.find((f) => f.id === data.settings[key]);

            return (
              <div key={cat} style={{ marginBottom: 8, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
                {/* Category header — clickable to collapse */}
                <button
                  onClick={() => toggle(key, cat)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "10px 14px",
                    background: isOpen ? `${theme.accent}0d` : theme.surface,
                    border: "none", cursor: "pointer",
                    borderBottom: isOpen ? `1px solid ${theme.border}` : "none",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isOpen
                      ? <ChevronDown size={14} color={theme.textMuted}/>
                      : <ChevronRight size={14} color={theme.textMuted}/>}
                    <div style={{ textAlign: "left" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{cat}</span>
                      <span style={{ fontSize: 11, color: theme.textFaint, marginLeft: 8 }}>
                        {CAT_DESCRIPTIONS[cat]}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {selected && (
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20,
                        background: `${theme.accent}20`, color: theme.accent, fontWeight: 600,
                      }}>
                        {selected.label}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: theme.textFaint }}>{list.length} fonts</span>
                  </div>
                </button>

                {/* Font list — collapsible */}
                {isOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {list.map((f, i) => {
                      const isSelected = data.settings[key] === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => upSettings({ [key]: f.id })}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "11px 14px",
                            borderBottom: i < list.length - 1 ? `1px solid ${theme.border}` : "none",
                            background: isSelected ? `${theme.accent}12` : "transparent",
                            cursor: "pointer", transition: "background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = `${theme.surfaceAlt}`;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = isSelected ? `${theme.accent}12` : "transparent";
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                              fontSize: 17, fontFamily: f.stack, color: isSelected ? theme.accent : theme.text,
                              display: "block", lineHeight: 1.3,
                            }}>
                              {f.label}
                            </span>
                            <span style={{ fontSize: 11, color: theme.textFaint, display: "block", marginTop: 1 }}>
                              {f.feel}
                            </span>
                          </div>
                          <span style={{
                            fontSize: 13, fontFamily: f.stack, color: theme.textMuted,
                            fontStyle: "italic", flexShrink: 0,
                          }}>
                            "The quick brown fox…"
                          </span>
                          {isSelected && (
                            <div style={{
                              width: 20, height: 20, borderRadius: "50%",
                              background: theme.accent, display: "flex",
                              alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <Check size={11} color="#fff"/>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
