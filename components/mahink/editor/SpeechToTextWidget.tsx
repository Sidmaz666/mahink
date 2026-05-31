"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import type { Editor } from "@tiptap/react";
import type { Theme } from "@/lib/types";
import { setModelLoadingState } from "@/lib/modelLoadingStore";

const WHISPER_MODEL = "Xenova/whisper-tiny.en";
const CHUNK_DURATION_MS = 4000;

interface Props {
  theme: Theme;
  editor: Editor | null;
  onClose: () => void;
}

export default function SpeechToTextWidget({ theme, editor, onClose }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [mode, setMode] = useState<"browser" | "whisper" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriberRef = useRef<((audio: string) => Promise<{ text?: string }>) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const processingRef = useRef(false);

  const insertText = useCallback(
    (text: string) => {
      if (!editor || !text.trim()) return;
      editor.chain().focus().insertContent(text + " ").run();
    },
    [editor]
  );

  const processChunkWithWhisper = useCallback(
    async (blob: Blob) => {
      const transcriber = transcriberRef.current;
      if (!transcriber || processingRef.current) return;
      const url = URL.createObjectURL(blob);
      try {
        processingRef.current = true;
        const result = await transcriber(url);
        const text = (result?.text ?? "").trim();
        if (text) {
          setTranscript((prev) => prev + " " + text);
          insertText(text);
        }
      } catch (e) {
        console.warn("Whisper chunk error:", e);
      } finally {
        URL.revokeObjectURL(url);
        processingRef.current = false;
      }
    },
    [insertText]
  );

  const loadWhisperModel = useCallback(async () => {
    if (transcriberRef.current) return transcriberRef.current;
    setModelLoadingState({
      active: true,
      message: "Loading Whisper speech model…",
      status: "Downloading and initializing…",
    });
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const transcriber = await pipeline("automatic-speech-recognition", WHISPER_MODEL, {
        progress_callback: (p: { status?: string; progress?: number; loaded?: number; total?: number }) => {
          const prog =
            p.progress ?? (p.loaded != null && p.total != null && p.total > 0 ? p.loaded / p.total : undefined);
          setModelLoadingState({
            active: true,
            message: "Loading Whisper speech model…",
            status: p.status ?? "Loading…",
            progress: prog,
          });
        },
      });
      transcriberRef.current = transcriber as (url: string) => Promise<{ text?: string }>;
      return transcriber;
    } finally {
      setModelLoadingState({ active: false });
    }
  }, []);

  useEffect(() => {
    if (!isRecording) return;

    const SpeechRecognitionAPI =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition);

    if (SpeechRecognitionAPI) {
      setMode("browser");
      setError(null);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) final += text;
        }
        if (final) {
          setTranscript((prev) => prev + final);
          insertText(final);
        }
      };

      recognition.addEventListener("error", (ev: Event) => {
        const err = (ev as SpeechRecognitionErrorEvent).error;
        if (err === "not-allowed" || err === "service-not-allowed" || err === "network") {
          setError("Browser speech failed. Use Whisper instead.");
          recognition.stop();
          setMode(null);
        }
      });

      recognition.start();
      recognitionRef.current = recognition;

      return () => {
        recognition.stop();
        recognitionRef.current = null;
      };
    }

    setMode("whisper");
    setError(null);
    let cancelled = false;

    void (async () => {
      try {
        const transcriber = await loadWhisperModel();
        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && transcriberRef.current) {
            const blob = new Blob([e.data], { type: e.data.type });
            await processChunkWithWhisper(blob);
          }
        };

        mediaRecorder.start(CHUNK_DURATION_MS);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Failed to start Whisper");
      }
    })();

    return () => {
      cancelled = true;
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isRecording, insertText, loadWhisperModel, processChunkWithWhisper]);

  useEffect(() => {
    if (isRecording && mode === "browser") {
      const stream = streamRef.current;
      if (!stream) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
          streamRef.current = s;
        });
      }
    }
  }, [isRecording, mode]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording || mode !== "browser") return;
    let cancelled = false;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const cctx = canvas.getContext("2d");
      if (!cctx) return;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const w = canvas.width;
      const h = canvas.height;
      const barCount = 24;
      const barW = w / barCount;
      const surfAlt = theme.surfaceAlt;
      const acc = theme.accent;

      const draw = () => {
        if (cancelled) return;
        analyser.getByteFrequencyData(data);
        cctx.fillStyle = surfAlt;
        cctx.fillRect(0, 0, w, h);
        for (let i = 0; i < barCount; i++) {
          const v = data[Math.floor((i / barCount) * data.length)] || 0;
          const barH = (v / 255) * (h * 0.8);
          cctx.fillStyle = acc;
          cctx.fillRect(i * barW + 2, h - barH, barW - 2, barH);
        }
        animationRef.current = requestAnimationFrame(draw);
      };
      draw();

      return () => {
        stream.getTracks().forEach((t) => t.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isRecording, mode, theme.surfaceAlt, theme.accent]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setMode(null);
      setError(null);
    } else {
      setTranscript("");
      setElapsed(0);
      setError(null);
      setIsRecording(true);
    }
  };

  const handleUseWhisper = () => {
    setError(null);
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setTranscript("");
    setElapsed(0);
    setMode("whisper");
    void (async () => {
      try {
        await loadWhisperModel();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && transcriberRef.current) {
            await processChunkWithWhisper(new Blob([e.data], { type: e.data.type }));
          }
        };
        mediaRecorder.start(CHUNK_DURATION_MS);
      } catch (e) {
        setError((e as Error).message || "Failed to start Whisper");
      }
    })();
  };

  const handleDone = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
    onClose();
  };

  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;
  const timeStr = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "100%",
        right: 0,
        marginBottom: 8,
        padding: 12,
        borderRadius: 12,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 4px 20px ${theme.shadow}`,
        minWidth: 220,
        zIndex: 60,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>Voice input</span>
        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: theme.textMuted }}>{timeStr}</span>
      </div>
      {mode && (
        <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>
          {mode === "browser" ? "Using browser speech" : "Using Whisper (local)"}
        </p>
      )}
      {error && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: "#e53e3e", marginBottom: 6 }}>{error}</p>
          <button
            type="button"
            onClick={handleUseWhisper}
            style={{
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 6,
              border: "none",
              background: theme.accent,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Use Whisper instead
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={200}
        height={36}
        style={{
          width: "100%",
          height: 36,
          borderRadius: 6,
          background: theme.surfaceAlt,
          marginBottom: 10,
          display: mode === "browser" ? "block" : "none",
        }}
      />
      {mode === "whisper" && isRecording && (
        <div
          style={{
            height: 36,
            borderRadius: 6,
            background: theme.surfaceAlt,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e53e3e", animation: "pulse 1s infinite" }} />
          <span style={{ fontSize: 11, color: theme.textMuted }}>Listening… transcribing every {CHUNK_DURATION_MS / 1000}s</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={toggleRecording}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            background: isRecording ? "#e53e3e" : theme.accent,
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {isRecording ? <Square size={14} /> : <Mic size={14} />}
          {isRecording ? "Stop" : "Record"}
        </button>
        <button
          type="button"
          onClick={handleDone}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: "transparent",
            color: theme.text,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Done
        </button>
      </div>
      {transcript && (
        <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 8, maxHeight: 60, overflow: "auto" }}>
          {transcript.slice(-200)}
        </p>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
