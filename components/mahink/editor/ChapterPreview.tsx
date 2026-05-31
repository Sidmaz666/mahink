"use client";

import { useCallback, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import {
  computeEditorMarginInsets,
  computeEditorInnerPaddingStyle,
  resolveEditorPageBackground,
  resolveMarginGuideStyle,
  marginGuideToStyle,
  resolveChapterTitleStyle,
  resolvePageNumberStyle,
  calculateChapterStartPage,
} from "@/lib/editorLayout";
import ChapterTitleBlock from "./ChapterTitleBlock";
import type { Book, Chapter, Theme } from "@/lib/types";

interface Props {
  book: Book;
  chapters: Chapter[];
  bookTheme: Theme;
  chapter?: Chapter;
  title: string;
  content: string;
  fontStack: string;
  fontSize: number;
  lineHeight: number;
  paragraphWidth: string;
}

function wrapSentencesInSpans(container: HTMLElement): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) textNodes.push(n);
  for (const node of textNodes) {
    const text = node.textContent || "";
    if (!text.trim()) continue;
    const parts = text.split(/(?<=[.!?])\s+/);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part.trim()) continue;
      const span = document.createElement("span");
      span.className = "dictate-sentence";
      span.textContent = part.trim();
      frag.appendChild(span);
      if (i < parts.length - 1) frag.appendChild(document.createTextNode(" "));
    }
    node.parentNode?.replaceChild(frag, node);
  }
}

function unwrapSentenceSpans(container: HTMLElement): void {
  container.querySelectorAll(".dictate-sentence").forEach((span) => {
    const parent = span.parentNode;
    if (parent) parent.replaceChild(document.createTextNode(span.textContent || ""), span);
  });
}

