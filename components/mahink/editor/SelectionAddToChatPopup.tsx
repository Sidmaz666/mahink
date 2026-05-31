"use client";

import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import type { Editor } from "@tiptap/react";
import type { Theme } from "@/lib/types";

interface Props {
  editor: Editor | null;
  theme: Theme;
  onAddToChat: () => void;
}

export default function SelectionAddToChatPopup({ editor, theme, onAddToChat }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!editor) {
      setPos(null);
      return;
    }

    const sync = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setPos(null);
        return;
      }
      try {
        const coords = editor.view.coordsAtPos(from);
        setPos({
          top: coords.top - 8,
          left: coords.left,
        });
      } catch {
        setPos(null);
      }
    };

    sync();
    editor.on("selectionUpdate", sync);
    editor.on("update", sync);
    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("update", sync);
    };
  }, [editor]);

  if (!pos) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToChat();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAddToChat();
        }
      }}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        transform: "translateY(-100%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 8,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 4px 12px ${theme.shadow}`,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        color: theme.accent,
        fontFamily: "var(--ui-font)",
        transition: "opacity 0.15s, transform 0.15s",
      }}
    >
      <MessageSquarePlus size={14} />
      Add to Chat
      <span style={{ fontSize: 10, color: theme.textFaint, fontWeight: 500 }}>Ctrl+L</span>
    </div>
  );
}
