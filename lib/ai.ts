import type {
  AiActionPreset,
  AiConversation,
  AiEditProposal,
  AiImagePart,
  AiMessage,
  AiProviderProfile,
  AiScope,
  AppData,
  AppSettings,
  Book,
  Chapter,
  CoverDesign,
  Snapshot,
} from "./types";
import {
  AI_TOOL_DEFINITIONS,
  COVER_AI_TOOL_DEFINITIONS,
  buildCoverTextToolsPrompt,
  buildTextToolsPrompt,
  executeTool,
  extractMalformedToolCallBlocks,
  parseToolCallsFromText,
  stripToolCallsFromText,
  type AiToolContext,
} from "./aiTools";
import { estimateCostUsd, runProviderChat, type OpenAiToolCall } from "./providers";
import { estimateTokens, genId } from "./utils";

export interface BuiltAiContext {
  scope: AiScope;
  prompt: string;
  messages: AiMessage[];
}

export function getActiveProviderProfile(data: AppData): AiProviderProfile | null {
  const providerId = data.settings.ai.activeProviderId;
  if (!providerId) return null;
  return data.aiProviderProfiles.find((profile) => profile.id === providerId && profile.enabled) ?? null;
}

/** True when the user has enabled AI and the active provider can run requests (incl. local without API key). */
export function isAiUsable(data: AppData): boolean {
  if (!data.settings.ai.enabled) return false;
  const profile = getActiveProviderProfile(data);
  if (!profile) return false;
  if (profile.provider === "local") return true;
  return !!profile.apiKey.trim();
}

function summarizeNeighboringChapters(chapters: Chapter[], activeChapterId?: string): string {
  return chapters
    .filter((chapter) => chapter.id !== activeChapterId)
    .slice(0, 4)
    .map((chapter) => `- ${chapter.title}: ${chapter.summary || chapter.notes || "No summary yet."}`)
    .join("\n");
}

function trimToChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trim()}\n\n[Truncated for token efficiency]`;
}

function getSelectionLocalContext(chapterText: string, selection?: string): string {
  if (!selection?.trim()) return trimToChars(chapterText, 2200);
  const idx = chapterText.toLowerCase().indexOf(selection.trim().toLowerCase());
  if (idx < 0) return trimToChars(chapterText, 2200);
  const start = Math.max(0, idx - 700);
  const end = Math.min(chapterText.length, idx + selection.length + 700);
  return trimToChars(chapterText.slice(start, end), 1800);
}

function getActionInstruction(action: AiActionPreset, scope: AiScope): string {
  if (["rewrite", "shorten", "expand", "simplify", "grammar", "synonyms", "tone_shift"].includes(action)) {
    return [
      "Return only the replacement text for the targeted passage.",
      "Do not add explanations, markdown fences, or commentary.",
      "Preserve the author's meaning, continuity, and formatting intent unless explicitly asked otherwise.",
    ].join(" ");
  }

  if (action === "research") {
    return [
      "Use a compact structure.",
      "Return sections in this order: Answer, Key points, Risks or unknowns, Suggested next step.",
      "Be concise and avoid padding.",
    ].join(" ");
  }

  if (action === "summarize" || action === "outline") {
    return [
      "Return a compact structured response.",
      "Use short bullets and prioritize continuity, scene logic, and actionable writing guidance.",
    ].join(" ");
  }

  return `Respond for ${scope} scope. Prefer concise, high-signal output and avoid wasting tokens.`;
}

export interface ReferenceText {
  chapterId: string;
  chapterTitle: string;
  text: string;
}

export function buildContextPrompt({
  settings,
  book,
  chapters,
  activeChapter,
  selection,
  referenceTexts,
  userPrompt,
  scope,
  action,
  requestTokenBudget,
}: {
  settings: AppSettings;
  book: Book;
  chapters: Chapter[];
  activeChapter?: Chapter;
  selection?: string;
  referenceTexts?: ReferenceText[];
  userPrompt: string;
  scope: AiScope;
  action: AiActionPreset;
  requestTokenBudget: number;
}): string {
  const chapterText = activeChapter ? stripHtml(activeChapter.content) : "";
  const chapterContext = activeChapter
    ? [
        `Current chapter: ${activeChapter.title}`,
        `Chapter notes: ${trimToChars(activeChapter.notes || "None", 500)}`,
        `Relevant chapter excerpt:\n${scope === "selection" ? getSelectionLocalContext(chapterText, selection) : trimToChars(chapterText, Math.max(1800, requestTokenBudget * 3))}`,
      ].join("\n")
    : "No active chapter selected.";
  const selectionContext = selection?.trim() ? `Selected text:\n${selection.trim()}\n` : "";
  const visualContext = [
    `App shell theme (library, toolbars): ${settings.themeId}`,
    `Book canvas theme (writing area + preview): ${book.preferredThemeId || settings.themeId}`,
    `Current editor font: ${book.preferredEditorFontId || settings.editorFontId}`,
    `Current UI font: ${book.preferredUiFontId || settings.uiFontId}`,
    `Current font size: ${book.preferredFontSize || settings.fontSize}`,
    `Current line height: ${book.preferredLineHeight || settings.lineHeight}`,
    `Current paragraph width: ${book.preferredParagraphWidth || settings.paragraphWidth}`,
    `Current editor page background: ${book.editorPageBackground || "theme default"}`,
    `Current page border: ${book.pageBorderStyle?.type || "none"}`,
    "If the author asks to restyle the book, update the live theme/fonts/layout using the available theme tool instead of only describing ideas.",
  ].join("\n");
  const referenceContext =
    referenceTexts?.length && referenceTexts.some((r) => r.text?.trim())
      ? referenceTexts
          .filter((r) => r.text?.trim())
          .map((r) => `Reference from Chapter "${r.chapterTitle}":\n${trimToChars(r.text, 800)}`)
          .join("\n\n")
      : "";
  const surrounding = summarizeNeighboringChapters(chapters, activeChapter?.id);
  return [
    `Book title: ${book.title}`,
    `Book subtitle: ${book.subtitle || "None"}`,
    `Genre: ${book.genre || "Unknown"}`,
    `Style guide: ${trimToChars(book.styleGuide || "Preserve the author's current tone.", 500)}`,
    `Book summary: ${trimToChars(book.bookSummary || "Not written yet.", 800)}`,
    `Visual context:\n${visualContext}`,
    `Action instruction: ${getActionInstruction(action, scope)}`,
    selectionContext,
    chapterContext,
    referenceContext ? `Additional references from other chapters:\n${referenceContext}` : "",
    surrounding ? `Other chapter context:\n${surrounding}` : "",
    `Requested scope: ${scope}`,
    `User request: ${userPrompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildAiConversationMessages({
  baseSystemPrompt,
  contextPrompt,
  history,
  requestTokenBudget,
}: {
  baseSystemPrompt: string;
  contextPrompt: string;
  history?: AiMessage[];
  requestTokenBudget: number;
}): AiMessage[] {
  const trimmedHistory = [...(history ?? [])]
    .slice(-6)
    .map((message) => ({
      ...message,
      content: trimToChars(message.content, Math.max(300, requestTokenBudget * 2)),
    }));

  return [
    {
      id: genId(),
      role: "system",
      content: `${baseSystemPrompt}\n\nContext:\n${contextPrompt}`,
      createdAt: Date.now(),
    },
    ...trimmedHistory,
  ];
}

export interface AiToolCallbacks {
  onUpdateChapter: (id: string, updates: Partial<Chapter>) => void;
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  onAddChapter: () => string;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, dir: "up" | "down") => void;
  onSelectChapter: (id: string) => void;
  onSaveSnapshot: (snapshot: Snapshot) => void;
}

const STUB_TOOL_CALLBACKS: AiToolCallbacks = {
  onUpdateChapter: () => {},
  onUpdateBook: () => {},
  onAddChapter: () => "",
  onDeleteChapter: () => {},
  onMoveChapter: () => {},
  onSelectChapter: () => {},
  onSaveSnapshot: () => {
    /* no-op for cover-only AI */
  },
};

