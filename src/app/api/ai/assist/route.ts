import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    // Return a mock streaming response for demo purposes
    const mockText = `Here is an AI-assisted suggestion for your content:\n\nThis is a placeholder response. To enable real AI assistance, add your Google Gemini API key to .env.local as GEMINI_API_KEY.\n\nYou can get a free API key at: https://aistudio.google.com/`;
    return new Response(mockText, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Gemini API response error:", res.status, errBody);
      return NextResponse.json(
        { error: `Gemini API error (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated.";

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Gemini API error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
