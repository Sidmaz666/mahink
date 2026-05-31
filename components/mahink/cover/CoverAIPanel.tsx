"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Bot, History, MessageSquare, Send, Sparkles, Square, X } from "lucide-react";
import ChatMessageContent from "../editor/ChatMessageContent";
import { executeAiAction, getActiveProviderProfile, isAiUsable } from "@/lib/ai";
import { stripToolCallsForDisplay } from "@/lib/aiTools";
import { formatTokens, genId } from "@/lib/utils";
import type { AiConversation, AiMessage, AiUsageRecord, AppData, Book, CoverDesign, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  book: Book;
  activePage: "front" | "spine" | "back";
  getDesign: () => CoverDesign;
  onApplyDesign: (d: CoverDesign) => void;
  notify: (msg: string, type?: "ok" | "err") => void;
  onSaveAiConversation: (c: AiConversation) => void;
  onSaveAiUsage: (u: AiUsageRecord) => void;
  onClose: () => void;
  onOpenProvidersSettings: () => void;
}

export default function CoverAIPanel({
  data,
  theme,
  book,
  activePage,
  getDesign,
  onApplyDesign,
  notify,
  onSaveAiConversation,
  onSaveAiUsage,
  onClose,
  onOpenProvidersSettings,
}: Props) {
  const provider = getActiveProviderProfile(data);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const convIdRef = useRef(genId());
  const abortRef = useRef<AbortController | null>(null);

  const sessionUsageTokens = useMemo(
    () => data.aiUsage.reduce((sum, u) => sum + u.totalTokens, 0),
    [data.aiUsage],
  );

  const coverChats = useMemo(
    () =>
      data.aiChats
        .filter((c) => c.bookId === book.id && !c.chapterId && c.title === "Cover AI")
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [data.aiChats, book.id],
  );

  const loadConversation = useCallback((c: AiConversation) => {
    setSelectedConversationId(c.id);
    convIdRef.current = c.id;
    setMessages(c.messages);
    setViewMode("chat");
  }, []);

  const startFreshChat = useCallback(() => {
    const id = genId();
    convIdRef.current = id;
    setSelectedConversationId(null);
    setMessages([]);
    setPrompt("");
    setViewMode("chat");
  }, []);

  const send = useCallback(async () => {
    const text = prompt.trim();
    if (!text || sending) return;
    if (!isAiUsable(data) || !provider) {
      notify("Enable AI and configure a provider in Settings.", "err");
      return;
    }

    const userMsg: AiMessage = { id: genId(), role: "user", content: text, createdAt: Date.now() };
    const hist = [...messages, userMsg];
    setMessages(hist);
    setPrompt("");
    setSending(true);
    setStreamingContent("");
    setStreamingReasoning("");
    abortRef.current = new AbortController();

    try {
      const result = await executeAiAction({
        data,
        profile: provider,
        book,
        chapters: [],
        userPrompt: text,
        action: "chat",
        scope: "book",
        history: hist.slice(-10),
        coverAi: {
          getDesign,
          onApplyDesign,
          activePage,
        },
        toolCallbacks: {
          onUpdateChapter: () => {},
          onUpdateBook: () => {},
          onAddChapter: () => "",
          onDeleteChapter: () => {},
          onMoveChapter: () => {},
          onSelectChapter: () => {},
          onSaveSnapshot: () => {},
        },
        signal: abortRef.current.signal,
        onStreamChunk: data.settings.ai.streamResponses
          ? (chunk, type) => {
              if (type === "reasoning") setStreamingReasoning((r) => r + chunk);
              else setStreamingContent((c) => c + chunk);
            }
          : undefined,
      });

      const assistant = result.assistantMessage;
      const next = [...hist, assistant];
      setMessages(next);
      setStreamingContent("");
      setStreamingReasoning("");

      onSaveAiConversation({
        id: convIdRef.current,
        bookId: book.id,
        scope: "book",
        title: "Cover AI",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: next,
        providerId: provider.id,
        model: result.usage.model,
      });
      onSaveAiUsage({
        id: result.usage.id,
        providerId: provider.id,
        provider: provider.provider,
        model: result.usage.model,
        scope: "book",
        action: "chat",
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        estimatedCostUsd: result.usage.estimatedCostUsd,
        latencyMs: result.usage.latencyMs,
        createdAt: Date.now(),
        bookId: book.id,
        finishReason: result.usage.finishReason,
      });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== "Aborted" && !msg.includes("aborted")) {
        notify(msg || "AI request failed", "err");
      }
    } finally {
      setSending(false);
      abortRef.current = null;
      setStreamingContent("");
      setStreamingReasoning("");
    }
  }, [
    prompt,
    sending,
    data,
    provider,
    book,
    getDesign,
    onApplyDesign,
    activePage,
    messages,
    notify,
    onSaveAiConversation,
    onSaveAiUsage,
  ]);

  if (!isAiUsable(data)) {
    return (
      <div
        style={{
          width: 380,
          flexShrink: 0,
          borderLeft: `1px solid ${theme.border}`,
          background: theme.surfaceAlt,
          display: "flex",
          flexDirection: "column",
          maxHeight: "100%",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: theme.text }}>
            <Bot size={16} style={{ color: theme.accent }} />
            Cover AI
          </span>
          <button type="button" className="ibtn tip" data-tip="Close" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: `${theme.accent}18`,
              color: theme.accent,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Bot size={22} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: 0 }}>AI is not configured</p>
          <p style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6, margin: 0 }}>
            Turn on AI and add an API key (or use a local provider) in Settings to unlock cover assistance—same as the editor chat.
          </p>
          <button type="button" className="btn btn-primary" onClick={onOpenProvidersSettings} style={{ minWidth: 200, justifyContent: "center" }}>
            <Sparkles size={14} />
            Configure AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 380,
        flexShrink: 0,
        borderLeft: `1px solid ${theme.border}`,
        background: theme.surfaceAlt,
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: theme.text }}>
          <Bot size={16} style={{ color: theme.accent }} />
          Cover AI
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className={`ibtn tip${viewMode === "history" ? " on" : ""}`}
            data-tip="Past cover chats"
            onClick={() => setViewMode(viewMode === "history" ? "chat" : "history")}
            style={{ padding: 6 }}
          >
            <History size={14} />
          </button>
          <button type="button" className="ibtn tip" data-tip="Close" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: "8px 12px", borderBottom: `1px solid ${theme.border}`, background: theme.surface }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 11, color: theme.textMuted }}>
          <span>{formatTokens(sessionUsageTokens)} tokens</span>
          <span style={{ color: theme.border }}>·</span>
          <span style={{ color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
            {provider?.label}
          </span>
          <button
            type="button"
            onClick={onOpenProvidersSettings}
            style={{ fontSize: 10, color: theme.textFaint, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginLeft: "auto" }}
          >
            Manage keys
          </button>
        </div>
      </div>

      {viewMode === "history" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="btn btn-primary" onClick={startFreshChat} style={{ fontSize: 12, padding: "8px 12px", justifyContent: "center" }}>
            <MessageSquare size={12} style={{ marginRight: 6 }} />
            New cover chat
          </button>
          {coverChats.length === 0 ? (
            <p style={{ fontSize: 12, color: theme.textMuted }}>No saved cover chats yet.</p>
          ) : (
            coverChats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => loadConversation(c)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: selectedConversationId === c.id ? `${theme.accent}18` : theme.surface,
                  color: theme.text,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 600 }}>{c.messages.length} messages</span>
                <span style={{ fontSize: 10, color: theme.textFaint, display: "block", marginTop: 4 }}>
                  {new Date(c.updatedAt).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            <p style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.5, margin: 0 }}>
              Describe colours, mood, typography, or layout. The assistant can adjust layers on <strong>{activePage}</strong>.
            </p>
            {messages.length === 0 && !sending && (
              <p style={{ fontSize: 12, color: theme.textFaint, fontStyle: "italic", margin: 0 }}>Ask for a moody thriller look, a romance palette, or “more contrast on the title”.</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  background: m.role === "assistant" ? `${theme.accent}12` : theme.surface,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <p style={{ fontSize: 10, color: theme.textFaint, margin: "0 0 6px", textTransform: "capitalize" }}>
                  {m.role}
                  {m.model ? ` · ${m.model}` : ""}
                </p>
                <ChatMessageContent content={m.content} theme={theme} />
              </div>
            ))}
            {streamingContent || streamingReasoning ? (
              <div style={{ padding: 10, borderRadius: 8, background: `${theme.accent}12`, border: `1px solid ${theme.border}` }}>
                <p style={{ fontSize: 10, color: theme.textFaint, margin: "0 0 6px" }}>assistant · streaming</p>
                {streamingReasoning ? (
                  <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: streamingContent ? 8 : 0, lineHeight: 1.5 }}>
                    {streamingReasoning}
                  </div>
                ) : null}
                {streamingContent ? (
                  <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.55 }}>
                    <ChatMessageContent content={stripToolCallsForDisplay(streamingContent)} theme={theme} />
                    <span style={{ animation: "blink 1s step-end infinite" }}>▌</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            {sending && !streamingContent && !streamingReasoning && (
              <div style={{ fontSize: 11, color: theme.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
                <span>Thinking</span>
                <span style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: theme.accent,
                        animation: "bounce 0.6s ease-in-out infinite",
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </span>
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, padding: 12, borderTop: `1px solid ${theme.border}`, background: theme.surface }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={startFreshChat}>
                Clear thread
              </button>
            </div>
            <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "8px 10px", background: theme.surfaceAlt }}>
              <textarea
                className="ta"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask AI to adjust the cover…"
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                style={{ width: "100%", fontSize: 12, resize: "none", border: "none", background: "transparent", minHeight: 56 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  className="ibtn tip"
                  data-tip={sending ? "Stop" : "Send"}
                  onClick={() => (sending ? abortRef.current?.abort() : void send())}
                  disabled={!sending && !prompt.trim()}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: theme.accent,
                    color: "#fff",
                    border: "none",
                    cursor: sending || prompt.trim() ? "pointer" : "not-allowed",
                    opacity: !sending && !prompt.trim() ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {sending ? <Square size={14} /> : <Send size={14} />}
                  {sending ? "Stop" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
