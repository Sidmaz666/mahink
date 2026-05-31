"use client";

import { useEffect, useState } from "react";
import {
  getModelLoadingState,
  subscribeModelLoading,
  type ModelLoadingState,
} from "@/lib/modelLoadingStore";

export default function ModelLoadingOverlay() {
  const [state, setState] = useState<ModelLoadingState>(getModelLoadingState());

  useEffect(() => {
    setState(getModelLoadingState());
    return subscribeModelLoading(setState);
  }, []);

  if (!state.active) return null;

  const progress = state.progress != null ? Math.min(100, Math.round(state.progress * 100)) : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #1e1e1e 0%, #171717 100%)",
          borderRadius: 20,
          padding: "36px 44px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
        <p
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "#f8fafc",
            margin: 0,
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          {state.message || "Loading model…"}
        </p>
        {state.status && (
          <p
            style={{
              fontSize: 13,
              color: "#94a3b8",
              margin: 0,
              marginBottom: state.file ? 6 : 12,
              fontWeight: 500,
            }}
          >
            {state.status}
          </p>
        )}
        {state.file && (
          <p
            style={{
              fontSize: 11,
              color: "#64748b",
              margin: 0,
              marginBottom: 16,
              fontFamily: "ui-monospace, monospace",
              wordBreak: "break-all",
              padding: "6px 10px",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 8,
            }}
          >
            {state.file}
          </p>
        )}
        {progress != null && (
          <div style={{ marginTop: state.file ? 0 : 4 }}>
            <div
              style={{
                height: 8,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                  borderRadius: 4,
                  transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 0 12px rgba(59,130,246,0.4)",
                }}
              />
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#64748b",
                marginTop: 8,
                margin: 0,
                fontWeight: 600,
              }}
            >
              {progress}%
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
