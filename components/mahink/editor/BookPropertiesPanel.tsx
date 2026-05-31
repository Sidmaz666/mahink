"use client";

import { ChevronDown, ChevronRight, X, Globe, FileText } from "lucide-react";
import { useState } from "react";
import { GENRES, THEMES } from "@/lib/constants";
import { resolveChapterTitleStyle, resolveMarginGuideStyle, resolvePageNumberStyle } from "@/lib/editorLayout";
import type { Book, Chapter, ChapterTitleDividerVariant, MarginGuideLineStyle, PageNumberStyle, ParagraphWidth, Theme } from "@/lib/types";

interface Props {
  book: Book;
  theme: Theme;
  activeChapter?: Chapter;
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  onUpdateChapter?: (id: string, updates: Partial<Chapter>) => void;
  onClose: () => void;
}

const TEXT_WIDTHS: ParagraphWidth[] = ["narrow", "medium", "wide", "full"];

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--brd)", overflow: "hidden" }}>
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: hovered ? "rgba(255,255,255,0.03)" : "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.2s ease",
        }}
      >
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--txt-f)", margin: 0 }}>
          {title}
        </p>
        {open ? <ChevronDown size={14} color="var(--txt-f)" /> : <ChevronRight size={14} color="var(--txt-f)" />}
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "12px 16px 24px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--txt-m)", display: "block", marginBottom: 4 }}>
      {children}
    </span>
  );
}

