import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an AI design assistant for SlideRaku, a web-based slide editor for Japanese teachers in Vietnam.

You help users create beautiful presentation slides. You can:
1. Give design advice and layout suggestions
2. Suggest content improvements
3. When the user asks you to make a specific change to the canvas, respond with a CANVAS_UPDATE block at the END of your message

CANVAS_UPDATE format (use only when the user explicitly asks you to add/change something on the slide):
CANVAS_UPDATE:{"action":"add_text","text":"Your text","left":100,"top":100,"fontSize":40,"fill":"#111111"}
CANVAS_UPDATE:{"action":"add_rect","left":50,"top":50,"width":200,"height":100,"fill":"#6366f1"}
CANVAS_UPDATE:{"action":"set_background","fill":"#f0f4ff"}

Keep responses concise (2-4 sentences). Write in the same language the user uses (Vietnamese, Japanese, or English).`;

const MOCK_RESPONSES = [
  'Thiết kế trông rất tốt! Hãy thử thêm nhiều khoảng trắng xung quanh văn bản để dễ đọc hơn.',
  'Để slide chuyên nghiệp hơn, hãy dùng 2-3 màu chủ đạo nhất quán trên tất cả các slide.',
  'Với tài liệu dạy học, nên dùng cỡ chữ từ 28pt trở lên để học sinh ngồi xa vẫn đọc được.',
  'Bạn có thể nhân đôi slide hiện tại và chỉnh sửa để giữ nguyên bố cục — tiết kiệm thời gian.',
  'Thêm hình ảnh minh họa giúp nội dung sinh động hơn. Dùng nút Image trên thanh công cụ.',
  'スライドのデザインがとても良いです！テキストの周りに余白を追加すると、さらに読みやすくなります。',
  'Hãy dùng hình khối màu đậm phía sau tiêu đề để nổi bật hơn. Thêm Rect rồi đặt xuống dưới (Send to Back).',
];

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json() as { message: string; context: string };

    // ── Real OpenAI path ──────────────────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Current slide context:\n${context}\n\nUser: ${message}`,
            },
          ],
        }),
      });

      if (!openaiRes.ok) {
        const err = await openaiRes.text();
        console.error('[AI] OpenAI error:', err);
        return NextResponse.json({ error: 'AI API error' }, { status: 502 });
      }

      const data = await openaiRes.json() as {
        choices: { message: { content: string } }[];
      };
      const content = data.choices[0]?.message?.content ?? '';
      const { text, canvasAction } = parseResponse(content);
      return NextResponse.json({ content: text, canvasAction });
    }

    // ── Mock path (no API key) ────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    const mockText = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    return NextResponse.json({ content: mockText, canvasAction: null });
  } catch (err) {
    console.error('[AI] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Parse CANVAS_UPDATE directive from AI response text
function parseResponse(raw: string): { text: string; canvasAction: object | null } {
  const marker = 'CANVAS_UPDATE:';
  const idx = raw.indexOf(marker);
  if (idx === -1) return { text: raw.trim(), canvasAction: null };

  const text = raw.slice(0, idx).trim();
  try {
    const json = raw.slice(idx + marker.length).trim();
    const canvasAction = JSON.parse(json.split('\n')[0]);
    return { text, canvasAction };
  } catch {
    return { text: raw.trim(), canvasAction: null };
  }
}
