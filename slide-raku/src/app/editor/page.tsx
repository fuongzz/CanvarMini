'use client';

import { useEditorStore } from '@/store/editorStore';
import { TopBar } from '@/components/editor/TopBar';
import { SlidePanel } from '@/components/editor/SlidePanel';
import { CanvasArea } from '@/components/editor/CanvasArea';
import { ToolBar } from '@/components/editor/ToolBar';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { ChatPanel } from '@/components/editor/ChatPanel';

export default function EditorPage() {
  const chatOpen = useEditorStore((s) => s.chatOpen);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden select-none">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SlidePanel />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ToolBar />
          <CanvasArea />
        </div>
        <PropertiesPanel />
        {chatOpen && <ChatPanel />}
      </div>
    </div>
  );
}
