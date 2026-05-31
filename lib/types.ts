// ─────────────────────────────────────────────
// CORE DOMAIN TYPES
// ─────────────────────────────────────────────

export type CoverType = "gradient" | "solid" | "image";
export type ChapterStatus = "draft" | "progress" | "complete" | "review" | "locked";
export type ParagraphWidth = "narrow" | "medium" | "wide" | "full";
export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "groq"
  | "together"
  | "fireworks"
  | "mistral"
  | "cohere"
  | "deepseek"
  | "xai"
  | "nvidia"
  | "openrouter"
  | "litellm"
  | "ollama"
  | "local"
  | "custom";

export type AiScope = "selection" | "chapter" | "book" | "research";
export type AiRole = "system" | "user" | "assistant" | "tool";
export type AiActionPreset =
  | "rewrite"
  | "shorten"
  | "expand"
  | "simplify"
  | "tone_shift"
  | "grammar"
  | "synonyms"
  | "summarize"
  | "continue"
  | "outline"
  | "research"
  | "chat";
export type BookFormatTarget = "paperback" | "hardcover" | "ebook";
export type BindingDirection = "ltr" | "rtl";
export type PrintInteriorType =
  | "black_white"
  | "premium_black_white"
  | "standard_color"
  | "premium_color";
export type PrintPaperType = "white" | "cream" | "color";
export type TrimPresetId =
  | "5x8"
  | "5.06x7.81"
  | "5.25x8"
  | "5.5x8.5"
  | "6x9"
  | "6.14x9.21"
  | "7x10"
  | "8x10"
  | "8.25x11"
  | "8.5x11"
  | "custom";
export type ValidationSeverity = "info" | "warning" | "error";
export type ExportTemplate = "novel" | "poetry" | "journal" | "essay";
export type PaperSize = "a5" | "a4" | "letter" | "trade" | TrimPresetId;

export interface AiProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  tools: boolean;
  json: boolean;
  image: boolean;
  embeddings: boolean;
  costReporting: boolean;
  customBaseUrl: boolean;
  browserSafe: boolean;
}

export interface CustomProviderPreset {
  requestTemplate: string;
  responsePath: string;
  headersTemplate?: string;
}

export interface AiProviderProfile {
  id: string;
  provider: ProviderId;
  label: string;
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
  model: string;
  /** Internal defaults, not user-configurable */
  temperature: number;
  topP: number;
  maxTokens: number;
  reasoningEffort: "low" | "medium" | "high";
  capabilities: AiProviderCapabilities;
  /** Full preset for custom provider only */
  customPreset?: CustomProviderPreset;
  notes?: string;
  lastValidatedAt?: number;
  lastError?: string;
}

export interface AiBudgetSettings {
  sessionTokens: number;
  monthlyTokens: number;
  requestTokens: number;
  estimatedCostUsd: number;
}

export interface AiSettings {
  enabled: boolean;
  activeProviderId: string | null;
  defaultScope: AiScope;
  streamResponses: boolean;
  saveChatsLocally: boolean;
  saveUsageLocally: boolean;
  showUsageInspector: boolean;
  autoSnapshotBeforeApply: boolean;
  allowResearchTools: boolean;
  showDisabledAiHints: boolean;
  systemPrompt: string;
  promptLibrary: string[];
  budget: AiBudgetSettings;
}

export interface AiUsageRecord {
  id: string;
  providerId: string;
  provider: ProviderId;
  model: string;
  scope: AiScope;
  action: AiActionPreset | "chat";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  createdAt: number;
  chapterId?: string;
  bookId?: string;
  finishReason?: string;
}

export interface AiToolCallRecord {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result: string;
}

export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  createdAt: number;
  providerId?: string;
  model?: string;
  usageId?: string;
  toolCalls?: AiToolCallRecord[];
  reasoningContent?: string;
  reasoningTimeMs?: number;
}

export interface AiImagePart {
  type: "image";
  base64: string;
  mimeType: string;
}

