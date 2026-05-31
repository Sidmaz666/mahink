"use client";

import { useRef, useState, useEffect } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Superscript, Subscript,
  Heading1, Heading2, Heading3, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Minus, ImagePlus, Highlighter, PaintBucket,
  Undo2, Redo2, Bot, SpellCheck, ChevronDown, Ban, XCircle,
  LayoutGrid, Square, Circle, MoveHorizontal, ArrowRight, MessageSquare, Pencil,
} from "lucide-react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import type { AiActionPreset } from "@/lib/types";
import type { FontOption } from "@/lib/types";

function ToolbarSep() {
  return <div style={{ width: 1, height: 20, background: "var(--brd)", margin: "0 3px", flexShrink: 0 }}/>;
}

function ToolbarBtn({
  Icon,
  tip,
  active,
  action,
  disabled,
  theme,
}: {
  Icon: React.ElementType;
  tip: string;
  active?: boolean;
  action: () => void;
  disabled?: boolean;
  theme: { border: string; accent: string; textMuted: string };
}) {
  return (
    <button
      className="ibtn tip"
      aria-label={tip}
      data-tip={tip}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        borderRadius: 5,
        background: active ? `${theme.accent}22` : "transparent",
        color: active ? theme.accent : "var(--txt-m)",
        border: active ? `1px solid ${theme.accent}55` : "1px solid transparent",
      }}
      onClick={action}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Icon size={14}/>
    </button>
  );
}

interface Props {
  editor: Editor | null;
  theme: { border: string; accent: string; textMuted: string; surface: string; surfaceAlt: string; text: string; shadow: string };
  fonts?: Record<string, FontOption>;
  defaultFontId?: string;
  onAiAction?: (action: AiActionPreset) => void;
}

