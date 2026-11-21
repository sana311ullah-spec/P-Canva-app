import React, { useRef, useState } from 'react';
import {
  ChevronRight,
  FileText,
  FolderKanban,
  Heart,
  Home,
  LayoutGrid,
  LayoutTemplate,
  Maximize2,
  MoreHorizontal,
  Palette,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Table2,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import { DESIGN_TEMPLATES } from '../../data/seedWorkspace';
import type {
  BrandKit,
  DesignProject,
  DesignTemplate,
  PMIntegrationConfig,
  PMTicket,
  PMTicketStatus,
  UploadedAsset,
  WorkspaceState,
} from '../../types/studio';
import { ElementRenderer } from '../studio/ElementRenderer';

export type HubTab = 'home' | 'designs' | 'templates' | 'ai' | 'more';

interface WorkspaceHubProps {
  workspace: WorkspaceState;
  activeTab: HubTab;
  onTabChange: (tab: HubTab) => void;
  onOpenDesign: (designId: string) => void;
  onCreateDesignFromPreset: (
    title: string,
    width: number,
    height: number,
    formatLabel: string,
    initialImage?: { src: string; name: string; width: number; height: number },
  ) => void;
  onCreateDesignFromTemplate: (template: DesignTemplate) => void;
  onCreateDesignFromAI: (design: DesignProject) => void;
  onDeleteDesign: (designId: string) => void;
  onUpdateBrandKit: (kit: BrandKit) => void;
  onUpdateTicket: (ticket: PMTicket) => void;
  onUpdateIntegration: (config: PMIntegrationConfig) => void;
  onAddUpload: (asset: UploadedAsset) => void;
}

const GET_STARTED_ITEMS = [
  {
    id: 'social',
    label: 'Social media',
    width: 1080,
    height: 1080,
    categoryFilter: 'Social media',
    bgClass: 'bg-red-500',
    icon: Heart,
  },
  {
    id: 'presentation',
    label: 'Presentation',
    width: 1280,
    height: 720,
    categoryFilter: 'Presentation',
    bgClass: 'bg-orange-500',
    icon: Presentation,
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    width: 1400,
    height: 900,
    categoryFilter: 'All',
    bgClass: 'bg-emerald-500',
    icon: SquarePen,
  },
  {
    id: 'custom',
    label: 'Custom size',
    width: 1200,
    height: 800,
    categoryFilter: 'All',
    bgClass: 'bg-violet-500',
    icon: Maximize2,
  },
  {
    id: 'video',
    label: 'Video',
    width: 1280,
    height: 720,
    categoryFilter: 'Presentation',
    bgClass: 'bg-pink-500',
    icon: Video,
  },
  {
    id: 'doc',
    label: 'Doc',
    width: 794,
    height: 1123,
    categoryFilter: 'Poster',
    bgClass: 'bg-blue-500',
    icon: FileText,
  },
  {
    id: 'upload',
    label: 'Upload',
    width: 1080,
    height: 1080,
    categoryFilter: 'All',
    bgClass: 'bg-neutral-500',
    icon: UploadCloud,
  },
  {
    id: 'sheet',
    label: 'Sheet',
    width: 1280,
    height: 720,
    categoryFilter: 'Brand',
    bgClass: 'bg-sky-600',
    icon: Table2,
  },
] as const;

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  workspace,
  activeTab,
  onTabChange,
  onOpenDesign,
  onCreateDesignFromPreset,
  onCreateDesignFromTemplate,
  onCreateDesignFromAI,
  onDeleteDesign,
  onUpdateBrandKit,
  onUpdateTicket,
  onUpdateIntegration,
  onAddUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [styleFilter, setStyleFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [hubTplCount, setHubTplCount] = useState(18);
  const hubTplSentinelRef = useRef<HTMLDivElement | null>(null);

  // "Start from" popup state
  const [startModalFormat, setStartModalFormat] = useState<(typeof GET_STARTED_ITEMS)[number] | null>(
    null,
  );
  const [customW, setCustomW] = useState(1200);
  const [customH, setCustomH] = useState(800);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  // Canva AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFormat, setAiFormat] = useState('Presentation');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // More (Enterprise Hub) sub-section
  const [moreSection, setMoreSection] = useState<'pm' | 'brand' | 'approvals'>('pm');
  const [newColorHex, setNewColorHex] = useState('#0F766E');
  const [newColorName, setNewColorName] = useState('Accent');

  const filteredTemplates = DESIGN_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesStyle = styleFilter === 'All' || t.style === styleFilter;
    const matchesLang = languageFilter === 'All' || t.language === languageFilter;
    return matchesSearch && matchesCat && matchesStyle && matchesLang;
  });

  React.useEffect(() => {
    setHubTplCount(18);
  }, [searchQuery, categoryFilter, styleFilter, languageFilter]);

  React.useEffect(() => {
    const node = hubTplSentinelRef.current;
    if (!node || activeTab !== 'templates') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHubTplCount((c) => Math.min(filteredTemplates.length, c + 15));
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, filteredTemplates.length]);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const w = img.width || 1080;
        const h = img.height || 1080;
        onAddUpload({
          id: `upl-${Date.now()}`,
          name: file.name,
          src,
          width: w,
          height: h,
          uploadedAt: 'Just now',
        });
        setStartModalFormat(null);
        onCreateDesignFromPreset(file.name.replace(/\.[^.]+$/, ''), 1080, 1080, 'Uploaded Image', {
          src,
          name: file.name,
          width: w,
          height: h,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), format: aiFormat }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate design.');
      }
      if (data.design) {
        onCreateDesignFromAI(data.design);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate design.');
    } finally {
      setAiLoading(false);
    }
  };

  const renderDesignThumbnail = (design: DesignProject, maxW = 280) => {
    const firstPage = design.pages[0];
    if (!firstPage) return null;
    const scale = maxW / design.width;
    const thumbH = Math.min(180, Math.round(design.height * scale));
    return (
      <div
        style={{ width: maxW, height: thumbH }}
        className="mx-auto overflow-hidden rounded-xl border border-neutral-800 relative bg-white"
      >
        <div
          style={{
            width: design.width,
            height: design.height,
            backgroundColor: firstPage.backgroundColor,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="relative pointer-events-none"
        >
          {firstPage.elements.map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`,
              }}
            >
              <ElementRenderer element={el} interactive={false} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTemplateThumbnail = (tpl: DesignTemplate, thumbW = 220) => {
    const scale = thumbW / tpl.width;
    const thumbH = Math.min(165, Math.round(tpl.height * scale));
    return (
      <div
        style={{ width: thumbW, height: thumbH }}
        className="overflow-hidden rounded-xl border border-neutral-800 relative bg-white mx-auto"
      >
        <div
          style={{
            width: tpl.width,
            height: tpl.height,
            backgroundColor: tpl.page.backgroundColor,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="relative pointer-events-none"
        >
          {tpl.page.elements.map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`,
              }}
            >
              <ElementRenderer element={el} interactive={false} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Hidden gallery upload input */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryUpload}
        className="hidden"
      />

      {/* Black Top Header */}
      <header className="h-14 shrink-0 bg-black border-b border-neutral-900 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="font-display font-bold text-xl tracking-tight text-white">
          p.canva
        </div>
        <button
          onClick={() =>
            onCreateDesignFromPreset('Untitled design', 1280, 720, 'Presentation (16:9)')
          }
          className="min-h-[40px] px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 whitespace-nowrap"
        >
          + Create
        </button>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 sm:px-6 lg:px-10 pt-5">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* ============================================================== */}
          {/* 1. HOME PAGE                                                   */}
          {/* ============================================================== */}
          {activeTab === 'home' && (
            <>
              {/* Hero Greeting & Search */}
              <section className="space-y-4">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                  What will you design today?
                </h1>
                <div className="relative">
                  <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onTabChange('templates');
                    }}
                    placeholder="Search templates"
                    className="w-full h-12 pl-12 pr-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-400 outline-none focus:border-white"
                  />
                </div>
              </section>

              {/* Get Started: 8 Round Colorful Icons in 2 Rows */}
              <section className="space-y-4">
                <h2 className="text-base font-display font-semibold text-white">Get started</h2>
                <div className="grid grid-cols-4 gap-y-5 gap-x-3 sm:gap-x-6">
                  {GET_STARTED_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCustomW(item.width);
                          setCustomH(item.height);
                          setStartModalFormat(item);
                        }}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${item.bgClass} flex items-center justify-center text-white shadow-md group-active:scale-95 transition-transform`}
                        >
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-xs font-medium text-neutral-200 text-center leading-tight">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Continue designing > Recent Designs Row */}
              {workspace.designs.length > 0 && (
                <section className="space-y-3.5">
                  <button
                    onClick={() => onTabChange('designs')}
                    className="flex items-center gap-1.5 text-base font-display font-semibold text-white hover:text-neutral-300"
                  >
                    <span>Continue designing</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                    {workspace.designs.slice(0, 8).map((design) => (
                      <button
                        key={design.id}
                        onClick={() => onOpenDesign(design.id)}
                        className="w-56 shrink-0 snap-start rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white p-3 text-left transition-colors space-y-2.5"
                      >
                        <div className="relative">
                          {renderDesignThumbnail(design, 196)}
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 border border-white/20 text-[10px] font-mono font-bold text-white">
                            {design.pages.length}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white truncate">
                            {design.title}
                          </div>
                          <div className="text-xs text-neutral-400 truncate">
                            {design.formatLabel} · {design.updatedAt}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Templates for you > Horizontal Scroll Cards */}
              <section className="space-y-3.5">
                <button
                  onClick={() => onTabChange('templates')}
                  className="flex items-center gap-1.5 text-base font-display font-semibold text-white hover:text-neutral-300"
                >
                  <span>Templates for you</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
                  {DESIGN_TEMPLATES.slice(0, 14).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => onCreateDesignFromTemplate(tpl)}
                      className="w-56 shrink-0 snap-start rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white p-3 text-left transition-colors space-y-2.5"
                    >
                      <div className="relative">
                        {renderTemplateThumbnail(tpl, 196)}
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 border border-white/20 text-[10px] font-mono font-bold text-white">
                          {tpl.pageCount}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white truncate">
                          {tpl.title}
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          {tpl.category} · {tpl.style}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ============================================================== */}
          {/* 2. YOUR DESIGNS PAGE                                           */}
          {/* ============================================================== */}
          {activeTab === 'designs' && (
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-display font-bold text-white">Your Designs</h1>
                <span className="text-xs font-mono text-neutral-400">
                  {workspace.designs.length} saved
                </span>
              </div>

              {workspace.designs.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-800 space-y-3">
                  <p className="text-sm text-neutral-400">No saved designs yet.</p>
                  <button
                    onClick={() =>
                      onCreateDesignFromPreset('Untitled design', 1280, 720, 'Presentation (16:9)')
                    }
                    className="min-h-[44px] px-5 rounded-xl bg-white text-black text-sm font-semibold"
                  >
                    Create your first design
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workspace.designs.map((design) => (
                    <div
                      key={design.id}
                      onClick={() => onOpenDesign(design.id)}
                      className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white cursor-pointer space-y-3 transition-colors"
                    >
                      <div className="bg-neutral-900 rounded-xl p-3 flex items-center justify-center min-h-[175px]">
                        {renderDesignThumbnail(design, 250)}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {design.title}
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            {design.formatLabel} · {design.pages.length} pages
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDesign(design.id);
                          }}
                          className="min-w-[44px] min-h-[44px] rounded-xl bg-neutral-900 border border-neutral-800 hover:border-rose-500 text-rose-400 flex items-center justify-center shrink-0"
                          title="Delete design"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* 3. TEMPLATES PAGE                                              */}
          {/* ============================================================== */}
          {activeTab === 'templates' && (
            <section className="space-y-5">
              <div className="relative">
                <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates"
                  className="w-full h-12 pl-12 pr-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-400 outline-none focus:border-white"
                />
              </div>

              {/* Filter Chips: [Presentation v] [Style v] [Language v] */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="min-h-[44px] px-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white outline-none"
                >
                  <option value="All">All ({DESIGN_TEMPLATES.length})</option>
                  <option value="Presentation">Presentation</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Lab Report">Lab Report</option>
                  <option value="Banner">Banner</option>
                  <option value="Poster">Poster</option>
                  <option value="Brand">Brand</option>
                </select>

                <select
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  className="min-h-[44px] px-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white outline-none"
                >
                  <option value="All">Style</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Editorial">Editorial</option>
                  <option value="Bold">Bold</option>
                  <option value="Corporate">Corporate</option>
                </select>

                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="min-h-[44px] px-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white outline-none"
                >
                  <option value="All">Language</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredTemplates.slice(0, hubTplCount).map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => onCreateDesignFromTemplate(tpl)}
                    className="p-3 sm:p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white text-left space-y-2.5 transition-colors"
                  >
                    <div className="bg-neutral-900 rounded-xl p-2 sm:p-3 flex items-center justify-center min-h-[140px] sm:min-h-[175px] relative">
                      {renderTemplateThumbnail(tpl, 210)}
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 border border-white/20 text-[10px] font-mono font-bold text-white">
                        {tpl.pageCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {tpl.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                        {tpl.category} · {tpl.pageCount} pages
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {hubTplCount < filteredTemplates.length && (
                <div ref={hubTplSentinelRef} className="py-6 text-center text-xs text-neutral-500">
                  Loading more templates...
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* 4. CANVA AI PAGE                                               */}
          {/* ============================================================== */}
          {activeTab === 'ai' && (
            <section className="max-w-2xl mx-auto py-8 space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Canva AI
                </h1>
                <p className="text-sm text-neutral-400">
                  Describe what you want to create and jump straight into an editable canvas.
                </p>
              </div>

              <form onSubmit={handleGenerateAI} className="space-y-4">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="What will we design today? Describe your idea"
                  className="w-full p-4 rounded-2xl bg-neutral-950 border border-neutral-700 text-sm text-white placeholder-neutral-500 outline-none focus:border-white"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {(['Presentation', 'Social media', 'Poster'] as const).map((fmt) => (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => setAiFormat(fmt)}
                        className={`min-h-[42px] px-3.5 rounded-xl text-xs font-semibold border ${
                          aiFormat === fmt
                            ? 'bg-white text-black border-white'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="min-h-[48px] px-6 rounded-xl bg-white hover:bg-neutral-200 text-black text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{aiLoading ? 'Generating...' : 'Generate'}</span>
                  </button>
                </div>

                {aiError && (
                  <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-xs text-rose-300">
                    {aiError}
                  </div>
                )}
              </form>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-neutral-400">Try an example</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Minimalist pitch deck for a studio audio brand',
                    'Luxury botanical skincare launch poster',
                    'Modern design studio open house invite',
                  ].map((idea) => (
                    <button
                      key={idea}
                      onClick={() => setAiPrompt(idea)}
                      className="min-h-[40px] px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-white text-xs text-neutral-200 text-left"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* 5. MORE PAGE (ENTERPRISE PM, BRAND HUB & APPROVALS)            */}
          {/* ============================================================== */}
          {activeTab === 'more' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-display font-bold text-white">
                  Enterprise Tools & Integrations
                </h1>
                <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl">
                  {(
                    [
                      { id: 'pm', label: 'PM Sync', icon: FolderKanban },
                      { id: 'brand', label: 'Brand Kit', icon: Palette },
                      { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setMoreSection(item.id)}
                        className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                          moreSection === item.id
                            ? 'bg-white text-black'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {moreSection === 'pm' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {workspace.integrations.map((cfg) => (
                      <div
                        key={cfg.provider}
                        className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{cfg.label}</span>
                          <span className="text-xs text-emerald-400">Connected</span>
                        </div>
                        <div className="text-xs text-neutral-400 truncate">{cfg.workspaceName}</div>
                        <label className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs cursor-pointer">
                          <span className="text-neutral-300">Auto-sync approvals</span>
                          <input
                            type="checkbox"
                            checked={cfg.autoSyncApprovals}
                            onChange={(e) =>
                              onUpdateIntegration({
                                ...cfg,
                                autoSyncApprovals: e.target.checked,
                                lastSyncedAt: 'Just now',
                              })
                            }
                            className="accent-white"
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {(
                      [
                        ['backlog', 'Backlog'],
                        ['in_progress', 'In Progress'],
                        ['in_review', 'In Review'],
                        ['done', 'Done'],
                      ] as [PMTicketStatus, string][]
                    ).map(([colStatus, colLabel]) => {
                      const colTickets = workspace.pmTickets.filter((t) => t.status === colStatus);
                      return (
                        <div
                          key={colStatus}
                          className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{colLabel}</span>
                            <span className="font-mono text-neutral-400">{colTickets.length}</span>
                          </div>
                          <div className="space-y-2">
                            {colTickets.map((t) => (
                              <div
                                key={t.id}
                                className="p-3 rounded-xl bg-black border border-neutral-800 space-y-2"
                              >
                                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                                  <span>
                                    {t.provider.toUpperCase()} · {t.key}
                                  </span>
                                  <span className="capitalize">{t.priority}</span>
                                </div>
                                <div className="text-xs font-semibold">{t.title}</div>
                                <div className="flex items-center justify-between gap-2">
                                  <select
                                    value={t.status}
                                    onChange={(e) =>
                                      onUpdateTicket({
                                        ...t,
                                        status: e.target.value as PMTicketStatus,
                                        updatedAt: 'Just now',
                                      })
                                    }
                                    className="h-8 px-2 rounded-lg border border-neutral-700 bg-neutral-900 text-[11px] text-white"
                                  >
                                    <option value="backlog">Backlog</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="in_review">In Review</option>
                                    <option value="done">Done</option>
                                  </select>
                                  {t.linkedDesignId && (
                                    <button
                                      onClick={() => onOpenDesign(t.linkedDesignId!)}
                                      className="text-xs font-semibold text-white underline"
                                    >
                                      Open
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {moreSection === 'brand' && (
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 max-w-2xl">
                  <div className="text-sm font-semibold">{workspace.brandKit.orgName} Colors</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {workspace.brandKit.colors.map((c) => (
                      <div
                        key={c.hex}
                        className="p-3 rounded-xl border border-neutral-800 bg-black flex items-center gap-3"
                      >
                        <div
                          className="w-8 h-8 rounded-lg border border-white/10 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{c.name}</div>
                          <div className="text-[11px] font-mono text-neutral-400">{c.hex}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newColorName.trim()) return;
                      onUpdateBrandKit({
                        ...workspace.brandKit,
                        colors: [
                          ...workspace.brandKit.colors,
                          { name: newColorName.trim(), hex: newColorHex },
                        ],
                      });
                      setNewColorName('');
                    }}
                    className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800"
                  >
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-neutral-700 bg-neutral-900 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="Color name"
                      className="h-10 px-3 rounded-xl border border-neutral-700 bg-neutral-900 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl bg-white text-black text-xs font-semibold"
                    >
                      Add Color
                    </button>
                  </form>
                </div>
              )}

              {moreSection === 'approvals' && (
                <div className="space-y-3">
                  {workspace.designs.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-sm font-semibold">{d.title}</div>
                        <div className="text-xs text-neutral-400 capitalize">
                          {d.approvalStatus.replace('_', ' ')} · {d.folder}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenDesign(d.id)}
                        className="min-h-[44px] px-4 rounded-xl bg-white text-black text-xs font-semibold shrink-0"
                      >
                        Open Editor
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* "Start from" Modal when clicking any of the 8 Home icons */}
      {startModalFormat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold">Start from</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {startModalFormat.label} · {customW} × {customH} px
                </p>
              </div>
              <button
                onClick={() => setStartModalFormat(null)}
                className="min-w-[40px] min-h-[40px] rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {startModalFormat.id === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={customW}
                    onChange={(e) => setCustomW(Math.max(100, Number(e.target.value) || 100))}
                    className="w-full h-11 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={customH}
                    onChange={(e) => setCustomH(Math.max(100, Number(e.target.value) || 100))}
                    className="w-full h-11 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-mono text-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (startModalFormat.id === 'upload') {
                    uploadInputRef.current?.click();
                  } else {
                    const fmt = startModalFormat;
                    setStartModalFormat(null);
                    onCreateDesignFromPreset(
                      `Untitled ${fmt.label}`,
                      customW,
                      customH,
                      fmt.label,
                    );
                  }
                }}
                className="min-h-[52px] rounded-2xl bg-white hover:bg-neutral-200 text-black text-sm font-bold transition-colors"
              >
                {startModalFormat.id === 'upload' ? 'Blank design' : 'Blank design'}
              </button>
              <button
                onClick={() => {
                  const cat = startModalFormat.categoryFilter;
                  setStartModalFormat(null);
                  setCategoryFilter(cat);
                  onTabChange('templates');
                }}
                className="min-h-[52px] rounded-2xl bg-black border border-white hover:bg-neutral-900 text-white text-sm font-bold transition-colors"
              >
                Templates
              </button>
            </div>

            {startModalFormat.id === 'upload' && (
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="w-full min-h-[48px] rounded-2xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Choose photo from mobile gallery</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fixed Black Bottom Navigation Bar: [Home] [Your Designs] [Templates] [Canva AI] [More] */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-neutral-800 grid grid-cols-5 items-center z-40">
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'designs', label: 'Your Designs', icon: LayoutGrid },
            { id: 'templates', label: 'Templates', icon: LayoutTemplate },
            { id: 'ai', label: 'Canva AI', icon: Sparkles },
            { id: 'more', label: 'More', icon: MoreHorizontal },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-none whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