export interface AiConversation {
  id: string;
  bookId: string;
  chapterId?: string;
  scope: AiScope;
  title: string;
  pinnedInstruction?: string;
  providerId?: string;
  model?: string;
  createdAt: number;
  updatedAt: number;
  messages: AiMessage[];
  archived?: boolean;
}

export interface AiEditProposal {
  id: string;
  bookId: string;
  chapterId: string;
  selectionText: string;
  originalText: string;
  proposedText: string;
  prompt: string;
  action: AiActionPreset;
  providerId?: string;
  model?: string;
  createdAt: number;
  appliedAt?: number;
  snapshotId?: string;
}

export interface ChapterSummary {
  id: string;
  chapterId: string;
  summary: string;
  updatedAt: number;
}

export interface BookContextSummary {
  bookId: string;
  summary: string;
  chapterSummaries: ChapterSummary[];
  updatedAt: number;
}

export interface BookWorldEntry {
  id: string;
  bookId: string;
  kind: "character" | "location" | "term" | "plot" | "style";
  name: string;
  notes: string;
  updatedAt: number;
}

export interface PublishingTrimSize {
  preset: TrimPresetId;
  widthIn: number;
  heightIn: number;
  label: string;
}

export interface PublishingMargins {
  topIn: number;
  bottomIn: number;
  insideIn: number;
  outsideIn: number;
}

export interface PublishingFrontMatter {
  titlePage: boolean;
  copyright: boolean;
  dedication: boolean;
  toc: boolean;
  aboutAuthor: boolean;
}

export interface PublishingSpec {
  formatTargets: BookFormatTarget[];
  trim: PublishingTrimSize;
  bindingDirection: BindingDirection;
  bleed: boolean;
  paperType: PrintPaperType;
  interiorType: PrintInteriorType;
  margins: PublishingMargins;
  includePageNumbers: boolean;
  chapterStartsOnRecto: boolean;
  frontMatter: PublishingFrontMatter;
  backMatter: {
    aboutAuthor: boolean;
    alsoBy: boolean;
    callToAction: boolean;
  };
  metadata: {
    subtitle?: string;
    seriesName?: string;
    edition?: string;
    isbn?: string;
    imprint?: string;
    keywords: string[];
    categories: string[];
    description?: string;
  };
  coverFinish: "matte" | "glossy";
  lastValidatedAt?: number;
}

export interface KdpCoverSpec {
  trimWidthIn: number;
  trimHeightIn: number;
  pageCount: number;
  spineWidthIn: number;
  bleedIn: number;
  safeMarginIn: number;
  barcodeWidthIn: number;
  barcodeHeightIn: number;
  barcodeReserved: boolean;
  fullWidthIn: number;
  fullHeightIn: number;
  canHaveSpineText: boolean;
}

export interface KdpValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  field?: string;
  hint?: string;
}

export interface KdpValidationResult {
  bookId: string;
  passed: boolean;
  checkedAt: number;
  coverSpec: KdpCoverSpec;
  issues: KdpValidationIssue[];
}

/** Extra padding around the writing column in the editor (px). */
export interface EditorPagePadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PageMarginVisibility {
  top: boolean;
  bottom: boolean;
  inside: boolean;
  outside: boolean;
}

export type PageBorderType = "none" | "line" | "double" | "frame" | "image";

/** Decorative frame around the page column in the editor. */
export interface PageBorderStyle {
  type: PageBorderType;
  color: string;
  width: number;
  imageUrl?: string;
}

/** Line style options for the margin guide border. */
export type MarginGuideLineStyle =
  | "solid"
  | "double"
  | "dashed"
  | "dotted"
  | "ornament_center"
  | "ornament_flourish";

/** Customisable margin / layout guide drawn around the content area. */
export interface MarginGuideStyle {
  enabled: boolean;
  /** Hex colour; omit to use book theme border. */
  color?: string;
  lineStyle: MarginGuideLineStyle;
  /** Which sides of the guide box are visible. */
  sides: { top: boolean; bottom: boolean; left: boolean; right: boolean };
  /** Thickness in pixels for each side. */
  thickness: { top: number; bottom: number; left: number; right: number };
  /** Corner radius for the guide border box. */
  borderRadius: number;
}

