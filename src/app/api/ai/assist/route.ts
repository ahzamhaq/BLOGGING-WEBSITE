import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: "Prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY is not set in environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      let errBody = "";
      try { errBody = await groqRes.text(); } catch { /* ignore */ }
      console.error(`[AI] Groq HTTP ${groqRes.status}:`, errBody.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `Groq API error (${groqRes.status}): ${errBody.slice(0, 300)}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse OpenAI-compatible SSE stream and forward text to client
    const reader = groqRes.body!.getReader();
    const dec = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });

            const lines = buf.split("\n");
            buf = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (!json || json === "[DONE]") continue;
              try {
                const parsed = JSON.parse(json);
                const text: string = parsed?.choices?.[0]?.delta?.content ?? "";
                if (text) controller.enqueue(new TextEncoder().encode(text));
              } catch { /* skip malformed chunk */ }
            }
          }
          controller.close();
        } catch (err) {
          console.error("[AI] Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AI] Unexpected error:", msg);
    return new Response(
      JSON.stringify({ error: `AI request failed: ${msg}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
