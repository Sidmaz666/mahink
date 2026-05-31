import type {
  AiProviderProfile,
  AiSettings,
  AppData,
  AppSettings,
  Book,
  ChapterTitleStyle,
  CoverDesign,
  CoverElement,
  CoverPage,
  EditorPagePadding,
  PageBackground,
  PageBorderStyle,
  ParagraphWidth,
  PublishingMargins,
  PublishingSpec,
  PublishingTrimSize,
} from "./types";
import { COVER_GRADIENTS, STORAGE_KEY, THEMES } from "./constants";
import { DEFAULT_CHAPTER_TITLE_STYLE } from "./editorLayout";

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────

const LEGACY_STORAGE_KEY = "folio_v2";

/** Copy legacy `folio_v2` into `mahink` once so existing users keep their data. */
export function migrateStorage(): void {
  if (typeof window === "undefined") return;
  try {
    if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, localStorage.getItem(LEGACY_STORAGE_KEY)!);
    }
  } catch {
    // ignore
  }
}

function now(): number {
  return Date.now();
}

export function loadData(): AppData | null {
  migrateStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveData(d: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(d)));
  } catch {
    // storage quota exceeded or unavailable — fail silently
  }
}

// ─────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────

export function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

// ─────────────────────────────────────────────
// TEXT UTILITIES
// ─────────────────────────────────────────────

export function countWords(html: string): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 0).length;
}

export function fmtDate(ts: number | undefined): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function readTime(words: number): string {
  const m = Math.ceil(words / 200);
  if (m < 1) return "<1 min";
  if (m === 1) return "1 min";
  return `${m} mins`;
}

export function estimateTokens(text: string): number {
  const roughCharsPerToken = 4;
  return Math.max(1, Math.ceil((text || "").length / roughCharsPerToken));
}

export function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1e6) return `${(n / 1000).toFixed(2)}k`;
  if (n < 1e9) return `${(n / 1e6).toFixed(2)}m`;
  return `${(n / 1e9).toFixed(2)}b`;
}

// ─────────────────────────────────────────────
// COVER GRADIENT BUILDER
// ─────────────────────────────────────────────

export function buildCoverGradient(book: Book): string {
  if (book.coverType === "image") return book.coverSolidColor || "#1a1a2e";
  if (book.coverType === "solid") return book.coverSolidColor || "#1a1a2e";
  const preset = COVER_GRADIENTS.find((g) => g.id === book.coverGradient) ?? COVER_GRADIENTS[0];
  const angle = book.coverAngle ?? 135;
  return `linear-gradient(${angle}deg, ${preset.a}, ${preset.b})`;
}

export function createDefaultTrimSize(): PublishingTrimSize {
  return {
    preset: "6x9",
    widthIn: 6,
    heightIn: 9,
    label: '6" x 9"',
  };
}

export function createDefaultMargins(): PublishingMargins {
  return {
    topIn: 0.75,
    bottomIn: 0.75,
    insideIn: 0.875,
    outsideIn: 0.625,
  };
}

export function createDefaultPublishingSpec(partial?: Partial<PublishingSpec>): PublishingSpec {
  const trim = { ...createDefaultTrimSize(), ...partial?.trim };
  return {
    formatTargets: partial?.formatTargets ?? ["paperback", "hardcover", "ebook"],
    trim,
    bindingDirection: partial?.bindingDirection ?? "ltr",
    bleed: partial?.bleed ?? false,
    paperType: partial?.paperType ?? "cream",
    interiorType: partial?.interiorType ?? "black_white",
    margins: { ...createDefaultMargins(), ...partial?.margins },
    includePageNumbers: partial?.includePageNumbers ?? true,
    chapterStartsOnRecto: partial?.chapterStartsOnRecto ?? true,
    frontMatter: {
      titlePage: true,
      copyright: true,
      dedication: false,
      toc: false,
      aboutAuthor: false,
      ...partial?.frontMatter,
    },
    backMatter: {
      aboutAuthor: true,
      alsoBy: false,
      callToAction: false,
      ...partial?.backMatter,
    },
    metadata: {
      keywords: [],
      categories: [],
      ...partial?.metadata,
    },
    coverFinish: partial?.coverFinish ?? "matte",
    lastValidatedAt: partial?.lastValidatedAt,
  };
}

export function createDefaultAiSettings(): AiSettings {
  return {
    enabled: false,
    activeProviderId: null,
    defaultScope: "chapter",
    streamResponses: true,
    saveChatsLocally: true,
    saveUsageLocally: true,
    showUsageInspector: true,
    autoSnapshotBeforeApply: true,
    allowResearchTools: true,
    showDisabledAiHints: true,
    systemPrompt:
      "You are a collaborative, agentic book-writing assistant. Preserve the author's intent, continuity, and voice. Use only the minimum context needed, keep outputs compact and structured, never waste tokens on filler, and for edit requests return only the exact replacement text unless the user explicitly asks for analysis.",
    promptLibrary: [
      "Tighten this passage while keeping the voice intact.",
      "Suggest 5 stronger alternatives for the highlighted sentence.",
      "Summarize this chapter in 5 bullet points for continuity tracking.",
      "Find continuity risks between this chapter and the broader book context.",
      "Draft marketplace-ready metadata: description, keywords, and category angles.",
    ],
    budget: {
      sessionTokens: 250000,
      monthlyTokens: 3000000,
      requestTokens: 12000,
      estimatedCostUsd: 25,
    },
  };
}

