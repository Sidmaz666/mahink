"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as Diff from "diff";
import { Bot, Check, ChevronDown, ChevronRight, CopyPlus, FileText, History, ImagePlus, MessageSquare, Pencil, RefreshCw, Reply, Send, Sparkles, Square, X } from "lucide-react";
import type { Editor } from "@tiptap/react";
import ChatMessageContent from "./ChatMessageContent";
import { createConversation, executeAiAction, getActiveProviderProfile, isAiUsable } from "@/lib/ai";
import { stripToolCallsForDisplay } from "@/lib/aiTools";
import { getProviderCatalogEntry, LOCAL_MODELS } from "@/lib/providers";
import { estimateTokens, formatTokens, genId } from "@/lib/utils";
import type {
  AiActionPreset,
  AiConversation,
  AiEditProposal,
  AiImagePart,
  AiProviderProfile,
  AiScope,
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
  book: Book;
  chapters: Chapter[];
  activeChapter: Chapter;
  editor: Editor | null;
  addToChatTrigger?: number;
  onSaveAiConversation: (conversation: AiConversation) => void;
  onSaveAiUsage: (usage: AiUsageRecord) => void;
  onSaveAiProposal: (proposal: AiEditProposal) => void;
  onSaveSnapshot: (snapshot: Snapshot) => void;
  onOpenProvidersSettings: () => void;
  onUpdateAiSettings?: (u: Partial<AppData["settings"]["ai"]>) => void;
  onUpdateAiProfile?: (id: string, updates: Partial<AiProviderProfile>) => void;
  notify: (msg: string, type?: "ok" | "err") => void;
  seededAction?: AiActionPreset | null;
  onConsumeSeededAction: () => void;
  onUpdateChapter?: (id: string, updates: Partial<Chapter>) => void;
  onUpdateBook?: (id: string, updates: Partial<Book>) => void;
  onAddChapter?: () => string;
  onDeleteChapter?: (id: string) => void;
  onMoveChapter?: (id: string, dir: "up" | "down") => void;
  onSelectChapter?: (id: string) => void;
  upSettings?: (u: Partial<AppData["settings"]>) => void;
}

function DiffBlock({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "before" | "after";
}) {
  const bg = tone === "before" ? "rgba(229,62,62,0.08)" : "rgba(56,161,105,0.10)";
  const border = tone === "before" ? "rgba(229,62,62,0.35)" : "rgba(56,161,105,0.35)";
  const color = tone === "before" ? "#9b2c2c" : "#276749";
  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", background: bg, color }}>
        {title}
      </div>
      <div style={{ padding: 12, fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", background: "#fff" }}>
        {text}
      </div>
    </div>
  );
}

function InlineDiff({ original, proposed }: { original: string; proposed: string }) {
  const changes = Diff.diffWords(original, proposed);
  return (
    <div style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
      {changes.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} style={{ background: "rgba(56,161,105,0.25)", color: "#276749", padding: "0 1px" }}>
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} style={{ background: "rgba(229,62,62,0.2)", color: "#9b2c2c", textDecoration: "line-through", padding: "0 1px" }}>
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </div>
  );
}

