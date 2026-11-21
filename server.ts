import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { createInitialWorkspaceState, STARTER_PHOTOS } from './src/data/seedWorkspace.ts';
import type {
  CollaboratorPresence,
  CommentThread,
  DesignProject,
  PMIntegrationConfig,
  PMTicket,
  StockPhotoItem,
  UploadedAsset,
  WorkspaceState,
} from './src/types/studio.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

let workspaceState: WorkspaceState = createInitialWorkspaceState();
const clients = new Map<string, { ws: WebSocket; presence: CollaboratorPresence }>();

function broadcast(payload: unknown, excludeClientId?: string) {
  const message = JSON.stringify(payload);
  for (const [cid, entry] of clients.entries()) {
    if (cid !== excludeClientId && entry.ws.readyState === WebSocket.OPEN) {
      entry.ws.send(message);
    }
  }
}

function broadcastPresence() {
  const list = Array.from(clients.values()).map((c) => c.presence);
  broadcast({ type: 'presence:sync', presence: list });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, clients: clients.size });
  });

  // Explicit PWA headers for manifest.json and sw.js in both dev and production
  const pwaRoot =
    process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, 'dist')
      : path.resolve(__dirname, 'public');

  app.get('/manifest.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(pwaRoot, 'manifest.json'));
  });

  app.get('/sw.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(pwaRoot, 'sw.js'));
  });

  app.get('/api/workspace', (_req, res) => {
    res.json(workspaceState);
  });

  app.post('/api/workspace/reset', (_req, res) => {
    workspaceState = createInitialWorkspaceState();
    broadcast({ type: 'workspace:init', state: workspaceState });
    res.json(workspaceState);
  });

  // Free public image search endpoint (Openverse + Wikimedia Commons + 200+ starter catalog)
  app.get('/api/photos/search', async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = 24;

    if (!query || query.toLowerCase() === 'all') {
      const start = ((page - 1) * pageSize) % STARTER_PHOTOS.length;
      const items: StockPhotoItem[] = [];
      for (let i = 0; i < pageSize; i++) {
        const base = STARTER_PHOTOS[(start + i) % STARTER_PHOTOS.length];
        items.push({ ...base, id: `${base.id}-p${page}-${i}` });
      }
      res.json({ photos: items, hasMore: true, source: 'starter' });
      return;
    }

    const qLower = query.toLowerCase();
    const localMatches = STARTER_PHOTOS.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        p.category.toLowerCase().includes(qLower),
    );

    const remotePhotos: StockPhotoItem[] = [];

    // 1. Try Openverse free public CC image library (no API key required)
    try {
      const ovRes = await fetch(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
        {
          headers: { 'User-Agent': 'p.canva-studio/1.0' },
          signal: AbortSignal.timeout(4500),
        },
      );
      if (ovRes.ok) {
        const ovData = (await ovRes.json()) as {
          results?: {
            id: string;
            title?: string;
            url?: string;
            thumbnail?: string;
            width?: number;
            height?: number;
            creator?: string;
          }[];
        };
        for (const r of ovData.results || []) {
          const imgUrl = r.url || r.thumbnail;
          const thumbUrl = r.thumbnail || r.url;
          if (!imgUrl || !thumbUrl) continue;
          remotePhotos.push({
            id: `ov-${r.id}`,
            title: r.title || query,
            category: query,
            src: imgUrl,
            thumbUrl,
            width: r.width || 1200,
            height: r.height || 900,
            author: r.creator || 'Openverse Free Library',
            section: 'trending',
          });
        }
      }
    } catch {
      // Fallback to Wikimedia / starter photos below
    }

    // 2. Supplement with Wikimedia Commons public photo search if needed
    if (remotePhotos.length < 10) {
      try {
        const offset = (page - 1) * 18;
        const wmRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=18&gsroffset=${offset}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=560&format=json`,
          {
            headers: { 'User-Agent': 'p.canva-studio/1.0' },
            signal: AbortSignal.timeout(4500),
          },
        );
        if (wmRes.ok) {
          const wmData = (await wmRes.json()) as {
            query?: {
              pages?: Record<
                string,
                {
                  pageid: number;
                  title: string;
                  imageinfo?: {
                    url?: string;
                    thumburl?: string;
                    width?: number;
                    height?: number;
                    mime?: string;
                  }[];
                }
              >;
            };
          };
          const pages = Object.values(wmData.query?.pages || {});
          for (const p of pages) {
            const info = p.imageinfo?.[0];
            if (!info?.url || !info.mime?.startsWith('image/')) continue;
            if (info.mime.includes('svg')) continue;
            remotePhotos.push({
              id: `wm-${p.pageid}`,
              title: p.title.replace(/^File:/, '').replace(/\.[^.]+$/, ''),
              category: query,
              src: info.url,
              thumbUrl: info.thumburl || info.url,
              width: info.width || 1200,
              height: info.height || 900,
              author: 'Wikimedia Commons',
              section: 'recommended',
            });
          }
        }
      } catch {
        // Fallback cleanly to local starter matches
      }
    }

    const combined = page === 1 ? [...remotePhotos, ...localMatches] : remotePhotos;
    // Deduplicate by id
    const seen = new Set<string>();
    const deduped = combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    res.json({
      photos: deduped.length > 0 ? deduped : localMatches,
      hasMore: remotePhotos.length > 0,
      source: remotePhotos.length > 0 ? 'live' : 'starter',
    });
  });

  // Magic Write AI copy generator for Text tab
  app.post('/api/ai/magic-write', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    const tone = typeof req.body?.tone === 'string' ? req.body.tone : 'Professional';
    if (!prompt) {
      res.status(400).json({ error: 'Describe what you want Magic Write to draft.' });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured. Add it in Settings > Secrets.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write crisp graphic design copy in a ${tone} tone for: "${prompt}". Return a short punchy headline (max 8 words) and supporting body copy (1-2 concise sentences).`,
        config: {
          systemInstruction:
            'You are a creative copywriter inside a design editor. Output concise, ready-to-place typography copy without markdown or quotes.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['headline', 'body'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        headline: parsed.headline || prompt,
        body: parsed.body || '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Magic Write request failed.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/generate-design', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    const format = typeof req.body?.format === 'string' ? req.body.format : 'Presentation (16:9)';
    if (!prompt) {
      res.status(400).json({ error: 'Please describe your design idea first.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.',
      });
      return;
    }

    const dimensions =
      format === 'Social media'
        ? { width: 1080, height: 1080 }
        : format === 'Poster'
          ? { width: 900, height: 1200 }
          : { width: 1280, height: 720 };

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Create a clean, modern graphic design layout for a ${format} (${dimensions.width}x${dimensions.height}px) based on this idea: "${prompt}". Choose high-contrast typography, concise real copy, an optional photoKey from ["workspace","headphones","skincare","waves","none"], and crisp layout coordinates inside the canvas bounds.`,
        config: {
          systemInstruction:
            'You are a senior Canva layout designer. Output clean, legible, well-spaced graphic design JSON with high-contrast colors on a white or dark minimalist canvas.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              backgroundColor: { type: Type.STRING },
              accentColor: { type: Type.STRING },
              kicker: { type: Type.STRING },
              headline: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              ctaLabel: { type: Type.STRING },
              textColor: { type: Type.STRING },
              fontFamily: { type: Type.STRING },
              photoKey: { type: Type.STRING },
            },
            required: [
              'title',
              'backgroundColor',
              'accentColor',
              'kicker',
              'headline',
              'subtitle',
              'ctaLabel',
              'textColor',
              'fontFamily',
              'photoKey',
            ],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const spec = JSON.parse(raw);

      const photoMap: Record<string, string> = {
        workspace: '/src/assets/images/photo_modern_workspace_1795238221169.jpg',
        headphones: '/src/assets/images/photo_product_headphones_1795238221093.jpg',
        skincare: '/src/assets/images/photo_botanical_skincare_1795238221151.jpg',
        waves: '/src/assets/images/photo_abstract_waves_1795238220934.jpg',
      };

      const photoSrc = photoMap[String(spec.photoKey || '').toLowerCase()] || '';
      const validFonts = [
        'Plus Jakarta Sans',
        'DM Sans',
        'Outfit',
        'Playfair Display',
        'Fraunces',
        'Oswald',
        'Lora',
        'Manrope',
      ];
      const chosenFont = validFonts.includes(spec.fontFamily)
        ? spec.fontFamily
        : 'Plus Jakarta Sans';

      const w = dimensions.width;
      const h = dimensions.height;
      const hasPhoto = Boolean(photoSrc);
      const textWidth = hasPhoto && w >= 1200 ? Math.round(w * 0.46) : Math.round(w - 144);

      const elements: DesignProject['pages'][0]['elements'] = [];

      if (hasPhoto) {
        if (w >= 1200) {
          elements.push({
            id: `el-ai-img-${Date.now()}`,
            type: 'image',
            name: 'AI Visual',
            x: Math.round(w * 0.54),
            y: 0,
            width: Math.round(w * 0.46),
            height: h,
            rotation: 0,
            opacity: 1,
            locked: false,
            hidden: false,
            src: photoSrc,
            objectFit: 'cover',
          });
        } else {
          elements.push({
            id: `el-ai-img-${Date.now()}`,
            type: 'image',
            name: 'AI Visual',
            x: 72,
            y: Math.round(h * 0.48),
            width: w - 144,
            height: Math.round(h * 0.44),
            rotation: 0,
            opacity: 1,
            locked: false,
            hidden: false,
            borderRadius: 16,
            src: photoSrc,
            objectFit: 'cover',
          });
        }
      }

      elements.push(
        {
          id: `el-ai-bar-${Date.now()}`,
          type: 'shape',
          shapeKind: 'rectangle',
          name: 'Accent Bar',
          x: 72,
          y: 96,
          width: 68,
          height: 5,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          fill: spec.accentColor || '#0F766E',
        },
        {
          id: `el-ai-kicker-${Date.now()}`,
          type: 'text',
          name: 'Kicker',
          x: 72,
          y: 120,
          width: textWidth,
          height: 36,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          text: String(spec.kicker || 'CANVA AI STUDIO').toUpperCase(),
          fontFamily: 'JetBrains Mono',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: 1.8,
          color: spec.accentColor || '#0F766E',
          textAlign: 'left',
        },
        {
          id: `el-ai-title-${Date.now()}`,
          type: 'text',
          name: 'Headline',
          x: 72,
          y: 172,
          width: textWidth,
          height: 190,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          text: spec.headline || prompt,
          fontFamily: chosenFont,
          fontSize: w >= 1200 ? 58 : 52,
          fontWeight: 700,
          lineHeight: 1.08,
          color: spec.textColor || '#0F172A',
          textAlign: 'left',
        },
        {
          id: `el-ai-sub-${Date.now()}`,
          type: 'text',
          name: 'Subtitle',
          x: 72,
          y: 376,
          width: textWidth,
          height: 110,
          rotation: 0,
          opacity: 0.85,
          locked: false,
          hidden: false,
          text: spec.subtitle || 'Created instantly with p.canva AI layout engine.',
          fontFamily: 'DM Sans',
          fontSize: 21,
          fontWeight: 400,
          lineHeight: 1.45,
          color: spec.textColor || '#334155',
          textAlign: 'left',
        },
      );

      if (spec.ctaLabel && !(hasPhoto && w < 1200)) {
        elements.push(
          {
            id: `el-ai-ctabg-${Date.now()}`,
            type: 'shape',
            shapeKind: 'rounded',
            name: 'CTA Box',
            x: 72,
            y: Math.min(h - 96, 520),
            width: 220,
            height: 48,
            rotation: 0,
            opacity: 1,
            locked: false,
            hidden: false,
            fill: spec.accentColor || '#0F172A',
            borderRadius: 10,
          },
          {
            id: `el-ai-ctatxt-${Date.now()}`,
            type: 'text',
            name: 'CTA Text',
            x: 72,
            y: Math.min(h - 86, 530),
            width: 220,
            height: 30,
            rotation: 0,
            opacity: 1,
            locked: false,
            hidden: false,
            text: spec.ctaLabel,
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 16,
            fontWeight: 600,
            color: '#FFFFFF',
            textAlign: 'center',
          },
        );
      }

      const newDesign: DesignProject = {
        id: `design-ai-${Date.now()}`,
        title: spec.title || prompt.slice(0, 40),
        folder: 'AI Generated',
        formatLabel: format,
        width: w,
        height: h,
        approvalStatus: 'draft',
        linkedTicketIds: [],
        updatedAt: 'Just now',
        updatedBy: 'Canva AI',
        shareAccess: 'edit',
        approvalStages: [
          {
            id: `stg-ai-${Date.now()}`,
            roleTitle: 'Creative Lead Sign-Off',
            reviewerName: 'Elena Rostova',
            status: 'pending',
            updatedAt: 'Not requested',
          },
        ],
        pages: [
          {
            id: `page-ai-${Date.now()}`,
            title: 'AI Draft',
            backgroundColor: spec.backgroundColor || '#FFFFFF',
            notes: `Generated from prompt: ${prompt}`,
            durationSec: 6,
            elements,
          },
        ],
        versions: [],
      };

      workspaceState.designs.unshift(newDesign);
      broadcast({ type: 'design:updated', design: newDesign });
      res.json({ design: newDesign });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI design generation failed.';
      res.status(500).json({ error: message });
    }
  });

  const httpServer = createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false,
        watch: null,
        ws: {
          server: httpServer,
          path: '/vite-ws',
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    const clientId = `client-${Math.random().toString(36).slice(2, 10)}`;
    const defaultMember = workspaceState.team[0];

    const initialPresence: CollaboratorPresence = {
      clientId,
      userId: defaultMember.id,
      name: defaultMember.name,
      role: defaultMember.role,
      color: defaultMember.color,
      avatarUrl: defaultMember.avatarUrl,
      designId: workspaceState.designs[0]?.id ?? '',
      pageId: workspaceState.designs[0]?.pages[0]?.id ?? '',
      cursorX: null,
      cursorY: null,
      selectedElementId: null,
      lastActiveAt: Date.now(),
    };

    clients.set(clientId, { ws, presence: initialPresence });

    ws.send(
      JSON.stringify({
        type: 'workspace:init',
        clientId,
        state: workspaceState,
        presence: Array.from(clients.values()).map((c) => c.presence),
      }),
    );

    broadcastPresence();

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const entry = clients.get(clientId);
        if (!entry) return;

        switch (msg.type) {
          case 'presence:update': {
            entry.presence = {
              ...entry.presence,
              ...msg.patch,
              clientId,
              lastActiveAt: Date.now(),
            };
            broadcast(
              { type: 'presence:moved', presence: entry.presence },
              clientId,
            );
            break;
          }

          case 'design:upsert': {
            const incoming = msg.design as DesignProject;
            if (!incoming || !incoming.id) break;
            const idx = workspaceState.designs.findIndex((d) => d.id === incoming.id);
            if (idx >= 0) {
              workspaceState.designs[idx] = incoming;
            } else {
              workspaceState.designs.unshift(incoming);
            }
            // Auto-sync linked Jira/Linear tickets if approval rule is enabled
            if (msg.autoSyncApprovalStatus) {
              const linked = new Set(incoming.linkedTicketIds);
              workspaceState.pmTickets = workspaceState.pmTickets.map((t) => {
                if (!linked.has(t.id)) return t;
                const integration = workspaceState.integrations.find(
                  (i) => i.provider === t.provider,
                );
                if (!integration?.connected || !integration.autoSyncApprovals) return t;
                const mappedStatus =
                  incoming.approvalStatus === 'approved'
                    ? 'done'
                    : incoming.approvalStatus === 'in_review'
                      ? 'in_review'
                      : t.status;
                return { ...t, status: mappedStatus, updatedAt: 'Just now' };
              });
              broadcast({ type: 'pm:tickets_sync', pmTickets: workspaceState.pmTickets });
            }
            broadcast({ type: 'design:updated', design: incoming }, clientId);
            break;
          }

          case 'design:delete': {
            const designId = msg.designId as string;
            workspaceState.designs = workspaceState.designs.filter((d) => d.id !== designId);
            broadcast({ type: 'design:deleted', designId }, clientId);
            break;
          }

          case 'comment:upsert': {
            const comment = msg.comment as CommentThread;
            if (!comment || !comment.id) break;
            const idx = workspaceState.comments.findIndex((c) => c.id === comment.id);
            if (idx >= 0) {
              workspaceState.comments[idx] = comment;
            } else {
              workspaceState.comments.unshift(comment);
            }
            broadcast({ type: 'comment:updated', comment }, clientId);
            break;
          }

          case 'pm:ticket_upsert': {
            const ticket = msg.ticket as PMTicket;
            if (!ticket || !ticket.id) break;
            const idx = workspaceState.pmTickets.findIndex((t) => t.id === ticket.id);
            if (idx >= 0) {
              workspaceState.pmTickets[idx] = ticket;
            } else {
              workspaceState.pmTickets.unshift(ticket);
            }
            broadcast({ type: 'pm:ticket_updated', ticket }, clientId);
            break;
          }

          case 'integration:update': {
            const config = msg.integration as PMIntegrationConfig;
            workspaceState.integrations = workspaceState.integrations.map((i) =>
              i.provider === config.provider ? config : i,
            );
            broadcast({ type: 'integration:updated', integration: config }, clientId);
            break;
          }

          case 'brandkit:update': {
            workspaceState.brandKit = msg.brandKit;
            broadcast({ type: 'brandkit:updated', brandKit: msg.brandKit }, clientId);
            break;
          }

          case 'upload:add': {
            const asset = msg.asset as UploadedAsset;
            if (!workspaceState.uploads.some((u) => u.id === asset.id)) {
              workspaceState.uploads.unshift(asset);
            }
            broadcast({ type: 'upload:added', asset }, clientId);
            break;
          }
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      broadcastPresence();
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`p.canva studio server listening on http://localhost:${PORT}`);
  });
}

startServer();
