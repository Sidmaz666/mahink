"use client";

import { useState } from "react";
import { MoreVertical, Edit3, Archive, Trash2 } from "lucide-react";
import Book3D from "../ui/Book3D";
import type { Book, Theme } from "@/lib/types";

const CH = 168;

interface Props {
  book: Book;
  theme: Theme;
  words: number;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function BookCard({ book, theme, words, onOpen, onEdit, onArchive, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = book.wordGoal ? Math.min(100, Math.round((words / book.wordGoal) * 100)) : 0;

  const menuItems = [
    { Icon: Edit3,   label: "Edit Cover", action: () => { onEdit();    setMenuOpen(false); } },
    { Icon: Archive, label: book.isArchived ? "Restore" : "Archive", action: () => { onArchive(); setMenuOpen(false); } },
    { Icon: Trash2,  label: "Delete",     action: () => { onDelete();  setMenuOpen(false); }, danger: true },
  ];

  return (
    <div className="card" style={{ cursor: "pointer", position: "relative", padding: 14, overflow: "visible", transform: "none" }} onClick={onOpen}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, minHeight: CH + 14 }}>
        <Book3D book={book}/>
      </div>

      <h3 style={{
        fontFamily: "var(--ed-font)", fontSize: 15, fontWeight: 600,
        color: theme.text, marginBottom: 2,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {book.title || "Untitled"}
      </h3>

      {book.genre && (
        <span style={{ fontSize: 10, color: theme.textFaint, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {book.genre}
        </span>
      )}

      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>
          {words.toLocaleString()} words
        </span>
        {book.wordGoal > 0 && (
          <span style={{ fontSize: 11, color: theme.textFaint }}>{pct}%</span>
        )}
      </div>
      {book.wordGoal > 0 && (
        <div className="pbar" style={{ marginTop: 5 }}>
          <div className="pfill" style={{ width: `${pct}%` }}/>
        </div>
      )}

      {/* Context menu */}
      <div style={{ position: "absolute", top: 10, right: 10 }} onClick={(e) => e.stopPropagation()}>
        <button
          className="ibtn tip"
          data-tip="More options"
          style={{ width: 26, height: 26, borderRadius: 6 }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreVertical size={13}/>
        </button>
        {menuOpen && (
          <div style={{
            position: "absolute", right: 0, top: "100%",
            background: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: 10, padding: 6, zIndex: 100,
            minWidth: 148, boxShadow: `0 6px 28px ${theme.shadow}`,
          }}>
            {menuItems.map(({ Icon, label, action, danger }) => (
              <button
                key={label}
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "flex-start", padding: "8px 10px", fontSize: 13, color: danger ? "#fc8181" : "inherit" }}
                onClick={action}
              >
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