export default function AIPanel({
  data,
  theme,
  book,
  chapters,
  activeChapter,
  editor,
  addToChatTrigger,
  onSaveAiConversation,
  onSaveAiUsage,
  onSaveAiProposal,
  onSaveSnapshot,
  onOpenProvidersSettings,
  onUpdateAiSettings,
  onUpdateAiProfile,
  notify,
  seededAction,
  onConsumeSeededAction,
  onUpdateChapter,
  onUpdateBook,
  onAddChapter,
  onDeleteChapter,
  onMoveChapter,
  onSelectChapter,
  upSettings,
}: Props) {
  const provider = getActiveProviderProfile(data);
  const [prompt, setPrompt] = useState("");
  const [scope, setScope] = useState<AiScope>(data.settings.ai.defaultScope);
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState<AiActionPreset>("chat");
  const [pendingProposal, setPendingProposal] = useState<AiEditProposal | null>(null);
  const [pendingRange, setPendingRange] = useState<{ from: number; to: number } | null>(null);
  const [selectionInfo, setSelectionInfo] = useState({ text: "", from: 0, to: 0 });
  const [panelMessage, setPanelMessage] = useState<{ type: "info" | "err"; text: string } | null>(null);
  const [imageParts, setImageParts] = useState<AiImagePart[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [requestStartTime, setRequestStartTime] = useState<number | null>(null);
  const requestStartTimeRef = React.useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const reasoningEndTimeRef = React.useRef<number | null>(null);
  const [thinkingCollapsed, setThinkingCollapsed] = useState(true);
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [aiMode, setAiMode] = useState<"talk" | "write">("write");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [pinnedContext, setPinnedContext] = useState<string | null>(null);
  const [modelsCache, setModelsCache] = useState<Record<string, string[]>>({});
  const [modelsDropdownOpen, setModelsDropdownOpen] = useState(false);
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const supportsImage = provider?.capabilities?.image ?? false;
  const TEXTAREA_MAX_HEIGHT = 150;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  }, [prompt]);

  const cachedLocalModels = React.useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("mahink-cached-local-models");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (addToChatTrigger != null && addToChatTrigger > 0 && selectionInfo.text.trim()) {
      setPinnedContext(selectionInfo.text.trim());
    }
  }, [addToChatTrigger, selectionInfo.text]);

  const defaultConversation = useMemo(() => {
    const existing = data.aiChats.find((chat) => chat.bookId === book.id && chat.chapterId === activeChapter.id);
    return existing ?? createConversation(book.id, activeChapter.id, data.settings.ai.defaultScope);
  }, [activeChapter.id, book.id, data.aiChats, data.settings.ai.defaultScope]);

  const chapterConversation = useMemo(() => {
    if (selectedConversationId) {
      const found = data.aiChats.find((c) => c.id === selectedConversationId && c.bookId === book.id);
      return found ?? defaultConversation;
    }
    return defaultConversation;
  }, [selectedConversationId, data.aiChats, book.id, defaultConversation]);

  const bookChats = useMemo(
    () => data.aiChats.filter((c) => c.bookId === book.id).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [data.aiChats, book.id],
  );

  useEffect(() => {
    if (seededAction) {
      setAction(seededAction);
      if (!prompt.trim()) {
        setPrompt(
          seededAction === "rewrite"
            ? "Rewrite the current selection while preserving the author's meaning."
            : seededAction === "grammar"
              ? "Fix grammar and punctuation in the selected text without changing voice."
              : `Help me ${seededAction.replace("_", " ")} this passage.`,
        );
      }
      onConsumeSeededAction();
    }
  }, [seededAction, prompt, onConsumeSeededAction]);

  useEffect(() => {
    if (!requestStartTime || !sending) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - requestStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [requestStartTime, sending]);

  useEffect(() => {
    if (!editor) {
      setSelectionInfo({ text: "", from: 0, to: 0 });
      return;
    }

    const syncSelection = () => {
      const { from, to } = editor.state.selection;
      setSelectionInfo({
        text: editor.state.doc.textBetween(from, to, "\n\n"),
        from,
        to,
      });
    };

    syncSelection();
    editor.on("selectionUpdate", syncSelection);
    editor.on("update", syncSelection);
    return () => {
      editor.off("selectionUpdate", syncSelection);
      editor.off("update", syncSelection);
    };
  }, [editor]);

  const currentSelection = selectionInfo.text.trim();
  const effectiveSelection = pinnedContext ?? currentSelection;
  const sessionUsageTokens = useMemo(
    () => data.aiUsage.reduce((sum, usage) => sum + usage.totalTokens, 0),
    [data.aiUsage],
  );

  const fetchModelsForProvider = async () => {
    if (!provider || provider.provider === "local") return;
    if (modelsCache[provider.id]?.length) return;
    setFetchingModels(true);
    try {
      const entry = getProviderCatalogEntry(provider.provider);
      const baseUrl = (provider.baseUrl || entry.baseUrl).replace(/\/$/, "");
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.provider,
          baseUrl,
          apiKey: provider.apiKey,
        }),
      });
      const data = (await res.json()) as { models?: string[]; error?: string };
      if (data.models?.length) {
        setModelsCache((c) => ({ ...c, [provider.id]: [...new Set(data.models!)] }));
      }
    } catch {
      setModelsCache((c) => ({ ...c, [provider.id]: [] }));
    } finally {
      setFetchingModels(false);
    }
  };

  const sendAction = async (nextAction = action, regeneratePrompt?: string) => {
    if (!isAiUsable(data) || !provider) {
      notify("Configure and enable an AI provider first.", "err");
      return;
    }
    const promptToUse = regeneratePrompt ?? prompt;
    if (!promptToUse.trim()) {
      notify("Enter an instruction for the assistant.", "err");
      return;
    }

    const selectedText = effectiveSelection;
    const estimatedRequestTokens = estimateTokens(
      `${promptToUse}\n${selectedText}\n${activeChapter.title}\n${activeChapter.notes}\n${book.bookSummary || ""}`,
    );
    if (estimatedRequestTokens > data.settings.ai.budget.requestTokens) {
      setPanelMessage({
        type: "err",
        text: "This request is too large for the current AI request limit. Trim the prompt or selection, or switch to a provider/model with a larger context window.",
      });
      return;
    }
    if (sessionUsageTokens >= data.settings.ai.budget.sessionTokens) {
      setPanelMessage({
        type: "err",
        text: "This session has reached its AI token budget. You can continue by switching providers, using a different model, or starting a fresh session.",
      });
      return;
    }
    const effectiveAction = aiMode === "talk" ? "chat" : nextAction;
    const computedScope =
      effectiveAction === "research"
        ? "research"
        : effectiveSelection && ["rewrite", "shorten", "expand", "simplify", "grammar", "synonyms"].includes(effectiveAction)
          ? "selection"
          : scope;

    const userMessage = {
      id: genId(),
      role: "user" as const,
      content: promptToUse,
      createdAt: Date.now(),
    };

    let historyToUse = chapterConversation.messages;
    if (editingMessageId) {
      const idx = historyToUse.findIndex((m) => m.id === editingMessageId);
      if (idx >= 0) historyToUse = historyToUse.slice(0, idx);
      setEditingMessageId(null);
    } else if (regeneratePrompt) {
      const lastUserIdx = [...historyToUse].reverse().findIndex((m) => m.role === "user");
      if (lastUserIdx >= 0) {
        const idx = historyToUse.length - 1 - lastUserIdx;
        historyToUse = historyToUse.slice(0, idx);
      }
    }

    setSending(true);
    setPanelMessage(null);
    setStreamingContent("");
    setStreamingReasoning("");
    const start = Date.now();
    setRequestStartTime(start);
    requestStartTimeRef.current = start;
    setElapsedSeconds(0);
    reasoningEndTimeRef.current = null;
    setThinkingCollapsed(true);
    setAction(effectiveAction);
    if (!regeneratePrompt) {
      setPrompt("");
      setImageParts([]);
    }

    onSaveAiConversation({
      ...chapterConversation,
      scope: computedScope,
      title: chapterConversation.messages.length ? chapterConversation.title : promptToUse.slice(0, 40),
      updatedAt: Date.now(),
      messages: [...historyToUse, userMessage],
    });

    abortControllerRef.current = new AbortController();
    try {
      const result = await executeAiAction({
        data,
        profile: provider,
        book,
        chapters,
        activeChapter,
        selection: selectedText,
        imageParts: imageParts.length ? imageParts : undefined,
        userPrompt: promptToUse,
        action: effectiveAction,
        scope: computedScope,
        history: historyToUse.slice(-8),
        onStreamChunk: data.settings.ai.streamResponses
          ? (chunk, type) => {
              if (type === "reasoning") {
                setStreamingReasoning((r) => r + chunk);
              } else {
                if (!reasoningEndTimeRef.current) reasoningEndTimeRef.current = Date.now();
                setStreamingContent((c) => c + chunk);
              }
            }
          : undefined,
        signal: abortControllerRef.current.signal,
        toolCallbacks:
          onUpdateChapter && onUpdateBook && onAddChapter && onDeleteChapter && onMoveChapter && onSelectChapter
            ? {
                onUpdateChapter,
                onUpdateBook,
                onAddChapter,
                onDeleteChapter,
                onMoveChapter,
                onSelectChapter,
                onSaveSnapshot,
              }
            : undefined,
        upSettings,
      });

      const reasoningTimeMs =
        reasoningEndTimeRef.current && requestStartTimeRef.current
          ? reasoningEndTimeRef.current - requestStartTimeRef.current
          : undefined;
      const assistantMsg: typeof result.assistantMessage = {
        ...result.assistantMessage,
        ...(reasoningTimeMs != null ? { reasoningTimeMs } : {}),
      };
      const updatedConversation: AiConversation = {
        ...chapterConversation,
        scope: computedScope,
        title: chapterConversation.messages.length ? chapterConversation.title : promptToUse.slice(0, 40),
        providerId: provider.id,
        model: result.usage.model,
        updatedAt: Date.now(),
        messages: [...historyToUse, userMessage, assistantMsg],
      };
      onSaveAiConversation(updatedConversation);

      const usage: AiUsageRecord = {
        id: result.usage.id,
        providerId: provider.id,
        provider: provider.provider,
        model: result.usage.model,
        scope: computedScope,
        action: effectiveAction,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        estimatedCostUsd: result.usage.estimatedCostUsd,
        latencyMs: result.usage.latencyMs,
        createdAt: Date.now(),
        chapterId: activeChapter.id,
        bookId: book.id,
        finishReason: result.usage.finishReason,
      };
      onSaveAiUsage(usage);

      if (result.proposal) {
        onSaveAiProposal(result.proposal);
        setPendingProposal(result.proposal);
        setPendingRange(selectedText ? { from: selectionInfo.from, to: selectionInfo.to } : null);
      } else {
        setPendingProposal(null);
      }
    } catch (error) {
      const msg = (error as Error).message;
      const isAbort = msg === "Aborted" || msg.includes("aborted");
      if (!isAbort) {
        setPanelMessage({ type: "err", text: msg });
        notify(msg, "err");
      }
    } finally {
      setSending(false);
      setStreamingContent("");
      setStreamingReasoning("");
      setRequestStartTime(null);
      requestStartTimeRef.current = null;
      setElapsedSeconds(0);
      reasoningEndTimeRef.current = null;
      abortControllerRef.current = null;
    }
  };

  const applyProposal = () => {
    if (!editor || !pendingProposal) return;
    const currentHtml = editor.getHTML();
    const snapshotId = genId();

    if (data.settings.ai.autoSnapshotBeforeApply) {
      onSaveSnapshot({
        id: snapshotId,
        chapterId: activeChapter.id,
        content: currentHtml,
        createdAt: Date.now(),
        kind: "ai_before_apply",
        label: `Before ${pendingProposal.action}`,
      });
    }

    if (pendingRange) {
      editor.chain().focus().insertContentAt(pendingRange, pendingProposal.proposedText).run();
    } else {
      editor.chain().focus().insertContent(`<p>${pendingProposal.proposedText}</p>`).run();
    }

    onSaveAiProposal({
      ...pendingProposal,
      appliedAt: Date.now(),
      snapshotId: data.settings.ai.autoSnapshotBeforeApply ? snapshotId : undefined,
    });
    notify("AI proposal applied to the editor.");
    setPendingProposal(null);
  };

  if (!isAiUsable(data) || !provider) {
    return (
      <div style={{ padding: 18, minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            minHeight: 340,
            borderRadius: 18,
            border: `1px solid ${theme.border}`,
            padding: 24,
            background: theme.surface,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 16,
            boxShadow: `0 20px 40px ${theme.shadow}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background: `${theme.accent}18`,
                color: theme.accent,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>Configure AI to unlock writing help</p>
              <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.7, marginTop: 8 }}>
                Connect a provider, choose your models, and keep your API key in this browser only. Once configured,
                this panel becomes your chat workspace for rewrites, research, inline edits, and book-aware assistance.
              </p>
            </div>
          </div>

          <button className="btn btn-primary" onClick={onOpenProvidersSettings} style={{ minWidth: 220, justifyContent: "center", marginTop: 8 }}>
            <Sparkles size={14} />
            Configure AI Providers
          </button>

          <p style={{ fontSize: 11, color: theme.textFaint, lineHeight: 1.6 }}>
            Nothing is sent until you explicitly use AI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Header: token, provider only, scope, history */}
      <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: `1px solid ${theme.border}`, background: theme.surface }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
            <span style={{ fontSize: 11, color: theme.textMuted, whiteSpace: "nowrap" }}>
              {formatTokens(sessionUsageTokens)} tokens
            </span>
            <span style={{ fontSize: 10, color: theme.border }}>·</span>
            <span style={{ fontSize: 11, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
              {provider.label}
            </span>
            <button
              type="button"
              onClick={onOpenProvidersSettings}
              style={{ fontSize: 10, color: theme.textFaint, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Manage keys
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {viewMode === "chat" && (
              <>
                {onUpdateAiSettings && data.aiProviderProfiles.filter((p) => p.enabled).length > 1 && (
                  <select
                    className="inp"
                    value={data.settings.ai.activeProviderId ?? ""}
                    onChange={(e) => onUpdateAiSettings({ activeProviderId: e.target.value || null })}
                    style={{ padding: "4px 8px", fontSize: 11, maxWidth: 120 }}
                  >
                    {data.aiProviderProfiles.filter((p) => p.enabled).map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                )}
                <select className="inp" value={scope} onChange={(e) => setScope(e.target.value as AiScope)} style={{ padding: "4px 8px", fontSize: 11, maxWidth: 90 }}>
                  <option value="selection">Selection</option>
                  <option value="chapter">Chapter</option>
                  <option value="book">Book</option>
                  <option value="research">Research</option>
                </select>
              </>
            )}
            <button
              className={`ibtn tip${viewMode === "history" ? " on" : ""}`}
              data-tip="Chat history"
              onClick={() => setViewMode(viewMode === "history" ? "chat" : "history")}
              style={{ padding: 6, borderRadius: 6, border: `1px solid ${theme.border}`, background: viewMode === "history" ? `${theme.accent}22` : "transparent", color: viewMode === "history" ? theme.accent : theme.textMuted, cursor: "pointer" }}
            >
              <History size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* View: History */}
      {viewMode === "history" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Chat history</p>
            <button
              className="btn btn-primary"
              onClick={() => { setSelectedConversationId(null); setViewMode("chat"); }}
              style={{ fontSize: 12, padding: "8px 14px" }}
            >
              <MessageSquare size={12} style={{ marginRight: 6 }} />
              New chat
            </button>
            {bookChats.length === 0 ? (
              <p style={{ fontSize: 12, color: theme.textMuted }}>No chats yet for this book.</p>
            ) : (
              bookChats.map((chat) => {
                const ch = chat.chapterId ? chapters.find((c) => c.id === chat.chapterId) : null;
                return (
                  <button
                    key={chat.id}
                    onClick={() => { setSelectedConversationId(chat.id); setViewMode("chat"); }}
                    style={{
                      padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`,
                      background: selectedConversationId === chat.id ? `${theme.accent}18` : theme.surface,
                      color: theme.text, cursor: "pointer", textAlign: "left", fontSize: 12,
                      fontFamily: "var(--ui-font)",
                    }}
                  >
                    <span style={{ fontWeight: 600, display: "block" }}>{chat.title || "Untitled"}</span>
                    <span style={{ fontSize: 11, color: theme.textFaint }}>
                      {ch ? ch.title : "Book"} · {new Date(chat.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* View: Chat — Scrollable content */}
      {viewMode === "chat" && (
      <>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {panelMessage && (
          <div
            style={{
              borderRadius: 10,
              padding: "10px 12px",
              background: panelMessage.type === "err" ? "rgba(229,62,62,0.10)" : theme.surfaceAlt,
              border: `1px solid ${panelMessage.type === "err" ? "rgba(229,62,62,0.28)" : theme.border}`,
              color: panelMessage.type === "err" ? "#c53030" : theme.textMuted,
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            {panelMessage.text}
          </div>
        )}

        {pendingProposal && (
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 12, background: theme.surface }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 6 }}>Pending AI Proposal</p>
            <p style={{ fontSize: 10, color: theme.textFaint, marginBottom: 8 }}>
              Red = remove. Green = add. Review before applying.
            </p>
            <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: theme.surfaceAlt }}>
              <p style={{ fontSize: 10, color: theme.textFaint, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Inline diff</p>
              <InlineDiff original={pendingProposal.originalText} proposed={pendingProposal.proposedText} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <DiffBlock title="Remove" text={pendingProposal.originalText} tone="before" />
              <DiffBlock title="Add" text={pendingProposal.proposedText} tone="after" />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button className="btn btn-primary" onClick={applyProposal} style={{ padding: "6px 12px", fontSize: 12 }}>
                <Check size={12} style={{ marginRight: 4 }} />
                Accept
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setPendingProposal(null);
                  setPendingRange(null);
                  notify("AI proposal dismissed.");
                }}
                style={{ borderColor: "#e53e3e33", color: "#c53030", padding: "6px 12px", fontSize: 12 }}
              >
                <X size={12} style={{ marginRight: 4 }} />
                Reject
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  navigator.clipboard.writeText(pendingProposal.proposedText).catch(() => undefined);
                  notify("Copied AI proposal.");
                }}
                style={{ padding: "6px 12px", fontSize: 12 }}
              >
                <CopyPlus size={12} style={{ marginRight: 4 }} />
                Copy
              </button>
            </div>
          </div>
        )}

        {!chapterConversation.messages.length && !sending && (
          <p style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
            No AI messages yet. Ask for rewrites, chapter feedback, outline ideas, research help, or print-market metadata.
          </p>
        )}
        {chapterConversation.messages.map((message, idx) => {
          const prevUser = chapterConversation.messages.slice(0, idx).reverse().find((m) => m.role === "user");
          const isLastAssistant = message.role === "assistant" && idx === chapterConversation.messages.length - 1;
          return (
            <div
              key={message.id}
              style={{
                padding: 10,
                borderRadius: 8,
                background: message.role === "assistant" ? `${theme.accent}12` : theme.surface,
              }}
            >
              <p style={{ fontSize: 10, color: theme.textFaint, marginBottom: 4, textTransform: "capitalize" }}>
                {message.role}
                {message.model ? ` · ${message.model}` : ""}
              </p>
              {message.role === "assistant" && message.reasoningContent && (
                <div style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedThinkingIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(message.id)) next.delete(message.id);
                        else next.add(message.id);
                        return next;
                      })
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      color: theme.textMuted,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {expandedThinkingIds.has(message.id) ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                    <span>
                      Thinking
                      {message.reasoningTimeMs != null && ` (${(message.reasoningTimeMs / 1000).toFixed(1)}s)`}
                    </span>
                  </button>
                  {expandedThinkingIds.has(message.id) && (
                    <div
                      style={{
                        marginTop: 4,
                        padding: 8,
                        borderRadius: 6,
                        background: `${theme.border}18`,
                        fontSize: 11,
                        color: theme.textMuted,
                        lineHeight: 1.6,
                      }}
                    >
                      <ChatMessageContent content={message.reasoningContent} theme={theme} />
                    </div>
                  )}
                </div>
              )}
              <ChatMessageContent content={message.content} theme={theme} />
              {message.role === "assistant" && message.toolCalls?.length ? (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 6,
                    background: theme.surfaceAlt,
                    border: `1px solid ${theme.border}`,
                    fontSize: 11,
                    color: theme.textMuted,
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: 6, color: theme.text }}>Tools used</p>
                  {message.toolCalls.map((tc) => (
                    <div key={tc.id} style={{ marginBottom: 4 }}>
                      <code style={{ color: theme.accent }}>{tc.name}</code>
                      <span style={{ marginLeft: 4 }}>
                        ({Object.entries(tc.args)
                          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                          .join(", ")}
                        ) → {tc.result.length > 80 ? tc.result.slice(0, 80) + "…" : tc.result}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {message.role === "user" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(message.content);
                      setEditingMessageId(message.id);
                      textareaRef.current?.focus();
                    }}
                    style={{ fontSize: 10, color: theme.textMuted, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Pencil size={10} />
                    Edit
                  </button>
                )}
                {message.role === "assistant" && isLastAssistant && prevUser && (
                  <button
                    type="button"
                    onClick={() => void sendAction(action, prevUser.content)}
                    disabled={sending}
                    style={{ fontSize: 10, color: theme.textMuted, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <RefreshCw size={10} />
                    Regenerate
                  </button>
                )}
                {message.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt("");
                      textareaRef.current?.focus();
                    }}
                    style={{ fontSize: 10, color: theme.textMuted, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Reply size={10} />
                    Reply
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {sending && !streamingContent && !streamingReasoning && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: `${theme.accent}12`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 10, color: theme.textFaint }}>AI is thinking</span>
            <span style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: theme.accent,
                    animation: "bounce 0.6s ease-in-out infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </span>
            {requestStartTime != null && (
              <span style={{ fontSize: 10, color: theme.textMuted, fontVariantNumeric: "tabular-nums" }}>
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
        )}
        {(streamingContent || streamingReasoning) && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: `${theme.accent}12`,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 10, color: theme.textFaint, margin: 0 }}>assistant · streaming</p>
              {requestStartTime != null && (
                <span style={{ fontSize: 10, color: theme.textMuted, fontVariantNumeric: "tabular-nums" }}>
                  {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
            {streamingReasoning && (
              <div style={{ marginBottom: streamingContent ? 8 : 0 }}>
                <button
                  type="button"
                  onClick={() => setThinkingCollapsed((c) => !c)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    color: theme.textMuted,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {thinkingCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <span>Thinking</span>
                </button>
                {!thinkingCollapsed && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: 8,
                      borderRadius: 6,
                      background: `${theme.border}18`,
                      fontSize: 11,
                      color: theme.textMuted,
                      lineHeight: 1.6,
                    }}
                  >
                    <ChatMessageContent content={streamingReasoning} theme={theme} />
                    <span style={{ animation: "blink 1s step-end infinite" }}>▌</span>
                  </div>
                )}
              </div>
            )}
            {streamingContent && (
              <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.6 }}>
                <ChatMessageContent content={stripToolCallsForDisplay(streamingContent)} theme={theme} />
                <span style={{ animation: "blink 1s step-end infinite" }}>▌</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Write/Talk toggle + Cursor-style input */}
      <div style={{ flexShrink: 0, padding: 12, borderTop: `1px solid ${theme.border}`, background: theme.surface }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["talk", "write"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setAiMode(m)}
              style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: `1px solid ${aiMode === m ? theme.accent : theme.border}`,
                background: aiMode === m ? `${theme.accent}22` : "transparent",
                color: aiMode === m ? theme.accent : theme.textMuted,
                cursor: "pointer", fontFamily: "var(--ui-font)", textTransform: "capitalize",
              }}
            >
              {m}
            </button>
          ))}
        </div>
        {pinnedContext && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              marginBottom: 8,
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: `${theme.accent}12`,
              fontSize: 12,
              color: theme.text,
            }}
          >
            <FileText size={14} style={{ color: theme.accent, flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pinnedContext.length > 60 ? `${pinnedContext.slice(0, 60)}…` : pinnedContext}
            </span>
            <button
              type="button"
              onClick={() => setPinnedContext(null)}
              style={{
                padding: 4,
                borderRadius: 4,
                border: "none",
                background: "transparent",
                color: theme.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Remove context"
              aria-label="Remove context"
            >
              <X size={14} />
            </button>
          </div>
        )}
        {supportsImage && imageParts.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {imageParts.map((img, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: theme.surfaceAlt,
                }}
              >
                <img
                  src={`data:${img.mimeType};base64,${img.base64}`}
                  alt="Attached"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  onClick={() => setImageParts((p) => p.filter((_, j) => j !== i))}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "8px 10px", background: theme.surfaceAlt }}>
          <textarea
            ref={textareaRef}
            className="ta"
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (prompt.trim()) void sendAction(action);
              }
            }}
            placeholder="Ask AI to write, revise, or restyle this book and its cover…"
            style={{
              width: "100%",
              minHeight: 64,
              maxHeight: TEXTAREA_MAX_HEIGHT,
              overflowY: "auto",
              fontSize: 13,
              resize: "none",
              border: "none",
              background: "transparent",
              padding: "4px 0",
              paddingBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setModelsDropdownOpen((o) => !o);
                  if (!modelsDropdownOpen) void fetchModelsForProvider();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.textMuted,
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "var(--ui-font)",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                  {provider.model?.split("/").pop() ?? provider.model ?? "Model"}
                </span>
                <ChevronDown size={12} style={{ flexShrink: 0 }} />
              </button>
              {modelsDropdownOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 10 }}
                    onClick={() => setModelsDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      marginBottom: 6,
                      minWidth: 220,
                      maxHeight: 220,
                      overflowY: "auto",
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      boxShadow: `0 8px 24px ${theme.shadow}`,
                      zIndex: 11,
                    }}
                  >
                    {provider.provider === "local" ? (
                      [...LOCAL_MODELS.map((m) => m.id), ...cachedLocalModels.filter((id) => !LOCAL_MODELS.some((l) => l.id === id))].map((modelId) => (
                        <button
                          key={modelId}
                          type="button"
                          onMouseEnter={() => setHoveredModelId(modelId)}
                          onMouseLeave={() => setHoveredModelId(null)}
                          onClick={() => {
                            onUpdateAiProfile?.(provider.id, { model: modelId });
                            setModelsDropdownOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "8px 12px",
                            border: "none",
                            background: provider.model === modelId ? `${theme.accent}18` : hoveredModelId === modelId ? theme.surfaceAlt : "transparent",
                            color: theme.text,
                            fontSize: 12,
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "var(--ui-font)",
                          }}
                        >
                          {modelId.split("/").pop() ?? modelId}
                          {provider.model === modelId && <Check size={14} />}
                        </button>
                      ))
                    ) : (
                      <>
                        {fetchingModels ? (
                          <div style={{ padding: 12, fontSize: 12, color: theme.textMuted }}>Fetching models…</div>
                        ) : (
                          [...(modelsCache[provider.id] ?? []), ...(provider.model && !modelsCache[provider.id]?.includes(provider.model) ? [provider.model] : [])].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onMouseEnter={() => setHoveredModelId(m)}
                              onMouseLeave={() => setHoveredModelId(null)}
                              onClick={() => {
                                onUpdateAiProfile?.(provider.id, { model: m });
                                setModelsDropdownOpen(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                padding: "8px 12px",
                                border: "none",
                                background: provider.model === m ? `${theme.accent}18` : hoveredModelId === m ? theme.surfaceAlt : "transparent",
                                color: theme.text,
                                fontSize: 12,
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: "var(--ui-font)",
                              }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{m}</span>
                              {provider.model === m && <Check size={14} />}
                            </button>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => void fetchModelsForProvider()}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "none",
                            borderTop: `1px solid ${theme.border}`,
                            background: "transparent",
                            color: theme.textMuted,
                            fontSize: 11,
                            cursor: "pointer",
                            fontFamily: "var(--ui-font)",
                          }}
                        >
                          Refresh models
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {supportsImage && (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result as string;
                        const [header, base64] = result.split(",");
                        const mimeMatch = header.match(/data:([^;]+)/);
                        const mimeType = mimeMatch?.[1] ?? "image/jpeg";
                        if (base64) {
                          setImageParts((p) => [...p, { type: "image", base64, mimeType }]);
                        }
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    className="ibtn tip"
                    data-tip="Attach image"
                    onClick={() => imageInputRef.current?.click()}
                    style={{ padding: 6, flexShrink: 0 }}
                  >
                    <ImagePlus size={14} />
                  </button>
                </>
              )}
              <button
                className="ibtn tip"
                data-tip={sending ? "Stop" : "Send"}
                onClick={() => (sending ? abortControllerRef.current?.abort() : void sendAction(action))}
                disabled={!sending && !prompt.trim()}
                style={{ padding: 6, flexShrink: 0, background: theme.accent, color: "#fff", border: "none", borderRadius: 6 }}
              >
                {sending ? <Square size={14} /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
