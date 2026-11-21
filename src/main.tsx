import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {warmOfflineAssets} from './utils/offlineStorage';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener(
    'load',
    async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((reg) => reg.active?.scriptURL.includes('dev-sw.js'))
            .map((reg) => reg.unregister()),
        );

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({type: 'SKIP_WAITING'});
            }
          });
        });
      } catch {
        // Non-fatal in unsupported contexts
      }
      void warmOfflineAssets();
    },
    {once: true},
  );
}

createRoot(document.getElementById('root')!).render(<App />);
