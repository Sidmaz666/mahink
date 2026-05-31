import type {
  Book,
  Chapter,
  KdpCoverSpec,
  KdpValidationIssue,
  KdpValidationResult,
  PublishingSpec,
  PublishingTrimSize,
  TrimPresetId,
} from "./types";
import { countWords, genId } from "./utils";

export const TRIM_PRESETS: Record<Exclude<TrimPresetId, "custom">, PublishingTrimSize> = {
  "5x8": { preset: "5x8", widthIn: 5, heightIn: 8, label: '5" x 8"' },
  "5.06x7.81": { preset: "5.06x7.81", widthIn: 5.06, heightIn: 7.81, label: '5.06" x 7.81"' },
  "5.25x8": { preset: "5.25x8", widthIn: 5.25, heightIn: 8, label: '5.25" x 8"' },
  "5.5x8.5": { preset: "5.5x8.5", widthIn: 5.5, heightIn: 8.5, label: '5.5" x 8.5"' },
  "6x9": { preset: "6x9", widthIn: 6, heightIn: 9, label: '6" x 9"' },
  "6.14x9.21": { preset: "6.14x9.21", widthIn: 6.14, heightIn: 9.21, label: '6.14" x 9.21"' },
  "7x10": { preset: "7x10", widthIn: 7, heightIn: 10, label: '7" x 10"' },
  "8x10": { preset: "8x10", widthIn: 8, heightIn: 10, label: '8" x 10"' },
  "8.25x11": { preset: "8.25x11", widthIn: 8.25, heightIn: 11, label: '8.25" x 11"' },
  "8.5x11": { preset: "8.5x11", widthIn: 8.5, heightIn: 11, label: '8.5" x 11"' },
};

export function estimatePrintedPageCount(chapters: Chapter[], wordsPerPage = 320): number {
  const words = chapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0);
  return Math.max(24, Math.ceil(words / wordsPerPage));
}

export function getInsideMarginByPageCount(pageCount: number): number {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.5;
  if (pageCount <= 500) return 0.625;
  if (pageCount <= 700) return 0.75;
  if (pageCount <= 828) return 0.875;
  return 1;
}

export function getOutsideMargin(bleed: boolean): number {
  return bleed ? 0.375 : 0.25;
}

export function getSpineWidthIn(pageCount: number, paperType: PublishingSpec["paperType"]): number {
  const perPage = paperType === "white" ? 0.002252 : paperType === "cream" ? 0.0025 : 0.002347;
  return Number((pageCount * perPage).toFixed(4));
}

export function buildKdpCoverSpec(book: Book, chapters: Chapter[]): KdpCoverSpec {
  const pageCount = estimatePrintedPageCount(chapters);
  const trim = book.publishing.trim;
  const bleedIn = 0.125;
  const safeMarginIn = 0.125;
  const spineWidthIn = getSpineWidthIn(pageCount, book.publishing.paperType);
  const fullWidthIn = Number((trim.widthIn * 2 + spineWidthIn + bleedIn * 2).toFixed(4));
  const fullHeightIn = Number((trim.heightIn + bleedIn * 2).toFixed(4));

  return {
    trimWidthIn: trim.widthIn,
    trimHeightIn: trim.heightIn,
    pageCount,
    spineWidthIn,
    bleedIn,
    safeMarginIn,
    barcodeWidthIn: 2,
    barcodeHeightIn: 1.2,
    barcodeReserved: true,
    fullWidthIn,
    fullHeightIn,
    canHaveSpineText: pageCount >= 79,
  };
}

