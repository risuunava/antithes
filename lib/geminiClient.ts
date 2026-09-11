import type { MessageRole } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function generateGeminiResponse(
  systemPrompt: string,
  history: { role: MessageRole; content: string }[]
): Promise<string> {
  const contents: GeminiMessage[] = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  let res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 503) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Gemini API error response:", errBody);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return text.trim();
}

export async function generateGeminiJson(
  systemPrompt: string,
  history: { role: MessageRole; content: string }[]
): Promise<Record<string, string>> {
  const contents: GeminiMessage[] = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
    },
  };

  let res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 503) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return JSON.parse(text);
}
