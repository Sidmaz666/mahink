import { Node, mergeAttributes, type CommandProps } from "@tiptap/core";

export type MahinkShapeType = "rect" | "circle" | "line" | "arrow" | "callout";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mahinkShape: {
      insertMahinkShape: (shapeType?: MahinkShapeType) => ReturnType;
    };
  }
}

function buildSvgEl(attrs: {
  shapeType: MahinkShapeType;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}): SVGSVGElement {
  const { shapeType, width: w, height: h, fill, stroke } = attrs;
  const sw = Math.max(1, attrs.strokeWidth);
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.display = "block";
  svg.style.maxWidth = "100%";
  const mid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : String(Math.random()).slice(2, 10);

  if (shapeType === "rect") {
    const r = document.createElementNS(ns, "rect");
    r.setAttribute("x", String(sw / 2));
    r.setAttribute("y", String(sw / 2));
    r.setAttribute("width", String(w - sw));
    r.setAttribute("height", String(h - sw));
    r.setAttribute("rx", "6");
    r.setAttribute("fill", fill);
    r.setAttribute("stroke", stroke);
    r.setAttribute("stroke-width", String(sw));
    svg.appendChild(r);
  } else if (shapeType === "circle") {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", String(w / 2));
    c.setAttribute("cy", String(h / 2));
    c.setAttribute("r", String(Math.min(w, h) / 2 - sw));
    c.setAttribute("fill", fill);
    c.setAttribute("stroke", stroke);
    c.setAttribute("stroke-width", String(sw));
    svg.appendChild(c);
  } else if (shapeType === "line") {
    const l = document.createElementNS(ns, "line");
    l.setAttribute("x1", String(sw));
    l.setAttribute("y1", String(h / 2));
    l.setAttribute("x2", String(w - sw));
    l.setAttribute("y2", String(h / 2));
    l.setAttribute("stroke", stroke);
    l.setAttribute("stroke-width", String(sw));
    l.setAttribute("stroke-linecap", "round");
    svg.appendChild(l);
  } else if (shapeType === "arrow") {
    const defs = document.createElementNS(ns, "defs");
    const marker = document.createElementNS(ns, "marker");
    marker.setAttribute("id", `arrowhead-${mid}`);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const poly = document.createElementNS(ns, "polygon");
    poly.setAttribute("points", "0 0, 10 3.5, 0 7");
    poly.setAttribute("fill", stroke);
    marker.appendChild(poly);
    defs.appendChild(marker);
    svg.appendChild(defs);
    const l = document.createElementNS(ns, "line");
    l.setAttribute("x1", String(sw));
    l.setAttribute("y1", String(h / 2));
    l.setAttribute("x2", String(w - sw - 8));
    l.setAttribute("y2", String(h / 2));
    l.setAttribute("stroke", stroke);
    l.setAttribute("stroke-width", String(sw));
    l.setAttribute("marker-end", `url(#arrowhead-${mid})`);
    svg.appendChild(l);
  } else {
    /* callout */
    const r = document.createElementNS(ns, "rect");
    r.setAttribute("x", String(sw));
    r.setAttribute("y", String(sw));
    r.setAttribute("width", String(w * 0.55 - sw));
    r.setAttribute("height", String(h * 0.45 - sw));
    r.setAttribute("rx", "8");
    r.setAttribute("fill", fill);
    r.setAttribute("stroke", stroke);
    r.setAttribute("stroke-width", String(sw));
    svg.appendChild(r);
    const p = document.createElementNS(ns, "path");
    p.setAttribute(
      "d",
      `M ${w * 0.35} ${h * 0.45 + sw} L ${w * 0.25} ${h - sw} L ${w * 0.5} ${h * 0.55} Z`
    );
    p.setAttribute("fill", fill);
    p.setAttribute("stroke", stroke);
    p.setAttribute("stroke-width", String(sw));
    p.setAttribute("stroke-linejoin", "round");
    svg.appendChild(p);
  }

  return svg;
}

export const MahinkShape = Node.create({
  name: "mahinkShape",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      shapeType: {
        default: "rect" as MahinkShapeType,
        parseHTML: (el) => (el as HTMLElement).dataset.shapeType as MahinkShapeType,
        renderHTML: (attrs) => ({ "data-shape-type": attrs.shapeType }),
      },
      width: { default: 160, parseHTML: (el) => Number((el as HTMLElement).dataset.width) },
      height: { default: 100, parseHTML: (el) => Number((el as HTMLElement).dataset.height) },
      fill: { default: "#c8d6e5", parseHTML: (el) => (el as HTMLElement).dataset.fill },
      stroke: { default: "#2c3e50", parseHTML: (el) => (el as HTMLElement).dataset.stroke },
      strokeWidth: {
        default: 2,
        parseHTML: (el) => Number((el as HTMLElement).dataset.strokeWidth),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-mahink-shape]" }, { tag: "div[data-folio-shape]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-mahink-shape": "1",
        "data-shape-type": node.attrs.shapeType,
        "data-width": node.attrs.width,
        "data-height": node.attrs.height,
        "data-fill": node.attrs.fill,
        "data-stroke": node.attrs.stroke,
        "data-stroke-width": node.attrs.strokeWidth,
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.className = "mahink-shape-wrap";
      dom.style.margin = "14px 0";
      dom.style.display = "flex";
      dom.style.justifyContent = "center";
      dom.contentEditable = "false";

      const inner = document.createElement("div");
      inner.className = "mahink-shape-inner";
      inner.appendChild(
        buildSvgEl({
          shapeType: node.attrs.shapeType,
          width: node.attrs.width,
          height: node.attrs.height,
          fill: node.attrs.fill,
          stroke: node.attrs.stroke,
          strokeWidth: node.attrs.strokeWidth,
        })
      );
      dom.appendChild(inner);

      dom.addEventListener("dblclick", (e) => {
        e.preventDefault();
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos == null) return;
        const order: MahinkShapeType[] = ["rect", "circle", "line", "arrow", "callout"];
        const i = order.indexOf(node.attrs.shapeType);
        const next = order[(i + 1) % order.length];
        editor.chain().focus().command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, shapeType: next });
          return true;
        }).run();
      });

      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== "mahinkShape") return false;
          inner.replaceChildren(
            buildSvgEl({
              shapeType: updated.attrs.shapeType,
              width: updated.attrs.width,
              height: updated.attrs.height,
              fill: updated.attrs.fill,
              stroke: updated.attrs.stroke,
              strokeWidth: updated.attrs.strokeWidth,
            })
          );
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertMahinkShape:
        (shapeType: MahinkShapeType = "rect") =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              shapeType,
              width: shapeType === "line" || shapeType === "arrow" ? 200 : 160,
              height: shapeType === "line" || shapeType === "arrow" ? 48 : 100,
              fill: "#c8d6e5",
              stroke: "#2c3e50",
              strokeWidth: 2,
            },
          }),
    };
  },
});

export default MahinkShape;