export function validateKdpCompliance(book: Book, chapters: Chapter[]): KdpValidationResult {
  const issues: KdpValidationIssue[] = [];
  const spec = buildKdpCoverSpec(book, chapters);
  const publishing = book.publishing;
  const words = chapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0);

  if (!book.title.trim()) {
    issues.push({
      id: genId(),
      severity: "error",
      code: "missing_title",
      field: "book.title",
      message: "Book title is required for a compliant print export.",
      hint: "Enter a final publishing title before export.",
    });
  }

  if (!publishing.metadata.description?.trim()) {
    issues.push({
      id: genId(),
      severity: "warning",
      code: "missing_description",
      field: "publishing.metadata.description",
      message: "No description/blurb is set for marketplace metadata.",
      hint: "Generate or write a marketplace-ready description before final export.",
    });
  }

  if (!publishing.metadata.keywords.length) {
    issues.push({
      id: genId(),
      severity: "warning",
      code: "missing_keywords",
      field: "publishing.metadata.keywords",
      message: "No search keywords are configured.",
      hint: "Add at least 3-7 keywords for marketplace submission.",
    });
  }

  if (!publishing.metadata.categories.length) {
    issues.push({
      id: genId(),
      severity: "warning",
      code: "missing_categories",
      field: "publishing.metadata.categories",
      message: "No publishing categories are configured.",
      hint: "Choose at least one marketplace-relevant category.",
    });
  }

  if (publishing.bleed && publishing.margins.outsideIn < 0.375) {
    issues.push({
      id: genId(),
      severity: "error",
      code: "outside_margin_too_small_bleed",
      field: "publishing.margins.outsideIn",
      message: "Outside margins must be at least 0.375 in for bleed interiors under common print-platform rules.",
      hint: "Increase outside, top, and bottom margins for bleed exports.",
    });
  }

  if (!publishing.bleed && publishing.margins.outsideIn < 0.25) {
    issues.push({
      id: genId(),
      severity: "error",
      code: "outside_margin_too_small",
      field: "publishing.margins.outsideIn",
      message: "Outside margins must be at least 0.25 in without bleed.",
      hint: "Increase outside margins to the published minimum.",
    });
  }

  const recommendedInside = getInsideMarginByPageCount(spec.pageCount);
  if (publishing.margins.insideIn < recommendedInside) {
    issues.push({
      id: genId(),
      severity: "error",
      code: "inside_margin_too_small",
      field: "publishing.margins.insideIn",
      message: `Inside gutter should be at least ${recommendedInside.toFixed(3)} in for a ${spec.pageCount}-page book.`,
      hint: "Increase gutter/inside margin to reduce trim and binding risk.",
    });
  }

  if (publishing.coverFinish !== "matte" && publishing.coverFinish !== "glossy") {
    issues.push({
      id: genId(),
      severity: "warning",
      code: "cover_finish_unknown",
      field: "publishing.coverFinish",
      message: "Cover finish is not set to a supported print-market option.",
      hint: "Choose matte or glossy.",
    });
  }

  if (book.coverDesign?.spine?.elements?.length && !spec.canHaveSpineText) {
    issues.push({
      id: genId(),
      severity: "warning",
      code: "spine_text_page_count",
      field: "coverDesign.spine",
      message: "Amazon KDP allows spine text only when the book has at least 79 pages.",
      hint: "Remove spine text or increase page count before final export.",
    });
  }

  if (words < 3000 && publishing.formatTargets.includes("paperback")) {
    issues.push({
      id: genId(),
      severity: "warning",
      code: "low_word_count",
      field: "chapters",
      message: "This manuscript is very short and may not suit standard paperback workflows.",
      hint: "Review trim, page count, and spine expectations before export.",
    });
  }

  if (!publishing.frontMatter.titlePage) {
    issues.push({
      id: genId(),
      severity: "info",
      code: "no_title_page",
      field: "publishing.frontMatter.titlePage",
      message: "Title page is disabled.",
      hint: "That is allowed, but many KDP books include a title page for polish.",
    });
  }

  return {
    bookId: book.id,
    passed: !issues.some((issue) => issue.severity === "error"),
    checkedAt: Date.now(),
    coverSpec: spec,
    issues,
  };
}
