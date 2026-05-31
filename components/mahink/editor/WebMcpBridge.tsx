"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { executeAiAction, getActiveProviderProfile } from "@/lib/ai";
import { AI_TOOL_DEFINITIONS, executeTool } from "@/lib/aiTools";
import { validateKdpCompliance } from "@/lib/kdp";
import { genId } from "@/lib/utils";
import type {
  AiConversation,
  AiEditProposal,
  AiUsageRecord,
  AppData,
  Book,
  Chapter,
  Snapshot,
} from "@/lib/types";

declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
        execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
      }) => void;
    };
  }
}

interface Props {
  data: AppData;
  book: Book;
  chapters: Chapter[];
  activeChapter: Chapter | undefined;
  editor: Editor | null;
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  onUpdateChapter: (id: string, updates: Partial<Chapter>) => void;
  onAddChapter: () => string;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, dir: "up" | "down") => void;
  onSelectChapter: (id: string) => void;
  onSaveAiConversation: (conversation: AiConversation) => void;
  onSaveAiUsage: (usage: AiUsageRecord) => void;
  onSaveAiProposal: (proposal: AiEditProposal) => void;
  onSaveSnapshot: (snapshot: Snapshot) => void;
  snapshots: Snapshot[];
}

export default function WebMcpBridge({
  data,
  book,
  chapters,
  activeChapter,
  editor,
  onUpdateBook,
  onUpdateChapter,
  onAddChapter,
  onDeleteChapter,
  onMoveChapter,
  onSelectChapter,
  onSaveAiConversation,
  onSaveAiUsage,
  onSaveAiProposal,
  onSaveSnapshot,
  snapshots,
}: Props) {
  useEffect(() => {
    if (!navigator.modelContext || !editor) return;

    const register = navigator.modelContext.registerTool.bind(navigator.modelContext);

    const onCreateSnapshot = (chapterId: string, label?: string) => {
      const content =
        editor && chapterId === activeChapter?.id
          ? editor.getHTML()
          : chapters.find((c) => c.id === chapterId)?.content ?? "";
      const snapshot: Snapshot = {
        id: genId(),
        chapterId,
        content,
        createdAt: Date.now(),
        kind: "manual",
        label: label ?? "WebMCP",
      };
      onSaveSnapshot(snapshot);
      return snapshot.id;
    };

    const ctx = {
      book,
      chapters,
      activeChapterId: activeChapter?.id ?? null,
      onUpdateChapter,
      onUpdateBook,
      onAddChapter,
      onDeleteChapter,
      onMoveChapter,
      onSelectChapter,
      onCreateSnapshot,
      snapshots: snapshots ?? [],
    };

    for (const def of AI_TOOL_DEFINITIONS) {
      const name = def.function.name;
      const inputSchema = {
        type: "object" as const,
        properties: def.function.parameters.properties,
        required: def.function.parameters.required ?? [],
      };
      register({
        name,
        description: def.function.description,
        inputSchema,
        execute: async (args: Record<string, unknown>) => {
          const result = executeTool(name, args, ctx, "webmcp");
          const parsed = JSON.parse(result.result) as Record<string, unknown>;
          return parsed;
        },
      });
    }

    register({
      name: "getActiveBook",
      description: "Return active book metadata and publishing setup.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => ({
        title: book.title,
        subtitle: book.subtitle,
        genre: book.genre,
        publishing: book.publishing,
      }),
    });

    register({
      name: "getChapterList",
      description: "Return ordered chapter list for the active book.",
      inputSchema: { type: "object", properties: {} },
      execute: async () =>
        chapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          status: chapter.status,
          updatedAt: chapter.updatedAt,
        })),
    });

    register({
      name: "getCurrentChapter",
      description: "Return the active chapter body, notes, and summary.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => activeChapter,
    });

    register({
      name: "getSelectedText",
      description: "Return the currently selected editor text.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        const { from, to } = editor.state.selection;
        return {
          from,
          to,
          text: editor.state.doc.textBetween(from, to, "\n\n"),
        };
      },
    });

    register({
      name: "insertAtCursor",
      description: "Insert plain text at the editor cursor.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
      execute: async (args) => {
        const text = String(args.text || "");
        editor.chain().focus().insertContent(text).run();
        return { ok: true };
      },
    });

    register({
      name: "replaceRange",
      description: "Replace a specific editor range with new text.",
      inputSchema: {
        type: "object",
        properties: {
          from: { type: "number" },
          to: { type: "number" },
          text: { type: "string" },
        },
        required: ["from", "to", "text"],
      },
      execute: async (args) => {
        editor.chain().focus().insertContentAt({ from: Number(args.from), to: Number(args.to) }, String(args.text || "")).run();
        return { ok: true };
      },
    });

    register({
      name: "createChapter",
      description: "Create a new chapter in the active book.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        onAddChapter();
        return { ok: true };
      },
    });

    register({
      name: "getBookMetadata",
      description: "Get editable metadata for the active book.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => ({
        title: book.title,
        subtitle: book.subtitle,
        genre: book.genre,
        summary: book.bookSummary,
        styleGuide: book.styleGuide,
      }),
    });

    register({
      name: "setBookMetadata",
      description: "Update active book metadata fields.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          genre: { type: "string" },
          bookSummary: { type: "string" },
          styleGuide: { type: "string" },
        },
      },
      execute: async (args) => {
        onUpdateBook(book.id, args as Partial<Book>);
        return { ok: true };
      },
    });

    register({
      name: "getExportSpec",
      description: "Return current publishing/export settings for the active book.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => book.publishing,
    });

    register({
      name: "validateKdpCompliance",
      description: "Run KDP-oriented compliance checks for the active book.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => validateKdpCompliance(book, chapters),
    });

    register({
      name: "rewriteSelection",
      description: "Use the configured AI provider to rewrite the selected text.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string" },
        },
      },
      execute: async (args) => {
        const provider = getActiveProviderProfile(data);
        if (!provider) return { ok: false, error: "AI provider not configured." };
        if (!activeChapter) return { ok: false, error: "No active chapter." };

        const { from, to } = editor.state.selection;
        const selectionText = editor.state.doc.textBetween(from, to, "\n\n");
        const result = await executeAiAction({
          data,
          profile: provider,
          book,
          chapters,
          activeChapter,
          selection: selectionText,
          userPrompt: String(args.prompt || "Rewrite the selected text."),
          action: "rewrite",
          scope: "selection",
        });

        const snapshotId = genId();
        onSaveSnapshot({
          id: snapshotId,
          chapterId: activeChapter.id,
          content: editor.getHTML(),
          createdAt: Date.now(),
          kind: "ai_before_apply",
          label: "WebMCP rewrite",
        });
        editor.chain().focus().insertContentAt({ from, to }, result.assistantMessage.content).run();

        onSaveAiConversation({
          id: genId(),
          bookId: book.id,
          chapterId: activeChapter.id,
          scope: "selection",
          title: "WebMCP rewrite",
          providerId: provider.id,
          model: result.usage.model,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            {
              id: genId(),
              role: "user",
              content: String(args.prompt || "Rewrite the selected text."),
              createdAt: Date.now(),
            },
            result.assistantMessage,
          ],
        });
        onSaveAiUsage({
          id: result.usage.id,
          providerId: provider.id,
          provider: provider.provider,
          model: result.usage.model,
          scope: "selection",
          action: "rewrite",
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          estimatedCostUsd: result.usage.estimatedCostUsd,
          latencyMs: result.usage.latencyMs,
          createdAt: Date.now(),
          chapterId: activeChapter.id,
          bookId: book.id,
          finishReason: result.usage.finishReason,
        });
        if (result.proposal) {
          onSaveAiProposal({ ...result.proposal, appliedAt: Date.now(), snapshotId });
        }
        onUpdateChapter(activeChapter.id, { updatedAt: Date.now() });
        return { ok: true, text: result.assistantMessage.content };
      },
    });
  }, [
    activeChapter,
    book,
    chapters,
    data,
    editor,
    onAddChapter,
    onDeleteChapter,
    onMoveChapter,
    onSaveAiConversation,
    onSaveAiProposal,
    onSaveAiUsage,
    onSaveSnapshot,
    onSelectChapter,
    onUpdateBook,
    onUpdateChapter,
    snapshots,
  ]);

  return null;
}
