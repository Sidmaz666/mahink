"use client";

import { useEffect, useState } from "react";
import { buildCoverGradient } from "@/lib/utils";
import { THEMES, FONTS, GFONTS_URL } from "@/lib/constants";
import {
  resolveChapterTitleStyle,
  resolveEditorPageBackground,
  resolvePageNumberStyle,
  marginGuideToStyle,
  pageBorderToStyle,
  resolveMarginGuideStyle,
} from "@/lib/editorLayout";
import ChapterTitleBlock from "@/components/mahink/editor/ChapterTitleBlock";

export default function PdfPreviewPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const localId = params.get("localId");
    if (localId) {
      const raw = localStorage.getItem(localId);
      if (raw) {
        try {
          setData(JSON.parse(raw));
        } catch (e) {
          console.error("Failed to parse export data", e);
        }
      }
    } else {
      const id = params.get("id");
      if (id) {
        fetch(`/api/export/data?id=${id}`)
          .then(r => r.json())
          .then(d => setData(d));
      }
    }
  }, []);

  useEffect(() => {
    if (data) {
      setTimeout(() => {
        const div = document.createElement("div");
        div.id = "render-done";
        document.body.appendChild(div);
        if (new URLSearchParams(window.location.search).get("print") === "true") {
          window.print();
        }
      }, 2000);
    }
  }, [data]);

  if (!data) return <div style={{ padding: 40, fontFamily: "system-ui", color: "#666" }}>Preparing professional manuscript...</div>;

  const { book, chapters, settings, opts } = data;
  const bookTheme = THEMES[book?.preferredThemeId ?? settings?.themeId] ?? THEMES.parchment;
  const edFont = FONTS[settings?.editorFontId] ?? FONTS.cormorant;
  const fontStack = edFont.stack;
  const fontSize = opts?.fontSize || settings?.fontSize || 12;
  const lineHeight = opts?.lineHeight || settings?.lineHeight || 1.6;
  const authorName = opts?.authorName || settings?.authorName || "Anonymous";
  const isDropCapGlobal = opts?.dropCap ?? book?.dropCapEnabled;
  const pageBg = resolveEditorPageBackground(book, bookTheme.editorBg);
  const pns = resolvePageNumberStyle(book);

  const innerPad = book?.editorInnerPadding ?? { top: 0, bottom: 0, left: 0, right: 0 };

  const getPageSize = () => {
    switch (opts?.paperSize) {
      case "a4": return "A4";
      case "a5": return "A5";
      case "letter": return "Letter";
      case "trade": return "6in 9in";
      case "5x8": return "5in 8in";
      case "6x9": return "6in 9in";
      default: return "A5";
    }
  };

  return (
    <div className="pdf-export-root" id="pdf-root">
      <link rel="stylesheet" href={GFONTS_URL} />
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${getPageSize()} portrait;
          margin: 0;
          ${pns.enabled ? `
          @bottom-center {
            content: counter(page);
            font-family: ${pns.fontId ? `var(--${pns.fontId})` : fontStack};
            font-size: ${pns.fontSize}px;
            color: ${pns.color || bookTheme.textMuted};
          }` : ""}
        }
        @page :first {
          ${pns.enabled ? `@bottom-center { content: none; }` : ""}
        }

        @media print {
          .page, .chapter-container {
            padding: 20mm 15mm;
            box-sizing: border-box;
          }

          header, footer { display: none !important; }

          body { counter-reset: page 0; }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        body {
          margin: 0;
          padding: 0;
          background: ${pageBg};
          color: ${bookTheme.text};
        }

        .pdf-export-root {
          font-family: ${fontStack};
          font-size: ${fontSize}pt;
          line-height: ${lineHeight};
          text-align: ${opts?.justifyText !== false ? "justify" : "left"};
          hyphens: ${opts?.hyphenation !== false ? "auto" : "none"};
          letter-spacing: ${opts?.letterSpacing ?? 0}em;
          widows: ${opts?.widowOrphanControl !== false ? 3 : 1};
          orphans: ${opts?.widowOrphanControl !== false ? 3 : 1};
          ${opts?.colorMode === "grayscale" ? "filter: grayscale(100%);" : ""}
        }

        .cover-page {
          page-break-after: always;
          height: 100vh;
          width: 100vw;
          padding: 0 !important;
          margin: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          background-size: cover;
          background-position: center;
        }

        .page {
          page-break-after: always;
          width: 100%;
          min-height: 100vh;
        }

        .copyright-page {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100vh;
          font-size: 0.9em;
          line-height: 1.6;
        }

        .toc-page h2 { text-align: center; margin-bottom: 2em; font-size: 1.8em; color: ${bookTheme.text}; }
        .toc-list { list-style: none; padding: 0; margin: 0; }
        .toc-item {
          display: flex;
          align-items: baseline;
          margin-bottom: 0.8em;
        }
        .toc-item a { text-decoration: none; color: ${bookTheme.text}; flex-shrink: 0; }
        .toc-dots {
          flex: 1;
          border-bottom: 1px dotted ${bookTheme.textMuted};
          margin: 0 4px;
          position: relative;
          top: -4px;
        }

        .chapter-container {
          page-break-before: always;
          position: relative;
          min-height: 100vh;
        }

        ${opts?.target === "paperback" ? ".chapter-container { break-before: recto; }" : ""}

        .chapter-content p {
          margin: 0;
          text-indent: ${opts?.paragraphIndent ?? 1.5}em;
          margin-bottom: 0;
        }

        .chapter-container.with-drop-cap .chapter-content p:first-of-type {
          text-indent: 0;
        }
        .chapter-container.with-drop-cap .chapter-content p:first-of-type::first-letter {
          float: left;
          font-size: 3.5em;
          line-height: 0.8;
          margin-top: 0.12em;
          margin-right: 0.1em;
          font-weight: 700;
          color: ${bookTheme.text};
          font-family: serif;
        }

        .chapter-content h1 { font-size: 2em; font-weight: 700; margin: 1em 0 0.4em; line-height: 1.2; text-indent: 0; }
        .chapter-content h2 { font-size: 1.55em; font-weight: 600; margin: 0.9em 0 0.3em; line-height: 1.25; text-indent: 0; }
        .chapter-content h3 { font-size: 1.25em; font-weight: 600; margin: 0.8em 0 0.3em; text-indent: 0; }
        .chapter-content blockquote { border-left: 3px solid ${bookTheme.border}; padding: 0.4em 0 0.4em 1.2em; margin: 1em 0; font-style: italic; opacity: 0.85; }
        .chapter-content strong { font-weight: 700; }
        .chapter-content em { font-style: italic; }
        .chapter-content u { text-decoration: underline; }
        .chapter-content s { text-decoration: line-through; }
        .chapter-content ul, .chapter-content ol { padding-left: 1.5em; margin-bottom: 1em; }
        .chapter-content li { margin-bottom: 0.25em; }
        .chapter-content hr { border: none; border-top: 1px solid ${bookTheme.border}; margin: 2.5em auto; width: 35%; }
        .chapter-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 1em 0; }
        .chapter-content sup { font-size: 0.75em; vertical-align: super; }
        .chapter-content sub { font-size: 0.75em; vertical-align: sub; }

        .scene-break {
          text-align: center;
          margin: 2em 0;
          font-size: 1.5em;
          text-indent: 0 !important;
        }

        @media screen {
          .pdf-export-root { padding: 40px; background: ${bookTheme.bgStyle || "#eee"}; }
          .page, .chapter-container {
            background: ${pageBg};
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 0.75in;
            box-sizing: border-box;
          }
          .cover-page { padding: 0 !important; }
        }
      `}} />

      {/* 1. COVER PAGE */}
      {opts?.includeTitle && (() => {
        const fb = book?.coverDesign?.front?.background;
        let bgStyle: any = {};
        if (fb?.type === "gradient" && fb.gradientA) {
          const angle = fb.gradientAngle ?? 135;
          bgStyle.background = `linear-gradient(${angle}deg, ${fb.gradientA}, ${fb.gradientB ?? fb.gradientA})`;
        } else if (fb?.type === "solid" && fb.solid) {
          bgStyle.backgroundColor = fb.solid;
        } else if (fb?.type === "image" && fb.image) {
          bgStyle.backgroundImage = `url(${fb.image})`;
          bgStyle.backgroundSize = "cover";
          bgStyle.backgroundPosition = "center";
        } else {
          const g = buildCoverGradient(book);
          if (book?.coverType === "image" && book?.coverImage) {
            bgStyle.backgroundImage = `url(${book.coverImage})`;
            bgStyle.backgroundSize = "cover";
            bgStyle.backgroundPosition = "center";
          } else {
            bgStyle.background = g || "#1a1a2e";
          }
        }

        return (
          <div className="cover-page" style={bgStyle}>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              textAlign: 'center',
              padding: '40px',
              background: 'rgba(0,0,0,0.25)',
            }}>
              <h1 style={{ fontSize: '3.2em', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{book?.title || "Untitled Work"}</h1>
              {book?.subtitle && <h2 style={{ fontSize: '1.6em', fontWeight: 400, marginTop: '0.5em', opacity: 0.9, fontStyle: 'italic' }}>{book.subtitle}</h2>}
              <div style={{ fontSize: '1.3em', marginTop: '4em', opacity: 0.85 }}>{authorName}</div>
            </div>
          </div>
        );
      })()}

      {/* 2. COPYRIGHT PAGE */}
      <div className="page copyright-page">
        <p>Copyright © {new Date().getFullYear()} {authorName}</p>
        <p style={{ marginTop: "1em" }}>All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
        {book?.publishing?.metadata?.isbn && <p style={{ marginTop: "1.5em" }}>ISBN: {book.publishing.metadata.isbn}</p>}
        {book?.publishing?.metadata?.imprint && <p>Imprint: {book.publishing.metadata.imprint}</p>}
        <p style={{ marginTop: "2em", opacity: 0.6 }}>Created with Mahink Writing Studio</p>
      </div>

      {/* 3. TABLE OF CONTENTS */}
      {opts?.includeToc && (
        <div className="page toc-page">
          <h2>Table of Contents</h2>
          <ul className="toc-list">
            {chapters?.map((ch: any, i: number) => (
              <li key={ch.id} className="toc-item">
                <a href={`#chapter-${ch.id}`}>{ch.title || `Chapter ${i + 1}`}</a>
                <span className="toc-dots"></span>
                <span>{i + 1}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. CHAPTERS */}
      {chapters?.map((ch: any, i: number) => {
        const titleStyle = resolveChapterTitleStyle(book, ch);
        const hasDropCap = ch.dropCapEnabled ?? isDropCapGlobal;
        const ornament = ch.sceneBreakOrnament ?? opts?.sceneBreakOrnament ?? "none";
        const mgStyle = marginGuideToStyle(resolveMarginGuideStyle(book, ch), bookTheme);
        const pbStyle = pageBorderToStyle(book.pageBorderStyle);

        let content = ch.content || "";
        if (ornament !== "none") {
          const char = ornament === "asterism" ? "***" : ornament === "flower" ? "❦" : "———";
          content = content.replace(/<hr\s*\/?>|\*\*\*|\s*---\s*/g, `<div class="scene-break">${char}</div>`);
        }

        return (
          <div key={ch.id} id={`chapter-${ch.id}`} className={`chapter-container${hasDropCap ? " with-drop-cap" : ""}`} style={{ ...pbStyle, position: "relative" }}>
            {mgStyle.display !== "none" && <div aria-hidden style={{ ...mgStyle, inset: "20mm 15mm" }} />}

            {titleStyle.placement === "outside_margin_box" && (
              <div style={{ marginBottom: 12 }}>
                <ChapterTitleBlock
                  chapterId={ch.id}
                  title={ch.title || `Chapter ${i+1}`}
                  onRename={() => {}}
                  titleStyle={titleStyle}
                  bookTheme={bookTheme}
                  bodyFontSizePx={fontSize}
                  fontFamily={fontStack}
                  heading="h1"
                  textColor={bookTheme.text}
                  interactive={false}
                />
              </div>
            )}

            <div style={{ padding: `${innerPad.top}px ${innerPad.right}px ${innerPad.bottom}px ${innerPad.left}px` }}>
              {(!titleStyle.placement || titleStyle.placement === "inside_margin_box") && (
                <div style={{ paddingBottom: 12 }}>
                  <ChapterTitleBlock
                    chapterId={ch.id}
                    title={ch.title || `Chapter ${i+1}`}
                    onRename={() => {}}
                    titleStyle={titleStyle}
                    bookTheme={bookTheme}
                    bodyFontSizePx={fontSize}
                    fontFamily={fontStack}
                    heading="h1"
                    textColor={bookTheme.text}
                    interactive={false}
                  />
                </div>
              )}
              <div
                className="chapter-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        );
      })}

    </div>
  );
}
