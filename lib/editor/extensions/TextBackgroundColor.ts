import { Mark, mergeAttributes, type CommandProps } from "@tiptap/core";

/** Text highlight-style background behind selected text (distinct from Highlight mark). */
export const TextBackgroundColor = Mark.create({
  name: "textBackgroundColor",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-text-bg") || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return {
            "data-text-bg": attributes.color,
            style: `background-color: ${attributes.color}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-text-bg]",
        getAttrs: (el) => ({
          color: (el as HTMLElement).getAttribute("data-text-bg"),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setTextBackgroundColor:
        (color: string) =>
        ({ commands }: CommandProps) =>
          commands.setMark(this.name, { color }),
      unsetTextBackgroundColor:
        () =>
        ({ commands }: CommandProps) =>
          commands.unsetMark(this.name),
    };
  },
});

export default TextBackgroundColor;
