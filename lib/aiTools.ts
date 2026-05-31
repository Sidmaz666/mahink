import type { AppSettings, Book, Chapter, CoverDesign, CoverElement, PageBackground, PageBorderStyle, Snapshot } from "./types";
import { countWords, genId } from "./utils";

/** OpenAI-style function definition */
export type AiToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string; enum?: string[] }>;
      required: string[];
    };
  };
};

/** Context passed to tool execution */
export interface AiToolContext {
  book: Book;
  chapters: Chapter[];
  activeChapterId: string | null;
  onUpdateChapter: (id: string, updates: Partial<Chapter>) => void;
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  onAddChapter: () => string;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, dir: "up" | "down") => void;
  onSelectChapter: (id: string) => void;
  onCreateSnapshot: (chapterId: string, label?: string) => string;
  snapshots: Snapshot[];
  /** When set, cover_* tools are available and mutate the in-memory cover design. */
  coverAi?: {
    getDesign: () => CoverDesign;
    onApplyDesign: (d: CoverDesign) => void;
    activePage: "front" | "spine" | "back";
  };
  /** For apply_book_visual_theme: update live editor settings (fonts, sizing) when those args are passed. */
  upSettings?: (u: Partial<AppSettings>) => void;
}

function plainToHtml(plain: string): string {
  if (!plain.trim()) return "<p></p>";
  return plain
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function htmlToPlain(html: string): string {
  return (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const AI_TOOL_DEFINITIONS: AiToolDef[] = [
  {
    type: "function",
    function: {
      name: "replace_text_range",
      description: "Replace an exact span of text in a chapter. Use for editing any letter or word. Positions are 0-based character indices in the plain text (HTML stripped).",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter to edit" },
          start_char: { type: "number", description: "Start character index (0-based, inclusive)" },
          end_char: { type: "number", description: "End character index (0-based, exclusive)" },
          new_text: { type: "string", description: "The replacement text" },
        },
        required: ["chapter_id", "start_char", "end_char", "new_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insert_text",
      description: "Insert text at a specific position in a chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          position: { type: "number", description: "0-based character index where to insert" },
          text: { type: "string", description: "Text to insert" },
        },
        required: ["chapter_id", "position", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_text_range",
      description: "Delete a span of text from a chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          start_char: { type: "number", description: "Start character index (0-based)" },
          end_char: { type: "number", description: "End character index (0-based, exclusive)" },
        },
        required: ["chapter_id", "start_char", "end_char"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "replace_chapter_content",
      description: "Replace the entire chapter content with new HTML. Use when making large edits.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          content: { type: "string", description: "New HTML content (use <p> for paragraphs, <br/> for line breaks)" },
        },
        required: ["chapter_id", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_chapter",
      description: "Change a chapter's title.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          new_title: { type: "string", description: "New chapter title" },
        },
        required: ["chapter_id", "new_title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_chapter_notes",
      description: "Update the chapter notes (ideas, research, reminders).",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          notes: { type: "string", description: "New notes content" },
        },
        required: ["chapter_id", "notes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_chapter_status",
      description: "Set the chapter status.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          status: { type: "string", description: "New status", enum: ["draft", "progress", "complete", "review", "locked"] },
        },
        required: ["chapter_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_chapter_summary",
      description: "Update the chapter summary.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          summary: { type: "string", description: "New summary" },
        },
        required: ["chapter_id", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_chapter",
      description: "Add a new chapter to the book.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          title: { type: "string", description: "Chapter title" },
          content: { type: "string", description: "Optional initial HTML content" },
          position: { type: "number", description: "Optional sort order (0-based)" },
        },
        required: ["book_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_chapter",
      description: "Remove a chapter from the book.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter to delete" },
        },
        required: ["chapter_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "duplicate_chapter",
      description: "Clone a chapter with a new ID.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter to duplicate" },
        },
        required: ["chapter_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reorder_chapters",
      description: "Set the sort order of a chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          new_sort_order: { type: "number", description: "New sort order (0-based)" },
        },
        required: ["chapter_id", "new_sort_order"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_chapter",
      description: "Move a chapter up or down in the list.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          direction: { type: "string", description: "Direction to move", enum: ["up", "down"] },
        },
        required: ["chapter_id", "direction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_book_title",
      description: "Change the book title.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          title: { type: "string", description: "New title" },
        },
        required: ["book_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_book_subtitle",
      description: "Change the book subtitle.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          subtitle: { type: "string", description: "New subtitle" },
        },
        required: ["book_id", "subtitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_book_genre",
      description: "Set the book genre.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          genre: { type: "string", description: "Genre" },
        },
        required: ["book_id", "genre"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_book_summary",
      description: "Set the book summary.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          bookSummary: { type: "string", description: "Book summary" },
        },
        required: ["book_id", "bookSummary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_book_style_guide",
      description: "Set the book style guide.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          styleGuide: { type: "string", description: "Style guide" },
        },
        required: ["book_id", "styleGuide"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_book_author_override",
      description: "Override the author name.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          authorOverride: { type: "string", description: "Author override" },
        },
        required: ["book_id", "authorOverride"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_book_word_goal",
      description: "Set the word goal for the book.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          wordGoal: { type: "number", description: "Word goal" },
        },
        required: ["book_id", "wordGoal"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_chapter_content",
      description: "Get the full plain text content of a chapter. Use to read what exists before editing.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
        },
        required: ["chapter_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_chapter_excerpt",
      description: "Get a span of text from a chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          start_char: { type: "number", description: "Start index (0-based)" },
          end_char: { type: "number", description: "End index (0-based, exclusive)" },
        },
        required: ["chapter_id", "start_char", "end_char"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_book_structure",
      description: "List all chapters with titles and IDs for a book.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
        },
        required: ["book_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_book_summary",
      description: "Get book summary and metadata.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
        },
        required: ["book_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_chapters",
      description: "List all chapters in a book with IDs and titles.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
        },
        required: ["book_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_snapshot",
      description: "Save a snapshot of a chapter before a risky edit (for undo/safety).",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          label: { type: "string", description: "Optional label for the snapshot" },
        },
        required: ["chapter_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "split_chapter",
      description: "Split a chapter at a character index. The text from that index onward becomes a new chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter to split" },
          split_at_char: { type: "number", description: "0-based character index where to split" },
        },
        required: ["chapter_id", "split_at_char"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "merge_chapters",
      description: "Merge two chapters. Appends the second chapter's content to the first, then deletes the second.",
      parameters: {
        type: "object",
        properties: {
          first_chapter_id: { type: "string", description: "ID of the chapter to keep" },
          second_chapter_id: { type: "string", description: "ID of the chapter to merge in and delete" },
        },
        required: ["first_chapter_id", "second_chapter_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_formatting",
      description: "Apply bold, italic, or underline to a text range in a chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          start_char: { type: "number", description: "Start character index (0-based)" },
          end_char: { type: "number", description: "End character index (0-based, exclusive)" },
          formats: { type: "string", description: "Comma-separated: bold, italic, underline" },
        },
        required: ["chapter_id", "start_char", "end_char", "formats"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_book_metadata",
      description: "Batch update multiple book fields at once.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
          updates: { type: "string", description: "JSON object with field names and values, e.g. {\"title\":\"New Title\",\"genre\":\"Fiction\"}" },
        },
        required: ["book_id", "updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_and_replace",
      description: "Find text in a chapter and replace it. Use replace_all for all occurrences.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          find_text: { type: "string", description: "Text to find" },
          replace_text: { type: "string", description: "Replacement text" },
          replace_all: { type: "string", description: "If 'true', replace all occurrences; otherwise first only" },
        },
        required: ["chapter_id", "find_text", "replace_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "append_to_chapter",
      description: "Append text to the end of a chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          text: { type: "string", description: "Text to append" },
        },
        required: ["chapter_id", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepend_to_chapter",
      description: "Insert text at the start of a chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
          text: { type: "string", description: "Text to prepend" },
        },
        required: ["chapter_id", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_chapter_word_count",
      description: "Get the word count for a chapter.",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
        },
        required: ["chapter_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_book_word_count",
      description: "Get the total word count for a book.",
      parameters: {
        type: "object",
        properties: {
          book_id: { type: "string", description: "ID of the book" },
        },
        required: ["book_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_snapshots",
      description: "List snapshots for a chapter (for undo/restore suggestions).",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter" },
        },
        required: ["chapter_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_book_visual_theme",
      description:
        "Apply book canvas styling: theme colours for the writing area and preview, editor/UI fonts, sizing, paragraph width, optional page background / border, and optional cover design JSON. Does not change the global app shell theme.",
      parameters: {
        type: "object",
        properties: {
          theme_id: { type: "string", description: "Book canvas theme id (e.g. mahiDark, parchment) — stored on the book only" },
          editor_font_id: { type: "string", description: "Editor font id from app font list e.g. cormorant, lora" },
          ui_font_id: { type: "string", description: "UI font id from app font list e.g. dm_sans, inter, nunito" },
          font_size: { type: "number", description: "Editor font size in px" },
          line_height: { type: "number", description: "Editor line height, e.g. 1.8" },
          paragraph_width: { type: "string", description: "narrow | medium | wide | full" },
          page_background_hex: { type: "string", description: "Optional #hex for book editor page background" },
          page_border_json: {
            type: "string",
            description: "Optional stringified PageBorderStyle JSON {type,color,width,imageUrl?}",
          },
          cover_design_json: {
            type: "string",
            description: "Optional stringified CoverDesign JSON {front,spine,back} with background + elements",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "switch_active_chapter",
      description: "Switch focus to a different chapter (navigate to it).",
      parameters: {
        type: "object",
        properties: {
          chapter_id: { type: "string", description: "ID of the chapter to switch to" },
        },
        required: ["chapter_id"],
      },
    },
  },
];

/** Tools used only in Cover Designer AI chat. */
export const COVER_AI_TOOL_DEFINITIONS: AiToolDef[] = [
  {
    type: "function",
    function: {
      name: "list_cover_elements",
      description: "List elements and background on a cover page (front, spine, or back).",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string", description: "front | spine | back (default: active page)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_cover_background",
      description: "Set page background to gradient, solid, or image.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string", description: "front | spine | back" },
          bg_type: { type: "string", description: "gradient | solid | image" },
          gradient_a: { type: "string", description: "Hex colour A" },
          gradient_b: { type: "string", description: "Hex colour B" },
          angle: { type: "number", description: "Gradient angle degrees" },
          solid: { type: "string", description: "Hex for solid" },
          image: { type: "string", description: "Optional base64 or URL for image bg" },
          texture: { type: "string", description: "none | linen | leather | canvas | marble | paper | grain | weave | diamond" },
          vignette: { type: "string", description: "true or false" },
        },
        required: ["page", "bg_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_cover_element",
      description: "Add a text, shape (rect/circle/line), ornament, or divider to a cover page.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string", description: "front | spine | back" },
          element_type: { type: "string", description: "text | shape | ornament | divider | image" },
          name: { type: "string", description: "Layer name" },
          x: { type: "number", description: "Left position percent 0-100" },
          y: { type: "number", description: "Top position percent 0-100" },
          w: { type: "number", description: "Width percent" },
          h: { type: "number", description: "Height percent" },
          text: { type: "string", description: "Text content for text type" },
          font_size: { type: "number", description: "Font size px" },
          color: { type: "string", description: "Hex or rgba" },
          font_family: { type: "string", description: "CSS font stack" },
          shape_kind: { type: "string", description: "rect | circle | line for shape type" },
          fill: { type: "string", description: "Shape fill colour" },
          stroke: { type: "string", description: "Shape stroke colour" },
          ornament_char: { type: "string", description: "Single ornament character" },
          image: { type: "string", description: "Base64 or URL for image element" },
        },
        required: ["page", "element_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_cover_element",
      description: "Update properties of an existing element by id.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string", description: "front | spine | back" },
          element_id: { type: "string", description: "Element id" },
          updates_json: { type: "string", description: "JSON object of partial CoverElement fields" },
        },
        required: ["page", "element_id", "updates_json"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_cover_element",
      description: "Remove an element by id from a page.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string", description: "front | spine | back" },
          element_id: { type: "string", description: "Element id to delete" },
        },
        required: ["page", "element_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_cover_theme",
      description: "Apply a preset mood: gothic, romance, scifi, minimal, poetry — sets background and optional title styling on front.",
      parameters: {
        type: "object",
        properties: {
          theme: { type: "string", description: "gothic | romance | scifi | minimal | poetry" },
        },
        required: ["theme"],
      },
    },
  },
];

function tryParseJsonObject(str: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(str) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function tryParseArgsFromString(inner: string): { name: string; args: Record<string, unknown> } | null {
  const trimmed = inner.trim();
  if (!trimmed) return null;

  const tryFormats: Array<() => { name: string; args: Record<string, unknown> } | null> = [
    () => {
      const parsed = tryParseJsonObject(trimmed);
      if (parsed?.name && typeof parsed.name === "string") {
        return { name: parsed.name, args: (parsed.args && typeof parsed.args === "object") ? (parsed.args as Record<string, unknown>) : {} };
      }
      return null;
    },
    () => {
      const m = trimmed.match(/^(\w+)\s*(\{[\s\S]*\})$/);
      if (m) {
        const args = tryParseJsonObject(m[2]);
        if (args) return { name: m[1], args };
      }
      return null;
    },
    () => {
      const m = trimmed.match(/^(\w+)\s*\(\s*(\{[\s\S]*\})\s*\)$/);
      if (m) {
        const args = tryParseJsonObject(m[2]);
        if (args) return { name: m[1], args };
      }
      return null;
    },
    () => {
      const m = trimmed.match(/^(\w+)\s*:\s*(\{[\s\S]*\})$/);
      if (m) {
        const args = tryParseJsonObject(m[2]);
        if (args) return { name: m[1], args };
      }
      return null;
    },
    () => {
      const m = trimmed.match(/^(\w+)\s*=\s*(\{[\s\S]*\})$/);
      if (m) {
        const args = tryParseJsonObject(m[2]);
        if (args) return { name: m[1], args };
      }
      return null;
    },
    () => {
      const m = trimmed.match(/^(\w+)\s*(\{[\s\S]*\})/);
      if (m) {
        const args = tryParseJsonObject(m[2]);
        if (args) return { name: m[1], args };
      }
      return null;
    },
    () => {
      const fixed = trimmed.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"');
      const parsed = tryParseJsonObject(fixed);
      if (parsed?.name && typeof parsed.name === "string") {
        return { name: parsed.name, args: (parsed.args && typeof parsed.args === "object") ? (parsed.args as Record<string, unknown>) : {} };
      }
      return null;
    },
    () => {
      const nameMatch = trimmed.match(/^(\w+)/);
      if (nameMatch) return { name: nameMatch[1], args: {} };
      return null;
    },
  ];

  for (const fn of tryFormats) {
    const r = fn();
    if (r) return r;
  }
  return null;
}

/** Parse <tool_call>...</tool_call> blocks from model text output. Handles many formats including malformed variants. */
export function parseToolCallsFromText(text: string): Array<{ name: string; args: Record<string, unknown> }> {
  const blocks = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/gi) ?? [];
  return blocks
    .map((b) => {
      const inner = b.replace(/<\/?tool_call>/gi, "").trim();
      return tryParseArgsFromString(inner);
    })
    .filter((x): x is { name: string; args: Record<string, unknown> } => x !== null);
}

/** Extract raw content of <tool_call> blocks that failed to parse. */
export function extractMalformedToolCallBlocks(text: string): string[] {
  const blocks = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/gi) ?? [];
  return blocks
    .map((b) => b.replace(/<\/?tool_call>/gi, "").trim())
    .filter((inner) => !tryParseArgsFromString(inner));
}

/** Strip <tool_call>...</tool_call> blocks from text for display. */
export function stripToolCallsFromText(text: string): string {
  return (text || "").replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "").trim();
}

/** Strip tool calls for streaming display - hides complete blocks and any trailing partial <tool_call. */
export function stripToolCallsForDisplay(text: string): string {
  if (!text) return "";
  let out = text.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "");
  const openIdx = out.search(/<tool_call/i);
  if (openIdx >= 0) out = out.slice(0, openIdx);
  return out.trim();
}

