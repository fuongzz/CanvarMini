'use client';

import { Undo2, Redo2, Download, MessageSquare, Presentation } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

export function TopBar() {
  const { undo, redo, toggleChat, history, activeSlideId, slides } = useEditorStore();
  const h = history[activeSlideId];
  const canUndo = (h?.past.length ?? 0) > 0;
  const canRedo = (h?.future.length ?? 0) > 0;
  const activeSlide = slides.find((s) => s.id === activeSlideId);

  return (
    <header className="flex items-center h-12 px-4 bg-gray-800 border-b border-gray-700 shrink-0 gap-4">
      <div className="flex items-center gap-2 mr-4">
        <Presentation className="w-5 h-5 text-indigo-400" />
        <span className="font-semibold text-white text-sm tracking-wide">SlideRaku</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm text-gray-400">{activeSlide?.title ?? ''}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-600 mx-2" />

        <button
          onClick={toggleChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium"
        >
          <MessageSquare className="w-4 h-4" />
          AI Chat
        </button>

        <button
          title="Export (coming soon)"
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm ml-1 text-gray-300"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </header>
  );
}
