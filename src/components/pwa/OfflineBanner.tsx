import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-neutral-950 border-b border-amber-500/40 px-3 py-1.5 flex items-center justify-center gap-2 text-[11px] font-medium text-amber-300 z-50 shrink-0"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>You are offline</span>
      <span className="text-neutral-500">·</span>
      <span className="text-neutral-300">Designs saved locally &amp; editing works offline</span>
    </div>
  );
};
