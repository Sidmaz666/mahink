"use client";

import { useState, useEffect } from "react";
import type { ChapterTitleStyle, Theme } from "@/lib/types";
import { chapterTitleDividerColor } from "@/lib/editorLayout";

interface Props {
  chapterId: string;
  title: string;
  onRename: (title: string) => void;
  titleStyle: ChapterTitleStyle;
  bookTheme: Theme;
  /** Body font size in px (settings.fontSize or preview equivalent). */
  bodyFontSizePx: number;
  /** Use CSS var in editor, or explicit stack in preview. */
  fontFamily: "var(--ed-font)" | string;
  /** Semantic heading level for accessibility. */
  heading: "h1" | "h2";
  textColor: string;
  /** Preview pane: no inline rename. */
  interactive?: boolean;
}

function dividerBorderStyle(variant: ChapterTitleStyle["dividerVariant"]): "solid" | "dashed" | "dotted" | "double" {
  switch (variant) {
    case "dashed":
      return "dashed";
    case "dotted":
      return "dotted";
    case "double":
      return "double";
    default:
      return "solid";
  }
}

function TitleDividerLine({
  style,
  bookTheme,
}: {
  style: ChapterTitleStyle;
  bookTheme: Theme;
}) {
  const color = chapterTitleDividerColor(style, bookTheme);
  const w = style.dividerWidthPercent;
  const t = style.dividerThicknessPx;
  const justify =
    style.dividerAlign === "center" ? "center" : style.dividerAlign === "right" ? "flex-end" : "flex-start";

  if (style.dividerVariant === "ornament_center") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: justify,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: `${w}%`,
            maxWidth: "100%",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, borderTop: `${t}px solid ${color}`, opacity: 0.85 }} />
          <div
            style={{
              width: Math.max(5, t * 4),
              height: Math.max(5, t * 4),
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
              opacity: 0.9,
            }}
          />
          <div style={{ flex: 1, borderTop: `${t}px solid ${color}`, opacity: 0.85 }} />
        </div>
      </div>
    );
  }

  if (style.dividerVariant === "ornament_flourish") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: justify,
          width: "100%",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            maxWidth: "100%",
            height: Math.max(2, t + 2),
            background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color} 80%, transparent 100%)`,
            opacity: 0.75,
            borderRadius: 2,
          }}
        />
      </div>
    );
  }

  const b = dividerBorderStyle(style.dividerVariant);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: justify,
        width: "100%",
      }}
    >
      <div
        style={{
          width: `${w}%`,
          maxWidth: "100%",
          borderTop: `${t}px ${b} ${color}`,
        }}
      />
    </div>
  );
}

export default function ChapterTitleBlock({
  chapterId,
  title,
  onRename,
  titleStyle,
  bookTheme,
  bodyFontSizePx,
  fontFamily,
  heading,
  textColor,
  interactive = true,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  useEffect(() => {
    setValue(title);
  }, [chapterId, title]);

  const commit = () => {
    onRename(value);
    setEditing(false);
  };

  const showDivider = titleStyle.dividerEnabled;
  const gap = `${titleStyle.dividerGapEm}em`;
  const titlePx = Math.round(bodyFontSizePx * titleStyle.titleSizeEm);

  const Tag = heading;

  if (interactive && editing) {
    return (
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        style={{
          fontFamily,
          fontSize: titlePx,
          fontWeight: 700,
          color: textColor,
          textAlign: titleStyle.titleAlign ?? "left",
          background: "transparent",
          border: "none",
          borderBottom: `2px solid ${bookTheme.accent}`,
          outline: "none",
          width: "100%",
          paddingBottom: 4,
          marginBottom: 8,
          lineHeight: 1.25,
        }}
        autoFocus
      />
    );
  }

  const lineAbove = showDivider && (titleStyle.dividerPosition === "above" || titleStyle.dividerPosition === "both");
  const lineBelow = showDivider && (titleStyle.dividerPosition === "below" || titleStyle.dividerPosition === "both");

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {lineAbove && (
        <div style={{ marginBottom: gap, width: "100%" }}>
          <TitleDividerLine style={titleStyle} bookTheme={bookTheme} />
        </div>
      )}
      <Tag
        onClick={interactive ? () => setEditing(true) : undefined}
        style={{
          fontFamily,
          fontSize: titlePx,
          fontWeight: 700,
          color: textColor,
          textAlign: titleStyle.titleAlign ?? "left",
          cursor: interactive ? "text" : "default",
          margin: 0,
          lineHeight: 1.25,
          marginBottom: lineBelow ? gap : heading === "h1" ? "1.25em" : 8,
          width: "100%",
        }}
      >
        {title}
      </Tag>
      {lineBelow && (
        <div style={{ marginTop: 0, width: "100%" }}>
          <TitleDividerLine style={titleStyle} bookTheme={bookTheme} />
        </div>
      )}
    </div>
  );
}
