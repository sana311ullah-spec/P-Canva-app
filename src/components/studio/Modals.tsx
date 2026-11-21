import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Film,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { FORMAT_PRESETS } from '../../data/seedWorkspace';
import type { DesignPage, DesignProject } from '../../types/studio';
import {
  exportDesignAsVideo,
  exportPageAsSvg,
  renderPageToDataUrl,
  triggerFileDownload,
} from '../../utils/canvasExport';
import { ElementRenderer } from './ElementRenderer';

interface ShareExportModalProps {
  design: DesignProject;
  activePage: DesignPage;
  onClose: () => void;
  onShareAccessChange: (access: 'view' | 'comment' | 'edit') => void;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  design,
  activePage,
  onClose,
  onShareAccessChange,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg' | 'json'>('png');
  const [scale, setScale] = useState<number>(2);
  const [exporting, setExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Video export state
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'webm'>('mp4');
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p'>('720p');
  const [secondsPerSlide, setSecondsPerSlide] = useState<number>(3);
  const [videoRecording, setVideoRecording] = useState(false);
  const [videoProgress, setVideoProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [videoNotice, setVideoNotice] = useState<string | null>(null);

  const handleDownload = async () => {
    setExporting(true);
    const slug = design.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'pcanva-design';
    try {
      if (format === 'png' || format === 'jpeg') {
        const dataUrl = await renderPageToDataUrl(design, activePage, format, scale);
        triggerFileDownload(dataUrl, `${slug}.${format}`);
      } else if (format === 'svg') {
        const svg = exportPageAsSvg(design, activePage);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        triggerFileDownload(url, `${slug}.svg`);
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      } else {
        const json = JSON.stringify(design, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        triggerFileDownload(url, `${slug}.pcanva.json`);
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (videoRecording) return;
    setVideoRecording(true);
    setVideoNotice(null);
    setVideoProgress({ current: 1, total: Math.max(1, design.pages.length) });
    const slug = design.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'pcanva-design';

    try {
      const result = await exportDesignAsVideo(design, {
        format: videoFormat,
        quality: videoQuality,
        secondsPerSlide,
        onProgress: (current, total) => setVideoProgress({ current, total }),
      });

      const url = URL.createObjectURL(result.blob);
      triggerFileDownload(url, `${slug}-${videoQuality}.${result.actualFormat}`);
      window.setTimeout(() => URL.revokeObjectURL(url), 6000);

      if (result.usedFallback) {
        setVideoNotice(
          'Browser does not support direct MP4 recording — downloaded as WebM video instead.',
        );
      } else {
        setVideoNotice(
          `Saved ${design.pages.length} ${design.pages.length === 1 ? 'slide' : 'slides'} as ${result.actualFormat.toUpperCase()} (${videoQuality}).`,
        );
      }
    } catch (err) {
      setVideoNotice(err instanceof Error ? err.message : 'Could not record video.');
    } finally {
      setVideoRecording(false);
      setVideoProgress(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const totalSlides = Math.max(1, design.pages.length);
  const progressPercent = videoProgress
    ? Math.round((videoProgress.current / videoProgress.total) * 100)
    : 0;
  const formatLabel = videoFormat === 'mp4' ? 'MP4' : 'WebM';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md max-h-[90vh] bg-black border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <h3 className="text-base font-display font-bold">Share & Download</h3>
          <button
            onClick={onClose}
            disabled={videoRecording}
            className="text-neutral-400 hover:text-white p-1 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs overflow-y-auto">
          <div className="space-y-2">
            <div className="font-semibold text-white">Collaboration Link</div>
            <div className="flex gap-2">
              <select
                value={design.shareAccess}
                onChange={(e) =>
                  onShareAccessChange(e.target.value as 'view' | 'comment' | 'edit')
                }
                className="flex-1 h-11 px-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white"
              >
                <option value="edit">Anyone with link can edit</option>
                <option value="comment">Anyone with link can comment</option>
                <option value="view">View-only link</option>
              </select>
              <button
                onClick={handleCopyLink}
                className="h-11 px-3.5 rounded-xl border border-neutral-700 font-medium text-white hover:bg-neutral-900 flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-4 space-y-3">
            <div className="font-semibold text-white">Download ({activePage.title})</div>

            <div className="grid grid-cols-4 gap-2">
              {(['png', 'jpeg', 'svg', 'json'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`min-h-[44px] rounded-xl border uppercase font-semibold ${
                    format === fmt
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {(format === 'png' || format === 'jpeg') && (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`min-h-[40px] rounded-xl border font-mono ${
                      scale === s
                        ? 'border-white bg-white text-black font-semibold'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDownload}
                disabled={exporting || videoRecording}
                className="flex-1 min-h-[48px] rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Saving...' : `Download ${format.toUpperCase()}`}</span>
              </button>
              <button
                onClick={() => window.print()}
                disabled={videoRecording}
                className="min-h-[48px] px-4 rounded-xl border border-neutral-700 text-white font-medium hover:bg-neutral-900 flex items-center gap-1.5 disabled:opacity-60"
              >
                <Printer className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* NEW SECTION: Download Video */}
          <div className="border-t border-neutral-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-neutral-300" />
                <span>Download Video</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {totalSlides} {totalSlides === 1 ? 'slide' : 'slides'} · {totalSlides * secondsPerSlide}s
              </span>
            </div>

            {/* 1. Video Format Buttons: [ MP4 ] [ WebM ] */}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'mp4', label: 'MP4' },
                  { id: 'webm', label: 'WebM' },
                ] as const
              ).map((vf) => (
                <button
                  key={vf.id}
                  type="button"
                  disabled={videoRecording}
                  onClick={() => setVideoFormat(vf.id)}
                  className={`min-h-[44px] rounded-xl border font-semibold transition-colors ${
                    videoFormat === vf.id
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {vf.label}
                </button>
              ))}
            </div>

            {/* 2. Video Quality Buttons: [ 720p HD ] [ 1080p Full HD ] */}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: '720p', label: '720p HD' },
                  { id: '1080p', label: '1080p Full HD' },
                ] as const
              ).map((vq) => (
                <button
                  key={vq.id}
                  type="button"
                  disabled={videoRecording}
                  onClick={() => setVideoQuality(vq.id)}
                  className={`min-h-[44px] rounded-xl border font-semibold transition-colors ${
                    videoQuality === vq.id
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {vq.label}
                </button>
              ))}
            </div>

            {/* 3. Seconds per slide slider: 2s to 5s */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium">
                  Seconds per slide: {secondsPerSlide}s
                </span>
                <span className="font-mono text-[11px] text-neutral-400">2s – 5s</span>
              </div>
              <input
                type="range"
                min={2}
                max={5}
                step={1}
                disabled={videoRecording}
                value={secondsPerSlide}
                onChange={(e) => setSecondsPerSlide(Number(e.target.value))}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Recording Progress Bar */}
            {videoRecording && videoProgress && (
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-white">
                  <span>
                    Recording... {videoProgress.current}/{videoProgress.total} slides
                  </span>
                  <span className="font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {videoNotice && !videoRecording && (
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-[11px] text-neutral-200">
                {videoNotice}
              </div>
            )}

            {/* 4. Big Video Download Button */}
            <button
              type="button"
              onClick={handleDownloadVideo}
              disabled={videoRecording}
              className="w-full min-h-[50px] rounded-xl bg-white hover:bg-neutral-200 text-black text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
            >
              <Film className="w-4 h-4 shrink-0" />
              <span>
                {videoRecording && videoProgress
                  ? `Recording... ${videoProgress.current}/${videoProgress.total} slides`
                  : `Download Video - ${formatLabel} ${videoQuality}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MagicResizeModalProps {
  currentWidth: number;
  currentHeight: number;
  onClose: () => void;
  onApplyResize: (width: number, height: number, label: string) => void;
}

export const MagicResizeModal: React.FC<MagicResizeModalProps> = ({
  currentWidth,
  currentHeight,
  onClose,
  onApplyResize,
}) => {
  const [customW, setCustomW] = useState(currentWidth);
  const [customH, setCustomH] = useState(currentHeight);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-black border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-white">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-display font-bold">Resize Design</h3>
            <p className="text-xs text-neutral-400">Free resize to any format or custom pixel size.</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            {FORMAT_PRESETS.slice(0, 6).map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onApplyResize(preset.width, preset.height, preset.label);
                  onClose();
                }}
                className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-white text-left transition-colors"
              >
                <div className="font-semibold text-white">{preset.label}</div>
                <div className="font-mono text-neutral-400 mt-0.5">
                  {preset.width} × {preset.height} px
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-neutral-800 pt-4">
            <div className="font-semibold text-white mb-2">Custom Size</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customW}
                onChange={(e) => setCustomW(Math.max(100, Number(e.target.value) || 100))}
                className="w-24 h-11 px-3 rounded-xl border border-neutral-700 bg-neutral-900 font-mono text-white"
              />
              <span className="text-neutral-500">×</span>
              <input
                type="number"
                value={customH}
                onChange={(e) => setCustomH(Math.max(100, Number(e.target.value) || 100))}
                className="w-24 h-11 px-3 rounded-xl border border-neutral-700 bg-neutral-900 font-mono text-white"
              />
              <button
                onClick={() => {
                  onApplyResize(customW, customH, `Custom (${customW}×${customH})`);
                  onClose();
                }}
                className="flex-1 h-11 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold"
              >
                Resize
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PresentationModalProps {
  design: DesignProject;
  initialIndex: number;
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  design,
  initialIndex,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const [showNotes, setShowNotes] = useState(false);

  const page = design.pages[index] || design.pages[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setIndex((i) => Math.min(design.pages.length - 1, i + 1));
      }
      if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [design.pages.length, onClose]);

  const maxW = typeof window !== 'undefined' ? window.innerWidth * 0.88 : 1100;
  const maxH = typeof window !== 'undefined' ? window.innerHeight * 0.78 : 650;
  const scale = Math.min(maxW / design.width, maxH / design.height);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4 select-none">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setShowNotes((v) => !v)}
          className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-medium"
        >
          {showNotes ? 'Hide Notes' : 'Notes'}
        </button>
        <button
          onClick={onClose}
          className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-semibold flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </div>

      <div
        style={{
          width: design.width * scale,
          height: design.height * scale,
        }}
        className="relative shadow-2xl overflow-hidden rounded-lg"
      >
        <div
          style={{
            width: design.width,
            height: design.height,
            backgroundColor: page.backgroundColor,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="relative overflow-hidden"
        >
          {page.elements.map((el) => (
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

      {showNotes && page.notes && (
        <div className="mt-4 max-w-2xl px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          {page.notes}
        </div>
      )}

      <div className="mt-6 flex items-center gap-4 text-white text-xs">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono tabular-nums">
          {index + 1} / {design.pages.length} · {page.title}
        </span>
        <button
          onClick={() => setIndex((i) => Math.min(design.pages.length - 1, i + 1))}
          disabled={index === design.pages.length - 1}
          className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface PagesGridModalProps {
  design: DesignProject;
  activePageId: string;
  onSelectPage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onAddPage: () => void;
  onClose: () => void;
}

export const PagesGridModal: React.FC<PagesGridModalProps> = ({
  design,
  activePageId,
  onSelectPage,
  onDuplicatePage,
  onDeletePage,
  onAddPage,
  onClose,
}) => {
  const thumbW = 240;
  const thumbScale = thumbW / design.width;
  const thumbH = Math.round(design.height * thumbScale);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl max-h-[85vh] bg-black border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-base font-display font-bold">
            Pages · {design.title}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {design.pages.map((page, idx) => {
            const isActive = page.id === activePageId;
            return (
              <div
                key={page.id}
                onClick={() => {
                  onSelectPage(page.id);
                  onClose();
                }}
                className={`rounded-2xl border p-3 cursor-pointer ${
                  isActive ? 'border-white bg-neutral-900' : 'border-neutral-800 bg-neutral-950'
                }`}
              >
                <div
                  style={{ width: thumbW, height: thumbH }}
                  className="mx-auto rounded-lg overflow-hidden border border-neutral-800 relative"
                >
                  <div
                    style={{
                      width: design.width,
                      height: design.height,
                      backgroundColor: page.backgroundColor,
                      transform: `scale(${thumbScale})`,
                      transformOrigin: 'top left',
                    }}
                    className="relative pointer-events-none"
                  >
                    {page.elements.map((el) => (
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
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-medium truncate">
                    <span className="font-mono text-neutral-400 mr-1.5">{idx + 1}</span>
                    {page.title}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDuplicatePage(page.id)}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {design.pages.length > 1 && (
                      <button
                        onClick={() => onDeletePage(page.id)}
                        className="p-1.5 rounded hover:bg-neutral-800 text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => {
              onAddPage();
              onClose();
            }}
            className="min-h-[180px] rounded-2xl border-2 border-dashed border-neutral-800 hover:border-white flex items-center justify-center text-xs font-semibold text-neutral-300"
          >
            + Add blank page
          </button>
        </div>
      </div>
    </div>
  );
};
