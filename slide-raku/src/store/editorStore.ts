import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Slide, ChatMessage } from '@/types';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

function makeBlankSlide(index: number): Slide {
  return {
    id: crypto.randomUUID(),
    title: `Slide ${index}`,
    fabricJson: JSON.stringify({
      version: '6.0.0',
      objects: [],
      background: '#ffffff',
    }),
    thumbnail: '',
  };
}

interface HistoryState {
  past: string[];
  future: string[];
}

interface EditorState {
  slides: Slide[];
  activeSlideId: string;
  history: Record<string, HistoryState>;
  activeTool: 'select' | 'text' | 'rect' | 'circle' | 'triangle' | 'line' | 'pen' | 'image' | 'icon';
  selectedObjectIds: string[];
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  canvasWidth: number;
  canvasHeight: number;

  addSlide: () => void;
  deleteSlide: (id: string) => void;
  setActiveSlide: (id: string) => void;
  updateSlideFabricJson: (id: string, json: string) => void;
  updateSlideThumbnail: (id: string, thumbnail: string) => void;
  reorderSlides: (from: number, to: number) => void;
  duplicateSlide: (id: string) => void;

  setActiveTool: (tool: EditorState['activeTool']) => void;
  setSelectedObjectIds: (ids: string[]) => void;

  pushHistory: (slideId: string, json: string) => void;
  undo: () => void;
  redo: () => void;

  toggleChat: () => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setChatLoading: (v: boolean) => void;
  clearChat: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => {
      const firstSlide = makeBlankSlide(1);

      return {
        slides: [firstSlide],
        activeSlideId: firstSlide.id,
        history: { [firstSlide.id]: { past: [], future: [] } },
        activeTool: 'select',
        selectedObjectIds: [],
        chatOpen: false,
        chatMessages: [],
        chatLoading: false,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,

        addSlide: () =>
          set((s) => {
            const slide = makeBlankSlide(s.slides.length + 1);
            return {
              slides: [...s.slides, slide],
              activeSlideId: slide.id,
              history: { ...s.history, [slide.id]: { past: [], future: [] } },
            };
          }),

        deleteSlide: (id) =>
          set((s) => {
            if (s.slides.length === 1) return s;
            const idx = s.slides.findIndex((sl) => sl.id === id);
            const next = s.slides.filter((sl) => sl.id !== id);
            const newActive =
              s.activeSlideId === id
                ? (next[Math.max(0, idx - 1)]?.id ?? next[0].id)
                : s.activeSlideId;
            const { [id]: _, ...rest } = s.history;
            return { slides: next, activeSlideId: newActive, history: rest };
          }),

        setActiveSlide: (id) => set({ activeSlideId: id }),

        updateSlideFabricJson: (id, json) =>
          set((s) => ({
            slides: s.slides.map((sl) => (sl.id === id ? { ...sl, fabricJson: json } : sl)),
          })),

        updateSlideThumbnail: (id, thumbnail) =>
          set((s) => ({
            slides: s.slides.map((sl) => (sl.id === id ? { ...sl, thumbnail } : sl)),
          })),

        reorderSlides: (from, to) =>
          set((s) => {
            const arr = [...s.slides];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return { slides: arr };
          }),

        duplicateSlide: (id) =>
          set((s) => {
            const src = s.slides.find((sl) => sl.id === id);
            if (!src) return s;
            const copy: Slide = { ...src, id: crypto.randomUUID(), title: src.title + ' (copy)' };
            const idx = s.slides.findIndex((sl) => sl.id === id);
            const arr = [...s.slides];
            arr.splice(idx + 1, 0, copy);
            return {
              slides: arr,
              activeSlideId: copy.id,
              history: { ...s.history, [copy.id]: { past: [], future: [] } },
            };
          }),

        setActiveTool: (tool) => set({ activeTool: tool }),
        setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),

        pushHistory: (slideId, json) =>
          set((s) => {
            const h = s.history[slideId] ?? { past: [], future: [] };
            const past = [...h.past, json].slice(-50);
            return { history: { ...s.history, [slideId]: { past, future: [] } } };
          }),

        undo: () =>
          set((s) => {
            const id = s.activeSlideId;
            const h = s.history[id];
            if (!h || h.past.length === 0) return s;
            const past = [...h.past];
            const currentJson = s.slides.find((sl) => sl.id === id)?.fabricJson ?? '';
            const prev = past.pop()!;
            const future = [currentJson, ...h.future];
            return {
              slides: s.slides.map((sl) => (sl.id === id ? { ...sl, fabricJson: prev } : sl)),
              history: { ...s.history, [id]: { past, future } },
            };
          }),

        redo: () =>
          set((s) => {
            const id = s.activeSlideId;
            const h = s.history[id];
            if (!h || h.future.length === 0) return s;
            const future = [...h.future];
            const currentJson = s.slides.find((sl) => sl.id === id)?.fabricJson ?? '';
            const next = future.shift()!;
            const past = [...h.past, currentJson];
            return {
              slides: s.slides.map((sl) => (sl.id === id ? { ...sl, fabricJson: next } : sl)),
              history: { ...s.history, [id]: { past, future } },
            };
          }),

        toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),

        addChatMessage: (msg) =>
          set((s) => ({
            chatMessages: [
              ...s.chatMessages,
              { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
            ],
          })),

        setChatLoading: (v) => set({ chatLoading: v }),
        clearChat: () => set({ chatMessages: [] }),
      };
    },
    {
      name: 'slide-raku-v1',
      partialize: (state) => ({
        slides: state.slides,
        activeSlideId: state.activeSlideId,
      }),
    }
  )
);
