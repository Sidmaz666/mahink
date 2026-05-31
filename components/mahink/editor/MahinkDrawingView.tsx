"use client";

import { useCallback, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function MahinkDrawingView(props: NodeViewProps) {
  const { node, updateAttributes } = props;
  const [initialSnapshot] = useState<unknown | undefined>(() => {
    const raw = node.attrs.data as string;
    if (!raw || typeof raw !== "string") return undefined;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  });

  const onSave = useCallback(
    (json: string) => {
      updateAttributes({ data: json });
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper className="mahink-drawing-root">
      <div
        style={{
          height: 320,
          width: "100%",
          maxWidth: 720,
          margin: "16px auto",
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--brd, rgba(128,128,128,0.35))",
          background: "var(--surf, #fff)",
        }}
        data-drag-handle=""
      >
        <Tldraw
          snapshot={initialSnapshot as never}
          hideUi={false}
          onMount={(editor) => {
            const id = setInterval(() => {
              try {
                onSave(JSON.stringify(editor.getSnapshot()));
              } catch {
                /* ignore */
              }
            }, 2200);
            return () => clearInterval(id);
          }}
        />
      </div>
      <p
        style={{
          fontSize: 11,
          color: "var(--txt-m, #888)",
          textAlign: "center",
          margin: "4px 0 12px",
        }}
      >
        Drawing syncs to your chapter every few seconds.
      </p>
    </NodeViewWrapper>
  );
}
