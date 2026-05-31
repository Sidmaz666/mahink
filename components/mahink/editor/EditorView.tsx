"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft, PanelLeft, Maximize2, Minimize2,
  Download, History, List, Bookmark, BookOpen, Plus, X, Check, Bot,
  FileText, Mic, Type, Clock, SlidersHorizontal, Share2,
} from "lucide-react";
import ChapterTitle   from "./ChapterTitle";
import FormatToolbar  from "./FormatToolbar";
import ChapterSidebar from "./ChapterSidebar";
import RichEditor     from "./RichEditor";
import ChapterPreview from "./ChapterPreview";
import AIPanel        from "./AIPanel";
import BookPropertiesPanel from "./BookPropertiesPanel";
import SelectionAddToChatPopup from "./SelectionAddToChatPopup";
import SpeechToTextWidget from "./SpeechToTextWidget";
import WebMcpBridge   from "./WebMcpBridge";
import MahinkWordmark from "../ui/MahinkWordmark";
import { countWords, fmtDate, readTime } from "@/lib/utils";
import {
  resolveEditorPageBackground,
  computeEditorMarginInsets,
  computeEditorInnerPaddingStyle,
  resolveMarginGuideStyle,
  marginGuideToStyle,
  resolveChapterTitleStyle,
  resolvePageNumberStyle,
  calculateChapterStartPage,
} from "@/lib/editorLayout";
import { CHAPTER_STATUSES, FONTS, PARAGRAPH_WIDTHS, THEMES } from "@/lib/constants";
import type { Editor } from "@tiptap/react";
import type {
  AiActionPreset,
  AiConversation,
  AiEditProposal,
  AiProviderProfile,
  AiUsageRecord,
  AppData,
  Book,
  Chapter,
  Snapshot,
  Theme,
} from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  isMobile: boolean;
  book: Book;
  chapters: Chapter[];
  activeChapter: Chapter | undefined;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => string;
  onUpdateChapter: (id: string, updates: Partial<Chapter>) => void;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, dir: "up" | "down") => void;
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  mobileDrawer: boolean;
  setMobileDrawer: (v: boolean) => void;
  zenMode: boolean;
  setZenMode: (v: boolean) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  onExport: () => void;
  onShare: () => void;
  onBack: () => void;
  onOpenProvidersSettings: () => void;
  onUpdateAiSettings: (u: Partial<AppData["settings"]["ai"]>) => void;
  upSettings: (u: Partial<AppData["settings"]>) => void;
  pw: string;
  notify: (msg: string, type?: "ok" | "err") => void;
  todayWords: number;
  dailyGoal: number;
  addSession: (words: number) => void;
  settings: AppData["settings"];
  onAddAiProfile: (profile: AiProviderProfile) => void;
  onUpdateAiProfile: (id: string, updates: Partial<AiProviderProfile>) => void;
  onSaveAiConversation: (conversation: AiConversation) => void;
  onSaveAiUsage: (usage: AiUsageRecord) => void;
  onSaveAiProposal: (proposal: AiEditProposal) => void;
  onSaveSnapshot: (snapshot: Snapshot) => void;
}


