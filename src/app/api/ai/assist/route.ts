import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    const mockText = `Here is an AI-assisted suggestion for your content:\n\nThis is a placeholder response. To enable real AI assistance, add your Google Gemini API key to .env.local as GEMINI_API_KEY.`;
    return new Response(mockText, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (err) {
          console.error("Stream generation error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Gemini API error:", err);
    return new Response(
      JSON.stringify({ error: "AI request failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
