"use client";

import { useState } from "react";
import {
  BookOpen, Plus, Search, Grid, List, Archive,
  FileText, PenTool, Flame, Trash2, Wand2, Palette,
  BarChart2, TrendingUp,
} from "lucide-react";
import BookCard from "./BookCard";
import BookRow  from "./BookRow";
import type { AppData, Book, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  isMobile: boolean;
  onOpenBook: (id: string) => void;
  onCreateBook: () => void;
  onDeleteBook: (id: string) => void;
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  bwc: Record<string, number>;
  todayWords: number;
  streak: number;
  searchQ: string;
  setSearchQ: (q: string) => void;
  upSettings: (u: object) => void;
  setShowBookEdit: (id: string | null) => void;
  onOpenProfileSettings: () => void;
}

export default function LibraryView({
  data, theme, isMobile, onOpenBook, onCreateBook, onDeleteBook,
  onUpdateBook, bwc, todayWords, streak, searchQ, setSearchQ,
  setShowBookEdit, onOpenProfileSettings,
}: Props) {
  const [vmMode, setVmMode]             = useState<"grid" | "list">("grid");
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDel, setConfirmDel]     = useState<string | null>(null);

  const active   = data.books.filter((b) => !b.isArchived);
  const archived = data.books.filter((b) => b.isArchived);
  const source   = showArchived ? archived : active;
  const filtered = source.filter((b) =>
    !searchQ ||
    b.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
    b.genre?.toLowerCase().includes(searchQ.toLowerCase()),
  );
  const totalW = Object.values(bwc).reduce((a, b) => a + b, 0);

  const pad   = isMobile ? "16px 16px 88px" : "24px 28px 40px";
  const maxW  = "100%";

  return (
    <div className="fade-in" style={{ width: "100%", maxWidth: maxW, margin: 0, padding: pad }}>

      {/* ── Stats row ── */}
      {!isMobile && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Books",       value: active.length,                     icon: BookOpen,   sub: active.length === 1 ? "in your library" : "in your library" },
            { label: "Total words", value: totalW.toLocaleString(),           icon: FileText,   sub: "written so far" },
            { label: "Today",       value: `${todayWords.toLocaleString()}`,  icon: TrendingUp, sub: "words today" },
            { label: "Streak",      value: `${streak}`,                       icon: Flame,      sub: `day${streak !== 1 ? "s" : ""} in a row` },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div
              key={label}
              className="card"
              style={{
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: theme.surface,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" }}>{label}</span>
                <Icon size={13} style={{ color: theme.accentLight, opacity: 0.8 }} />
              </div>
              <span style={{ fontFamily: "var(--ed-font)", fontSize: 28, fontWeight: 700, color: theme.text, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: 11, color: theme.textMuted }}>{sub}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Welcome strip (only if author name set) ── */}
      {data.settings.authorName && !isMobile && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            marginBottom: 22,
            background: `linear-gradient(135deg, ${theme.accent}12 0%, transparent 60%)`,
            border: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${theme.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PenTool size={14} color={theme.accent} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: theme.text }}>
                Welcome back, <span style={{ color: theme.accent }}>{data.settings.authorName}</span>
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: theme.textMuted, marginTop: 1 }}>Your workspace is ready</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: `${theme.accent}14`, border: `1px solid ${theme.accent}30` }}>
              <Wand2 size={12} color={theme.accent} />
              <span style={{ fontSize: 11, color: theme.accent, fontWeight: 700 }}>AI writing</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: `${theme.accent}14`, border: `1px solid ${theme.accent}30` }}>
              <Palette size={12} color={theme.accent} />
              <span style={{ fontSize: 11, color: theme.accent, fontWeight: 700 }}>Covers</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: `${theme.accent}14`, border: `1px solid ${theme.accent}30` }}>
              <BarChart2 size={12} color={theme.accent} />
              <span style={{ fontSize: 11, color: theme.accent, fontWeight: 700 }}>Goals</span>
            </div>
          </div>
        </div>
      )}

      {/* Set author name prompt */}
      {!data.settings.authorName && !isMobile && (
        <button
          onClick={onOpenProfileSettings}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "12px 18px", borderRadius: 12, marginBottom: 22, cursor: "pointer",
            background: `${theme.accent}08`, border: `1px dashed ${theme.accent}40`,
            fontFamily: "var(--ui-font)", textAlign: "left",
          }}
        >
          <span style={{ fontSize: 13, color: theme.accent, fontWeight: 700 }}>+ Set your author profile</span>
          <span style={{ fontSize: 12, color: theme.textMuted }}>Personalise the workspace</span>
        </button>
      )}

      {/* ── Library controls ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: theme.textFaint, pointerEvents: "none" }} />
          <input
            className="inp"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search books…"
            style={{ paddingLeft: 32 }}
          />
        </div>
        <button className={`ibtn tip${vmMode === "grid" ? " on" : ""}`} data-tip="Grid view"  onClick={() => setVmMode("grid")}><Grid  size={16}/></button>
        <button className={`ibtn tip${vmMode === "list" ? " on" : ""}`} data-tip="List view"  onClick={() => setVmMode("list")}><List  size={16}/></button>
        {archived.length > 0 && (
          <button
            className={`ibtn tip${showArchived ? " on" : ""}`}
            data-tip={showArchived ? "Hide archived" : "Show archived"}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive size={16}/>
          </button>
        )}
      </div>

      {/* Section label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: theme.textFaint }}>
          {showArchived ? "Archived books" : "Your library"} · {filtered.length}
        </p>
      </div>

      {/* ── Book list / grid ── */}
      {filtered.length === 0 ? (
        <div
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", padding: "80px 20px", color: theme.textFaint,
          }}
        >
          <BookOpen size={52} style={{ marginBottom: 18, opacity: 0.2 }} />
          <p style={{ fontFamily: "var(--ed-font)", fontSize: 22, marginBottom: 8, color: theme.textMuted }}>
            {showArchived ? "No archived books" : "Your library is empty"}
          </p>
          <p style={{ fontSize: 14, marginBottom: 28 }}>
            {showArchived ? "Archive books to see them here" : "Begin your writing journey today"}
          </p>
          {!showArchived && (
            <button className="btn btn-primary" onClick={onCreateBook}><Plus size={14}/>Create Your First Book</button>
          )}
        </div>
      ) : vmMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fill, minmax(240px, 1fr))",
            gap: isMobile ? 12 : 18,
          }}
        >
          {filtered.map((book) => (
            <BookCard
              key={book.id} book={book} theme={theme} words={bwc[book.id] || 0}
              onOpen={() => onOpenBook(book.id)}
              onEdit={() => setShowBookEdit(book.id)}
              onArchive={() => onUpdateBook(book.id, { isArchived: !book.isArchived })}
              onDelete={() => setConfirmDel(book.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((book) => (
            <BookRow
              key={book.id} book={book} theme={theme} words={bwc[book.id] || 0}
              onOpen={() => onOpenBook(book.id)}
              onEdit={() => setShowBookEdit(book.id)}
              onArchive={() => onUpdateBook(book.id, { isArchived: !book.isArchived })}
              onDelete={() => setConfirmDel(book.id)}
            />
          ))}
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {confirmDel && (
        <div className="modal-wrap" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "#fc818122", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={18} color="#fc8181" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>Delete this book?</p>
                <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>All chapters will be lost permanently.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: "#fc8181", color: "#fff" }}
                onClick={() => { onDeleteBook(confirmDel); setConfirmDel(null); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
