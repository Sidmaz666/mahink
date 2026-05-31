import type { CSSProperties } from "react";
import type { Book, Chapter, ChapterTitleStyle, MarginGuideStyle, PageBorderStyle, PageMarginVisibility, PageNumberStyle, Theme } from "./types";

/** Screen pixels per inch for previewing print margins in the editor. */
export const EDITOR_MARGIN_INCH_TO_PX = 96;

export interface PageInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const DEFAULT_MARGIN_VISIBILITY: PageMarginVisibility = {
  top: true,
  bottom: true,
  inside: true,
  outside: true,
};

export function resolveEditorPageBackground(book: Book, themeFallback: string, chapter?: Chapter): string {
  if (chapter?.chapterStyleOverride && chapter.editorPageBackground) {
    return chapter.editorPageBackground;
  }
  const c = book.editorPageBackground?.trim();
  return c && c.length > 0 ? c : themeFallback;
}

export function resolvePageMarginVisibility(book: Book): PageMarginVisibility {
  return {
    ...DEFAULT_MARGIN_VISIBILITY,
    ...(book.editorPageMarginVisibility ?? {}),
  };
}

export function computeEditorMarginInsets(book: Book, isMobile: boolean, chapter?: Chapter): PageInsets {
  const pad = (chapter?.chapterStyleOverride && chapter.editorPagePadding)
    ? chapter.editorPagePadding
    : (book.editorPagePadding ?? { top: 0, bottom: 0, left: 0, right: 0 });

  if (isMobile) {
    return {
      top: Math.max(10, (pad.top ?? 0) * 0.65),
      bottom: Math.max(18, (pad.bottom ?? 0) * 0.65),
      left: Math.max(12, (pad.left ?? 0) * 0.65),
      right: Math.max(12, (pad.right ?? 0) * 0.65),
    };
  }
  return {
    top: pad.top ?? 0,
    bottom: pad.bottom ?? 0,
    left: pad.left ?? 0,
    right: pad.right ?? 0,
  };
}

/** @deprecated Use computeEditorMarginInsets */
export function computeEditorPagePadding(book: Book, isMobile: boolean, chapter?: Chapter): PageInsets {
  return computeEditorMarginInsets(book, isMobile, chapter);
}

export function computeEditorInnerInsets(book: Book, isMobile: boolean, chapter?: Chapter): PageInsets {
  const pad = (chapter?.chapterStyleOverride && chapter.editorInnerPadding)
    ? chapter.editorInnerPadding
    : (book.editorInnerPadding ?? { top: 0, bottom: 0, left: 0, right: 0 });

  const scale = isMobile ? 0.65 : 1;
  return {
    top: Math.max(0, (pad.top ?? 0) * scale),
    bottom: Math.max(0, (pad.bottom ?? 0) * scale),
    left: Math.max(0, (pad.left ?? 0) * scale),
    right: Math.max(0, (pad.right ?? 0) * scale),
  };
}

/** Combined margin + inner (for legacy callers that expected one padding). */
export function computeEditorContentInsets(book: Book, isMobile: boolean, chapter?: Chapter): PageInsets {
  const margin = computeEditorMarginInsets(book, isMobile, chapter);
  const inner = computeEditorInnerInsets(book, isMobile, chapter);
  return {
    top: margin.top + inner.top,
    bottom: margin.bottom + inner.bottom,
    left: margin.left + inner.left,
    right: margin.right + inner.right,
  };
}

export function computeEditorContentPadding(book: Book, isMobile: boolean, chapter?: Chapter): CSSProperties {
  const inset = computeEditorContentInsets(book, isMobile, chapter);
  return {
    paddingTop: inset.top,
    paddingBottom: inset.bottom,
    paddingLeft: inset.left,
    paddingRight: inset.right,
  };
}

export function computeEditorInnerPaddingStyle(book: Book, isMobile: boolean, chapter?: Chapter): CSSProperties {
  const inner = computeEditorInnerInsets(book, isMobile, chapter);
  return {
    paddingTop: inner.top,
    paddingBottom: inner.bottom,
    paddingLeft: inner.left,
    paddingRight: inner.right,
  };
}

export const DEFAULT_CHAPTER_TITLE_STYLE: ChapterTitleStyle = {
  placement: "inside_margin_box",
  dividerEnabled: false,
  dividerPosition: "below",
  dividerVariant: "solid",
  dividerWidthPercent: 72,
  dividerThicknessPx: 1,
  dividerGapEm: 0.45,
  dividerAlign: "left",
  titleAlign: "left",
  titleSizeEm: 1.65,
};

