import { NextRequest, NextResponse } from "next/server";

type Protocol = "openai" | "anthropic" | "google" | "cohere" | "custom";

interface ProxyRequestBody {
  protocol: Protocol;
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content?: string | unknown[]; tool_call_id?: string; tool_calls?: unknown[] }>;
  imageParts?: Array<{ base64: string; mimeType: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  topP?: number;
  reasoningEffort?: string;
  supportsImage?: boolean;
  tools?: unknown[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  extraBody?: Record<string, unknown>;
}

interface CustomProxyBody {
  protocol: "custom";
  baseUrl: string;
  path: string;
  headers: Record<string, string>;
  body: string;
}

function buildOpenAiContent(
  text: string,
  imageParts?: Array<{ base64: string; mimeType: string }>,
  supportsImage?: boolean
): string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> {
  if (!imageParts?.length || !supportsImage) return text;
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

function buildAnthropicContent(
  text: string,
  imageParts?: Array<{ base64: string; mimeType: string }>,
  supportsImage?: boolean
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

function buildGoogleParts(
  text: string,
  imageParts?: Array<{ base64: string; mimeType: string }>,
  supportsImage?: boolean
): Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> {
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [];
  if (text) parts.push({ text });
  if (supportsImage && imageParts?.length) {
    for (const img of imageParts) {
      parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
    }
  }
  return parts;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProxyRequestBody | CustomProxyBody;

    if (body.protocol === "custom") {
      const { baseUrl, path, headers, body: reqBody } = body as CustomProxyBody;
      const url = baseUrl.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: reqBody,
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
      }
      const json = await res.json();
      return NextResponse.json(json);
    }

    const proxyBody = body as ProxyRequestBody;
    const {
      protocol,
      baseUrl,
      apiKey,
      model,
      messages,
      imageParts,
      temperature = 0.7,
      maxTokens = 4000,
      stream = false,
      topP = 1,
      reasoningEffort = "medium",
      supportsImage = false,
      tools,
      tool_choice,
      extraBody,
    } = proxyBody;

    const url = baseUrl.replace(/\/$/, "");

    if (protocol === "openai") {
      const openAiMessages = messages.map((message, i) => {
        if (message.role === "tool") {
          return {
            role: "tool" as const,
            content: typeof message.content === "string" ? message.content : "",
            tool_call_id: message.tool_call_id ?? "",
          };
        }
        const isLastUser = i === messages.length - 1 && message.role === "user";
        const content =
          isLastUser && imageParts?.length
            ? buildOpenAiContent(
                typeof message.content === "string" ? message.content : "",
                imageParts,
                supportsImage
              )
            : message.content;
        const msg: Record<string, unknown> = { role: message.role, content };
        if (message.tool_calls?.length) {
          msg.tool_calls = message.tool_calls;
        }
        return msg;
      });

      const body: Record<string, unknown> = {
        model,
        messages: openAiMessages,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        stream,
        ...(model.startsWith("o1") || model.startsWith("o3")
          ? { reasoning: { effort: reasoningEffort } }
          : {}),
      };
      if (tools?.length) {
        body.tools = tools;
        body.tool_choice = tool_choice ?? "auto";
      }
      if (extraBody && typeof extraBody === "object") {
        Object.assign(body, extraBody);
      }

      const start = Date.now();
      const res = await fetch(`${url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (stream) {
        // eslint-disable-next-line no-console
        console.log(`[AI proxy] ${model} stream started (${Date.now() - start}ms to first byte)`);
      }

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
      }

      if (stream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const readable = new ReadableStream({
          async start(controller) {
            let buf = "";
            let chunkCount = 0;
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                buf += chunk;
                chunkCount++;
                if (chunkCount === 1) {
                  // eslint-disable-next-line no-console
                  console.log(`[AI proxy] ${model} first chunk received`);
                }
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6);
                    if (data === "[DONE]") continue;
                    try {
                      const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string; reasoning_content?: string } }> };
                      const delta = json.choices?.[0]?.delta;
                      const reasoning = delta?.reasoning_content;
                      const content = delta?.content;
                      if (reasoning) {
                        // eslint-disable-next-line no-console
                        console.log(`[AI stream] reasoning: ${JSON.stringify(reasoning)}`);
                      }
                      if (content) {
                        // eslint-disable-next-line no-console
                        console.log(`[AI stream] content: ${JSON.stringify(content)}`);
                      }
                    } catch {
                      // skip parse errors
                    }
                  }
                }
                controller.enqueue(value);
              }
              // eslint-disable-next-line no-console
              console.log(`[AI proxy] ${model} stream complete (${chunkCount} chunks)`);
            } finally {
              controller.close();
            }
          },
        });
        return new NextResponse(readable, {
          headers: {
            "Content-Type": res.headers.get("Content-Type") || "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      const json = await res.json();
      // eslint-disable-next-line no-console
      console.log(`[AI proxy] ${model} non-stream response (${Date.now() - start}ms)`);
      return NextResponse.json(json);
    }

    if (protocol === "anthropic") {
      const system = messages.find((m) => m.role === "system")?.content ?? "";
      const anthropicMessages = messages
        .filter((m) => m.role !== "system")
        .map((message, i, arr) => {
          const isLastUser = message.role === "user" && i === arr.length - 1;
          const content =
            isLastUser && imageParts?.length
              ? buildAnthropicContent(
                  typeof message.content === "string" ? message.content : "",
                  imageParts,
                  supportsImage
                )
              : [{ type: "text" as const, text: typeof message.content === "string" ? message.content : "" }];
          return {
            role: message.role === "assistant" ? "assistant" : "user",
            content,
          };
        });

      const res = await fetch(`${url}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          system,
          messages: anthropicMessages,
          max_tokens: maxTokens,
          temperature,
          stream,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
      }

      if (stream && res.body) {
        return new NextResponse(res.body, {
          headers: {
            "Content-Type": res.headers.get("Content-Type") || "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      const json = await res.json();
      return NextResponse.json(json);
    }

    if (protocol === "google") {
      const parts = messages.map((message, i) => {
        const isLastUser = message.role === "user" && i === messages.length - 1;
        const messageParts =
          isLastUser && imageParts?.length
            ? buildGoogleParts(
                typeof message.content === "string" ? message.content : "",
                imageParts,
                supportsImage
              )
            : [{ text: typeof message.content === "string" ? message.content : "" }];
        return {
          role: message.role === "assistant" ? "model" : "user",
          parts: messageParts,
        };
      });

      const res = await fetch(
        `${url}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: parts,
            generationConfig: {
              temperature,
              topP,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
      }

      const json = await res.json();
      return NextResponse.json(json);
    }

    if (protocol === "cohere") {
      const res = await fetch(`${url}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: typeof m.content === "string" ? m.content : "",
          })),
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
      }

      const json = await res.json();
      return NextResponse.json(json);
    }

    return NextResponse.json({ error: "Unknown protocol" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
