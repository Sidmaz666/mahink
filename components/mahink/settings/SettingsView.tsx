"use client";

import { useState } from "react";
import { Edit3, DownloadCloud } from "lucide-react";
import EditorTab from "./EditorTab";
import DataTab   from "./DataTab";
import type { AppData, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  isMobile: boolean;
  upSettings: (u: Partial<AppData["settings"]>) => void;
  notify: (msg: string, type?: "ok" | "err") => void;
}

type SettingsTab = "editor" | "data";

const TABS: Array<{ id: SettingsTab; label: string; Icon: React.ElementType }> = [
  { id: "editor", label: "Editor",  Icon: Edit3         },
  { id: "data",   label: "Data",    Icon: DownloadCloud },
];

export default function SettingsView({
  data,
  theme,
  isMobile,
  upSettings,
  notify,
}: Props) {
  const [tab, setTab] = useState<SettingsTab>("editor");

  return (
    <div className="fade-in" style={{ padding: isMobile ? "16px 16px 88px" : "24px 28px 40px" }}>

      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-pill ${tab === id ? "on" : "off"}`}
            onClick={() => setTab(id)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "editor" && (
        <EditorTab data={data} theme={theme} upSettings={upSettings} />
      )}
      {tab === "data" && (
        <DataTab data={data} theme={theme} notify={notify} />
      )}
    </div>
  );
}
