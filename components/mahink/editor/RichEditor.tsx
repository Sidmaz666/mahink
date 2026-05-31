"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import type { Editor } from "@tiptap/react";
import { playTypewriterSound } from "@/lib/typewriterSound";
import { TextBackgroundColor } from "@/lib/editor/extensions/TextBackgroundColor";
import { TwoColumnBlock } from "@/lib/editor/extensions/TwoColumnBlock";
import { MahinkShape } from "@/lib/editor/extensions/MahinkShape";
import { MahinkDrawing } from "@/lib/editor/extensions/MahinkDrawing";

interface Props {
  content: string;
  chapterId: string;
  focusMode: boolean;
  spellcheck: boolean;
  typewriterSound?: boolean;
  typewriterSoundPreset?: string;
  typewriterSoundVolume?: number;
  onEditorReady: (editor: Editor) => void;
  onChange: (html: string) => void;
  dropCap?: boolean;
}

const NON_PRINTABLE = new Set([
  "Meta", "Control", "Alt", "Shift", "CapsLock",
  "Escape",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Home", "End", "PageUp", "PageDown", "Insert",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
]);
const SOUND_KEYS = new Set(["Enter", "Tab", "Backspace", "Delete"]);

export default function RichEditor({ content, chapterId, focusMode, spellcheck, typewriterSound, typewriterSoundPreset, typewriterSoundVolume, onEditorReady, onChange, dropCap }: Props) {
  const isInternalUpdate = useRef(false);
  const soundRef = useRef({ typewriterSound, typewriterSoundPreset, typewriterSoundVolume });
  soundRef.current = { typewriterSound, typewriterSoundPreset, typewriterSoundVolume };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: true }),
      Color,
      TextBackgroundColor,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextStyle,
      TwoColumnBlock,
      MahinkShape,
      MahinkDrawing,
      Placeholder.configure({ placeholder: "Begin writing your story here…" }),
      Superscript,
      Subscript,
    ],
    content,
    editorProps: {
      attributes: {
        class: `mahink-editor${focusMode ? " focus-on" : ""}${dropCap ? " drop-cap" : ""}`,
        spellcheck: spellcheck ? "true" : "false",
      },
      handleKeyDown: (view, event) => {
        const { typewriterSound: on, typewriterSoundPreset: preset, typewriterSoundVolume: vol } = soundRef.current;
        const isPrintable = event.key.length === 1 && !NON_PRINTABLE.has(event.key);
        const isSoundKey = SOUND_KEYS.has(event.key);
        if (on && (isPrintable || isSoundKey) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          playTypewriterSound(preset ?? "mechanical", vol ?? 50);
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isInternalUpdate.current) return;
      const html = ed.getHTML();
      onChange(html);
    },
  });

  // Expose editor instance upward
  useEffect(() => {
    if (editor) onEditorReady(editor);
  }, [editor, onEditorReady]);

  // Sync content when chapter changes
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      isInternalUpdate.current = true;
      editor.commands.setContent(content || "<p></p>");
      isInternalUpdate.current = false;
    }
  }, [chapterId, content, editor]);

  // Sync focus-mode class and spellcheck
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: `mahink-editor${focusMode ? " focus-on" : ""}${dropCap ? " drop-cap" : ""}`,
          spellcheck: spellcheck ? "true" : "false",
        },
        handleKeyDown: (view, event) => {
          const { typewriterSound: on, typewriterSoundPreset: preset, typewriterSoundVolume: vol } = soundRef.current;
          const isPrintable = event.key.length === 1 && !NON_PRINTABLE.has(event.key);
          const isSoundKey = SOUND_KEYS.has(event.key);
          if (on && (isPrintable || isSoundKey) && !event.ctrlKey && !event.metaKey && !event.altKey) {
            playTypewriterSound(preset ?? "mechanical", vol ?? 50);
          }
          return false;
        },
      },
    });
  }, [editor, focusMode, spellcheck]);

  // Handle image paste / drop — convert to base64
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.items)
      .filter((i) => i.type.startsWith("image/"))
      .map((i) => i.getAsFile())
      .filter(Boolean) as File[];
    if (!files.length || !editor) return;
    e.preventDefault();
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    });
  }, [editor]);

  return (
    <div onPaste={handlePaste} style={{ minHeight: "100%" }}>
      <EditorContent editor={editor} style={{ minHeight: "calc(100vh - 180px)" }}/>
    </div>
  );
}
