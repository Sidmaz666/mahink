import type {
  AiImagePart,
  AiMessage,
  AiProviderCapabilities,
  AiProviderProfile,
  ProviderId,
} from "./types";
import { estimateTokens } from "./utils";
import { setModelLoadingState } from "./modelLoadingStore";

export interface ProviderCatalogEntry {
  id: ProviderId;
  label: string;
  description: string;
  website: string;
  baseUrl: string;
  defaultModel: string;
  capabilities: AiProviderCapabilities;
  protocol: "openai" | "anthropic" | "google" | "cohere";
}

export interface ProviderChatResult {
  text: string;
  reasoningText?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  finishReason?: string;
  raw?: unknown;
  tool_calls?: OpenAiToolCall[];
}

export interface OpenAiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ProviderChatRequest {
  profile: AiProviderProfile;
  model: string;
  messages: Array<{ role: AiMessage["role"] | "tool"; content?: string; tool_call_id?: string; tool_calls?: OpenAiToolCall[] }>;
  imageParts?: AiImagePart[];
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunk: string, type?: "content" | "reasoning") => void;
  signal?: AbortSignal;
  tools?: Array<{ type: "function"; function: { name: string; description: string; parameters: object } }>;
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
}

const commonCapabilities: AiProviderCapabilities = {
  chat: true,
  streaming: false,
  tools: false,
  json: true,
  image: false,
  embeddings: false,
  costReporting: true,
  customBaseUrl: true,
  browserSafe: true,
};

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "openai",
    label: "OpenAI",
    description: "Direct OpenAI API access for chat, rewriting, and book generation.",
    website: "https://openai.com/api/",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1-mini",
    capabilities: { ...commonCapabilities, streaming: true, tools: true, image: true, embeddings: true },
    protocol: "openai",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    description: "Claude models for writing, critique, and long-form revision.",
    website: "https://anthropic.com/api",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-7-sonnet-latest",
    capabilities: { ...commonCapabilities, streaming: true, tools: true, image: true },
    protocol: "anthropic",
  },
  {
    id: "google",
    label: "Google Gemini",
    description: "Gemini models for drafting, analysis, and multimodal workflows.",
    website: "https://ai.google.dev/",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.0-flash",
    capabilities: { ...commonCapabilities, image: true, tools: true },
    protocol: "google",
  },
  {
    id: "groq",
    label: "Groq",
    description: "Very low-latency inference using Groq-hosted models.",
    website: "https://groq.com/",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "together",
    label: "Together AI",
    description: "Open-source and hosted model access via an OpenAI-compatible API.",
    website: "https://www.together.ai/",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "fireworks",
    label: "Fireworks AI",
    description: "Hosted inference and routing for open-source frontier models.",
    website: "https://fireworks.ai/",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    defaultModel: "accounts/fireworks/models/llama-v3p1-70b-instruct",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "mistral",
    label: "Mistral",
    description: "Mistral-hosted models for writing and reasoning tasks.",
    website: "https://mistral.ai/",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "cohere",
    label: "Cohere",
    description: "Cohere chat models with strong enterprise-facing APIs.",
    website: "https://cohere.com/",
    baseUrl: "https://api.cohere.com/v2",
    defaultModel: "command-r-plus",
    capabilities: { ...commonCapabilities, streaming: true },
    protocol: "cohere",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    description: "DeepSeek-hosted reasoning and generation models.",
    website: "https://platform.deepseek.com/",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "xai",
    label: "xAI",
    description: "xAI Grok models exposed through an OpenAI-style API.",
    website: "https://x.ai/",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-3-mini",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    description: "NVIDIA-hosted model APIs and NIM-compatible endpoints.",
    website: "https://build.nvidia.com/",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "meta/llama-3.1-70b-instruct",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Route requests across many providers with one API key.",
    website: "https://openrouter.ai/",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4.1-mini",
    capabilities: { ...commonCapabilities, tools: true, image: true },
    protocol: "openai",
  },
  {
    id: "litellm",
    label: "LiteLLM",
    description: "Bring your own LiteLLM gateway for unified routing and fallbacks.",
    website: "https://docs.litellm.ai/",
    baseUrl: "http://localhost:4000/v1",
    defaultModel: "gpt-4.1-mini",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "ollama",
    label: "Ollama",
    description: "Local Ollama server for offline or self-hosted workflows.",
    website: "https://ollama.com/",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "local",
    label: "Local",
    description: "Run models in the browser with Transformers.js. No API key needed.",
    website: "https://huggingface.co/docs/transformers.js",
    baseUrl: "",
    defaultModel: "onnx-community/Qwen2.5-Coder-0.5B-Instruct",
    capabilities: { ...commonCapabilities, browserSafe: true, streaming: true, tools: true },
    protocol: "openai",
  },
  {
    id: "custom",
    label: "Custom Compatible API",
    description: "Custom endpoint for OpenAI-compatible or gateway-compatible APIs.",
    website: "https://example.com/",
    baseUrl: "https://example.com/v1",
    defaultModel: "custom-model",
    capabilities: { ...commonCapabilities, streaming: true, tools: true },
    protocol: "openai",
  },
];

