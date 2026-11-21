import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Box,
  Check,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Film,
  FormInput,
  Frame,
  Grid,
  Image as ImageIcon,
  ImagePlus,
  LayoutTemplate,
  Lock,
  Music,
  Palette,
  Pause,
  Play,
  Plus,
  Search,
  Shapes,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sticker,
  Table2,
  Trash2,
  Type,
  Unlock,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import {
  ALL_SEARCHABLE_ELEMENTS,
  ANIMATION_PRESETS,
  AUDIO_ELEMENTS,
  CHART_ELEMENTS,
  ELEMENTS_CATEGORY_COLORS,
  FORM_ELEMENTS,
  FRAME_ELEMENTS,
  GRAPHIC_ELEMENTS,
  GRID_ELEMENTS,
  MOCKUP_ELEMENTS,
  SHAPE_ELEMENTS,
  SHEET_ELEMENTS,
  TABLE_ELEMENTS,
  THREE_D_ELEMENTS,
  VIDEO_ELEMENTS,
  type ExtendedElementItem,
} from '../../data/elementsCatalog';
import {
  DESIGN_TEMPLATES,
  ELEMENT_CATEGORY_META,
  FONT_COMBINATIONS,
  FONT_OPTIONS,
  PHOTO_TOPICS,
  STARTER_PHOTOS,
  TEXT_APPS,
  type ElementCategoryId,
} from '../../data/seedWorkspace';
import type {
  BrandKit,
  CanvasElement,
  DesignProject,
  DesignTemplate,
  PMTicket,
  StockPhotoItem,
  UploadedAsset,
} from '../../types/studio';
import { getPlayingAudioId, subscribeAudioState, toggleAudioPreview } from '../../utils/audioPlayer';

export type LeftDockTab =
  | 'templates'
  | 'elements'
  | 'text'
  | 'gallery'
  | 'brand'
  | 'draw'
  | 'layers';

export interface DrawToolSettings {
  active: boolean;
  mode: 'pen' | 'marker' | 'highlighter';
  color: string;
  strokeWidth: number;
}

interface LeftObjectDockProps {
  activeTab: LeftDockTab | null;
  onTabChange: (tab: LeftDockTab | null) => void;
  onApplyTemplate: (template: DesignTemplate, asNewPage: boolean) => void;
  onAddElement: (element: Omit<CanvasElement, 'id'>) => void;
  onAddTextLockup: (elements: Omit<CanvasElement, 'id'>[]) => void;
  brandKit: BrandKit;
  onUpdateBrandKit: (kit: BrandKit) => void;
  onApplyBrandToDesign: () => void;
  selectedElement: CanvasElement | null;
  onUpdateSelectedElement: (patch: Partial<CanvasElement>) => void;
  onApplyColorToSelected: (hex: string) => void;
  uploads: UploadedAsset[];
  onUploadFile: (asset: UploadedAsset, insertIntoCanvas?: boolean) => void;
  drawSettings: DrawToolSettings;
  onDrawSettingsChange: (next: DrawToolSettings) => void;
  pageElements: CanvasElement[];
  selectedIds: string[];
  onSelectElement: (id: string) => void;
  onMoveLayer: (id: string, dir: 'up' | 'down') => void;
  onToggleLock: (id: string) => void;
  onToggleHidden: (id: string) => void;
  recentDesigns: DesignProject[];
  onOpenRecentDesign: (designId: string) => void;
  activeDesignTitle: string;
  activePageNumber: number;
  totalPages: number;
  pmTickets: PMTicket[];
  linkedTicketIds: string[];
  onOpenPMDrawer: () => void;
}

const ELEMENT_CATEGORY_ICONS: Record<ElementCategoryId, React.FC<{ className?: string }>> = {
  Shapes: Shapes,
  Graphics: Sticker,
  Photos: ImageIcon,
  Videos: Film,
  '3D': Box,
  Forms: FormInput,
  Animations: Sparkles,
  Audio: Music,
  Sheets: FileSpreadsheet,
  Tables: Table2,
  Charts: BarChart3,
  Frames: Frame,
  Grids: Grid,
  Mockups: Smartphone,
};

const TEMPLATE_CATEGORIES = [
  'All',
  'Presentation',
  'Portfolio',
  'Business',
  'Education',
  'Social Media',
  'Lab Report',
  'Banner',
] as const;

const PHOTO_FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
  'linear-gradient(135deg, #059669 0%, #0EA5E9 100%)',
  'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
];

