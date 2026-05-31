"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Edit3, Target, Settings, Check } from "lucide-react";

import LibraryView    from "./library/LibraryView";
import EditorView     from "./editor/EditorView";
import GoalsView      from "./goals/GoalsView";
import SettingsView   from "./settings/SettingsView";
import AppearanceTab  from "./settings/AppearanceTab";
import FontsTab       from "./settings/FontsTab";
import ProfileTab     from "./settings/ProfileTab";
import ProvidersTab   from "./settings/ProvidersTab";
import DashboardShell from "./DashboardShell";
import NewBookModal         from "./modals/NewBookModal";
import TemplatePickerModal  from "./modals/TemplatePickerModal";
import EditBookModal        from "./modals/EditBookModal";
import ExportModal          from "./modals/ExportModal";
import CoverEditorModal     from "./cover/CoverEditorModal";

import { DEFAULT_CHAPTER_TITLE_STYLE } from "@/lib/editorLayout";
import { THEMES, FONTS, PARAGRAPH_WIDTHS } from "@/lib/constants";
import {
  buildBookVisualPreferencesFromSettings,
  createBookPatch,
  getInitialData,
  getTemplateVisualProfile,
  getTemplateCoverDefaults,
  saveData,
  genId,
  countWords,
  syncDesignToBookCover,
} from "@/lib/utils";
import { buildCoverGradient } from "@/lib/utils";
import { buildShareUrl, getShareDataFromHash } from "@/lib/shareUrl";
import type { TemplateBookPreset } from "@/lib/utils";
import type {
  AiConversation,
  AiEditProposal,
  AiProviderProfile,
  AiUsageRecord,
  AppData,
  AppView,
  Book,
  Chapter,
  CoverDesign,
  KdpValidationResult,
  Snapshot,
  Toast,
} from "@/lib/types";