/** Browser-compatible models for Local provider (Transformers.js) */
export const LOCAL_MODELS: Array<{ id: string; label: string; size?: string }> = [
  // Qwen
  { id: "onnx-community/Qwen2.5-Coder-0.5B-Instruct", label: "Qwen2.5 0.5B Instruct", size: "~400MB" },
  { id: "onnx-community/Qwen2.5-0.5B-Instruct", label: "Qwen2.5 0.5B (alt)", size: "~400MB" },
  { id: "onnx-community/Qwen2.5-1.5B-Instruct", label: "Qwen2.5 1.5B Instruct", size: "~1GB" },
  // Llama
  { id: "onnx-community/Llama-3.2-1B-Instruct", label: "Llama 3.2 1B", size: "~740MB" },
  { id: "onnx-community/Llama-3.2-3B-Instruct", label: "Llama 3.2 3B", size: "~2GB" },
  { id: "onnx-community/Llama-3.2-1B-Instruct-ONNX", label: "Llama 3.2 1B (ONNX)", size: "~740MB" },
  { id: "onnx-community/Llama-3.2-3B-Instruct-ONNX", label: "Llama 3.2 3B (ONNX)", size: "~2GB" },
  // Mistral / Hermes
  { id: "onnx-community/Mistral-7B-Instruct-v0.3", label: "Mistral 7B (quantized)", size: "~4.3GB" },
  // Gemma
  { id: "onnx-community/gemma-2-2b-it", label: "Gemma 2 2B", size: "~1.5GB" },
  { id: "onnx-community/gemma-3-270m-it-ONNX", label: "Gemma 3 270M", size: "~200MB" },
  { id: "onnx-community/gemma-3-1b-it-ONNX", label: "Gemma 3 1B", size: "~740MB" },
  // Phi
  { id: "Xenova/phi-2", label: "Phi-2", size: "~1.5GB" },
  { id: "onnx-community/Phi-3.5-mini-instruct-onnx-web", label: "Phi-3.5 Mini", size: "~2.4GB" },
  // SmolLM
  { id: "onnx-community/SmolLM2-135M-Instruct", label: "SmolLM2 135M", size: "~100MB" },
  { id: "onnx-community/SmolLM2-360M-Instruct", label: "SmolLM2 360M", size: "~300MB" },
  { id: "onnx-community/SmolLM2-1.7B-Instruct", label: "SmolLM2 1.7B", size: "~1.2GB" },
  // Other
  { id: "Xenova/LaMini-Flan-T5-783M", label: "LaMini-Flan-T5 783M", size: "~600MB" },
  { id: "Xenova/distilgpt2", label: "DistilGPT-2", size: "~350MB" },
];