export async function executeAiAction({
  data,
  profile,
  book,
  chapters,
  activeChapter,
  selection,
  referenceTexts,
  imageParts,
  userPrompt,
  action,
  scope,
  history,
  onStreamChunk,
  signal,
  toolCallbacks,
  coverAi,
  upSettings,
}: {
  data: AppData;
  profile: AiProviderProfile;
  book: Book;
  chapters: Chapter[];
  activeChapter?: Chapter;
  selection?: string;
  referenceTexts?: ReferenceText[];
  imageParts?: AiImagePart[];
  userPrompt: string;
  action: AiActionPreset;
  scope: AiScope;
  history?: AiMessage[];
  onStreamChunk?: (chunk: string, type?: "content" | "reasoning") => void;
  signal?: AbortSignal;
  toolCallbacks?: AiToolCallbacks;
  coverAi?: {
    getDesign: () => CoverDesign;
    onApplyDesign: (d: CoverDesign) => void;
    activePage: "front" | "spine" | "back";
  };
  upSettings?: (u: Partial<AppSettings>) => void;
}): Promise<{
  assistantMessage: AiMessage;
  usage: {
    id: string;
    providerId: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
    finishReason?: string;
  };
  proposal?: AiEditProposal;
}> {
  const contextPrompt = coverAi
    ? buildCoverAiContextPrompt({
        book,
        getDesign: coverAi.getDesign,
        activePage: coverAi.activePage,
        userPrompt,
      })
    : buildContextPrompt({
        settings: data.settings,
        book,
        chapters,
        activeChapter,
        selection,
        referenceTexts,
        userPrompt,
        scope,
        action,
        requestTokenBudget: data.settings.ai.budget.requestTokens,
      });
  const useTools = action === "chat" && (!!toolCallbacks || !!coverAi || !!upSettings);
  const effectiveToolCallbacks = toolCallbacks ?? (coverAi || upSettings ? STUB_TOOL_CALLBACKS : undefined);
  const apiSupportsTools = profile.capabilities?.tools ?? false;
  const preferStreaming = data.settings.ai.streamResponses && (profile.capabilities?.streaming ?? false) && !!onStreamChunk;
  const toolDefsForRequest = coverAi ? COVER_AI_TOOL_DEFINITIONS : AI_TOOL_DEFINITIONS;
  const toolsToPass =
    useTools && apiSupportsTools && !preferStreaming ? toolDefsForRequest : undefined;
  const useTextBasedTools = useTools && (!apiSupportsTools || preferStreaming);

  const toolsNote = useTools
    ? coverAi
      ? "\n\nYou are in the Cover Designer. Use list_cover_elements to inspect the current page, set_cover_background for colours/gradients, add_cover_element / update_cover_element / delete_cover_element for layers, or apply_cover_theme for quick presets (gothic, romance, scifi, minimal, poetry). Execute tools to make real changes."
      : "\n\nYou have access to tools to read and edit the book and chapters directly. Use get_chapter_content, list_chapters, get_book_structure to read. Use replace_text_range, insert_text, rename_chapter, update_chapter_notes, create_chapter, etc. to make edits. When the user asks you to change, rename, update, or edit something, you MUST use the appropriate tool to perform the change. Do not only suggest—execute the change. Always read content before editing to ensure correct character positions. After making edits, briefly summarize what you changed in your response."
    : "";
  const noToolsNote = action === "chat" && !useTools
    ? "\n\nYou cannot edit the book directly. Describe the changes you recommend in clear, actionable form. The user can apply them manually or use the Write mode."
    : "";
  const textToolsPrompt = useTextBasedTools
    ? "\n\n" + (coverAi ? buildCoverTextToolsPrompt() : buildTextToolsPrompt())
    : "";
  const systemMessages = buildAiConversationMessages({
    baseSystemPrompt: data.settings.ai.systemPrompt + toolsNote + noToolsNote + textToolsPrompt,
    contextPrompt,
    history,
    requestTokenBudget: data.settings.ai.budget.requestTokens,
  });

  const userMessage: AiMessage = {
    id: genId(),
    role: "user",
    content: userPrompt,
    createdAt: Date.now(),
  };
  const startedAt = performance.now();
  const model = profile.model || "";

  type ApiMsg = { role: "system" | "user" | "assistant" | "tool"; content?: string; tool_call_id?: string; tool_calls?: OpenAiToolCall[] };
  let apiMessages: ApiMsg[] = [
    ...systemMessages.map((m) => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
    { role: "user", content: userPrompt },
  ];

  let resultText = "";
  let lastReasoningText: string | undefined;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let lastFinishReason: string | undefined;
  const allToolCalls: Array<{ id: string; name: string; args: Record<string, unknown>; result: string }> = [];

  const toolCtx: AiToolContext | null = effectiveToolCallbacks
    ? {
        book,
        chapters,
        activeChapterId: activeChapter?.id ?? null,
        onUpdateChapter: effectiveToolCallbacks.onUpdateChapter,
        onUpdateBook: effectiveToolCallbacks.onUpdateBook,
        onAddChapter: effectiveToolCallbacks.onAddChapter,
        onDeleteChapter: effectiveToolCallbacks.onDeleteChapter,
        onMoveChapter: effectiveToolCallbacks.onMoveChapter,
        onSelectChapter: effectiveToolCallbacks.onSelectChapter,
        onCreateSnapshot: (chapterId: string, label?: string) => {
          const ch = chapters.find((c) => c.id === chapterId);
          const snap: Snapshot = {
            id: genId(),
            chapterId,
            content: ch?.content ?? "",
            createdAt: Date.now(),
            kind: "manual",
            label,
          };
          effectiveToolCallbacks.onSaveSnapshot(snap);
          return snap.id;
        },
        snapshots: data.snapshots ?? [],
        coverAi: coverAi
          ? {
              getDesign: coverAi.getDesign,
              onApplyDesign: coverAi.onApplyDesign,
              activePage: coverAi.activePage,
            }
          : undefined,
        upSettings: upSettings ?? undefined,
      }
    : null;

  const maxToolRounds = 10;
  const maxMalformedRetries = 2;
  let round = 0;
  let malformedRetries = 0;

  while (round < maxToolRounds) {
    const useStream =
      !toolsToPass &&
      data.settings.ai.streamResponses &&
      (profile.capabilities?.streaming ?? false) &&
      onStreamChunk;
    const result = await runProviderChat({
      profile,
      model,
      messages: apiMessages,
      imageParts: imageParts?.length ? imageParts : undefined,
      maxTokens: Math.min(profile.maxTokens, data.settings.ai.budget.requestTokens),
      temperature: profile.temperature,
      onChunk: useStream ? onStreamChunk : undefined,
      signal,
      tools: toolsToPass,
      tool_choice: toolsToPass ? "auto" : undefined,
    });

    totalPromptTokens += result.promptTokens;
    totalCompletionTokens += result.completionTokens;
    lastFinishReason = result.finishReason;
    if (result.reasoningText) lastReasoningText = result.reasoningText;
    const contentOnly = result.reasoningText
      ? (result.text || "").slice(result.reasoningText.length)
      : (result.text || "");
    resultText = contentOnly;

    let parsedToolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const rawText = contentOnly;
    let assistantContent = stripToolCallsFromText(rawText);

    if (toolCtx) {
      if (result.tool_calls?.length) {
        parsedToolCalls = result.tool_calls.map((tc) => {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || "{}");
          } catch {
            // ignore
          }
          return { name: tc.function.name, args };
        });
      } else {
        parsedToolCalls = parseToolCallsFromText(rawText);
      }
    }

    const hasToolCallBlocks = /<tool_call>[\s\S]*?<\/tool_call>/i.test(rawText);
    const malformedToolCall = hasToolCallBlocks && !parsedToolCalls.length && toolCtx && malformedRetries < maxMalformedRetries;

    if (malformedToolCall) {
      malformedRetries++;
      const malformedBlocks = extractMalformedToolCallBlocks(rawText);
      const contextParts: string[] = [
        `Current book ID: ${book.id}`,
        `Active chapter ID: ${activeChapter?.id ?? "none"}`,
        `Chapter IDs: ${chapters.filter((c) => c.bookId === book.id).map((c) => c.id).slice(0, 10).join(", ")}${chapters.length > 10 ? "..." : ""}`,
      ];
      const correctionMsg = [
        "Your tool call could not be parsed. What you output:",
        malformedBlocks.map((b) => `  "${b}"`).join("\n"),
        "",
        "Required format (valid JSON): <tool_call>{\"name\":\"tool_name\",\"args\":{\"param\":\"value\"}}</tool_call>",
        "Examples:",
        `  rename_chapter: <tool_call>{"name":"rename_chapter","args":{"chapter_id":"${activeChapter?.id ?? "CHAPTER_ID"}","new_title":"New Title"}}</tool_call>`,
        `  list_chapters: <tool_call>{"name":"list_chapters","args":{"book_id":"${book.id}"}}</tool_call>`,
        "",
        "Context: " + contextParts.join(" | "),
        "Fix the format and output a valid <tool_call>...</tool_call> again.",
      ].join("\n");
      apiMessages = [
        ...apiMessages,
        { role: "assistant" as const, content: assistantContent },
        { role: "user" as const, content: correctionMsg },
      ];
      resultText = assistantContent;
      round++;
      continue;
    }

    if (!parsedToolCalls.length || !toolCtx) {
      resultText = assistantContent;
      break;
    }

    const assistantMsg: ApiMsg = {
      role: "assistant",
      content: result.tool_calls?.length ? result.text || "" : assistantContent,
      tool_calls: result.tool_calls,
    };
    const toolResults: Array<{ id: string; result: string }> = [];
    for (const tc of parsedToolCalls) {
      const tcId = genId();
      const tr = executeTool(tc.name, tc.args, toolCtx, tcId);
      allToolCalls.push({ id: tcId, name: tc.name, args: tc.args, result: tr.result });
      toolResults.push({ id: tcId, result: tr.result });
    }

    if (result.tool_calls?.length) {
      apiMessages = [
        ...apiMessages,
        assistantMsg,
        ...toolResults.map((t) => ({ role: "tool" as const, content: t.result, tool_call_id: t.id })),
      ];
    } else {
      apiMessages = [
        ...apiMessages,
        assistantMsg,
        {
          role: "user" as const,
          content: `Tool results:\n${toolResults.map((t) => t.result).join("\n")}\n\nContinue the task. If the user's request is not yet complete, call another tool. If done, provide a brief summary of what you changed.`,
        },
      ];
    }
    resultText = assistantContent;
    round++;
  }

  const latencyMs = Math.round(performance.now() - startedAt);
  const usageId = genId();
  const assistantMessage: AiMessage = {
    id: genId(),
    role: "assistant",
    content: resultText,
    createdAt: Date.now(),
    providerId: profile.id,
    model,
    usageId,
    toolCalls: allToolCalls.length ? allToolCalls : undefined,
    reasoningContent: lastReasoningText || undefined,
  };

  const proposal =
    selection?.trim() && ["rewrite", "shorten", "expand", "simplify", "grammar", "synonyms", "tone_shift"].includes(action)
      ? {
          id: genId(),
          bookId: book.id,
          chapterId: activeChapter?.id || "",
          selectionText: selection,
          originalText: selection,
          proposedText: resultText,
          prompt: userPrompt,
          action,
          providerId: profile.id,
          model,
          createdAt: Date.now(),
        }
      : undefined;

  return {
    assistantMessage,
    usage: {
      id: usageId,
      providerId: profile.id,
      model,
      promptTokens: totalPromptTokens || estimateTokens(contextPrompt),
      completionTokens: totalCompletionTokens || estimateTokens(resultText),
      totalTokens: totalPromptTokens + totalCompletionTokens,
      estimatedCostUsd: estimateCostUsd(profile.provider, totalPromptTokens + totalCompletionTokens),
      latencyMs,
      finishReason: lastFinishReason,
    },
    proposal,
  };
}

export function createConversation(bookId: string, chapterId?: string, scope: AiScope = "chapter"): AiConversation {
  return {
    id: genId(),
    bookId,
    chapterId,
    scope,
    title: "New AI chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

export function buildCoverAiContextPrompt({
  book,
  getDesign,
  activePage,
  userPrompt,
}: {
  book: Book;
  getDesign: () => CoverDesign;
  activePage: "front" | "spine" | "back";
  userPrompt: string;
}): string {
  const d = getDesign();
  const page = d[activePage];
  return [
    `Book: "${book.title}"${book.subtitle ? ` — ${book.subtitle}` : ""}`,
    `Genre: ${book.genre || "unknown"}`,
    `Active cover canvas: ${activePage}`,
    `Elements on this page: ${page.elements.length}`,
    `Background (summary): type=${page.background.type}`,
    `Use the cover tools to change backgrounds, add/update/delete layers, or apply_cover_theme.`,
    `User request:\n${userPrompt}`,
  ].join("\n");
}

export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