export default function ChapterPreview({
  book,
  chapters,
  bookTheme,
  chapter,
  title,
  content,
  fontStack,
  fontSize,
  lineHeight,
  paragraphWidth,
}: Props) {
  const pageBg = resolveEditorPageBackground(book, bookTheme.editorBg, chapter);
  const tc = bookTheme.text;
  const tcMuted = bookTheme.textMuted;
  const brd = bookTheme.border;
  const marginInsets = computeEditorMarginInsets(book, false, chapter);
  const innerPadStyle = computeEditorInnerPaddingStyle(book, false, chapter);
  const marginGuideStyle = resolveMarginGuideStyle(book, chapter);
  const guideOverlayStyle = marginGuideToStyle(marginGuideStyle, bookTheme);
  const titleStyle = resolveChapterTitleStyle(book, chapter);
  const pns = resolvePageNumberStyle(book, chapter);
  const startPage = (chapter && chapters) ? calculateChapterStartPage(book, chapter.id, chapters) : 1;
  const titleOutside = titleStyle.placement === "outside_margin_box";
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDictating, setIsDictating] = useState(false);
  const cancelRef = useRef(false);

  const handleDictate = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;

    if (isDictating) {
      cancelRef.current = true;
      synth.cancel();
      setIsDictating(false);
      scrollRef.current?.querySelectorAll(".dictate-highlight").forEach((el) => el.classList.remove("dictate-highlight"));
      if (scrollRef.current) unwrapSentenceSpans(scrollRef.current);
      return;
    }

    cancelRef.current = false;
    setIsDictating(true);

    requestAnimationFrame(() => {
      const scrollEl = scrollRef.current;
      const contentEl = contentRef.current;
      const containerEl = containerRef.current;
      if (!scrollEl || !contentEl || !containerEl) {
        setIsDictating(false);
        return;
      }

      wrapSentencesInSpans(scrollEl);
      const sentenceSpans = Array.from(scrollEl.querySelectorAll<HTMLElement>(".dictate-sentence"));
      const speakableSpans = sentenceSpans.filter((s) => (s.textContent || "").trim().length > 0);
      if (speakableSpans.length === 0) {
        setIsDictating(false);
        unwrapSentenceSpans(scrollEl);
        return;
      }

      const clearHighlights = () => {
        scrollEl.querySelectorAll(".dictate-highlight").forEach((el) => el.classList.remove("dictate-highlight"));
      };

      const speakSentence = (span: HTMLElement): Promise<void> =>
        new Promise((resolve) => {
          if (cancelRef.current) {
            resolve();
            return;
          }
          const text = (span.textContent || "").trim();
          if (!text) {
            resolve();
            return;
          }
          clearHighlights();
          span.classList.add("dictate-highlight");
          span.scrollIntoView({ behavior: "smooth", block: "center" });
          const u = new SpeechSynthesisUtterance(text);
          u.onend = () => resolve();
          u.onerror = () => resolve();
          synth.speak(u);
        });

      (async () => {
        try {
          for (const span of speakableSpans) {
            if (cancelRef.current) break;
            await speakSentence(span);
          }
        } finally {
          if (!cancelRef.current) {
            setIsDictating(false);
            clearHighlights();
            unwrapSentenceSpans(scrollEl);
          }
        }
      })();
    });
  }, [title, content, isDictating]);

  const isDropCap = chapter?.dropCapEnabled ?? book.dropCapEnabled;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: pageBg,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 0,
          fontFamily: fontStack,
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          color: tc,
          wordBreak: "break-word",
          width: "100%",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: "100%",
            width: "100%",
            background: pageBg,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              paddingTop: marginInsets.top,
              paddingLeft: marginInsets.left,
              paddingRight: marginInsets.right,
              paddingBottom: marginInsets.bottom,
              minHeight: "100%",
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {pns.enabled && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 20,
                  pointerEvents: "none",
                  fontFamily: pns.fontId ? `var(--${pns.fontId})` : fontStack,
                  fontSize: `${pns.fontSize}px`,
                  color: pns.color || tcMuted,
                  ...(() => {
                    const pos: React.CSSProperties = {};
                    const isTop = pns.position.startsWith("top");
                    const isCenter = pns.position.endsWith("center");
                    const isRight = pns.position.endsWith("right");
                    
                    if (isTop) pos.top = pns.offsetY;
                    else pos.bottom = pns.offsetY;
                    
                    if (isCenter) {
                      pos.left = "50%";
                      pos.transform = `translateX(-50%) translateX(${pns.offsetX}px)`;
                    } else if (isRight) {
                      pos.right = pns.offsetX;
                    } else {
                      pos.left = pns.offsetX;
                    }
                    return pos;
                  })()
                }}
              >
                {pns.format?.replace("{n}", String(startPage)) || String(startPage)}
              </div>
            )}

            {titleOutside && title && (
              <div
                style={{
                  width: "100%",
                  maxWidth: paragraphWidth === "100%" ? "none" : paragraphWidth,
                  margin: paragraphWidth === "100%" ? 0 : "0 auto",
                  marginBottom: 12,
                }}
              >
                <ChapterTitleBlock
                  chapterId={`preview-${book.id}`}
                  title={title}
                  onRename={() => {}}
                  titleStyle={titleStyle}
                  bookTheme={bookTheme}
                  bodyFontSizePx={fontSize}
                  fontFamily={fontStack}
                  heading="h1"
                  textColor={tc}
                  interactive={false}
                />
              </div>
            )}

            <div
              style={{
                position: "relative",
                ...innerPadStyle,
                paddingBottom: Math.max(
                  typeof innerPadStyle.paddingBottom === "number" ? innerPadStyle.paddingBottom : 0,
                  88,
                ),
                flex: 1,
                minHeight: 1100,
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {marginGuideStyle.enabled && (
                <div
                  aria-hidden
                  style={{
                    ...guideOverlayStyle,
                    height: "100%", // Ensure the guide fills the full height
                    zIndex: 10,
                  }}
                />
              )}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  maxWidth: paragraphWidth === "100%" ? "none" : paragraphWidth,
                  margin: paragraphWidth === "100%" ? 0 : "0 auto",
                }}
              >
                {!titleOutside && title && (
                  <div style={{ paddingBottom: 12 }}>
                    <ChapterTitleBlock
                      chapterId={`preview-${book.id}`}
                      title={title}
                      onRename={() => {}}
                      titleStyle={titleStyle}
                      bookTheme={bookTheme}
                      bodyFontSizePx={fontSize}
                      fontFamily={fontStack}
                      heading="h1"
                      textColor={tc}
                      interactive={false}
                    />
                  </div>
                )}
                <div
                  ref={contentRef}
                  className={`chapter-body ${isDropCap ? "drop-cap" : ""}`}
                  style={{
                    textAlign: book.justifyText !== false ? "justify" : "left",
                    hyphens: book.hyphenation !== false ? "auto" : "none",
                    WebkitHyphens: book.hyphenation !== false ? "auto" : "none",
                    letterSpacing: `${book.letterSpacing ?? 0}em`,
                    lineHeight: lineHeight,
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: (() => {
                      if (!content) return `<p style="color:${tcMuted};font-style:italic">Start writing to see a preview here…</p>`;
                      const ornament = chapter?.sceneBreakOrnament ?? book.sceneBreakOrnament ?? "none";
                      if (ornament === "none") return content;
                      const char = ornament === "asterism" ? "***" : ornament === "flower" ? "❦" : "———";
                      return content.replace(/<hr\s*\/?>|\*\*\*|\s*---\s*/g, `<div class="scene-break">${char}</div>`);
                    })()
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dictate button — fixed at bottom-right of preview panel */}
      <button
        type="button"
        onClick={handleDictate}
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: isDictating ? "#e53e3e" : bookTheme.accent,
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 100,
        }}
        title={isDictating ? "Stop dictation" : "Read aloud"}
        aria-label={isDictating ? "Stop dictation" : "Read aloud"}
      >
        <Volume2 size={20} />
      </button>

      <style>{`
        .chapter-body p           { margin: 0; text-indent: ${book.paragraphIndent ?? 1.5}em; margin-bottom: 0; }
        .chapter-body h1, .chapter-body h2, .chapter-body h3 { text-indent: 0; }
        .scene-break { text-align: center; margin: 2em 0; font-size: 1.5em; text-indent: 0 !important; }
        .dictate-highlight           { background: rgba(255, 235, 59, 0.4); border-radius: 4px; }

        .chapter-body.drop-cap p:first-of-type { text-indent: 0; }
        .chapter-body.drop-cap p:first-of-type::first-letter {
          float: left;
          font-size: 3.5em;
          line-height: 0.8;
          margin-top: 0.12em;
          margin-right: 0.1em;
          font-weight: 700;
          color: ${tc};
          font-family: serif;
        }
      `}</style>
    </div>
  );
}