export function getProviderCatalogEntry(provider: ProviderId): ProviderCatalogEntry {
  return PROVIDER_CATALOG.find((entry) => entry.id === provider) ?? PROVIDER_CATALOG[0];
}

export function getDefaultProfile(provider: ProviderId): AiProviderProfile {
  const entry = getProviderCatalogEntry(provider);
  return {
    id: `${provider}-${Date.now()}`,
    provider,
    label: entry.label,
    apiKey: "",
    baseUrl: provider === "local" ? undefined : entry.baseUrl,
    enabled: false,
    model: entry.defaultModel,
    temperature: 0.7,
    topP: 1,
    maxTokens: 4000,
    reasoningEffort: "medium",
    capabilities: entry.capabilities,
  };
}

export function estimateCostUsd(provider: ProviderId, totalTokens: number): number {
  const perMillion = provider === "openai" ? 2.5 : provider === "anthropic" ? 3 : 1;
  return Number(((totalTokens / 1_000_000) * perMillion).toFixed(4));
}

function resolveBaseUrl(profile: AiProviderProfile): string {
  const catalog = getProviderCatalogEntry(profile.provider);
  return (profile.baseUrl || catalog.baseUrl).replace(/\/$/, "");
}

/** Build provider-agnostic extra body for reasoning/thinking. */
function buildExtraBodyForStreaming(
  provider: string,
  model: string,
  stream: boolean | undefined
): Record<string, unknown> | undefined {
  if (!stream) return undefined;
  switch (provider) {
    case "nvidia":
      return { chat_template_kwargs: { enable_thinking: true, clear_thinking: false } };
    default:
      return undefined;
  }
}

/** All external AI requests go through our proxy to avoid CORS. */
async function fetchViaProxy(
  protocol: "openai" | "anthropic" | "google" | "cohere",
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content?: string | unknown[]; tool_call_id?: string; tool_calls?: unknown[] }>,
  opts: {
    imageParts?: AiImagePart[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    topP?: number;
    reasoningEffort?: string;
    supportsImage?: boolean;
    signal?: AbortSignal;
    tools?: unknown[];
    tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
    extraBody?: Record<string, unknown>;
  }
): Promise<Response> {
  const body: Record<string, unknown> = {
    protocol,
    baseUrl,
    apiKey,
    model,
    messages,
    imageParts: opts.imageParts,
    temperature: opts.temperature ?? 0.7,
    maxTokens: opts.maxTokens ?? 4000,
    stream: opts.stream ?? false,
    topP: opts.topP ?? 1,
    reasoningEffort: opts.reasoningEffort ?? "medium",
    supportsImage: opts.supportsImage ?? false,
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = opts.tool_choice ?? "auto";
  }
  if (opts.extraBody && typeof opts.extraBody === "object") {
    body.extraBody = opts.extraBody;
  }
  return fetch("/api/ai/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
}

function buildOpenAiContent(
  text: string,
  imageParts?: AiImagePart[],
  supportsImage?: boolean,
): string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> {
  if (!imageParts?.length || !supportsImage) {
    return text;
  }
  const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
  if (text) parts.push({ type: "text", text });
  for (const img of imageParts) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    });
  }
  return parts;
}

