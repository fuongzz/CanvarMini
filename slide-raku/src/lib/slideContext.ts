import { useEditorStore } from '@/store/editorStore';
import { fabricCanvasSingleton } from './fabricCanvas';

export interface SlideContext {
  currentSlide: {
    title: string;
    index: number;
    objectCount: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects: any[];
  };
  totalSlides: number;
  canvasSize: { width: number; height: number };
}

export function buildSlideContext(): SlideContext {
  const { slides, activeSlideId, canvasWidth, canvasHeight } = useEditorStore.getState();
  const canvas = fabricCanvasSingleton.get();
  const activeSlide = slides.find((s) => s.id === activeSlideId);
  const idx = slides.findIndex((s) => s.id === activeSlideId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects = (canvas?.getObjects() as any[] ?? []).map((obj: any) => ({
    type: obj.type,
    left: Math.round(obj.left),
    top: Math.round(obj.top),
    width: Math.round(obj.width ?? 0),
    height: Math.round(obj.height ?? 0),
    fill: obj.fill,
    text: obj.text ?? obj.getText?.() ?? undefined,
    fontSize: obj.fontSize,
  }));

  return {
    currentSlide: {
      title: activeSlide?.title ?? 'Untitled',
      index: idx + 1,
      objectCount: objects.length,
      objects,
    },
    totalSlides: slides.length,
    canvasSize: { width: canvasWidth, height: canvasHeight },
  };
}

export function contextToString(ctx: SlideContext): string {
  return [
    `Slide ${ctx.currentSlide.index} of ${ctx.totalSlides}: "${ctx.currentSlide.title}"`,
    `Canvas size: ${ctx.canvasSize.width}×${ctx.canvasSize.height}px`,
    `Objects on slide (${ctx.currentSlide.objectCount}):`,
    ...ctx.currentSlide.objects.map(
      (o, i) =>
        `  ${i + 1}. ${o.type}${o.text ? ` — "${o.text}"` : ''} at (${o.left}, ${o.top}) fill=${o.fill}`
    ),
  ].join('\n');
}
