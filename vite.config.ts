import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function collectBuildUrls(dir: string, distRoot: string, out: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectBuildUrls(full, distRoot, out);
    } else if (/\.(js|css|png|jpg|jpeg|svg|woff2?)$/i.test(entry.name)) {
      const rel = '/' + path.relative(distRoot, full).split(path.sep).join('/');
      out.push(rel);
    }
  }
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ and injects production precache list into dist/sw.js
      {
        name: 'copy-unbundled-src-assets-and-sw',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }

          const swPath = path.resolve(distDir, 'sw.js');
          if (fs.existsSync(swPath)) {
            const precacheUrls: string[] = [];
            collectBuildUrls(path.resolve(distDir, 'assets'), distDir, precacheUrls);
            collectBuildUrls(path.resolve(distDir, 'src/assets'), distDir, precacheUrls);
            const swCode = fs.readFileSync(swPath, 'utf8');
            const injected = swCode.replace(
              '/*__PRECACHE_MANIFEST__*/ []',
              JSON.stringify(precacheUrls),
            );
            fs.writeFileSync(swPath, injected, 'utf8');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      entries: ['index.html', 'src/main.tsx'],
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'lucide-react',
      ],
      holdUntilCrawlEnd: true,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