/** Where the chapter title sits relative to the dashed margin guide. */
export type ChapterTitlePlacement = "inside_margin_box" | "outside_margin_box";

/** Line style under/over the chapter title. */
export type ChapterTitleDividerVariant =
  | "solid"
  | "double"
  | "dashed"
  | "dotted"
  | "ornament_center"
  | "ornament_flourish";

export interface ChapterTitleStyle {
  placement: ChapterTitlePlacement;
  /** Show decorative line(s) near the title (independent of variant when false). */
  dividerEnabled: boolean;
  dividerPosition: "below" | "above" | "both";
  dividerVariant: ChapterTitleDividerVariant;
  /** Hex colour; omit to use book theme border. */
  dividerColor?: string;
  /** Line width as % of title block (10–100). */
  dividerWidthPercent: number;
  dividerThicknessPx: number;
  /** Space between title text and adjacent line (em). */
  dividerGapEm: number;
  dividerAlign: "left" | "center" | "right";
  /** Title text alignment. */
  titleAlign: "left" | "center" | "right";
  /** Title size as multiple of body font size. */
  titleSizeEm: number;
}

/** Page number configuration. */
export interface PageNumberStyle {
  enabled: boolean;
  /** Positioning on the page. */
  position: "top_left" | "top_center" | "top_right" | "bottom_left" | "bottom_center" | "bottom_right";
  /** Font family ID or standard CSS font. */
  fontId?: string;
  fontSize: number;
  /** Hex color; omit to use book theme text color. */
  color?: string;
  /** Optional prefix/suffix like "- {n} -" or "{n}" */
  format?: string;
  /** Vertical offset from page edge (px). */
  offsetY: number;
  /** Horizontal offset from page edge (px) - only for left/right. */
  offsetX: number;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  genre?: string;
  createdAt: number;
  updatedAt: number;
  /** Preferred app theme when this book is active. */
  preferredThemeId?: string;
  /** Preferred writing font when this book is active. */
  preferredEditorFontId?: string;
  /** Preferred UI font when this book is active. */
  preferredUiFontId?: string;
  /** Preferred font size when this book is active. */
  preferredFontSize?: number;
  /** Preferred line height when this book is active. */
  preferredLineHeight?: number;
  /** Preferred paragraph width when this book is active. */
  preferredParagraphWidth?: ParagraphWidth;
  coverType: CoverType;
  coverGradient: string;
  coverSolidColor: string;
  coverAngle: number;
  coverTextureOverlay: string;
  coverImage?: string;
  // Title styling
  coverTextColor?: string;
  coverTitleFont?: string;
  coverTitleBold?: boolean;
  coverTitleItalic?: boolean;
  coverTitleUppercase?: boolean;
  coverTitleAlign?: "left" | "center" | "right";
  coverTitleY?: number;
  coverTitleSize?: number;
  coverTitleLetterSpacing?: number;
  coverTitleShadow?: boolean;
  // Subtitle on cover
  coverSubtitleText?: string;
  coverSubtitleVisible?: boolean;
  coverSubtitleFont?: string;
  coverSubtitleColor?: string;
  coverSubtitleSize?: number;
  // Author line
  coverAuthorVisible?: boolean;
  coverAuthorColor?: string;
  coverAuthorAlign?: "left" | "center" | "right";
  coverAuthorSize?: number;
  // Series / collection text
  coverSeriesText?: string;
  // Decorations
  coverShowBorder?: boolean;
  coverDivider?: boolean;
  // Effects
  coverVignette?: boolean;
  coverVignetteStrength?: number;
  coverOverlayColor?: string;
  coverOverlayOpacity?: number;
  coverDesign?: CoverDesign;
  wordGoal: number;
  isArchived: boolean;
  authorOverride?: string;
  publishing: PublishingSpec;
  bookSummary?: string;
  styleGuide?: string;
  /** On-screen editor: padding from page edge to the margin guide / content block (px). */
  editorPagePadding?: EditorPagePadding;
  /** Padding inside the margin guide, between dashed box and text (px). */
  editorInnerPadding?: EditorPagePadding;
  /** Chapter title + optional divider styling (editor + preview). */
  chapterTitleStyle?: ChapterTitleStyle;
  /** On-screen editor page/column background (hex). Empty = theme default. */
  editorPageBackground?: string;
  /** Toggle visual layout guides inside the page. */
  editorMarginGuideStyle?: MarginGuideStyle;
  /** @deprecated use editorMarginGuideStyle.enabled instead; kept for backward-compat. */
  editorShowMarginGuides?: boolean;
  /** Per-side enablement for print margins. */
  editorPageMarginVisibility?: PageMarginVisibility;
  /** Frame around the writing column. */
  pageBorderStyle?: PageBorderStyle;
  /** Global page number styling. */
  pageNumberStyle?: PageNumberStyle;
  /** Whether to show a decorative first letter in chapters. */
  dropCapEnabled?: boolean;
  /** Professional typography: justify all text in the manuscript. */
  justifyText?: boolean;
  /** Professional typography: enable hyphens for smoother edges. */
  hyphenation?: boolean;
  /** Professional typography: indentation in em (standard 1.5). */
  paragraphIndent?: number;
  /** Professional typography: ornament for scene breaks (e.g., ***). */
  sceneBreakOrnament?: "none" | "asterism" | "flower" | "bar";
  /** Professional typography: slight font tracking adjustment (em). */
  letterSpacing?: number;
  /** Professional typography: prevent single lines at bottom/top of pages. */
  widowOrphanControl?: boolean;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  sortOrder: number;
  status: ChapterStatus;
  content: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
  summary?: string;
  /** If true, the chapter uses its own style overrides instead of the book-level settings. */
  chapterStyleOverride?: boolean;
  editorPagePadding?: EditorPagePadding;
  editorInnerPadding?: EditorPagePadding;
  editorPageBackground?: string;
  editorMarginGuideStyle?: MarginGuideStyle;
  chapterTitleStyle?: ChapterTitleStyle;
  /** If true, this chapter is excluded from the global page count. */
  excludeFromPageCount?: boolean;
  /** Page number overrides for this chapter. */
  pageNumberStyle?: PageNumberStyle;
  /** If true, the page count will restart at the startPageNumber. */
  restartPageCount?: boolean;
  /** The starting page number for this chapter. */
  startPageNumber?: number;
  /** Override: whether to show a decorative first letter in this chapter. */
  dropCapEnabled?: boolean;
  justifyText?: boolean;
  hyphenation?: boolean;
  paragraphIndent?: number;
  sceneBreakOrnament?: "none" | "asterism" | "flower" | "bar";
  letterSpacing?: number;
  widowOrphanControl?: boolean;
}