function Slider({ label, min, max, step, value, onChange, unit = "" }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <Lbl>{label}</Lbl>
        <span style={{ fontSize: 10, color: "var(--txt-f)" }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--acc)" }}
      />
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${active ? "var(--acc)" : "var(--brd)"}`,
        background: active ? "color-mix(in srgb, var(--acc) 14%, transparent)" : "transparent",
        color: active ? "var(--acc)" : "var(--txt-m)",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {label}
    </button>
  );
}

const DIVIDER_VARIANTS: ChapterTitleDividerVariant[] = [
  "solid",
  "double",
  "dashed",
  "dotted",
  "ornament_center",
  "ornament_flourish",
];

export default function BookPropertiesPanel({ book, theme, activeChapter, onUpdateBook, onUpdateChapter, onClose }: Props) {
  const isChapterMode = !!(activeChapter && activeChapter.chapterStyleOverride);

  const toggleChapterMode = (enabled: boolean) => {
    if (!activeChapter || !onUpdateChapter) return;
    if (enabled) {
      // Start from current book settings
      onUpdateChapter(activeChapter.id, {
        chapterStyleOverride: true,
        editorPagePadding: book.editorPagePadding,
        editorInnerPadding: book.editorInnerPadding,
        editorPageBackground: book.editorPageBackground,
        editorMarginGuideStyle: book.editorMarginGuideStyle,
        chapterTitleStyle: book.chapterTitleStyle,
      });
    } else {
      onUpdateChapter(activeChapter.id, { chapterStyleOverride: false });
    }
  };

  const patch = (u: Partial<Book | Chapter>) => {
    if (isChapterMode && activeChapter && onUpdateChapter) {
      onUpdateChapter(activeChapter.id, u as Partial<Chapter>);
    } else {
      onUpdateBook(book.id, u as Partial<Book>);
    }
  };

  const target = isChapterMode ? (activeChapter as any) : book;

  const marginPad = target.editorPagePadding ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const innerPad = target.editorInnerPadding ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const ct = resolveChapterTitleStyle(book, activeChapter);
  const patchChapterTitle = (u: Partial<typeof ct>) =>
    patch({ chapterTitleStyle: { ...ct, ...u } });

  const activeThemeId = book.preferredThemeId;
  const activeTheme = activeThemeId ? THEMES[activeThemeId] : undefined;
  const fallbackPageBg = activeTheme?.editorBg ?? theme.editorBg ?? "#fdf8ee";

  const pageBgValue =
    target.editorPageBackground?.match(/^#[0-9a-fA-F]{6}$/) ? target.editorPageBackground : fallbackPageBg;
  
  const textWidth = book.preferredParagraphWidth ?? "full";
  const mgs = resolveMarginGuideStyle(book, activeChapter);
  const patchMarginGuide = (u: Partial<typeof mgs>) =>
    patch({ editorMarginGuideStyle: { ...mgs, ...u } });

  const pns = resolvePageNumberStyle(book, activeChapter);
  const patchPageNumber = (u: Partial<PageNumberStyle>) =>
    patch({ pageNumberStyle: { ...pns, ...u } });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: theme.surface,
        borderLeft: `1px solid ${theme.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text, letterSpacing: "0.01em" }}>
          Book Properties
        </span>
        <button className="ibtn tip" data-tip="Close properties" onClick={onClose}><X size={14}/></button>
      </div>

      {/* Mode Selector (Tabs) */}
      {activeChapter && (
        <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, background: "rgba(0,0,0,0.02)" }}>
          <button
            onClick={() => toggleChapterMode(false)}
            title="Apply stylistic changes to every chapter in the book."
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "16px 12px",
              border: "none",
              borderBottom: `2px solid ${!isChapterMode ? "var(--acc)" : "transparent"}`,
              background: !isChapterMode ? "rgba(255,255,255,0.03)" : "transparent",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Globe size={14} color={!isChapterMode ? "var(--acc)" : "var(--txt-f)"} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: !isChapterMode ? "var(--acc)" : "var(--txt-m)" }}>Book-wide</span>
          </button>
          <button
            onClick={() => toggleChapterMode(true)}
            title="Customize the style for this specific chapter only. Use this for special chapters, prologues, or unique formatting."
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "16px 12px",
              border: "none",
              borderBottom: `2px solid ${isChapterMode ? "var(--acc)" : "transparent"}`,
              background: isChapterMode ? "rgba(255,255,255,0.03)" : "transparent",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FileText size={14} color={isChapterMode ? "var(--acc)" : "var(--txt-f)"} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: isChapterMode ? "var(--acc)" : "var(--txt-m)" }}>This Chapter</span>
          </button>
        </div>
      )}

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 32px" }}>

        {/* ── Info ─────────────────────────────────────────── */}
        <Section title="Book Info" defaultOpen={false}>
          <div>
            <Lbl>Title</Lbl>
            <input
              className="inp"
              value={book.title}
              onChange={(e) => onUpdateBook(book.id, { title: e.target.value })}
              style={{ fontSize: 13 }}
            />
          </div>
          <div>
            <Lbl>Subtitle</Lbl>
            <input
              className="inp"
              value={book.subtitle ?? ""}
              onChange={(e) => onUpdateBook(book.id, { subtitle: e.target.value || undefined })}
              placeholder="Optional"
              style={{ fontSize: 13 }}
            />
          </div>
          <div>
            <Lbl>Genre</Lbl>
            <select className="inp" value={book.genre} onChange={(e) => onUpdateBook(book.id, { genre: e.target.value })} style={{ fontSize: 13 }}>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <Lbl>Word Goal</Lbl>
            <input
              className="inp" type="number"
              value={book.wordGoal ?? 0}
              onChange={(e) => onUpdateBook(book.id, { wordGoal: Number(e.target.value) })}
              min={0} step={5000}
              style={{ fontSize: 13 }}
            />
          </div>
          <div>
            <Lbl>Summary</Lbl>
            <textarea
              className="ta"
              rows={3}
              value={book.bookSummary ?? ""}
              onChange={(e) => onUpdateBook(book.id, { bookSummary: e.target.value || undefined })}
              placeholder="One-paragraph premise or synopsis…"
              style={{ fontSize: 12, resize: "vertical" }}
            />
          </div>
          <div>
            <Lbl>Style guide / notes</Lbl>
            <textarea
              className="ta"
              rows={3}
              value={book.styleGuide ?? ""}
              onChange={(e) => onUpdateBook(book.id, { styleGuide: e.target.value || undefined })}
              placeholder="Voice, tone, POV, conventions for AI context…"
              style={{ fontSize: 12, resize: "vertical" }}
            />
          </div>
        </Section>

        {/* ── Visual theme ─────────────────────────────────── */}
        <Section title="Page Appearance" defaultOpen={false}>
          <div>
            <Lbl>Book visual theme</Lbl>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: "0 0 6px", lineHeight: 1.5 }}>
              Colours the writing canvas and live preview only. App chrome uses Settings → Appearance.
            </p>
            <select
              className="inp"
              value={book.preferredThemeId ?? ""}
              onChange={(e) => patch({ preferredThemeId: e.target.value || undefined })}
              style={{ fontSize: 13 }}
            >
              <option value="">Same as app appearance (default)</option>
              {Object.values(THEMES).map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.group})</option>
              ))}
            </select>
          </div>

          <div>
            <Lbl>Parchment colour</Lbl>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={pageBgValue}
                onChange={(e) => patch({ editorPageBackground: e.target.value })}
                style={{ width: 40, height: 30, border: "none", cursor: "pointer", borderRadius: 6, flexShrink: 0 }}
              />
              <button
                type="button" className="btn"
                style={{ fontSize: 11, padding: "5px 10px" }}
                onClick={() => patch({ editorPageBackground: undefined })}
              >
                Use theme default
              </button>
            </div>
          </div>

          <div>
            <Lbl>Text width</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {TEXT_WIDTHS.map((width) => (
                <button
                  key={width}
                  type="button"
                  onClick={() => patch({ preferredParagraphWidth: width })}
                  style={{
                    padding: "8px 6px",
                    borderRadius: 10,
                    border: `1px solid ${textWidth === width ? "var(--acc)" : "var(--brd)"}`,
                    background: textWidth === width ? "color-mix(in srgb, var(--acc) 15%, transparent)" : "transparent",
                    color: textWidth === width ? "var(--acc)" : "var(--txt-m)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "capitalize",
                  }}
                >
                  {width}
                </button>
              ))}
            </div>
          </div>

        </Section>

        {/* ── Page margins ─────────────────────────────────── */}
        <Section title="Page Margins" defaultOpen={false}>
          <div>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: "0 0 8px", lineHeight: 1.5 }}>
              Decorative margin lines around the content area. Choose style, color, and thickness.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ToggleChip
                label={mgs.enabled ? "Margins on" : "Margins off"}
                active={mgs.enabled}
                onClick={() => patchMarginGuide({ enabled: !mgs.enabled })}
              />

              {mgs.enabled && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <Lbl>Line colour</Lbl>
                      <input
                        type="color"
                        value={
                          (mgs.color && /^#[0-9a-fA-F]{6}$/.test(mgs.color)
                            ? mgs.color
                            : theme.border) as string
                        }
                        onChange={(e) => patchMarginGuide({ color: e.target.value })}
                        style={{ width: 40, height: 28, border: "none", cursor: "pointer", borderRadius: 5 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: 11, padding: "5px 10px", alignSelf: "flex-end" }}
                      onClick={() => patchMarginGuide({ color: undefined })}
                    >
                      Use theme border
                    </button>
                  </div>

                  <div>
                    <Lbl>Line style</Lbl>
                    <select
                      className="inp"
                      value={mgs.lineStyle}
                      onChange={(e) =>
                        patchMarginGuide({
                          lineStyle: e.target.value as MarginGuideLineStyle,
                        })
                      }
                      style={{ fontSize: 13 }}
                    >
                      {/* Reuse divider variants for guides too */}
                      {DIVIDER_VARIANTS.map((v) => (
                        <option key={v} value={v}>
                          {v.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Slider
                    label="Corner radius"
                    min={0}
                    max={64}
                    step={1}
                    value={mgs.borderRadius ?? 0}
                    onChange={(v) => patchMarginGuide({ borderRadius: v })}
                    unit="px"
                  />

                  <div>
                    <Lbl>Visible sides & thickness</Lbl>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(["top", "bottom", "left", "right"] as const).map((side) => (
                        <div key={side} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <ToggleChip
                              label={side.charAt(0).toUpperCase() + side.slice(1)}
                              active={mgs.sides[side]}
                              onClick={() =>
                                patchMarginGuide({
                                  sides: { ...mgs.sides, [side]: !mgs.sides[side] },
                                })
                              }
                            />
                            {mgs.sides[side] && (
                              <span style={{ fontSize: 10, color: "var(--txt-f)" }}>
                                {mgs.thickness[side]}px
                              </span>
                            )}
                          </div>
                          {mgs.sides[side] && (
                            <input
                              type="range"
                              min={1}
                              max={16}
                              step={1}
                              value={mgs.thickness[side]}
                              onChange={(e) =>
                                patchMarginGuide({
                                  thickness: { ...mgs.thickness, [side]: Number(e.target.value) },
                                })
                              }
                              style={{ width: "100%", accentColor: "var(--acc)" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Section>

        {/* ── Margin inset (page edge → dashed margin) ─────── */}
        <Section title="Margin inset (px)" defaultOpen={false}>
          <p style={{ fontSize: 11, color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
            Space from the page edge to the dashed margin guide. Chapter title can sit in this band when set to “outside” below.
          </p>
          {(["top", "bottom", "left", "right"] as const).map((k) => (
            <Slider
              key={k}
              label={k.charAt(0).toUpperCase() + k.slice(1)}
              min={0} max={120} step={2}
              value={marginPad[k] ?? 0}
              onChange={(v) => patch({ editorPagePadding: { ...marginPad, [k]: v } })}
              unit="px"
            />
          ))}
        </Section>

        {/* ── Inner padding (inside dashed margin) ─────────── */}
        <Section title="Inner padding (px)" defaultOpen={false}>
          <p style={{ fontSize: 11, color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
            Extra space between the dashed guide and your body text (and chapter title when it sits inside the guide).
          </p>
          {(["top", "bottom", "left", "right"] as const).map((k) => (
            <Slider
              key={k}
              label={k.charAt(0).toUpperCase() + k.slice(1)}
              min={0} max={80} step={2}
              value={innerPad[k] ?? 0}
              onChange={(v) => patch({ editorInnerPadding: { ...innerPad, [k]: v } })}
              unit="px"
            />
          ))}
        </Section>

        {/* ── Title Appearance ─────────────────────────────────── */}
        <Section title="Title Appearance" defaultOpen={false}>
          <div>
            <Lbl>Title placement</Lbl>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <ToggleChip
                label="Inside margin guide"
                active={ct.placement === "inside_margin_box"}
                onClick={() => patchChapterTitle({ placement: "inside_margin_box" })}
              />
              <ToggleChip
                label="Outside margin guide"
                active={ct.placement === "outside_margin_box"}
                onClick={() => patchChapterTitle({ placement: "outside_margin_box" })}
              />
            </div>
          </div>

          <div>
            <Lbl>Divider / underline</Lbl>
            <ToggleChip
              label={ct.dividerEnabled ? "Divider on" : "Divider off"}
              active={ct.dividerEnabled}
              onClick={() => patchChapterTitle({ dividerEnabled: !ct.dividerEnabled })}
            />
          </div>

          {ct.dividerEnabled && (
            <>
              <div>
                <Lbl>Divider position</Lbl>
                <select
                  className="inp"
                  value={ct.dividerPosition}
                  onChange={(e) =>
                    patchChapterTitle({
                      dividerPosition: e.target.value as typeof ct.dividerPosition,
                    })
                  }
                  style={{ fontSize: 13 }}
                >
                  <option value="below">Below title</option>
                  <option value="above">Above title</option>
                  <option value="both">Above and below</option>
                </select>
              </div>
              <div>
                <Lbl>Line style</Lbl>
                <select
                  className="inp"
                  value={ct.dividerVariant}
                  onChange={(e) =>
                    patchChapterTitle({
                      dividerVariant: e.target.value as ChapterTitleDividerVariant,
                    })
                  }
                  style={{ fontSize: 13 }}
                >
                  {DIVIDER_VARIANTS.map((v) => (
                    <option key={v} value={v}>
                      {v.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <Lbl>Divider colour</Lbl>
                  <input
                    type="color"
                    value={
                      (ct.dividerColor && /^#[0-9a-fA-F]{6}$/.test(ct.dividerColor)
                        ? ct.dividerColor
                        : theme.border) as string
                    }
                    onChange={(e) => patchChapterTitle({ dividerColor: e.target.value })}
                    style={{ width: 40, height: 28, border: "none", cursor: "pointer", borderRadius: 5 }}
                  />
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: 11, padding: "5px 10px", alignSelf: "flex-end" }}
                  onClick={() => patchChapterTitle({ dividerColor: undefined })}
                >
                  Use theme border
                </button>
              </div>
              <Slider
                label="Line width (% of column)"
                min={10}
                max={100}
                step={2}
                value={ct.dividerWidthPercent}
                onChange={(v) => patchChapterTitle({ dividerWidthPercent: v })}
                unit="%"
              />
              <Slider
                label="Line thickness"
                min={1}
                max={8}
                step={1}
                value={ct.dividerThicknessPx}
                onChange={(v) => patchChapterTitle({ dividerThicknessPx: v })}
                unit="px"
              />
              <Slider
                label="Gap (title ↔ line)"
                min={0}
                max={200}
                step={5}
                value={Math.round(ct.dividerGapEm * 100)}
                onChange={(v) => patchChapterTitle({ dividerGapEm: v / 100 })}
                unit=" (0.01em)"
              />
              <div>
                <Lbl>Line alignment</Lbl>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(["left", "center", "right"] as const).map((a) => (
                    <ToggleChip
                      key={a}
                      label={a}
                      active={ct.dividerAlign === a}
                      onClick={() => patchChapterTitle({ dividerAlign: a })}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <Lbl>Title alignment</Lbl>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["left", "center", "right"] as const).map((a) => (
                <ToggleChip
                  key={a}
                  label={a}
                  active={(ct.titleAlign ?? "left") === a}
                  onClick={() => patchChapterTitle({ titleAlign: a })}
                />
              ))}
            </div>
          </div>

          <Slider
            label="Title size (× body font)"
            min={100}
            max={300}
            step={5}
            value={Math.round(ct.titleSizeEm * 100)}
            onChange={(v) => patchChapterTitle({ titleSizeEm: v / 100 })}
            unit="%"
          />
        </Section>

        {/* ── Typography ─────────────────────────────────────── */}
        <Section title="Typography" defaultOpen={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Lbl>Professional Drop Cap</Lbl>
                <p style={{ fontSize: 10, color: "var(--txt-f)", margin: "2px 0 0" }}>
                  Make the first letter of each chapter bold and large.
                </p>
              </div>
              <ToggleChip
                label={target.dropCapEnabled !== false ? "On" : "Off"}
                active={target.dropCapEnabled !== false}
                onClick={() => patch({ dropCapEnabled: target.dropCapEnabled === false })}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Lbl>Justify Text</Lbl>
                <p style={{ fontSize: 10, color: "var(--txt-f)", margin: "2px 0 0" }}>
                  Standard professional book alignment.
                </p>
              </div>
              <ToggleChip
                label={target.justifyText !== false ? "On" : "Off"}
                active={target.justifyText !== false}
                onClick={() => patch({ justifyText: target.justifyText === false })}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Lbl>Hyphenation</Lbl>
                <p style={{ fontSize: 10, color: "var(--txt-f)", margin: "2px 0 0" }}>
                  Smooth word edges for justified text.
                </p>
              </div>
              <ToggleChip
                label={target.hyphenation !== false ? "On" : "Off"}
                active={target.hyphenation !== false}
                onClick={() => patch({ hyphenation: target.hyphenation === false })}
              />
            </div>

            <div>
              <Lbl>Paragraph Indentation — {target.paragraphIndent ?? 1.5}em</Lbl>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={target.paragraphIndent ?? 1.5}
                onChange={(e) => patch({ paragraphIndent: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--acc)" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Lbl>Widow & Orphan Control</Lbl>
                <p style={{ fontSize: 10, color: "var(--txt-f)", margin: "2px 0 0" }}>
                  Prevent single lines at page starts/ends.
                </p>
              </div>
              <ToggleChip
                label={target.widowOrphanControl !== false ? "On" : "Off"}
                active={target.widowOrphanControl !== false}
                onClick={() => patch({ widowOrphanControl: target.widowOrphanControl === false })}
              />
            </div>

            <div>
              <Lbl>Letter Spacing (Tracking) — {target.letterSpacing ?? 0}em</Lbl>
              <input
                type="range"
                min={-0.05}
                max={0.2}
                step={0.01}
                value={target.letterSpacing ?? 0}
                onChange={(e) => patch({ letterSpacing: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--acc)" }}
              />
            </div>

            <div>
              <Lbl>Scene Break Ornament</Lbl>
              <select 
                className="inp" 
                value={target.sceneBreakOrnament ?? "none"}
                onChange={(e) => patch({ sceneBreakOrnament: e.target.value as any })}
                style={{ fontSize: 12 }}
              >
                <option value="none">None (Empty Line)</option>
                <option value="asterism">Asterism (***)</option>
                <option value="flower">Floral Floret (❦)</option>
                <option value="bar">Decorative Bar (———)</option>
              </select>
            </div>
          </div>
        </Section>

        {/* ── Page Numbers ─────────────────────────────────── */}
        <Section title="Page Numbers" defaultOpen={false}>
          <div>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: "0 0 12px", lineHeight: 1.5 }}>
              Controls the visibility and appearance of page numbers.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Lbl>Enable page numbers</Lbl>
                <ToggleChip 
                  label={pns.enabled ? "Enabled" : "Disabled"} 
                  active={pns.enabled} 
                  onClick={() => patchPageNumber({ enabled: !pns.enabled })} 
                />
              </div>

              {isChapterMode && activeChapter && onUpdateChapter && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Lbl>Exclude from count</Lbl>
                    <ToggleChip 
                      label={activeChapter.excludeFromPageCount ? "Excluded" : "Included"} 
                      active={activeChapter.excludeFromPageCount ?? false} 
                      onClick={() => onUpdateChapter!(activeChapter.id, { excludeFromPageCount: !activeChapter.excludeFromPageCount })} 
                    />
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Lbl>Restart page count</Lbl>
                    <ToggleChip 
                      label={activeChapter.restartPageCount ? "Restart" : "Continue"} 
                      active={activeChapter.restartPageCount ?? false} 
                      onClick={() => onUpdateChapter!(activeChapter.id, { restartPageCount: !activeChapter.restartPageCount })} 
                    />
                  </div>

                  {activeChapter.restartPageCount && (
                    <div>
                      <Lbl>Start page number</Lbl>
                      <input 
                        className="inp" 
                        type="number" 
                        value={activeChapter.startPageNumber ?? 1} 
                        onChange={(e) => onUpdateChapter!(activeChapter.id, { startPageNumber: Number(e.target.value) })}
                        min={1}
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  )}
                </>
              )}

              {pns.enabled && (
                <>
                  <div>
                    <Lbl>Position</Lbl>
                    <select 
                      className="inp" 
                      value={pns.position} 
                      onChange={(e) => patchPageNumber({ position: e.target.value as any })}
                      style={{ fontSize: 13 }}
                    >
                      <option value="top_left">Top Left</option>
                      <option value="top_center">Top Center</option>
                      <option value="top_right">Top Right</option>
                      <option value="bottom_left">Bottom Left</option>
                      <option value="bottom_center">Bottom Center</option>
                      <option value="bottom_right">Bottom Right</option>
                    </select>
                  </div>

                  <div>
                    <Lbl>Number formatting</Lbl>
                    <input 
                      className="inp"
                      value={pns.format ?? "{n}"}
                      onChange={(e) => patchPageNumber({ format: e.target.value })}
                      placeholder="{n} or - {n} -"
                      style={{ fontSize: 13 }}
                    />
                    <p style={{ fontSize: 10, color: "var(--txt-f)", marginTop: 4 }}>Use {"{n}"} as placeholder.</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <Lbl>Color</Lbl>
                      <input
                        type="color"
                        value={pns.color || theme.textMuted}
                        onChange={(e) => patchPageNumber({ color: e.target.value })}
                        style={{ width: 40, height: 28, border: "none", cursor: "pointer", borderRadius: 5 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: 11, padding: "5px 10px", alignSelf: "flex-end" }}
                      onClick={() => patchPageNumber({ color: undefined })}
                    >
                      Use theme
                    </button>
                  </div>

                  <Slider 
                    label="Font size" 
                    min={8} max={24} step={1} 
                    value={pns.fontSize} 
                    onChange={(v) => patchPageNumber({ fontSize: v })} 
                    unit="px"
                  />

                  <Slider 
                    label="Vertical offset" 
                    min={0} max={300} step={2} 
                    value={pns.offsetY} 
                    onChange={(v) => patchPageNumber({ offsetY: v })} 
                    unit="px"
                  />

                  <Slider 
                    label="Horizontal offset" 
                    min={0} max={300} step={2} 
                    value={pns.offsetX} 
                    onChange={(v) => patchPageNumber({ offsetX: v })} 
                    unit="px"
                  />
                </>
              )}
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
