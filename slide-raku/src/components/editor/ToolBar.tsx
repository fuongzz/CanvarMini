'use client';

import { useRef, useState } from 'react';
import { MousePointer2, Type, Square, Circle, Triangle, Minus, Pen, ImageIcon, Trash2, Smile } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { fabricCanvasSingleton } from '@/lib/fabricCanvas';
import { IconPanel } from './IconPanel';

const TOOLS = [
  { id: 'select' as const, icon: MousePointer2, label: 'Select (V)' },
  { id: 'text' as const, icon: Type, label: 'Text (T)' },
  { id: 'rect' as const, icon: Square, label: 'Rectangle (R)' },
  { id: 'circle' as const, icon: Circle, label: 'Circle (C)' },
  { id: 'triangle' as const, icon: Triangle, label: 'Triangle' },
  { id: 'line' as const, icon: Minus, label: 'Line (L)' },
  { id: 'pen' as const, icon: Pen, label: 'Pen (P)' },
  { id: 'image' as const, icon: ImageIcon, label: 'Image (I)' },
  { id: 'icon' as const, icon: Smile, label: 'Icons & Stickers' },
] as const;

export function ToolBar() {
  const { activeTool, setActiveTool } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showIconPanel, setShowIconPanel] = useState(false);

  const handleToolClick = (id: typeof TOOLS[number]['id']) => {
    if (id === 'image') {
      fileInputRef.current?.click();
      return;
    }
    if (id === 'icon') {
      setShowIconPanel((v) => !v);
      return;
    }
    setShowIconPanel(false);
    setActiveTool(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = fabricCanvasSingleton.get();
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      import('fabric').then(({ FabricImage }) => {
        FabricImage.fromURL(dataUrl).then((img) => {
          const scale = Math.min(400 / (img.width ?? 400), 300 / (img.height ?? 300));
          img.scale(scale);
          img.set({ left: 80, top: 80 });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setActiveTool('select');
  };

  const handleDelete = () => {
    const canvas = fabricCanvasSingleton.get();
    if (!canvas) return;
    const objs = canvas.getActiveObjects();
    if (objs.length === 0) return;
    objs.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  return (
    <div className="relative flex items-center h-10 px-3 bg-gray-800 border-b border-gray-700 gap-0.5 shrink-0">
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => handleToolClick(id)}
          title={label}
          className={`p-2 rounded transition-colors ${
            activeTool === id || (id === 'icon' && showIconPanel)
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-px h-6 bg-gray-600 mx-2" />

      <button
        onClick={handleDelete}
        title="Delete selected (Del)"
        className="p-2 rounded text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {showIconPanel && <IconPanel onClose={() => setShowIconPanel(false)} />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