export function createDefaultAppSettings(preferredTheme?: string): AppSettings {
  return {
    authorName: "",
    authorBio: "",
    themeId: preferredTheme ?? "mahiLight",
    editorFontId: "cormorant",
    uiFontId: "dm_sans",
    fontSize: 18,
    lineHeight: 1.85,
    paragraphWidth: "medium",
    dailyGoal: 500,
    typewriterMode: false,
    focusModeDefault: false,
    showWordCountAlways: true,
    typewriterSound: true,
    typewriterSoundPreset: "mechanical",
    typewriterSoundVolume: 50,
    autosaveInterval: 30,
    spellingCheck: true,
    setupDone: true,
    ai: createDefaultAiSettings(),
  };
}

export function createDefaultProviderProfile(): AiProviderProfile {
  return {
    id: genId(),
    provider: "openai",
    label: "OpenAI",
    apiKey: "",
    enabled: false,
    model: "gpt-4.1-mini",
    temperature: 0.7,
    topP: 1,
    maxTokens: 4000,
    reasoningEffort: "medium",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      json: true,
      image: true,
      embeddings: true,
      costReporting: true,
      customBaseUrl: true,
      browserSafe: true,
    },
  };
}

const defaultPageBorder = (): PageBorderStyle => ({
  type: "none",
  color: "#c9a227",
  width: 2,
});

const defaultPageMarginVisibility = () => ({
  top: true,
  bottom: true,
  inside: true,
  outside: true,
});

export function createBookPatch(overrides?: Partial<Book>): Partial<Book> {
  return {
    subtitle: "",
    genre: "Novel",
    coverType: "gradient",
    coverGradient: "midnight_blue",
    coverSolidColor: "#1a1a2e",
    coverAngle: 135,
    coverTextureOverlay: "none",
    wordGoal: 50000,
    isArchived: false,
    publishing: createDefaultPublishingSpec(),
    styleGuide: "",
    bookSummary: "",
    editorPagePadding: { top: 0, bottom: 0, left: 0, right: 0 },
    editorInnerPadding: { top: 0, bottom: 0, left: 0, right: 0 },
    editorPageBackground: undefined,
    editorShowMarginGuides: false,
    editorPageMarginVisibility: defaultPageMarginVisibility(),
    pageBorderStyle: defaultPageBorder(),
    chapterTitleStyle: { ...DEFAULT_CHAPTER_TITLE_STYLE },
    ...overrides,
  };
}

type VisualSettingsSnapshot = Pick<
  AppSettings,
  "themeId" | "editorFontId" | "uiFontId" | "fontSize" | "lineHeight" | "paragraphWidth"
>;

export interface TemplateVisualProfile extends Partial<VisualSettingsSnapshot> {
  editorPageBackground?: string;
  pageBorderStyle?: PageBorderStyle;
  editorPagePadding?: EditorPagePadding;
  editorInnerPadding?: EditorPagePadding;
  editorShowMarginGuides?: boolean;
  chapterTitleStyle?: ChapterTitleStyle;
  styleGuide?: string;
}

export function buildBookVisualPreferencesFromSettings(settings: VisualSettingsSnapshot): Partial<Book> {
  return {
    preferredThemeId: settings.themeId,
    preferredEditorFontId: settings.editorFontId,
    preferredUiFontId: settings.uiFontId,
    preferredFontSize: settings.fontSize,
    preferredLineHeight: settings.lineHeight,
    preferredParagraphWidth: settings.paragraphWidth,
  };
}

export function getBookVisualSettingsPatch(book?: Partial<Book> | null): Partial<AppSettings> {
  if (!book) return {};
  const patch: Partial<AppSettings> = {};
  if (book.preferredThemeId) patch.themeId = book.preferredThemeId;
  if (book.preferredEditorFontId) patch.editorFontId = book.preferredEditorFontId;
  if (book.preferredUiFontId) patch.uiFontId = book.preferredUiFontId;
  if (typeof book.preferredFontSize === "number") patch.fontSize = book.preferredFontSize;
  if (typeof book.preferredLineHeight === "number") patch.lineHeight = book.preferredLineHeight;
  if (book.preferredParagraphWidth) patch.paragraphWidth = book.preferredParagraphWidth as ParagraphWidth;
  return patch;
}