export function resolveChapterTitleStyle(book: Book, chapter?: Chapter): ChapterTitleStyle {
  const o = (chapter?.chapterStyleOverride && chapter.chapterTitleStyle)
    ? chapter.chapterTitleStyle
    : book.chapterTitleStyle;

  if (!o) return { ...DEFAULT_CHAPTER_TITLE_STYLE };
  return {
    ...DEFAULT_CHAPTER_TITLE_STYLE,
    ...o,
    dividerWidthPercent: Math.min(100, Math.max(10, o.dividerWidthPercent ?? DEFAULT_CHAPTER_TITLE_STYLE.dividerWidthPercent)),
    dividerThicknessPx: Math.min(8, Math.max(1, o.dividerThicknessPx ?? DEFAULT_CHAPTER_TITLE_STYLE.dividerThicknessPx)),
    dividerGapEm: Math.min(2, Math.max(0, o.dividerGapEm ?? DEFAULT_CHAPTER_TITLE_STYLE.dividerGapEm)),
    titleSizeEm: Math.min(3, Math.max(1, o.titleSizeEm ?? DEFAULT_CHAPTER_TITLE_STYLE.titleSizeEm)),
  };
}

export const DEFAULT_PAGE_NUMBER_STYLE: PageNumberStyle = {
  enabled: false,
  position: "bottom_center",
  fontSize: 12,
  format: "{n}",
  offsetY: 20,
  offsetX: 40,
};

export function resolvePageNumberStyle(book: Book, chapter?: Chapter): PageNumberStyle {
  const s = (chapter?.chapterStyleOverride && chapter.pageNumberStyle)
    ? chapter.pageNumberStyle
    : book.pageNumberStyle || {} as PageNumberStyle;

  const style = {
    ...DEFAULT_PAGE_NUMBER_STYLE,
    ...s,
  };

  // Positional "Best Practice" Defaults if not explicitly set
  // This ensures a professional look out of the box for all 6 zones
  if (s.offsetY === undefined) {
    style.offsetY = 40; // 40px safe buffer from edges
  }
  
  if (s.offsetX === undefined) {
    const isCenter = style.position.endsWith("center");
    style.offsetX = isCenter ? 0 : 60; // Corners need more room from sides
  }

  return style;
}

export function chapterTitleDividerColor(style: ChapterTitleStyle, bookTheme: Theme): string {
  return style.dividerColor?.trim() || bookTheme.border;
}

export function shouldShowMarginGuides(book: Book, chapter?: Chapter): boolean {
  if (chapter?.chapterStyleOverride && chapter.editorMarginGuideStyle) {
    return chapter.editorMarginGuideStyle.enabled;
  }
  if (book.editorMarginGuideStyle) return book.editorMarginGuideStyle.enabled;
  return book.editorShowMarginGuides ?? false;
}

export const DEFAULT_MARGIN_GUIDE_STYLE: MarginGuideStyle = {
  enabled: false,
  lineStyle: "dashed",
  sides: { top: true, bottom: true, left: true, right: true },
  thickness: { top: 5, bottom: 5, left: 5, right: 5 },
  borderRadius: 4,
};

export function resolveMarginGuideStyle(book: Book, chapter?: Chapter): MarginGuideStyle {
  const s = (chapter?.chapterStyleOverride && chapter.editorMarginGuideStyle)
    ? chapter.editorMarginGuideStyle
    : book.editorMarginGuideStyle;

  if (s) {
    return {
      ...DEFAULT_MARGIN_GUIDE_STYLE,
      ...s,
      sides: { ...DEFAULT_MARGIN_GUIDE_STYLE.sides, ...s.sides },
      thickness: { ...DEFAULT_MARGIN_GUIDE_STYLE.thickness, ...s.thickness },
    };
  }
  // Backward compat: old boolean flag
  return {
    ...DEFAULT_MARGIN_GUIDE_STYLE,
    enabled: book.editorShowMarginGuides ?? false,
  };
}

/**
 * Converts a MarginGuideStyle into CSSProperties for the guide overlay div.
 */
