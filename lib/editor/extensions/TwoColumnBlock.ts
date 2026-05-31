import { Node, mergeAttributes, type CommandProps } from "@tiptap/core";

/** Block container with CSS multi-column layout (two columns). */
export const TwoColumnBlock = Node.create({
  name: "twoColumnBlock",
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="two-column-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "two-column-block",
        class: "mahink-two-columns",
      }),
      0,
    ];
  },

  addNodeView() {
    return () => {
      const dom = document.createElement("div");
      dom.dataset.type = "two-column-block";
      dom.className = "mahink-two-columns";
      Object.assign(dom.style, {
        columnCount: "2",
        columnGap: "28px",
        columnRule: "1px solid color-mix(in srgb, var(--txt-m, #888) 35%, transparent)",
        marginBottom: "1rem",
      });
      return { dom, contentDOM: dom };
    };
  },

  addCommands() {
    return {
      insertTwoColumnSection:
        () =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            content: [{ type: "paragraph" }, { type: "paragraph" }],
          }),
    };
  },
});

export default TwoColumnBlock;
