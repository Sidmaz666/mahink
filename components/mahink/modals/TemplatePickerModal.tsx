"use client";

import { X, FileText, Sparkles } from "lucide-react";
import CoverArt from "../ui/CoverArt";
import { ALL_TEMPLATE_OPTIONS, getTemplateCoverDefaults, type TemplateOption, type TemplateBookPreset } from "@/lib/utils";
import type { Book, Theme } from "@/lib/types";

interface Props {
  theme: Theme;
  onSelectBlank: () => void;
  onSelectPreset: (preset: TemplateBookPreset) => void;
  onClose: () => void;
}

function templateToPreviewBook(opt: TemplateOption): Book {
  if (opt.kind === "blank") {
    return {
      id: "blank-prev",
      title: "Blank",
      subtitle: "Start from scratch",
      genre: "Your story",
      coverType: "gradient",
      coverGradient: opt.coverGradient,
      coverSolidColor: opt.coverSolidColor,
      coverAngle: 135,
      coverTextureOverlay: "none",
      wordGoal: 50000,
      isArchived: false,
      publishing: {} as Book["publishing"],
      styleGuide: "",
      bookSummary: "",
      createdAt: 0,
      updatedAt: 0,
    } as Book;
  }
  const p = opt.preset;
  const coverExtras = getTemplateCoverDefaults(p.genre);
  return {
    id: `prev-${opt.id}`,
    title: p.title,
    subtitle: p.subtitle ?? "",
    genre: p.genre,
    coverType: "gradient",
    coverGradient: p.coverGradient,
    coverSolidColor: p.coverSolidColor,
    coverAngle: 135,
    coverTextureOverlay: "none",
    wordGoal: p.wordGoal,
    isArchived: false,
    publishing: {} as Book["publishing"],
    styleGuide: "",
    bookSummary: p.bookSummary,
    createdAt: 0,
    updatedAt: 0,
    ...coverExtras,
  } as Book;
}

export default function TemplatePickerModal({ theme, onSelectBlank, onSelectPreset, onClose }: Props) {
  return (
    <div className="modal-wrap" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 720,
          width: "95%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 24px 0 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexShrink: 0 }}>
            <h2 className="modal-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={20} color={theme.accent} />
              Choose a Template
            </h2>
            <button className="ibtn tip" data-tip="Close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
            Start with a blank canvas or pick a genre template to jump-start your writing.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 14,
            padding: "0 24px 24px 24px",
          }}
        >
          {ALL_TEMPLATE_OPTIONS.map((opt) => {
            const isBlank = opt.kind === "blank";
            const preview = templateToPreviewBook(opt);
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (opt.kind === "blank") onSelectBlank();
                  else onSelectPreset(opt.preset);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  borderRadius: 12,
                  border: `2px solid ${isBlank ? theme.accent : theme.border}`,
                  background: isBlank ? `${theme.accent}12` : theme.surfaceAlt,
                  cursor: "pointer",
                  transition: "all 0.18s",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.accent;
                  e.currentTarget.style.background = `${theme.accent}18`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isBlank ? theme.accent : theme.border;
                  e.currentTarget.style.background = isBlank ? `${theme.accent}12` : theme.surfaceAlt;
                }}
              >
                <div style={{ position: "relative" }}>
                  <CoverArt book={preview} size="card" page="front" />
                  {isBlank && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.35)",
                        borderRadius: 3,
                      }}
                    >
                      <FileText size={28} color="#fff" />
                    </div>
                  )}
                </div>
                <div style={{ minHeight: 36 }}>
                  <p
                    style={{
                      fontFamily: "var(--ed-font)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: theme.text,
                      margin: 0,
                      lineHeight: 1.25,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {isBlank ? opt.label : opt.preset.title}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: theme.textFaint,
                      marginTop: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {isBlank ? opt.genre : opt.preset.genre}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
