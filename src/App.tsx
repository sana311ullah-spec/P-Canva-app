import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Upload, X } from 'lucide-react';
import { type HubTab, WorkspaceHub } from './components/hub/WorkspaceHub';
import { ArtboardCanvas } from './components/studio/ArtboardCanvas';
import { BottomPageBar } from './components/studio/BottomPageBar';
import { CollabPMDrawer } from './components/studio/CollabPMDrawer';
import { ContextToolbar } from './components/studio/ContextToolbar';
import {
  type DrawToolSettings,
  LeftObjectDock,
  type LeftDockTab,
} from './components/studio/LeftObjectDock';
import {
  MagicResizeModal,
  PagesGridModal,
  PresentationModal,
  ShareExportModal,
} from './components/studio/Modals';
import { TopStudioBar } from './components/studio/TopStudioBar';
import { OfflineBanner } from './components/pwa/OfflineBanner';
import { STARTER_PHOTOS } from './data/seedWorkspace';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useRealtimeWorkspace } from './hooks/useRealtimeWorkspace';
import { cacheSearchPhotos, getCachedPhotos } from './utils/offlineStorage';
import type {
  ApprovalStatus,
  CanvasElement,
  CommentThread,
  DesignPage,
  DesignProject,
  DesignTemplate,
  PMProvider,
  PMTicket,
  StockPhotoItem,
} from './types/studio';

function clonePages(pages: DesignPage[]): DesignPage[] {
  return JSON.parse(JSON.stringify(pages));
}

