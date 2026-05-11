'use client';

import { Plus, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

export function SlidePanel() {
  const { slides, activeSlideId, setActiveSlide, addSlide, deleteSlide, duplicateSlide, reorderSlides } =
    useEditorStore();

  return (
    <aside className="w-48 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Slides</span>
        <button
          onClick={addSlide}
          title="Add slide"
          className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            onClick={() => setActiveSlide(slide.id)}
            className={`relative group cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
              slide.id === activeSlideId
                ? 'border-indigo-500 shadow-md shadow-indigo-500/20'
                : 'border-transparent hover:border-gray-600'
            }`}
          >
            <div className="aspect-video bg-white">
              {slide.thumbnail ? (
                <img src={slide.thumbnail} alt={slide.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-[10px]">{slide.title}</span>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/60 px-1.5 py-0.5">
              <span className="text-[10px] text-white/70">{idx + 1}</span>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); reorderSlides(idx, Math.max(0, idx - 1)); }}
                  title="Move up"
                  className="p-0.5 text-white/60 hover:text-indigo-300 transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); reorderSlides(idx, Math.min(slides.length - 1, idx + 1)); }}
                  title="Move down"
                  className="p-0.5 text-white/60 hover:text-indigo-300 transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }}
                  title="Duplicate"
                  className="p-0.5 text-white/60 hover:text-indigo-300 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                  title="Delete"
                  className="p-0.5 text-white/60 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