export interface WritingSession {
  id: string;
  date: string;
  words: number;
}

export interface Snapshot {
  id: string;
  chapterId: string;
  content: string;
  createdAt: number;
  kind?: "manual" | "ai_before_apply" | "ai_variant";
  label?: string;
}

export interface AppSettings {
  authorName: string;
  authorBio: string;
  themeId: string;
  editorFontId: string;
  uiFontId: string;
  fontSize: number;
  lineHeight: number;
  paragraphWidth: ParagraphWidth;
  dailyGoal: number;
  typewriterMode: boolean;
  focusModeDefault: boolean;
  showWordCountAlways: boolean;
  typewriterSound: boolean;
  typewriterSoundPreset: "mechanical" | "soft" | "electric" | "classic" | "minimal";
  typewriterSoundVolume: number;
  autosaveInterval: number;
  spellingCheck: boolean;
  setupDone: boolean;
  ai: AiSettings;
}

export interface AppData {
  settings: AppSettings;
  books: Book[];
  chapters: Chapter[];
  sessions: WritingSession[];
  snapshots: Snapshot[];
  aiProviderProfiles: AiProviderProfile[];
  aiChats: AiConversation[];
  aiUsage: AiUsageRecord[];
  aiProposals: AiEditProposal[];
  bookSummaries: BookContextSummary[];
  knowledgeBase: BookWorldEntry[];
  kdpValidation: KdpValidationResult[];
}

