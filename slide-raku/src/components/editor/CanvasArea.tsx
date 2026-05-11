'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { fabricCanvasSingleton } from '@/lib/fabricCanvas';

export function CanvasArea() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<{ canvas: any; mod: any } | null>(null);
  const lastSavedJsonRef = useRef('');
  const isLoadingRef = useRef(false);

  const { canvasWidth, canvasHeight } = useEditorStore();

  // Initialize Fabric canvas once on mount
  useEffect(() => {
    if (!canvasElRef.current) return;
    let disposed = false;

    import('fabric').then((mod) => {
      if (disposed || !canvasElRef.current) return;

      const canvas = new mod.Canvas(canvasElRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#ffffff',
      });

      const brush = new mod.PencilBrush(canvas);
      brush.width = 3;
      brush.color = '#111111';
      canvas.freeDrawingBrush = brush;

      fabricRef.current = { canvas, mod };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvasSingleton.set(canvas as any);

      // Load initial slide
      const { slides, activeSlideId } = useEditorStore.getState();
      const slide = slides.find((s) => s.id === activeSlideId);
      if (slide?.fabricJson) {
        isLoadingRef.current = true;
        canvas.loadFromJSON(slide.fabricJson).then(() => {
          if (!disposed) {
            canvas.renderAll();
            isLoadingRef.current = false;
            lastSavedJsonRef.current = JSON.stringify(canvas.toJSON());
          }
        });
      }

      // ── Save helper ──────────────────────────────────────────────────
      const saveCanvas = () => {
        if (isLoadingRef.current) return;
        const state = useEditorStore.getState();
        const currentJson = state.slides.find((s) => s.id === state.activeSlideId)?.fabricJson ?? '';
        const newJson = JSON.stringify(canvas.toJSON());
        if (newJson === lastSavedJsonRef.current) return;
        lastSavedJsonRef.current = newJson;
        state.pushHistory(state.activeSlideId, currentJson);
        state.updateSlideFabricJson(state.activeSlideId, newJson);
        try {
          const thumb = canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.2 });
          state.updateSlideThumbnail(state.activeSlideId, thumb);
        } catch {
          // toDataURL can fail in some environments
        }
      };

      canvas.on('object:modified', saveCanvas);
      canvas.on('object:added', saveCanvas);
      canvas.on('object:removed', saveCanvas);
      canvas.on('path:created', saveCanvas);

      // ── Selection tracking ──────────────────────────────────────────
      const syncSelection = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ids = canvas.getActiveObjects().map((_: any, i: number) => String(i));
        useEditorStore.getState().setSelectedObjectIds(ids);
      };
      canvas.on('selection:created', syncSelection);
      canvas.on('selection:updated', syncSelection);
      canvas.on('selection:cleared', () => useEditorStore.getState().setSelectedObjectIds([]));

      // ── Click to add elements ───────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.on('mouse:up', (opt: any) => {
        const { activeTool, setActiveTool } = useEditorStore.getState();
        if (activeTool === 'select' || activeTool === 'pen' || activeTool === 'image') return;
        if (opt.target) return; // clicked on existing object

        // scenePoint is the canvas-space coordinate in Fabric.js 6+
        if (!opt.scenePoint) return;
        const pointer = opt.scenePoint as { x: number; y: number };
        const { IText, Rect, Circle, Triangle, Line } = mod;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let obj: any = null;

        switch (activeTool) {
          case 'text':
            obj = new IText('Type here', {
              left: pointer.x,
              top: pointer.y,
              fontSize: 24,
              fill: '#111111',
              fontFamily: 'Arial',
            });
            canvas.add(obj);
            canvas.setActiveObject(obj);
            obj.enterEditing();
            obj.selectAll();
            break;

          case 'rect':
            obj = new Rect({
              left: pointer.x - 80,
              top: pointer.y - 50,
              width: 160,
              height: 100,
              fill: '#6366f1',
            });
            canvas.add(obj);
            canvas.setActiveObject(obj);
            break;

          case 'circle':
            obj = new Circle({
              left: pointer.x - 60,
              top: pointer.y - 60,
              radius: 60,
              fill: '#6366f1',
            });
            canvas.add(obj);
            canvas.setActiveObject(obj);
            break;

          case 'triangle':
            obj = new Triangle({
              left: pointer.x - 60,
              top: pointer.y - 50,
              width: 120,
              height: 100,
              fill: '#6366f1',
            });
            canvas.add(obj);
            canvas.setActiveObject(obj);
            break;

          case 'line':
            obj = new Line([pointer.x - 60, pointer.y, pointer.x + 60, pointer.y], {
              stroke: '#111111',
              strokeWidth: 2,
            });
            canvas.add(obj);
            canvas.setActiveObject(obj);
            break;
        }

        if (obj) {
          canvas.renderAll();
          setActiveTool('select');
        }
      });
    });

    return () => {
      disposed = true;
      if (fabricRef.current) {
        fabricRef.current.canvas.dispose();
        fabricRef.current = null;
        fabricCanvasSingleton.set(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to slide switch and undo/redo
  useEffect(() => {
    return useEditorStore.subscribe((state, prev) => {
      const json = state.slides.find((s) => s.id === state.activeSlideId)?.fabricJson ?? '';
      const prevJson = prev.slides.find((s) => s.id === prev.activeSlideId)?.fabricJson ?? '';
      const slideChanged = state.activeSlideId !== prev.activeSlideId;
      const jsonChanged = json !== prevJson;

      if (!slideChanged && !jsonChanged) return;
      if (!slideChanged && json === lastSavedJsonRef.current) return;

      const canvas = fabricRef.current?.canvas;
      if (!canvas || !json) return;

      isLoadingRef.current = true;
      canvas.loadFromJSON(json).then(() => {
        canvas.renderAll();
        isLoadingRef.current = false;
        lastSavedJsonRef.current = JSON.stringify(canvas.toJSON());
      });
    });
  }, []);

  // React to tool changes
  useEffect(() => {
    return useEditorStore.subscribe((state, prev) => {
      if (state.activeTool === prev.activeTool) return;
      const canvas = fabricRef.current?.canvas;
      if (!canvas) return;
      const tool = state.activeTool;
      canvas.isDrawingMode = tool === 'pen';
      canvas.selection = tool === 'select';
      canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
      if (tool !== 'select') {
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const canvas = fabricRef.current?.canvas;
        if (!canvas) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objs: any[] = canvas.getActiveObjects();
        if (objs.length === 0) return;
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        objs.forEach((obj: any) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center bg-[#3c3c3c] overflow-auto p-8">
      <div
        className="shadow-2xl ring-1 ring-black/30"
        style={{ width: canvasWidth, height: canvasHeight, lineHeight: 0 }}
      >
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}
