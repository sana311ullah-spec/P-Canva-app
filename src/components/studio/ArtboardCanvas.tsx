import React, { useRef, useState } from 'react';
import {
  Bold,
  Check,
  Italic,
  MessageSquarePlus,
  RotateCw,
  Trash2,
  Underline,
} from 'lucide-react';
import { FONT_OPTIONS } from '../../data/seedWorkspace';
import type {
  CanvasElement,
  CollaboratorPresence,
  CommentThread,
  DesignPage,
} from '../../types/studio';
import type { DrawToolSettings } from './LeftObjectDock';
import { ElementRenderer } from './ElementRenderer';

interface ArtboardCanvasProps {
  page: DesignPage;
  artboardWidth: number;
  artboardHeight: number;
  zoom: number;
  showGuides: boolean;
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  onUpdateElement: (id: string, patch: Partial<CanvasElement>, commitHistory?: boolean) => void;
  onCommitSnapshot: () => void;
  onAddFreehandPath: (el: Omit<CanvasElement, 'id'>) => void;
  drawSettings: DrawToolSettings;
  commentMode: boolean;
  comments: CommentThread[];
  activeCommentId: string | null;
  onCreatePinComment: (x: number, y: number) => void;
  onSelectCommentPin: (commentId: string) => void;
  remotePresence: CollaboratorPresence[];
  onCursorMove: (x: number | null, y: number | null) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onRequestGridCellPhoto?: (elementId: string, cellIndex: number) => void;
  onRequestFramePhoto?: (elementId: string) => void;
}

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const ArtboardCanvas: React.FC<ArtboardCanvasProps> = ({
  page,
  artboardWidth,
  artboardHeight,
  zoom,
  showGuides,
  selectedIds,
  onSelectIds,
  onUpdateElement,
  onCommitSnapshot,
  onAddFreehandPath,
  drawSettings,
  commentMode,
  comments,
  activeCommentId,
  onCreatePinComment,
  onSelectCommentPin,
  remotePresence,
  onCursorMove,
  onDuplicateSelected,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  onRequestGridCellPhoto,
  onRequestFramePhoto,
}) => {
  const artboardRef = useRef<HTMLDivElement | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const [marquee, setMarquee] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);
  const [rotateAngleTooltip, setRotateAngleTooltip] = useState<number | null>(null);

  const getArtboardCoords = (clientX: number, clientY: number) => {
    const rect = artboardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  const handleArtboardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setContextMenu(null);
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const coords = getArtboardCoords(e.clientX, e.clientY);

    if (commentMode) {
      onCreatePinComment(Math.round(coords.x), Math.round(coords.y));
      return;
    }

    if (drawSettings.active) {
      setDrawingPoints([coords]);
      const handleDrawMove = (mv: PointerEvent) => {
        const pt = getArtboardCoords(mv.clientX, mv.clientY);
        setDrawingPoints((prev) => [...prev, pt]);
      };
      const handleDrawUp = () => {
        window.removeEventListener('pointermove', handleDrawMove);
        window.removeEventListener('pointerup', handleDrawUp);
        setDrawingPoints((pts) => {
          if (pts.length > 2) {
            const xs = pts.map((p) => p.x);
            const ys = pts.map((p) => p.y);
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const w = Math.max(12, Math.max(...xs) - minX);
            const h = Math.max(12, Math.max(...ys) - minY);
            const pathD = pts
              .map(
                (p, idx) =>
                  `${idx === 0 ? 'M' : 'L'} ${(p.x - minX).toFixed(1)} ${(p.y - minY).toFixed(1)}`,
              )
              .join(' ');
            onAddFreehandPath({
              type: 'path',
              name: `${drawSettings.mode} stroke`,
              x: minX,
              y: minY,
              width: w,
              height: h,
              viewBoxWidth: w,
              viewBoxHeight: h,
              rotation: 0,
              opacity: drawSettings.mode === 'highlighter' ? 0.45 : 1,
              locked: false,
              hidden: false,
              stroke: drawSettings.color,
              strokeWidth: drawSettings.strokeWidth,
              svgPath: pathD,
            });
          }
          return [];
        });
      };
      window.addEventListener('pointermove', handleDrawMove);
      window.addEventListener('pointerup', handleDrawUp);
      return;
    }

    // Marquee selection on empty canvas
    setEditingTextId(null);
    onSelectIds([]);
    const startX = coords.x;
    const startY = coords.y;

    const handleMove = (mv: PointerEvent) => {
      const cur = getArtboardCoords(mv.clientX, mv.clientY);
      setMarquee({ x1: startX, y1: startY, x2: cur.x, y2: cur.y });
    };

    const handleUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      const end = getArtboardCoords(upEv.clientX, upEv.clientY);
      const left = Math.min(startX, end.x);
      const top = Math.min(startY, end.y);
      const right = Math.max(startX, end.x);
      const bottom = Math.max(startY, end.y);

      if (right - left > 6 && bottom - top > 6) {
        const hits = page.elements
          .filter(
            (el) =>
              !el.hidden &&
              !el.locked &&
              el.x + el.width >= left &&
              el.x <= right &&
              el.y + el.height >= top &&
              el.y <= bottom,
          )
          .map((el) => el.id);
        onSelectIds(hits);
      }
      setMarquee(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleElementPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    e.stopPropagation();
    setContextMenu(null);

    if (commentMode) {
      const coords = getArtboardCoords(e.clientX, e.clientY);
      onCreatePinComment(Math.round(coords.x), Math.round(coords.y));
      return;
    }

    if (drawSettings.active) return;

    if (editingTextId === el.id) return;

    const wasAlreadySelected = selectedIds.includes(el.id);

    if (e.shiftKey) {
      if (wasAlreadySelected) {
        onSelectIds(selectedIds.filter((id) => id !== el.id));
      } else {
        onSelectIds([...selectedIds, el.id]);
      }
    } else if (!wasAlreadySelected) {
      onSelectIds([el.id]);
    }

    if (el.locked) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = el.x;
    const startY = el.y;
    let moved = false;

    const handleDragMove = (mv: PointerEvent) => {
      const dx = (mv.clientX - startClientX) / zoom;
      const dy = (mv.clientY - startClientY) / zoom;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;

      let nextX = startX + dx;
      let nextY = startY + dy;

      const SNAP_THRESHOLD = 7;
      let snapX: number | null = null;
      let snapY: number | null = null;

      const elCenterX = nextX + el.width / 2;
      const elCenterY = nextY + el.height / 2;

      if (Math.abs(elCenterX - artboardWidth / 2) < SNAP_THRESHOLD) {
        nextX = artboardWidth / 2 - el.width / 2;
        snapX = artboardWidth / 2;
      }
      if (Math.abs(elCenterY - artboardHeight / 2) < SNAP_THRESHOLD) {
        nextY = artboardHeight / 2 - el.height / 2;
        snapY = artboardHeight / 2;
      }

      for (const other of page.elements) {
        if (other.id === el.id || other.hidden) continue;
        if (Math.abs(nextX - other.x) < SNAP_THRESHOLD) {
          nextX = other.x;
          snapX = other.x;
        }
        if (Math.abs(nextY - other.y) < SNAP_THRESHOLD) {
          nextY = other.y;
          snapY = other.y;
        }
      }

      setSnapLines({ x: snapX, y: snapY });
      onUpdateElement(el.id, { x: Math.round(nextX), y: Math.round(nextY) }, false);
    };

    const handleDragUp = () => {
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragUp);
      setSnapLines({ x: null, y: null });
      if (moved) {
        onCommitSnapshot();
      } else if (el.type === 'text' && wasAlreadySelected) {
        // Second tap or click on already-selected text immediately enters inline editing + keyboard toolbar
        setEditingTextId(el.id);
      }
    };

    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragUp);
  };

  const handleResizeStart = (
    e: React.PointerEvent,
    el: CanvasElement,
    dir: HandleDir,
  ) => {
    e.stopPropagation();
    if (el.locked) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const orig = { x: el.x, y: el.y, width: el.width, height: el.height };
    const ratio = orig.width / Math.max(1, orig.height);

    const handleMove = (mv: PointerEvent) => {
      const dx = (mv.clientX - startClientX) / zoom;
      const dy = (mv.clientY - startClientY) / zoom;

      let { x, y, width, height } = orig;

      if (dir.includes('e')) width = Math.max(24, orig.width + dx);
      if (dir.includes('s')) height = Math.max(20, orig.height + dy);
      if (dir.includes('w')) {
        const nextW = Math.max(24, orig.width - dx);
        x = orig.x + (orig.width - nextW);
        width = nextW;
      }
      if (dir.includes('n')) {
        const nextH = Math.max(20, orig.height - dy);
        y = orig.y + (orig.height - nextH);
        height = nextH;
      }

      if (mv.shiftKey && (dir === 'nw' || dir === 'ne' || dir === 'se' || dir === 'sw')) {
        height = Math.round(width / ratio);
      }

      onUpdateElement(
        el.id,
        {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        },
        false,
      );
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      onCommitSnapshot();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleRotateStart = (e: React.PointerEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (el.locked) return;

    const rect = artboardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + (el.x + el.width / 2) * zoom;
    const cy = rect.top + (el.y + el.height / 2) * zoom;

    const handleMove = (mv: PointerEvent) => {
      const angleRad = Math.atan2(mv.clientY - cy, mv.clientX - cx);
      let deg = Math.round((angleRad * 180) / Math.PI + 90);
      if (mv.shiftKey) deg = Math.round(deg / 15) * 15;
      setRotateAngleTooltip(deg);
      onUpdateElement(el.id, { rotation: deg }, false);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      setRotateAngleTooltip(null);
      onCommitSnapshot();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const singleSelected =
    selectedIds.length === 1
      ? page.elements.find((el) => el.id === selectedIds[0]) || null
      : null;

  const editingElement = editingTextId
    ? page.elements.find((el) => el.id === editingTextId) || null
    : null;

  return (
    <div
      className="flex-1 studio-grid-bg overflow-auto flex items-center justify-center p-4 sm:p-8 relative"
      onPointerMove={(e) => {
        if (!artboardRef.current) return;
        const rect = artboardRef.current.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / zoom);
        const y = Math.round((e.clientY - rect.top) / zoom);
        if (x >= 0 && y >= 0 && x <= artboardWidth && y <= artboardHeight) {
          onCursorMove(x, y);
        }
      }}
      onPointerLeave={() => onCursorMove(null, null)}
    >
      {/* Scaled Artboard Container */}
      <div
        ref={artboardRef}
        onPointerDown={handleArtboardPointerDown}
        style={{
          width: artboardWidth * zoom,
          height: artboardHeight * zoom,
          cursor: commentMode
            ? 'crosshair'
            : drawSettings.active
              ? 'crosshair'
              : 'default',
        }}
        className="relative shadow-2xl ring-1 ring-white/10 shrink-0 touch-none print-artboard"
      >
        <div
          style={{
            width: artboardWidth,
            height: artboardHeight,
            backgroundColor: page.backgroundColor || '#FFFFFF',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
          className="relative overflow-hidden"
        >
          {showGuides && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-12 border border-dashed border-neutral-400/40" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-neutral-400/20" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-neutral-400/20" />
            </div>
          )}

          {page.elements.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            const isEditing = editingTextId === el.id;

            return (
              <div
                key={el.id}
                onPointerDown={(e) => handleElementPointerDown(e, el)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (el.type === 'text' && !el.locked) {
                    setEditingTextId(el.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectIds([el.id]);
                  setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
                }}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  opacity: el.opacity ?? 1,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  cursor: el.locked ? 'not-allowed' : isEditing ? 'text' : 'move',
                }}
                className={
                  isSelected && !isEditing
                    ? 'outline outline-2 outline-black ring-2 ring-white/80 touch-none'
                    : 'hover:outline hover:outline-1 hover:outline-neutral-500/60 touch-none'
                }
              >
                <ElementRenderer
                  element={el}
                  isEditing={isEditing}
                  isSelected={isSelected}
                  onTextChange={(nextText) => onUpdateElement(el.id, { text: nextText }, false)}
                  onFinishEditing={() => {
                    // Keep active if interacting with keyboard-top toolbar; blur handled via Done or canvas click
                  }}
                  onUpdateElement={(patch) => onUpdateElement(el.id, patch, true)}
                  onRequestGridCellPhoto={
                    onRequestGridCellPhoto
                      ? (cellIdx) => onRequestGridCellPhoto(el.id, cellIdx)
                      : undefined
                  }
                  onRequestFramePhoto={
                    onRequestFramePhoto ? () => onRequestFramePhoto(el.id) : undefined
                  }
                  mockupPreviewPage={{
                    backgroundColor: page.backgroundColor,
                    width: artboardWidth,
                    height: artboardHeight,
                    elements: page.elements,
                  }}
                />
              </div>
            );
          })}

          {drawingPoints.length > 1 && (
            <svg
              viewBox={`0 0 ${artboardWidth} ${artboardHeight}`}
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            >
              <path
                d={drawingPoints
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ')}
                fill="none"
                stroke={drawSettings.color}
                strokeWidth={drawSettings.strokeWidth}
                strokeOpacity={drawSettings.mode === 'highlighter' ? 0.45 : 1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {snapLines.x !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-rose-500 pointer-events-none z-30"
              style={{ left: snapLines.x }}
            />
          )}
          {snapLines.y !== null && (
            <div
              className="absolute left-0 right-0 h-px bg-rose-500 pointer-events-none z-30"
              style={{ top: snapLines.y }}
            />
          )}

          {marquee && (
            <div
              className="absolute border border-black bg-black/10 pointer-events-none z-30"
              style={{
                left: Math.min(marquee.x1, marquee.x2),
                top: Math.min(marquee.y1, marquee.y2),
                width: Math.abs(marquee.x2 - marquee.x1),
                height: Math.abs(marquee.y2 - marquee.y1),
              }}
            />
          )}
        </div>

        {/* Unscaled Touch-Friendly Selection Handles */}
        {singleSelected && !editingTextId && !singleSelected.locked && (
          <div
            style={{
              position: 'absolute',
              left: singleSelected.x * zoom,
              top: singleSelected.y * zoom,
              width: singleSelected.width * zoom,
              height: singleSelected.height * zoom,
              transform: `rotate(${singleSelected.rotation || 0}deg)`,
              pointerEvents: 'none',
            }}
            className="z-20"
          >
            {(
              [
                ['nw', '-top-2 -left-2 cursor-nwse-resize'],
                ['n', '-top-2 left-1/2 -translate-x-1/2 cursor-ns-resize'],
                ['ne', '-top-2 -right-2 cursor-nesw-resize'],
                ['e', 'top-1/2 -right-2 -translate-y-1/2 cursor-ew-resize'],
                ['se', '-bottom-2 -right-2 cursor-nwse-resize'],
                ['s', '-bottom-2 left-1/2 -translate-x-1/2 cursor-ns-resize'],
                ['sw', '-bottom-2 -left-2 cursor-nesw-resize'],
                ['w', 'top-1/2 -left-2 -translate-y-1/2 cursor-ew-resize'],
              ] as [HandleDir, string][]
            ).map(([dir, posClass]) => (
              <div
                key={dir}
                onPointerDown={(e) => handleResizeStart(e, singleSelected, dir)}
                style={{ pointerEvents: 'auto' }}
                className={`absolute w-4 h-4 rounded-full bg-white border-2 border-black shadow-md touch-none ${posClass}`}
              />
            ))}

            {/* Quick Tap "Edit Text" Pill Button if text selected */}
            {singleSelected.type === 'text' && (
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setEditingTextId(singleSelected.id);
                }}
                style={{ pointerEvents: 'auto' }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 h-8 px-3 rounded-lg bg-black border border-neutral-700 text-white text-xs font-semibold shadow-lg whitespace-nowrap"
              >
                Edit text
              </button>
            )}

            {/* Rotation Handle */}
            <div
              onPointerDown={(e) => handleRotateStart(e, singleSelected)}
              style={{ pointerEvents: 'auto' }}
              title="Rotate element"
              className="absolute -bottom-9 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-2 border-black shadow flex items-center justify-center cursor-grab text-black touch-none"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </div>

            {rotateAngleTooltip !== null && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black text-white text-[11px] font-mono tabular-nums whitespace-nowrap border border-neutral-700">
                {rotateAngleTooltip}°
              </div>
            )}
          </div>
        )}

        {/* Canvas Comment Pins */}
        {comments
          .filter((c) => c.pageId === page.id && c.pinX !== null && c.pinY !== null && !c.resolved)
          .map((c, idx) => (
            <button
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCommentPin(c.id);
              }}
              style={{
                left: (c.pinX || 0) * zoom,
                top: (c.pinY || 0) * zoom,
              }}
              title={`${c.authorName}: ${c.text}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full font-mono text-xs font-bold shadow-md flex items-center justify-center border-2 border-white transition-transform z-30 ${
                activeCommentId === c.id
                  ? 'bg-emerald-600 text-white scale-110'
                  : 'bg-black text-white hover:scale-105'
              }`}
            >
              {idx + 1}
            </button>
          ))}

        {/* Live Remote Collaborator Cursors */}
        {remotePresence
          .filter((p) => p.pageId === page.id && p.cursorX !== null && p.cursorY !== null)
          .map((p) => (
            <div
              key={p.clientId}
              style={{
                left: (p.cursorX || 0) * zoom,
                top: (p.cursorY || 0) * zoom,
              }}
              className="absolute pointer-events-none z-40 transition-transform duration-75"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M1 1L6.5 14L8.8 8.8L14 6.5L1 1Z"
                  fill={p.color}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </svg>
              <div
                className="ml-3 -mt-1 px-2 py-0.5 rounded text-[11px] font-medium text-white whitespace-nowrap shadow-sm"
                style={{ backgroundColor: p.color }}
              >
                {p.name}
              </div>
            </div>
          ))}
      </div>

      {/* On-Top-of-Keyboard Text Formatting Toolbar when editing text */}
      {editingElement && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed bottom-14 md:bottom-16 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-auto md:max-w-2xl bg-black border border-neutral-700 rounded-2xl shadow-2xl px-3 py-2 flex items-center gap-2 overflow-x-auto z-50"
        >
          <select
            value={editingElement.fontFamily || 'DM Sans'}
            onChange={(e) =>
              onUpdateElement(editingElement.id, { fontFamily: e.target.value })
            }
            className="h-10 px-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-medium shrink-0 outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            value={editingElement.fontSize || 48}
            onChange={(e) =>
              onUpdateElement(editingElement.id, { fontSize: Number(e.target.value) })
            }
            className="h-10 px-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-mono shrink-0 outline-none"
          >
            {[16, 20, 24, 32, 40, 48, 56, 64, 72, 96, 120, 150].map((pt) => (
              <option key={pt} value={pt}>
                {pt} pt
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              onUpdateElement(editingElement.id, {
                fontWeight: (editingElement.fontWeight || 400) >= 700 ? 400 : 700,
              })
            }
            className={`min-w-[44px] h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              (editingElement.fontWeight || 400) >= 700
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-white border-neutral-700'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              onUpdateElement(editingElement.id, {
                fontStyle: editingElement.fontStyle === 'italic' ? 'normal' : 'italic',
              })
            }
            className={`min-w-[44px] h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              editingElement.fontStyle === 'italic'
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-white border-neutral-700'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              onUpdateElement(editingElement.id, {
                textDecoration:
                  editingElement.textDecoration === 'underline' ? 'none' : 'underline',
              })
            }
            className={`min-w-[44px] h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              editingElement.textDecoration === 'underline'
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-white border-neutral-700'
            }`}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>

          <input
            type="color"
            value={editingElement.color || '#0F172A'}
            onChange={(e) => onUpdateElement(editingElement.id, { color: e.target.value })}
            className="w-10 h-10 rounded-xl border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
            title="Text color"
          />

          <button
            onClick={() => {
              onDeleteSelected();
              setEditingTextId(null);
            }}
            className="min-w-[44px] h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-rose-400 flex items-center justify-center shrink-0"
            title="Delete text"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setEditingTextId(null);
              onCommitSnapshot();
            }}
            className="h-10 px-3.5 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      )}

      {commentMode && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-white text-xs font-medium flex items-center gap-2 shadow-lg z-40">
          <MessageSquarePlus className="w-4 h-4" />
          <span>Tap anywhere on canvas to pin feedback</span>
        </div>
      )}

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed w-48 bg-black border border-neutral-800 rounded-xl shadow-xl py-1.5 z-50 text-xs text-white"
          >
            <button
              onClick={() => {
                setContextMenu(null);
                onDuplicateSelected();
              }}
              className="w-full px-3.5 py-2.5 text-left hover:bg-neutral-900"
            >
              Duplicate
            </button>
            <button
              onClick={() => {
                const id = contextMenu.elementId;
                setContextMenu(null);
                onBringForward(id);
              }}
              className="w-full px-3.5 py-2.5 text-left hover:bg-neutral-900"
            >
              Bring Forward
            </button>
            <button
              onClick={() => {
                const id = contextMenu.elementId;
                setContextMenu(null);
                onSendBackward(id);
              }}
              className="w-full px-3.5 py-2.5 text-left hover:bg-neutral-900"
            >
              Send Backward
            </button>
            <div className="my-1 border-t border-neutral-800" />
            <button
              onClick={() => {
                setContextMenu(null);
                onDeleteSelected();
              }}
              className="w-full px-3.5 py-2.5 text-left text-rose-400 hover:bg-neutral-900"
            >
              Delete Element
            </button>
          </div>
        </>
      )}
    </div>
  );
};