async function runOpenAiCompatibleChat(request: ProviderChatRequest): Promise<ProviderChatResult> {
  const baseUrl = resolveBaseUrl(request.profile);
  const supportsImage = request.profile.capabilities?.image ?? false;
  const hasTools = (request.tools?.length ?? 0) > 0;
  type ProxyMsg = { role: string; content?: string | unknown[]; tool_call_id?: string; tool_calls?: unknown[] };
  const messages: ProxyMsg[] = request.messages.map((message, i) => {
    if (message.role === "tool") {
      return {
        role: "tool",
        content: message.content ?? "",
        tool_call_id: (message as { tool_call_id?: string }).tool_call_id ?? "",
      };
    }
    const msg = message as { role: string; content?: string; tool_calls?: OpenAiToolCall[] };
    const isLastUser = i === request.messages.length - 1 && msg.role === "user";
    const content = isLastUser && request.imageParts?.length
      ? buildOpenAiContent(msg.content ?? "", request.imageParts, supportsImage)
      : msg.content ?? "";
    const out: ProxyMsg = { role: msg.role, content };
    if (msg.tool_calls?.length) out.tool_calls = msg.tool_calls;
    return out;
  });
  const useStream = Boolean(!hasTools && request.onChunk && (request.profile.capabilities?.streaming ?? false));
  const extraBody = buildExtraBodyForStreaming(request.profile.provider, request.model, useStream);
  const res = await fetchViaProxy("openai", baseUrl, request.profile.apiKey, request.model, messages, {
    imageParts: request.imageParts,
    temperature: request.temperature ?? request.profile.temperature,
    maxTokens: request.maxTokens ?? request.profile.maxTokens,
    stream: useStream,
    topP: request.profile.topP,
    reasoningEffort: request.profile.reasoningEffort,
    supportsImage: request.profile.capabilities?.image ?? false,
    signal: request.signal,
    tools: request.tools,
    tool_choice: request.tool_choice,
    extraBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  if (useStream && res.body) {
    let text = "";
    let reasoningText = "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      if (request.signal?.aborted) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta;
            const reasoning = delta?.reasoning_content;
            const content = delta?.content;
            if (reasoning) {
              text += reasoning;
              reasoningText += reasoning;
              request.onChunk?.(reasoning, "reasoning");
            }
            if (content) {
              text += content;
              request.onChunk?.(content, "content");
            }
          } catch {
            // skip parse errors
          }
        }
      }
    }
    const promptTokens = estimateTokens(JSON.stringify(request.messages));
    const completionTokens = estimateTokens(text);
    return {
      text,
      reasoningText: reasoningText || undefined,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      finishReason: "stop",
      raw: {},
    };
  }

  const json = await res.json();
  const choice = json.choices?.[0];
  const msg = choice?.message ?? {};
  const text = typeof msg.content === "string" ? msg.content : "";
  const toolCalls = msg.tool_calls as OpenAiToolCall[] | undefined;
  const promptTokens = json.usage?.prompt_tokens ?? estimateTokens(JSON.stringify(request.messages));
  const completionTokens = json.usage?.completion_tokens ?? estimateTokens(text);
  return {
    text,
    promptTokens,
    completionTokens,
    totalTokens: json.usage?.total_tokens ?? promptTokens + completionTokens,
    finishReason: choice?.finish_reason,
    raw: json,
    tool_calls: Array.isArray(toolCalls) && toolCalls.length > 0 ? toolCalls : undefined,
  };
}