function resolveFontId(editor: Editor | null, fontEntries: [string, FontOption][], defaultFontId: string): string {
  const ff = editor?.getAttributes("textStyle").fontFamily;
  if (!ff) return defaultFontId;
  const raw = ff.split(",")[0]?.trim() || "";
  const first = raw.replace(/^["']|["']$/g, "").trim();
  const match = fontEntries.find(([, f]) => {
    const stackFirst = f.stack.split(",")[0]?.replace(/^["']|["']$/g, "").trim();
    return stackFirst === first || f.stack.includes(first) || first.includes(f.label);
  });
  return match ? match[0] : defaultFontId;
}

function FontDropdown({
  editor,
  fonts,
  defaultFontId,
  theme,
}: {
  editor: Editor | null;
  fonts: Record<string, FontOption>;
  defaultFontId: string;
  theme: { border: string; accent: string; surface: string; surfaceAlt: string; text: string; shadow: string };
}) {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fontEntries = Object.entries(fonts);
  const currentId = resolveFontId(editor, fontEntries, defaultFontId);
  const currentFont = fonts[currentId];

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  if (fontEntries.length === 0) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="inp tip"
        data-tip="Font: select text then pick to change it, or pick before typing"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "4px 8px",
          fontSize: 11,
          maxWidth: 160,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: currentFont?.stack ?? "inherit",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentFont?.label ?? "Font"}
        </span>
        <ChevronDown size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
      </button>
      {open &&
        typeof document !== "undefined" &&
        btnRef.current &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              zIndex: 9999,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              boxShadow: `0 8px 24px ${theme.shadow}`,
              maxHeight: 280,
              overflowY: "auto",
              minWidth: btnRef.current.offsetWidth,
              top: btnRef.current.getBoundingClientRect().bottom + 4,
              left: btnRef.current.getBoundingClientRect().left,
            }}
          >
            {fontEntries.map(([id, f]) => (
              <button
                key={id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  if (f && editor) editor.chain().focus().setFontFamily(f.stack).run();
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  textAlign: "left",
                  fontFamily: f.stack,
                  fontSize: 12,
                  background: id === currentId ? theme.surfaceAlt : hoveredId === id ? theme.surfaceAlt : "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: theme.text,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export default function FormatToolbar({ editor, theme, fonts = {}, defaultFontId = "cormorant", onAiAction }: Props) {
  const imgRef = useRef<HTMLInputElement>(null);
  const insertBtnRef = useRef<HTMLButtonElement>(null);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const [insertOpen, setInsertOpen] = useState(false);

  useEffect(() => {
    if (!insertOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!insertBtnRef.current?.contains(t) && !insertMenuRef.current?.contains(t)) setInsertOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [insertOpen]);

  const isActive = (type: string | Record<string, unknown>, attrs?: Record<string, unknown>) => {
    if (typeof type === "object") return editor?.isActive(type) ?? false;
    return editor?.isActive(type, attrs) ?? false;
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor?.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  };

  const fontEntries = Object.entries(fonts);

  return (
    <>
      {/* Font for selection (Word-like) — custom dropdown preserves editor focus & selection */}
      {fontEntries.length > 0 && (
        <>
          <FontDropdown editor={editor} fonts={fonts} defaultFontId={defaultFontId} theme={theme} />
          <ToolbarSep/>
        </>
      )}
      {/* Undo / Redo */}
      <ToolbarBtn Icon={Undo2} tip="Undo (Ctrl+Z)"
        action={() => editor?.chain().focus().undo().run()}
        disabled={!editor?.can().undo()} theme={theme}/>
      <ToolbarBtn Icon={Redo2} tip="Redo (Ctrl+Y)"
        action={() => editor?.chain().focus().redo().run()}
        disabled={!editor?.can().redo()} theme={theme}/>
      <ToolbarSep/>

      {/* Text styles */}
      <ToolbarBtn Icon={Bot} tip="AI rewrite selection"
        action={() => onAiAction?.("rewrite")}
        disabled={!onAiAction} theme={theme}/>
      <ToolbarBtn Icon={SpellCheck} tip="AI fix grammar"
        action={() => onAiAction?.("grammar")}
        disabled={!onAiAction} theme={theme}/>
      <ToolbarSep/>
      <ToolbarBtn Icon={Bold}          tip="Bold (Ctrl+B)"         active={isActive("bold")}          action={() => editor?.chain().focus().toggleBold().run()} theme={theme}/>
      <ToolbarBtn Icon={Italic}        tip="Italic (Ctrl+I)"       active={isActive("italic")}        action={() => editor?.chain().focus().toggleItalic().run()} theme={theme}/>
      <ToolbarBtn Icon={Underline}     tip="Underline (Ctrl+U)"    active={isActive("underline")}     action={() => editor?.chain().focus().toggleUnderline().run()} theme={theme}/>
      <ToolbarBtn Icon={Strikethrough} tip="Strikethrough"         active={isActive("strike")}        action={() => editor?.chain().focus().toggleStrike().run()} theme={theme}/>
      <ToolbarBtn Icon={Superscript}   tip="Superscript"           active={isActive("superscript")}   action={() => editor?.chain().focus().toggleSuperscript().run()} theme={theme}/>
      <ToolbarBtn Icon={Subscript}     tip="Subscript"             active={isActive("subscript")}     action={() => editor?.chain().focus().toggleSubscript().run()} theme={theme}/>
      <ToolbarSep/>

      {/* Headings */}
      <ToolbarBtn Icon={Heading1} tip="Heading 1" active={isActive("heading", { level: 1 })} action={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} theme={theme}/>
      <ToolbarBtn Icon={Heading2} tip="Heading 2" active={isActive("heading", { level: 2 })} action={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} theme={theme}/>
      <ToolbarBtn Icon={Heading3} tip="Heading 3" active={isActive("heading", { level: 3 })} action={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} theme={theme}/>
      <ToolbarBtn Icon={Quote}    tip="Blockquote" active={isActive("blockquote")}           action={() => editor?.chain().focus().toggleBlockquote().run()} theme={theme}/>
      <ToolbarSep/>

      {/* Alignment */}
      <ToolbarBtn Icon={AlignLeft}    tip="Align left"    active={isActive({ textAlign: "left" })}    action={() => editor?.chain().focus().setTextAlign("left").run()} theme={theme}/>
      <ToolbarBtn Icon={AlignCenter}  tip="Align center"  active={isActive({ textAlign: "center" })}  action={() => editor?.chain().focus().setTextAlign("center").run()} theme={theme}/>
      <ToolbarBtn Icon={AlignRight}   tip="Align right"   active={isActive({ textAlign: "right" })}   action={() => editor?.chain().focus().setTextAlign("right").run()} theme={theme}/>
      <ToolbarBtn Icon={AlignJustify} tip="Justify"       active={isActive({ textAlign: "justify" })} action={() => editor?.chain().focus().setTextAlign("justify").run()} theme={theme}/>
      <ToolbarSep/>

      {/* Lists */}
      <ToolbarBtn Icon={List}         tip="Bullet list"   active={isActive("bulletList")}   action={() => editor?.chain().focus().toggleBulletList().run()} theme={theme}/>
      <ToolbarBtn Icon={ListOrdered}  tip="Numbered list" active={isActive("orderedList")}  action={() => editor?.chain().focus().toggleOrderedList().run()} theme={theme}/>
      <ToolbarSep/>

      {/* Highlight + highlight colour */}
      <ToolbarBtn Icon={Highlighter} tip="Toggle highlight" active={isActive("highlight")} action={() => editor?.chain().focus().toggleHighlight().run()} theme={theme}/>
      <label className="tip" data-tip="Highlight colour" aria-label="Highlight colour" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, cursor: "pointer", borderRadius: 5, position: "relative", flexShrink: 0 }} onMouseDown={(e) => e.preventDefault()}>
        <Highlighter size={12} style={{ opacity: 0.85 }} />
        <input
          type="color"
          defaultValue="#fef08a"
          onChange={(e) => editor?.chain().focus().setHighlight({ color: e.target.value }).run()}
          style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
        />
      </label>
      <ToolbarBtn Icon={XCircle} tip="Remove highlight" action={() => editor?.chain().focus().unsetHighlight().run()} theme={theme}/>

      {/* Text background (behind letters) */}
      <label className="tip" data-tip="Text background colour" aria-label="Text background colour" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, cursor: "pointer", borderRadius: 5, position: "relative", flexShrink: 0 }} onMouseDown={(e) => e.preventDefault()}>
        <PaintBucket size={14} style={{ color: "var(--txt-m)" }} />
        <input
          type="color"
          defaultValue="#e0e7ff"
          onChange={(e) => editor?.chain().focus().setTextBackgroundColor(e.target.value).run()}
          style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
        />
      </label>
      <ToolbarBtn Icon={Ban} tip="Clear text background" action={() => editor?.chain().focus().unsetTextBackgroundColor().run()} theme={theme}/>

      {/* Text color */}
      <label className="tip" data-tip="Text colour" aria-label="Text colour" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, cursor: "pointer", borderRadius: 5, position: "relative" }} onMouseDown={(e) => e.preventDefault()}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--txt-m)", letterSpacing: "-0.5px", userSelect: "none" }}>A</span>
        <input
          type="color"
          defaultValue="#c0392b"
          onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
          style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
        />
      </label>
      <ToolbarSep/>

      {/* Insert: columns, shapes, drawing */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          ref={insertBtnRef}
          type="button"
          className="inp tip"
          data-tip="Insert columns, shapes, or drawing"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setInsertOpen((o) => !o)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          <LayoutGrid size={14} />
          Insert
          <ChevronDown size={12} style={{ opacity: 0.7 }} />
        </button>
        {insertOpen &&
          typeof document !== "undefined" &&
          insertBtnRef.current &&
          createPortal(
            <div
              ref={insertMenuRef}
              style={{
                position: "fixed",
                zIndex: 9999,
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                boxShadow: `0 8px 24px ${theme.shadow}`,
                minWidth: 200,
                padding: 6,
                top: insertBtnRef.current.getBoundingClientRect().bottom + 4,
                left: insertBtnRef.current.getBoundingClientRect().left,
              }}
            >
              {(
                [
                  { Icon: LayoutGrid, label: "Two-column section", run: () => editor?.chain().focus().insertTwoColumnSection().run() },
                  { Icon: Square, label: "Rectangle", run: () => editor?.chain().focus().insertMahinkShape("rect").run() },
                  { Icon: Circle, label: "Circle", run: () => editor?.chain().focus().insertMahinkShape("circle").run() },
                  { Icon: MoveHorizontal, label: "Line", run: () => editor?.chain().focus().insertMahinkShape("line").run() },
                  { Icon: ArrowRight, label: "Arrow", run: () => editor?.chain().focus().insertMahinkShape("arrow").run() },
                  { Icon: MessageSquare, label: "Callout", run: () => editor?.chain().focus().insertMahinkShape("callout").run() },
                  { Icon: Pencil, label: "Drawing canvas (tldraw)", run: () => editor?.chain().focus().insertMahinkDrawing().run() },
                ] as const
              ).map(({ Icon, label, run }) => (
                <button
                  key={label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    run();
                    setInsertOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 10px",
                    border: "none",
                    borderRadius: 6,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    color: theme.text,
                    textAlign: "left",
                  }}
                >
                  <Icon size={14} style={{ opacity: 0.85 }} />
                  {label}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>
      <ToolbarSep/>

      {/* Scene break */}
      <ToolbarBtn Icon={Minus} tip="Scene break — * * *"
        action={() => editor?.chain().focus().insertContent('<p style="text-align:center;opacity:0.45;letter-spacing:0.5em;">* * *</p>').run()} theme={theme}/>

      {/* Image insert */}
      <ToolbarBtn Icon={ImagePlus} tip="Insert image (or paste one)"
        action={() => imgRef.current?.click()} theme={theme}/>
      <input
        ref={imgRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImage(file);
          e.target.value = "";
        }}
      />

      {/* Horizontal rule */}
      <ToolbarBtn Icon={Minus} tip="Horizontal rule"
        action={() => editor?.chain().focus().setHorizontalRule().run()} theme={theme}/>
    </>
  );
}
