"use client";

import { useState } from "react";
import { Plus, Pencil, ArrowUp, ArrowDown, Trash2, FileText, Check } from "lucide-react";
import { countWords } from "@/lib/utils";
import { CHAPTER_STATUSES } from "@/lib/constants";
import type { Book, Chapter, Theme } from "@/lib/types";

interface Props {
  chapters: Chapter[];
  activeId: string;
  theme: Theme;
  book: Book;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onRename: (id: string, title: string) => void;
  onStatus: (id: string, status: string) => void;
}

export default function ChapterSidebar({
  chapters, activeId, theme, book,
  onSelect, onAdd, onDelete, onMove, onRename,
}: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [hoverId, setHoverId] = useState<string | null>(null);

  const totalWords = chapters.reduce((acc, c) => acc + countWords(c.content), 0);

  const iconBtn = (
    label: string,
    Icon: React.ElementType,
    onClick: (e: React.MouseEvent) => void,
    disabled = false,
    danger = false,
  ) => (
    <button
      key={label}
      className="tip"
      data-tip={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(e); }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 7, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        transition: "background 0.12s",
        background: "rgba(255,255,255,0.15)",
        color: "#fff",
        outline: "1px solid rgba(255,255,255,0.25)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.28)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)";
      }}
    >
      <Icon size={13}/>
    </button>
  );

  return (
    <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 3, height: "100%" }}>

      {/* Book info card */}
      <div style={{ marginBottom: 10, padding: "10px 12px", background: theme.surfaceAlt, borderRadius: 10 }}>
        <p style={{ fontFamily: "var(--ed-font)", fontSize: 13, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>
          {book.title}
        </p>
        <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
          {totalWords.toLocaleString()} total words
          {book.wordGoal > 0 && (
            <span style={{ color: theme.textFaint }}>
              {" "}/ {book.wordGoal.toLocaleString()} goal
            </span>
          )}
        </p>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px", marginBottom: 6 }}>
        <span className="lbl" style={{ margin: 0 }}>Chapters</span>
        <button
          onClick={onAdd}
          title="Add new chapter"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 7,
            background: theme.accent, color: "#fff",
            border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "var(--ui-font)",
            boxShadow: `0 2px 8px ${theme.shadow}`,
          }}
        >
          <Plus size={12}/>New
        </button>
      </div>

      {/* Chapter list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {chapters.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 12px", textAlign: "center" }}>
            <FileText size={28} style={{ opacity: 0.2, color: theme.textMuted }}/>
            <p style={{ fontSize: 12, color: theme.textMuted }}>No chapters yet</p>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={onAdd}>
              <Plus size={12}/>Add Chapter
            </button>
          </div>
        )}

        {chapters.map((ch, i) => {
          const status    = CHAPTER_STATUSES.find((s) => s.id === ch.status);
          const wordCount = countWords(ch.content);
          const isActive  = ch.id === activeId;
          const isHovered = hoverId === ch.id;

          return (
            <div
              key={ch.id}
              onClick={() => onSelect(ch.id)}
              onMouseEnter={() => setHoverId(ch.id)}
              onMouseLeave={() => setHoverId(null)}
              style={{
                borderRadius: 10,
                marginBottom: 5,
                border: `1.5px solid ${isActive ? theme.accent : (isHovered ? `${theme.accent}50` : theme.border)}`,
                background: isActive
                  ? theme.accent
                  : isHovered ? theme.surfaceAlt : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                overflow: "hidden",
              }}
            >
              {/* Main content row */}
              <div style={{ padding: "9px 11px 8px", display: "flex", alignItems: "flex-start", gap: 9 }}>
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                  background: isActive ? "rgba(255,255,255,0.95)" : (status?.color ?? theme.textFaint),
                  boxShadow: isActive ? "0 0 0 2px rgba(255,255,255,0.35)" : "none",
                }}/>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {renamingId === ch.id ? (
                    <input
                      value={renameValue}
                      className="inp"
                      style={{ padding: "2px 6px", fontSize: 13 }}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => { onRename(ch.id, renameValue); setRenamingId(null); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { onRename(ch.id, renameValue); setRenamingId(null); }
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <p style={{
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                      lineHeight: 1.35,
                      color: isActive ? "#fff" : theme.text,
                      wordBreak: "break-word",
                    }}>
                      {ch.title}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    <span style={{
                      fontSize: 11,
                      color: isActive ? "rgba(255,255,255,0.78)" : theme.textMuted,
                    }}>
                      {wordCount > 0 ? `${wordCount.toLocaleString()} words` : "Empty"}
                    </span>
                    {status && (
                      <>
                        <span style={{ color: isActive ? "rgba(255,255,255,0.4)" : theme.textFaint, fontSize: 10 }}>·</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: isActive ? "rgba(255,255,255,0.7)" : status.color,
                        }}>
                          {status.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons row — icon-only, right-aligned */}
              {isActive && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: "5px 10px 8px",
                    borderTop: "1px solid rgba(255,255,255,0.2)",
                    display: "flex", gap: 4, alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  {iconBtn("Rename chapter",    Pencil,    () => { setRenamingId(ch.id); setRenameValue(ch.title); })}
                  {iconBtn("Move up",           ArrowUp,   () => onMove(ch.id, "up"),   i === 0)}
                  {iconBtn("Move down",         ArrowDown, () => onMove(ch.id, "down"), i === chapters.length - 1)}
                  {iconBtn("Delete chapter",    Trash2,    () => { if (window.confirm("Delete this chapter?")) onDelete(ch.id); }, false, true)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
