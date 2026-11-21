import React, { useState } from 'react';
import { Download, ExternalLink, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'topRight';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'banner' }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Hide once installed and running in standalone mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      {variant === 'topRight' ? (
        <button
          onClick={handleClick}
          className="w-full sm:w-auto min-h-[48px] px-5 rounded-2xl bg-white hover:bg-neutral-200 text-black text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.99] transition-all"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Install App</span>
        </button>
      ) : variant === 'banner' ? (
        <button
          onClick={handleClick}
          className="w-full p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white flex items-center justify-between gap-3 text-left transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-black border border-neutral-700 text-white flex items-center justify-center font-display font-bold text-base shrink-0">
              p.
            </div>
            <div className="min-w-0">
              <div className="text-sm font-display font-bold text-white truncate">
                Install p.canva App
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Real offline app · Opens in standalone window
              </div>
            </div>
          </div>
          <span className="min-h-[42px] px-4 py-2 rounded-xl bg-white text-black text-xs font-bold shrink-0 flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="min-h-[40px] px-3.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-white text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-950 border border-neutral-800 p-5 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black border border-neutral-700 flex items-center justify-center font-display font-bold text-base">
                  p.
                </div>
                <span className="text-base font-display font-bold">Install p.canva</span>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInIframe ? (
              <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
                <p>
                  Browsers block native PWA install popups inside embedded previews. Open{' '}
                  <strong>p.canva</strong> directly in its own browser tab to trigger the real
                  Install popup:
                </p>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Browser Tab to Install</span>
                </a>
              </div>
            ) : isIOS ? (
              <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed">
                <p className="flex items-center gap-2">
                  <Share className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
                  </span>
                </p>
                <p>
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </p>
                <p>
                  3. Tap <strong>Add</strong> — p.canva launches as a full-screen offline app.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Install in Chrome</span>
                </div>
                <p>
                  1. Open Chrome&apos;s menu (<strong>⋮</strong>) or click the Install icon in the
                  address bar.
                </p>
                <p>
                  2. Tap <strong>Install app</strong> (or <strong>Install p.canva</strong>).
                </p>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-neutral-900 border border-neutral-700 hover:border-white text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