/** Distinct cover treatment per genre template (high-contrast text on gradients). */
export function getTemplateCoverDefaults(genre: string): Partial<Book> {
  const g = (genre ?? "").toLowerCase();
  const W = (s: string) => ({ coverTextColor: s });
  switch (g) {
    case "literary fiction":
      return {
        ...W("rgba(255,248,242,0.96)"),
        coverTextureOverlay: "paper_cover",
        coverShowBorder: true,
        coverDivider: true,
        coverVignette: true,
        coverVignetteStrength: 42,
        coverTitleAlign: "center",
      };
    case "fantasy":
      return {
        ...W("rgba(248,244,255,0.96)"),
        coverTextureOverlay: "leather",
        coverShowBorder: true,
        coverDivider: true,
        coverVignette: true,
        coverVignetteStrength: 38,
        coverTitleAlign: "center",
      };
    case "thriller":
      return {
        ...W("rgba(255,255,255,0.97)"),
        coverTextureOverlay: "grain",
        coverShowBorder: true,
        coverVignette: true,
        coverVignetteStrength: 55,
        coverTitleAlign: "center",
      };
    case "romance":
      return {
        ...W("rgba(255,245,248,0.96)"),
        coverTextureOverlay: "linen_cover",
        coverShowBorder: true,
        coverDivider: true,
        coverTitleAlign: "center",
      };
    case "science fiction":
      return {
        ...W("rgba(232,248,255,0.96)"),
        coverTextureOverlay: "weave",
        coverShowBorder: true,
        coverVignette: true,
        coverVignetteStrength: 35,
        coverTitleAlign: "center",
      };
    case "historical":
      return {
        ...W("rgba(255,246,230,0.96)"),
        coverTextureOverlay: "paper_cover",
        coverShowBorder: true,
        coverDivider: true,
        coverVignette: true,
        coverVignetteStrength: 40,
        coverTitleAlign: "center",
      };
    case "horror":
      return {
        ...W("rgba(255,240,242,0.94)"),
        coverTextureOverlay: "grain",
        coverShowBorder: true,
        coverVignette: true,
        coverVignetteStrength: 62,
        coverTitleAlign: "center",
      };
    case "memoir":
      return {
        ...W("rgba(255,252,240,0.96)"),
        coverTextureOverlay: "paper_cover",
        coverShowBorder: true,
        coverDivider: true,
        coverTitleAlign: "center",
      };
    case "poetry":
      return {
        ...W("rgba(252,248,255,0.96)"),
        coverTextureOverlay: "marble",
        coverShowBorder: true,
        coverDivider: true,
        coverTitleAlign: "center",
      };
    case "mystery":
      return {
        ...W("rgba(240,248,255,0.96)"),
        coverTextureOverlay: "canvas",
        coverShowBorder: true,
        coverVignette: true,
        coverVignetteStrength: 48,
        coverTitleAlign: "center",
      };
    case "young adult":
      return {
        ...W("rgba(230,255,248,0.96)"),
        coverTextureOverlay: "diamond",
        coverShowBorder: true,
        coverDivider: true,
        coverTitleAlign: "center",
      };
    case "comedy":
      return {
        ...W("rgba(255,250,240,0.96)"),
        coverTextureOverlay: "paper_cover",
        coverShowBorder: true,
        coverDivider: true,
        coverTitleAlign: "center",
      };
    case "self-help":
      return {
        ...W("rgba(245,255,248,0.96)"),
        coverTextureOverlay: "linen_cover",
        coverShowBorder: true,
        coverTitleAlign: "center",
      };
    case "children's":
      return {
        ...W("rgba(255,252,235,0.98)"),
        coverTextureOverlay: "grain",
        coverShowBorder: true,
        coverDivider: true,
        coverTitleAlign: "center",
      };
    case "nonfiction":
      return {
        ...W("rgba(248,250,255,0.96)"),
        coverTextureOverlay: "canvas",
        coverShowBorder: true,
        coverTitleAlign: "left",
      };
    default:
      return {};
  }
}

const _TEMPLATE_MARGIN = { top: 28, bottom: 38, left: 28, right: 28 };
const _TEMPLATE_INNER = { top: 14, bottom: 18, left: 16, right: 16 };

