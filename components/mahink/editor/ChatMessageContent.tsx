"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Theme } from "@/lib/types";

interface Props {
  content: string;
  theme: Theme;
}

const THINKING_REGEX = /<think>([\s\S]*?)<\/think>/gi;

function ThinkingBlock({ content, theme }: { content: string; theme: Theme }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        marginTop: 8,
        marginBottom: 8,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        overflow: "hidden",
        background: theme.surfaceAlt,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: 11,
          fontWeight: 600,
          color: theme.textMuted,
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          textAlign: "left",
        }}
      >
        <span style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
        Thinking {expanded ? "−" : "+"}
      </button>
      {expanded && (
        <div
          style={{
            padding: "8px 12px 12px",
            fontSize: 12,
            color: theme.textMuted,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          {content.trim()}
        </div>
      )}
    </div>
  );
}

export default function ChatMessageContent({ content, theme }: Props) {
  const parts: { type: "think" | "text"; content: string }[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(THINKING_REGEX.source, "gi");
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, m.index) });
    }
    parts.push({ type: "think", content: m[1] ?? "" });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content });
  }

  const baseStyle: React.CSSProperties = {
    fontSize: 12,
    color: theme.text,
    lineHeight: 1.6,
  };

  return (
    <div style={baseStyle}>
      {parts.map((part, i) => {
        if (part.type === "think") {
          return <ThinkingBlock key={i} content={part.content} theme={theme} />;
        }
        return (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
              ul: ({ children }) => <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: "0 0 8px", paddingLeft: 20 }}>{children}</ol>,
              li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
              code: ({ className, children }) => {
                const isBlock = className?.startsWith("language-");
                if (isBlock) {
                  return (
                    <pre
                      style={{
                        margin: "8px 0",
                        padding: 12,
                        borderRadius: 8,
                        overflow: "auto",
                        background: theme.surfaceAlt,
                        border: `1px solid ${theme.border}`,
                        fontSize: 11,
                        fontFamily: "monospace",
                      }}
                    >
                      <code>{String(children)}</code>
                    </pre>
                  );
                }
                return (
                  <code
                    style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: theme.surfaceAlt,
                      border: `1px solid ${theme.border}`,
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                  >
                    {children}
                  </code>
                );
              },
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    margin: "8px 0",
                    paddingLeft: 12,
                    borderLeft: `3px solid ${theme.accent}`,
                    color: theme.textMuted,
                  }}
                >
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: theme.accent, textDecoration: "underline" }}
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
              em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
              h1: ({ children }) => <h1 style={{ fontSize: 16, fontWeight: 700, margin: "12px 0 8px" }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ fontSize: 14, fontWeight: 700, margin: "10px 0 6px" }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, margin: "8px 0 4px" }}>{children}</h3>,
            }}
          >
            {part.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