function buildAnthropicContent(
  text: string,
  imageParts?: AiImagePart[],
  supportsImage?: boolean,
): Array<{ type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: string; data: string } }> {
  const parts: Array<{ type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  if (text) parts.push({ type: "text", text });
  if (supportsImage && imageParts?.length) {
    for (const img of imageParts) {
      parts.push({
        type: "image",
        source: { type: "base64", media_type: img.mimeType, data: img.base64 },
      });
    }
  }
  return parts;
}

async function runAnthropicChat(request: ProviderChatRequest): Promise<ProviderChatResult> {
  const baseUrl = resolveBaseUrl(request.profile);
  const supportsImage = request.profile.capabilities?.image ?? false;
  const useStream = request.onChunk && (request.profile.capabilities?.streaming ?? false);
  const res = await fetchViaProxy("anthropic", baseUrl, request.profile.apiKey, request.model, request.messages, {
    imageParts: request.imageParts,
    temperature: request.temperature ?? request.profile.temperature,
    maxTokens: request.maxTokens ?? request.profile.maxTokens,
    stream: useStream,
    supportsImage: request.profile.capabilities?.image ?? false,
    signal: request.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  if (useStream && res.body) {
    let text = "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      if (request.signal?.aborted) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]" || data === "[done]") continue;
          try {
            const json = JSON.parse(data);
            if (json.type === "content_block_delta" && json.delta?.type === "text_delta" && json.delta?.text) {
              text += json.delta.text;
              request.onChunk?.(json.delta.text);
            }
          } catch {
            // skip parse errors
          }
        }
      }
    }
    const promptTokens = estimateTokens(JSON.stringify(request.messages));
    const completionTokens = estimateTokens(text);
    return {
      text,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      finishReason: "end_turn",
      raw: {},
    };
  }

  const json = await res.json();
  const text = json.content?.map((part: { text?: string }) => part.text ?? "").join("\n") ?? "";
  const promptTokens = json.usage?.input_tokens ?? estimateTokens(JSON.stringify(request.messages));
  const completionTokens = json.usage?.output_tokens ?? estimateTokens(text);
  return {
    text,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    finishReason: json.stop_reason,
    raw: json,
  };
}

async function runLocalProviderChat(request: ProviderChatRequest): Promise<ProviderChatResult> {
  const modelId = request.model || getProviderCatalogEntry("local").defaultModel;
  setModelLoadingState({
    active: true,
    message: `Loading AI model: ${modelId.split("/").pop()}`,
    status: "Downloading and initializing…",
  });
  try {
    const { pipeline } = await import("@huggingface/transformers");
    const generator = await pipeline("text-generation", modelId, {
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
          message: `Loading AI model: ${modelId.split("/").pop()}`,
          status: phase,
          progress: prog,
          file: file ? (typeof file === "string" ? file : String(file)) : undefined,
        });
      },
    });

    const messages = request.messages;
    const prompt = messages
    .map((m) => {
      if (m.role === "system") return `System: ${m.content}`;
      if (m.role === "user") return `User: ${m.content}`;
      return `Assistant: ${m.content}`;
    })
    .join("\n\n") + "\n\nAssistant: ";

    const result = await generator(prompt, {
      max_new_tokens: request.maxTokens ?? 512,
      temperature: request.temperature ?? 0.7,
      do_sample: true,
    });

    const text = (result?.[0] as { generated_text?: string })?.generated_text?.replace(prompt, "").trim() ?? "";
    const promptTokens = estimateTokens(JSON.stringify(request.messages));
    const completionTokens = estimateTokens(text);
    return {
      text,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      finishReason: "stop",
      raw: {},
    };
  } finally {
    setModelLoadingState({ active: false });
  }
}

