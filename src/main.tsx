import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {warmOfflineAssets} from './utils/offlineStorage';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    if (sessionStorage.getItem('pcanva-sw-refreshed')) return;
    refreshing = true;
    sessionStorage.setItem('pcanva-sw-refreshed', '1');
    window.location.reload();
  });

  (async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((reg) => reg.active?.scriptURL.includes('dev-sw.js'))
          .map((reg) => reg.unregister()),
      );

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      void registration.update();

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
  })();
}

createRoot(document.getElementById('root')!).render(<App />);
