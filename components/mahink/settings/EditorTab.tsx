import type { AppData, Theme } from "@/lib/types";
import { playTypewriterSound } from "@/lib/typewriterSound";

interface Props {
  data: AppData;
  theme: Theme;
  upSettings: (u: Partial<AppData["settings"]>) => void;
}

const PARAGRAPH_WIDTH_OPTIONS = ["narrow", "medium", "wide", "full"] as const;

const TOGGLE_OPTIONS = [
  { k: "typewriterMode"      as const, l: "Typewriter scroll mode"       },
  { k: "showWordCountAlways" as const, l: "Always show word count badge" },
  { k: "focusModeDefault"    as const, l: "Start in focus mode"          },
  { k: "spellingCheck"       as const, l: "Browser spell check"          },
  { k: "typewriterSound"     as const, l: "Typewriter sound"              },
];

const TYPEWRITER_SOUND_PRESETS = [
  { id: "mechanical" as const, label: "Mechanical" },
  { id: "soft" as const, label: "Soft" },
  { id: "electric" as const, label: "Electric" },
  { id: "classic" as const, label: "Classic" },
  { id: "minimal" as const, label: "Minimal" },
] as const;

export default function EditorTab({ data, theme, upSettings }: Props) {

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* Font size & line spacing */}
      {([
        { l: `Font Size — ${data.settings.fontSize}px`, k: "fontSize"   as const, min: 13,  max: 24,  step: 1    },
        { l: `Line Spacing — ${data.settings.lineHeight}×`, k: "lineHeight" as const, min: 1.4, max: 2.4, step: 0.05 },
      ]).map(({ l, k, min, max, step }) => (
        <div key={k}>
          <label className="lbl">{l}</label>
          <input
            type="range" min={min} max={max} step={step}
            value={data.settings[k] as number}
            onChange={(e) => upSettings({ [k]: Number(e.target.value) })}
            style={{ width: "100%", accentColor: theme.accent }}
          />
        </div>
      ))}

      {/* Paragraph width */}
      <div>
        <label className="lbl">Paragraph Width</label>
        <div style={{ display: "flex", gap: 8 }}>
          {PARAGRAPH_WIDTH_OPTIONS.map((w) => (
            <button
              key={w}
              onClick={() => upSettings({ paragraphWidth: w })}
              style={{
                flex: 1, padding: "9px 4px", borderRadius: 9,
                border: `1px solid ${data.settings.paragraphWidth === w ? theme.accent : theme.border}`,
                background: data.settings.paragraphWidth === w ? `${theme.accent}18` : "transparent",
                cursor: "pointer", fontSize: 12, fontFamily: "var(--ui-font)",
                color: data.settings.paragraphWidth === w ? theme.accent : theme.textMuted,
                fontWeight: data.settings.paragraphWidth === w ? 700 : 400,
                textTransform: "capitalize", transition: "all 0.15s",
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Daily word goal */}
      <div>
        <label className="lbl">Daily Word Goal</label>
        <input
          type="number" className="inp"
          value={data.settings.dailyGoal || 500}
          onChange={(e) => upSettings({ dailyGoal: Number(e.target.value) })}
          min={50} max={10000} step={50}
        />
      </div>

      {/* Toggle options */}
      <div>
        <label className="lbl">Editor Options</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TOGGLE_OPTIONS.map(({ k, l }) => (
            <div
              key={k}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 9, border: `1px solid ${theme.border}`, background: theme.surface }}
            >
              <span style={{ fontSize: 13, color: theme.text }}>{l}</span>
              <button
                onClick={() => upSettings({ [k]: !data.settings[k] })}
                style={{ width: 40, height: 22, borderRadius: 20, background: data.settings[k] ? theme.accent : theme.surfaceAlt, border: "none", cursor: "pointer", transition: "background 0.2s", position: "relative" }}
              >
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: data.settings[k] ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
              </button>
            </div>
          ))}
        </div>
        {data.settings.typewriterSound && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12, padding: 12, borderRadius: 9, border: `1px solid ${theme.border}`, background: theme.surfaceAlt }}>
            <div>
              <label className="lbl">Sound preset</label>
              <select
                className="inp"
                value={data.settings.typewriterSoundPreset ?? "mechanical"}
                onChange={(e) => {
                  const preset = e.target.value as typeof data.settings.typewriterSoundPreset;
                  upSettings({ typewriterSoundPreset: preset });
                  playTypewriterSound(preset ?? "mechanical", data.settings.typewriterSoundVolume ?? 50);
                }}
                style={{ width: "100%", marginTop: 4 }}
              >
                {TYPEWRITER_SOUND_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl">Volume — {data.settings.typewriterSoundVolume ?? 50}%</label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={data.settings.typewriterSoundVolume ?? 50}
                onChange={(e) => {
                  const vol = Number(e.target.value);
                  upSettings({ typewriterSoundVolume: vol });
                  playTypewriterSound(data.settings.typewriterSoundPreset ?? "mechanical", vol);
                }}
                style={{ width: "100%", accentColor: theme.accent, marginTop: 4 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
