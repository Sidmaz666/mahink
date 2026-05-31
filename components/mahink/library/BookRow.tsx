import { Edit3, Archive, Trash2 } from "lucide-react";
import CoverArt from "../ui/CoverArt";
import { fmtDate } from "@/lib/utils";
import type { Book, Theme } from "@/lib/types";

interface Props {
  book: Book;
  theme: Theme;
  words: number;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function BookRow({ book, theme, words, onOpen, onEdit, onArchive, onDelete }: Props) {
  const pct = book.wordGoal ? Math.min(100, Math.round((words / book.wordGoal) * 100)) : 0;

  return (
    <div
      className="card"
      style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "12px 16px" }}
      onClick={onOpen}
    >
      <CoverArt book={book} size="small"/>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontFamily: "var(--ed-font)", fontSize: 15, fontWeight: 600, color: theme.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {book.title}
        </h3>
        <div style={{ display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
          {book.genre  && <span style={{ fontSize: 11, color: theme.textFaint }}>{book.genre}</span>}
          <span style={{ fontSize: 11, color: theme.textFaint }}>{words.toLocaleString()} words</span>
          <span style={{ fontSize: 11, color: theme.textFaint }}>{fmtDate(book.updatedAt)}</span>
          {book.wordGoal > 0 && (
            <span style={{ fontSize: 11, color: theme.accentLight, fontWeight: 600 }}>{pct}%</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
        <button className="ibtn tip" data-tip="Edit book" onClick={onEdit}><Edit3 size={14}/></button>
        <button className="ibtn tip" data-tip={book.isArchived ? "Restore" : "Archive"} onClick={onArchive}><Archive size={14}/></button>
        <button className="ibtn tip" data-tip="Delete book" style={{ color: "#fc8181" }} onClick={onDelete}><Trash2 size={14}/></button>
      </div>
    </div>
  );
}