export default function MahinkApp({ initialBookId, initialChapterId }: { initialBookId?: string; initialChapterId?: string }) {
  const [data, setData]                         = useState<AppData>(getInitialData);
  const [view, setView]                         = useState<AppView>("library");
  const [activeBookId, setActiveBookId]         = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId]   = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [mobileDrawer, setMobileDrawer]         = useState(false);
  const [zenMode, setZenMode]                   = useState(false);
  const [focusMode, setFocusMode]               = useState(false);
  const [showExport, setShowExport]             = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showNewBook, setShowNewBook]           = useState(false);
  const [showBookEdit, setShowBookEdit]         = useState<string | null>(null);
  const [showCoverEditor, setShowCoverEditor]   = useState<string | null>(null);
  const [toast, setToast]                       = useState<Toast | null>(null);
  const [searchQ, setSearchQ]                   = useState("");
  const [isMobile, setIsMobile]                 = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const initRef = useRef(false);

  // ── URL route sync: open book from dynamic route ──────────────
  useEffect(() => {
    if (!initialBookId || data.books.length === 0) return;
    const book = data.books.find((b) => b.id === initialBookId);
    if (book) {
      setActiveBookId(initialBookId);
      const chs = data.chapters.filter((c) => c.bookId === initialBookId).sort((a, b) => a.sortOrder - b.sortOrder);
      let targetChapter: string | null = null;
      if (initialChapterId && chs.some((c) => c.id === initialChapterId)) {
        targetChapter = initialChapterId;
      } else if (chs.length > 0) {
        targetChapter = chs[0].id;
      }
      if (targetChapter) setActiveChapterId(targetChapter);
      setView("editor");
    } else {
      router.replace("/app");
    }
    initRef.current = true;
  }, [initialBookId, initialChapterId, data.books, data.chapters, router]);

  // ── URL chapter sync: keep URL in sync with active chapter ──
  useEffect(() => {
    if (!initRef.current || !activeBookId || !activeChapterId) return;
    const cur = window.location.pathname;
    if (!cur.startsWith("/app/")) return;
    const expected = `/app/${activeBookId}/${activeChapterId}`;
    if (cur !== expected) {
      router.replace(expected);
    }
  }, [activeBookId, activeChapterId, router]);

  // ── Sync data-theme on <html> whenever themeId changes ──────────
  // Direct DOM write — no third-party library, guaranteed reliable.
  useEffect(() => {
    const id = data.settings.themeId;
    document.documentElement.setAttribute("data-theme", id);
    try { localStorage.setItem("mahink-theme", id); } catch { /* ignore */ }
  }, [data.settings.themeId]);

  // ── Global tooltip (fixed-position, works inside overflow:hidden) ──
  useEffect(() => {
    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "fixed", pointerEvents: "none", zIndex: "99999",
      background: "rgba(12,12,12,0.93)", color: "#f0f0f0",
      padding: "4px 10px", borderRadius: "6px", fontSize: "11px",
      fontFamily: "system-ui,sans-serif", fontWeight: "500",
      whiteSpace: "nowrap", boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
      opacity: "0", transition: "opacity 0.1s ease", display: "none",
      letterSpacing: "0.01em",
    });
    document.body.appendChild(tip);
    let hideTimer: ReturnType<typeof setTimeout>;

    const doHide = () => {
      clearTimeout(hideTimer);
      tip.style.opacity = "0";
      hideTimer = setTimeout(() => { tip.style.display = "none"; }, 110);
    };

    const show = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-tip]") as HTMLElement | null;
      if (!el) return;
      const text = el.getAttribute("data-tip");
      if (!text) return;
      clearTimeout(hideTimer);
      tip.textContent = text;
      tip.style.display = "block";
      tip.style.opacity = "0";
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const tw = tip.offsetWidth;
        const th = tip.offsetHeight;
        const left = rect.left + rect.width / 2 - tw / 2;
        let top  = rect.top - th - 8;
        if (top < 6) top = rect.bottom + 8;
        tip.style.left = `${Math.max(6, Math.min(window.innerWidth - tw - 6, left))}px`;
        tip.style.top  = `${top}px`;
        tip.style.opacity = "1";
      });
    };

    const hide = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-tip]") as HTMLElement | null;
      if (!el) return;
      // If the mouse is simply moving to a child element, don't hide
      const related = e.relatedTarget as HTMLElement | null;
      if (related && el.contains(related)) return;
      doHide();
    };

    document.addEventListener("mouseover", show);
    document.addEventListener("mouseout",  hide);
    // Hide immediately on any click or keyboard interaction (handles navigation)
    document.addEventListener("click",   doHide, true);
    document.addEventListener("keydown", doHide, true);

    return () => {
      document.removeEventListener("mouseover", show);
      document.removeEventListener("mouseout",  hide);
      document.removeEventListener("click",   doHide, true);
      document.removeEventListener("keydown", doHide, true);
      clearTimeout(hideTimer);
      if (document.body.contains(tip)) document.body.removeChild(tip);
    };
  }, []);

  // ── Responsive detection ────────────────────────────────────
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    fn(); // initialise after mount
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Editor view requires an open book
  useEffect(() => {
    if (view === "editor" && !activeBookId) setView("library");
  }, [view, activeBookId]);

  // ── Persist data ─────────────────────────────────────────────
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData(data), 600);
  }, [data]);

  // ── Notifications ─────────────────────────────────────────────
  const notify = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const applySettingsPatch = useCallback((u: Partial<AppData["settings"]>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...u } }));
  }, []);

  // ── Settings updater ─────────────────────────────────────────
  // themeId is synced via the dedicated data-theme useEffect above.
  const upSettings = useCallback((u: Partial<AppData["settings"]>) => {
    setData((d) => {
      const nextSettings = { ...d.settings, ...u };
      // App theme (themeId) is separate from book canvas theme — do not mirror themeId onto books.
      const visualUpdates: Partial<Book> = {};
      if ("editorFontId" in u && u.editorFontId) visualUpdates.preferredEditorFontId = u.editorFontId;
      if ("uiFontId" in u && u.uiFontId) visualUpdates.preferredUiFontId = u.uiFontId;
      if ("fontSize" in u && typeof u.fontSize === "number") visualUpdates.preferredFontSize = u.fontSize;
      if ("lineHeight" in u && typeof u.lineHeight === "number") visualUpdates.preferredLineHeight = u.lineHeight;
      if ("paragraphWidth" in u && u.paragraphWidth) visualUpdates.preferredParagraphWidth = u.paragraphWidth;

      return {
        ...d,
        settings: nextSettings,
        books:
          activeBookId && Object.keys(visualUpdates).length > 0
            ? d.books.map((b) => (b.id === activeBookId ? { ...b, ...visualUpdates, updatedAt: Date.now() } : b))
            : d.books,
      };
    });
  }, [activeBookId]);

  const upAiSettings = useCallback((u: Partial<AppData["settings"]["ai"]>) => {
    setData((d) => ({
      ...d,
      settings: {
        ...d.settings,
        ai: {
          ...d.settings.ai,
          ...u,
          budget: {
            ...d.settings.ai.budget,
            ...(u.budget ?? {}),
          },
        },
      },
    }));
  }, []);

  const addAiProfile = useCallback((profile: AiProviderProfile) => {
    setData((d) => ({ ...d, aiProviderProfiles: [...d.aiProviderProfiles, profile] }));
  }, []);

  const updateAiProfile = useCallback((id: string, updates: Partial<AiProviderProfile>) => {
    setData((d) => ({
      ...d,
      aiProviderProfiles: d.aiProviderProfiles.map((profile) =>
        profile.id === id
          ? {
              ...profile,
              ...updates,
              capabilities: { ...profile.capabilities, ...(updates.capabilities ?? {}) },
            }
          : profile,
      ),
    }));
  }, []);

  const removeAiProfile = useCallback((id: string) => {
    setData((d) => {
      const next = d.aiProviderProfiles.filter((p) => p.id !== id);
      const wasActive = d.settings.ai.activeProviderId === id;
      return {
        ...d,
        aiProviderProfiles: next,
        settings: {
          ...d.settings,
          ai: {
            ...d.settings.ai,
            activeProviderId: wasActive ? (next[0]?.id ?? null) : d.settings.ai.activeProviderId,
          },
        },
      };
    });
  }, []);

  const saveAiConversation = useCallback((conversation: AiConversation) => {
    setData((d) => ({
      ...d,
      aiChats: d.aiChats.some((chat) => chat.id === conversation.id)
        ? d.aiChats.map((chat) => (chat.id === conversation.id ? conversation : chat))
        : [conversation, ...d.aiChats],
    }));
  }, []);

  const saveAiUsage = useCallback((usage: AiUsageRecord) => {
    setData((d) => ({ ...d, aiUsage: [usage, ...d.aiUsage].slice(0, 250) }));
  }, []);

  const saveAiProposal = useCallback((proposal: AiEditProposal) => {
    setData((d) => ({
      ...d,
      aiProposals: d.aiProposals.some((item) => item.id === proposal.id)
        ? d.aiProposals.map((item) => (item.id === proposal.id ? proposal : item))
        : [proposal, ...d.aiProposals].slice(0, 100),
    }));
  }, []);

  const saveSnapshot = useCallback((snapshot: Snapshot) => {
    setData((d) => ({ ...d, snapshots: [snapshot, ...d.snapshots].slice(0, 250) }));
  }, []);

  const saveKdpValidation = useCallback((result: KdpValidationResult) => {
    setData((d) => ({
      ...d,
      kdpValidation: d.kdpValidation.some((item) => item.bookId === result.bookId)
        ? d.kdpValidation.map((item) => (item.bookId === result.bookId ? result : item))
        : [result, ...d.kdpValidation],
    }));
  }, []);

  // ── Derived values ─────────────────────────────────────────────
  const theme         = THEMES[data.settings.themeId] ?? THEMES.parchment;
  const edFont        = FONTS[data.settings.editorFontId] ?? FONTS.cormorant;
  const uiFont        = FONTS[data.settings.uiFontId] ?? null;
  const activeBook    = useMemo(() => data.books.find((b) => b.id === activeBookId), [data.books, activeBookId]);
  const bookChapters  = useMemo(() => data.chapters.filter((c) => c.bookId === activeBookId).sort((a, b) => a.sortOrder - b.sortOrder), [data.chapters, activeBookId]);
  const activeChapter = useMemo(() => data.chapters.find((c) => c.id === activeChapterId), [data.chapters, activeChapterId]);

  // ── Share / URL hash handling ──────────────────────────────────
  // Load shared book data from URL hash and open it in the editor
  useEffect(() => {
    const shared = getShareDataFromHash<{ book: Book; chapters: Chapter[] }>();
    if (!shared) return;
    setData((d) => {
      const exists = d.books.some((b) => b.id === shared.book.id);
      if (exists) return d;
      return {
        ...d,
        books: [...d.books, shared.book],
        chapters: [...d.chapters, ...shared.chapters],
      };
    });
    setActiveBookId(shared.book.id);
    setActiveChapterId(shared.chapters[0]?.id ?? null);
    setView("editor");
    notify("Shared book opened!");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = useCallback(() => {
    if (!activeBook) return;
    const shareData = { book: activeBook, chapters: bookChapters };
    const url = buildShareUrl(shareData);
    navigator.clipboard.writeText(url).then(() => {
      notify("Share link copied to clipboard!");
    }).catch(() => {
      notify("Could not copy link. URL: " + url, "err");
    });
  }, [activeBook, bookChapters, notify]);

  // ── Book operations ─────────────────────────────────────────────
  const openBook = useCallback((bookId: string) => {
    setActiveBookId(bookId);
    const chs = data.chapters.filter((c) => c.bookId === bookId).sort((a, b) => a.sortOrder - b.sortOrder);
    const firstCh = chs.length > 0 ? chs[0].id : undefined;
    if (firstCh) setActiveChapterId(firstCh);
    setView("editor");
    router.push(firstCh ? `/app/${bookId}/${firstCh}` : `/app/${bookId}`);
  }, [data.chapters, router]);

  const createBook = useCallback((bd: Partial<Book>) => {
    const id  = genId();
    const cid = genId();
    const bookVisualPrefs = buildBookVisualPreferencesFromSettings(data.settings);
    const nextBook = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...bookVisualPrefs,
      ...createBookPatch(bd),
      ...bd,
    } as Book;
    setData((d) => ({
      ...d,
      books:    [...d.books, nextBook],
      chapters: [...d.chapters, { id: cid, bookId: id, title: "Chapter One", sortOrder: 0, status: "draft", content: "<p>Begin your story here…</p>", notes: "", createdAt: Date.now(), updatedAt: Date.now() } as Chapter],
    }));
    setActiveBookId(id);
    setActiveChapterId(cid);
    setView("editor");
    notify("Book created — happy writing!");
  }, [data.settings, notify]);

  const createBookFromPreset = useCallback((preset: TemplateBookPreset) => {
    const bookId = genId();
    const visualProfile = getTemplateVisualProfile(preset);
    const coverExtras = getTemplateCoverDefaults(preset.genre);
    const bookPatch = createBookPatch({
      title: preset.title,
      subtitle: preset.subtitle,
      genre: preset.genre,
      coverGradient: preset.coverGradient,
      coverSolidColor: preset.coverSolidColor,
      wordGoal: preset.wordGoal,
      bookSummary: preset.bookSummary,
      styleGuide: visualProfile.styleGuide,
      editorPageBackground: visualProfile.editorPageBackground,
      preferredThemeId: visualProfile.themeId,
      preferredEditorFontId: visualProfile.editorFontId,
      preferredUiFontId: visualProfile.uiFontId,
      preferredFontSize: visualProfile.fontSize,
      preferredLineHeight: visualProfile.lineHeight,
      preferredParagraphWidth: visualProfile.paragraphWidth,
      ...(visualProfile.editorPagePadding != null ? { editorPagePadding: visualProfile.editorPagePadding } : {}),
      ...(visualProfile.editorInnerPadding != null ? { editorInnerPadding: visualProfile.editorInnerPadding } : {}),
      ...(visualProfile.editorShowMarginGuides != null ? { editorShowMarginGuides: visualProfile.editorShowMarginGuides } : {}),
      ...(visualProfile.chapterTitleStyle != null
        ? { chapterTitleStyle: { ...DEFAULT_CHAPTER_TITLE_STYLE, ...visualProfile.chapterTitleStyle } }
        : {}),
      ...coverExtras,
    });
    const newChapters = preset.chapters.map((ch, i) => ({
      id: genId(),
      bookId,
      title: ch.title,
      sortOrder: i,
      status: i === 0 ? "progress" as const : "draft" as const,
      content: ch.content,
      notes: ch.notes ?? "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    setData((d) => ({
      ...d,
      books: [...d.books, {
        id: bookId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...bookPatch,
      } as Book],
      chapters: [...d.chapters, ...newChapters],
    }));
    setActiveBookId(bookId);
    setActiveChapterId(newChapters[0]!.id);
    setView("editor");
    notify(`Created: ${preset.title}`);
  }, [notify]);

  const updateBook = useCallback((id: string, u: Partial<Book>) =>
    setData((d) => ({ ...d, books: d.books.map((b) => b.id === id ? { ...b, ...u, updatedAt: Date.now() } : b) })),
  []);

  const deleteBook = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      books:    d.books.filter((b) => b.id !== id),
      chapters: d.chapters.filter((c) => c.bookId !== id),
    }));
    if (activeBookId === id) { setActiveBookId(null); setView("library"); router.push("/app"); }
    notify("Book deleted");
  }, [activeBookId, notify, router]);

  // ── Chapter operations ──────────────────────────────────────────
  const addChapter = useCallback((): string => {
    const id  = genId();
    const max = bookChapters.length > 0 ? Math.max(...bookChapters.map((c) => c.sortOrder)) : -1;
    setData((d) => ({
      ...d,
      chapters: [...d.chapters, { id, bookId: activeBookId!, title: `Chapter ${bookChapters.length + 1}`, sortOrder: max + 1, status: "draft", content: "<p></p>", notes: "", createdAt: Date.now(), updatedAt: Date.now() } as Chapter],
    }));
    setActiveChapterId(id);
    notify("Chapter added");
    return id;
  }, [activeBookId, bookChapters, notify]);

  const updateChapter = useCallback((id: string, u: Partial<Chapter>) =>
    setData((d) => ({ ...d, chapters: d.chapters.map((c) => c.id === id ? { ...c, ...u, updatedAt: Date.now() } : c) })),
  []);

  const deleteChapter = useCallback((id: string) => {
    setData((d) => ({ ...d, chapters: d.chapters.filter((c) => c.id !== id) }));
    if (activeChapterId === id) {
      const remaining = bookChapters.filter((c) => c.id !== id);
      setActiveChapterId(remaining.length > 0 ? remaining[0].id : null);
    }
    notify("Chapter deleted");
  }, [activeChapterId, bookChapters, notify]);

  const moveChapter = useCallback((id: string, dir: "up" | "down") => {
    const idx = bookChapters.findIndex((c) => c.id === id);
    const si  = dir === "up" ? idx - 1 : idx + 1;
    if (si < 0 || si >= bookChapters.length) return;
    const a = bookChapters[idx], b = bookChapters[si];
    setData((d) => ({
      ...d,
      chapters: d.chapters.map((c) =>
        c.id === a.id ? { ...c, sortOrder: b.sortOrder } :
        c.id === b.id ? { ...c, sortOrder: a.sortOrder } : c,
      ),
    }));
  }, [bookChapters]);

  // ── Stats ───────────────────────────────────────────────────────
  const bwc = useMemo(() => {
    const m: Record<string, number> = {};
    data.chapters.forEach((c) => { m[c.bookId] = (m[c.bookId] || 0) + countWords(c.content); });
    return m;
  }, [data.chapters]);

  const todayStr   = new Date().toISOString().split("T")[0];
  const todayWords = useMemo(() =>
    data.sessions.filter((s) => s.date === todayStr).reduce((a, s) => a + s.words, 0),
  [data.sessions, todayStr]);

  const streak = useMemo(() => {
    const dates = [...new Set(data.sessions.map((s) => s.date))].sort();
    if (!dates.length) return 0;
    let n = 0;
    const cur = new Date();
    for (let i = 0; i < 365; i++) {
      const d = cur.toISOString().split("T")[0];
      if (dates.includes(d)) { n++; cur.setDate(cur.getDate() - 1); } else break;
    }
    return n;
  }, [data.sessions]);

  const addSession = useCallback((words: number) => {
    if (words <= 0) return;
    const today = new Date().toISOString().split("T")[0];
    setData((d) => {
      const ex = d.sessions.find((s) => s.date === today);
      if (ex) return { ...d, sessions: d.sessions.map((s) => s.date === today ? { ...s, words: s.words + words } : s) };
      return { ...d, sessions: [...d.sessions, { id: genId(), date: today, words }] };
    });
  }, []);

  // ── CSS custom properties ─────────────────────────────────────
  // All theme + settings vars are set directly from the JS objects.
  // This guarantees every var(--*) resolves on the very first render,
  // independent of next-themes' data-theme timing.
  const pw = PARAGRAPH_WIDTHS[data.settings.paragraphWidth] ?? "680px";

  const cssVars = {
    // Theme colour tokens
    "--bg":        theme.bg,
    "--surf":      theme.surface,
    "--surf-alt":  theme.surfaceAlt,
    "--brd":       theme.border,
    "--txt":       theme.text,
    "--txt-m":     theme.textMuted,
    "--txt-f":     theme.textFaint,
    "--acc":       theme.accent,
    "--acc-l":     theme.accentLight,
    "--ed-bg":     theme.editorBg,
    "--shd":       theme.shadow,
    "--badge":     theme.badge,
    "--badge-txt": theme.badgeText,
    "--ui-font":   uiFont ? uiFont.stack : theme.uiFont,
    // Settings-based tokens
    "--ed-font":   edFont.stack,
    "--fs":        `${data.settings.fontSize}px`,
    "--lh":        `${data.settings.lineHeight}`,
    "--pw":        pw,
    "--wc-bottom": isMobile ? "72px" : "18px",
  } as React.CSSProperties;

  return (
    <div
      style={{
        ...cssVars,
        fontFamily:           "var(--ui-font)",
        backgroundColor:      theme.bg,
        backgroundImage:      theme.bgStyle,
        backgroundAttachment: "fixed",
        color:                theme.text,
        height:               "100vh",
        overflow:             "hidden",
        display:              "flex",
        flexDirection:        "column",
        position:             "relative",
      }}
    >
      {/* Subtle film-grain overlay */}
      <div style={{
        position:         "fixed",
        inset:            0,
        backgroundImage:  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize:   "180px",
        pointerEvents:    "none",
        zIndex:           9998,
        mixBlendMode:     "overlay",
      }}/>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {view === "editor" && activeBook ? (
          <EditorView
            data={data} theme={theme} isMobile={isMobile}
            book={activeBook} chapters={bookChapters} activeChapter={activeChapter}
            onSelectChapter={setActiveChapterId} onAddChapter={addChapter}
            onUpdateChapter={updateChapter} onDeleteChapter={deleteChapter}
            onMoveChapter={moveChapter} onUpdateBook={updateBook}
            sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
            mobileDrawer={mobileDrawer} setMobileDrawer={setMobileDrawer}
            zenMode={zenMode} setZenMode={setZenMode}
            focusMode={focusMode} setFocusMode={setFocusMode}
            onExport={() => setShowExport(true)} onShare={handleShare} onBack={() => { setView("library"); router.push("/app"); }}
            onOpenProvidersSettings={() => setView("ai")}
            onUpdateAiSettings={upAiSettings}
            upSettings={upSettings}
            pw={pw} notify={notify}
            todayWords={todayWords} dailyGoal={data.settings.dailyGoal}
            addSession={addSession} settings={data.settings}
            onAddAiProfile={addAiProfile}
            onUpdateAiProfile={updateAiProfile}
            onSaveAiConversation={saveAiConversation}
            onSaveAiUsage={saveAiUsage}
            onSaveAiProposal={saveAiProposal}
            onSaveSnapshot={saveSnapshot}
          />
        ) : (
          <DashboardShell
            theme={theme}
            isMobile={isMobile}
            activeView={view === "editor" ? "library" : (view as Exclude<typeof view, "editor">)}
            onNavigate={(v) => setView(v)}
            onNewBook={() => setShowTemplatePicker(true)}
          >
            {(view === "library" || view === "editor") && (
              <LibraryView
                data={data} theme={theme} isMobile={isMobile}
                onOpenBook={openBook} onCreateBook={() => setShowTemplatePicker(true)}
                onDeleteBook={deleteBook} onUpdateBook={updateBook}
                bwc={bwc} todayWords={todayWords} streak={streak}
                searchQ={searchQ} setSearchQ={setSearchQ}
                upSettings={upSettings}
                setShowBookEdit={setShowBookEdit}
                onOpenProfileSettings={() => setView("profile")}
              />
            )}
            {view === "goals" && (
              <GoalsView
                data={data} theme={theme} isMobile={isMobile}
                todayWords={todayWords} streak={streak} bwc={bwc}
                upSettings={upSettings}
              />
            )}
            {view === "appearance" && (
              <div className="fade-in" style={{ padding: isMobile ? "16px 16px 88px" : "24px 28px 40px" }}>
                <AppearanceTab data={data} theme={theme} upSettings={upSettings} />
              </div>
            )}
            {view === "fonts" && (
              <div className="fade-in" style={{ padding: isMobile ? "16px 16px 88px" : "24px 28px 40px" }}>
                <FontsTab data={data} theme={theme} upSettings={upSettings} />
              </div>
            )}
            {view === "profile" && (
              <div className="fade-in" style={{ padding: isMobile ? "16px 16px 88px" : "24px 28px 40px" }}>
                <ProfileTab data={data} theme={theme} upSettings={upSettings} />
              </div>
            )}
            {view === "ai" && (
              <div className="fade-in" style={{ padding: isMobile ? "16px 16px 88px" : "24px 28px 40px" }}>
                <ProvidersTab
                  data={data} theme={theme} notify={notify}
                  onUpdateAiSettings={upAiSettings}
                  onAddAiProfile={addAiProfile}
                  onUpdateAiProfile={updateAiProfile}
                  onRemoveAiProfile={removeAiProfile}
                />
              </div>
            )}
            {view === "settings" && (
              <SettingsView
                data={data} theme={theme} isMobile={isMobile}
                upSettings={upSettings} notify={notify}
              />
            )}
          </DashboardShell>
        )}

        {/* Mobile bottom nav */}
        {isMobile && !zenMode && (
          <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surf)", borderTop: "1px solid var(--brd)", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" }}>
            {([
              { id: "library"    as AppView, Icon: BookOpen, label: "Library",  disabled: false        },
              { id: "editor"     as AppView, Icon: Edit3,    label: "Write",    disabled: !activeBookId },
              { id: "goals"      as AppView, Icon: Target,   label: "Goals",    disabled: false        },
              { id: "appearance" as AppView, Icon: Settings, label: "Settings", disabled: false        },
            ]).map(({ id, Icon, label, disabled }) => (
              <button
                key={id}
                onClick={() => !disabled && setView(id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 3, padding: "10px 0", cursor: disabled ? "not-allowed" : "pointer",
                  color: view === id ? "var(--acc)" : "var(--txt-f)",
                  fontSize: 10, fontWeight: 600, border: "none", background: "none",
                  opacity: disabled ? 0.3 : 1, fontFamily: "var(--ui-font)", transition: "color 0.15s",
                }}
              >
                <Icon size={20}/><span>{label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Modals */}
      {showTemplatePicker && (
        <TemplatePickerModal
          theme={theme}
          onSelectBlank={() => { setShowTemplatePicker(false); setShowNewBook(true); }}
          onSelectPreset={(preset) => { setShowTemplatePicker(false); createBookFromPreset(preset); }}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
      {showNewBook && (
        <NewBookModal theme={theme} onCreate={createBook} onClose={() => setShowNewBook(false)}/>
      )}
      {showBookEdit && (
        <EditBookModal
          book={data.books.find((b) => b.id === showBookEdit) ?? null}
          theme={theme} onUpdate={updateBook}
          onClose={() => setShowBookEdit(null)} notify={notify}
          onOpenCoverEditor={(id) => { setShowBookEdit(null); setShowCoverEditor(id); }}
        />
      )}
      {showCoverEditor && (() => {
        const b = data.books.find(bk => bk.id === showCoverEditor);
        if (!b) return null;
        return (
          <CoverEditorModal
            book={b}
            data={data}
            theme={theme}
            onSave={(design: CoverDesign) => updateBook(b.id, { coverDesign: design, ...syncDesignToBookCover(design) })}
            onClose={() => setShowCoverEditor(null)}
            notify={notify}
            onSaveAiConversation={saveAiConversation}
            onSaveAiUsage={saveAiUsage}
            onOpenProvidersSettings={() => {
              setShowCoverEditor(null);
              setView("ai");
            }}
          />
        );
      })()}
      {showExport && activeBook && (
        <ExportModal
          book={activeBook} chapters={bookChapters} theme={theme}
          settings={data.settings} onClose={() => setShowExport(false)} notify={notify}
          validation={data.kdpValidation.find((item) => item.bookId === activeBook.id) ?? null}
          onSaveValidation={saveKdpValidation}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className="toast-anim"
          style={{
            position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
            background: toast.type === "err" ? "#fc8181" : theme.accent,
            color: "#fff", padding: "10px 20px", borderRadius: 8,
            fontSize: 13, fontWeight: 600, zIndex: 9999,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: `0 4px 24px ${theme.shadow}`, whiteSpace: "nowrap",
          }}
        >
          <Check size={14}/>{toast.msg}
        </div>
      )}
    </div>
  );
}
