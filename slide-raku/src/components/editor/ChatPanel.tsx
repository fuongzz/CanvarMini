'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Trash2, Wand2 } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { buildSlideContext, contextToString } from '@/lib/slideContext';
import { fabricCanvasSingleton } from '@/lib/fabricCanvas';

interface CanvasAction {
  action: 'add_text' | 'add_rect' | 'set_background';
  text?: string;
  left?: number;
  top?: number;
  fontSize?: number;
  fill?: string;
  width?: number;
  height?: number;
}

export function ChatPanel() {
  const { chatMessages, chatLoading, addChatMessage, setChatLoading, clearChat, toggleChat } =
    useEditorStore();
  const [input, setInput] = useState('');
  const [pendingAction, setPendingAction] = useState<CanvasAction | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const send = async () => {
    const text = input.trim();
    if (!text || chatLoading) return;
    setInput('');
    setPendingAction(null);
    addChatMessage({ role: 'user', content: text });
    setChatLoading(true);

    try {
      const ctx = buildSlideContext();
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: contextToString(ctx) }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { content: string; canvasAction: CanvasAction | null };

      addChatMessage({ role: 'assistant', content: data.content });
      if (data.canvasAction) setPendingAction(data.canvasAction);
    } catch {
      addChatMessage({
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      setChatLoading(false);
    }
  };

  const applyCanvasAction = async (action: CanvasAction) => {
    const canvas = fabricCanvasSingleton.get();
    if (!canvas) return;
    const { IText, Rect } = await import('fabric');

    switch (action.action) {
      case 'add_text': {
        const obj = new IText(action.text ?? 'Text', {
          left: action.left ?? 100,
          top: action.top ?? 100,
          fontSize: action.fontSize ?? 36,
          fill: action.fill ?? '#111111',
          fontFamily: 'Arial',
        });
        canvas.add(obj);
        canvas.setActiveObject(obj);
        break;
      }
      case 'add_rect': {
        const obj = new Rect({
          left: action.left ?? 50,
          top: action.top ?? 50,
          width: action.width ?? 200,
          height: action.height ?? 100,
          fill: action.fill ?? '#6366f1',
        });
        canvas.add(obj);
        canvas.setActiveObject(obj);
        break;
      }
      case 'set_background':
        canvas.set('backgroundColor', action.fill ?? '#ffffff');
        break;
    }

    canvas.renderAll();
    // Trigger save via object:modified
    const activeObj = canvas.getActiveObject();
    if (activeObj) canvas.fire('object:modified', { target: activeObj });
    else canvas.fire('object:modified', { target: canvas.getObjects()[0] });

    setPendingAction(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <aside className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            title="Clear chat"
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleChat}
            title="Close"
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && !chatLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Bot className="w-10 h-10 text-gray-600" />
            <p className="text-sm text-gray-500">Hỏi AI về thiết kế slide!</p>
            <p className="text-xs text-gray-600">Ví dụ: &quot;Thêm tiêu đề vào slide này&quot;</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div
                className={`max-w-[200px] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {chatLoading && (
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-3 py-2.5">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          </div>
        )}

        {/* Canvas action suggestion */}
        {pendingAction && !chatLoading && (
          <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-2.5 text-xs text-indigo-200">
            <p className="mb-2">AI muốn chỉnh sửa slide. Áp dụng không?</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => applyCanvasAction(pendingAction)}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-white"
              >
                <Wand2 className="w-3 h-3" />
                Áp dụng
              </button>
              <button
                onClick={() => setPendingAction(null)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Hỏi AI về slide…"
            rows={2}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim() || chatLoading}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