export function marginGuideToStyle(
  style: MarginGuideStyle,
  bookTheme: Theme,
): CSSProperties {
  if (!style.enabled) return { display: "none" };

  const color = style.color?.trim() || bookTheme.border;
  const { top, bottom, left, right } = style.sides;
  const { top: tt, bottom: tb, left: tl, right: tr } = style.thickness ?? DEFAULT_MARGIN_GUIDE_STYLE.thickness;

  const isFlourish = style.lineStyle === "ornament_flourish";
  const isCenter = style.lineStyle === "ornament_center";
  const cssLineStyle = (isFlourish || isCenter) ? "solid" : style.lineStyle;

  const borderValue = (on: boolean, t: number) =>
    on ? `${t}px ${cssLineStyle} ${color}` : "none";

  const base: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    borderRadius: style.borderRadius ?? 0,
    opacity: 0.85,
    borderTop:    (isFlourish || isCenter) ? "none" : borderValue(top, tt),
    borderBottom: (isFlourish || isCenter) ? "none" : borderValue(bottom, tb),
    borderLeft:   (isFlourish || isCenter) ? "none" : borderValue(left, tl),
    borderRight:  (isFlourish || isCenter) ? "none" : borderValue(right, tr),
    zIndex: 10,
  };

  if (isFlourish || isCenter) {
    const bgImages: string[] = [];
    const bgSizes: string[] = [];
    const bgPositions: string[] = [];
    const bgRepeats: string[] = [];

    const addHorizontal = (yPos: "top" | "bottom", thickness: number) => {
      const y = yPos === "top" ? "0%" : "100%";
      if (isFlourish) {
        bgImages.push(`linear-gradient(to right, transparent, ${color} 20%, ${color} 80%, transparent)`);
        bgSizes.push(`100% ${thickness}px`);
        bgPositions.push(`left ${y}`);
        bgRepeats.push("no-repeat");
      } else if (isCenter) {
        bgImages.push(`linear-gradient(to right, ${color} 0%, ${color} 43%, transparent 43%, transparent 57%, ${color} 57%, ${color} 100%)`);
        bgSizes.push(`100% ${thickness}px`);
        bgPositions.push(`left ${y}`);
        bgRepeats.push("no-repeat");
        const dotSize = Math.max(10, thickness * 3);
        bgImages.push(`radial-gradient(circle, ${color} 60%, transparent 70%)`);
        bgSizes.push(`${dotSize}px ${dotSize}px`);
        bgPositions.push(`center ${y === "0%" ? "0px" : "100%"}`);
        bgRepeats.push("no-repeat");
      }
    };

    const addVertical = (xPos: "left" | "right", thickness: number) => {
      const x = xPos === "left" ? "0%" : "100%";
      if (isFlourish) {
        bgImages.push(`linear-gradient(to bottom, transparent, ${color} 20%, ${color} 80%, transparent)`);
        bgSizes.push(`${thickness}px 100%`);
        bgPositions.push(`${x} top`);
        bgRepeats.push("no-repeat");
      } else if (isCenter) {
        bgImages.push(`linear-gradient(to bottom, ${color} 0%, ${color} 43%, transparent 43%, transparent 57%, ${color} 57%, ${color} 100%)`);
        bgSizes.push(`${thickness}px 100%`);
        bgPositions.push(`${x} top`);
        bgRepeats.push("no-repeat");
        const dotSize = Math.max(10, thickness * 3);
        bgImages.push(`radial-gradient(circle, ${color} 60%, transparent 70%)`);
        bgSizes.push(`${dotSize}px ${dotSize}px`);
        bgPositions.push(`${xPos === "left" ? "0px" : "100%"} center`);
        bgRepeats.push("no-repeat");
      }
    };

    if (top) addHorizontal("top", tt);
    if (bottom) addHorizontal("bottom", tb);
    if (left) addVertical("left", tl);
    if (right) addVertical("right", tr);

    return {
      ...base,
      backgroundImage: bgImages.join(", "),
      backgroundSize: bgSizes.join(", "),
      backgroundPosition: bgPositions.join(", "),
      backgroundRepeat: bgRepeats.join(", "),
    };
  }

  return base;
}

export function pageBorderToStyle(bs: PageBorderStyle | undefined): CSSProperties {
  if (!bs || bs.type === "none") return {};
  if (bs.type === "image" && bs.imageUrl) {
    const w = Math.max(8, bs.width || 16);
    return {
      borderWidth: w,
      borderStyle: "solid",
      borderColor: "transparent",
      borderImageSource: `url(${bs.imageUrl})`,
      borderImageSlice: 30,
      borderImageWidth: w,
      borderImageOutset: 0,
      borderImageRepeat: "stretch",
    };
  }
  if (bs.type === "double") {
    return { border: `${Math.max(1, bs.width)}px double ${bs.color || "#888"}` };
  }
  return { border: `${Math.max(1, bs.width)}px solid ${bs.color || "#888"}` };
}

/**
 * Estimates the starting page number for a given chapter within a book.
 * This takes into account chapter order, exclusions, and restarts.
 */
export function calculateChapterStartPage(book: Book, activeChapterId: string, allChapters: Chapter[]): number {
  const sorted = [...allChapters].sort((a, b) => a.sortOrder - b.sortOrder);
  let currentPage = 1;

  for (const ch of sorted) {
    if (ch.id === activeChapterId) {
      if (ch.restartPageCount) {
        return ch.startPageNumber ?? 1;
      }
      return currentPage;
    }

    if (ch.excludeFromPageCount) {
      continue;
    }

    if (ch.restartPageCount) {
      currentPage = ch.startPageNumber ?? 1;
    }

    // Estimate pages based on word count (approx 300 words per page)
    const text = ch.content.replace(/<[^>]*>/g, " ").trim();
    if (!text) {
      currentPage += 1;
    } else {
      const words = text.split(/\s+/).filter(Boolean).length;
      const estimatedPages = Math.max(1, Math.ceil(words / 300));
      currentPage += estimatedPages;
    }
  }

  return 1;
}
