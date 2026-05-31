import { NextRequest, NextResponse } from "next/server";

interface ModelsRequestBody {
  provider: string;
  baseUrl: string;
  apiKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ModelsRequestBody;
    const { provider, baseUrl, apiKey } = body;

    if (!baseUrl?.trim() || !apiKey?.trim()) {
      return NextResponse.json({ error: "Base URL and API key required" }, { status: 400 });
    }

    const url = baseUrl.replace(/\/$/, "");

    // OpenAI-compatible providers: GET /models or /v1/models
    if (
      [
        "openai",
        "groq",
        "together",
        "fireworks",
        "mistral",
        "deepseek",
        "xai",
        "nvidia",
        "openrouter",
        "litellm",
        "ollama",
        "custom",
      ].includes(provider)
    ) {
      const modelsUrl = url.includes("/v1") ? `${url}/models` : `${url}/v1/models`;
      const res = await fetch(modelsUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text || res.statusText }, { status: res.status });
      }

      const json = (await res.json()) as { data?: Array<{ id: string }> };
      const models = (json.data ?? []).map((m) => m.id).filter(Boolean);
      return NextResponse.json({ models });
    }

    // Anthropic: no public models list endpoint, return empty
    if (provider === "anthropic") {
      return NextResponse.json({
        models: [
          "claude-3-7-sonnet-latest",
          "claude-3-5-sonnet-latest",
          "claude-3-opus-latest",
          "claude-3-haiku-latest",
        ],
      });
    }

    // Google: different API structure
    if (provider === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text || res.statusText }, { status: res.status });
      }
      const json = (await res.json()) as { models?: Array<{ name?: string }> };
      const models = (json.models ?? [])
        .map((m) => m.name?.replace("models/", ""))
        .filter((id): id is string => Boolean(id));
      return NextResponse.json({ models });
    }

    // Cohere: check for models endpoint
    if (provider === "cohere") {
      const res = await fetch(`${url}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        return NextResponse.json({
          models: ["command-r-plus", "command-r", "command", "command-light"],
        });
      }
      const json = (await res.json()) as { models?: Array<{ name?: string }> };
      const models = (json.models ?? []).map((m) => m.name ?? "").filter(Boolean);
      return NextResponse.json({ models: models.length ? models : ["command-r-plus", "command-r"] });
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Models fetch error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