const PhotoTile: React.FC<{
  photo: StockPhotoItem;
  onClick: () => void;
}> = ({ photo, onClick }) => {
  const [failed, setFailed] = useState(false);
  const grad = PHOTO_FALLBACK_GRADIENTS[Math.abs(photo.title.length) % PHOTO_FALLBACK_GRADIENTS.length];

  return (
    <button
      onClick={onClick}
      style={{ background: grad }}
      className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-800 hover:border-white text-left"
    >
      {!failed ? (
        <img
          src={photo.thumbUrl || photo.src}
          alt={photo.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-white"
          style={{ background: grad }}
        >
          <Sparkles className="w-5 h-5 mb-1 opacity-90" />
          <span className="text-[10px] font-bold line-clamp-2 drop-shadow">{photo.title}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] text-white truncate">{photo.title}</div>
      </div>
    </button>
  );
};

const ElementPreviewThumb: React.FC<{ item: ExtendedElementItem }> = ({ item }) => {
  const [imgErr, setImgErr] = useState(false);
  const el = item.element;

  if (el.type === 'shape') {
    const kind = el.shapeKind || 'rectangle';
    const fill = el.fill || item.accentColor;
    const stroke = el.stroke && el.stroke !== 'none' ? el.stroke : 'none';
    const sw = el.strokeWidth || 0;
    const dash = el.strokeStyle === 'dashed' ? '8 5' : undefined;
    return (
      <svg viewBox="0 0 100 100" className="w-11 h-11 overflow-visible shrink-0">
        {kind === 'circle' || kind === 'oval' ? (
          <ellipse cx="50" cy="50" rx={kind === 'oval' ? 44 : 38} ry={kind === 'oval' ? 28 : 38} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'ring' ? (
          <circle cx="50" cy="50" r="32" fill="none" stroke={fill !== 'transparent' ? fill : stroke} strokeWidth="12" strokeDasharray={dash} />
        ) : kind === 'triangle' ? (
          <polygon points="50,10 90,88 10,88" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'diamond' ? (
          <polygon points="50,8 92,50 50,92 8,50" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'hexagon' ? (
          <polygon points="26,10 74,10 94,50 74,90 26,90 6,50" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'pentagon' ? (
          <polygon points="50,8 92,38 76,90 24,90 8,38" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'octagon' ? (
          <polygon points="32,8 68,8 92,32 92,68 68,92 32,92 8,68 8,32" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'star' ? (
          <polygon points="50,6 62,36 94,38 69,59 78,92 50,73 22,92 31,59 6,38 38,36" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'heart' ? (
          <path d="M50 86 C20 66 8 46 8 32 C8 18 20 10 32 10 C41 10 47 16 50 22 C53 16 59 10 68 10 C80 10 92 18 92 32 C92 46 80 66 50 86 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'arrow' ? (
          <polygon points="8,36 60,36 60,18 92,50 60,82 60,64 8,64" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'line' ? (
          <line x1="8" y1="50" x2="92" y2="50" stroke={fill !== 'transparent' ? fill : stroke} strokeWidth="10" strokeDasharray={dash} strokeLinecap="round" />
        ) : kind === 'curve' ? (
          <path d="M8 74 Q 50 12 92 74" fill="none" stroke={fill !== 'transparent' ? fill : stroke} strokeWidth="9" strokeDasharray={dash} strokeLinecap="round" />
        ) : kind === 'half-circle' ? (
          <path d="M8 76 A 42 42 0 0 1 92 76 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'blob' ? (
          <path d="M48,10 C72,8 88,24 91,46 C94,68 76,90 52,92 C28,94 9,75 8,50 C7,25 24,12 48,10 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'pill' ? (
          <rect x="8" y="28" width="84" height="44" rx="22" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'cross' ? (
          <polygon points="38,8 62,8 62,38 92,38 92,62 62,62 62,92 38,92 38,62 8,62 8,38 38,38" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'cloud' ? (
          <path d="M26,74 H74 C85,74 92,67 92,57 C92,48 85,40 76,39 C73,25 61,16 47,16 C33,16 22,25 20,38 C11,40 8,47 8,56 C8,66 16,74 26,74 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'crescent' ? (
          <path d="M60,12 C38,12 22,28 22,50 C22,72 38,88 60,88 C68,88 75,86 81,82 C66,82 52,69 52,50 C52,31 66,18 81,18 C75,14 68,12 60,12 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : kind === 'shield' ? (
          <path d="M50,8 L84,20 V46 C84,68 69,85 50,92 C31,85 16,68 16,46 V20 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        ) : (
          <rect x="12" y="18" width="76" height="64" rx={kind === 'rounded' ? 16 : 2} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        )}
      </svg>
    );
  }

  if (el.type === 'graphic' && el.is3D) {
    return (
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-md shrink-0"
        style={{
          background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 60%), ${item.accentColor}`,
        }}
      >
        {item.previewEmoji || el.graphicEmoji || '◆'}
      </div>
    );
  }

  if (el.type === 'graphic' && (item.svgPath || el.graphicSvgPath)) {
    const isStroke = el.graphicVariant === 'svg-stroke' || (el.strokeWidth || 0) > 0;
    return (
      <svg viewBox="0 0 100 100" className="w-11 h-11 overflow-visible shrink-0">
        <path
          d={item.svgPath || el.graphicSvgPath}
          fill={isStroke ? 'none' : item.accentColor}
          stroke={isStroke ? item.accentColor : 'none'}
          strokeWidth={isStroke ? 7 : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (el.type === 'media' && el.mediaKind === 'video') {
    return (
      <div
        className="w-full h-16 rounded-lg overflow-hidden relative flex items-center justify-center"
        style={{ backgroundColor: item.accentColor }}
      >
        {el.src && !imgErr && (
          <img
            src={el.src}
            alt={item.label}
            referrerPolicy="no-referrer"
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white">
          {el.mediaDuration || '00:15'}
        </span>
      </div>
    );
  }

  if (el.type === 'chart') {
    const ck = el.chartKind || 'bar';
    return (
      <div className="w-11 h-11 rounded-lg bg-white p-1.5 flex items-end justify-around gap-0.5 shrink-0">
        {ck === 'donut' || ck === 'pie' ? (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="14" fill="none" stroke={item.accentColor} strokeWidth={ck === 'pie' ? 14 : 6} strokeDasharray="55 100" />
            <circle cx="20" cy="20" r="14" fill="none" stroke="#F59E0B" strokeWidth={ck === 'pie' ? 14 : 6} strokeDasharray="30 100" strokeDashoffset="-55" />
          </svg>
        ) : ck === 'line' ? (
          <svg viewBox="0 0 40 30" className="w-full h-full">
            <polyline points="2,24 14,16 24,20 38,5" fill="none" stroke={item.accentColor} strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <span className="w-2 h-3 rounded-t-xs" style={{ backgroundColor: item.accentColor }} />
            <span className="w-2 h-6 rounded-t-xs" style={{ backgroundColor: '#2563EB' }} />
            <span className="w-2 h-8 rounded-t-xs" style={{ backgroundColor: '#10B981' }} />
          </>
        )}
      </div>
    );
  }

  if (el.type === 'frame') {
    const fk = el.frameKind || 'circle';
    return (
      <div
        className="w-11 h-11 overflow-hidden border-2 border-white/60 shrink-0"
        style={{
          backgroundColor: item.accentColor,
          borderRadius:
            fk === 'circle' || fk === 'pill'
              ? '9999px'
              : fk === 'arch'
                ? '9999px 9999px 4px 4px'
                : fk === 'blob'
                  ? '62% 38% 46% 54% / 60% 42% 58% 40%'
                  : '6px',
        }}
      />
    );
  }

  if (el.type === 'grid') {
    const cols = el.gridCols || 2;
    const rows = el.gridRows || 2;
    return (
      <div
        className="w-11 h-11 rounded-lg bg-white p-1 grid gap-0.5 shrink-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ backgroundColor: i % 2 === 0 ? item.accentColor : '#94A3B8' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ backgroundColor: item.accentColor }}
    >
      {item.category.slice(0, 2).toUpperCase()}
    </div>
  );
};

export const LeftObjectDock: React.FC<LeftObjectDockProps> = ({
  activeTab,
  onTabChange,
  onApplyTemplate,
  onAddElement,
  onAddTextLockup,
  brandKit,
  onUpdateBrandKit,
  onApplyBrandToDesign,
  selectedElement,
  onUpdateSelectedElement,
  onApplyColorToSelected,
  uploads,
  onUploadFile,
  drawSettings,
  onDrawSettingsChange,
  pageElements,
  selectedIds,
  onSelectElement,
  onMoveLayer,
  onToggleLock,
  onToggleHidden,
  recentDesigns,
  onOpenRecentDesign,
  activeDesignTitle,
  activePageNumber,
  totalPages,
}) => {
  // Templates state
  const [tplSearch, setTplSearch] = useState('');
  const [tplFilterOpen, setTplFilterOpen] = useState(false);
  const [tplCategory, setTplCategory] = useState<string>('All');
  const [tplVisibleCount, setTplVisibleCount] = useState(14);
  const [pendingTemplate, setPendingTemplate] = useState<DesignTemplate | null>(null);
  const tplSentinelRef = useRef<HTMLDivElement | null>(null);

  // Elements state
  const [elSearch, setElSearch] = useState('');
  const [activeElCategory, setActiveElCategory] = useState<ElementCategoryId | null>(null);
  const [elSubFilter, setElSubFilter] = useState<string>('All');
  const [elVisibleCount, setElVisibleCount] = useState(36);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(() => getPlayingAudioId());

  useEffect(() => {
    return subscribeAudioState(() => setPlayingAudioId(getPlayingAudioId()));
  }, []);

  useEffect(() => {
    setElSubFilter('All');
    setElVisibleCount(36);
  }, [activeElCategory, elSearch]);

  // Text & Magic Write state
  const [textSearch, setTextSearch] = useState('');
  const [magicWriteOpen, setMagicWriteOpen] = useState(false);
  const [magicPrompt, setMagicPrompt] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  // Gallery / Photos state
  const [photoSearchInput, setPhotoSearchInput] = useState('');
  const [activePhotoQuery, setActivePhotoQuery] = useState('');
  const [activePhotoTopic, setActivePhotoTopic] = useState<string>('All');
  const [livePhotos, setLivePhotos] = useState<StockPhotoItem[]>([]);
  const [photoPage, setPhotoPage] = useState(1);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoHasMore, setPhotoHasMore] = useState(true);
  const [starterVisibleCount, setStarterVisibleCount] = useState(28);
  const photoSentinelRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Brand Kit state
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [brandColorHex, setBrandColorHex] = useState('#0F766E');
  const [brandColorName, setBrandColorName] = useState('');
  const [brandAppliedToast, setBrandAppliedToast] = useState(false);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    const q = tplSearch.trim().toLowerCase();
    return DESIGN_TEMPLATES.filter((t) => {
      const catOk = tplCategory === 'All' || t.category === tplCategory;
      const qOk =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.style.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [tplCategory, tplSearch]);

  // Infinite scroll for templates
  useEffect(() => {
    setTplVisibleCount(14);
  }, [tplCategory, tplSearch]);

  useEffect(() => {
    const node = tplSentinelRef.current;
    if (!node || activeTab !== 'templates') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTplVisibleCount((c) => Math.min(filteredTemplates.length, c + 12));
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, filteredTemplates.length]);

  // Starter photos filtered by topic
  const filteredStarterPhotos = useMemo(() => {
    if (activePhotoTopic === 'All') return STARTER_PHOTOS;
    return STARTER_PHOTOS.filter((p) => p.category === activePhotoTopic);
  }, [activePhotoTopic]);

  const recommendedStarter = useMemo(
    () => filteredStarterPhotos.filter((_, i) => i % 2 === 0).slice(0, Math.ceil(starterVisibleCount / 2)),
    [filteredStarterPhotos, starterVisibleCount],
  );

  const trendingStarter = useMemo(
    () => filteredStarterPhotos.filter((_, i) => i % 2 === 1).slice(0, Math.ceil(starterVisibleCount / 2)),
    [filteredStarterPhotos, starterVisibleCount],
  );

  const fetchLivePhotos = useCallback(async (query: string, pageNum: number, append: boolean) => {
    setPhotosLoading(true);
    try {
      const res = await fetch(
        `/api/photos/search?query=${encodeURIComponent(query)}&page=${pageNum}`,
      );
      const data = await res.json();
      const incoming = (data.photos || []) as StockPhotoItem[];
      setLivePhotos((prev) => (append ? [...prev, ...incoming] : incoming));
      setPhotoHasMore(Boolean(data.hasMore) && incoming.length > 0);
    } catch {
      if (!append) {
        const qLow = query.toLowerCase();
        setLivePhotos(
          STARTER_PHOTOS.filter(
            (p) =>
              p.title.toLowerCase().includes(qLow) ||
              p.category.toLowerCase().includes(qLow),
          ),
        );
      }
      setPhotoHasMore(false);
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  // Infinite scroll for gallery photos (also when Photos category is open inside Elements)
  const isPhotosViewOpen = activeTab === 'gallery' || (activeTab === 'elements' && activeElCategory === 'Photos');
  useEffect(() => {
    const node = photoSentinelRef.current;
    if (!node || !isPhotosViewOpen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (activePhotoQuery) {
          if (!photosLoading && photoHasMore) {
            const nextP = photoPage + 1;
            setPhotoPage(nextP);
            fetchLivePhotos(activePhotoQuery, nextP, true);
          }
        } else {
          setStarterVisibleCount((c) => Math.min(filteredStarterPhotos.length, c + 24));
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    activePhotoQuery,
    isPhotosViewOpen,
    fetchLivePhotos,
    filteredStarterPhotos.length,
    photoHasMore,
    photoPage,
    photosLoading,
  ]);

  const handlePhotoSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = photoSearchInput.trim();
    setActivePhotoQuery(q);
    setPhotoPage(1);
    if (q) {
      fetchLivePhotos(q, 1, false);
    } else {
      setLivePhotos([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        onUploadFile(
          {
            id: `upl-${Date.now()}`,
            name: file.name,
            src,
            width: img.width || 600,
            height: img.height || 400,
            uploadedAt: 'Just now',
          },
          true,
        );
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      onUpdateBrandKit({
        ...brandKit,
        uploadedLogoSrc: src,
        uploadedLogoName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMagicWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicPrompt.trim() || magicLoading) return;
    setMagicLoading(true);
    setMagicError(null);
    try {
      const res = await fetch('/api/ai/magic-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: magicPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Magic Write failed');
      }
      onAddTextLockup([
        {
          type: 'text',
          name: 'Magic Write Headline',
          x: 140,
          y: 160,
          width: 680,
          height: 90,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          text: data.headline || magicPrompt,
          fontFamily: brandKit.fonts.heading,
          fontSize: 48,
          fontWeight: 700,
          color: '#0F172A',
          textAlign: 'left',
        },
        {
          type: 'text',
          name: 'Magic Write Copy',
          x: 140,
          y: 260,
          width: 640,
          height: 120,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          text: data.body || '',
          fontFamily: brandKit.fonts.body,
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.45,
          color: '#334155',
          textAlign: 'left',
        },
      ]);
      setMagicPrompt('');
      setMagicWriteOpen(false);
    } catch (err) {
      setMagicError(err instanceof Error ? err.message : 'Magic Write failed');
    } finally {
      setMagicLoading(false);
    }
  };

  const insertPhotoToCanvas = (photo: StockPhotoItem) => {
    const ratio = photo.height > 0 && photo.width > 0 ? photo.height / photo.width : 0.75;
    onAddElement({
      type: 'image',
      name: photo.title,
      x: 180,
      y: 120,
      width: 440,
      height: Math.round(440 * Math.min(1.5, Math.max(0.5, ratio))),
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      borderRadius: 10,
      src: photo.src,
      objectFit: 'cover',
    });
  };

  // Filtered Fonts & Combinations for Text Tab
  const filteredFonts = useMemo(() => {
    const q = textSearch.trim().toLowerCase();
    if (!q) return FONT_OPTIONS;
    return FONT_OPTIONS.filter((f) => f.toLowerCase().includes(q));
  }, [textSearch]);

  const filteredCombinations = useMemo(() => {
    const q = textSearch.trim().toLowerCase();
    if (!q) return FONT_COMBINATIONS;
    return FONT_COMBINATIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.headingFont.toLowerCase().includes(q) ||
        c.headingText.toLowerCase().includes(q),
    );
  }, [textSearch]);

  // Category items lookup across all 14 categories
  const categoryItemsMap: Record<Exclude<ElementCategoryId, 'Photos' | 'Animations'>, ExtendedElementItem[]> = useMemo(
    () => ({
      Shapes: SHAPE_ELEMENTS,
      Graphics: GRAPHIC_ELEMENTS,
      Videos: VIDEO_ELEMENTS,
      '3D': THREE_D_ELEMENTS,
      Forms: FORM_ELEMENTS,
      Audio: AUDIO_ELEMENTS,
      Sheets: SHEET_ELEMENTS,
      Tables: TABLE_ELEMENTS,
      Charts: CHART_ELEMENTS,
      Frames: FRAME_ELEMENTS,
      Grids: GRID_ELEMENTS,
      Mockups: MOCKUP_ELEMENTS,
    }),
    [],
  );

  const subCategoriesForActive = useMemo(() => {
    if (!activeElCategory || activeElCategory === 'Photos' || activeElCategory === 'Animations') {
      return [];
    }
    const items = categoryItemsMap[activeElCategory] || [];
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.subCategory) set.add(i.subCategory);
    });
    return set.size > 1 ? ['All', ...Array.from(set)] : [];
  }, [activeElCategory, categoryItemsMap]);

  // Filtered Elements
  const filteredElementItems = useMemo(() => {
    const q = elSearch.trim().toLowerCase();
    if (activeElCategory && activeElCategory !== 'Photos' && activeElCategory !== 'Animations') {
      const base = categoryItemsMap[activeElCategory] || [];
      return base.filter(
        (item) =>
          (elSubFilter === 'All' || item.subCategory === elSubFilter) &&
          (!q ||
            item.label.toLowerCase().includes(q) ||
            (item.subCategory || '').toLowerCase().includes(q)),
      );
    }
    if (q) {
      return ALL_SEARCHABLE_ELEMENTS.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.subCategory || '').toLowerCase().includes(q),
      );
    }
    return [];
  }, [activeElCategory, categoryItemsMap, elSearch, elSubFilter]);

  const matchingPhotosInElementSearch = useMemo(() => {
    const q = elSearch.trim().toLowerCase();
    if (!q || activeElCategory) return [];
    return STARTER_PHOTOS.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [activeElCategory, elSearch]);

  const editorBottomTabs: {
    id: 'templates' | 'elements' | 'text' | 'gallery' | 'brand';
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'elements', label: 'Elements', icon: Shapes },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'brand', label: 'Brand', icon: Palette },
  ];

  const handleBottomTabClick = (id: LeftDockTab) => {
    const next = activeTab === id ? null : id;
    onTabChange(next);
    if (drawSettings.active && id !== 'draw') {
      onDrawSettingsChange({ ...drawSettings, active: false });
    }
  };

  const drawerContent = (
    <div className="flex flex-col h-full overflow-hidden bg-black text-white">
      {/* Drawer Header */}
      <div className="px-3.5 py-2.5 border-b border-neutral-800 flex items-center justify-between gap-2 shrink-0">
        <span className="text-sm font-display font-bold capitalize text-white">
          {activeTab === 'gallery' ? 'Photos & Gallery' : activeTab}
        </span>
        <button
          onClick={() => onTabChange(null)}
          aria-label="Close panel"
          className="min-w-[36px] min-h-[36px] rounded-xl bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-neutral-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-5 pb-20">
        {/* ============================================================ */}
        {/* 1. TEMPLATES TAB                                             */}
        {/* ============================================================ */}
        {activeTab === 'templates' && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tplSearch}
                  onChange={(e) => setTplSearch(e.target.value)}
                  placeholder="Search Presentation templates"
                  className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-white placeholder-neutral-500 outline-none focus:border-white"
                />
              </div>
              <button
                onClick={() => setTplFilterOpen((v) => !v)}
                aria-label="Filter templates"
                className={`min-w-[40px] h-10 rounded-xl border flex items-center justify-center ${
                  tplFilterOpen || tplCategory !== 'All'
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 text-white border-neutral-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {tplFilterOpen && (
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTplCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${
                      tplCategory === cat
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Section 1: Recently used */}
            {recentDesigns.length > 0 && !tplSearch && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-300">Recently used</div>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {recentDesigns.slice(0, 6).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onOpenRecentDesign(d.id)}
                      className="w-36 shrink-0 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 p-2 text-left space-y-1.5"
                    >
                      <div
                        className="h-16 rounded-lg p-2 flex flex-col justify-between"
                        style={{
                          backgroundColor: d.pages[0]?.backgroundColor || '#FFFFFF',
                        }}
                      >
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-white self-end">
                          {d.pages.length}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-white truncate">
                        {d.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: More templates for you (2-col infinite scroll) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  More templates for you
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {filteredTemplates.length} templates
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {filteredTemplates.slice(0, tplVisibleCount).map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setPendingTemplate(tpl)}
                    className="group rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 overflow-hidden text-left transition-colors"
                  >
                    <div
                      className="h-24 p-2.5 flex flex-col justify-between relative"
                      style={{ backgroundColor: tpl.previewBg }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-300 truncate max-w-[72%]">
                          {tpl.category}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-black/80 border border-white/20 text-[10px] font-mono font-bold text-white">
                          {tpl.pageCount}
                        </span>
                      </div>
                      <div className="text-xs font-display font-bold text-white line-clamp-2 leading-tight">
                        {tpl.title}
                      </div>
                    </div>
                    <div className="px-2.5 py-2 bg-neutral-950">
                      <div className="text-[11px] font-semibold text-white truncate">
                        {tpl.title}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {tpl.style} · {tpl.pageCount} pages
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {tplVisibleCount < filteredTemplates.length && (
                <div
                  ref={tplSentinelRef}
                  className="py-4 text-center text-xs text-neutral-500"
                >
                  Loading more templates...
                </div>
              )}
            </div>

            {/* Replace page / Add as page Prompt when clicking a template */}
            {pendingTemplate && (
              <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
                <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-display font-bold text-white">
                        {pendingTemplate.title}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {pendingTemplate.category} · {pendingTemplate.pageCount} pages ·{' '}
                        {pendingTemplate.width}×{pendingTemplate.height}
                      </div>
                    </div>
                    <button
                      onClick={() => setPendingTemplate(null)}
                      className="min-w-[36px] min-h-[36px] rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    className="h-28 rounded-2xl p-4 flex flex-col justify-between"
                    style={{ backgroundColor: pendingTemplate.previewBg }}
                  >
                    <span className="text-[11px] font-mono text-neutral-300">
                      {pendingTemplate.formatLabel}
                    </span>
                    <span className="text-lg font-display font-bold text-white">
                      {pendingTemplate.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => {
                        onApplyTemplate(pendingTemplate, false);
                        setPendingTemplate(null);
                      }}
                      className="min-h-[48px] rounded-xl bg-black border border-neutral-700 hover:border-white text-white text-xs font-bold"
                    >
                      Replace page
                    </button>
                    <button
                      onClick={() => {
                        onApplyTemplate(pendingTemplate, true);
                        setPendingTemplate(null);
                      }}
                      className="min-h-[48px] rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold"
                    >
                      Add as page
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* 2. ELEMENTS TAB (14 Browse Categories — Complete Library)    */}
        {/* ============================================================ */}
        {activeTab === 'elements' && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={elSearch}
                onChange={(e) => setElSearch(e.target.value)}
                placeholder="Search elements"
                className="w-full h-10 pl-9 pr-8 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-white placeholder-neutral-500 outline-none focus:border-white"
              />
              {elSearch && (
                <button
                  onClick={() => setElSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!activeElCategory && !elSearch.trim() ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-neutral-300">Browse categories</div>
                <div className="grid grid-cols-3 gap-2">
                  {ELEMENT_CATEGORY_META.map((cat) => {
                    const Icon = ELEMENT_CATEGORY_ICONS[cat.id];
                    const badgeColor = ELEMENTS_CATEGORY_COLORS[cat.id] || 'bg-neutral-800';
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveElCategory(cat.id)}
                        className="p-2.5 min-h-[84px] rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 flex flex-col items-center justify-center gap-2 text-center transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-xl ${badgeColor} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold text-white leading-tight">
                          {cat.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeElCategory && (
                  <button
                    onClick={() => {
                      setActiveElCategory(null);
                      setElSearch('');
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to categories · {activeElCategory}</span>
                  </button>
                )}

                {/* PHOTOS CATEGORY VIEW INSIDE ELEMENTS */}
                {activeElCategory === 'Photos' && (
                  <div className="space-y-3">
                    <form onSubmit={handlePhotoSearchSubmit} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={photoSearchInput}
                          onChange={(e) => {
                            setPhotoSearchInput(e.target.value);
                            if (!e.target.value.trim()) {
                              setActivePhotoQuery('');
                              setLivePhotos([]);
                            }
                          }}
                          placeholder="Search flower, lab, sunset, eye..."
                          className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-white placeholder-neutral-500 outline-none focus:border-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-9 px-3 rounded-xl bg-white text-black text-xs font-bold shrink-0"
                      >
                        Go
                      </button>
                    </form>

                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {['All', ...PHOTO_TOPICS].map((topic) => (
                        <button
                          key={topic}
                          onClick={() => {
                            setActivePhotoTopic(topic);
                            setActivePhotoQuery('');
                            setPhotoSearchInput('');
                            setLivePhotos([]);
                            setStarterVisibleCount(28);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border ${
                            activePhotoTopic === topic && !activePhotoQuery
                              ? 'bg-white text-black border-white'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>

                    {activePhotoQuery ? (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          {livePhotos.map((photo) => (
                            <PhotoTile
                              key={photo.id}
                              photo={photo}
                              onClick={() => insertPhotoToCanvas(photo)}
                            />
                          ))}
                        </div>
                        {photosLoading && (
                          <div className="py-3 text-center text-xs text-neutral-400">
                            Searching free photos...
                          </div>
                        )}
                        {photoHasMore && <div ref={photoSentinelRef} className="h-6" />}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-neutral-300">Recommended</div>
                          <div className="grid grid-cols-2 gap-2">
                            {recommendedStarter.map((photo) => (
                              <PhotoTile
                                key={photo.id}
                                photo={photo}
                                onClick={() => insertPhotoToCanvas(photo)}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-neutral-300">Trending</div>
                          <div className="grid grid-cols-2 gap-2">
                            {trendingStarter.map((photo) => (
                              <PhotoTile
                                key={photo.id}
                                photo={photo}
                                onClick={() => insertPhotoToCanvas(photo)}
                              />
                            ))}
                          </div>
                        </div>
                        {starterVisibleCount < filteredStarterPhotos.length && (
                          <div ref={photoSentinelRef} className="py-3 text-center text-xs text-neutral-500">
                            Loading more photos...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ANIMATIONS CATEGORY VIEW (Live Preview + Apply to Selected) */}
                {activeElCategory === 'Animations' && (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
                      {selectedElement
                        ? `Selected: "${selectedElement.name}" — Tap an animation to apply.`
                        : 'Select any text or image on canvas, or tap an effect to add an animated badge.'}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ANIMATION_PRESETS.map((anim) => {
                        const isActive = selectedElement?.animationEffect === anim.id;
                        return (
                          <button
                            key={anim.id}
                            onClick={() => {
                              if (selectedElement) {
                                onUpdateSelectedElement({ animationEffect: anim.id });
                              } else if (anim.id !== 'none') {
                                onAddElement({
                                  type: 'media',
                                  mediaKind: 'animation',
                                  animationEffect: anim.id,
                                  mediaDuration: anim.label.toUpperCase(),
                                  name: `${anim.label} Motion`,
                                  x: 220,
                                  y: 220,
                                  width: 280,
                                  height: 90,
                                  rotation: 0,
                                  opacity: 1,
                                  locked: false,
                                  hidden: false,
                                  fill: anim.color,
                                });
                              }
                            }}
                            className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-2 transition-colors ${
                              isActive
                                ? 'border-white bg-neutral-900'
                                : 'border-neutral-800 bg-neutral-950 hover:border-white'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                                anim.id !== 'none' ? `anim-${anim.id}` : ''
                              }`}
                              style={{ backgroundColor: anim.color }}
                            >
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-bold text-white">{anim.label}</div>
                              <div className="text-[10px] text-neutral-400">{anim.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AUDIO CATEGORY VIEW (Play Preview + Add to Design) */}
                {activeElCategory === 'Audio' && (
                  <div className="space-y-3">
                    {subCategoriesForActive.length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {subCategoriesForActive.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setElSubFilter(sub)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border ${
                              elSubFilter === sub
                                ? 'bg-white text-black border-white'
                                : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {filteredElementItems.slice(0, elVisibleCount).map((item) => {
                        const isPlaying = playingAudioId === item.id;
                        return (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center gap-2.5"
                          >
                            <button
                              onClick={() =>
                                toggleAudioPreview(item.id, item.subCategory || 'Background Music')
                              }
                              className="w-9 h-9 rounded-full text-white flex items-center justify-center shrink-0"
                              style={{ backgroundColor: item.accentColor }}
                              title={isPlaying ? 'Stop' : 'Play'}
                            >
                              {isPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-white truncate">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-neutral-400">
                                {item.subCategory} · {item.previewHint}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                onAddElement(JSON.parse(JSON.stringify(item.element)))
                              }
                              className="h-8 px-2.5 rounded-lg bg-white text-black text-[11px] font-bold shrink-0"
                            >
                              + Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {elVisibleCount < filteredElementItems.length && (
                      <button
                        onClick={() => setElVisibleCount((c) => c + 36)}
                        className="w-full py-2.5 rounded-xl border border-neutral-800 text-xs font-semibold text-white hover:border-white"
                      >
                        Load more ({filteredElementItems.length - elVisibleCount} remaining)
                      </button>
                    )}
                  </div>
                )}

                {/* ALL OTHER CATEGORIES + UNIFIED SEARCH RESULTS */}
                {activeElCategory !== 'Photos' &&
                  activeElCategory !== 'Animations' &&
                  activeElCategory !== 'Audio' && (
                    <div className="space-y-3">
                      {subCategoriesForActive.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {subCategoriesForActive.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => setElSubFilter(sub)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border ${
                                elSubFilter === sub
                                  ? 'bg-white text-black border-white'
                                  : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {filteredElementItems.slice(0, elVisibleCount).map((item) => (
                          <button
                            key={item.id}
                            onClick={() =>
                              onAddElement(JSON.parse(JSON.stringify(item.element)))
                            }
                            className="p-2.5 min-h-[86px] rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 text-left flex flex-col items-center justify-between gap-2 transition-colors"
                          >
                            <ElementPreviewThumb item={item} />
                            <div className="w-full text-center">
                              <div className="text-[11px] font-semibold text-white truncate">
                                {item.label}
                              </div>
                              <div className="text-[9px] font-mono text-neutral-400 truncate">
                                {item.subCategory || item.previewHint}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {matchingPhotosInElementSearch.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-neutral-800">
                          <div className="text-xs font-semibold text-neutral-300">
                            Matching Photos
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {matchingPhotosInElementSearch.map((photo) => (
                              <PhotoTile
                                key={photo.id}
                                photo={photo}
                                onClick={() => insertPhotoToCanvas(photo)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {elVisibleCount < filteredElementItems.length && (
                        <button
                          onClick={() => setElVisibleCount((c) => c + 36)}
                          className="w-full py-2.5 rounded-xl border border-neutral-800 text-xs font-semibold text-white hover:border-white"
                        >
                          Load more ({filteredElementItems.length - elVisibleCount} more)
                        </button>
                      )}

                      {filteredElementItems.length === 0 &&
                        matchingPhotosInElementSearch.length === 0 && (
                          <div className="py-8 text-center text-xs text-neutral-500">
                            No matching elements found. Try "circle", "flower", "lab", "chart", or "t-shirt".
                          </div>
                        )}
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* 3. TEXT TAB (Magic Write, 33 Fonts, Styles, Combos, Apps)    */}
        {/* ============================================================ */}
        {activeTab === 'text' && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                placeholder="Search fonts and combinations"
                className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-white placeholder-neutral-500 outline-none focus:border-white"
              />
            </div>

            {/* + Add a text box + Magic Write */}
            <div className="space-y-2">
              <button
                onClick={() =>
                  onAddElement({
                    type: 'text',
                    name: 'Text Box',
                    x: 180,
                    y: 200,
                    width: 480,
                    height: 80,
                    rotation: 0,
                    opacity: 1,
                    locked: false,
                    hidden: false,
                    text: 'Your paragraph text',
                    fontFamily: brandKit.fonts.body,
                    fontSize: 28,
                    fontWeight: 400,
                    color: '#0F172A',
                    textAlign: 'left',
                  })
                }
                className="w-full min-h-[48px] px-4 rounded-xl bg-white hover:bg-neutral-200 text-black text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add a text box</span>
              </button>

              <button
                onClick={() => setMagicWriteOpen((v) => !v)}
                className="w-full min-h-[46px] px-4 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-white text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                <span>Magic Write</span>
              </button>

              {magicWriteOpen && (
                <form
                  onSubmit={handleMagicWriteSubmit}
                  className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950 space-y-2.5"
                >
                  <textarea
                    value={magicPrompt}
                    onChange={(e) => setMagicPrompt(e.target.value)}
                    rows={2}
                    placeholder="What should Magic Write write for your design?"
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 outline-none focus:border-white"
                  />
                  {magicError && <div className="text-[11px] text-rose-400">{magicError}</div>}
                  <button
                    type="submit"
                    disabled={magicLoading || !magicPrompt.trim()}
                    className="w-full min-h-[40px] rounded-xl bg-white text-black text-xs font-bold disabled:opacity-50"
                  >
                    {magicLoading ? 'Writing...' : 'Generate & Add to Canvas'}
                  </button>
                </form>
              )}
            </div>

            {/* Default Text Styles */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-400">Default text styles</div>
              <button
                onClick={() =>
                  onAddElement({
                    type: 'text',
                    name: 'Heading',
                    x: 160,
                    y: 140,
                    width: 620,
                    height: 90,
                    rotation: 0,
                    opacity: 1,
                    locked: false,
                    hidden: false,
                    text: 'Add a heading',
                    fontFamily: brandKit.fonts.heading,
                    fontSize: 58,
                    fontWeight: 700,
                    color: '#0F172A',
                    textAlign: 'left',
                  })
                }
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 text-left text-lg font-bold text-white"
              >
                Add a heading
              </button>
              <button
                onClick={() =>
                  onAddElement({
                    type: 'text',
                    name: 'Subheading',
                    x: 160,
                    y: 230,
                    width: 520,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    locked: false,
                    hidden: false,
                    text: 'Add a subheading',
                    fontFamily: brandKit.fonts.subheading,
                    fontSize: 32,
                    fontWeight: 600,
                    color: '#1E293B',
                    textAlign: 'left',
                  })
                }
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 text-left text-sm font-semibold text-white"
              >
                Add a subheading
              </button>
              <button
                onClick={() =>
                  onAddElement({
                    type: 'text',
                    name: 'Body text',
                    x: 160,
                    y: 300,
                    width: 480,
                    height: 80,
                    rotation: 0,
                    opacity: 1,
                    locked: false,
                    hidden: false,
                    text: 'Add a little bit of body text',
                    fontFamily: brandKit.fonts.body,
                    fontSize: 20,
                    fontWeight: 400,
                    color: '#475569',
                    lineHeight: 1.5,
                    textAlign: 'left',
                  })
                }
                className="w-full min-h-[42px] px-3.5 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 text-left text-xs text-neutral-300"
              >
                Add a little bit of body text
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onAddElement({
                      type: 'text',
                      name: 'Page Number',
                      dynamicField: 'pageNumber',
                      x: 1080,
                      y: 650,
                      width: 140,
                      height: 36,
                      rotation: 0,
                      opacity: 0.8,
                      locked: false,
                      hidden: false,
                      text: `Page ${activePageNumber} / ${totalPages}`,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#334155',
                      textAlign: 'right',
                    })
                  }
                  className="min-h-[42px] px-3 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 text-xs font-medium text-white"
                >
                  Page numbers
                </button>
                <button
                  onClick={() =>
                    onAddElement({
                      type: 'text',
                      name: 'Dynamic Text',
                      dynamicField: 'projectTitle',
                      x: 72,
                      y: 650,
                      width: 420,
                      height: 36,
                      rotation: 0,
                      opacity: 0.8,
                      locked: false,
                      hidden: false,
                      text: `${activeDesignTitle} · ${new Date().toLocaleDateString()}`,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#475569',
                      textAlign: 'left',
                    })
                  }
                  className="min-h-[42px] px-3 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 text-xs font-medium text-white"
                >
                  Dynamic text
                </button>
              </div>
            </div>

            {/* Font Combinations */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-neutral-400">Font combinations</div>
              <div className="grid grid-cols-2 gap-2">
                {filteredCombinations.map((combo) => (
                  <button
                    key={combo.id}
                    onClick={() =>
                      onAddTextLockup([
                        {
                          type: 'text',
                          name: combo.name,
                          x: 160,
                          y: 160,
                          width: 540,
                          height: 90,
                          rotation: 0,
                          opacity: 1,
                          locked: false,
                          hidden: false,
                          text: combo.headingText,
                          fontFamily: combo.headingFont,
                          fontSize: combo.headingSize,
                          fontWeight: 700,
                          color: combo.accentColor,
                          textAlign: 'center',
                        },
                        {
                          type: 'text',
                          name: `${combo.name} Sub`,
                          x: 200,
                          y: 248,
                          width: 460,
                          height: 40,
                          rotation: 0,
                          opacity: 0.85,
                          locked: false,
                          hidden: false,
                          text: combo.subText,
                          fontFamily: combo.subFont,
                          fontSize: combo.subSize,
                          fontWeight: 600,
                          letterSpacing: 1.5,
                          color: '#334155',
                          textAlign: 'center',
                        },
                      ])
                    }
                    className="p-3 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 text-center space-y-1"
                  >
                    <div
                      className="text-sm font-bold text-white truncate"
                      style={{ fontFamily: `"${combo.headingFont}", sans-serif` }}
                    >
                      {combo.headingText}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">{combo.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Apps: TypeStudio, TypeCraft, MotionText */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-neutral-400">Apps</div>
              <div className="grid grid-cols-3 gap-2">
                {TEXT_APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() =>
                      onAddElement({
                        type: 'text',
                        name: app.appName,
                        x: 180,
                        y: 180,
                        width: 520,
                        height: 95,
                        rotation: 0,
                        opacity: 1,
                        locked: false,
                        hidden: false,
                        text: app.sampleText,
                        fontFamily: app.fontFamily,
                        fontSize: app.fontSize,
                        fontWeight: 800,
                        color: app.color,
                        textEffect: app.effect,
                        textAlign: 'center',
                      })
                    }
                    className="p-2.5 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 text-center space-y-1"
                  >
                    <div className="text-xs font-bold text-white">{app.appName}</div>
                    <div className="text-[10px] text-neutral-400 line-clamp-2">{app.tagline}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 33 Free Fonts List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">
                  All Free Fonts ({filteredFonts.length})
                </span>
                <span className="text-[10px] text-neutral-500">
                  {selectedElement?.type === 'text' ? 'Tap to apply' : 'Tap to insert'}
                </span>
              </div>
              <div className="space-y-1">
                {filteredFonts.map((font) => {
                  const isCurrent = selectedElement?.fontFamily === font;
                  return (
                    <button
                      key={font}
                      onClick={() => {
                        if (selectedElement && selectedElement.type === 'text') {
                          onUpdateSelectedElement({ fontFamily: font });
                        } else {
                          onAddElement({
                            type: 'text',
                            name: font,
                            x: 180,
                            y: 200,
                            width: 520,
                            height: 80,
                            rotation: 0,
                            opacity: 1,
                            locked: false,
                            hidden: false,
                            text: font,
                            fontFamily: font,
                            fontSize: 44,
                            fontWeight: 700,
                            color: '#0F172A',
                            textAlign: 'left',
                          });
                        }
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-left flex items-center justify-between text-sm transition-colors ${
                        isCurrent
                          ? 'bg-white text-black border-white font-semibold'
                          : 'bg-neutral-950 text-white border-neutral-800 hover:border-neutral-600'
                      }`}
                      style={{ fontFamily: `"${font}", sans-serif` }}
                    >
                      <span className="truncate">{font}</span>
                      {isCurrent && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* 4. GALLERY / PHOTOS TAB (Live Public API + 216+ Starter)     */}
        {/* ============================================================ */}
        {activeTab === 'gallery' && (
          <>
            <form onSubmit={handlePhotoSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={photoSearchInput}
                  onChange={(e) => {
                    setPhotoSearchInput(e.target.value);
                    if (!e.target.value.trim()) {
                      setActivePhotoQuery('');
                      setLivePhotos([]);
                    }
                  }}
                  placeholder="Search flower, lab, sunset, eye, nature..."
                  className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-white placeholder-neutral-500 outline-none focus:border-white"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-3.5 rounded-xl bg-white text-black text-xs font-bold shrink-0"
              >
                Go
              </button>
            </form>

            {/* Upload from device gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[44px] rounded-xl border border-neutral-700 hover:border-white bg-neutral-950 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Upload from device gallery</span>
            </button>

            {uploads.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-400">Your Uploads</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {uploads.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() =>
                        onAddElement({
                          type: 'image',
                          name: asset.name,
                          x: 160,
                          y: 120,
                          width: 360,
                          height: Math.round(360 * (asset.height / Math.max(asset.width, 1))),
                          rotation: 0,
                          opacity: 1,
                          locked: false,
                          hidden: false,
                          src: asset.src,
                          objectFit: 'cover',
                        })
                      }
                      className="aspect-square rounded-lg overflow-hidden border border-neutral-800 hover:border-white"
                    >
                      <img
                        src={asset.src}
                        alt={asset.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Quick Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {['All', ...PHOTO_TOPICS].map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setActivePhotoTopic(topic);
                    setActivePhotoQuery('');
                    setPhotoSearchInput('');
                    setLivePhotos([]);
                    setStarterVisibleCount(28);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border ${
                    activePhotoTopic === topic && !activePhotoQuery
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {activePhotoQuery ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300">
                    Results for "{activePhotoQuery}"
                  </span>
                  <button
                    onClick={() => {
                      setActivePhotoQuery('');
                      setPhotoSearchInput('');
                      setLivePhotos([]);
                    }}
                    className="text-neutral-400 hover:text-white underline"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {livePhotos.map((photo) => (
                    <PhotoTile
                      key={photo.id}
                      photo={photo}
                      onClick={() => insertPhotoToCanvas(photo)}
                    />
                  ))}
                </div>

                {photosLoading && (
                  <div className="py-4 text-center text-xs text-neutral-400">
                    Loading free library photos...
                  </div>
                )}

                {!photosLoading && livePhotos.length === 0 && (
                  <div className="py-8 text-center text-xs text-neutral-500">
                    Try another keyword like flower, lab, sunset, eye, or nature.
                  </div>
                )}

                {photoHasMore && <div ref={photoSentinelRef} className="h-6" />}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-300">Recommended for you</div>
                  <div className="grid grid-cols-2 gap-2">
                    {recommendedStarter.map((photo) => (
                      <PhotoTile
                        key={photo.id}
                        photo={photo}
                        onClick={() => insertPhotoToCanvas(photo)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-300">Trending</div>
                  <div className="grid grid-cols-2 gap-2">
                    {trendingStarter.map((photo) => (
                      <PhotoTile
                        key={photo.id}
                        photo={photo}
                        onClick={() => insertPhotoToCanvas(photo)}
                      />
                    ))}
                  </div>
                </div>

                {starterVisibleCount < filteredStarterPhotos.length && (
                  <div ref={photoSentinelRef} className="py-3 text-center text-xs text-neutral-500">
                    Loading more photos...
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* 5. BRAND TAB (Logo Upload, Colors, Fonts, 1-Click Apply)     */}
        {/* ============================================================ */}
        {activeTab === 'brand' && (
          <div className="space-y-5">
            <button
              onClick={() => {
                onApplyBrandToDesign();
                setBrandAppliedToast(true);
                setTimeout(() => setBrandAppliedToast(false), 2000);
              }}
              className="w-full min-h-[48px] px-4 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{brandAppliedToast ? 'Brand Applied!' : 'Apply Brand to Design (1-Click)'}</span>
            </button>

            {/* Brand Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 block">Brand Name</label>
              <input
                type="text"
                value={brandKit.orgName}
                onChange={(e) => onUpdateBrandKit({ ...brandKit, orgName: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-800 bg-neutral-900 text-xs text-white outline-none focus:border-white"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">Brand Logo</span>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs font-semibold text-white underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo</span>
                </button>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleBrandLogoUpload}
                className="hidden"
              />

              {brandKit.uploadedLogoSrc ? (
                <button
                  onClick={() =>
                    onAddElement({
                      type: 'image',
                      name: brandKit.uploadedLogoName || 'Brand Logo',
                      x: 72,
                      y: 48,
                      width: 140,
                      height: 140,
                      rotation: 0,
                      opacity: 1,
                      locked: false,
                      hidden: false,
                      src: brandKit.uploadedLogoSrc,
                      objectFit: 'contain',
                    })
                  }
                  className="w-full p-3 rounded-xl border border-neutral-800 hover:border-white bg-neutral-950 flex items-center gap-3"
                >
                  <img
                    src={brandKit.uploadedLogoSrc}
                    alt="Brand Logo"
                    className="w-12 h-12 rounded-lg object-contain bg-white p-1"
                  />
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      {brandKit.uploadedLogoName || 'Custom Brand Logo'}
                    </div>
                    <div className="text-[11px] text-neutral-400">Tap to insert onto canvas</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-5 rounded-xl border border-dashed border-neutral-700 hover:border-white text-xs text-neutral-400 flex items-center justify-center gap-2"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>Upload your brand logo (PNG / JPG / SVG)</span>
                </button>
              )}
            </div>

            {/* Brand Colors */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">Brand Colors</span>
                <span className="text-[10px] text-neutral-500">
                  {selectedElement ? 'Tap to color selected' : 'Click + to add'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {brandKit.colors.map((c, idx) => (
                  <div
                    key={`${c.hex}-${idx}`}
                    className="p-2 rounded-xl border border-neutral-800 bg-neutral-950 space-y-1.5 relative group"
                  >
                    <button
                      onClick={() => onApplyColorToSelected(c.hex)}
                      className="w-full text-left"
                    >
                      <div
                        className="h-8 w-full rounded-lg border border-white/10 mb-1"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="text-[11px] font-medium text-white truncate">{c.name}</div>
                      <div className="text-[10px] font-mono text-neutral-400">{c.hex}</div>
                    </button>
                    {brandKit.colors.length > 2 && (
                      <button
                        onClick={() =>
                          onUpdateBrandKit({
                            ...brandKit,
                            colors: brandKit.colors.filter((_, i) => i !== idx),
                          })
                        }
                        className="absolute top-1 right-1 p-1 rounded bg-black/80 text-neutral-400 hover:text-rose-400 opacity-0 group-hover:opacity-100"
                        title="Remove color"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandColorHex}
                  onChange={(e) => setBrandColorHex(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={brandColorName}
                  onChange={(e) => setBrandColorName(e.target.value)}
                  placeholder="Color label"
                  className="flex-1 h-10 px-3 rounded-xl border border-neutral-800 bg-neutral-900 text-xs text-white outline-none"
                />
                <button
                  onClick={() => {
                    onUpdateBrandKit({
                      ...brandKit,
                      colors: [
                        ...brandKit.colors,
                        { name: brandColorName.trim() || brandColorHex, hex: brandColorHex },
                      ],
                    });
                    setBrandColorName('');
                  }}
                  className="h-10 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Brand Fonts */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-neutral-400">Brand Fonts</div>
              {(
                [
                  ['heading', 'Heading Font'],
                  ['subheading', 'Subheading Font'],
                  ['body', 'Body Font'],
                ] as const
              ).map(([role, label]) => (
                <div key={role} className="space-y-1">
                  <label className="text-[11px] text-neutral-400 block">{label}</label>
                  <select
                    value={brandKit.fonts[role]}
                    onChange={(e) =>
                      onUpdateBrandKit({
                        ...brandKit,
                        fonts: { ...brandKit.fonts, [role]: e.target.value },
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-neutral-800 bg-neutral-900 text-xs text-white outline-none"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* DRAW TAB                                                     */}
        {/* ============================================================ */}
        {activeTab === 'draw' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Drawing Ink</span>
              <button
                onClick={() =>
                  onDrawSettingsChange({
                    ...drawSettings,
                    active: !drawSettings.active,
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  drawSettings.active
                    ? 'bg-white text-black'
                    : 'bg-neutral-900 text-neutral-200 border border-neutral-700'
                }`}
              >
                {drawSettings.active ? 'Drawing On' : 'Enable Draw'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['pen', 'marker', 'highlighter'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    onDrawSettingsChange({
                      ...drawSettings,
                      active: true,
                      mode,
                      strokeWidth: mode === 'pen' ? 4 : mode === 'marker' ? 10 : 22,
                    })
                  }
                  className={`min-h-[44px] rounded-xl text-xs font-medium capitalize border ${
                    drawSettings.mode === mode
                      ? 'border-white bg-white text-black font-semibold'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-neutral-400 flex justify-between mb-1">
                <span>Stroke Weight</span>
                <span className="font-mono tabular-nums">{drawSettings.strokeWidth}px</span>
              </label>
              <input
                type="range"
                min={2}
                max={36}
                value={drawSettings.strokeWidth}
                onChange={(e) =>
                  onDrawSettingsChange({
                    ...drawSettings,
                    strokeWidth: Number(e.target.value),
                  })
                }
                className="w-full accent-white"
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              {['#0F172A', '#DC2626', '#2563EB', '#10B981', '#F59E0B', '#FFFFFF'].map((hex) => (
                <button
                  key={hex}
                  onClick={() =>
                    onDrawSettingsChange({ ...drawSettings, active: true, color: hex })
                  }
                  className={`w-9 h-9 rounded-full border-2 ${
                    drawSettings.color === hex ? 'border-white scale-110' : 'border-neutral-700'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LAYERS TAB                                                   */}
        {/* ============================================================ */}
        {activeTab === 'layers' && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-400 mb-2">
              Layers ({pageElements.length})
            </div>
            {[...pageElements].reverse().map((el) => {
              const isSelected = selectedIds.includes(el.id);
              return (
                <div
                  key={el.id}
                  onClick={() => onSelectElement(el.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-white bg-neutral-900'
                      : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-900'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white truncate">{el.name}</div>
                    <div className="text-[11px] font-mono text-neutral-400 uppercase">
                      {el.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayer(el.id, 'up');
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayer(el.id, 'down');
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHidden(el.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white"
                    >
                      {el.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock(el.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white"
                    >
                      {el.locked ? (
                        <Lock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Left Panel Drawer when a tab is open */}
      {activeTab && (
        <aside className="hidden md:flex w-80 lg:w-[340px] border-r border-neutral-800 h-full overflow-hidden shrink-0 z-20 bg-black">
          <div className="w-full h-full">{drawerContent}</div>
        </aside>
      )}

      {/* Mobile Bottom Sheet Drawer */}
      {activeTab && (
        <div className="md:hidden fixed inset-x-0 bottom-16 top-24 bg-black border-t border-neutral-800 rounded-t-3xl z-40 overflow-hidden shadow-2xl">
          {drawerContent}
        </div>
      )}

      {/* Editor Bottom Bar: 5 Exact Tabs [Templates] [Elements] [Text] [Gallery] [Brand] */}
      <nav
        aria-label="Editor tools"
        className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-neutral-800 grid grid-cols-5 items-center z-40 select-none"
      >
        {editorBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleBottomTabClick(tab.id)}
              className={`h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-white font-semibold bg-neutral-900/70' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-none whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
