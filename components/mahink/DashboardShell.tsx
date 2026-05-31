"use client";

import { useState } from "react";
import { BookOpen, Target, Palette, Type, User, Bot, Settings, Plus, Menu, X } from "lucide-react";
import MahinkWordmark from "./ui/MahinkWordmark";
import type { AppView, Theme } from "@/lib/types";

type DashView = Exclude<AppView, "editor">;

const NAV_SECTIONS: Array<{
  label?: string;
  items: Array<{ id: DashView; label: string; Icon: typeof BookOpen }>;
}> = [
  {
    items: [
      { id: "library",    label: "Library",    Icon: BookOpen  },
      { id: "goals",      label: "Goals",      Icon: Target    },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "appearance", label: "Appearance", Icon: Palette   },
      { id: "fonts",      label: "Fonts",      Icon: Type      },
      { id: "profile",    label: "Author",     Icon: User      },
      { id: "ai",         label: "AI",         Icon: Bot       },
    ],
  },
  {
    items: [
      { id: "settings",   label: "Settings",   Icon: Settings  },
    ],
  },
];

const ALL_LABELS: Record<DashView, string> = {
  library:    "Library",
  goals:      "Goals",
  appearance: "Appearance",
  fonts:      "Fonts",
  profile:    "Author",
  ai:         "AI Providers",
  settings:   "Settings",
};

interface Props {
  theme: Theme;
  isMobile: boolean;
  activeView: DashView;
  onNavigate: (v: AppView) => void;
  onNewBook: () => void;
  children: React.ReactNode;
}

export default function DashboardShell({
  theme,
  isMobile,
  activeView,
  onNavigate,
  onNewBook,
  children,
}: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const section = ALL_LABELS[activeView] ?? "MahInk";
  const isLibrary = activeView === "library";

  const navContent = (
    <>
      {NAV_SECTIONS.map((section, si) => (
        <div key={si} style={{ marginBottom: si < NAV_SECTIONS.length - 1 ? 8 : 0 }}>
          {section.label && (
            <p style={{ margin: "4px 0 6px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.textFaint }}>
              {section.label}
            </p>
          )}
          {si > 0 && !section.label && (
            <div style={{ height: 1, background: theme.border, margin: "6px 10px 8px" }} />
          )}
          {section.items.map(({ id, label, Icon }) => {
            const on = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { onNavigate(id); setMobileNavOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontFamily: "var(--ui-font)", fontSize: 13, fontWeight: on ? 700 : 500,
                  textAlign: "left", background: on ? `${theme.accent}1e` : "transparent",
                  color: on ? theme.accent : theme.textMuted,
                  borderLeft: on ? `3px solid ${theme.accent}` : "3px solid transparent",
                  transition: "background 0.12s, color 0.12s",
                }}
              >
                <Icon size={16} strokeWidth={on ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      {!isMobile && (
        <aside style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${theme.border}`, background: theme.surfaceAlt, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${theme.border}` }}>
            <MahinkWordmark size="sm" />
          </div>
          <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {navContent}
          </nav>
        </aside>
      )}

      {/* ── Mobile nav drawer overlay ──────────────────────── */}
      {isMobile && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 260, background: theme.surfaceAlt, borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "4px 0 20px rgba(0,0,0,0.15)" }}
          >
            <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <MahinkWordmark size="sm" />
              <button onClick={() => setMobileNavOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.textMuted, padding: 4 }}><X size={18}/></button>
            </div>
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
              {navContent}
            </nav>
          </div>
        </div>
      )}

      {/* ── Main column: fixed header + scrollable content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
        <header style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "14px 16px" : "14px 28px", borderBottom: `1px solid ${theme.border}`, background: theme.surface }}>
          {isMobile && (
            <button onClick={() => setMobileNavOpen(true)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.textMuted, padding: 4, marginRight: 4 }}>
              <Menu size={20}/>
            </button>
          )}
          {isMobile && <MahinkWordmark size="sm" />}
          <h1 style={{ flex: 1, margin: 0, fontFamily: "var(--ed-font)", fontSize: isMobile ? 18 : 20, fontWeight: 700, color: theme.text, minWidth: 0 }}>
            {section}
          </h1>
          {isLibrary && (
            <button type="button" className="btn btn-primary" style={{ fontSize: 13 }} onClick={onNewBook}>
              <Plus size={14} /> New Book
            </button>
          )}
        </header>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, background: theme.bg }}>
          {children}
        </div>
      </div>
    </div>
  );
}
