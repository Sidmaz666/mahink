import { Node, mergeAttributes, type CommandProps } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MahinkDrawingView from "@/components/mahink/editor/MahinkDrawingView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mahinkDrawing: {
      insertMahinkDrawing: () => ReturnType;
    };
  }
}

export const MahinkDrawing = Node.create({
  name: "mahinkDrawing",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      data: {
        default: "",
        parseHTML: (el) => (el as HTMLElement).dataset.snapshot ?? "",
        renderHTML: (attrs) => (attrs.data ? { "data-snapshot": attrs.data } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-mahink-drawing]" }, { tag: "div[data-folio-drawing]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-mahink-drawing": "1" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MahinkDrawingView);
  },

  addCommands() {
    return {
      insertMahinkDrawing:
        () =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name, attrs: { data: "" } }),
    };
  },
});

export default MahinkDrawing;
