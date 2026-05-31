import type { AppData, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  upSettings: (u: Partial<AppData["settings"]>) => void;
}

export default function ProfileTab({ data, theme, upSettings }: Props) {
  const initial = (data.settings.authorName || "A")[0].toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: `linear-gradient(135deg,${theme.accent},${theme.accentLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontFamily: "var(--ed-font)", color: "#fff", fontWeight: 700,
          flexShrink: 0, boxShadow: `0 4px 16px ${theme.shadow}`,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <label className="lbl">Pen Name / Author Name</label>
          <input
            className="inp"
            value={data.settings.authorName || ""}
            onChange={(e) => upSettings({ authorName: e.target.value })}
            placeholder="Your author name…"
          />
          <p style={{ fontSize: 11, color: theme.textFaint, marginTop: 4 }}>
            Appears on exported PDFs and the library greeting
          </p>
        </div>
      </div>

      <div>
        <label className="lbl">Author Bio</label>
        <textarea
          className="ta"
          rows={4}
          value={data.settings.authorBio || ""}
          onChange={(e) => upSettings({ authorBio: e.target.value })}
          placeholder="A short bio included at the end of exported PDFs…"
        />
      </div>
    </div>
  );
}