async function runGoogleChat(request: ProviderChatRequest): Promise<ProviderChatResult> {
  const baseUrl = resolveBaseUrl(request.profile);
  const res = await fetchViaProxy("google", baseUrl, request.profile.apiKey, request.model, request.messages, {
    imageParts: request.imageParts,
    temperature: request.temperature ?? request.profile.temperature,
    maxTokens: request.maxTokens ?? request.profile.maxTokens,
    topP: request.profile.topP,
    supportsImage: request.profile.capabilities?.image ?? false,
    signal: request.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  const json = await res.json();
  const text =
    json.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("\n") ?? "";
  const promptTokens = json.usageMetadata?.promptTokenCount ?? estimateTokens(JSON.stringify(request.messages));
  const completionTokens = json.usageMetadata?.candidatesTokenCount ?? estimateTokens(text);
  return {
    text,
    promptTokens,
    completionTokens,
    totalTokens: json.usageMetadata?.totalTokenCount ?? promptTokens + completionTokens,
    finishReason: json.candidates?.[0]?.finishReason,
    raw: json,
  };
}

async function runCohereChat(request: ProviderChatRequest): Promise<ProviderChatResult> {
  const baseUrl = resolveBaseUrl(request.profile);
  const res = await fetchViaProxy("cohere", baseUrl, request.profile.apiKey, request.model, request.messages, {
    temperature: request.temperature ?? request.profile.temperature,
    maxTokens: request.maxTokens ?? request.profile.maxTokens,
    signal: request.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  const json = await res.json();
  const text = json.message?.content?.map((part: { text?: string }) => part.text ?? "").join("\n") ?? "";
  const promptTokens = json.usage?.tokens?.input_tokens ?? estimateTokens(JSON.stringify(request.messages));
  const completionTokens = json.usage?.tokens?.output_tokens ?? estimateTokens(text);
  return {
    text,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    finishReason: json.finish_reason,
    raw: json,
  };
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(/[.[\]]/).filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    const key = /^\d+$/.test(p) ? parseInt(p, 10) : p;
    cur = (cur as Record<string, unknown>)[key as string];
  }
  return cur;
}

async function runCustomProviderChat(request: ProviderChatRequest): Promise<ProviderChatResult> {
  const preset = request.profile.customPreset;
  if (!preset?.requestTemplate || !preset?.responsePath) {
    return runOpenAiCompatibleChat(request);
  }

  const baseUrl = resolveBaseUrl(request.profile);
  const template = preset.requestTemplate
    .replace(/\{\{model\}\}/g, JSON.stringify(request.model))
    .replace(/\{\{messages\}\}/g, JSON.stringify(request.messages))
    .replace(/\{\{max_tokens\}\}/g, String(request.maxTokens ?? request.profile.maxTokens))
    .replace(/\{\{temperature\}\}/g, String(request.temperature ?? request.profile.temperature));

  let headers: Record<string, string> = {};
  if (preset.headersTemplate) {
    try {
      headers = JSON.parse(preset.headersTemplate) as Record<string, string>;
    } catch {
      // ignore invalid headers
    }
  }
  if (request.profile.apiKey && !headers.Authorization && !headers["x-api-key"]) {
    headers.Authorization = `Bearer ${request.profile.apiKey}`;
  }

  const res = await fetch("/api/ai/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      protocol: "custom",
      baseUrl,
      path: "/chat/completions",
      headers,
      body: template,
    }),
    signal: request.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  const json = (await res.json()) as unknown;
  const text = String(getByPath(json, preset.responsePath) ?? "");
  const promptTokens = estimateTokens(JSON.stringify(request.messages));
  const completionTokens = estimateTokens(text);
  return {
    text,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    finishReason: "stop",
    raw: json,
  };
}

export async function runProviderChat(request: ProviderChatRequest): Promise<ProviderChatResult> {
  const protocol = getProviderCatalogEntry(request.profile.provider).protocol;
  const isLocal = request.profile.provider === "local";
  const isCustomWithPreset =
    request.profile.provider === "custom" && request.profile.customPreset?.requestTemplate;

  if (!isLocal && !isCustomWithPreset && !request.profile.apiKey.trim()) {
    throw new Error("Add an API key before using AI.");
  }

  if (isLocal) return runLocalProviderChat(request);
  if (isCustomWithPreset) return runCustomProviderChat(request);
  if (protocol === "anthropic") return runAnthropicChat(request);
  if (protocol === "google") return runGoogleChat(request);
  if (protocol === "cohere") return runCohereChat(request);
  return runOpenAiCompatibleChat(request);
}

export async function testProviderConnection(profile: AiProviderProfile): Promise<{ ok: boolean; message: string }> {
  try {
    const model = profile.model || getProviderCatalogEntry(profile.provider).defaultModel;
    const result = await runProviderChat({
      profile,
      model,
      maxTokens: 60,
      messages: [
        { role: "system", content: "Reply with exactly: connection ok" },
        { role: "user", content: "connection test" },
      ],
    });
    return { ok: /connection ok/i.test(result.text), message: result.text || "Connected." };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}
