'use client';

import { useEffect, useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight, BringToFront, SendToBack, Bold, Italic } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { fabricCanvasSingleton } from '@/lib/fabricCanvas';

interface ObjProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  type: string;
}

const DEFAULTS: ObjProps = {
  fill: '#6366f1',
  stroke: 'transparent',
  strokeWidth: 0,
  opacity: 1,
  fontSize: 24,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  type: '',
};

export function PropertiesPanel() {
  const selectedObjectIds = useEditorStore((s) => s.selectedObjectIds);
  const [props, setProps] = useState<ObjProps>(DEFAULTS);

  useEffect(() => {
    const canvas = fabricCanvasSingleton.get();
    const obj = canvas?.getActiveObject() as Record<string, unknown> | null | undefined;
    if (!obj) { setProps(DEFAULTS); return; }

    setProps({
      fill: (obj.fill as string) || '#6366f1',
      stroke: (obj.stroke as string) || 'transparent',
      strokeWidth: (obj.strokeWidth as number) ?? 0,
      opacity: (obj.opacity as number) ?? 1,
      fontSize: (obj.fontSize as number) || 24,
      fontWeight: (obj.fontWeight as string) || 'normal',
      fontStyle: (obj.fontStyle as string) || 'normal',
      textAlign: (obj.textAlign as string) || 'left',
      type: (obj.type as string) || '',
    });
  }, [selectedObjectIds]);

  const apply = (changes: Partial<ObjProps>) => {
    const canvas = fabricCanvasSingleton.get();
    if (!canvas) return;
    const objs = canvas.getActiveObjects() as unknown as Record<string, unknown>[];
    if (objs.length === 0) return;

    objs.forEach((obj) => {
      const o = obj as { set: (k: string, v: unknown) => void };
      if ('fill' in changes) o.set('fill', changes.fill);
      if ('stroke' in changes) o.set('stroke', changes.stroke);
      if ('strokeWidth' in changes) o.set('strokeWidth', changes.strokeWidth);
      if ('opacity' in changes) o.set('opacity', changes.opacity);
      if ('fontSize' in changes) o.set('fontSize', changes.fontSize);
      if ('fontWeight' in changes) o.set('fontWeight', changes.fontWeight);
      if ('fontStyle' in changes) o.set('fontStyle', changes.fontStyle);
      if ('textAlign' in changes) o.set('textAlign', changes.textAlign);
    });

    canvas.requestRenderAll();
    // Trigger save by firing object:modified
    const activeObj = canvas.getActiveObject();
    if (activeObj) canvas.fire('object:modified', { target: activeObj });
    setProps((p) => ({ ...p, ...changes }));
  };

  const bringToFront = () => {
    const canvas = fabricCanvasSingleton.get();
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => canvas.bringObjectToFront(obj));
    canvas.renderAll();
  };

  const sendToBack = () => {
    const canvas = fabricCanvasSingleton.get();
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => canvas.sendObjectToBack(obj));
    canvas.renderAll();
  };

  const hasSelection = selectedObjectIds.length > 0;
  const isText = props.type === 'i-text' || props.type === 'text' || props.type === 'textbox';

  return (
    <aside className="w-56 bg-gray-900 border-l border-gray-700 flex flex-col overflow-y-auto shrink-0">
      <div className="px-3 py-2 border-b border-gray-700">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Properties</span>
      </div>

      {!hasSelection ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-xs text-gray-500 text-center">Select an object to edit its properties</p>
        </div>
      ) : (
        <div className="p-3 space-y-4">

          {/* Fill */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Fill</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.fill.startsWith('#') ? props.fill : '#6366f1'}
                onChange={(e) => apply({ fill: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-600 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={props.fill}
                onChange={(e) => apply({ fill: e.target.value })}
                className="flex-1 text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Stroke */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Stroke</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.stroke.startsWith('#') ? props.stroke : '#000000'}
                onChange={(e) => apply({ stroke: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-600 bg-transparent p-0.5"
              />
              <input
                type="number"
                value={props.strokeWidth}
                min={0}
                max={20}
                onChange={(e) => apply({ strokeWidth: Number(e.target.value) })}
                className="flex-1 text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Width"
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">
              Opacity — {Math.round(props.opacity * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={props.opacity}
              onChange={(e) => apply({ opacity: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Text options */}
          {isText && (
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Font Size</label>
                <input
                  type="number"
                  value={props.fontSize}
                  min={8}
                  max={200}
                  onChange={(e) => apply({ fontSize: Number(e.target.value) })}
                  className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Style</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => apply({ fontWeight: props.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`p-1.5 rounded border transition-colors ${
                      props.fontWeight === 'bold'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => apply({ fontStyle: props.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`p-1.5 rounded border transition-colors ${
                      props.fontStyle === 'italic'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Align</label>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => {
                    const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                    return (
                      <button
                        key={align}
                        onClick={() => apply({ textAlign: align })}
                        className={`p-1.5 rounded border transition-colors ${
                          props.textAlign === align
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Layer order */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Layer</label>
            <div className="flex gap-1">
              <button
                onClick={bringToFront}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-xs"
              >
                <BringToFront className="w-3 h-3" />
                Front
              </button>
              <button
                onClick={sendToBack}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-xs"
              >
                <SendToBack className="w-3 h-3" />
                Back
              </button>
            </div>
          </div>

        </div>
      )}
    </aside>
  );
}
