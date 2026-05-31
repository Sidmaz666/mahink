"use client";

import { Check, Sun, Moon } from "lucide-react";
import { THEMES } from "@/lib/constants";
import type { AppData, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  upSettings: (u: Partial<AppData["settings"]>) => void;
}

const LIGHT_THEMES = Object.values(THEMES).filter((t) => t.group === "Light");
const DARK_THEMES  = Object.values(THEMES).filter((t) => t.group === "Dark");

function ThemeGrid({ themes, currentId, onSelect }: {
  themes: Theme[];
  currentId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
      {themes.map((t) => {
        const isSelected = currentId === t.id;
        return (
          <div
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              borderRadius: 12, cursor: "pointer",
              border: `2px solid ${isSelected ? t.accent : t.border}`,
              backgroundColor: t.bg,
              backgroundImage: t.bgStyle,
              backgroundSize: "cover",
              overflow: "hidden",
              transition: "all 0.18s",
              boxShadow: isSelected ? `0 0 0 3px ${t.accent}55` : "none",
            }}
          >
            {/* Header strip */}
            <div style={{
              padding: "10px 12px 8px",
              background: t.surface,
              borderBottom: `1px solid ${t.border}`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {/* Mini cover spine */}
              <div style={{
                width: 6, height: 28, borderRadius: 2, flexShrink: 0,
                background: `linear-gradient(180deg, ${t.accentLight}, ${t.accent})`,
                boxShadow: `-1px 1px 4px rgba(0,0,0,0.25)`,
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: t.text, lineHeight: 1.1, fontFamily: t.uiFont }}>
                  {t.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.accent }}/>
                  <div style={{ width: 20, height: 4, borderRadius: 2, background: t.textFaint, opacity: 0.7 }}/>
                  <div style={{ width: 14, height: 4, borderRadius: 2, background: t.textFaint, opacity: 0.4 }}/>
                </div>
              </div>
              {isSelected && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: t.accent, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Check size={10} color="#fff"/>
                </div>
              )}
            </div>

            {/* Body — text lines preview */}
            <div style={{ padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ height: 5, borderRadius: 3, background: t.text, opacity: 0.7, width: "85%" }}/>
              <div style={{ height: 4, borderRadius: 3, background: t.textMuted, opacity: 0.55, width: "100%" }}/>
              <div style={{ height: 4, borderRadius: 3, background: t.textMuted, opacity: 0.4, width: "70%" }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AppearanceTab({ data, upSettings }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--txt-m)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--txt)" }}>App appearance</strong> — colours the whole workspace (library, goals, settings, editor toolbars).
        Per-book page colours are set in <strong>Edit book → Details → Book visual theme</strong>.
      </p>

      {/* Light Themes */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Sun size={14} style={{ color: "#c07800", flexShrink: 0 }}/>
          <label className="lbl" style={{ margin: 0 }}>Light Themes</label>
          <span style={{ fontSize: 11, color: "var(--txt-f)", marginLeft: 2 }}>
            {LIGHT_THEMES.length} themes
          </span>
        </div>
        <ThemeGrid
          themes={LIGHT_THEMES}
          currentId={data.settings.themeId}
          onSelect={(id) => upSettings({ themeId: id })}
        />
      </div>

      {/* Dark Themes */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Moon size={14} style={{ color: "#5090d0", flexShrink: 0 }}/>
          <label className="lbl" style={{ margin: 0 }}>Dark Themes</label>
          <span style={{ fontSize: 11, color: "var(--txt-f)", marginLeft: 2 }}>
            {DARK_THEMES.length} themes
          </span>
        </div>
        <ThemeGrid
          themes={DARK_THEMES}
          currentId={data.settings.themeId}
          onSelect={(id) => upSettings({ themeId: id })}
        />
      </div>

    </div>
  );
}
