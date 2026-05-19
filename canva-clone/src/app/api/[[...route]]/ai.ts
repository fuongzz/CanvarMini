import { z } from "zod";
import { Hono } from "hono";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { replicate } from "@/lib/replicate";

// ── Gemini AI Chat ─────────────────────────────────────────────────────────────

export interface CanvasAction {
  type: "set_background" | "add_text" | "add_rect" | "add_circle" | "add_triangle" | "add_line";
  left?: number; top?: number;
  width?: number; height?: number; radius?: number;
  x1?: number; y1?: number; x2?: number; y2?: number;
  text?: string; fontSize?: number;
  fontWeight?: "normal" | "bold"; fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right"; fontFamily?: string;
  fill?: string; stroke?: string; strokeWidth?: number; opacity?: number;
}

export interface AIChatResponse {
  message: string;
  clearFirst: boolean;
  actions: CanvasAction[];
}

const CHAT_SYSTEM_PROMPT = `You are Canvar AI — an intelligent design assistant for a canvas editor (similar to Canva).

CANVAS: 1200×900 px. Top-left is (0, 0).

TASK: Return valid JSON matching this schema:
{
  "message": "string — brief response in the user's language (Vietnamese/English)",
  "clearFirst": boolean — true when creating a whole new design, false when only adding/editing,
  "actions": [ ...array of canvas actions... ]
}

ACTION TYPES:
1. set_background: { "type":"set_background", "fill":"#rrggbb" }
2. add_text: { "type":"add_text", "text":"...", "left":N, "top":N, "width":N, "fontSize":N, "fill":"#hex", "fontWeight":"bold"|"normal", "fontStyle":"normal"|"italic", "textAlign":"left"|"center"|"right" }
3. add_rect: { "type":"add_rect", "left":N, "top":N, "width":N, "height":N, "fill":"#hex", "opacity":0-1, "stroke":"#hex", "strokeWidth":N }
4. add_circle: { "type":"add_circle", "left":N, "top":N, "radius":N, "fill":"#hex", "opacity":0-1 }
5. add_triangle: { "type":"add_triangle", "left":N, "top":N, "width":N, "height":N, "fill":"#hex" }
6. add_line: { "type":"add_line", "x1":N, "y1":N, "x2":N, "y2":N, "stroke":"#hex", "strokeWidth":N }

DESIGN RULES:
- Min margin: 40px from canvas edges
- No overlapping text — estimate each text box height as lines × fontSize × 1.4 + 16px
- Max 3-4 colors per design (background + 1-2 accent + text color)
- Text color must contrast with background
- Prefer minimal, professional designs

Use clearFirst: true when user says "create", "design", "make", "generate", "tạo", "thiết kế"
Use clearFirst: false when user says "add", "change", "update", "thêm", "đổi", "sửa"

IMPORTANT: Always carefully calculate top positions to avoid overlap.`;

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro-latest", "gemini-1.5-pro"];

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    clearFirst: { type: "boolean" },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["set_background", "add_text", "add_rect", "add_circle", "add_triangle", "add_line"] },
          left: { type: "number" }, top: { type: "number" },
          width: { type: "number" }, height: { type: "number" }, radius: { type: "number" },
          x1: { type: "number" }, y1: { type: "number" }, x2: { type: "number" }, y2: { type: "number" },
          text: { type: "string" }, fontSize: { type: "number" },
          fontWeight: { type: "string" }, fontStyle: { type: "string" },
          textAlign: { type: "string" }, fontFamily: { type: "string" },
          fill: { type: "string" }, stroke: { type: "string" },
          strokeWidth: { type: "number" }, opacity: { type: "number" },
        },
        required: ["type"],
      },
    },
  },
  required: ["message", "clearFirst", "actions"],
};

async function callGeminiChat(userMessage: string): Promise<AIChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("NO_API_KEY");

  const body = {
    system_instruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 404 || res.status === 429) {
      console.warn(`[Gemini] ${model} returned ${res.status}, trying next...`);
      continue;
    }
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

    const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return JSON.parse(raw) as AIChatResponse;
  }

  throw new Error("RATE_LIMIT");
}

// ── Hono app ───────────────────────────────────────────────────────────────────

const app = new Hono()
  .post(
    "/chat",
    verifyAuth(),
    zValidator("json", z.object({ message: z.string().min(1) })),
    async (c) => {
      const { message } = c.req.valid("json");
      try {
        const result = await callGeminiChat(message);
        return c.json(result);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "NO_API_KEY") {
          return c.json({
            message: "AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env.local.",
            clearFirst: false,
            actions: [],
          });
        }
        if (msg === "RATE_LIMIT") {
          return c.json({
            message: "⚠️ Gemini đang bị giới hạn tốc độ. Vui lòng thử lại sau vài giây.",
            clearFirst: false,
            actions: [],
          });
        }
        return c.json({ message: "Có lỗi xảy ra. Vui lòng thử lại.", clearFirst: false, actions: [] }, 500);
      }
    },
  )
  .post(
    "/remove-bg",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        image: z.string(),
      }),
    ),
    async (c) => {
      const { image } = c.req.valid("json");

      const input = {
        image: image
      };
    
      const output: unknown = await replicate.run("cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", { input });

      const res = output as string;

      return c.json({ data: res });
    },
  )
  .post(
    "/generate-image",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        prompt: z.string(),
      }),
    ),
    async (c) => {
      const { prompt } = c.req.valid("json");

      const input = {
        prompt: prompt,
        aspect_ratio: "3:2",
        output_format: "webp",
        output_quality: 90,
        num_outputs: 1,
      };

      const output = await replicate.run("black-forest-labs/flux-schnell", { input });

      const res = output as Array<string>;

      return c.json({ data: res[0] });
    },
  );

export default app;
