import React, { useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Italic,
  Layers,
  List,
  Lock,
  SlidersHorizontal,
  Trash2,
  Underline,
  Unlock,
} from 'lucide-react';
import { ANIMATION_PRESETS } from '../../data/elementsCatalog';
import { FONT_OPTIONS } from '../../data/seedWorkspace';
import type {
  AnimationEffect,
  CanvasElement,
  DesignPage,
  ImageFilters,
  TextEffect,
} from '../../types/studio';

interface ContextToolbarProps {
  page: DesignPage;
  selectedElements: CanvasElement[];
  onUpdatePage: (patch: Partial<DesignPage>) => void;
  onUpdateElement: (id: string, patch: Partial<CanvasElement>) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onAlignElements: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onRequestFramePhoto?: (elementId: string) => void;
  onRequestGridCellPhoto?: (elementId: string, cellIndex: number) => void;
}

const DEFAULT_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  preset: 'none',
};

export const ContextToolbar: React.FC<ContextToolbarProps> = ({
  page,
  selectedElements,
  onUpdatePage,
  onUpdateElement,
  onDuplicateSelected,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  onAlignElements,
  onRequestFramePhoto,
  onRequestGridCellPhoto,
}) => {
  const [popover, setPopover] = useState<
    'spacing' | 'effects' | 'filters' | 'position' | 'chartData' | 'animate' | null
  >(null);

  const primary = selectedElements.length === 1 ? selectedElements[0] : null;
  const multi = selectedElements.length > 1;

  return (
    <div className="h-12 shrink-0 bg-black border-b border-neutral-800 px-3 flex items-center justify-between gap-3 z-20 select-none relative text-white">
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {!primary && !multi && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-neutral-300 cursor-pointer">
              <span>Canvas</span>
              <input
                type="color"
                value={page.backgroundColor}
                onChange={(e) => onUpdatePage({ backgroundColor: e.target.value })}
                className="w-7 h-7 rounded-md border border-neutral-700 cursor-pointer bg-transparent"
              />
            </label>
            <div className="flex items-center gap-1.5">
              {['#FFFFFF', '#F4F3EF', '#0F172A', '#000000'].map((hex) => (
                <button
                  key={hex}
                  onClick={() => onUpdatePage({ backgroundColor: hex })}
                  className="w-6 h-6 rounded-md border border-neutral-600"
                  style={{ backgroundColor: hex }}
                  title={`Background ${hex}`}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-400 hidden sm:inline">
              · Tap any text or element on the white canvas to edit
            </span>
          </div>
        )}

        {multi && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white mr-1">
              {selectedElements.length} selected
            </span>
            {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onAlignElements(mode)}
                className="h-8 px-2.5 rounded-lg border border-neutral-700 text-xs font-medium capitalize text-white hover:bg-neutral-800"
              >
                {mode}
              </button>
            ))}
          </div>
        )}

        {primary && primary.type === 'text' && (
          <div className="flex items-center gap-1.5">
            <select
              value={primary.fontFamily || 'DM Sans'}
              onChange={(e) => onUpdateElement(primary.id, { fontFamily: e.target.value })}
              aria-label="Font family"
              className="h-9 px-2.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-medium text-white outline-none"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <div className="flex items-center border border-neutral-700 rounded-lg h-9 bg-neutral-900">
              <button
                onClick={() =>
                  onUpdateElement(primary.id, {
                    fontSize: Math.max(10, (primary.fontSize || 24) - 2),
                  })
                }
                className="px-2.5 h-full text-xs text-white hover:bg-neutral-800"
              >
                -
              </button>
              <input
                type="number"
                value={primary.fontSize || 24}
                onChange={(e) =>
                  onUpdateElement(primary.id, {
                    fontSize: Math.max(8, Number(e.target.value) || 12),
                  })
                }
                className="w-12 text-center text-xs font-mono tabular-nums bg-transparent text-white outline-none"
              />
              <button
                onClick={() =>
                  onUpdateElement(primary.id, {
                    fontSize: Math.min(200, (primary.fontSize || 24) + 2),
                  })
                }
                className="px-2.5 h-full text-xs text-white hover:bg-neutral-800"
              >
                +
              </button>
            </div>

            <input
              type="color"
              value={primary.color || '#0F172A'}
              onChange={(e) => onUpdateElement(primary.id, { color: e.target.value })}
              title="Text color"
              className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
            />

            <button
              onClick={() =>
                onUpdateElement(primary.id, {
                  fontWeight: (primary.fontWeight || 400) >= 700 ? 400 : 700,
                })
              }
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                (primary.fontWeight || 400) >= 700
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-neutral-800'
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                onUpdateElement(primary.id, {
                  fontStyle: primary.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                primary.fontStyle === 'italic'
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-neutral-800'
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                onUpdateElement(primary.id, {
                  textDecoration: primary.textDecoration === 'underline' ? 'none' : 'underline',
                })
              }
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                primary.textDecoration === 'underline'
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-neutral-800'
              }`}
            >
              <Underline className="w-4 h-4" />
            </button>

            {(['left', 'center', 'right'] as const).map((align) => {
              const Icon =
                align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
              return (
                <button
                  key={align}
                  onClick={() => onUpdateElement(primary.id, { textAlign: align })}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    (primary.textAlign || 'left') === align
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}

            <button
              onClick={() =>
                onUpdateElement(primary.id, {
                  listStyle: primary.listStyle === 'bullet' ? 'none' : 'bullet',
                })
              }
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                primary.listStyle === 'bullet'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:bg-neutral-900'
              }`}
              title="Bullets"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              onClick={() => setPopover(popover === 'spacing' ? null : 'spacing')}
              className="h-9 px-2.5 rounded-lg text-xs font-medium text-neutral-200 hover:bg-neutral-800 whitespace-nowrap"
            >
              Spacing
            </button>
            <button
              onClick={() => setPopover(popover === 'effects' ? null : 'effects')}
              className="h-9 px-2.5 rounded-lg text-xs font-medium text-neutral-200 hover:bg-neutral-800 whitespace-nowrap"
            >
              Effects
            </button>
          </div>
        )}

        {primary && (primary.type === 'shape' || primary.type === 'path' || primary.type === 'graphic') && (
          <div className="flex items-center gap-2">
            {(primary.type === 'shape' || primary.type === 'graphic') && (
              <>
                <label className="flex items-center gap-1.5 text-xs text-neutral-300">
                  <span>Color</span>
                  <input
                    type="color"
                    value={primary.fill && primary.fill !== 'transparent' ? primary.fill : '#0F766E'}
                    onChange={(e) =>
                      onUpdateElement(primary.id, {
                        fill: e.target.value,
                        ...(primary.graphicVariant === 'svg-stroke' ? { stroke: e.target.value } : {}),
                      })
                    }
                    className="w-7 h-7 rounded border border-neutral-700 cursor-pointer bg-transparent"
                  />
                </label>
                <div className="hidden sm:flex items-center gap-1">
                  {['#0F172A', '#EF4444', '#F59E0B', '#10B981', '#2563EB', '#EC4899', '#FFFFFF'].map(
                    (hex) => (
                      <button
                        key={hex}
                        onClick={() =>
                          onUpdateElement(primary.id, {
                            fill: hex,
                            ...(primary.graphicVariant === 'svg-stroke' ? { stroke: hex } : {}),
                          })
                        }
                        className="w-5 h-5 rounded-full border border-neutral-600"
                        style={{ backgroundColor: hex }}
                        title={`Color ${hex}`}
                      />
                    ),
                  )}
                </div>
              </>
            )}
            <label className="flex items-center gap-1.5 text-xs text-neutral-300">
              <span>Stroke</span>
              <input
                type="color"
                value={primary.stroke && primary.stroke !== 'none' ? primary.stroke : '#0F172A'}
                onChange={(e) =>
                  onUpdateElement(primary.id, {
                    stroke: e.target.value,
                    strokeWidth: Math.max(2, primary.strokeWidth || 2),
                  })
                }
                className="w-7 h-7 rounded border border-neutral-700 cursor-pointer bg-transparent"
              />
            </label>
            {(primary.shapeKind === 'rectangle' || primary.shapeKind === 'rounded') && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                <span>Radius</span>
                <input
                  type="range"
                  min={0}
                  max={64}
                  value={primary.borderRadius || 0}
                  onChange={(e) =>
                    onUpdateElement(primary.id, { borderRadius: Number(e.target.value) })
                  }
                  className="w-16 accent-white"
                />
              </div>
            )}
          </div>
        )}

        {primary && primary.type === 'image' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPopover(popover === 'filters' ? null : 'filters')}
              className="h-9 px-3 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-medium text-white hover:bg-neutral-800 flex items-center gap-1.5 whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Edit image</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
              <span>Corners</span>
              <input
                type="range"
                min={0}
                max={48}
                value={primary.borderRadius || 0}
                onChange={(e) =>
                  onUpdateElement(primary.id, { borderRadius: Number(e.target.value) })
                }
                className="w-16 accent-white"
              />
            </div>
            <button
              onClick={() => onUpdateElement(primary.id, { flipX: !primary.flipX })}
              className="h-9 w-9 rounded-lg text-neutral-300 hover:bg-neutral-800 flex items-center justify-center"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateElement(primary.id, { flipY: !primary.flipY })}
              className="h-9 w-9 rounded-lg text-neutral-300 hover:bg-neutral-800 flex items-center justify-center"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </div>
        )}

        {primary && primary.type === 'chart' && (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={primary.chartTitle || ''}
              onChange={(e) => onUpdateElement(primary.id, { chartTitle: e.target.value })}
              placeholder="Chart title"
              className="h-9 w-36 px-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-900 text-white outline-none"
            />
            {(['bar', 'pie', 'line', 'donut'] as const).map((ck) => (
              <button
                key={ck}
                onClick={() => onUpdateElement(primary.id, { chartKind: ck })}
                className={`h-9 px-2.5 rounded-lg border text-xs font-medium capitalize whitespace-nowrap ${
                  (primary.chartKind || 'bar') === ck
                    ? 'bg-white text-black border-white'
                    : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {ck}
              </button>
            ))}
            <button
              onClick={() => setPopover(popover === 'chartData' ? null : 'chartData')}
              className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white whitespace-nowrap"
            >
              Edit numbers
            </button>
          </div>
        )}

        {primary && primary.type === 'table' && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primary.tableHeaderBg || primary.fill || '#0F172A'}
              onChange={(e) => onUpdateElement(primary.id, { tableHeaderBg: e.target.value })}
              title="Header color"
              className="w-8 h-8 rounded border border-neutral-700 cursor-pointer bg-transparent"
            />
            <button
              onClick={() => {
                const rows = primary.tableRows || [['A', 'B'], ['1', '2']];
                const colCount = rows[0]?.length || 2;
                onUpdateElement(primary.id, {
                  tableRows: [...rows, Array.from({ length: colCount }, (_, i) => `Cell ${i + 1}`)],
                  height: primary.height + 42,
                });
              }}
              className="h-9 px-2.5 rounded-lg border border-neutral-700 text-xs font-medium text-white hover:bg-neutral-800 whitespace-nowrap"
            >
              + Row
            </button>
            <button
              onClick={() => {
                const rows = primary.tableRows || [['A', 'B'], ['1', '2']];
                onUpdateElement(primary.id, {
                  tableRows: rows.map((r, idx) => [...r, idx === 0 ? `Col ${r.length + 1}` : 'Value']),
                  width: primary.width + 90,
                });
              }}
              className="h-9 px-2.5 rounded-lg border border-neutral-700 text-xs font-medium text-white hover:bg-neutral-800 whitespace-nowrap"
            >
              + Col
            </button>
            <span className="text-[11px] text-neutral-400 hidden sm:inline whitespace-nowrap">
              Tap any cell on canvas to edit
            </span>
          </div>
        )}

        {primary && primary.type === 'frame' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRequestFramePhoto?.(primary.id)}
              className="h-9 px-3 rounded-lg bg-white text-black text-xs font-bold whitespace-nowrap"
            >
              Change Frame Photo
            </button>
          </div>
        )}

        {primary && primary.type === 'grid' && (
          <div className="flex items-center gap-1.5">
            {Array.from({
              length: (primary.gridCols || 2) * (primary.gridRows || 2),
            }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => onRequestGridCellPhoto?.(primary.id, idx)}
                className="h-9 px-2.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:border-white text-xs font-medium text-white whitespace-nowrap"
              >
                Box {idx + 1} Photo
              </button>
            ))}
          </div>
        )}

        {primary && primary.type === 'qrcode' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">QR URL</span>
            <input
              type="text"
              value={primary.qrValue || ''}
              onChange={(e) => onUpdateElement(primary.id, { qrValue: e.target.value })}
              className="h-9 w-56 px-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-900 text-white outline-none"
            />
          </div>
        )}
      </div>

      {(primary || multi) && (
        <div className="flex items-center gap-1 shrink-0">
          {primary && (
            <>
              <button
                onClick={() => setPopover(popover === 'animate' ? null : 'animate')}
                className={`h-9 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  primary.animationEffect && primary.animationEffect !== 'none'
                    ? 'bg-fuchsia-600 text-white'
                    : 'text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                {primary.animationEffect && primary.animationEffect !== 'none'
                  ? `Anim: ${primary.animationEffect}`
                  : 'Animate'}
              </button>
              <button
                onClick={() => setPopover(popover === 'position' ? null : 'position')}
                className="h-9 px-2.5 rounded-lg text-xs font-medium text-neutral-200 hover:bg-neutral-800 flex items-center gap-1 whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Position</span>
              </button>

              <button
                onClick={() => onUpdateElement(primary.id, { locked: !primary.locked })}
                className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                  primary.locked
                    ? 'bg-neutral-800 text-amber-400'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {primary.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </>
          )}

          <button
            onClick={onDuplicateSelected}
            title="Duplicate"
            className="h-9 w-9 rounded-lg text-neutral-300 hover:bg-neutral-800 flex items-center justify-center"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDeleteSelected}
            title="Delete"
            className="h-9 w-9 rounded-lg text-rose-400 hover:bg-neutral-800 flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {popover && primary && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setPopover(null)} />
          <div className="absolute top-13 left-4 bg-black border border-neutral-700 rounded-2xl shadow-2xl p-4 z-40 w-72 text-white">
            {popover === 'spacing' && (
              <div className="space-y-3 text-xs">
                <div className="font-semibold">Typography Spacing</div>
                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Line height</span>
                    <span className="font-mono">{(primary.lineHeight || 1.25).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={2.4}
                    step={0.05}
                    value={primary.lineHeight || 1.25}
                    onChange={(e) =>
                      onUpdateElement(primary.id, { lineHeight: Number(e.target.value) })
                    }
                    className="w-full accent-white"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Letter spacing</span>
                    <span className="font-mono">{primary.letterSpacing || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min={-4}
                    max={14}
                    step={0.5}
                    value={primary.letterSpacing || 0}
                    onChange={(e) =>
                      onUpdateElement(primary.id, { letterSpacing: Number(e.target.value) })
                    }
                    className="w-full accent-white"
                  />
                </div>
              </div>
            )}

            {popover === 'effects' && (
              <div className="space-y-2 text-xs">
                <div className="font-semibold mb-2">Text Effects</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'shadow', 'lift', 'hollow', 'echo', 'background'] as TextEffect[]).map(
                    (fx) => (
                      <button
                        key={fx}
                        onClick={() => onUpdateElement(primary.id, { textEffect: fx })}
                        className={`py-2 rounded-lg border capitalize font-medium ${
                          (primary.textEffect || 'none') === fx
                            ? 'border-white bg-white text-black'
                            : 'border-neutral-700 text-neutral-300'
                        }`}
                      >
                        {fx}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {popover === 'filters' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Photo Filters</span>
                  <button
                    onClick={() => onUpdateElement(primary.id, { filters: DEFAULT_FILTERS })}
                    className="text-neutral-300 underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'none', label: 'Normal', f: DEFAULT_FILTERS },
                    {
                      id: 'vivid',
                      label: 'Vivid',
                      f: { ...DEFAULT_FILTERS, contrast: 118, saturate: 132, preset: 'vivid' as const },
                    },
                    {
                      id: 'mono',
                      label: 'B&W',
                      f: { ...DEFAULT_FILTERS, grayscale: 100, contrast: 115, preset: 'mono' as const },
                    },
                    {
                      id: 'warm',
                      label: 'Warm',
                      f: { ...DEFAULT_FILTERS, sepia: 32, saturate: 112, preset: 'warm' as const },
                    },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onUpdateElement(primary.id, { filters: p.f })}
                      className={`py-1.5 rounded-md border font-medium ${
                        (primary.filters?.preset || 'none') === p.id
                          ? 'border-white bg-white text-black'
                          : 'border-neutral-700 text-neutral-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {(
                  [
                    ['brightness', 'Brightness', 50, 160],
                    ['contrast', 'Contrast', 50, 170],
                    ['saturate', 'Saturation', 0, 200],
                    ['blur', 'Blur', 0, 12],
                  ] as const
                ).map(([key, label, min, max]) => {
                  const cur = primary.filters || DEFAULT_FILTERS;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-neutral-400 mb-1">
                        <span>{label}</span>
                        <span className="font-mono tabular-nums">{cur[key]}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={cur[key]}
                        onChange={(e) =>
                          onUpdateElement(primary.id, {
                            filters: { ...cur, [key]: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-white"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {popover === 'chartData' && primary.type === 'chart' && (
              <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Chart Numbers</span>
                  <button
                    onClick={() => {
                      const cur = primary.chartData || [];
                      onUpdateElement(primary.id, {
                        chartData: [
                          ...cur,
                          { label: `Item ${cur.length + 1}`, value: 100, color: '#2563EB' },
                        ],
                      });
                    }}
                    className="px-2 py-1 rounded bg-white text-black font-bold text-[11px]"
                  >
                    + Row
                  </button>
                </div>
                {(primary.chartData || []).map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={pt.color || '#0F766E'}
                      onChange={(e) => {
                        const next = [...(primary.chartData || [])];
                        next[idx] = { ...pt, color: e.target.value };
                        onUpdateElement(primary.id, { chartData: next });
                      }}
                      className="w-7 h-7 rounded border border-neutral-700 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={pt.label}
                      onChange={(e) => {
                        const next = [...(primary.chartData || [])];
                        next[idx] = { ...pt, label: e.target.value };
                        onUpdateElement(primary.id, { chartData: next });
                      }}
                      className="w-20 h-8 px-2 rounded-lg border border-neutral-700 bg-neutral-900 text-white outline-none"
                    />
                    <input
                      type="number"
                      value={pt.value}
                      onChange={(e) => {
                        const next = [...(primary.chartData || [])];
                        next[idx] = { ...pt, value: Number(e.target.value) || 0 };
                        onUpdateElement(primary.id, { chartData: next });
                      }}
                      className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-neutral-700 bg-neutral-900 text-white font-mono outline-none"
                    />
                    {(primary.chartData || []).length > 2 && (
                      <button
                        onClick={() => {
                          const next = (primary.chartData || []).filter((_, i) => i !== idx);
                          onUpdateElement(primary.id, { chartData: next });
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {popover === 'animate' && (
              <div className="space-y-2.5 text-xs">
                <div className="font-semibold">Element Animation</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ANIMATION_PRESETS.map((anim) => (
                    <button
                      key={anim.id}
                      onClick={() =>
                        onUpdateElement(primary.id, {
                          animationEffect: anim.id as AnimationEffect,
                        })
                      }
                      className={`py-2 px-1.5 rounded-lg border font-medium ${
                        (primary.animationEffect || 'none') === anim.id
                          ? 'border-white bg-white text-black'
                          : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'
                      }`}
                    >
                      {anim.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {popover === 'position' && (
              <div className="space-y-3 text-xs">
                <div className="font-semibold">Position & Layers</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onBringForward(primary.id)}
                    className="py-2 rounded-lg border border-neutral-700 hover:bg-neutral-900 font-medium"
                  >
                    Bring Forward
                  </button>
                  <button
                    onClick={() => onSendBackward(primary.id)}
                    className="py-2 rounded-lg border border-neutral-700 hover:bg-neutral-900 font-medium"
                  >
                    Send Backward
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map(
                    (mode) => (
                      <button
                        key={mode}
                        onClick={() => onAlignElements(mode)}
                        className="py-2 rounded-lg border border-neutral-700 capitalize hover:bg-neutral-900"
                      >
                        {mode}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
