import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  FolderKanban,
  Home,
  Layers,
  Maximize2,
  MessageSquare,
  PenTool,
  Play,
  Redo2,
  Scaling,
  Share2,
  Undo2,
} from 'lucide-react';
import type {
  ApprovalStatus,
  CollaboratorPresence,
  DesignProject,
  PMTicket,
  TeamMember,
} from '../../types/studio';

interface TopStudioBarProps {
  design: DesignProject;
  linkedTickets: PMTicket[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onTitleChange: (title: string) => void;
  onApprovalChange: (status: ApprovalStatus) => void;
  onGoHome: () => void;
  onOpenResize: () => void;
  onOpenShareExport: () => void;
  onStartPresent: () => void;
  onSaveSnapshot: () => void;
  onCreateNewDesign: () => void;
  commentMode: boolean;
  onToggleCommentMode: () => void;
  rightTab: 'comments' | 'workflow' | 'pm' | null;
  onSelectRightTab: (tab: 'comments' | 'workflow' | 'pm') => void;
  unresolvedCommentsCount: number;
  presence: CollaboratorPresence[];
  currentUser: TeamMember;
  team: TeamMember[];
  onSwitchUser: (member: TeamMember) => void;
  connected: boolean;
  drawActive?: boolean;
  onToggleDraw?: () => void;
  onOpenLayers?: () => void;
}

export const TopStudioBar: React.FC<TopStudioBarProps> = ({
  design,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onTitleChange,
  onGoHome,
  onOpenResize,
  onOpenShareExport,
  onStartPresent,
  onSaveSnapshot,
  onCreateNewDesign,
  commentMode,
  onToggleCommentMode,
  onSelectRightTab,
  unresolvedCommentsCount,
  drawActive = false,
  onToggleDraw,
  onOpenLayers,
}) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

  return (
    <header className="h-14 shrink-0 bg-black border-b border-neutral-800 px-2 sm:px-3 flex items-center justify-between gap-2 z-30 select-none text-white">
      {/* Left: Home + Undo + Redo + File + Resize */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          onClick={onGoHome}
          title="Home"
          aria-label="Home"
          className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-2 text-white hover:bg-neutral-900 transition-colors shrink-0"
        >
          <Home className="w-5 h-5" />
          <span className="font-display font-bold text-base tracking-tight hidden sm:inline">
            p.canva
          </span>
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          aria-label="Undo"
          className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-white hover:bg-neutral-900 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          aria-label="Redo"
          className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-white hover:bg-neutral-900 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        {/* File menu */}
        <div className="relative">
          <button
            onClick={() => setFileMenuOpen((v) => !v)}
            className="min-h-[44px] px-2.5 rounded-xl text-sm font-medium text-white hover:bg-neutral-900 flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>File</span>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          {fileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFileMenuOpen(false)} />
              <div className="absolute left-0 top-12 w-60 bg-black border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50">
                <div className="px-3.5 py-2 text-xs text-neutral-400 border-b border-neutral-800 mb-1">
                  {design.formatLabel} · <span className="font-mono">{design.width}×{design.height}</span>
                </div>
                <button
                  onClick={() => {
                    setFileMenuOpen(false);
                    onCreateNewDesign();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-sm text-white hover:bg-neutral-900 flex items-center gap-2.5"
                >
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span>Create new design</span>
                </button>
                <button
                  onClick={() => {
                    setFileMenuOpen(false);
                    onOpenResize();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-sm text-white hover:bg-neutral-900 flex items-center gap-2.5"
                >
                  <Scaling className="w-4 h-4 text-neutral-400" />
                  <span>Resize</span>
                </button>
                <button
                  onClick={() => {
                    setFileMenuOpen(false);
                    onSaveSnapshot();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-sm text-white hover:bg-neutral-900 flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-neutral-400" />
                  <span>Save checkpoint</span>
                </button>
                <button
                  onClick={() => {
                    setFileMenuOpen(false);
                    onOpenShareExport();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-sm text-white hover:bg-neutral-900 flex items-center gap-2.5"
                >
                  <Download className="w-4 h-4 text-neutral-400" />
                  <span>Download PNG / SVG / PDF</span>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onOpenResize}
          className="min-h-[44px] px-2.5 rounded-xl text-sm font-medium text-white hover:bg-neutral-900 hidden sm:flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Resize"
        >
          <Maximize2 className="w-4 h-4 text-neutral-300" />
          <span>Resize</span>
        </button>
      </div>

      {/* Center: Design Title (Desktop) */}
      <div className="hidden lg:flex items-center justify-center min-w-0 flex-1 max-w-sm">
        <input
          type="text"
          value={design.title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Design title"
          className="w-full px-3 py-1.5 text-sm font-semibold text-white bg-transparent hover:bg-neutral-900 focus:bg-neutral-900 rounded-lg border border-transparent focus:border-neutral-700 outline-none truncate text-center"
        />
      </div>

      {/* Right: Draw, Layers, Tasks, Comment, Present, Share / Download */}
      <div className="flex items-center gap-1 shrink-0">
        {onToggleDraw && (
          <button
            onClick={onToggleDraw}
            title="Draw"
            className={`min-h-[44px] min-w-[44px] px-2 rounded-xl text-xs font-medium hidden md:flex items-center justify-center gap-1.5 border ${
              drawActive
                ? 'bg-white text-black border-white'
                : 'bg-black text-white border-neutral-800 hover:bg-neutral-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>
        )}

        {onOpenLayers && (
          <button
            onClick={onOpenLayers}
            title="Layers"
            className="min-h-[44px] min-w-[44px] px-2 rounded-xl text-xs font-medium hidden md:flex items-center justify-center border border-neutral-800 bg-black text-white hover:bg-neutral-900"
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onSelectRightTab('pm')}
          title="Project Tasks"
          className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-xs font-medium hidden sm:flex items-center justify-center gap-1.5 border border-neutral-800 bg-black text-white hover:bg-neutral-900"
        >
          <FolderKanban className="w-4 h-4" />
          <span className="hidden lg:inline">Tasks</span>
        </button>

        <button
          onClick={onToggleCommentMode}
          title="Pin comment"
          className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
            commentMode
              ? 'bg-white text-black border-white'
              : 'bg-black text-white border-neutral-800 hover:bg-neutral-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {unresolvedCommentsCount > 0 && (
            <span className="font-mono tabular-nums opacity-80">({unresolvedCommentsCount})</span>
          )}
        </button>

        <button
          onClick={onStartPresent}
          title="Present"
          className="min-h-[44px] px-3 rounded-xl text-xs font-medium bg-neutral-900 text-white border border-neutral-800 hover:bg-neutral-800 hidden lg:flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Play className="w-4 h-4" />
          <span>Present</span>
        </button>

        <button
          onClick={onOpenShareExport}
          title="Share & Download"
          aria-label="Share & Download"
          className="min-h-[44px] px-3 rounded-xl text-xs font-semibold bg-white text-black hover:bg-neutral-200 flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4 sm:hidden" />
          <Share2 className="w-4 h-4 hidden sm:inline" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </header>
  );
};