export default function App() {
  const {
    workspace,
    presence,
    clientId,
    connected,
    currentUser,
    switchActiveIdentity,
    upsertDesign,
    deleteDesign,
    upsertComment,
    upsertTicket,
    updateIntegration,
    updateBrandKit,
    addUpload,
    updatePresence,
  } = useRealtimeWorkspace();

  const [viewMode, setViewMode] = useState<'hub' | 'editor'>('hub');
  const [hubTab, setHubTab] = useState<HubTab>('home');
  const [activeDesignId, setActiveDesignId] = useState<string>(
    () => workspace.designs[0]?.id || 'design-q4-launch',
  );
  const [activePageId, setActivePageId] = useState<string>(
    () => workspace.designs[0]?.pages[0]?.id || 'page-1',
  );

  const activeDesign = useMemo(
    () => workspace.designs.find((d) => d.id === activeDesignId) || workspace.designs[0],
    [workspace.designs, activeDesignId],
  );

  const activePage = useMemo(
    () => activeDesign?.pages.find((p) => p.id === activePageId) || activeDesign?.pages[0],
    [activeDesign, activePageId],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leftTab, setLeftTab] = useState<LeftDockTab | null>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'elements' : null,
  );
  const [rightTab, setRightTab] = useState<'comments' | 'workflow' | 'pm' | null>(null);
  const [commentMode, setCommentMode] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(false);
  const [zoom, setZoom] = useState<number>(0.5);

  const [photoTarget, setPhotoTarget] = useState<
    | { mode: 'frame'; elementId: string }
    | { mode: 'grid'; elementId: string; cellIndex: number }
    | null
  >(null);
  const isOnline = useOnlineStatus();
  const [slotPhotoQuery, setSlotPhotoQuery] = useState('');
  const [slotPhotoResults, setSlotPhotoResults] = useState<StockPhotoItem[]>([]);
  const [slotPhotoLoading, setSlotPhotoLoading] = useState(false);
  const [slotOfflineNotice, setSlotOfflineNotice] = useState(false);
  const slotFileInputRef = useRef<HTMLInputElement | null>(null);

  const [drawSettings, setDrawSettings] = useState<DrawToolSettings>({
    active: false,
    mode: 'pen',
    color: '#0F172A',
    strokeWidth: 4,
  });

  const [resizeOpen, setResizeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [presentOpen, setPresentOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);

  const [historyPast, setHistoryPast] = useState<DesignPage[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<DesignPage[][]>([]);
  const clipboardRef = useRef<CanvasElement[]>([]);

  const fitToScreen = useCallback(() => {
    if (!activeDesign) return;
    const isDesktop = window.innerWidth >= 768;
    const sidebarW = isDesktop ? (leftTab ? 394 : 74) : 0;
    const rightW = isDesktop && rightTab ? 352 : 0;
    const availW = Math.max(260, window.innerWidth - sidebarW - rightW - 48);
    const availH = Math.max(240, window.innerHeight - 210);
    const fit = Math.min(availW / activeDesign.width, availH / activeDesign.height, 1);
    setZoom(Math.max(0.2, Math.round(fit * 20) / 20));
  }, [activeDesign, leftTab, rightTab]);

  useEffect(() => {
    if (viewMode === 'editor') {
      fitToScreen();
    }
  }, [activeDesign?.id, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeDesign && activePage) {
      updatePresence({
        designId: activeDesign.id,
        pageId: activePage.id,
        selectedElementId: selectedIds[0] || null,
      });
    }
  }, [activeDesign?.id, activePage?.id, selectedIds, updatePresence]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitHistorySnapshot = useCallback(
    (pagesSnapshot?: DesignPage[]) => {
      if (!activeDesign) return;
      const snap = clonePages(pagesSnapshot || activeDesign.pages);
      setHistoryPast((prev) => [...prev.slice(-29), snap]);
      setHistoryFuture([]);
    },
    [activeDesign],
  );

  const updateDesignPages = useCallback(
    (updater: (pages: DesignPage[]) => DesignPage[], recordHistory = true) => {
      if (!activeDesign) return;
      if (recordHistory) {
        commitHistorySnapshot(activeDesign.pages);
      }
      const nextPages = updater(activeDesign.pages);
      upsertDesign({
        ...activeDesign,
        pages: nextPages,
        updatedAt: 'Just now',
        updatedBy: currentUser.name,
      });
    },
    [activeDesign, commitHistorySnapshot, currentUser.name, upsertDesign],
  );

  const handleUndo = useCallback(() => {
    if (!activeDesign || historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryFuture((f) => [clonePages(activeDesign.pages), ...f]);
    setHistoryPast((p) => p.slice(0, -1));
    upsertDesign({ ...activeDesign, pages: previous, updatedAt: 'Just now' });
  }, [activeDesign, historyPast, upsertDesign]);

  const handleRedo = useCallback(() => {
    if (!activeDesign || historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryPast((p) => [...p, clonePages(activeDesign.pages)]);
    setHistoryFuture((f) => f.slice(1));
    upsertDesign({ ...activeDesign, pages: next, updatedAt: 'Just now' });
  }, [activeDesign, historyFuture, upsertDesign]);

  const handleUpdateElement = useCallback(
    (elementId: string, patch: Partial<CanvasElement>, commitHistory = true) => {
      if (!activePage) return;
      updateDesignPages(
        (pages) =>
          pages.map((p) =>
            p.id === activePage.id
              ? {
                  ...p,
                  elements: p.elements.map((el) =>
                    el.id === elementId ? { ...el, ...patch } : el,
                  ),
                }
              : p,
          ),
        commitHistory,
      );
    },
    [activePage, updateDesignPages],
  );

  const handleAddElement = useCallback(
    (el: Omit<CanvasElement, 'id'>) => {
      if (!activePage) return;
      const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const fullEl: CanvasElement = { ...el, id: newId };
      updateDesignPages((pages) =>
        pages.map((p) =>
          p.id === activePage.id ? { ...p, elements: [...p.elements, fullEl] } : p,
        ),
      );
      setSelectedIds([newId]);
      if (window.innerWidth < 768) setLeftTab(null);
    },
    [activePage, updateDesignPages],
  );

  const handleAddTextLockup = useCallback(
    (elements: Omit<CanvasElement, 'id'>[]) => {
      if (!activePage) return;
      const created = elements.map((el, idx) => ({
        ...el,
        id: `el-${Date.now()}-${idx}`,
      }));
      updateDesignPages((pages) =>
        pages.map((p) =>
          p.id === activePage.id ? { ...p, elements: [...p.elements, ...created] } : p,
        ),
      );
      setSelectedIds(created.map((c) => c.id));
      if (window.innerWidth < 768) setLeftTab(null);
    },
    [activePage, updateDesignPages],
  );

  const handleDuplicateSelected = useCallback(() => {
    if (!activePage || selectedIds.length === 0) return;
    const clones = activePage.elements
      .filter((el) => selectedIds.includes(el.id))
      .map((el, i) => ({
        ...JSON.parse(JSON.stringify(el)),
        id: `el-${Date.now()}-${i}`,
        x: el.x + 24,
        y: el.y + 24,
        name: `${el.name} Copy`,
      }));
    updateDesignPages((pages) =>
      pages.map((p) =>
        p.id === activePage.id ? { ...p, elements: [...p.elements, ...clones] } : p,
      ),
    );
    setSelectedIds(clones.map((c) => c.id));
  }, [activePage, selectedIds, updateDesignPages]);

  const handleDeleteSelected = useCallback(() => {
    if (!activePage || selectedIds.length === 0) return;
    updateDesignPages((pages) =>
      pages.map((p) =>
        p.id === activePage.id
          ? {
              ...p,
              elements: p.elements.filter((el) => !selectedIds.includes(el.id) || el.locked),
            }
          : p,
      ),
    );
    setSelectedIds([]);
  }, [activePage, selectedIds, updateDesignPages]);

  const handleMoveLayer = useCallback(
    (id: string, dir: 'up' | 'down') => {
      if (!activePage) return;
      updateDesignPages((pages) =>
        pages.map((p) => {
          if (p.id !== activePage.id) return p;
          const idx = p.elements.findIndex((el) => el.id === id);
          if (idx < 0) return p;
          const next = [...p.elements];
          const swapIdx = dir === 'up' ? idx + 1 : idx - 1;
          if (swapIdx < 0 || swapIdx >= next.length) return p;
          [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
          return { ...p, elements: next };
        }),
      );
    },
    [activePage, updateDesignPages],
  );

  const handleAlignElements = useCallback(
    (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (!activePage || !activeDesign || selectedIds.length === 0) return;
      updateDesignPages((pages) =>
        pages.map((p) => {
          if (p.id !== activePage.id) return p;
          return {
            ...p,
            elements: p.elements.map((el) => {
              if (!selectedIds.includes(el.id) || el.locked) return el;
              if (mode === 'left') return { ...el, x: 0 };
              if (mode === 'center') return { ...el, x: Math.round((activeDesign.width - el.width) / 2) };
              if (mode === 'right') return { ...el, x: activeDesign.width - el.width };
              if (mode === 'top') return { ...el, y: 0 };
              if (mode === 'middle') return { ...el, y: Math.round((activeDesign.height - el.height) / 2) };
              if (mode === 'bottom') return { ...el, y: activeDesign.height - el.height };
              return el;
            }),
          };
        }),
      );
    },
    [activeDesign, activePage, selectedIds, updateDesignPages],
  );

  useEffect(() => {
    if (viewMode !== 'editor') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        if (activePage && selectedIds.length > 0) {
          clipboardRef.current = activePage.elements.filter((el) => selectedIds.includes(el.id));
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        if (activePage && clipboardRef.current.length > 0) {
          const pasted = clipboardRef.current.map((el, idx) => ({
            ...JSON.parse(JSON.stringify(el)),
            id: `el-${Date.now()}-${idx}`,
            x: el.x + 28,
            y: el.y + 28,
          }));
          updateDesignPages((pages) =>
            pages.map((p) =>
              p.id === activePage.id ? { ...p, elements: [...p.elements, ...pasted] } : p,
            ),
          );
          setSelectedIds(pasted.map((el) => el.id));
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        setCommentMode((v) => !v);
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
        setCommentMode(false);
      } else if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
        selectedIds.length > 0 &&
        activePage
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        updateDesignPages(
          (pages) =>
            pages.map((p) =>
              p.id === activePage.id
                ? {
                    ...p,
                    elements: p.elements.map((el) =>
                      selectedIds.includes(el.id) && !el.locked
                        ? { ...el, x: el.x + dx, y: el.y + dy }
                        : el,
                    ),
                  }
                : p,
            ),
          false,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activePage,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleRedo,
    handleUndo,
    selectedIds,
    updateDesignPages,
    viewMode,
  ]);

  const handleCreateDesignFromPreset = (
    title: string,
    width: number,
    height: number,
    formatLabel: string,
    initialImage?: { src: string; name: string; width: number; height: number },
  ) => {
    const newId = `design-${Date.now()}`;
    const pageId = `page-${Date.now()}`;
    const elements: CanvasElement[] = [];
    if (initialImage) {
      const scaledW = Math.round(width * 0.75);
      const scaledH = Math.round(scaledW * (initialImage.height / Math.max(1, initialImage.width)));
      elements.push({
        id: `el-upl-${Date.now()}`,
        type: 'image',
        name: initialImage.name,
        x: Math.round((width - scaledW) / 2),
        y: Math.round((height - scaledH) / 2),
        width: scaledW,
        height: scaledH,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        src: initialImage.src,
        objectFit: 'cover',
      });
    }

    const created: DesignProject = {
      id: newId,
      title,
      folder: 'Brand Launches',
      formatLabel,
      width,
      height,
      approvalStatus: 'draft',
      linkedTicketIds: [],
      updatedAt: 'Just now',
      updatedBy: currentUser.name,
      shareAccess: 'edit',
      approvalStages: [
        {
          id: `stg-${Date.now()}`,
          roleTitle: 'Creative Lead Sign-Off',
          reviewerName: 'Elena Rostova',
          status: 'pending',
          updatedAt: 'Not requested',
        },
      ],
      pages: [
        {
          id: pageId,
          title: 'Page 1',
          backgroundColor: '#FFFFFF',
          notes: '',
          durationSec: 6,
          elements,
        },
      ],
      versions: [],
    };
    upsertDesign(created);
    setActiveDesignId(newId);
    setActivePageId(pageId);
    setSelectedIds([]);
    setViewMode('editor');
  };

  const handleCreateDesignFromTemplate = (tpl: DesignTemplate) => {
    const newId = `design-${Date.now()}`;
    const pageId = `page-${Date.now()}`;
    const created: DesignProject = {
      id: newId,
      title: tpl.title,
      folder: 'Brand Launches',
      formatLabel: tpl.formatLabel,
      width: tpl.width,
      height: tpl.height,
      approvalStatus: 'draft',
      linkedTicketIds: [],
      updatedAt: 'Just now',
      updatedBy: currentUser.name,
      shareAccess: 'edit',
      approvalStages: [
        {
          id: `stg-${Date.now()}`,
          roleTitle: 'Creative Lead Sign-Off',
          reviewerName: 'Elena Rostova',
          status: 'pending',
          updatedAt: 'Not requested',
        },
      ],
      pages: [
        {
          ...JSON.parse(JSON.stringify(tpl.page)),
          id: pageId,
        },
      ],
      versions: [],
    };
    upsertDesign(created);
    setActiveDesignId(newId);
    setActivePageId(pageId);
    setSelectedIds([]);
    setViewMode('editor');
  };

  if (viewMode === 'hub' || !activeDesign || !activePage) {
    return (
      <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden">
        <OfflineBanner />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <WorkspaceHub
            workspace={workspace}
            activeTab={hubTab}
            onTabChange={setHubTab}
            onOpenDesign={(designId) => {
              const target = workspace.designs.find((d) => d.id === designId);
              setActiveDesignId(designId);
              if (target?.pages[0]) setActivePageId(target.pages[0].id);
              setSelectedIds([]);
              setViewMode('editor');
            }}
            onCreateDesignFromPreset={handleCreateDesignFromPreset}
            onCreateDesignFromTemplate={handleCreateDesignFromTemplate}
            onCreateDesignFromAI={(aiDesign) => {
              upsertDesign(aiDesign);
              setActiveDesignId(aiDesign.id);
              if (aiDesign.pages[0]) setActivePageId(aiDesign.pages[0].id);
              setSelectedIds([]);
              setViewMode('editor');
            }}
            onDeleteDesign={deleteDesign}
            onUpdateBrandKit={updateBrandKit}
            onUpdateTicket={upsertTicket}
            onUpdateIntegration={updateIntegration}
            onAddUpload={addUpload}
          />
        </div>
      </div>
    );
  }

  const selectedElements = activePage.elements.filter((el) => selectedIds.includes(el.id));
  const linkedTickets = workspace.pmTickets.filter((t) =>
    activeDesign.linkedTicketIds.includes(t.id),
  );
  const unresolvedCommentsCount = workspace.comments.filter(
    (c) => c.designId === activeDesign.id && !c.resolved,
  ).length;
  const remotePresence = presence.filter(
    (p) => p.clientId !== clientId && p.designId === activeDesign.id,
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden">
      <OfflineBanner />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <TopStudioBar
        design={activeDesign}
        linkedTickets={linkedTickets}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTitleChange={(title) => upsertDesign({ ...activeDesign, title, updatedAt: 'Just now' })}
        onApprovalChange={(approvalStatus: ApprovalStatus) =>
          upsertDesign({ ...activeDesign, approvalStatus, updatedAt: 'Just now' }, true)
        }
        onGoHome={() => {
          setHubTab('home');
          setViewMode('hub');
        }}
        onOpenResize={() => setResizeOpen(true)}
        onOpenShareExport={() => setShareOpen(true)}
        onStartPresent={() => setPresentOpen(true)}
        onSaveSnapshot={() => {
          const ver = {
            id: `ver-${Date.now()}`,
            label: `Checkpoint ${activeDesign.versions.length + 1}`,
            authorName: currentUser.name,
            createdAt: 'Just now',
            summary: `${activeDesign.pages.length} pages saved`,
            pages: clonePages(activeDesign.pages),
          };
          upsertDesign({
            ...activeDesign,
            versions: [ver, ...activeDesign.versions],
          });
          setRightTab('workflow');
        }}
        onCreateNewDesign={() =>
          handleCreateDesignFromPreset('Untitled Design', 1280, 720, 'Presentation (16:9)')
        }
        commentMode={commentMode}
        onToggleCommentMode={() => setCommentMode((v) => !v)}
        rightTab={rightTab}
        onSelectRightTab={(tab) => setRightTab((cur) => (cur === tab ? null : tab))}
        unresolvedCommentsCount={unresolvedCommentsCount}
        presence={presence}
        currentUser={currentUser}
        team={workspace.team}
        onSwitchUser={switchActiveIdentity}
        connected={connected}
        drawActive={drawSettings.active}
        onToggleDraw={() => {
          const nextActive = !drawSettings.active;
          setDrawSettings((s) => ({ ...s, active: nextActive }));
          setLeftTab(nextActive ? 'draw' : null);
        }}
        onOpenLayers={() => setLeftTab((t) => (t === 'layers' ? null : 'layers'))}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <LeftObjectDock
          activeTab={leftTab}
          onTabChange={setLeftTab}
          onApplyTemplate={(tpl, asNewPage) => {
            const copiedPage: DesignPage = {
              ...JSON.parse(JSON.stringify(tpl.page)),
              id: `page-${Date.now()}`,
            };
            if (asNewPage) {
              updateDesignPages((pages) => [...pages, copiedPage]);
              setActivePageId(copiedPage.id);
            } else {
              updateDesignPages((pages) =>
                pages.map((p) =>
                  p.id === activePage.id ? { ...copiedPage, id: activePage.id } : p,
                ),
              );
            }
            setSelectedIds([]);
            if (window.innerWidth < 768) setLeftTab(null);
          }}
          onAddElement={handleAddElement}
          onAddTextLockup={handleAddTextLockup}
          brandKit={workspace.brandKit}
          onUpdateBrandKit={updateBrandKit}
          onApplyBrandToDesign={() => {
            const primaryHex = workspace.brandKit.colors[0]?.hex || '#0F172A';
            const accentHex = workspace.brandKit.colors[1]?.hex || '#0F766E';
            updateDesignPages((pages) =>
              pages.map((p) => ({
                ...p,
                elements: p.elements.map((el) => {
                  if (el.type === 'text') {
                    const isHeading = (el.fontSize || 20) >= 34;
                    return {
                      ...el,
                      fontFamily: isHeading
                        ? workspace.brandKit.fonts.heading
                        : workspace.brandKit.fonts.body,
                      color: isHeading ? primaryHex : el.color || primaryHex,
                    };
                  }
                  if (el.type === 'shape' || el.type === 'graphic') {
                    return { ...el, fill: accentHex };
                  }
                  return el;
                }),
              })),
            );
          }}
          selectedElement={selectedElements.length === 1 ? selectedElements[0] : null}
          onUpdateSelectedElement={(patch) => {
            if (selectedElements.length === 1) {
              handleUpdateElement(selectedElements[0].id, patch);
            }
          }}
          onApplyColorToSelected={(hex) => {
            if (selectedElements.length === 0) return;
            const target = selectedElements[0];
            if (target.type === 'text') handleUpdateElement(target.id, { color: hex });
            else handleUpdateElement(target.id, { fill: hex });
          }}
          uploads={workspace.uploads}
          onUploadFile={(asset, insertIntoCanvas) => {
            addUpload(asset);
            if (insertIntoCanvas) {
              const w = Math.min(480, Math.round(activeDesign.width * 0.6));
              const h = Math.round(w * (asset.height / Math.max(1, asset.width)));
              handleAddElement({
                type: 'image',
                name: asset.name,
                x: Math.round((activeDesign.width - w) / 2),
                y: Math.round((activeDesign.height - h) / 2),
                width: w,
                height: h,
                rotation: 0,
                opacity: 1,
                locked: false,
                hidden: false,
                src: asset.src,
                objectFit: 'cover',
              });
            }
          }}
          drawSettings={drawSettings}
          onDrawSettingsChange={setDrawSettings}
          pageElements={activePage.elements}
          selectedIds={selectedIds}
          onSelectElement={(id) => setSelectedIds([id])}
          onMoveLayer={handleMoveLayer}
          onToggleLock={(id) => {
            const el = activePage.elements.find((item) => item.id === id);
            if (el) handleUpdateElement(id, { locked: !el.locked });
          }}
          onToggleHidden={(id) => {
            const el = activePage.elements.find((item) => item.id === id);
            if (el) handleUpdateElement(id, { hidden: !el.hidden });
          }}
          recentDesigns={workspace.designs}
          onOpenRecentDesign={(designId) => {
            const target = workspace.designs.find((d) => d.id === designId);
            setActiveDesignId(designId);
            if (target?.pages[0]) setActivePageId(target.pages[0].id);
            setSelectedIds([]);
          }}
          activeDesignTitle={activeDesign.title}
          activePageNumber={
            Math.max(0, activeDesign.pages.findIndex((p) => p.id === activePage.id)) + 1
          }
          totalPages={activeDesign.pages.length}
          pmTickets={workspace.pmTickets}
          linkedTicketIds={activeDesign.linkedTicketIds}
          onOpenPMDrawer={() => {
            setRightTab('pm');
            if (window.innerWidth < 768) setLeftTab(null);
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <ContextToolbar
            page={activePage}
            selectedElements={selectedElements}
            onUpdatePage={(patch) =>
              updateDesignPages((pages) =>
                pages.map((p) => (p.id === activePage.id ? { ...p, ...patch } : p)),
              )
            }
            onUpdateElement={handleUpdateElement}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onBringForward={(id) => handleMoveLayer(id, 'up')}
            onSendBackward={(id) => handleMoveLayer(id, 'down')}
            onAlignElements={handleAlignElements}
            onRequestFramePhoto={(elementId) => setPhotoTarget({ mode: 'frame', elementId })}
            onRequestGridCellPhoto={(elementId, cellIndex) =>
              setPhotoTarget({ mode: 'grid', elementId, cellIndex })
            }
          />

          <ArtboardCanvas
            page={activePage}
            artboardWidth={activeDesign.width}
            artboardHeight={activeDesign.height}
            zoom={zoom}
            showGuides={showGuides}
            selectedIds={selectedIds}
            onSelectIds={setSelectedIds}
            onUpdateElement={handleUpdateElement}
            onCommitSnapshot={() => commitHistorySnapshot()}
            onAddFreehandPath={handleAddElement}
            drawSettings={drawSettings}
            commentMode={commentMode}
            comments={workspace.comments.filter((c) => c.designId === activeDesign.id)}
            activeCommentId={activeCommentId}
            onCreatePinComment={(pinX, pinY) => {
              const newComment: CommentThread = {
                id: `cmt-${Date.now()}`,
                designId: activeDesign.id,
                pageId: activePage.id,
                pinX,
                pinY,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorRole: currentUser.role,
                text: 'Pinned review feedback — please inspect.',
                createdAt: 'Just now',
                resolved: false,
                replies: [],
              };
              upsertComment(newComment);
              setActiveCommentId(newComment.id);
              setCommentMode(false);
              setRightTab('comments');
            }}
            onSelectCommentPin={(commentId) => {
              setActiveCommentId(commentId);
              setRightTab('comments');
            }}
            remotePresence={remotePresence}
            onCursorMove={(x, y) => updatePresence({ cursorX: x, cursorY: y }, true)}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onBringForward={(id) => handleMoveLayer(id, 'up')}
            onSendBackward={(id) => handleMoveLayer(id, 'down')}
            onRequestFramePhoto={(elementId) => setPhotoTarget({ mode: 'frame', elementId })}
            onRequestGridCellPhoto={(elementId, cellIndex) =>
              setPhotoTarget({ mode: 'grid', elementId, cellIndex })
            }
          />

          <BottomPageBar
            pages={activeDesign.pages}
            activePageId={activePage.id}
            onSelectPage={(id) => {
              setActivePageId(id);
              setSelectedIds([]);
            }}
            onAddPage={() => {
              const newPage: DesignPage = {
                id: `page-${Date.now()}`,
                title: `Page ${activeDesign.pages.length + 1}`,
                backgroundColor: '#FFFFFF',
                notes: '',
                durationSec: 6,
                elements: [],
              };
              updateDesignPages((pages) => [...pages, newPage]);
              setActivePageId(newPage.id);
              setSelectedIds([]);
            }}
            onDuplicatePage={(pageId) => {
              const target = activeDesign.pages.find((p) => p.id === pageId);
              if (!target) return;
              const dup: DesignPage = {
                ...JSON.parse(JSON.stringify(target)),
                id: `page-${Date.now()}`,
                title: `${target.title} Copy`,
              };
              updateDesignPages((pages) => [...pages, dup]);
              setActivePageId(dup.id);
            }}
            onDeletePage={(pageId) => {
              if (activeDesign.pages.length <= 1) return;
              const remaining = activeDesign.pages.filter((p) => p.id !== pageId);
              updateDesignPages(() => remaining);
              if (activePageId === pageId) setActivePageId(remaining[0].id);
            }}
            onUpdatePageNotes={(notes) =>
              updateDesignPages(
                (pages) => pages.map((p) => (p.id === activePage.id ? { ...p, notes } : p)),
                false,
              )
            }
            zoom={zoom}
            onZoomChange={setZoom}
            onFitToScreen={fitToScreen}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides((v) => !v)}
            onOpenGridView={() => setGridOpen(true)}
          />
        </div>

        {rightTab && (
          <CollabPMDrawer
            activeTab={rightTab}
            onTabChange={setRightTab}
            onClose={() => setRightTab(null)}
            design={activeDesign}
            activePage={activePage}
            currentUser={currentUser}
            team={workspace.team}
            brandKit={workspace.brandKit}
            comments={workspace.comments}
            activeCommentId={activeCommentId}
            onSelectComment={(commentId, pageId) => {
              setActiveCommentId(commentId);
              if (pageId !== activePage.id) setActivePageId(pageId);
            }}
            onAddComment={(text, pinX = null, pinY = null) => {
              const cmt: CommentThread = {
                id: `cmt-${Date.now()}`,
                designId: activeDesign.id,
                pageId: activePage.id,
                pinX,
                pinY,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorRole: currentUser.role,
                text,
                createdAt: 'Just now',
                resolved: false,
                replies: [],
              };
              upsertComment(cmt);
              setActiveCommentId(cmt.id);
            }}
            onReplyComment={(commentId, text) => {
              const target = workspace.comments.find((c) => c.id === commentId);
              if (!target) return;
              upsertComment({
                ...target,
                replies: [
                  ...target.replies,
                  {
                    id: `rep-${Date.now()}`,
                    authorId: currentUser.id,
                    authorName: currentUser.name,
                    authorRole: currentUser.role,
                    text,
                    createdAt: 'Just now',
                  },
                ],
              });
            }}
            onToggleResolveComment={(commentId) => {
              const target = workspace.comments.find((c) => c.id === commentId);
              if (!target) return;
              upsertComment({ ...target, resolved: !target.resolved });
            }}
            onConvertCommentToTicket={(comment, provider: PMProvider) => {
              const newId = `tkt-${Date.now()}`;
              const keyPrefix =
                provider === 'jira' ? 'JIRA' : provider === 'linear' ? 'LIN' : 'ASANA';
              const newTicket: PMTicket = {
                id: newId,
                key: `${keyPrefix}-${Math.floor(500 + Math.random() * 400)}`,
                provider,
                title: comment.text.slice(0, 64),
                description: `Feedback from ${comment.authorName} on "${activeDesign.title}"`,
                status: 'in_progress',
                priority: 'high',
                assignee: currentUser.name,
                sprint: 'Sprint 42 · Nov Launch',
                dueDate: '2026-11-28',
                linkedDesignId: activeDesign.id,
                linkedPageId: comment.pageId,
                updatedAt: 'Just now',
              };
              upsertTicket(newTicket);
              upsertComment({ ...comment, linkedTicketId: newId });
              upsertDesign({
                ...activeDesign,
                linkedTicketIds: [...activeDesign.linkedTicketIds, newId],
              });
              setRightTab('pm');
            }}
            onUpdateStageStatus={(stageId, status) => {
              const nextStages = activeDesign.approvalStages.map((s) =>
                s.id === stageId ? { ...s, status, updatedAt: 'Just now' } : s,
              );
              const allApproved = nextStages.every((s) => s.status === 'approved');
              const anyChanges = nextStages.some((s) => s.status === 'changes_requested');
              const nextStatus: ApprovalStatus = allApproved
                ? 'approved'
                : anyChanges
                  ? 'changes_requested'
                  : 'in_review';
              upsertDesign(
                {
                  ...activeDesign,
                  approvalStages: nextStages,
                  approvalStatus: nextStatus,
                  updatedAt: 'Just now',
                },
                true,
              );
            }}
            onCreateSnapshot={(label, summary) => {
              upsertDesign({
                ...activeDesign,
                versions: [
                  {
                    id: `ver-${Date.now()}`,
                    label,
                    authorName: currentUser.name,
                    createdAt: 'Just now',
                    summary,
                    pages: clonePages(activeDesign.pages),
                  },
                  ...activeDesign.versions,
                ],
              });
            }}
            onRestoreSnapshot={(versionId) => {
              const target = activeDesign.versions.find((v) => v.id === versionId);
              if (!target || target.pages.length === 0) return;
              commitHistorySnapshot();
              const restored = clonePages(target.pages);
              upsertDesign({
                ...activeDesign,
                pages: restored,
                updatedAt: 'Just now',
              });
              setActivePageId(restored[0].id);
            }}
            onFixOffBrandElements={() => {
              const primaryHex = workspace.brandKit.colors[0]?.hex || '#0F172A';
              const accentHex = workspace.brandKit.colors[1]?.hex || '#0F766E';
              const allowedHexes = new Set(
                workspace.brandKit.colors.map((c) => c.hex.toLowerCase()),
              );
              updateDesignPages((pages) =>
                pages.map((p) => {
                  if (p.id !== activePage.id) return p;
                  return {
                    ...p,
                    elements: p.elements.map((el) => {
                      if (el.type === 'text') {
                        return {
                          ...el,
                          fontFamily:
                            (el.fontSize || 20) >= 36
                              ? workspace.brandKit.fonts.heading
                              : workspace.brandKit.fonts.body,
                          color:
                            el.color && allowedHexes.has(el.color.toLowerCase())
                              ? el.color
                              : primaryHex,
                        };
                      }
                      if (el.type === 'shape') {
                        return {
                          ...el,
                          fill:
                            el.fill && allowedHexes.has(el.fill.toLowerCase())
                              ? el.fill
                              : accentHex,
                        };
                      }
                      return el;
                    }),
                  };
                }),
              );
            }}
            pmTickets={workspace.pmTickets}
            integrations={workspace.integrations}
            onCreateTicket={(ticketInput) => {
              const newId = `tkt-${Date.now()}`;
              const prefix =
                ticketInput.provider === 'jira'
                  ? 'JIRA'
                  : ticketInput.provider === 'linear'
                    ? 'LIN'
                    : 'ASANA';
              const newTicket: PMTicket = {
                ...ticketInput,
                id: newId,
                key: `${prefix}-${Math.floor(500 + Math.random() * 400)}`,
                updatedAt: 'Just now',
              };
              upsertTicket(newTicket);
              upsertDesign({
                ...activeDesign,
                linkedTicketIds: [...activeDesign.linkedTicketIds, newId],
              });
            }}
            onUpdateTicket={upsertTicket}
            onToggleLinkTicket={(ticketId) => {
              const exists = activeDesign.linkedTicketIds.includes(ticketId);
              upsertDesign({
                ...activeDesign,
                linkedTicketIds: exists
                  ? activeDesign.linkedTicketIds.filter((id) => id !== ticketId)
                  : [...activeDesign.linkedTicketIds, ticketId],
              });
            }}
            onUpdateIntegration={updateIntegration}
          />
        )}
      </div>

      {shareOpen && (
        <ShareExportModal
          design={activeDesign}
          activePage={activePage}
          onClose={() => setShareOpen(false)}
          onShareAccessChange={(shareAccess) => upsertDesign({ ...activeDesign, shareAccess })}
        />
      )}

      {resizeOpen && (
        <MagicResizeModal
          currentWidth={activeDesign.width}
          currentHeight={activeDesign.height}
          onClose={() => setResizeOpen(false)}
          onApplyResize={(nextW, nextH, label) => {
            const sx = nextW / activeDesign.width;
            const sy = nextH / activeDesign.height;
            const fontScale = Math.min(sx, sy);
            commitHistorySnapshot();
            const resizedPages = activeDesign.pages.map((p) => ({
              ...p,
              elements: p.elements.map((el) => ({
                ...el,
                x: Math.round(el.x * sx),
                y: Math.round(el.y * sy),
                width: Math.round(el.width * sx),
                height: Math.round(el.height * sy),
                fontSize: el.fontSize
                  ? Math.max(10, Math.round(el.fontSize * fontScale))
                  : undefined,
              })),
            }));
            upsertDesign({
              ...activeDesign,
              width: nextW,
              height: nextH,
              formatLabel: label,
              pages: resizedPages,
              updatedAt: 'Just now',
            });
          }}
        />
      )}

      {presentOpen && (
        <PresentationModal
          design={activeDesign}
          initialIndex={Math.max(
            0,
            activeDesign.pages.findIndex((p) => p.id === activePage.id),
          )}
          onClose={() => setPresentOpen(false)}
        />
      )}

      {gridOpen && (
        <PagesGridModal
          design={activeDesign}
          activePageId={activePage.id}
          onSelectPage={setActivePageId}
          onDuplicatePage={(pageId) => {
            const target = activeDesign.pages.find((p) => p.id === pageId);
            if (!target) return;
            const dup: DesignPage = {
              ...JSON.parse(JSON.stringify(target)),
              id: `page-${Date.now()}`,
              title: `${target.title} Copy`,
            };
            updateDesignPages((pages) => [...pages, dup]);
          }}
          onDeletePage={(pageId) => {
            if (activeDesign.pages.length <= 1) return;
            const remaining = activeDesign.pages.filter((p) => p.id !== pageId);
            updateDesignPages(() => remaining);
            if (activePageId === pageId) setActivePageId(remaining[0].id);
          }}
          onAddPage={() => {
            const newPage: DesignPage = {
              id: `page-${Date.now()}`,
              title: `Page ${activeDesign.pages.length + 1}`,
              backgroundColor: '#FFFFFF',
              notes: '',
              durationSec: 6,
              elements: [],
            };
            updateDesignPages((pages) => [...pages, newPage]);
            setActivePageId(newPage.id);
          }}
          onClose={() => setGridOpen(false)}
        />
      )}

      {/* Interactive Photo Picker Modal for Frames & Grid Slots */}
      {photoTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm font-display font-bold">
                {photoTarget.mode === 'frame'
                  ? 'Select Photo for Frame'
                  : `Select Photo for Grid Box #${photoTarget.cellIndex + 1}`}
              </div>
              <button
                onClick={() => {
                  setPhotoTarget(null);
                  setSlotPhotoQuery('');
                  setSlotPhotoResults([]);
                }}
                className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const q = slotPhotoQuery.trim();
                if (!q) return;
                const getOfflineSlotMatches = () => {
                  const combined = [...getCachedPhotos(), ...STARTER_PHOTOS];
                  const qLow = q.toLowerCase();
                  const matches = combined.filter(
                    (p) =>
                      p.title.toLowerCase().includes(qLow) ||
                      p.category.toLowerCase().includes(qLow),
                  );
                  return matches.length > 0 ? matches.slice(0, 24) : combined.slice(0, 24);
                };

                if (!isOnline) {
                  setSlotOfflineNotice(true);
                  setSlotPhotoResults(getOfflineSlotMatches());
                  return;
                }

                setSlotPhotoLoading(true);
                try {
                  const res = await fetch(
                    `/api/photos/search?query=${encodeURIComponent(q)}&page=1`,
                  );
                  if (!res.ok) throw new Error('Offline');
                  const data = await res.json();
                  const incoming = (data.photos || []) as StockPhotoItem[];
                  setSlotOfflineNotice(false);
                  cacheSearchPhotos(incoming);
                  setSlotPhotoResults(incoming);
                } catch {
                  setSlotOfflineNotice(true);
                  setSlotPhotoResults(getOfflineSlotMatches());
                } finally {
                  setSlotPhotoLoading(false);
                }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={slotPhotoQuery}
                  onChange={(e) => {
                    setSlotPhotoQuery(e.target.value);
                    if (!e.target.value.trim()) setSlotPhotoResults([]);
                  }}
                  placeholder="Search free photos (flower, lab, nature)..."
                  className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-white outline-none focus:border-white"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-3.5 rounded-xl bg-white text-black text-xs font-bold"
              >
                Search
              </button>
            </form>

            <input
              ref={slotFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file || !photoTarget) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const src = reader.result as string;
                  const targetEl = activePage.elements.find(
                    (el) => el.id === photoTarget.elementId,
                  );
                  if (photoTarget.mode === 'frame') {
                    handleUpdateElement(photoTarget.elementId, { src });
                  } else if (targetEl) {
                    const total = (targetEl.gridCols || 2) * (targetEl.gridRows || 2);
                    const nextImgs = Array.from({ length: total }, (_, i) => {
                      if (i === photoTarget.cellIndex) return src;
                      return targetEl.gridImages?.[i] || STARTER_PHOTOS[i % STARTER_PHOTOS.length].src;
                    });
                    handleUpdateElement(photoTarget.elementId, { gridImages: nextImgs });
                  }
                  setPhotoTarget(null);
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
              className="hidden"
            />

            <button
              onClick={() => slotFileInputRef.current?.click()}
              className="w-full h-10 rounded-xl border border-neutral-700 hover:border-white bg-neutral-900 text-xs font-semibold flex items-center justify-center gap-2 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo from Gallery</span>
            </button>

            {(!isOnline || slotOfflineNotice) && (
              <div className="px-3 py-2 rounded-xl bg-neutral-900 border border-amber-500/40 text-[11px] text-amber-300 shrink-0">
                Connect to internet for new photos — showing cached &amp; built-in photos.
              </div>
            )}

            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 pr-1">
              {slotPhotoLoading && (
                <div className="col-span-3 py-6 text-center text-xs text-neutral-400">
                  Loading photos...
                </div>
              )}
              {(slotPhotoResults.length > 0
                ? slotPhotoResults
                : [...getCachedPhotos(), ...STARTER_PHOTOS].slice(0, 24)
              ).map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    const targetEl = activePage.elements.find(
                      (el) => el.id === photoTarget.elementId,
                    );
                    if (photoTarget.mode === 'frame') {
                      handleUpdateElement(photoTarget.elementId, { src: photo.src });
                    } else if (targetEl) {
                      const total = (targetEl.gridCols || 2) * (targetEl.gridRows || 2);
                      const nextImgs = Array.from({ length: total }, (_, i) => {
                        if (i === photoTarget.cellIndex) return photo.src;
                        return (
                          targetEl.gridImages?.[i] ||
                          STARTER_PHOTOS[i % STARTER_PHOTOS.length].src
                        );
                      });
                      handleUpdateElement(photoTarget.elementId, { gridImages: nextImgs });
                    }
                    setPhotoTarget(null);
                    setSlotPhotoQuery('');
                    setSlotPhotoResults([]);
                  }}
                  className="aspect-square rounded-xl overflow-hidden border border-neutral-800 hover:border-white bg-neutral-900"
                >
                  <img
                    src={photo.thumbUrl || photo.src}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
