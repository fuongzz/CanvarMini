import type { Canvas } from 'fabric';

let instance: Canvas | null = null;

export const fabricCanvasSingleton = {
  set: (c: Canvas | null) => { instance = c; },
  get: () => instance,
};
