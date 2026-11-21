import React, { useState } from 'react';
import {
  Copy,
  FileText,
  Grid2x2,
  Maximize,
  Plus,
  Ruler,
  Trash2,
} from 'lucide-react';
import type { DesignPage } from '../../types/studio';

interface BottomPageBarProps {
  pages: DesignPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onUpdatePageNotes: (notes: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  onOpenGridView: () => void;
}

export const BottomPageBar: React.FC<BottomPageBarProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onUpdatePageNotes,
  zoom,
  onZoomChange,
  onFitToScreen,
  showGuides,
  onToggleGuides,
  onOpenGridView,
}) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  return (
    <footer className="h-11 mb-16 shrink-0 bg-black border-t border-neutral-800 px-3 flex items-center justify-between gap-3 z-20 select-none relative text-white">
      {notesOpen && activePage && (
        <div className="absolute bottom-14 left-3 w-80 bg-black border border-neutral-700 rounded-2xl shadow-2xl p-3.5 z-40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">
              Notes · {activePage.title}
            </span>
            <button
              onClick={() => setNotesOpen(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <textarea
            value={activePage.notes}
            onChange={(e) => onUpdatePageNotes(e.target.value)}
            rows={4}
            placeholder="Add notes for this page..."
            className="w-full text-xs p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-white outline-none focus:border-white"
          />
        </div>
      )}

      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto">
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className={`h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            notesOpen ? 'bg-white text-black' : 'text-neutral-300 hover:bg-neutral-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Notes</span>
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {pages.map((page, index) => {
            const isActive = page.id === activePageId;
            return (
              <div
                key={page.id}
                className={`h-8 pl-2.5 pr-1.5 rounded-lg border flex items-center gap-1.5 text-xs shrink-0 ${
                  isActive
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                <button
                  onClick={() => onSelectPage(page.id)}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="font-mono tabular-nums opacity-70">{index + 1}</span>
                  <span className="max-w-[96px] truncate">{page.title}</span>
                </button>
                {isActive && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      onClick={() => onDuplicatePage(page.id)}
                      title="Duplicate page"
                      className="p-0.5 rounded hover:bg-black/10"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={() => onDeletePage(page.id)}
                        title="Delete page"
                        className="p-0.5 rounded hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={onAddPage}
            className="h-8 px-2.5 rounded-lg border border-dashed border-neutral-700 text-xs font-medium text-neutral-300 hover:border-white hover:text-white flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add page</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleGuides}
          className={`h-8 px-2 rounded-lg text-xs font-medium hidden sm:flex items-center gap-1.5 whitespace-nowrap ${
            showGuides ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-900'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Guides</span>
        </button>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min={20}
            max={200}
            step={5}
            value={Math.round(zoom * 100)}
            onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
            aria-label="Zoom level"
            className="w-16 sm:w-24 accent-white cursor-pointer"
          />
          <button
            onClick={onFitToScreen}
            title="Fit to screen"
            className="h-8 px-2 rounded-lg text-xs font-mono tabular-nums font-medium text-white hover:bg-neutral-900 flex items-center gap-1"
          >
            <span>{Math.round(zoom * 100)}%</span>
            <Maximize className="w-3 h-3 text-neutral-400" />
          </button>
        </div>

        <button
          onClick={onOpenGridView}
          className="h-8 px-2.5 rounded-lg text-xs font-medium text-white hover:bg-neutral-900 flex items-center gap-1.5 shrink-0"
        >
          <Grid2x2 className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">{pages.length}</span>
        </button>
      </div>
    </footer>
  );
};
