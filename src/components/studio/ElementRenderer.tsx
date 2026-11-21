import React, { useEffect, useId, useRef, useState } from 'react';
import { Camera, Pause, Play, Plus, Sparkles } from 'lucide-react';
import type { CanvasElement } from '../../types/studio';
import { getPlayingAudioId, subscribeAudioState, toggleAudioPreview } from '../../utils/audioPlayer';

export interface MockupPreviewPage {
  backgroundColor: string;
  width: number;
  height: number;
  elements: CanvasElement[];
}

interface ElementRendererProps {
  element: CanvasElement;
  isEditing?: boolean;
  isSelected?: boolean;
  onTextChange?: (nextText: string) => void;
  onFinishEditing?: () => void;
  onUpdateElement?: (patch: Partial<CanvasElement>) => void;
  onRequestGridCellPhoto?: (cellIndex: number) => void;
  onRequestFramePhoto?: () => void;
  mockupPreviewPage?: MockupPreviewPage;
  interactive?: boolean;
}

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
  'linear-gradient(135deg, #059669 0%, #0EA5E9 100%)',
  'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
  'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
];

function renderShapeSvg(
  kind: NonNullable<CanvasElement['shapeKind']>,
  fill: string,
  stroke: string,
  strokeWidth: number,
  dash?: string,
) {
  switch (kind) {
    case 'circle':
    case 'oval':
      return (
        <ellipse
          cx="50"
          cy="50"
          rx="48"
          ry="48"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      );
    case 'ring':
      return (
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="transparent"
          stroke={fill !== 'transparent' ? fill : stroke !== 'none' ? stroke : '#0F766E'}
          strokeWidth={Math.max(12, strokeWidth || 12)}
          strokeDasharray={dash}
        />
      );
    case 'triangle':
      return (
        <polygon
          points="50,3 97,97 3,97"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'diamond':
      return (
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'pentagon':
      return (
        <polygon
          points="50,3 96,36 78,94 22,94 4,36"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'hexagon':
      return (
        <polygon
          points="25,4 75,4 98,50 75,96 25,96 2,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'octagon':
      return (
        <polygon
          points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'star':
      return (
        <polygon
          points="50,3 63,36 98,38 70,60 80,95 50,75 20,95 30,60 2,38 37,36"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'heart':
      return (
        <path
          d="M50 88 C18 66 6 46 6 30 C6 16 18 6 32 6 C41 6 47 12 50 18 C53 12 59 6 68 6 C82 6 94 16 94 30 C94 46 82 66 50 88 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'arrow':
      return (
        <polygon
          points="2,32 64,32 64,12 98,50 64,88 64,68 2,68"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'line':
      return (
        <line
          x1="2"
          y1="50"
          x2="98"
          y2="50"
          stroke={fill !== 'transparent' ? fill : stroke !== 'none' ? stroke : '#0F172A'}
          strokeWidth={Math.max(6, strokeWidth || 8)}
          strokeDasharray={dash}
          strokeLinecap="round"
        />
      );
    case 'curve':
      return (
        <path
          d="M 4 75 Q 50 5 96 75"
          fill="none"
          stroke={fill !== 'transparent' ? fill : stroke !== 'none' ? stroke : '#0F172A'}
          strokeWidth={Math.max(6, strokeWidth || 8)}
          strokeDasharray={dash}
          strokeLinecap="round"
        />
      );
    case 'blob':
      return (
        <path
          d="M48,8 C72,6 90,22 93,45 C96,69 78,92 52,94 C26,96 7,76 6,50 C5,24 24,10 48,8 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      );
    case 'half-circle':
      return (
        <path
          d="M 4 82 A 46 46 0 0 1 96 82 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'pill':
      return (
        <rect
          x="3"
          y="16"
          width="94"
          height="68"
          rx="34"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      );
    case 'cross':
      return (
        <polygon
          points="36,4 64,4 64,36 96,36 96,64 64,64 64,96 36,96 36,64 4,64 4,36 36,36"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'cloud':
      return (
        <path
          d="M26,78 H76 C87,78 95,70 95,59 C95,49 87,41 78,40 C75,25 62,15 47,15 C32,15 20,25 18,39 C9,41 4,49 4,58 C4,69 14,78 26,78 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'crescent':
      return (
        <path
          d="M62,10 C38,10 20,28 20,50 C20,72 38,90 62,90 C70,90 78,88 84,84 C68,84 52,70 52,50 C52,30 68,16 84,16 C78,12 70,10 62,10 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    case 'shield':
      return (
        <path
          d="M50,4 L88,18 V46 C88,70 72,88 50,96 C28,88 12,70 12,46 V18 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      );
    default:
      return (
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      );
  }
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isEditing = false,
  isSelected = false,
  onTextChange,
  onFinishEditing,
  onUpdateElement,
  onRequestGridCellPhoto,
  onRequestFramePhoto,
  mockupPreviewPage,
  interactive = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [imgError, setImgError] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(() => getPlayingAudioId());
  const [editingCell, setEditingCell] = useState<{ r: number; c: number; value: string } | null>(
    null,
  );
  const [formValues, setFormValues] = useState<Record<number, string>>({});
  const [formChecks, setFormChecks] = useState<Record<number, boolean>>({ 0: true });

  useEffect(() => {
    setImgError(false);
  }, [element.src]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (element.type !== 'media' || element.mediaKind !== 'audio') return;
    return subscribeAudioState(() => setPlayingAudioId(getPlayingAudioId()));
  }, [element.type, element.mediaKind]);

  if (element.hidden) return null;

  const animClass =
    element.animationEffect && element.animationEffect !== 'none'
      ? `anim-${element.animationEffect}`
      : '';

  const flipTransform =
    element.flipX || element.flipY
      ? `scale(${element.flipX ? -1 : 1}, ${element.flipY ? -1 : 1})`
      : undefined;

  const wrapWithAnimation = (node: React.ReactNode) =>
    animClass ? <div className={`w-full h-full ${animClass}`}>{node}</div> : <>{node}</>;

  // 1. TEXT
  if (element.type === 'text') {
    const effect = element.textEffect || 'none';
    const textShadow =
      effect === 'shadow'
        ? '2px 4px 12px rgba(15, 23, 42, 0.28)'
        : effect === 'lift'
          ? '0px 8px 20px rgba(15, 23, 42, 0.35)'
          : effect === 'echo'
            ? '3px 3px 0px rgba(37, 99, 235, 0.35), 6px 6px 0px rgba(15, 118, 110, 0.2)'
            : undefined;

    const commonStyle: React.CSSProperties = {
      fontFamily: `"${element.fontFamily || 'DM Sans'}", sans-serif`,
      fontSize: `${element.fontSize || 24}px`,
      fontWeight: element.fontWeight || 400,
      fontStyle: element.fontStyle || 'normal',
      textDecoration: element.textDecoration || 'none',
      textTransform: element.textTransform || 'none',
      textAlign: element.textAlign || 'left',
      lineHeight: element.lineHeight || 1.25,
      letterSpacing: `${element.letterSpacing || 0}px`,
      color: effect === 'hollow' ? 'transparent' : element.color || '#0F172A',
      WebkitTextStroke:
        effect === 'hollow' ? `1.5px ${element.color || '#0F172A'}` : undefined,
      textShadow,
      backgroundColor:
        effect === 'background'
          ? element.textHighlightColor || 'rgba(15, 118, 110, 0.14)'
          : undefined,
      padding: effect === 'background' ? '8px 12px' : '2px 4px',
      borderRadius: effect === 'background' ? '6px' : undefined,
      transform: flipTransform,
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
    };

    if (isEditing && interactive) {
      return (
        <textarea
          ref={textareaRef}
          value={element.text || ''}
          onChange={(e) => onTextChange?.(e.target.value)}
          onBlur={() => onFinishEditing?.()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              onFinishEditing?.();
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full h-full resize-none bg-transparent outline-none border-none overflow-hidden"
          style={commonStyle}
        />
      );
    }

    const lines = (element.text || '').split('\n');

    return wrapWithAnimation(
      <div className="w-full h-full select-none overflow-hidden" style={commonStyle}>
        {element.listStyle === 'bullet'
          ? lines.map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span>•</span>
                <span>{line}</span>
              </div>
            ))
          : element.text}
      </div>,
    );
  }

  // 2. IMAGE (Colorful gradient placeholder if external URL fails)
  if (element.type === 'image') {
    const f = element.filters;
    const filterCss = f
      ? `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) blur(${f.blur}px) grayscale(${f.grayscale}%) sepia(${f.sepia}%)`
      : undefined;
    const fallbackBg =
      FALLBACK_GRADIENTS[Math.abs(element.name.length) % FALLBACK_GRADIENTS.length];

    return wrapWithAnimation(
      <div
        className="w-full h-full overflow-hidden flex items-center justify-center"
        style={{
          borderRadius: `${element.borderRadius || 0}px`,
          transform: flipTransform,
          background: fallbackBg,
        }}
      >
        {element.src && !imgError ? (
          <img
            src={element.src}
            alt={element.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            draggable={false}
            onError={() => setImgError(true)}
            className="w-full h-full select-none pointer-events-none"
            style={{
              objectFit: element.objectFit || 'cover',
              filter: filterCss,
            }}
          />
        ) : (
          <div
            className="w-full h-full text-white flex flex-col items-center justify-center p-3 text-center"
            style={{ background: fallbackBg }}
          >
            <Sparkles className="w-6 h-6 mb-1 opacity-90" />
            <span className="text-xs font-bold drop-shadow">{element.name}</span>
          </div>
        )}
      </div>,
    );
  }

  // 3. SHAPES (All 22 shapeKinds)
  if (element.type === 'shape') {
    const kind = element.shapeKind || 'rectangle';
    const fill = element.fillGradient || element.fill || '#0F766E';
    const stroke = element.stroke || 'none';
    const strokeWidth = element.strokeWidth || 0;
    const dash = element.strokeStyle === 'dashed' ? '8 6' : undefined;

    if (kind === 'rectangle' || kind === 'rounded') {
      return wrapWithAnimation(
        <div
          className="w-full h-full"
          style={{
            background: fill,
            borderRadius: `${kind === 'rounded' ? element.borderRadius ?? 20 : element.borderRadius ?? 0}px`,
            border:
              strokeWidth > 0 && stroke !== 'none'
                ? `${strokeWidth}px ${element.strokeStyle || 'solid'} ${stroke}`
                : undefined,
            transform: flipTransform,
          }}
        />,
      );
    }

    return wrapWithAnimation(
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
        style={{ transform: flipTransform }}
      >
        {renderShapeSvg(kind, element.fill || '#0F766E', stroke, strokeWidth, dash)}
      </svg>,
    );
  }

  // 4. FREEHAND PATH
  if (element.type === 'path' && element.svgPath) {
    return wrapWithAnimation(
      <svg
        viewBox={`0 0 ${element.viewBoxWidth || element.width} ${element.viewBoxHeight || element.height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
        style={{ transform: flipTransform }}
      >
        <path
          d={element.svgPath}
          fill="none"
          stroke={element.stroke || '#0F172A'}
          strokeWidth={element.strokeWidth || 4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>,
    );
  }

  // 5. CHARTS (Bar, Pie, Line, Donut — auto-updates from chartData)
  if (element.type === 'chart') {
    const data = element.chartData || [
      { label: 'Q1', value: 120, color: '#0F766E' },
      { label: 'Q2', value: 185, color: '#0D9488' },
      { label: 'Q3', value: 240, color: '#2563EB' },
      { label: 'Q4', value: 310, color: '#0F172A' },
    ];
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const kind = element.chartKind || 'bar';

    if (kind === 'donut' || kind === 'pie') {
      const total = data.reduce((acc, d) => acc + Math.max(0, d.value), 0) || 1;
      let cumulative = 0;
      const isPie = kind === 'pie';
      const radius = isPie ? 25 : 38;
      const circumference = 2 * Math.PI * radius;

      return wrapWithAnimation(
        <div className="w-full h-full rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between select-none">
          <div className="text-base font-semibold text-slate-900 font-display truncate">
            {element.chartTitle || (isPie ? 'Pie Breakdown' : 'Distribution Breakdown')}
          </div>
          <div className="flex items-center justify-around gap-4 flex-1 min-h-0">
            <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0 -rotate-90">
              {data.map((d, idx) => {
                const pct = Math.max(0, d.value) / total;
                const dashLen = pct * circumference;
                const offset = -cumulative * circumference;
                cumulative += pct;
                return (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={d.color || element.fill || '#0F766E'}
                    strokeWidth={isPie ? 50 : 16}
                    strokeDasharray={`${dashLen} ${circumference}`}
                    strokeDashoffset={offset}
                  />
                );
              })}
            </svg>
            <div className="flex flex-col gap-2 text-xs text-slate-700 min-w-0">
              {data.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: d.color || element.fill || '#0F766E' }}
                    />
                    <span className="truncate">{d.label}</span>
                  </div>
                  <span className="font-mono tabular-nums font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>,
      );
    }

    if (kind === 'line') {
      const pts = data.map((d, i) => {
        const px = data.length === 1 ? 150 : 22 + (i / (data.length - 1)) * 256;
        const py = 115 - (Math.max(0, d.value) / maxVal) * 90;
        return { x: px, y: py, d };
      });
      const lineColor = element.fill || data[0]?.color || '#2563EB';
      const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
      const areaPoints = `22,118 ${polyPoints} ${pts[pts.length - 1]?.x || 278},118`;

      return wrapWithAnimation(
        <div className="w-full h-full rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between gap-4">
            <div className="text-base font-semibold text-slate-900 font-display truncate">
              {element.chartTitle || 'Growth Line Chart'}
            </div>
            <span className="text-xs font-mono text-slate-500">
              Peak {maxVal}
            </span>
          </div>
          <svg viewBox="0 0 300 140" className="w-full flex-1 overflow-visible mt-2">
            <line x1="20" y1="25" x2="282" y2="25" stroke="#E2E8F0" strokeDasharray="4 4" />
            <line x1="20" y1="70" x2="282" y2="70" stroke="#E2E8F0" strokeDasharray="4 4" />
            <line x1="20" y1="118" x2="282" y2="118" stroke="#CBD5E1" strokeWidth="1.5" />
            <polygon points={areaPoints} fill={lineColor} fillOpacity="0.14" />
            <polyline
              points={polyPoints}
              fill="none"
              stroke={lineColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pts.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="5.5" fill="#FFFFFF" stroke={p.d.color || lineColor} strokeWidth="3" />
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#0F172A"
                >
                  {p.d.value}
                </text>
                <text
                  x={p.x}
                  y="134"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#475569"
                >
                  {p.d.label}
                </text>
              </g>
            ))}
          </svg>
        </div>,
      );
    }

    return wrapWithAnimation(
      <div className="w-full h-full rounded-xl bg-slate-50 border border-slate-200 p-6 flex flex-col justify-between select-none">
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold text-slate-900 font-display truncate">
            {element.chartTitle || 'Performance Metrics'}
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Total {data.reduce((a, b) => a + b.value, 0)}
          </span>
        </div>
        <div className="flex items-end gap-5 flex-1 pt-6 pb-2">
          {data.map((d, i) => {
            const heightPct = Math.max(8, Math.round((d.value / maxVal) * 100));
            return (
              <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                  {d.value}
                </span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: d.color || element.fill || '#0F766E',
                  }}
                />
                <span className="text-xs font-medium text-slate-600 truncate max-w-full">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>,
    );
  }

  // 6. QR CODE
  if (element.type === 'qrcode') {
    const val = element.qrValue || 'https://p.canva';
    const cells = 11;
    const rects: React.ReactNode[] = [];
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const isTopLeft = r < 3 && c < 3;
        const isTopRight = r < 3 && c >= cells - 3;
        const isBottomLeft = r >= cells - 3 && c < 3;
        const seed = val.charCodeAt((r * 7 + c * 3) % val.length) + r * 11 + c * 5;
        const active = isTopLeft || isTopRight || isBottomLeft || seed % 2 === 0;
        if (active) {
          rects.push(
            <rect
              key={`${r}-${c}`}
              x={c * 10 + 1}
              y={r * 10 + 1}
              width="8.5"
              height="8.5"
              rx="1.5"
              fill={element.color || '#0F172A'}
            />,
          );
        }
      }
    }
    return wrapWithAnimation(
      <div
        className="w-full h-full p-2 rounded-lg border border-slate-200 flex items-center justify-center"
        style={{ backgroundColor: element.fill || '#FFFFFF' }}
      >
        <svg viewBox={`0 0 ${cells * 10} ${cells * 10}`} className="w-full h-full">
          {rects}
        </svg>
      </div>,
    );
  }

  // 7. TABLES & SHEETS (Tap any cell to edit text directly!)
  if (element.type === 'table') {
    const rows = element.tableRows || [
      ['Item', 'Metric', 'Status'],
      ['Design', '100%', 'Ready'],
    ];
    const headerBg = element.tableHeaderBg || element.fill || '#0F172A';

    const commitCellEdit = () => {
      if (!editingCell || !onUpdateElement) {
        setEditingCell(null);
        return;
      }
      const nextRows = rows.map((row, ri) =>
        ri === editingCell.r
          ? row.map((val, ci) => (ci === editingCell.c ? editingCell.value : val))
          : [...row],
      );
      onUpdateElement({ tableRows: nextRows });
      setEditingCell(null);
    };

    const renderCell = (cellText: string, ri: number, ci: number, isHeader: boolean) => {
      const isEditingThis =
        interactive && editingCell?.r === ri && editingCell?.c === ci;
      if (isEditingThis) {
        return (
          <input
            autoFocus
            value={editingCell.value}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onBlur={commitCellEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitCellEdit();
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className={`w-full h-full px-2 py-1 text-xs outline-none rounded ${
              isHeader ? 'bg-white/20 text-white' : 'bg-sky-50 text-slate-900 ring-1 ring-sky-500'
            }`}
          />
        );
      }
      return (
        <div
          onClick={(e) => {
            if (!interactive || !isSelected || !onUpdateElement) return;
            e.stopPropagation();
            setEditingCell({ r: ri, c: ci, value: cellText });
          }}
          title={interactive && isSelected ? 'Tap to edit cell' : undefined}
          className={`px-3 py-2 truncate border-r last:border-r-0 ${
            isHeader ? 'border-white/15' : 'border-slate-200'
          } ${interactive && isSelected ? 'cursor-text hover:bg-black/10' : ''}`}
        >
          {cellText}
        </div>
      );
    };

    return wrapWithAnimation(
      <div className="w-full h-full rounded-xl overflow-hidden border border-slate-300 bg-white flex flex-col select-none shadow-xs">
        <div
          className="grid font-semibold text-white text-xs"
          style={{
            backgroundColor: headerBg,
            gridTemplateColumns: `repeat(${rows[0]?.length || 1}, minmax(0, 1fr))`,
          }}
        >
          {(rows[0] || []).map((cell, ci) => (
            <React.Fragment key={ci}>{renderCell(cell, 0, ci, true)}</React.Fragment>
          ))}
        </div>
        <div className="flex-1 flex flex-col divide-y divide-slate-200">
          {rows.slice(1).map((row, ri) => (
            <div
              key={ri}
              className="grid flex-1 items-center text-xs text-slate-800 even:bg-slate-50"
              style={{
                gridTemplateColumns: `repeat(${row.length || 1}, minmax(0, 1fr))`,
              }}
            >
              {row.map((cell, ci) => (
                <React.Fragment key={ci}>{renderCell(cell, ri + 1, ci, false)}</React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>,
    );
  }

  // 8. FORMS (Interactive checkboxes/inputs when selected)
  if (element.type === 'form') {
    const fields = element.formFields || [{ label: 'Name', placeholder: 'Enter text' }];
    const accent = element.fill || '#0F172A';
    return wrapWithAnimation(
      <div className="w-full h-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col justify-between gap-3 select-none overflow-hidden">
        <div className="text-base font-bold text-slate-900 font-display truncate">
          {element.formTitle || element.name}
        </div>
        <div className="space-y-2.5 flex-1 overflow-hidden">
          {fields.map((f, idx) => {
            const fType = f.fieldType || 'text';
            if (fType === 'checkbox' || fType === 'radio') {
              const checked = Boolean(formChecks[idx]);
              return (
                <button
                  type="button"
                  key={idx}
                  onPointerDown={(e) => isSelected && e.stopPropagation()}
                  onClick={(e) => {
                    if (!interactive || !isSelected) return;
                    e.stopPropagation();
                    setFormChecks((prev) => ({ ...prev, [idx]: !prev[idx] }));
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-left"
                >
                  <span
                    className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 border ${
                      fType === 'radio' ? 'rounded-full' : 'rounded'
                    }`}
                    style={{
                      borderColor: accent,
                      backgroundColor: checked ? accent : '#FFFFFF',
                      color: '#FFFFFF',
                    }}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span className="text-xs font-medium text-slate-800 truncate">{f.label}</span>
                </button>
              );
            }
            return (
              <div key={idx} className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-600 truncate">{f.label}</div>
                {interactive && isSelected ? (
                  <input
                    type="text"
                    value={formValues[idx] ?? ''}
                    placeholder={f.placeholder}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, [idx]: e.target.value }))
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900"
                  />
                ) : (
                  <div className="h-8 px-2.5 rounded-lg border border-slate-300 bg-slate-50 flex items-center text-xs text-slate-400 truncate">
                    {formValues[idx] || f.placeholder}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div
          className="h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: accent }}
        >
          {element.formCta || 'Submit'}
        </div>
      </div>,
    );
  }

  // 9. MOCKUPS (Auto-fits user's live canvas design inside device / merch shell!)
  if (element.type === 'mockup') {
    const kind = element.mockupKind || 'phone';
    const accent = element.fill || '#0F172A';
    const fallbackSrc =
      element.src || '/src/assets/images/photo_product_headphones_1795238221093.jpg';

    const renderAutoFittedDesign = (fitRadius = '6px') => {
      if (!mockupPreviewPage) {
        return (
          <img
            src={fallbackSrc}
            alt={element.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        );
      }
      const nonMockupElements = mockupPreviewPage.elements.filter(
        (el) => el.type !== 'mockup' && !el.hidden,
      );
      if (nonMockupElements.length === 0) {
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
            style={{ backgroundColor: mockupPreviewPage.backgroundColor || '#FFFFFF' }}
          >
            <div className="text-[11px] font-bold text-slate-800">Your Design</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Auto-fits here</div>
          </div>
        );
      }
      const pw = Math.max(100, mockupPreviewPage.width || 1280);
      const ph = Math.max(100, mockupPreviewPage.height || 720);
      const previewScale = Math.min(200 / pw, 200 / ph);

      return (
        <div
          className="w-full h-full relative overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: mockupPreviewPage.backgroundColor || '#FFFFFF',
            borderRadius: fitRadius,
          }}
        >
          <div
            style={{
              width: pw,
              height: ph,
              transform: `scale(${previewScale})`,
              transformOrigin: 'center center',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {nonMockupElements.map((child) => (
              <div
                key={child.id}
                style={{
                  position: 'absolute',
                  left: child.x,
                  top: child.y,
                  width: child.width,
                  height: child.height,
                  opacity: child.opacity ?? 1,
                  transform: `rotate(${child.rotation || 0}deg)`,
                  pointerEvents: 'none',
                }}
              >
                <ElementRenderer element={child} interactive={false} />
              </div>
            ))}
          </div>
        </div>
      );
    };

    if (kind === 'tshirt') {
      return wrapWithAnimation(
        <div className="w-full h-full relative flex items-center justify-center select-none bg-neutral-100 rounded-2xl p-3">
          <svg viewBox="0 0 200 220" className="w-full h-full drop-shadow-md">
            <path
              d="M55,20 L78,20 C84,32 116,32 122,20 L145,20 L190,52 L172,90 L148,78 V202 H52 V78 L28,90 L10,52 Z"
              fill={accent === '#FFFFFF' ? '#F8FAFC' : accent}
              stroke="#CBD5E1"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute w-[44%] h-[42%] top-[30%] rounded-md overflow-hidden shadow-inner border border-black/15">
            {renderAutoFittedDesign('4px')}
          </div>
        </div>,
      );
    }

    if (kind === 'mug') {
      return wrapWithAnimation(
        <div className="w-full h-full relative flex items-center justify-center select-none bg-neutral-100 rounded-2xl p-4">
          <div className="relative w-[70%] h-[78%] flex items-center">
            <div className="w-full h-full rounded-b-3xl rounded-t-lg bg-white border-4 border-slate-300 shadow-lg overflow-hidden p-2 flex items-center justify-center">
              <div className="w-full h-[76%] rounded-lg overflow-hidden border border-slate-200">
                {renderAutoFittedDesign('6px')}
              </div>
            </div>
            <div className="w-7 h-16 border-[6px] border-l-0 border-slate-300 rounded-r-full -ml-1 shrink-0" />
          </div>
        </div>,
      );
    }

    if (kind === 'tote') {
      return wrapWithAnimation(
        <div className="w-full h-full relative flex flex-col items-center justify-end select-none bg-amber-50/70 rounded-2xl p-4">
          <div className="w-20 h-14 border-[5px] border-b-0 border-amber-700/70 rounded-t-full -mb-1" />
          <div className="w-[78%] h-[70%] bg-[#F5EFE6] border-2 border-amber-900/20 rounded-b-xl shadow-md p-3 flex items-center justify-center">
            <div className="w-[82%] h-[78%] rounded overflow-hidden shadow-xs border border-black/10">
              {renderAutoFittedDesign('4px')}
            </div>
          </div>
        </div>,
      );
    }

    if (kind === 'visiting-card') {
      return wrapWithAnimation(
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 p-5 flex items-center justify-center select-none">
          <div className="w-[90%] h-[82%] rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden -rotate-2">
            {renderAutoFittedDesign('8px')}
          </div>
        </div>,
      );
    }

    if (kind === 'poster-wall') {
      return wrapWithAnimation(
        <div className="w-full h-full rounded-2xl bg-gradient-to-b from-stone-200 to-stone-300 p-6 flex items-center justify-center select-none shadow-inner">
          <div className="w-[84%] h-[86%] p-2.5 bg-neutral-900 rounded-md shadow-2xl">
            <div className="w-full h-full bg-white overflow-hidden">
              {renderAutoFittedDesign('0px')}
            </div>
          </div>
        </div>,
      );
    }

    if (kind === 'book') {
      return wrapWithAnimation(
        <div className="w-full h-full rounded-2xl bg-slate-100 p-4 flex items-center justify-center select-none">
          <div className="w-[80%] h-[92%] rounded-r-xl rounded-l-sm bg-white border-l-[10px] border-neutral-800 shadow-2xl overflow-hidden">
            {renderAutoFittedDesign('0px')}
          </div>
        </div>,
      );
    }

    if (kind === 'billboard') {
      return wrapWithAnimation(
        <div className="w-full h-full flex flex-col items-center justify-center select-none p-2">
          <div className="w-full flex-1 rounded-xl border-[6px] border-neutral-800 bg-white overflow-hidden shadow-xl">
            {renderAutoFittedDesign('4px')}
          </div>
          <div className="w-5 h-6 bg-neutral-700" />
          <div className="w-20 h-2 rounded-full bg-neutral-800" />
        </div>,
      );
    }

    if (kind === 'box') {
      return wrapWithAnimation(
        <div className="w-full h-full rounded-2xl bg-slate-100 p-5 flex items-center justify-center select-none">
          <div
            className="w-[82%] h-[82%] rounded-lg shadow-2xl border-r-[14px] border-b-[10px] border-neutral-400/60 overflow-hidden bg-white"
            style={{ transform: 'perspective(500px) rotateY(-8deg)' }}
          >
            {renderAutoFittedDesign('4px')}
          </div>
        </div>,
      );
    }

    if (kind === 'laptop') {
      return wrapWithAnimation(
        <div className="w-full h-full flex flex-col items-center justify-center select-none">
          <div className="w-[88%] flex-1 rounded-t-2xl border-[8px] border-neutral-900 bg-neutral-900 overflow-hidden shadow-xl">
            {renderAutoFittedDesign('4px')}
          </div>
          <div className="w-full h-4 bg-neutral-800 rounded-b-xl border-t border-neutral-700" />
        </div>,
      );
    }

    if (kind === 'browser') {
      return wrapWithAnimation(
        <div className="w-full h-full rounded-xl border border-slate-300 bg-white overflow-hidden shadow-lg flex flex-col select-none">
          <div className="h-7 bg-slate-100 border-b border-slate-200 px-3 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="ml-2 flex-1 h-4 rounded bg-white border border-slate-200 text-[10px] text-slate-400 px-2 flex items-center truncate">
              p.canva/showcase
            </div>
          </div>
          <div className="flex-1 overflow-hidden">{renderAutoFittedDesign('0px')}</div>
        </div>,
      );
    }

    // Phone or Tablet
    return wrapWithAnimation(
      <div
        className={`w-full h-full border-[8px] border-neutral-900 bg-neutral-950 overflow-hidden shadow-xl flex flex-col select-none relative ${
          kind === 'tablet' ? 'rounded-[22px]' : 'rounded-[30px]'
        }`}
      >
        <div className="w-14 h-3 bg-neutral-900 rounded-b-lg mx-auto z-10 shrink-0" />
        <div className="flex-1 overflow-hidden -mt-1">{renderAutoFittedDesign('0px')}</div>
      </div>,
    );
  }

  // 10. FRAMES (12 frame masks + tap to change photo)
  if (element.type === 'frame') {
    const fk = element.frameKind || 'circle';
    const src = element.src || '/src/assets/images/photo_modern_workspace_1795238221169.jpg';
    const fallbackBg =
      FALLBACK_GRADIENTS[Math.abs(element.name.length) % FALLBACK_GRADIENTS.length];

    const clipPath =
      fk === 'hex'
        ? 'polygon(25% 4%, 75% 4%, 98% 50%, 75% 96%, 25% 96%, 2% 50%)'
        : fk === 'diamond'
          ? 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)'
          : fk === 'star'
            ? 'polygon(50% 2%, 63% 35%, 98% 38%, 71% 60%, 80% 95%, 50% 76%, 20% 95%, 29% 60%, 2% 38%, 37% 35%)'
            : undefined;

    const borderRadius =
      fk === 'circle' || fk === 'pill'
        ? '9999px'
        : fk === 'arch'
          ? '9999px 9999px 14px 14px'
          : fk === 'blob'
            ? '62% 38% 46% 54% / 60% 42% 58% 40%'
            : fk === 'rounded'
              ? '26px'
              : fk === 'phone'
                ? '30px'
                : '12px';

    if (fk === 'heart') {
      const heartClipId = `heart-clip-${uid}`;
      return wrapWithAnimation(
        <div className="w-full h-full relative select-none group">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <clipPath id={heartClipId}>
                <path d="M50 88 C18 66 6 46 6 30 C6 16 18 6 32 6 C41 6 47 12 50 18 C53 12 59 6 68 6 C82 6 94 16 94 30 C94 46 82 66 50 88 Z" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${heartClipId})`}>
              <rect width="100" height="100" fill={element.stroke || '#EC4899'} />
              {!imgError && (
                <image
                  href={src}
                  width="100"
                  height="100"
                  preserveAspectRatio="xMidYMid slice"
                  onError={() => setImgError(true)}
                />
              )}
            </g>
            <path
              d="M50 88 C18 66 6 46 6 30 C6 16 18 6 32 6 C41 6 47 12 50 18 C53 12 59 6 68 6 C82 6 94 16 94 30 C94 46 82 66 50 88 Z"
              fill="none"
              stroke={element.stroke || '#FFFFFF'}
              strokeWidth="2.5"
            />
          </svg>
          {interactive && isSelected && onRequestFramePhoto && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRequestFramePhoto();
              }}
              className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/85 border border-white/30 text-white text-[10px] font-semibold flex items-center gap-1 shadow"
            >
              <Camera className="w-3 h-3" />
              <span>Photo</span>
            </button>
          )}
        </div>,
      );
    }

    if (fk === 'polaroid') {
      return wrapWithAnimation(
        <div className="w-full h-full bg-white p-3 pb-10 rounded-lg shadow-xl border border-slate-200 flex flex-col select-none relative">
          <div className="flex-1 overflow-hidden rounded-xs" style={{ background: fallbackBg }}>
            {!imgError ? (
              <img
                src={src}
                alt={element.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {element.name}
              </div>
            )}
          </div>
          <div className="absolute bottom-2 inset-x-3 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600 truncate">
              {element.name}
            </span>
            {interactive && isSelected && onRequestFramePhoto && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestFramePhoto();
                }}
                className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-semibold"
              >
                Change
              </button>
            )}
          </div>
        </div>,
      );
    }

    return wrapWithAnimation(
      <div
        className={`w-full h-full overflow-hidden select-none relative ${
          fk === 'phone' ? 'border-[6px] border-neutral-900 bg-neutral-900' : 'border-2 border-slate-200'
        }`}
        style={{
          borderRadius,
          clipPath,
          background: fallbackBg,
        }}
      >
        {!imgError ? (
          <img
            src={src}
            alt={element.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white p-3 text-center">
            <Camera className="w-6 h-6 mb-1 opacity-90" />
            <span className="text-xs font-bold">{element.name}</span>
          </div>
        )}
        {interactive && isSelected && onRequestFramePhoto && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRequestFramePhoto();
            }}
            className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/85 border border-white/30 text-white text-[10px] font-semibold flex items-center gap-1 shadow"
          >
            <Camera className="w-3 h-3" />
            <span>Photo</span>
          </button>
        )}
      </div>,
    );
  }

  // 11. GRIDS (Tap each box to add/swap photo in that slot!)
  if (element.type === 'grid') {
    const cols = element.gridCols || 2;
    const rows = element.gridRows || 2;
    const total = cols * rows;
    const stockUrls = element.gridImages && element.gridImages.length > 0
      ? element.gridImages
      : [
          '/src/assets/images/photo_modern_workspace_1795238221169.jpg',
          '/src/assets/images/photo_product_headphones_1795238221093.jpg',
          '/src/assets/images/photo_botanical_skincare_1795238221151.jpg',
          '/src/assets/images/photo_abstract_waves_1795238220934.jpg',
        ];

    return wrapWithAnimation(
      <div
        className="w-full h-full grid gap-2 p-1.5 bg-white rounded-xl select-none"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: total }).map((_, idx) => {
          const cellSrc = stockUrls[idx % stockUrls.length];
          const grad = FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
          return (
            <div
              key={idx}
              onClick={(e) => {
                if (!interactive || !isSelected || !onRequestGridCellPhoto) return;
                e.stopPropagation();
                onRequestGridCellPhoto(idx);
              }}
              style={{ background: grad }}
              className={`w-full h-full rounded-lg overflow-hidden relative group ${
                interactive && isSelected ? 'cursor-pointer ring-1 ring-black/15' : ''
              }`}
            >
              {cellSrc && (
                <img
                  src={cellSrc}
                  alt={`Grid slot ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover"
                />
              )}
              {interactive && isSelected && onRequestGridCellPhoto && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestGridCellPhoto(idx);
                  }}
                  className="absolute bottom-1.5 right-1.5 px-2 py-1 rounded-md bg-black/80 text-white text-[10px] font-semibold flex items-center gap-1 shadow"
                >
                  <Plus className="w-3 h-3" />
                  <span>Photo</span>
                </button>
              )}
            </div>
          );
        })}
      </div>,
    );
  }

  // 12. MEDIA (Video with Play/Pause, Audio with Web Audio Synth Play/Pause, Animation badge)
  if (element.type === 'media') {
    const mk = element.mediaKind || 'video';
    const accent = element.fill || '#0F172A';

    if (mk === 'audio') {
      const isPlaying = playingAudioId === element.id;
      return wrapWithAnimation(
        <div
          className="w-full h-full rounded-2xl px-4 py-3 flex items-center gap-3 text-white select-none shadow-md"
          style={{ backgroundColor: accent }}
        >
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive) toggleAudioPreview(element.id, element.audioMood || 'Background Music');
            }}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shrink-0 hover:scale-105 transition-transform"
            title={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">{element.name}</div>
            <div className="flex items-end gap-1 h-5 mt-1">
              {[40, 80, 55, 95, 70, 45, 90, 60, 75, 50, 85, 45, 70, 95, 65].map((h, i) => (
                <span
                  key={i}
                  className={`flex-1 rounded-full bg-white/85 transition-all ${
                    isPlaying ? 'animate-pulse' : ''
                  }`}
                  style={{ height: `${isPlaying ? ((h + i * 17) % 85) + 15 : h}%` }}
                />
              ))}
            </div>
          </div>
          <span className="text-[11px] font-mono opacity-85 shrink-0">
            {isPlaying ? 'PLAYING' : element.mediaDuration || '01:20'}
          </span>
        </div>,
      );
    }

    if (mk === 'animation') {
      return (
        <div
          className={`w-full h-full rounded-2xl px-4 py-2 flex items-center justify-center gap-2.5 text-white font-display font-bold text-base shadow-lg select-none ${
            animClass || 'anim-pulse'
          }`}
          style={{ backgroundColor: accent }}
        >
          <span>✦</span>
          <span className="truncate">{element.name}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20">
            {element.mediaDuration || 'LOOP'}
          </span>
        </div>
      );
    }

    // Video card with working Play / Pause toggle + motion scrub bar
    const fallbackGrad = FALLBACK_GRADIENTS[Math.abs(element.name.length) % FALLBACK_GRADIENTS.length];
    return wrapWithAnimation(
      <div
        className="w-full h-full rounded-2xl overflow-hidden relative shadow-lg select-none"
        style={{ background: fallbackGrad }}
      >
        {element.src && !imgError && (
          <img
            src={element.src}
            alt={element.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover opacity-85 transition-transform duration-700 ${
              videoPlaying ? 'anim-video-play' : ''
            }`}
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-white p-3">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive) setVideoPlaying((p) => !p);
            }}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-lg mb-2 hover:scale-105 transition-transform"
            title={videoPlaying ? 'Pause video' : 'Play video'}
          >
            {videoPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <div className="text-xs font-semibold truncate max-w-full drop-shadow">{element.name}</div>
          <div className="text-[10px] font-mono opacity-90 mt-0.5">
            {videoPlaying ? 'Playing loop · ' : ''}
            {element.mediaDuration || '00:15'}
          </div>
          {videoPlaying && (
            <div className="w-2/3 h-1 rounded-full bg-white/30 mt-2 overflow-hidden">
              <div className="h-full w-1/2 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>,
    );
  }

  // 13. GRAPHICS (540 SVG Graphics + 108 3D Objects)
  if (element.type === 'graphic') {
    const color = element.fill || '#0F766E';
    const variant = element.graphicVariant || 'badge';

    if (element.is3D) {
      const emoji = element.graphicEmoji || '◆';
      const isSphere = variant === 'sphere3d' || variant === 'torus3d';
      return wrapWithAnimation(
        <div className="w-full h-full flex items-center justify-center select-none">
          <div
            className={`w-[84%] h-[84%] flex flex-col items-center justify-center text-white font-display font-bold text-xs p-3 text-center ${
              isSphere ? 'rounded-full' : 'rounded-3xl'
            }`}
            style={{
              background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 55%), ${color}`,
              boxShadow:
                '0 20px 32px -10px rgba(0,0,0,0.5), inset 0 8px 16px rgba(255,255,255,0.4), inset 0 -12px 18px rgba(0,0,0,0.3)',
              transform: flipTransform || 'perspective(500px) rotateX(8deg) rotateY(-10deg)',
            }}
          >
            <span className="text-4xl leading-none mb-1 drop-shadow-md">{emoji}</span>
            <span className="truncate max-w-full text-[11px] opacity-95 drop-shadow">
              {element.name}
            </span>
          </div>
        </div>,
      );
    }

    if (element.graphicSvgPath) {
      const isStrokeOnly = variant === 'svg-stroke' || (element.strokeWidth || 0) > 0;
      return wrapWithAnimation(
        <div
          className="w-full h-full flex items-center justify-center select-none"
          style={{ transform: flipTransform }}
        >
          <svg
            viewBox={element.graphicSvgViewBox || '0 0 100 100'}
            className="w-full h-full overflow-visible"
          >
            <path
              d={element.graphicSvgPath}
              fill={isStrokeOnly ? 'none' : color}
              stroke={isStrokeOnly ? element.stroke || color : 'none'}
              strokeWidth={isStrokeOnly ? element.strokeWidth || 7 : 0}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>,
      );
    }

    return wrapWithAnimation(
      <div className="w-full h-full flex items-center justify-center select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {variant === 'starburst' ? (
            <polygon
              points="50,2 62,28 90,18 76,44 98,60 72,68 78,96 52,80 28,96 32,68 4,60 26,44 12,18 40,28"
              fill={color}
            />
          ) : variant === 'wave' ? (
            <path
              d="M6,50 Q25,15 44,50 T82,50 T96,50"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
            />
          ) : variant === 'target' ? (
            <>
              <circle cx="50" cy="50" r="45" fill={color} />
              <circle cx="50" cy="50" r="30" fill="#FFFFFF" />
              <circle cx="50" cy="50" r="15" fill={color} />
            </>
          ) : (
            <>
              <circle cx="50" cy="50" r="45" fill={color} />
              <path
                d="M32 52 L45 65 L70 36"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      </div>,
    );
  }

  return null;
};
