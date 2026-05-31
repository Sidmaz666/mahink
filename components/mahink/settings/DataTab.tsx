import { useRef } from "react";
import { BarChart2, DownloadCloud, Info, UploadCloud, Shield } from "lucide-react";
import { STORAGE_KEY } from "@/lib/constants";
import { normalizeData, saveData } from "@/lib/utils";
import type { AppData, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  notify: (msg: string, type?: "ok" | "err") => void;
}

function getStorageSize(): string {
  try {
    return (new Blob([localStorage.getItem(STORAGE_KEY) || ""]).size / 1024).toFixed(1);
  } catch {
    return "?";
  }
}

export default function DataTab({ data, theme, notify }: Props) {
  const size = getStorageSize();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `mahink-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Backup exported successfully!");
  };

  const handleExportAiSettings = () => {
    const sanitized = {
      ...data.settings.ai,
      activeProviderId: data.settings.ai.activeProviderId,
      providerProfiles: data.aiProviderProfiles.map((profile) => ({
        ...profile,
        apiKey: "",
      })),
    };
    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mahink-ai-settings-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("AI settings exported without API keys.");
  };

  const handleImport = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = normalizeData(JSON.parse(raw));
      saveData(parsed);
      notify("Backup imported. Reloading…");
      window.location.reload();
    } catch (error) {
      notify(`Import failed: ${(error as Error).message}`, "err");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>Local Storage Used</p>
          <p style={{ fontSize: 12, color: theme.textMuted }}>{size} KB</p>
        </div>
        <BarChart2 size={20} color={theme.accent}/>
      </div>

      <button className="btn btn-surf" onClick={handleExport} style={{ gap: 8, justifyContent: "flex-start" }}>
        <DownloadCloud size={15}/>Export Full Backup (JSON)
      </button>

      <button className="btn btn-surf" onClick={handleExportAiSettings} style={{ gap: 8, justifyContent: "flex-start" }}>
        <Shield size={15}/>Export AI Settings (without keys)
      </button>

      <button className="btn btn-surf" onClick={() => importRef.current?.click()} style={{ gap: 8, justifyContent: "flex-start" }}>
        <UploadCloud size={15}/>Import / Restore Backup
      </button>
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImport(file);
          e.target.value = "";
        }}
      />

      <div style={{ padding: "14px 16px", background: theme.surfaceAlt, borderRadius: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Info size={14} color={theme.textFaint} style={{ flexShrink: 0, marginTop: 1 }}/>
        <p style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
          All data is stored locally on this device. Your writing and API keys stay in your browser unless you explicitly call an external AI provider. Export backups regularly to prevent data loss, and remember that imported backups replace the local project state after reload.
        </p>
      </div>
    </div>
  );
}
