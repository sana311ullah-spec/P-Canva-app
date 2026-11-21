import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialWorkspaceState } from '../data/seedWorkspace';
import type {
  BrandKit,
  CollaboratorPresence,
  CommentThread,
  DesignProject,
  PMIntegrationConfig,
  PMTicket,
  TeamMember,
  UploadedAsset,
  WorkspaceState,
} from '../types/studio';

export function useRealtimeWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => createInitialWorkspaceState());
  const [presence, setPresence] = useState<CollaboratorPresence[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<TeamMember>(
    () => createInitialWorkspaceState().team[0],
  );

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const lastCursorSent = useRef<number>(0);

  const sendEvent = useCallback((payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed) {
          setConnected(true);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'workspace:init':
              if (msg.clientId) setClientId(msg.clientId);
              if (msg.state) setWorkspace(msg.state);
              if (msg.presence) setPresence(msg.presence);
              break;

            case 'presence:sync':
              setPresence(msg.presence || []);
              break;

            case 'presence:moved': {
              const incoming = msg.presence as CollaboratorPresence;
              setPresence((prev) => {
                const exists = prev.some((p) => p.clientId === incoming.clientId);
                if (exists) {
                  return prev.map((p) => (p.clientId === incoming.clientId ? incoming : p));
                }
                return [...prev, incoming];
              });
              break;
            }

            case 'design:updated': {
              const updated = msg.design as DesignProject;
              setWorkspace((prev) => {
                const exists = prev.designs.some((d) => d.id === updated.id);
                return {
                  ...prev,
                  designs: exists
                    ? prev.designs.map((d) => (d.id === updated.id ? updated : d))
                    : [updated, ...prev.designs],
                };
              });
              break;
            }

            case 'design:deleted': {
              setWorkspace((prev) => ({
                ...prev,
                designs: prev.designs.filter((d) => d.id !== msg.designId),
              }));
              break;
            }

            case 'comment:updated': {
              const comment = msg.comment as CommentThread;
              setWorkspace((prev) => {
                const exists = prev.comments.some((c) => c.id === comment.id);
                return {
                  ...prev,
                  comments: exists
                    ? prev.comments.map((c) => (c.id === comment.id ? comment : c))
                    : [comment, ...prev.comments],
                };
              });
              break;
            }

            case 'pm:ticket_updated': {
              const ticket = msg.ticket as PMTicket;
              setWorkspace((prev) => {
                const exists = prev.pmTickets.some((t) => t.id === ticket.id);
                return {
                  ...prev,
                  pmTickets: exists
                    ? prev.pmTickets.map((t) => (t.id === ticket.id ? ticket : t))
                    : [ticket, ...prev.pmTickets],
                };
              });
              break;
            }

            case 'pm:tickets_sync':
              setWorkspace((prev) => ({ ...prev, pmTickets: msg.pmTickets }));
              break;

            case 'integration:updated': {
              const integration = msg.integration as PMIntegrationConfig;
              setWorkspace((prev) => ({
                ...prev,
                integrations: prev.integrations.map((i) =>
                  i.provider === integration.provider ? integration : i,
                ),
              }));
              break;
            }

            case 'brandkit:updated':
              setWorkspace((prev) => ({ ...prev, brandKit: msg.brandKit }));
              break;

            case 'upload:added': {
              const asset = msg.asset as UploadedAsset;
              setWorkspace((prev) => {
                if (prev.uploads.some((u) => u.id === asset.id)) return prev;
                return { ...prev, uploads: [asset, ...prev.uploads] };
              });
              break;
            }
          }
        } catch {
          // Ignore invalid socket messages
        }
      };

      ws.onclose = () => {
        if (!disposed) {
          setConnected(false);
          reconnectTimer.current = window.setTimeout(connect, 1800);
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  const upsertDesign = useCallback(
    (design: DesignProject, autoSyncApprovalStatus = false) => {
      setWorkspace((prev) => {
        const exists = prev.designs.some((d) => d.id === design.id);
        return {
          ...prev,
          designs: exists
            ? prev.designs.map((d) => (d.id === design.id ? design : d))
            : [design, ...prev.designs],
        };
      });
      sendEvent({ type: 'design:upsert', design, autoSyncApprovalStatus });
    },
    [sendEvent],
  );

  const deleteDesign = useCallback(
    (designId: string) => {
      setWorkspace((prev) => ({
        ...prev,
        designs: prev.designs.filter((d) => d.id !== designId),
      }));
      sendEvent({ type: 'design:delete', designId });
    },
    [sendEvent],
  );

  const upsertComment = useCallback(
    (comment: CommentThread) => {
      setWorkspace((prev) => {
        const exists = prev.comments.some((c) => c.id === comment.id);
        return {
          ...prev,
          comments: exists
            ? prev.comments.map((c) => (c.id === comment.id ? comment : c))
            : [comment, ...prev.comments],
        };
      });
      sendEvent({ type: 'comment:upsert', comment });
    },
    [sendEvent],
  );

  const upsertTicket = useCallback(
    (ticket: PMTicket) => {
      setWorkspace((prev) => {
        const exists = prev.pmTickets.some((t) => t.id === ticket.id);
        return {
          ...prev,
          pmTickets: exists
            ? prev.pmTickets.map((t) => (t.id === ticket.id ? ticket : t))
            : [ticket, ...prev.pmTickets],
        };
      });
      sendEvent({ type: 'pm:ticket_upsert', ticket });
    },
    [sendEvent],
  );

  const updateIntegration = useCallback(
    (integration: PMIntegrationConfig) => {
      setWorkspace((prev) => ({
        ...prev,
        integrations: prev.integrations.map((i) =>
          i.provider === integration.provider ? integration : i,
        ),
      }));
      sendEvent({ type: 'integration:update', integration });
    },
    [sendEvent],
  );

  const updateBrandKit = useCallback(
    (brandKit: BrandKit) => {
      setWorkspace((prev) => ({ ...prev, brandKit }));
      sendEvent({ type: 'brandkit:update', brandKit });
    },
    [sendEvent],
  );

  const addUpload = useCallback(
    (asset: UploadedAsset) => {
      setWorkspace((prev) => ({ ...prev, uploads: [asset, ...prev.uploads] }));
      sendEvent({ type: 'upload:add', asset });
    },
    [sendEvent],
  );

  const updatePresence = useCallback(
    (patch: Partial<CollaboratorPresence>, throttle = false) => {
      if (throttle) {
        const now = Date.now();
        if (now - lastCursorSent.current < 45) return;
        lastCursorSent.current = now;
      }
      sendEvent({ type: 'presence:update', patch });
    },
    [sendEvent],
  );

  const switchActiveIdentity = useCallback(
    (member: TeamMember) => {
      setCurrentUser(member);
      updatePresence({
        userId: member.id,
        name: member.name,
        role: member.role,
        color: member.color,
        avatarUrl: member.avatarUrl,
      });
    },
    [updatePresence],
  );

  return {
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
  };
}
