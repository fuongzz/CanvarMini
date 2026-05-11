'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { fabricCanvasSingleton } from '@/lib/fabricCanvas';
import { useEditorStore } from '@/store/editorStore';

const CATEGORIES: Record<string, string[]> = {
  'Shapes': ['⭐', '❤️', '💎', '🔷', '🔶', '🔴', '🟢', '🔵', '🟡', '🟠', '🔺', '🔻', '⬛', '⬜'],
  'Arrows': ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↔️', '↕️', '🔄', '↩️', '↪️', '🔁'],
  'Marks': ['✅', '❌', '⚠️', '❓', '❗', '💡', '🔑', '🏆', '🎯', '📌', '🔔', '💬', '📢', '✏️'],
  'Emoji': ['😀', '👍', '👎', '👏', '🙌', '💪', '🤝', '✌️', '👀', '💯', '🔥', '✨', '🎉', '🌟'],
  '数字': ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭'],
};

interface Props {
  onClose: () => void;
}

export function IconPanel({ onClose }: Props) {
  const [active, setActive] = useState('Shapes');
  const { setActiveTool } = useEditorStore();

  const addIcon = async (icon: string) => {
    const canvas = fabricCanvasSingleton.get();
    if (!canvas) return;
    const { IText } = await import('fabric');
    const obj = new IText(icon, {
      left: 200,
      top: 160,
      fontSize: 52,
      selectable: true,
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    setActiveTool('select');
    onClose();
  };

  return (
    <div className="absolute top-10 left-0 z-50 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-sm font-medium text-white">Icons &amp; Stickers</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex border-b border-gray-700 overflow-x-auto">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-2 py-1.5 text-[10px] whitespace-nowrap transition-colors shrink-0 ${
              active === cat
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 p-2 max-h-44 overflow-y-auto">
        {CATEGORIES[active].map((icon, i) => (
          <button
            key={i}
            onClick={() => addIcon(icon)}
            title={`Add ${icon}`}
            className="p-1.5 text-xl rounded hover:bg-gray-700 transition-colors text-center leading-none"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