/** Build compact text reference of tools for prompt-based tool calling (when API does not support native tools). */
export function buildTextToolsPrompt(): string {
  const lines = AI_TOOL_DEFINITIONS.map((d) => {
    const params = d.function.parameters.required?.join(", ") ?? "";
    return `- ${d.function.name}(${params}): ${d.function.description}`;
  });
  return [
    "When you need to call a tool, output EXACTLY: <tool_call>{\"name\":\"tool_name\",\"args\":{\"param\":\"value\"}}</tool_call>",
    "Use valid JSON. Example: <tool_call>{\"name\":\"rename_chapter\",\"args\":{\"chapter_id\":\"abc123\",\"new_title\":\"New Title\"}}</tool_call>",
    "Available tools:",
    ...lines.slice(0, 25),
    lines.length > 25 ? `... and ${lines.length - 25} more. Use the exact tool names and required args.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCoverTextToolsPrompt(): string {
  const lines = COVER_AI_TOOL_DEFINITIONS.map((d) => {
    const params = d.function.parameters.required?.join(", ") ?? "";
    return `- ${d.function.name}(${params}): ${d.function.description}`;
  });
  return [
    "When you need to call a tool, output EXACTLY: <tool_call>{\"name\":\"tool_name\",\"args\":{\"param\":\"value\"}}</tool_call>",
    "Cover tools only:",
    ...lines,
  ].join("\n");
}

export interface ToolCallResult {
  tool_call_id: string;
  result: string;
}

function parseCoverPage(p: unknown, fallback: "front" | "spine" | "back"): "front" | "spine" | "back" {
  const s = String(p ?? "")
    .toLowerCase()
    .trim();
  if (s === "front" || s === "spine" || s === "back") return s;
  return fallback;
}

export function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AiToolContext,
  toolCallId: string
): ToolCallResult {
  const chapter = (id: string) => ctx.chapters.find((c) => c.id === id);
  const bookChapters = () => ctx.chapters.filter((c) => c.bookId === ctx.book.id).sort((a, b) => a.sortOrder - b.sortOrder);

  const err = (msg: string) => ({ tool_call_id: toolCallId, result: JSON.stringify({ error: msg }) });
  const ok = (data: Record<string, unknown>) => ({ tool_call_id: toolCallId, result: JSON.stringify(data) });

  try {
    switch (name) {
      case "replace_text_range": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const plain = htmlToPlain(ch.content);
        const start = Math.max(0, (args.start_char as number) ?? 0);
        const end = Math.min(plain.length, (args.end_char as number) ?? 0);
        const newText = (args.new_text as string) ?? "";
        const newPlain = plain.slice(0, start) + newText + plain.slice(end);
        ctx.onUpdateChapter(ch.id, { content: plainToHtml(newPlain), updatedAt: Date.now() });
        return ok({ ok: true, message: "Replaced text" });
      }
      case "insert_text": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const plain = htmlToPlain(ch.content);
        const pos = Math.max(0, Math.min(plain.length, (args.position as number) ?? 0));
        const text = (args.text as string) ?? "";
        const newPlain = plain.slice(0, pos) + text + plain.slice(pos);
        ctx.onUpdateChapter(ch.id, { content: plainToHtml(newPlain), updatedAt: Date.now() });
        return ok({ ok: true, message: "Inserted text" });
      }
      case "delete_text_range": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const plain = htmlToPlain(ch.content);
        const start = Math.max(0, (args.start_char as number) ?? 0);
        const end = Math.min(plain.length, (args.end_char as number) ?? 0);
        const newPlain = plain.slice(0, start) + plain.slice(end);
        ctx.onUpdateChapter(ch.id, { content: plainToHtml(newPlain), updatedAt: Date.now() });
        return ok({ ok: true, message: "Deleted text" });
      }
      case "replace_chapter_content": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const content = (args.content as string) ?? "";
        ctx.onUpdateChapter(ch.id, { content: content || "<p></p>", updatedAt: Date.now() });
        return ok({ ok: true, message: "Replaced chapter content" });
      }
      case "rename_chapter": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        ctx.onUpdateChapter(ch.id, { title: (args.new_title as string) ?? "", updatedAt: Date.now() });
        return ok({ ok: true, message: "Renamed chapter" });
      }
      case "update_chapter_notes": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        ctx.onUpdateChapter(ch.id, { notes: (args.notes as string) ?? "", updatedAt: Date.now() });
        return ok({ ok: true, message: "Updated notes" });
      }
      case "update_chapter_status": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const status = (args.status as string) ?? "draft";
        if (!["draft", "progress", "complete", "review", "locked"].includes(status)) {
          return err("Invalid status");
        }
        ctx.onUpdateChapter(ch.id, { status: status as Chapter["status"], updatedAt: Date.now() });
        return ok({ ok: true, message: "Updated status" });
      }
      case "update_chapter_summary": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        ctx.onUpdateChapter(ch.id, { summary: (args.summary as string) ?? "", updatedAt: Date.now() });
        return ok({ ok: true, message: "Updated summary" });
      }
      case "create_chapter": {
        const bookId = args.book_id as string;
        if (bookId && bookId !== ctx.book.id) {
          return err("Can only create chapters in the current book");
        }
        const newId = ctx.onAddChapter();
        const pos = (args.position as number) ?? ctx.chapters.length;
        ctx.onUpdateChapter(newId, {
          title: (args.title as string) ?? "New Chapter",
          content: (args.content as string) ?? "<p></p>",
          sortOrder: pos,
          updatedAt: Date.now(),
        });
        return ok({ ok: true, chapter_id: newId, message: "Created chapter" });
      }
      case "delete_chapter": {
        ctx.onDeleteChapter(args.chapter_id as string);
        return ok({ ok: true, message: "Deleted chapter" });
      }
      case "duplicate_chapter": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const newId = ctx.onAddChapter();
        ctx.onUpdateChapter(newId, {
          ...ch,
          id: newId,
          title: `${ch.title} (copy)`,
          sortOrder: ch.sortOrder + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        return ok({ ok: true, chapter_id: newId, message: "Duplicated chapter" });
      }
      case "reorder_chapters": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        ctx.onUpdateChapter(ch.id, { sortOrder: (args.new_sort_order as number) ?? 0, updatedAt: Date.now() });
        return ok({ ok: true, message: "Reordered" });
      }
      case "move_chapter": {
        ctx.onMoveChapter(args.chapter_id as string, (args.direction as "up" | "down") ?? "down");
        return ok({ ok: true, message: "Moved chapter" });
      }
      case "update_book_title":
        ctx.onUpdateBook(ctx.book.id, { title: (args.title as string) ?? "" });
        return ok({ ok: true, message: "Updated title" });
      case "update_book_subtitle":
        ctx.onUpdateBook(ctx.book.id, { subtitle: (args.subtitle as string) ?? "" });
        return ok({ ok: true, message: "Updated subtitle" });
      case "update_book_genre":
        ctx.onUpdateBook(ctx.book.id, { genre: (args.genre as string) ?? "" });
        return ok({ ok: true, message: "Updated genre" });
      case "update_book_summary":
        ctx.onUpdateBook(ctx.book.id, { bookSummary: (args.bookSummary as string) ?? "" });
        return ok({ ok: true, message: "Updated summary" });
      case "update_book_style_guide":
        ctx.onUpdateBook(ctx.book.id, { styleGuide: (args.styleGuide as string) ?? "" });
        return ok({ ok: true, message: "Updated style guide" });
      case "update_book_author_override":
        ctx.onUpdateBook(ctx.book.id, { authorOverride: (args.authorOverride as string) ?? "" });
        return ok({ ok: true, message: "Updated author" });
      case "update_book_word_goal":
        ctx.onUpdateBook(ctx.book.id, { wordGoal: (args.wordGoal as number) ?? 0 });
        return ok({ ok: true, message: "Updated word goal" });
      case "get_chapter_content": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const plain = htmlToPlain(ch.content);
        return ok({ content: plain, char_count: plain.length });
      }
      case "get_chapter_excerpt": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const plain = htmlToPlain(ch.content);
        const start = Math.max(0, (args.start_char as number) ?? 0);
        const end = Math.min(plain.length, (args.end_char as number) ?? plain.length);
        return ok({ excerpt: plain.slice(start, end) });
      }
      case "get_book_structure":
      case "list_chapters": {
        const list = bookChapters().map((c) => ({ id: c.id, title: c.title, sortOrder: c.sortOrder }));
        return ok({ chapters: list });
      }
      case "get_book_summary": {
        return ok({
            title: ctx.book.title,
            subtitle: ctx.book.subtitle,
            genre: ctx.book.genre,
            bookSummary: ctx.book.bookSummary,
            styleGuide: ctx.book.styleGuide,
          });
      }
      case "create_snapshot": {
        const snapId = ctx.onCreateSnapshot(args.chapter_id as string, args.label as string);
        return ok({ ok: true, snapshot_id: snapId, message: "Created snapshot" });
      }
      case "split_chapter": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const plain = htmlToPlain(ch.content);
        const splitAt = Math.max(0, Math.min(plain.length, (args.split_at_char as number) ?? 0));
        const firstPart = plain.slice(0, splitAt).trim();
        const secondPart = plain.slice(splitAt).trim();
        ctx.onUpdateChapter(ch.id, { content: plainToHtml(firstPart || " "), updatedAt: Date.now() });
        const newId = ctx.onAddChapter();
        const nextOrder = Math.max(...bookChapters().map((c) => c.sortOrder), ch.sortOrder) + 1;
        ctx.onUpdateChapter(newId, {
          title: `${ch.title} (continued)`,
          content: plainToHtml(secondPart || " "),
          sortOrder: nextOrder,
          updatedAt: Date.now(),
        });
        return ok({ ok: true, new_chapter_id: newId, message: "Split chapter" });
      }
      case "merge_chapters": {
        const first = chapter(args.first_chapter_id as string);
        const second = chapter(args.second_chapter_id as string);
        if (!first || !second) return err("Chapter not found");
        const merged = (first.content || " ") + (second.content || " ");
        ctx.onUpdateChapter(first.id, { content: merged.replace(/<p><\/p>/g, ""), updatedAt: Date.now() });
        ctx.onDeleteChapter(second.id);
        return ok({ ok: true, message: "Merged chapters" });
      }
      case "apply_formatting": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const plain = htmlToPlain(ch.content);
        const start = Math.max(0, (args.start_char as number) ?? 0);
        const end = Math.min(plain.length, (args.end_char as number) ?? plain.length);
        const sub = plain.slice(start, end);
        if (!sub) return ok({ ok: true, message: "No text to format" });
        const formats = String(args.formats ?? "").toLowerCase().split(/[,\s]+/).filter(Boolean);
        let wrapped = sub;
        if (formats.includes("bold")) wrapped = `<strong>${wrapped}</strong>`;
        if (formats.includes("italic")) wrapped = `<em>${wrapped}</em>`;
        if (formats.includes("underline")) wrapped = `<u>${wrapped}</u>`;
        const idx = ch.content.indexOf(sub);
        const newContent = idx >= 0 ? ch.content.slice(0, idx) + wrapped + ch.content.slice(idx + sub.length) : ch.content;
        ctx.onUpdateChapter(ch.id, { content: newContent, updatedAt: Date.now() });
        return ok({ ok: true, message: "Applied formatting" });
      }
      case "update_book_metadata": {
        let updates: Record<string, unknown>;
        try {
          updates = typeof args.updates === "string" ? JSON.parse(args.updates) : (args.updates as Record<string, unknown>) ?? {};
        } catch {
          return err("Invalid updates JSON");
        }
        const allowed = ["title", "subtitle", "genre", "bookSummary", "styleGuide", "authorOverride", "wordGoal"];
        const filtered: Partial<Book> = {};
        for (const k of Object.keys(updates)) {
          if (allowed.includes(k)) (filtered as Record<string, unknown>)[k] = updates[k];
        }
        if (Object.keys(filtered).length) ctx.onUpdateBook(ctx.book.id, filtered);
        return ok({ ok: true, message: "Updated book metadata" });
      }
      case "find_and_replace": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const find = (args.find_text as string) ?? "";
        const replace = (args.replace_text as string) ?? "";
        const replaceAll = String(args.replace_all ?? "").toLowerCase() === "true";
        if (!find) return err("find_text is required");
        let content = ch.content;
        if (replaceAll) {
          content = content.split(find).join(replace);
        } else {
          const idx = content.indexOf(find);
          if (idx >= 0) content = content.slice(0, idx) + replace + content.slice(idx + find.length);
        }
        ctx.onUpdateChapter(ch.id, { content, updatedAt: Date.now() });
        return ok({ ok: true, message: "Find and replace done" });
      }
      case "append_to_chapter": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const text = (args.text as string) ?? "";
        const newContent = (ch.content || "<p></p>").replace(/<\/p>\s*$/, "") + (text ? `<p>${text.replace(/\n/g, "<br/>")}</p>` : "");
        ctx.onUpdateChapter(ch.id, { content: newContent, updatedAt: Date.now() });
        return ok({ ok: true, message: "Appended to chapter" });
      }
      case "prepend_to_chapter": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const text = (args.text as string) ?? "";
        const newContent = (text ? `<p>${text.replace(/\n/g, "<br/>")}</p>` : "") + (ch.content || "<p></p>");
        ctx.onUpdateChapter(ch.id, { content: newContent, updatedAt: Date.now() });
        return ok({ ok: true, message: "Prepended to chapter" });
      }
      case "get_chapter_word_count": {
        const ch = chapter(args.chapter_id as string);
        if (!ch) return err("Chapter not found");
        const wc = countWords(ch.content);
        return ok({ word_count: wc, chapter_id: ch.id });
      }
      case "get_book_word_count": {
        const chs = bookChapters();
        const total = chs.reduce((sum, c) => sum + countWords(c.content), 0);
        return ok({ word_count: total, book_id: ctx.book.id });
      }
      case "list_snapshots": {
        const chapterId = args.chapter_id as string;
        const list = ctx.snapshots.filter((s) => s.chapterId === chapterId).slice(0, 20);
        return ok({ snapshots: list.map((s) => ({ id: s.id, createdAt: s.createdAt, label: s.label })) });
      }
      case "switch_active_chapter": {
        ctx.onSelectChapter(args.chapter_id as string);
        return ok({ ok: true, message: "Switched to chapter" });
      }
      case "apply_book_visual_theme": {
        const tid = (args.theme_id as string)?.trim();
        const fid = (args.editor_font_id as string)?.trim();
        const uiFontId = (args.ui_font_id as string)?.trim();
        const fontSize = typeof args.font_size === "number" ? args.font_size : undefined;
        const lineHeight = typeof args.line_height === "number" ? args.line_height : undefined;
        const paragraphWidth = (args.paragraph_width as string)?.trim();
        const pbg = (args.page_background_hex as string)?.trim();
        const settingsPatch: Partial<AppSettings> = {};
        // Book canvas theme (`theme_id`) applies to the book only, not global app shell.
        if (fid) settingsPatch.editorFontId = fid;
        if (uiFontId) settingsPatch.uiFontId = uiFontId;
        if (typeof fontSize === "number") settingsPatch.fontSize = fontSize;
        if (typeof lineHeight === "number") settingsPatch.lineHeight = lineHeight;
        if (paragraphWidth) settingsPatch.paragraphWidth = paragraphWidth as AppSettings["paragraphWidth"];
        if (Object.keys(settingsPatch).length && ctx.upSettings) ctx.upSettings(settingsPatch);
        const bookPatch: Partial<Book> = {};
        if (tid) bookPatch.preferredThemeId = tid;
        if (fid) bookPatch.preferredEditorFontId = fid;
        if (uiFontId) bookPatch.preferredUiFontId = uiFontId;
        if (typeof fontSize === "number") bookPatch.preferredFontSize = fontSize;
        if (typeof lineHeight === "number") bookPatch.preferredLineHeight = lineHeight;
        if (paragraphWidth) bookPatch.preferredParagraphWidth = paragraphWidth as Book["preferredParagraphWidth"];
        if (pbg) bookPatch.editorPageBackground = pbg;
        const borderJson = (args.page_border_json as string)?.trim();
        if (borderJson) {
          try {
            bookPatch.pageBorderStyle = JSON.parse(borderJson) as PageBorderStyle;
          } catch {
            return err("Invalid page_border_json");
          }
        }
        const cj = (args.cover_design_json as string)?.trim();
        if (cj) {
          try {
            bookPatch.coverDesign = JSON.parse(cj) as CoverDesign;
          } catch {
            return err("Invalid cover_design_json");
          }
        }
        if (Object.keys(bookPatch).length) {
          ctx.onUpdateBook(ctx.book.id, { ...bookPatch, updatedAt: Date.now() });
        }
        return ok({ ok: true, message: "Visual theme updated" });
      }
      case "list_cover_elements": {
        if (!ctx.coverAi) return err("Cover AI not active");
        const page = parseCoverPage(args.page, ctx.coverAi.activePage);
        const d = ctx.coverAi.getDesign();
        const pg = d[page];
        return ok({
          page,
          background: pg.background,
          elements: pg.elements.map((e) => ({
            id: e.id,
            type: e.type,
            name: e.name,
            x: e.x,
            y: e.y,
            w: e.w,
            h: e.h,
            text: e.text?.slice(0, 120),
          })),
        });
      }
      case "set_cover_background": {
        if (!ctx.coverAi) return err("Cover AI not active");
        const page = parseCoverPage(args.page, ctx.coverAi.activePage);
        const bgType = String(args.bg_type || "gradient").toLowerCase();
        let bg: PageBackground;
        if (bgType === "solid") {
          bg = { type: "solid", solid: (args.solid as string) || "#1a1a2e" };
        } else if (bgType === "image") {
          bg = { type: "image", image: (args.image as string) || "", solid: "#1a1a2e" };
        } else {
          bg = {
            type: "gradient",
            gradientA: (args.gradient_a as string) || "#0f2044",
            gradientB: (args.gradient_b as string) || "#1a4480",
            gradientAngle: (args.angle as number) ?? 135,
          };
        }
        const tex = (args.texture as string) || "none";
        if (["none", "linen", "leather", "canvas", "marble", "paper", "grain", "weave", "diamond"].includes(tex)) {
          (bg as PageBackground).texture = tex;
        }
        if (String(args.vignette || "").toLowerCase() === "true") {
          bg.vignette = true;
          bg.vignetteStrength = 50;
        }
        const d = ctx.coverAi.getDesign();
        const nd: CoverDesign = { ...d, [page]: { ...d[page], background: { ...d[page].background, ...bg } } };
        ctx.coverAi.onApplyDesign(nd);
        return ok({ ok: true, page });
      }
      case "add_cover_element": {
        if (!ctx.coverAi) return err("Cover AI not active");
        const page = parseCoverPage(args.page, ctx.coverAi.activePage);
        const et = String(args.element_type || "text").toLowerCase();
        const d = ctx.coverAi.getDesign();
        const els = d[page].elements;
        const maxZ = els.reduce((m, e) => Math.max(m, e.zIndex), 0);
        const base: CoverElement = {
          id: genId(),
          type: "text",
          name: (args.name as string) || "AI Layer",
          x: (args.x as number) ?? 10,
          y: (args.y as number) ?? 35,
          w: (args.w as number) ?? 80,
          h: (args.h as number) ?? 18,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          zIndex: maxZ + 1,
        };
        let el: CoverElement = base;
        if (et === "text") {
          el = {
            ...base,
            type: "text",
            text: (args.text as string) || ctx.book.title || "Title",
            fontSize: (args.font_size as number) ?? 28,
            color: (args.color as string) || "rgba(255,255,255,0.92)",
            fontFamily: (args.font_family as string) || "Georgia, serif",
            textAlign: "center",
          };
        } else if (et === "shape") {
          const sk = (args.shape_kind as string) || "rect";
          el = {
            ...base,
            type: "shape",
            shapeType: sk === "circle" ? "circle" : sk === "line" ? "line" : "rect",
            fill: (args.fill as string) || "rgba(255,255,255,0.12)",
            stroke: (args.stroke as string) || "rgba(255,255,255,0.35)",
            strokeWidth: 2,
          };
        } else if (et === "ornament") {
          el = {
            ...base,
            type: "ornament",
            ornamentChar: (args.ornament_char as string) || "❧",
            color: (args.color as string) || "rgba(255,255,255,0.75)",
            ornamentScale: 1.2,
          };
        } else if (et === "divider") {
          el = {
            ...base,
            type: "divider",
            h: 2,
            color: (args.color as string) || "rgba(255,255,255,0.45)",
          };
        } else if (et === "image") {
          el = {
            ...base,
            type: "image",
            src: (args.image as string) || "",
            objectFit: "cover",
          };
        } else {
          return err("Unknown element_type");
        }
        const nd: CoverDesign = { ...d, [page]: { ...d[page], elements: [...els, el] } };
        ctx.coverAi.onApplyDesign(nd);
        return ok({ ok: true, element_id: el.id, page });
      }
      case "update_cover_element": {
        if (!ctx.coverAi) return err("Cover AI not active");
        const page = parseCoverPage(args.page, ctx.coverAi.activePage);
        const eid = args.element_id as string;
        let updates: Partial<CoverElement>;
        try {
          updates = JSON.parse((args.updates_json as string) || "{}") as Partial<CoverElement>;
        } catch {
          return err("Invalid updates_json");
        }
        const d = ctx.coverAi.getDesign();
        const nd: CoverDesign = {
          ...d,
          [page]: {
            ...d[page],
            elements: d[page].elements.map((e) => (e.id === eid ? { ...e, ...updates } : e)),
          },
        };
        ctx.coverAi.onApplyDesign(nd);
        return ok({ ok: true });
      }
      case "delete_cover_element": {
        if (!ctx.coverAi) return err("Cover AI not active");
        const page = parseCoverPage(args.page, ctx.coverAi.activePage);
        const eid = args.element_id as string;
        const d = ctx.coverAi.getDesign();
        const nd: CoverDesign = {
          ...d,
          [page]: { ...d[page], elements: d[page].elements.filter((e) => e.id !== eid) },
        };
        ctx.coverAi.onApplyDesign(nd);
        return ok({ ok: true });
      }
      case "apply_cover_theme": {
        if (!ctx.coverAi) return err("Cover AI not active");
        const t = String(args.theme || "minimal").toLowerCase();
        const d = ctx.coverAi.getDesign();
        const presets: Record<string, { bg: PageBackground }> = {
          gothic: {
            bg: { type: "gradient", gradientA: "#1a0510", gradientB: "#4a1828", gradientAngle: 135, vignette: true, vignetteStrength: 70 },
          },
          romance: {
            bg: { type: "gradient", gradientA: "#4a1a2e", gradientB: "#8b3a5c", gradientAngle: 128, texture: "paper" },
          },
          scifi: {
            bg: { type: "gradient", gradientA: "#0a1628", gradientB: "#1e3a5c", gradientAngle: 145 },
          },
          minimal: { bg: { type: "solid", solid: "#2a2a2e" } },
          poetry: {
            bg: { type: "gradient", gradientA: "#1e1a14", gradientB: "#3d3428", gradientAngle: 90, texture: "linen" },
          },
        };
        const pr = presets[t] || presets.minimal;
        const front = { ...d.front, background: { ...d.front.background, ...pr.bg } };
        const nd: CoverDesign = { ...d, front };
        ctx.coverAi.onApplyDesign(nd);
        return ok({ ok: true, theme: t });
      }
      default:
        return err(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return { tool_call_id: toolCallId, result: JSON.stringify({ error: (e as Error).message }) };
  }
}
