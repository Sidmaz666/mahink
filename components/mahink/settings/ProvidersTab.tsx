"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Cpu, Download, KeyRound, Loader2, Plus, RefreshCw, Settings2, Trash2, XCircle } from "lucide-react";
import { getDefaultProfile, getProviderCatalogEntry, LOCAL_MODELS, PROVIDER_CATALOG, testProviderConnection } from "@/lib/providers";
import { setModelLoadingState } from "@/lib/modelLoadingStore";
import type { AiProviderProfile, AppData, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  notify: (msg: string, type?: "ok" | "err") => void;
  onUpdateAiSettings: (u: Partial<AppData["settings"]["ai"]>) => void;
  onAddAiProfile: (profile: AiProviderProfile) => void;
  onUpdateAiProfile: (id: string, updates: Partial<AiProviderProfile>) => void;
  onRemoveAiProfile: (id: string) => void;
}

export default function ProvidersTab({
  data,
  theme,
  notify,
  onUpdateAiSettings,
  onAddAiProfile,
  onUpdateAiProfile,
  onRemoveAiProfile,
}: Props) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [fetchingModelsId, setFetchingModelsId] = useState<string | null>(null);
  const [modelsCache, setModelsCache] = useState<Record<string, string[]>>({});
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [deleteCachedModelId, setDeleteCachedModelId] = useState<string | null>(null);
  const [cachedLocalModels, setCachedLocalModels] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("mahink-cached-local-models");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const activeProfileId = data.settings.ai.activeProviderId;
  const activeProfile = useMemo(
    () => data.aiProviderProfiles.find((profile) => profile.id === activeProfileId) ?? null,
    [data.aiProviderProfiles, activeProfileId],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>AI Controls</p>
            <p style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
              Your API keys stay in this browser only. AI stays disabled until an enabled provider has a key.
            </p>
          </div>
          <button
            onClick={() => onUpdateAiSettings({ enabled: !data.settings.ai.enabled })}
            style={{
              width: 52,
              height: 28,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: data.settings.ai.enabled ? theme.accent : theme.surfaceAlt,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 4,
                left: data.settings.ai.enabled ? 28 : 4,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.18s ease",
              }}
            />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="lbl">Active Provider</label>
            <select
              className="inp"
              value={activeProfileId ?? ""}
              onChange={(e) => onUpdateAiSettings({ activeProviderId: e.target.value || null })}
            >
              <option value="">Not configured</option>
              {data.aiProviderProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl">Default Scope</label>
            <select
              className="inp"
              value={data.settings.ai.defaultScope}
              onChange={(e) =>
                onUpdateAiSettings({
                  defaultScope: e.target.value as AppData["settings"]["ai"]["defaultScope"],
                })
              }
            >
              <option value="selection">Selection</option>
              <option value="chapter">Chapter</option>
              <option value="book">Book</option>
              <option value="research">Research</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {([
            ["streamResponses", "Stream responses"],
            ["showUsageInspector", "Show usage inspector"],
            ["autoSnapshotBeforeApply", "Snapshot before apply"],
            ["allowResearchTools", "Allow research mode"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              className="btn btn-ghost"
              onClick={() => onUpdateAiSettings({ [key]: !data.settings.ai[key] })}
              style={{
                justifyContent: "space-between",
                borderColor: data.settings.ai[key] ? theme.accent : theme.border,
                color: data.settings.ai[key] ? theme.accent : theme.textMuted,
              }}
            >
              <span>{label}</span>
              {data.settings.ai[key] ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            </button>
          ))}
        </div>

        <div>
          <label className="lbl">Global AI Instruction</label>
          <textarea
            className="ta"
            rows={4}
            value={data.settings.ai.systemPrompt}
            onChange={(e) => onUpdateAiSettings({ systemPrompt: e.target.value })}
            placeholder="Tell the assistant how to preserve your style, structure, and constraints."
          />
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Provider Profiles</p>
            <p style={{ fontSize: 12, color: theme.textMuted }}>
              Support OpenAI, Anthropic, Gemini, Groq, Together, Fireworks, Mistral, Cohere, DeepSeek, xAI,
              NVIDIA NIM, OpenRouter, LiteLLM, Ollama, and custom compatible APIs.
            </p>
          </div>
          <select
            className="inp"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              onAddAiProfile(getDefaultProfile(e.target.value as AiProviderProfile["provider"]));
              e.target.value = "";
            }}
            style={{ maxWidth: 240 }}
          >
            <option value="">Add provider profile…</option>
            {PROVIDER_CATALOG.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        {data.aiProviderProfiles.map((profile) => (
          <div key={profile.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `${theme.accent}16`,
                    display: "grid",
                    placeItems: "center",
                    color: theme.accent,
                  }}
                >
                  <Cpu size={16} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{profile.label}</p>
                  <p style={{ fontSize: 11, color: theme.textFaint }}>{profile.provider}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => onUpdateAiProfile(profile.id, { enabled: !profile.enabled })}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: profile.enabled ? theme.accent : theme.surfaceAlt,
                    position: "relative",
                    flexShrink: 0,
                  }}
                  title={profile.enabled ? "Enabled" : "Disabled"}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: profile.enabled ? 22 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.18s ease",
                    }}
                  />
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={testingId === profile.id}
                  onClick={async () => {
                    setTestingId(profile.id);
                    const result = await testProviderConnection(profile);
                    onUpdateAiProfile(profile.id, {
                      lastValidatedAt: Date.now(),
                      lastError: result.ok ? undefined : result.message,
                    });
                    notify(result.ok ? `Connected: ${profile.label}` : result.message, result.ok ? "ok" : "err");
                    setTestingId(null);
                  }}
                >
                  <KeyRound size={14} />
                  {testingId === profile.id ? "Testing…" : "Test"}
                </button>
                <div style={{ position: "relative" }}>
                  <button
                    className="btn btn-ghost"
                    disabled={data.aiProviderProfiles.length <= 1}
                    onClick={() => setDeleteConfirmId(deleteConfirmId === profile.id ? null : profile.id)}
                    style={{ borderColor: "transparent", color: theme.textMuted }}
                    title="Remove provider"
                  >
                    <Trash2 size={14} />
                  </button>
                  {deleteConfirmId === profile.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: 4,
                        padding: 12,
                        borderRadius: 10,
                        background: theme.surface,
                        border: `1px solid ${theme.border}`,
                        boxShadow: `0 4px 16px ${theme.shadow}`,
                        zIndex: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        minWidth: 200,
                      }}
                    >
                      <p style={{ fontSize: 12, color: theme.text, margin: 0 }}>
                        Remove this provider?
                      </p>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            onRemoveAiProfile(profile.id);
                            setDeleteConfirmId(null);
                            notify("Provider removed.");
                          }}
                          style={{ borderColor: "#e53e3e33", color: "#c53030" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="lbl">Display Name</label>
                <input
                  className="inp"
                  value={profile.label}
                  onChange={(e) => onUpdateAiProfile(profile.id, { label: e.target.value })}
                />
              </div>
              {profile.provider !== "local" && (
                <>
                  <div>
                    <label className="lbl">Base URL</label>
                    <input
                      className="inp"
                      value={profile.baseUrl || ""}
                      onChange={(e) => onUpdateAiProfile(profile.id, { baseUrl: e.target.value })}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                  <div>
                    <label className="lbl">API Key</label>
                    <input
                      className="inp"
                      type="password"
                      value={profile.apiKey}
                      onChange={(e) => onUpdateAiProfile(profile.id, { apiKey: e.target.value })}
                      placeholder="Stored in this browser only"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="lbl">Model</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {profile.provider === "local" ? (
                    <>
                      <select
                        className="inp"
                        value={profile.model}
                        onChange={(e) => onUpdateAiProfile(profile.id, { model: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        {LOCAL_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.size ? `${m.label} [${m.size}]` : m.label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-ghost"
                        disabled={!profile.model || downloadingModelId === profile.id}
                        onClick={async () => {
                          const modelId = profile.model;
                          if (!modelId) return;
                          setDownloadingModelId(profile.id);
                          setModelLoadingState({
                            active: true,
                            message: `Downloading model: ${modelId.split("/").pop()}`,
                            status: "Initializing…",
                          });
                          try {
                            const { pipeline } = await import("@huggingface/transformers");
                            await pipeline("text-generation", modelId, {
                              dtype: "q4",
                              progress_callback: (p: { status?: string; progress?: number; loaded?: number; total?: number; file?: string; name?: string }) => {
                                let prog = p.progress ?? (p.loaded != null && p.total != null && p.total > 0 ? p.loaded / p.total : undefined);
                                if (prog != null) {
                                  if (prog > 1) prog = 1;
                                  else if (prog < 0) prog = 0;
                                }
                                const phase = p.status === "ready" ? "Initializing session…" : p.status === "done" ? "File complete" : "Downloading…";
                                const file = p.file ?? p.name;
                                setModelLoadingState({
                                  active: true,
                                  message: `Downloading model: ${modelId.split("/").pop()}`,
                                  status: phase,
                                  progress: prog,
                                  file: file ? (typeof file === "string" ? file : String(file)) : undefined,
                                });
                              },
                            });
                            setCachedLocalModels((prev) => {
                              const next = [...new Set([...prev, modelId])];
                              if (typeof window !== "undefined") {
                                window.localStorage.setItem("mahink-cached-local-models", JSON.stringify(next));
                              }
                              return next;
                            });
                            notify(`Model ${modelId.split("/").pop()} downloaded and cached.`, "ok");
                          } catch (e) {
                            const msg = (e as Error).message;
                            const friendly = msg === "Aborted" || msg.includes("Aborted")
                              ? "Loading was interrupted. Try a smaller model or ensure WebGPU is available."
                              : msg;
                            notify(friendly, "err");
                          } finally {
                            setDownloadingModelId(null);
                            setModelLoadingState({ active: false });
                          }
                        }}
                        title="Download and cache model for offline use"
                      >
                        {downloadingModelId === profile.id ? (
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Download size={14} />
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                  <select
                    className="inp"
                    value={modelsCache[profile.id]?.includes(profile.model) ? profile.model : "__custom__"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== "__custom__") onUpdateAiProfile(profile.id, { model: v });
                    }}
                    style={{ flex: 1 }}
                  >
                    <option value="__custom__">Custom</option>
                    {[...new Set(modelsCache[profile.id] ?? [])].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-ghost"
                    disabled={!profile.apiKey?.trim() || fetchingModelsId === profile.id}
                    onClick={async () => {
                      setFetchingModelsId(profile.id);
                      try {
                        const entry = getProviderCatalogEntry(profile.provider);
                        const baseUrl = (profile.baseUrl || entry.baseUrl).replace(/\/$/, "");
                        const res = await fetch("/api/ai/models", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            provider: profile.provider,
                            baseUrl,
                            apiKey: profile.apiKey,
                          }),
                        });
                        const data = (await res.json()) as { models?: string[]; error?: string };
                        if (data.models?.length) {
                          setModelsCache((c) => ({ ...c, [profile.id]: [...new Set(data.models!)] }));
                          if (!profile.model && data.models[0])
                            onUpdateAiProfile(profile.id, { model: data.models[0] });
                        } else {
                          notify(data.error || "No models found", "err");
                        }
                      } catch (e) {
                        notify((e as Error).message, "err");
                      } finally {
                        setFetchingModelsId(null);
                      }
                    }}
                    title="Fetch available models"
                  >
                    {fetchingModelsId === profile.id ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                  </button>
                </>
                  )}
                </div>
                {profile.provider !== "local" && (modelsCache[profile.id]?.includes(profile.model) ? profile.model : "__custom__") === "__custom__" && (
                  <div style={{ marginTop: 12 }}>
                    <label className="lbl">Custom model ID</label>
                    <input
                      className="inp"
                      value={profile.model}
                      onChange={(e) => onUpdateAiProfile(profile.id, { model: e.target.value })}
                      placeholder="e.g. microsoft/phi-3.5-mini-instruct"
                    />
                  </div>
                )}
              </div>
            </div>

            {profile.provider === "local" && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: theme.surfaceAlt,
                  border: `1px solid ${theme.border}`,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: theme.text, margin: "0 0 8px 0" }}>
                  Cached models
                </p>
                {cachedLocalModels.length === 0 ? (
                  <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>
                    No models cached yet. Select a model and click Download to preload it.
                  </p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: theme.textMuted }}>
                    {cachedLocalModels.map((id) => (
                      <li key={id} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", position: "relative" }}>
                        <span style={{ flex: "1 1 200px", wordBreak: "break-all" }}>{id}</span>
                        <div style={{ display: "flex", gap: 6, position: "relative" }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "4px 8px", fontSize: 10, minHeight: "auto" }}
                            disabled={downloadingModelId === profile.id}
                            onClick={async () => {
                              setDownloadingModelId(profile.id);
                              setModelLoadingState({
                                active: true,
                                message: `Re-downloading: ${id.split("/").pop()}`,
                                status: "Initializing…",
                              });
                              try {
                                const { pipeline } = await import("@huggingface/transformers");
                                await pipeline("text-generation", id, {
                                  dtype: "q4",
                                  progress_callback: (p: { status?: string; progress?: number; loaded?: number; total?: number; file?: string; name?: string }) => {
                                    let prog = p.progress ?? (p.loaded != null && p.total != null && p.total > 0 ? p.loaded / p.total : undefined);
                                    if (prog != null) {
                                      if (prog > 1) prog = 1;
                                      else if (prog < 0) prog = 0;
                                    }
                                    const phase = p.status === "ready" ? "Initializing session…" : p.status === "done" ? "File complete" : "Downloading…";
                                    const file = p.file ?? p.name;
                                    setModelLoadingState({
                                      active: true,
                                      message: `Re-downloading: ${id.split("/").pop()}`,
                                      status: phase,
                                      progress: prog,
                                      file: file ? (typeof file === "string" ? file : String(file)) : undefined,
                                    });
                                  },
                                });
                                notify(`Model ${id.split("/").pop()} re-downloaded.`, "ok");
                              } catch (e) {
                                const msg = (e as Error).message;
                                const friendly = msg === "Aborted" || msg.includes("Aborted")
                                  ? "Loading was interrupted. Try a smaller model or ensure WebGPU is available."
                                  : msg;
                                notify(friendly, "err");
                              } finally {
                                setDownloadingModelId(null);
                                setModelLoadingState({ active: false });
                              }
                            }}
                            title="Re-download model"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "4px 8px", fontSize: 10, minHeight: "auto", borderColor: "#e53e3e33", color: "#c53030" }}
                            onClick={() => setDeleteCachedModelId(deleteCachedModelId === id ? null : id)}
                            title="Remove from list (does not clear browser cache)"
                          >
                            <Trash2 size={12} />
                          </button>
                          {deleteCachedModelId === id && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "100%",
                                marginTop: 4,
                                padding: 12,
                                borderRadius: 10,
                                background: theme.surface,
                                border: `1px solid ${theme.border}`,
                                boxShadow: `0 4px 16px ${theme.shadow}`,
                                zIndex: 20,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                minWidth: 220,
                              }}
                            >
                              <p style={{ fontSize: 12, color: theme.text, margin: 0 }}>
                                Remove <strong>{id.split("/").pop()}</strong> from cached list?
                              </p>
                              <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>
                                Browser cache is unchanged. You can re-download anytime.
                              </p>
                              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setDeleteCachedModelId(null)}>
                                  Cancel
                                </button>
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => {
                                    const next = cachedLocalModels.filter((m) => m !== id);
                                    setCachedLocalModels(next);
                                    if (typeof window !== "undefined") {
                                      window.localStorage.setItem("mahink-cached-local-models", JSON.stringify(next));
                                    }
                                    setDeleteCachedModelId(null);
                                    notify("Removed from cached list (browser cache unchanged).");
                                  }}
                                  style={{ borderColor: "#e53e3e33", color: "#c53030" }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {profile.provider === "custom" && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceAlt }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 10 }}>Custom Preset (full control)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label className="lbl">Request template (JSON)</label>
                    <textarea
                      className="ta"
                      rows={6}
                      value={profile.customPreset?.requestTemplate ?? '{"model":"{{model}}","messages":{{messages}},"max_tokens":{{max_tokens}},"temperature":{{temperature}}}'}
                      onChange={(e) =>
                        onUpdateAiProfile(profile.id, {
                          customPreset: {
                            ...profile.customPreset,
                            requestTemplate: e.target.value,
                            responsePath: profile.customPreset?.responsePath ?? "choices.0.message.content",
                            headersTemplate: profile.customPreset?.headersTemplate,
                          },
                        })
                      }
                      placeholder='{"model":"{{model}}","messages":{{messages}},...}'
                    />
                  </div>
                  <div>
                    <label className="lbl">Response path (extract text)</label>
                    <input
                      className="inp"
                      value={profile.customPreset?.responsePath ?? "choices.0.message.content"}
                      onChange={(e) =>
                        onUpdateAiProfile(profile.id, {
                          customPreset: {
                            ...profile.customPreset,
                            requestTemplate: profile.customPreset?.requestTemplate ?? "{}",
                            responsePath: e.target.value,
                            headersTemplate: profile.customPreset?.headersTemplate,
                          },
                        })
                      }
                      placeholder="choices.0.message.content"
                    />
                  </div>
                  <div>
                    <label className="lbl">Custom headers (optional JSON)</label>
                    <input
                      className="inp"
                      value={profile.customPreset?.headersTemplate ?? ""}
                      onChange={(e) =>
                        onUpdateAiProfile(profile.id, {
                          customPreset: {
                            ...profile.customPreset,
                            requestTemplate: profile.customPreset?.requestTemplate ?? "{}",
                            responsePath: profile.customPreset?.responsePath ?? "choices.0.message.content",
                            headersTemplate: e.target.value || undefined,
                          },
                        })
                      }
                      placeholder='{"X-Custom-Header":"value"}'
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: theme.surfaceAlt }}>
              <p style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.65 }}>
                Model IDs are provider-specific. Use provider or gateway docs for routed IDs (e.g. openai/gpt-4.1 on
                OpenRouter). Keys remain in this browser only and are used only when you explicitly invoke AI actions.
              </p>
            </div>

            {profile.lastValidatedAt && (
              <p style={{ fontSize: 11, color: profile.lastError ? "#e53e3e" : theme.textFaint, marginTop: 10 }}>
                {profile.lastError
                  ? `Last connection test failed: ${profile.lastError}`
                  : `Last connection test passed at ${new Date(profile.lastValidatedAt).toLocaleString()}`}
              </p>
            )}
          </div>
        ))}

        {!data.aiProviderProfiles.length && (
          <button
            className="btn btn-surf"
            onClick={() => onAddAiProfile(getDefaultProfile("openai"))}
            style={{ justifyContent: "center" }}
          >
            <Plus size={15} />
            Add your first provider
          </button>
        )}
      </div>

      {activeProfile && (
        <div style={{ padding: "14px 16px", borderRadius: 12, background: theme.surfaceAlt }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 6 }}>Active Profile Summary</p>
          <p style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.7 }}>
            {activeProfile.label} is {activeProfile.enabled ? "enabled" : "disabled"} using model{" "}
            <strong>{activeProfile.model || "none"}</strong>. The key stays in browser storage and
            will only be used when the user explicitly invokes AI actions.
          </p>
        </div>
      )}
    </div>
  );
}