export default function EditorView({
  data, theme, isMobile, book, chapters, activeChapter,
  onSelectChapter, onAddChapter, onUpdateChapter, onDeleteChapter,
  onMoveChapter, onUpdateBook, sidebarOpen, setSidebarOpen,
  mobileDrawer, setMobileDrawer, zenMode, setZenMode,
  focusMode, setFocusMode,   onExport, onShare, onBack,   onOpenProvidersSettings, onUpdateAiSettings, upSettings, pw,
  notify, todayWords, dailyGoal, addSession, settings,
  onAddAiProfile, onUpdateAiProfile,
  onSaveAiConversation, onSaveAiUsage, onSaveAiProposal, onSaveSnapshot,
}: Props) {
  const [showNotes, setShowNotes]     = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showAi, setShowAi]           = useState(false);
  const [showProps, setShowProps]     = useState(false);
  const [wc, setWc]                   = useState(() => countWords(activeChapter?.content ?? ""));
  const [saved, setSaved]             = useState(true);
  const [editTitle, setEditTitle]     = useState(false);
  const [titleVal, setTitleVal]       = useState("");
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
  const [seededAiAction, setSeededAiAction] = useState<AiActionPreset | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [showStt, setShowStt] = useState(false);
  const [addToChatTrigger, setAddToChatTrigger] = useState(0);
  const prevContent                   = useRef("");
  const saveTimer                     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeStartX                   = useRef(0);
  const resizeStartW                   = useRef(380);

  const edFont   = FONTS[settings.editorFontId] ?? FONTS.cormorant;
  const effectivePw = book.preferredParagraphWidth
    ? (PARAGRAPH_WIDTHS[book.preferredParagraphWidth] ?? pw)
    : pw;
  const persistedWc = countWords(activeChapter?.content ?? "");
  /** Book canvas / preview colours — separate from app chrome (`theme`). */
  const bookTheme =
    THEMES[book.preferredThemeId ?? settings.themeId] ?? THEMES.parchment;

  useEffect(() => {
    if (activeChapter) {
      prevContent.current = activeChapter.content;
    }
  }, [activeChapter]);

  const handleEditorReady = useCallback((editor: Editor) => {
    setTiptapEditor(editor);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartX.current = e.clientX;
    resizeStartW.current = rightPanelWidth;
    const bodyStyle = document.body.style;
    const prevUserSelect = bodyStyle.userSelect;
    const prevCursor = bodyStyle.cursor;
    bodyStyle.userSelect = "none";
    bodyStyle.cursor = "col-resize";
    const onMove = (ev: MouseEvent) => {
      const delta = resizeStartX.current - ev.clientX;
      const newW = Math.min(600, Math.max(260, resizeStartW.current + delta));
      setRightPanelWidth(newW);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      bodyStyle.userSelect = prevUserSelect;
      bodyStyle.cursor = prevCursor;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [rightPanelWidth]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        if (!zenMode && !isMobile) {
          setShowAi(true);
          setShowNotes(false);
          setShowPreview(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zenMode, isMobile]);

  const handleChange = useCallback((html: string) => {
    if (!activeChapter) return;
    const nw = countWords(html);
    const ow = countWords(prevContent.current);
    setWc(nw);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdateChapter(activeChapter.id, { content: html });
      const delta = nw - ow;
      if (delta > 0) addSession(delta);
      prevContent.current = html;
      setSaved(true);
    }, 1100);
  }, [activeChapter, onUpdateChapter, addSession]);

  if (!activeChapter) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, color: theme.textFaint }}>
        <BookOpen size={44} style={{ opacity: 0.25 }}/>
        <p style={{ fontFamily: "var(--ed-font)", fontSize: 20, color: theme.textMuted }}>No chapter selected</p>
        <button className="btn btn-primary" onClick={onAddChapter}><Plus size={14}/>Add First Chapter</button>
      </div>
    );
  }

  const pageBg = resolveEditorPageBackground(book, bookTheme.editorBg, activeChapter);
  const marginInsets = computeEditorMarginInsets(book, isMobile, activeChapter);
  const innerPadStyle = computeEditorInnerPaddingStyle(book, isMobile, activeChapter);
  const marginGuideStyle = resolveMarginGuideStyle(book, activeChapter);
  const guideOverlayStyle = marginGuideToStyle(marginGuideStyle, bookTheme);
  const chapterTitleLayout = resolveChapterTitleStyle(book, activeChapter);
  const pns = resolvePageNumberStyle(book, activeChapter);
  const startPage = calculateChapterStartPage(book, activeChapter.id, chapters);
  const titleOutside = chapterTitleLayout.placement === "outside_margin_box";
  const desktopWorkspace = !isMobile && !zenMode;
  const shellGap = 0;
  const shellPad = 0;
  const panelBorder = `1px solid ${theme.border}`;
  const hasRightPanel = !isMobile && !zenMode && (showPreview || showAi || showNotes || showProps);
  const bookCanvasVars = {
    "--txt": bookTheme.text,
    "--txt-m": bookTheme.textMuted,
    "--txt-f": bookTheme.textFaint,
    "--brd": bookTheme.border,
    "--surf": bookTheme.surface,
    "--acc": bookTheme.accent,
  } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <style>{`
        .mahink-editor {
          text-align: ${book.justifyText !== false ? "justify" : "left"};
          hyphens: ${book.hyphenation !== false ? "auto" : "none"};
          WebkitHyphens: ${book.hyphenation !== false ? "auto" : "none"};
          letter-spacing: ${book.letterSpacing ?? 0}em;
          widows: ${book.widowOrphanControl !== false ? 3 : 1};
          orphans: ${book.widowOrphanControl !== false ? 3 : 1};
        }
        .mahink-editor p {
          margin: 0;
          text-indent: ${book.paragraphIndent ?? 1.5}em;
          margin-bottom: 0;
        }
        .mahink-editor h1, .mahink-editor h2, .mahink-editor h3 {
          text-indent: 0;
        }
        .mahink-editor.drop-cap p:first-of-type {
          text-indent: 0;
        }
        .mahink-editor.drop-cap p:first-of-type::first-letter {
          float: left;
          font-size: 3.5em;
          line-height: 0.8;
          margin-top: 0.12em;
          margin-right: 0.1em;
          font-weight: 700;
          color: var(--txt);
          font-family: serif;
        }
      `}</style>

      {/* Top bar */}
      {!zenMode && (
        <div style={{ minHeight: desktopWorkspace ? 68 : 52, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", padding: desktopWorkspace ? "10px 16px" : "0 12px", gap: 12, background: theme.surface, flexShrink: 0, zIndex: 10, minWidth: 0 }}>
          <button className="ibtn tip" data-tip="Back to library" onClick={onBack}><ArrowLeft size={16}/></button>
          {!isMobile && <button className="ibtn tip" data-tip={sidebarOpen ? "Hide chapter panel" : "Show chapter panel"} onClick={() => setSidebarOpen(!sidebarOpen)}><PanelLeft size={16}/></button>}

          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, overflow: "hidden" }}>
            {!isMobile && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 128 }}>
                <MahinkWordmark size="sm" />
                <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.textFaint, fontWeight: 700 }}>Writing studio</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              {editTitle ? (
                <input
                  className="inp"
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onBlur={() => { onUpdateBook(book.id, { title: titleVal }); setEditTitle(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { onUpdateBook(book.id, { title: titleVal }); setEditTitle(false); } }}
                  style={{ maxWidth: 420, padding: "6px 10px", fontSize: 14, fontFamily: "var(--ed-font)", fontWeight: 600 }}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => { setTitleVal(book.title); setEditTitle(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", maxWidth: 460 }}
                >
                  <div style={{ fontFamily: "var(--ed-font)", fontSize: 16, fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {book.title}
                  </div>
                  {!isMobile && (
                    <div style={{ fontSize: 11, color: theme.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {book.genre || "Book project"} · {chapters.length} chapter{chapters.length === 1 ? "" : "s"}
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!isMobile && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginRight: 8,
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: theme.text,
                  fontFamily: "var(--ui-font)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                title="Chapter word count"
              >
                <Type size={14} style={{ color: theme.textMuted, flexShrink: 0 }} />
                <span style={{ color: theme.text }}>{(saved ? persistedWc : wc).toLocaleString()} words</span>
                <Clock size={14} style={{ color: theme.textMuted, flexShrink: 0 }} />
                <span style={{ color: theme.text }}>{readTime(saved ? persistedWc : wc)}</span>
              </div>
            )}
            {!isMobile && (
              <select
                className="inp tip"
                data-tip="Book font — applies to all chapters"
                value={settings.editorFontId}
                onChange={(e) => upSettings({ editorFontId: e.target.value })}
                style={{ padding: "4px 8px", fontSize: 11, maxWidth: 140, flexShrink: 0 }}
                title="Font for this book (all chapters)"
              >
                {Object.entries(FONTS).map(([id, f]) => (
                  <option key={id} value={id} style={{ fontFamily: f.stack }}>{f.label}</option>
                ))}
              </select>
            )}
            {!isMobile && (
              <button
                className={`ibtn tip${showPreview ? " on" : ""}`}
                data-tip={showPreview ? "Hide live preview" : "Show live preview"}
                onClick={() => { const n = !showPreview; setShowPreview(n); if (n) { setShowNotes(false); setShowAi(false); setShowProps(false); } }}
              >
                <FileText size={15}/>
              </button>
            )}
            {!isMobile && (
              <button
                className={`ibtn tip${showAi ? " on" : ""}`}
                data-tip={showAi ? "Hide AI panel" : "Open AI panel"}
                onClick={() => { const n = !showAi; setShowAi(n); if (n) { setShowNotes(false); setShowPreview(false); setShowProps(false); } }}
              >
                <Bot size={15}/>
              </button>
            )}
            {!isMobile && (
              <button
                className={`ibtn tip${showNotes ? " on" : ""}`}
                data-tip={showNotes ? "Hide chapter notes" : "Chapter notes & status"}
                onClick={() => { const n = !showNotes; setShowNotes(n); if (n) { setShowPreview(false); setShowAi(false); setShowProps(false); } }}
              >
                <Bookmark size={15}/>
              </button>
            )}
            {!isMobile && (
              <button
                className={`ibtn tip${showProps ? " on" : ""}`}
                data-tip={showProps ? "Close book properties" : "Book properties — layout, theme, margins"}
                onClick={() => { const n = !showProps; setShowProps(n); if (n) { setShowPreview(false); setShowAi(false); setShowNotes(false); } }}
              >
                <SlidersHorizontal size={15}/>
              </button>
            )}
            <button className="ibtn tip" data-tip="Zen mode — full screen writing" onClick={() => setZenMode(true)}><Maximize2 size={15}/></button>
            {isMobile && <button className="ibtn tip" data-tip="Chapters" onClick={() => setMobileDrawer(true)}><List size={15}/></button>}
            <button className="ibtn tip" data-tip="Share book link" onClick={onShare}><Share2 size={15}/></button>
            <button className="ibtn tip" data-tip="Export as PDF" onClick={onExport}><Download size={15}/></button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", height: zenMode ? "100vh" : `calc(100vh - ${desktopWorkspace ? 68 : 52}px)`, overflow: "hidden", padding: shellPad, gap: shellGap }}>

        {/* Chapter sidebar */}
        {!isMobile && !zenMode && sidebarOpen && (
          <div style={{ width: 286, border: "none", borderRight: panelBorder, borderRadius: 0, overflowY: "auto", flexShrink: 0, background: theme.surface, boxShadow: "none" }}>
            <ChapterSidebar
              chapters={chapters} activeId={activeChapter.id} theme={theme} book={book}
              onSelect={onSelectChapter} onAdd={onAddChapter} onDelete={onDeleteChapter}
              onMove={onMoveChapter}
              onRename={(id, t) => onUpdateChapter(id, { title: t })}
              onStatus={(id, s) => onUpdateChapter(id, { status: s as Chapter["status"] })}
            />
          </div>
        )}

        {/* Editor area — toolbar fixed at top, content scrolls below */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", overflow: "hidden", border: "none", borderRadius: 0, boxShadow: "none", background: pageBg, borderRight: desktopWorkspace && hasRightPanel ? panelBorder : "none" }}>
          {/* Toolbar — fixed at top, outside scroll container */}
          {!zenMode && (
            <div
              className="toolbar-scroll"
              style={{
                borderBottom: `1px solid ${theme.border}`, background: theme.surface,
                padding: desktopWorkspace ? "8px 12px" : "5px 10px", display: "flex", alignItems: "center", gap: 1,
                overflowX: "auto", overflowY: "hidden", flexShrink: 0, flexWrap: "nowrap",
              }}
            >
              <FormatToolbar
                editor={tiptapEditor}
                theme={theme}
                fonts={FONTS}
                defaultFontId={settings.editorFontId}
                onAiAction={(nextAction) => {
                  setSeededAiAction(nextAction);
                  setShowAi(true);
                  setShowNotes(false);
                  setShowPreview(false);
                }}
              />
            </div>
          )}
          {/* Scrollable editor content */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <div
              style={{
                ...bookCanvasVars,
                background: pageBg,
                minHeight: "100%",
                width: "100%",
              }}
            >
              <div
                style={{
                  position: "relative",
                  minHeight: "100%",
                  width: "100%",
                  background: pageBg,
                  overflow: "hidden",
                  boxSizing: "border-box",
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
                  }}
                >
                  {titleOutside && (
                    <div
                      style={{
                        width: "100%",
                        maxWidth: effectivePw === "100%" ? "none" : effectivePw,
                        margin: effectivePw === "100%" ? 0 : "0 auto",
                        marginBottom: 12,
                      }}
                    >
                      <ChapterTitle
                        chapter={activeChapter}
                        book={book}
                        bookTheme={bookTheme}
                        bodyFontSizePx={settings.fontSize}
                        onRename={(t) => onUpdateChapter(activeChapter.id, { title: t })}
                      />
                    </div>
                  )}

                  {pns.enabled && (
                    <div
                      style={{
                        position: "absolute",
                        zIndex: 40,
                        pointerEvents: "none",
                        fontFamily: pns.fontId ? `var(--${pns.fontId})` : "var(--ui-font)",
                        fontSize: `${pns.fontSize}px`,
                        color: pns.color || bookTheme.textMuted,
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

                  <div
                    style={{
                      position: "relative",
                      ...innerPadStyle,
                      paddingBottom: Math.max(
                        typeof innerPadStyle.paddingBottom === "number" ? innerPadStyle.paddingBottom : 0,
                        104,
                      ),
                      flex: 1,
                      minHeight: 0,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    {marginGuideStyle.enabled && (
                      <div
                        aria-hidden
                        style={{
                          ...guideOverlayStyle,
                          height: "100%", // Force fill
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                        width: "100%",
                        maxWidth: effectivePw === "100%" ? "none" : effectivePw,
                        margin: effectivePw === "100%" ? 0 : "0 auto",
                      }}
                    >
                      {!titleOutside && (
                        <div style={{ paddingBottom: 12 }}>
                          <ChapterTitle
                            chapter={activeChapter}
                            book={book}
                            bookTheme={bookTheme}
                            bodyFontSizePx={settings.fontSize}
                            onRename={(t) => onUpdateChapter(activeChapter.id, { title: t })}
                          />
                        </div>
                      )}
                      <div style={{ position: "relative" }}>
                        <RichEditor
                          content={activeChapter.content}
                          chapterId={activeChapter.id}
                          focusMode={focusMode}
                          spellcheck={settings.spellingCheck}
                          typewriterSound={settings.typewriterSound}
                          typewriterSoundPreset={settings.typewriterSoundPreset}
                          typewriterSoundVolume={settings.typewriterSoundVolume}
                          onEditorReady={handleEditorReady}
                          onChange={handleChange}
                          dropCap={activeChapter?.dropCapEnabled ?? book.dropCapEnabled}
                        />
                        {!zenMode && !isMobile && (
                          <SelectionAddToChatPopup
                            editor={tiptapEditor}
                            theme={theme}
                            onAddToChat={() => {
                              setAddToChatTrigger((t) => t + 1);
                              setShowAi(true);
                              setShowNotes(false);
                              setShowPreview(false);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Mic button — fixed at bottom-right of editor area */}
          {!zenMode && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: isMobile ? 12 : 24,
                zIndex: 50,
              }}
            >
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowStt((s) => !s)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: `1px solid ${theme.border}`,
                    background: showStt ? theme.accent : theme.surface,
                    color: showStt ? "#fff" : theme.text,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Voice input"
                  aria-label="Voice input"
                >
                  <Mic size={24} />
                </button>
                {showStt && (
                  <SpeechToTextWidget
                    theme={theme}
                    editor={tiptapEditor}
                    onClose={() => setShowStt(false)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* PDF Preview panel — RIGHT side, resizable */}
        {!isMobile && !zenMode && showPreview && (
          <>
            <div
              role="button"
              tabIndex={0}
              onMouseDown={handleResizeStart}
              style={{
                width: 5, flexShrink: 0, cursor: "col-resize", background: "transparent",
              }}
              aria-label="Resize panel"
            />
            <div style={{
              width: rightPanelWidth,
              minWidth: 260, maxWidth: 600,
              overflowY: "auto", flexShrink: 0,
              background: pageBg,
              border: "none",
              borderRadius: 0,
              boxShadow: "none",
            }}>
            <ChapterPreview
              book={book}
              chapters={chapters}
              bookTheme={bookTheme}
              chapter={activeChapter}
              title={activeChapter.title}
              content={activeChapter.content}
              fontStack={edFont.stack}
              fontSize={settings.fontSize}
              lineHeight={settings.lineHeight}
              paragraphWidth={effectivePw}
            />
          </div>
          </>
        )}

        {!isMobile && !zenMode && showAi && (
          <>
            <div
              role="button"
              tabIndex={0}
              onMouseDown={handleResizeStart}
              style={{
                width: 5, flexShrink: 0, cursor: "col-resize", background: "transparent",
              }}
              aria-label="Resize panel"
            />
            <div
              style={{
                width: rightPanelWidth,
                minWidth: 300, maxWidth: 600,
                overflowY: "auto",
                flexShrink: 0,
                background: theme.surfaceAlt,
                border: "none",
                borderRadius: 0,
                boxShadow: "none",
              }}
            >
            <AIPanel
              data={data}
              theme={theme}
              book={book}
              chapters={chapters}
              activeChapter={activeChapter}
              editor={tiptapEditor}
              addToChatTrigger={addToChatTrigger}
              onSaveAiConversation={onSaveAiConversation}
              onSaveAiUsage={onSaveAiUsage}
              onSaveAiProposal={onSaveAiProposal}
              onSaveSnapshot={onSaveSnapshot}
              onOpenProvidersSettings={onOpenProvidersSettings}
              onUpdateAiSettings={onUpdateAiSettings}
              onUpdateAiProfile={onUpdateAiProfile}
              notify={notify}
              seededAction={seededAiAction}
              onConsumeSeededAction={() => setSeededAiAction(null)}
              onUpdateChapter={onUpdateChapter}
              onUpdateBook={onUpdateBook}
              onAddChapter={onAddChapter}
              onDeleteChapter={onDeleteChapter}
              onMoveChapter={onMoveChapter}
              onSelectChapter={onSelectChapter}
              upSettings={upSettings}
            />
          </div>
          </>
        )}

        {/* Notes panel */}
        {!isMobile && !zenMode && showNotes && (
          <div style={{ width: 288, border: "none", borderLeft: panelBorder, borderRadius: 0, padding: 16, overflowY: "auto", flexShrink: 0, background: theme.surface, boxShadow: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="lbl" style={{ margin: 0 }}>Chapter Notes</span>
              <button className="ibtn tip" data-tip="Close notes" onClick={() => setShowNotes(false)}><X size={14}/></button>
            </div>
            <textarea
              className="ta"
              rows={10}
              value={activeChapter.notes || ""}
              onChange={(e) => onUpdateChapter(activeChapter.id, { notes: e.target.value })}
              placeholder="Ideas, research, reminders…"
            />
            <div style={{ marginTop: 18 }}>
              <span className="lbl">Status</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {CHAPTER_STATUSES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onUpdateChapter(activeChapter.id, { status: s.id })}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: 8,
                      border: `1px solid ${activeChapter.status === s.id ? s.color : theme.border}`,
                      background: activeChapter.status === s.id ? `${s.color}22` : "transparent",
                      cursor: "pointer", fontFamily: "var(--ui-font)", fontSize: 12, fontWeight: 600,
                      color: activeChapter.status === s.id ? s.color : theme.textMuted,
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }}/>{s.label}
                    {activeChapter.status === s.id && <Check size={11} style={{ marginLeft: "auto" }}/>}
                  </button>
                ))}
              </div>
            </div>
            {(() => {
              const chapterSnapshots = (data.snapshots ?? []).filter((s) => s.chapterId === activeChapter.id).slice(0, 10);
              if (!chapterSnapshots.length) return null;
              return (
                <div style={{ marginTop: 18 }}>
                  <span className="lbl" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <History size={12} />
                    Snapshots (undo AI edits)
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {chapterSnapshots.map((snap) => (
                      <div
                        key={snap.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${theme.border}`,
                          background: theme.surfaceAlt,
                        }}
                      >
                        <span style={{ fontSize: 11, color: theme.textMuted }}>
                          {snap.label || fmtDate(snap.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateChapter(activeChapter.id, { content: snap.content, updatedAt: Date.now() });
                            if (tiptapEditor) tiptapEditor.commands.setContent(snap.content);
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: 10,
                            fontWeight: 600,
                            borderRadius: 6,
                            border: "none",
                            background: theme.accent,
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Book Properties panel (desktop) */}
        {!isMobile && !zenMode && showProps && (
          <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <BookPropertiesPanel
              book={book}
              theme={theme}
              activeChapter={activeChapter}
              onUpdateBook={onUpdateBook}
              onUpdateChapter={onUpdateChapter}
              onClose={() => setShowProps(false)}
            />
          </div>
        )}
      </div>

      {/* ── Mobile overlays ── */}
      {isMobile && showAi && !zenMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: theme.surface, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: theme.text }}>AI Assistant</span>
            <button className="ibtn" onClick={() => setShowAi(false)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.textMuted, padding: 4 }}><X size={18}/></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <AIPanel
              data={data} theme={theme} book={book} chapters={chapters}
              activeChapter={activeChapter} editor={tiptapEditor}
              addToChatTrigger={addToChatTrigger}
              onSaveAiConversation={onSaveAiConversation}
              onSaveAiUsage={onSaveAiUsage}
              onSaveAiProposal={onSaveAiProposal}
              onSaveSnapshot={onSaveSnapshot}
              onOpenProvidersSettings={onOpenProvidersSettings}
              onUpdateAiSettings={onUpdateAiSettings}
              onUpdateAiProfile={onUpdateAiProfile}
              notify={notify}
              seededAction={seededAiAction}
              onConsumeSeededAction={() => setSeededAiAction(null)}
              onUpdateChapter={onUpdateChapter}
              onUpdateBook={onUpdateBook}
              onAddChapter={onAddChapter}
              onDeleteChapter={onDeleteChapter}
              onMoveChapter={onMoveChapter}
              onSelectChapter={onSelectChapter}
              upSettings={upSettings}
            />
          </div>
        </div>
      )}

      {isMobile && showProps && !zenMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: theme.surface, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <BookPropertiesPanel
            book={book} theme={theme} activeChapter={activeChapter}
            onUpdateBook={onUpdateBook} onUpdateChapter={onUpdateChapter}
            onClose={() => setShowProps(false)}
          />
        </div>
      )}



      {isMobile && showNotes && !zenMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: theme.surface, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: theme.text }}>Chapter Notes</span>
            <button className="ibtn" onClick={() => setShowNotes(false)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.textMuted, padding: 4 }}><X size={18}/></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="lbl" style={{ margin: 0 }}>Chapter Notes</span>
              <button className="ibtn" style={{ color: theme.textMuted }}><Plus size={14}/></button>
            </div>
            <textarea
              className="inp"
              placeholder="Write your notes here..."
              value={activeChapter?.notes || ""}
              onChange={(e) => onUpdateChapter(activeChapter?.id, { notes: e.target.value })}
              style={{ width: "100%", minHeight: 200, resize: "vertical" }}
            />
          </div>
        </div>
      )}

      {/* Zen exit */}
      <WebMcpBridge
        data={data}
        book={book}
        chapters={chapters}
        activeChapter={activeChapter}
        editor={tiptapEditor}
        onUpdateBook={onUpdateBook}
        onUpdateChapter={onUpdateChapter}
        onAddChapter={onAddChapter}
        onDeleteChapter={onDeleteChapter}
        onMoveChapter={onMoveChapter}
        onSelectChapter={onSelectChapter}
        onSaveAiConversation={onSaveAiConversation}
        onSaveAiUsage={onSaveAiUsage}
        onSaveAiProposal={onSaveAiProposal}
        onSaveSnapshot={onSaveSnapshot}
        snapshots={data.snapshots ?? []}
      />

      {/* Zen exit */}
      {zenMode && (
        <button
          className="ibtn tip"
          data-tip="Exit zen mode"
          style={{ position: "fixed", top: 14, right: 14, zIndex: 200, background: theme.surface, border: `1px solid ${theme.border}`, width: 38, height: 38 }}
          onClick={() => setZenMode(false)}
        >
          <Minimize2 size={16}/>
        </button>
      )}

      {isMobile && mobileDrawer && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 190 }} onClick={() => setMobileDrawer(false)}/>
          <div className="bsht">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--ed-font)", fontSize: 17, fontWeight: 700, color: theme.text }}>Chapters</span>
              <button className="ibtn tip" data-tip="Close" onClick={() => setMobileDrawer(false)}><X size={16}/></button>
            </div>
            <ChapterSidebar
              chapters={chapters} activeId={activeChapter.id} theme={theme} book={book}
              onSelect={(id) => { onSelectChapter(id); setMobileDrawer(false); }}
              onAdd={() => { onAddChapter(); setMobileDrawer(false); }}
              onDelete={onDeleteChapter} onMove={onMoveChapter}
              onRename={(id, t) => onUpdateChapter(id, { title: t })}
              onStatus={(id, s) => onUpdateChapter(id, { status: s as Chapter["status"] })}
            />
          </div>
        </>
      )}
    </div>
  );
}