// ─────────────────────────────────────────────
// THEME & FONT TYPES
// ─────────────────────────────────────────────

export interface Theme {
  id: string;
  name: string;
  group: "Light" | "Dark";
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentLight: string;
  editorBg: string;
  shadow: string;
  font: string;
  uiFont: string;
  bgStyle: string;
  decorativeColor: string;
  badge: string;
  badgeText: string;
}

export interface FontOption {
  id: string;
  label: string;
  stack: string;
  category: "Serif" | "Mono" | "Display" | "Sans" | "Cursive";
  feel: string;
}

export interface CoverGradientPreset {
  id: string;
  label: string;
  a: string;
  b: string;
}

export interface CoverTextureOverlay {
  id: string;
  label: string;
  opacity?: number;
}

export interface ChapterStatusDef {
  id: ChapterStatus;
  label: string;
  color: string;
}

// ─────────────────────────────────────────────
// CANVAS COVER DESIGNER
// ─────────────────────────────────────────────

export type CoverElementType = "text" | "image" | "shape" | "divider" | "ornament";

export interface CoverElement {
  id:         string;
  type:       CoverElementType;
  name:       string;
  // Position and size in % of page (0-100)
  x: number; y: number; w: number; h: number;
  rotation:   number;    // degrees
  opacity:    number;    // 0-1
  locked:     boolean;
  visible:    boolean;
  zIndex:     number;
  // Text
  text?:          string;
  fontFamily?:    string;
  fontSize?:      number;   // px at base scale (300px wide canvas)
  fontWeight?:    string;   // "400" | "700" | "900"
  fontStyle?:     "normal" | "italic";
  textAlign?:     "left" | "center" | "right";
  color?:         string;
  letterSpacing?: number;   // em
  lineHeight?:    number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textShadow?:    boolean;
  // Image
  src?:       string;       // base64
  objectFit?: "cover" | "contain" | "fill";
  // Shape
  fill?:          string;
  stroke?:        string;
  strokeWidth?:   number;
  borderRadius?:  number;
  shapeType?:     "rect" | "circle" | "line";
  // Ornament / divider
  ornamentChar?:  string;
  ornamentScale?: number;
}

export interface PageBackground {
  type:              "gradient" | "solid" | "image";
  gradientA?:        string;
  gradientB?:        string;
  gradientAngle?:    number;
  solid?:            string;
  image?:            string;   // base64
  texture?:          string;
  vignette?:         boolean;
  vignetteStrength?: number;
  overlayColor?:     string;
  overlayOpacity?:   number;
}

export interface CoverPage {
  background: PageBackground;
  elements:   CoverElement[];
}

export interface CoverDesign {
  front: CoverPage;
  spine: CoverPage;
  back:  CoverPage;
}

// ─────────────────────────────────────────────
// EXPORT OPTIONS
// ─────────────────────────────────────────────

export interface ExportOptions {
  template: ExportTemplate;
  paperSize: PaperSize;
  includeTitle: boolean;
  includeToc: boolean;
  includePageNumbers: boolean;
  authorName: string;
  fontSize: number;
  lineHeight: number;
  bleed?: boolean;
  mirroredMargins?: boolean;
  target?: BookFormatTarget;
  exportVariant?: "preview" | "kdp_print" | "ebook" | "marketing";
  dropCap?: boolean;
  justifyText?: boolean;
  hyphenation?: boolean;
  paragraphIndent?: number;
  sceneBreakOrnament?: "none" | "asterism" | "flower" | "bar";
  letterSpacing?: number;
  widowOrphanControl?: boolean;
  colorMode?: "color" | "grayscale";
}

// ─────────────────────────────────────────────
// VIEW TYPES
// ─────────────────────────────────────────────

export type AppView =
  | "library"
  | "editor"
  | "goals"
  | "appearance"
  | "fonts"
  | "profile"
  | "ai"
  | "settings";

export type ToastType = "ok" | "err";

export interface Toast {
  msg: string;
  type: ToastType;
  id: number;
}