export function getTemplateVisualProfile(preset: { genre?: string; title?: string }): TemplateVisualProfile {
  switch ((preset.genre ?? "").toLowerCase()) {
    case "literary fiction":
      return {
        themeId: "parchment",
        editorFontId: "source_sans",
        uiFontId: "dm_sans",
        fontSize: 19,
        lineHeight: 1.95,
        paragraphWidth: "medium",
        editorPageBackground: "#fbf4e8",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Elegant literary prose, restrained imagery, emotional precision, and confident, understated dialogue.",
      };
    case "fantasy":
      return {
        themeId: "verdant",
        editorFontId: "eb_garamond",
        uiFontId: "jost",
        fontSize: 19,
        lineHeight: 1.9,
        paragraphWidth: "wide",
        editorPageBackground: "#f6f1e4",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Immersive epic fantasy voice with vivid setting details, mythic cadence, and clear action beats.",
      };
    case "thriller":
      return {
        themeId: "noir",
        editorFontId: "merriweather",
        uiFontId: "inter",
        fontSize: 18,
        lineHeight: 1.7,
        paragraphWidth: "medium",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Lean suspense prose, sharp scene transitions, rising tension, and clean, cinematic dialogue.",
      };
    case "romance":
      return {
        themeId: "rose",
        editorFontId: "lora",
        uiFontId: "nunito",
        fontSize: 18,
        lineHeight: 1.85,
        paragraphWidth: "medium",
        editorPageBackground: "#fff7f8",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Warm romantic tone, sensory intimacy, emotionally grounded character beats, and lyrical softness.",
      };
    case "science fiction":
      return {
        themeId: "arctic",
        editorFontId: "spectral",
        uiFontId: "jost",
        fontSize: 18,
        lineHeight: 1.8,
        paragraphWidth: "wide",
        editorPageBackground: "#edf6ff",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Clear speculative worldbuilding, crisp technical language, and momentum-forward scene construction.",
      };
    case "historical":
      return {
        themeId: "sepia",
        editorFontId: "baskerville",
        uiFontId: "lora",
        fontSize: 19,
        lineHeight: 1.9,
        paragraphWidth: "medium",
        editorPageBackground: "#f8efdf",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        chapterTitleStyle: {
          ...DEFAULT_CHAPTER_TITLE_STYLE,
          dividerEnabled: true,
          dividerVariant: "double",
          dividerWidthPercent: 56,
          dividerAlign: "center",
        },
        styleGuide: "Period-aware voice, tactile historical detail, and graceful descriptive pacing without purple prose.",
      };
    case "horror":
      return {
        themeId: "midnight",
        editorFontId: "spectral",
        uiFontId: "inter",
        fontSize: 18,
        lineHeight: 1.85,
        paragraphWidth: "medium",
        editorPagePadding: { top: 24, bottom: 32, left: 26, right: 26 },
        editorInnerPadding: { top: 16, bottom: 20, left: 18, right: 18 },
        editorShowMarginGuides: true,
        styleGuide: "Atmospheric dread, economical description, and escalating unease with sharply placed reveals.",
      };
    case "memoir":
      return {
        themeId: "champagne",
        editorFontId: "charis",
        uiFontId: "open_sans",
        fontSize: 19,
        lineHeight: 1.95,
        paragraphWidth: "medium",
        editorPageBackground: "#f9f2df",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Honest first-person reflection, vivid memory detail, and emotional clarity over ornament.",
      };
    case "poetry":
      return {
        themeId: "orchid",
        editorFontId: "literata",
        uiFontId: "dm_sans",
        fontSize: 20,
        lineHeight: 2.05,
        paragraphWidth: "narrow",
        editorPageBackground: "#faf5ff",
        editorPagePadding: { top: 32, bottom: 40, left: 36, right: 36 },
        editorInnerPadding: { top: 18, bottom: 22, left: 20, right: 20 },
        editorShowMarginGuides: true,
        chapterTitleStyle: {
          ...DEFAULT_CHAPTER_TITLE_STYLE,
          dividerEnabled: true,
          dividerVariant: "ornament_center",
          dividerWidthPercent: 44,
          dividerAlign: "center",
        },
        styleGuide: "White-space aware lyricism, image-driven language, and musical line breaks with controlled repetition.",
      };
    case "mystery":
      return {
        themeId: "inkwell",
        editorFontId: "pt_serif",
        uiFontId: "inter",
        fontSize: 18,
        lineHeight: 1.78,
        paragraphWidth: "medium",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Clue-first storytelling, tight point of view, and controlled reveals that reward close reading.",
      };
    case "young adult":
      return {
        themeId: "rose",
        editorFontId: "alegreya",
        uiFontId: "nunito",
        fontSize: 18,
        lineHeight: 1.8,
        paragraphWidth: "medium",
        editorPageBackground: "#fff6fb",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Immediate voice, emotional honesty, energetic pacing, and accessible but vivid language.",
      };
    case "comedy":
      return {
        themeId: "terracotta",
        editorFontId: "crimson",
        uiFontId: "nunito",
        fontSize: 18,
        lineHeight: 1.8,
        paragraphWidth: "medium",
        editorPageBackground: "#fff7f1",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Timing-forward prose, strong comic reversals, and character-driven humor over gag stacking.",
      };
    case "self-help":
      return {
        themeId: "forest",
        editorFontId: "open_sans",
        uiFontId: "jost",
        fontSize: 18,
        lineHeight: 1.8,
        paragraphWidth: "wide",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Practical, encouraging, highly readable nonfiction with direct takeaways and concrete examples.",
      };
    case "children's":
      return {
        themeId: "golden",
        editorFontId: "alegreya",
        uiFontId: "nunito",
        fontSize: 20,
        lineHeight: 1.95,
        paragraphWidth: "narrow",
        editorPageBackground: "#fff8e8",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Simple wonder, playful rhythm, vivid clarity, and age-appropriate emotional warmth.",
      };
    case "nonfiction":
      return {
        themeId: "slatesky",
        editorFontId: "source_sans",
        uiFontId: "inter",
        fontSize: 18,
        lineHeight: 1.82,
        paragraphWidth: "wide",
        editorPageBackground: "#f5f7fa",
        editorPagePadding: _TEMPLATE_MARGIN,
        editorInnerPadding: _TEMPLATE_INNER,
        editorShowMarginGuides: true,
        styleGuide: "Evidence-led, lucid, well-structured nonfiction with confident transitions and sharp explanatory flow.",
      };
    default:
      return {
        themeId: "mahiLight",
        editorFontId: "cormorant",
        uiFontId: "dm_sans",
        fontSize: 18,
        lineHeight: 1.85,
        paragraphWidth: "medium",
      };
  }
}

/** Migrate chapter HTML saved before MahInk rename (folio_* data attrs / classes). */
export function migrateLegacyFolioEditorHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(/data-folio-shape/g, "data-mahink-shape")
    .replace(/data-folio-drawing/g, "data-mahink-drawing")
    .replace(/\bfolio-two-columns\b/g, "mahink-two-columns");
}

function editorHexLuminance(hex: string): number | null {
  const h = hex.trim().replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Dark book-visual themes use light body text on a dark editor canvas.
 * A saved light `editorPageBackground` makes prose invisible (light-on-light).
 */
export function sanitizeBookEditorPageBackground(book: Book): Book {
  const tid = book.preferredThemeId;
  if (!tid) return book;
  const theme = THEMES[tid];
  if (!theme || theme.group !== "Dark") return book;
  const bg = book.editorPageBackground?.trim();
  if (!bg || !/^#[0-9a-fA-F]{6}$/i.test(bg)) return book;
  const L = editorHexLuminance(bg);
  if (L == null) return book;
  if (L > 0.45) {
    return { ...book, editorPageBackground: undefined };
  }
  return book;
}

export function normalizeData(input: unknown): AppData {
  const raw = (input && typeof input === "object" ? input : {}) as Partial<AppData> & {
    settings?: Partial<AppSettings> & { ai?: Partial<AiSettings> };
  };
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const baseSettings = createDefaultAppSettings(prefersDark ? "mahiDark" : "mahiLight");
  const mergedAi = {
    ...baseSettings.ai,
    ...(raw.settings?.ai ?? {}),
    budget: {
      ...baseSettings.ai.budget,
      ...(raw.settings?.ai?.budget ?? {}),
    },
    promptLibrary:
      raw.settings?.ai?.promptLibrary && raw.settings.ai.promptLibrary.length > 0
        ? raw.settings.ai.promptLibrary
        : baseSettings.ai.promptLibrary,
  };

  return {
    settings: {
      ...baseSettings,
      ...(raw.settings ?? {}),
      ai: mergedAi,
    },
    books: (raw.books ?? []).map((book) =>
      sanitizeBookEditorPageBackground({
        ...createBookPatch(),
        ...book,
        publishing: createDefaultPublishingSpec(book.publishing),
      } as Book),
    ),
    chapters: (raw.chapters ?? []).map((chapter) => ({
      ...chapter,
      notes: chapter.notes ?? "",
      content:
        typeof chapter.content === "string"
          ? migrateLegacyFolioEditorHtml(chapter.content)
          : chapter.content,
    })),
    sessions: raw.sessions ?? [],
    snapshots: raw.snapshots ?? [],
    aiProviderProfiles: (raw.aiProviderProfiles ?? []).map((p: Partial<AiProviderProfile> & { preferredModels?: { chat?: string } }) => {
      const { preferredModels, ...rest } = p as AiProviderProfile & { preferredModels?: { chat?: string } };
      const model = "model" in p && p.model ? p.model : preferredModels?.chat ?? "gpt-4.1-mini";
      return { ...rest, model } as AiProviderProfile;
    }),
    aiChats: raw.aiChats ?? [],
    aiUsage: raw.aiUsage ?? [],
    aiProposals: raw.aiProposals ?? [],
    bookSummaries: raw.bookSummaries ?? [],
    knowledgeBase: raw.knowledgeBase ?? [],
    kdpValidation: raw.kdpValidation ?? [],
  };
}

// ─────────────────────────────────────────────
// INITIAL DATA FACTORY
// ─────────────────────────────────────────────

/** Template book presets — covers all genres. */
export interface TemplateBookPreset {
  title: string;
  subtitle?: string;
  genre: string;
  coverGradient: string;
  coverSolidColor: string;
  wordGoal: number;
  bookSummary: string;
  chapters: Array<{ title: string; content: string; notes?: string }>;
}

/** Template option for picker: blank (first) or a preset. */
export type TemplateOption =
  | { kind: "blank"; id: "blank"; label: string; genre: string; coverGradient: string; coverSolidColor: string }
  | { kind: "preset"; id: string; preset: TemplateBookPreset };

export const BLANK_TEMPLATE: TemplateOption = {
  kind: "blank",
  id: "blank",
  label: "Blank",
  genre: "Start from scratch",
  coverGradient: "charcoal",
  coverSolidColor: "#1a1a1a",
};

export const TEMPLATE_BOOK_PRESETS: TemplateBookPreset[] = [
  {
    title: "The Silence Between Us",
    subtitle: "A Novel",
    genre: "Literary Fiction",
    coverGradient: "rose_wine",
    coverSolidColor: "#3a0a18",
    wordGoal: 75000,
    bookSummary: "A meditation on loss, memory, and the unspoken bonds that hold families together. Set against the backdrop of a small coastal town.",
    chapters: [
      {
        title: "Chapter One",
        content: `<p>The train pulled into Meridian Station at half past four, and the light was already failing. Elena watched the familiar platform slide past the window. Nothing had changed. She had hoped, foolishly, that something would have.</p><p>She stepped down onto the platform and felt the cold seep through the soles of her shoes. October in Meridian was always like this: damp, grey, and somehow smaller than she remembered.</p>`,
        notes: "Opening: Elena's return. Establish Meridian and the weight of absence.",
      },
      {
        title: "Chapter Two",
        content: `<p>The door opened before she could knock. Her mother stood in the frame, smaller than Elena remembered. She did not smile. She simply stepped aside and said, "You're late. Dinner is almost ready."</p>`,
        notes: "First exchange. Understated.",
      },
    ],
  },
  {
    title: "Shadows over Arcadia",
    subtitle: "A Fantasy Epic",
    genre: "Fantasy",
    coverGradient: "midnight_blue",
    coverSolidColor: "#0a0a1a",
    wordGoal: 100000,
    bookSummary: "In a realm where ancient magic has faded, a young blacksmith discovers she can rekindle the old flames. But power draws attention—from both allies and something darker.",
    chapters: [
      {
        title: "The Forge",
        content: `<p>Kira had always felt the heat differently. While other apprentices counted the hours until the bell, she stood at the anvil and felt the metal speak. Her master called it instinct. She knew it was something else.</p>`,
        notes: "Introduce protagonist and the hint of magic.",
      },
      {
        title: "The Stranger",
        content: `<p>A man in a worn cloak arrived at first light. He asked for no blade, no horseshoe. He asked for Kira by name. "The old powers stir," he said. "And they have chosen you."</p>`,
      },
    ],
  },
  {
    title: "Dead Air",
    subtitle: "A Thriller",
    genre: "Thriller",
    coverGradient: "charcoal",
    coverSolidColor: "#1a1a1a",
    wordGoal: 80000,
    bookSummary: "A late-night radio host receives a call from a voice that shouldn't exist. The caller knows things—secrets from decades ago. And they're not finished talking.",
    chapters: [
      {
        title: "3:47 AM",
        content: `<p>The red light blinked. Marcus had learned to ignore the usual crank calls—conspiracy theorists, lonely insomniacs, drunk dialers. But something about this caller made him pause. "You don't remember me," the voice said. "But you will."</p>`,
      },
    ],
  },
  {
    title: "The Last Garden",
    subtitle: "A Romance",
    genre: "Romance",
    coverGradient: "sage",
    coverSolidColor: "#2a3a2a",
    wordGoal: 65000,
    bookSummary: "When a botanist inherits a neglected estate, she finds more than overgrown roses. The groundskeeper has been keeping secrets—and a love letter that was never sent.",
    chapters: [
      {
        title: "Inheritance",
        content: `<p>The keys arrived in a small cardboard box, along with a note in looping cursive: "The garden remembers. Go see for yourself." Lena had not set foot on the estate in twenty years. She had not planned to ever return.</p>`,
      },
    ],
  },
  {
    title: "Chronicles of the Void",
    subtitle: "Space Opera",
    genre: "Science Fiction",
    coverGradient: "slate_blue",
    coverSolidColor: "#0d0d20",
    wordGoal: 95000,
    bookSummary: "The galaxy's last free port is under siege. A smuggler, a disgraced admiral, and a runaway AI must forge an uneasy alliance—or watch civilization burn.",
    chapters: [
      {
        title: "Jump Zero",
        content: `<p>The alarms had been screaming for three minutes. Captain Vale's hands moved across the console—divert power, reroute oxygen, pray the hull held. "We're not going to make it," her copilot said. "We don't have to," Vale replied. "We just have to make it interesting."</p>`,
      },
    ],
  },
  {
    title: "The Baker's Daughter",
    subtitle: "Historical Fiction",
    genre: "Historical",
    coverGradient: "gold_sand",
    coverSolidColor: "#3d3520",
    wordGoal: 70000,
    bookSummary: "In 1890s London, a young woman fights to save her father's bakery from a ruthless developer. But the developer's son is not what she expected—and neither is the truth about her own past.",
    chapters: [
      {
        title: "Dawn at the Oven",
        content: `<p>Flour dust hung in the air like winter mist. Rose had risen at four, as always, to fire the ovens. By six, the first loaves would be cooling on the racks. By seven, the queue would stretch around the corner. Today, someone new stood at the front of that queue.</p>`,
      },
    ],
  },
  {
    title: "Scream Queen",
    subtitle: "A Horror Novel",
    genre: "Horror",
    coverGradient: "crimson",
    coverSolidColor: "#2a0a0a",
    wordGoal: 75000,
    bookSummary: "A filmmaker returns to her hometown to shoot a documentary about the urban legend that defined her childhood. The legend, she discovers, has been waiting for her.",
    chapters: [
      {
        title: "Opening Night",
        content: `<p>The old theater smelled of mildew and mothballs. Sarah's crew had set up the cameras; the locals had been paid to stay away. "We're alone," her producer said. But Sarah had already noticed the footprints in the dust—small, bare, leading toward the stage.</p>`,
      },
    ],
  },
  {
    title: "Milk and Honey",
    subtitle: "A Memoir",
    genre: "Memoir",
    coverGradient: "amber_gold",
    coverSolidColor: "#3d3020",
    wordGoal: 55000,
    bookSummary: "From a childhood on a struggling dairy farm to a career in the city, this memoir traces one woman's journey to reclaim the land—and the family—she once left behind.",
    chapters: [
      {
        title: "Before the Sun",
        content: `<p>My first memory is the chill of a barn at four in the morning. My father's hands, rough and warm, guiding mine toward the udder. The cows patient, the world asleep. I did not know then that I would spend half my life trying to get back to that silence.</p>`,
      },
    ],
  },
  {
    title: "Whispers in the Rain",
    subtitle: "A Collection",
    genre: "Poetry",
    coverGradient: "violet",
    coverSolidColor: "#1e0a3c",
    wordGoal: 15000,
    bookSummary: "Lyrical verses exploring love, loss, and the quiet moments between. A journey through seasons of the heart.",
    chapters: [
      {
        title: "First Light",
        content: `<p>You asked for a poem.<br/>I gave you the morning—<br/>steam from the cup,<br/>the window half-open,<br/>and the birds that refused to wait.</p>`,
      },
      {
        title: "Between the Lines",
        content: `<p>Some things are better left unsaid.<br/>The space between words<br/>holds more than the words themselves.</p>`,
      },
    ],
  },
  {
    title: "The Locked Room",
    subtitle: "A Mystery",
    genre: "Mystery",
    coverGradient: "teal_deep",
    coverSolidColor: "#042830",
    wordGoal: 75000,
    bookSummary: "When a renowned professor is found dead in a room locked from the inside, a disgraced detective must unravel a trail of academic rivalries and long-buried secrets.",
    chapters: [
      {
        title: "The Discovery",
        content: `<p>The key turned twice in the lock. Inspector Webb had seen many crime scenes, but this one made no sense. The windows were sealed. The door had been locked from within. And yet Professor Ashworth lay on the floor, a single wound to the chest, no weapon in sight.</p>`,
      },
    ],
  },
  {
    title: "The Last Summer of Maybe",
    subtitle: "A Young Adult Novel",
    genre: "Young Adult",
    coverGradient: "rose_wine",
    coverSolidColor: "#3a0a18",
    wordGoal: 65000,
    bookSummary: "The summer before senior year, three friends make a pact to finally tell the truth—about who they are, who they love, and what they're afraid to become.",
    chapters: [
      {
        title: "June 1st",
        content: `<p>The bus to nowhere left at 4:47. We'd been planning this since March—skipping the last day of school, buying one-way tickets, and pretending we had a plan. We didn't. That was the point.</p>`,
      },
    ],
  },
  {
    title: "The Unfortunate Optimist",
    subtitle: "A Comedy",
    genre: "Comedy",
    coverGradient: "copper",
    coverSolidColor: "#2a1208",
    wordGoal: 70000,
    bookSummary: "A man who believes everything will work out fine is forced to plan his own surprise party. Chaos—and hilarity—ensue.",
    chapters: [
      {
        title: "The Invitation",
        content: `<p>"It's a surprise party," my wife said. "For you." I nodded. "So I shouldn't know about it?" "Exactly." "But you're telling me now." "You need to book the venue." I considered this. "So the surprise is that I'm planning my own surprise?" "Don't overthink it, dear."</p>`,
      },
    ],
  },
  {
    title: "Clear the Clutter",
    subtitle: "A Practical Guide",
    genre: "Self-Help",
    coverGradient: "forest_deep",
    coverSolidColor: "#1a3a20",
    wordGoal: 45000,
    bookSummary: "A no-nonsense approach to decluttering your space, your schedule, and your mind. One drawer at a time.",
    chapters: [
      {
        title: "Why We Hold On",
        content: `<p>Before we talk about letting go, we need to talk about why we hold on. Every object in your home carries a story. Some of those stories are worth keeping. Most of them are not. The trick is learning to tell the difference.</p>`,
      },
    ],
  },
  {
    title: "The Little Star That Could",
    subtitle: "A Story for Dreamers",
    genre: "Children's",
    coverGradient: "amber_gold",
    coverSolidColor: "#3d1c02",
    wordGoal: 25000,
    bookSummary: "A tiny star learns that being small doesn't mean you can't shine bright. A heartwarming tale for readers of all ages.",
    chapters: [
      {
        title: "The Smallest Star",
        content: `<p>In a corner of the night sky, far from the big, bright stars, lived a little star named Twinkle. Twinkle was the smallest star in the whole galaxy. "I wish I could shine as bright as the others," Twinkle said to the moon one night.</p>`,
      },
    ],
  },
  {
    title: "Notes from the Field",
    subtitle: "Essays & Observations",
    genre: "Nonfiction",
    coverGradient: "slate_blue",
    coverSolidColor: "#0e1a2e",
    wordGoal: 55000,
    bookSummary: "A journalist's collected essays on technology, culture, and the strange ways we adapt to an ever-changing world.",
    chapters: [
      {
        title: "The First Click",
        content: `<p>I remember the first time I saw a computer. It was 1987. The screen was green. The cursor blinked. And my father said, "This will change everything." He was right. He was also wrong. Some things never change—like the need to tell a good story.</p>`,
      },
    ],
  },
];

/** All template options for the picker: blank first, then presets. */
export const ALL_TEMPLATE_OPTIONS: TemplateOption[] = [
  BLANK_TEMPLATE,
  ...TEMPLATE_BOOK_PRESETS.map((preset) => ({
    kind: "preset" as const,
    id: preset.title.replace(/\s+/g, "-").toLowerCase(),
    preset,
  })),
];

export function pickRandomTemplatePreset(): TemplateBookPreset {
  return TEMPLATE_BOOK_PRESETS[Math.floor(Math.random() * TEMPLATE_BOOK_PRESETS.length)]!;
}

export function getInitialData(): AppData {
  const existing = loadData();
  if (existing) return existing;

  const themeId =
    (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
      ? "mahiDark"
      : "mahiLight";

  return {
    settings: createDefaultAppSettings(themeId),
    books: [],
    chapters: [],
    sessions: [],
    snapshots: [],
    aiProviderProfiles: [createDefaultProviderProfile()],
    aiChats: [],
    aiUsage: [],
    aiProposals: [],
    bookSummaries: [],
    knowledgeBase: [],
    kdpValidation: [],
  };
}

// ─────────────────────────────────────────────
// COVER DESIGN FACTORIES
// ─────────────────────────────────────────────

export function makeBgFromBook(book: Book): PageBackground {
  if (book.coverType === "image" && book.coverImage) {
    return { type: "image", image: book.coverImage };
  }
  if (book.coverType === "solid") {
    return { type: "solid", solid: book.coverSolidColor || "#1a1a2e" };
  }
  const preset = COVER_GRADIENTS.find((g) => g.id === book.coverGradient) ?? COVER_GRADIENTS[0];
  return {
    type: "gradient",
    gradientA: preset.a,
    gradientB: preset.b,
    gradientAngle: book.coverAngle ?? 135,
  };
}

/** Find COVER_GRADIENTS preset id that matches gradient colors (for syncing design → book). */
export function findCoverGradientPresetId(gradientA: string, gradientB: string): string {
  const na = (gradientA || "").toLowerCase().replace(/\s/g, "");
  const nb = (gradientB || "").toLowerCase().replace(/\s/g, "");
  const match = COVER_GRADIENTS.find((g) => {
    const ga = (g.a || "").toLowerCase().replace(/\s/g, "");
    const gb = (g.b || "").toLowerCase().replace(/\s/g, "");
    return ga === na && gb === nb;
  });
  return match?.id ?? "midnight_blue";
}

/** Sync coverDesign.front.background to book cover fields for consistent previews. */
export function syncDesignToBookCover(design: CoverDesign): Partial<Book> {
  const bg = design?.front?.background;
  if (!bg) return {};
  if (bg.type === "solid") {
    return { coverType: "solid", coverSolidColor: bg.solid || "#1a1a2e", coverAngle: bg.gradientAngle ?? 135 };
  }
  if (bg.type === "gradient" && bg.gradientA && bg.gradientB) {
    return {
      coverType: "gradient",
      coverGradient: findCoverGradientPresetId(bg.gradientA, bg.gradientB),
      coverSolidColor: bg.gradientA,
      coverAngle: bg.gradientAngle ?? 135,
    };
  }
  return {};
}

/** Apply book cover fields to coverDesign so both stay in sync (Cover Editor → Design). */
export function applyBookCoverToDesign(design: CoverDesign, book: Pick<Book, "coverType" | "coverGradient" | "coverSolidColor" | "coverAngle">): CoverDesign {
  const newBg = makeBgFromBook(book as Book);
  const updatePageBg = (p: CoverPage) => ({ ...p, background: { ...p.background, ...newBg } });
  return {
    front: updatePageBg(design.front),
    spine: updatePageBg(design.spine),
    back: updatePageBg(design.back),
  };
}

function el(overrides: Partial<CoverElement> & { id: string; type: CoverElement["type"]; name: string }): CoverElement {
  return {
    x: 10, y: 10, w: 80, h: 15,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 0,
    fontFamily: "Georgia,'Times New Roman',serif",
    fontWeight: "700", fontStyle: "normal",
    textAlign: "center", color: "rgba(255,255,255,0.92)",
    letterSpacing: 0, lineHeight: 1.3, textTransform: "none",
    textShadow: true, fontSize: 36,
    ...overrides,
  };
}

export function createDefaultCoverDesign(book: Book): CoverDesign {
  const bg = makeBgFromBook(book);
  const title = book.title || "Untitled";
  const author = book.authorOverride || "";

  const frontElements: CoverElement[] = [
    el({ id: genId(), type: "text", name: "Title", x: 8, y: 58, w: 84, h: 18, zIndex: 1, text: title, fontSize: 36, fontWeight: "700" }),
    ...(author ? [el({ id: genId(), type: "text", name: "Author", x: 8, y: 80, w: 84, h: 10, zIndex: 2, text: author, fontSize: 16, fontWeight: "400", fontStyle: "italic", color: "rgba(255,255,255,0.65)" })] : []),
  ];

  // Spine: element LOCAL width must be large (≫canvas width) so text fits on one line.
  // w=900% of spine_width(44px) = 396px local width; h=8% of spine_height(450px) = 36px.
  // Center at spine midpoint: x = 50 - 900/2 = -400%, y = 46%.
  // After rotation(-90deg) the 396×36 box appears as 36px wide × 396px tall — perfect.
  const spineElements: CoverElement[] = [
    el({ id: genId(), type: "text", name: "Spine Title",
      x: -400, y: 46, w: 900, h: 8,
      zIndex: 1, text: title,
      fontSize: 13, fontWeight: "700",
      rotation: -90, textAlign: "center",
      letterSpacing: 0.12,
    }),
  ];

  const makePage = (elements: CoverElement[]): CoverPage => ({ background: { ...bg }, elements });

  return {
    front: makePage(frontElements),
    spine: makePage(spineElements),
    back:  makePage([]),
  };
}
