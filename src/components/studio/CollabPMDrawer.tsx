import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  GitBranch,
  History,
  Kanban,
  Link2,
  MessageSquare,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  BrandKit,
  CommentThread,
  DesignPage,
  DesignProject,
  PMIntegrationConfig,
  PMProvider,
  PMTicket,
  PMTicketPriority,
  PMTicketStatus,
  TeamMember,
} from '../../types/studio';

interface CollabPMDrawerProps {
  activeTab: 'comments' | 'workflow' | 'pm';
  onTabChange: (tab: 'comments' | 'workflow' | 'pm') => void;
  onClose: () => void;
  design: DesignProject;
  activePage: DesignPage;
  currentUser: TeamMember;
  team: TeamMember[];
  brandKit: BrandKit;
  comments: CommentThread[];
  activeCommentId: string | null;
  onSelectComment: (commentId: string, pageId: string) => void;
  onAddComment: (text: string, pinX?: number | null, pinY?: number | null) => void;
  onReplyComment: (commentId: string, text: string) => void;
  onToggleResolveComment: (commentId: string) => void;
  onConvertCommentToTicket: (comment: CommentThread, provider: PMProvider) => void;
  onUpdateStageStatus: (
    stageId: string,
    status: 'approved' | 'changes_requested' | 'pending',
  ) => void;
  onCreateSnapshot: (label: string, summary: string) => void;
  onRestoreSnapshot: (versionId: string) => void;
  onFixOffBrandElements: () => void;
  pmTickets: PMTicket[];
  integrations: PMIntegrationConfig[];
  onCreateTicket: (ticket: Omit<PMTicket, 'id' | 'key' | 'updatedAt'>) => void;
  onUpdateTicket: (ticket: PMTicket) => void;
  onToggleLinkTicket: (ticketId: string) => void;
  onUpdateIntegration: (config: PMIntegrationConfig) => void;
}

export const CollabPMDrawer: React.FC<CollabPMDrawerProps> = ({
  activeTab,
  onTabChange,
  onClose,
  design,
  activePage,
  team,
  brandKit,
  comments,
  activeCommentId,
  onSelectComment,
  onAddComment,
  onReplyComment,
  onToggleResolveComment,
  onConvertCommentToTicket,
  onUpdateStageStatus,
  onCreateSnapshot,
  onRestoreSnapshot,
  onFixOffBrandElements,
  pmTickets,
  integrations,
  onCreateTicket,
  onUpdateTicket,
  onToggleLinkTicket,
  onUpdateIntegration,
}) => {
  const [commentFilter, setCommentFilter] = useState<'open' | 'resolved'>('open');
  const [newCommentText, setNewCommentText] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketProvider, setNewTicketProvider] = useState<PMProvider>('jira');
  const [newTicketPriority, setNewTicketPriority] = useState<PMTicketPriority>('high');
  const [newTicketAssignee, setNewTicketAssignee] = useState(team[0]?.name || 'Elena Rostova');

  const designComments = useMemo(
    () =>
      comments.filter(
        (c) =>
          c.designId === design.id &&
          (commentFilter === 'resolved' ? c.resolved : !c.resolved),
      ),
    [comments, design.id, commentFilter],
  );

  const brandAudit = useMemo(() => {
    const allowedColors = new Set(brandKit.colors.map((c) => c.hex.toLowerCase()));
    const allowedFonts = new Set([
      brandKit.fonts.heading,
      brandKit.fonts.subheading,
      brandKit.fonts.body,
      'JetBrains Mono',
    ]);
    let offBrandColors = 0;
    let offBrandFonts = 0;

    for (const el of activePage.elements) {
      if (el.type === 'text') {
        if (el.color && !allowedColors.has(el.color.toLowerCase())) offBrandColors++;
        if (el.fontFamily && !allowedFonts.has(el.fontFamily)) offBrandFonts++;
      }
      if (el.type === 'shape' && el.fill && !allowedColors.has(el.fill.toLowerCase())) {
        offBrandColors++;
      }
    }
    return {
      offBrandColors,
      offBrandFonts,
      compliant: offBrandColors === 0 && offBrandFonts === 0,
    };
  }, [activePage.elements, brandKit]);

  const linkedTickets = pmTickets.filter((t) => design.linkedTicketIds.includes(t.id));
  const unlinkedTickets = pmTickets.filter((t) => !design.linkedTicketIds.includes(t.id));

  return (
    <aside className="fixed inset-0 md:static md:w-88 shrink-0 bg-black border-l border-neutral-800 flex flex-col h-full z-40 text-white">
      <div className="h-14 px-3 border-b border-neutral-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl">
          {(
            [
              { id: 'comments', label: 'Comments', icon: MessageSquare },
              { id: 'workflow', label: 'Workflow', icon: ShieldCheck },
              { id: 'pm', label: 'Tasks', icon: Kanban },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                  active ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'comments' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setCommentFilter('open')}
                  className={`px-3 py-1 rounded-md font-medium ${
                    commentFilter === 'open' ? 'bg-white text-black' : 'text-neutral-400'
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => setCommentFilter('resolved')}
                  className={`px-3 py-1 rounded-md font-medium ${
                    commentFilter === 'resolved' ? 'bg-white text-black' : 'text-neutral-400'
                  }`}
                >
                  Resolved
                </button>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {designComments.length} threads
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCommentText.trim()) return;
                onAddComment(newCommentText.trim());
                setNewCommentText('');
              }}
              className="space-y-2"
            >
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={2}
                placeholder={`Comment on ${activePage.title}...`}
                className="w-full p-3 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-white outline-none focus:border-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-white text-black text-xs font-semibold"
                >
                  Post comment
                </button>
              </div>
            </form>

            {designComments.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
                No {commentFilter} comments.
              </div>
            ) : (
              <div className="space-y-3">
                {designComments.map((c) => {
                  const isActive = activeCommentId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectComment(c.id, c.pageId)}
                      className={`p-3.5 rounded-2xl border cursor-pointer space-y-2.5 ${
                        isActive ? 'border-white bg-neutral-900' : 'border-neutral-800 bg-neutral-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-white">{c.authorName}</div>
                          <div className="text-[11px] text-neutral-400">
                            {c.authorRole} · {c.createdAt}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleResolveComment(c.id);
                          }}
                          className="px-2 py-1 rounded-lg border border-neutral-700 text-[11px] text-neutral-200 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>{c.resolved ? 'Reopen' : 'Resolve'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-neutral-200 leading-relaxed">{c.text}</p>

                      {c.linkedTicketId ? (
                        <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          <span>
                            Linked to{' '}
                            {pmTickets.find((t) => t.id === c.linkedTicketId)?.key || 'Task'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onConvertCommentToTicket(c, 'jira');
                          }}
                          className="text-[11px] font-medium text-neutral-300 underline flex items-center gap-1"
                        >
                          <Kanban className="w-3 h-3" />
                          <span>Create Jira task</span>
                        </button>
                      )}

                      <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={replyDrafts[c.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          placeholder="Reply..."
                          className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-neutral-800 bg-neutral-900 text-white outline-none"
                        />
                        <button
                          onClick={() => {
                            const txt = (replyDrafts[c.id] || '').trim();
                            if (!txt) return;
                            onReplyComment(c.id, txt);
                            setReplyDrafts((prev) => ({ ...prev, [c.id]: '' }));
                          }}
                          className="h-8 px-3 rounded-lg bg-white text-black text-xs font-semibold"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'workflow' && (
          <>
            <div className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-950 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Brand Compliance</span>
                {brandAudit.compliant ? (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Compliant
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {brandAudit.offBrandColors + brandAudit.offBrandFonts} issues
                  </span>
                )}
              </div>
              {!brandAudit.compliant && (
                <button
                  onClick={onFixOffBrandElements}
                  className="w-full h-9 rounded-xl bg-white text-black text-xs font-semibold"
                >
                  Fix to Brand Kit
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-semibold">Approval Pipeline</div>
              {design.approvalStages.map((stg) => (
                <div
                  key={stg.id}
                  className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold">{stg.roleTitle}</div>
                      <div className="text-[11px] text-neutral-400">
                        {stg.reviewerName} · {stg.updatedAt}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold capitalize text-neutral-300">
                      {stg.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateStageStatus(stg.id, 'approved')}
                      className="flex-1 h-8 rounded-lg bg-white text-black text-xs font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onUpdateStageStatus(stg.id, 'changes_requested')}
                      className="flex-1 h-8 rounded-lg border border-neutral-700 text-white text-xs font-medium"
                    >
                      Request edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Version History
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const label = snapshotLabel.trim() || `Checkpoint ${design.versions.length + 1}`;
                  onCreateSnapshot(label, `${design.pages.length} pages saved`);
                  setSnapshotLabel('');
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder="Checkpoint name"
                  className="flex-1 h-9 px-3 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-white outline-none"
                />
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-xl bg-white text-black text-xs font-semibold"
                >
                  Save
                </button>
              </form>
              {design.versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{ver.label}</div>
                    <div className="text-[11px] text-neutral-400">
                      {ver.authorName} · {ver.createdAt}
                    </div>
                  </div>
                  {ver.pages.length > 0 && (
                    <button
                      onClick={() => onRestoreSnapshot(ver.id)}
                      className="p-2 rounded-lg border border-neutral-700 text-white"
                      title="Restore"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'pm' && (
          <>
            <div className="space-y-2">
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                Connected Project Tools
              </div>
              {integrations.map((cfg) => (
                <div
                  key={cfg.provider}
                  className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">{cfg.label}</div>
                    <div className="text-[11px] text-neutral-400 truncate">{cfg.workspaceName}</div>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-neutral-300 cursor-pointer">
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
                    <span>Auto-sync</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Linked Tasks ({linkedTickets.length})</span>
                <button
                  onClick={() => setShowNewTicketForm((v) => !v)}
                  className="text-xs font-semibold text-white flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New task</span>
                </button>
              </div>

              {showNewTicketForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTicketTitle.trim()) return;
                    onCreateTicket({
                      provider: newTicketProvider,
                      title: newTicketTitle.trim(),
                      description: `Linked to ${design.title}`,
                      status: 'in_progress',
                      priority: newTicketPriority,
                      assignee: newTicketAssignee,
                      sprint: 'Sprint 42',
                      dueDate: '2026-11-28',
                      linkedDesignId: design.id,
                      linkedPageId: activePage.id,
                    });
                    setNewTicketTitle('');
                    setShowNewTicketForm(false);
                  }}
                  className="p-3 rounded-2xl border border-neutral-700 bg-neutral-950 space-y-2.5 text-xs"
                >
                  <input
                    type="text"
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full h-9 px-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newTicketProvider}
                      onChange={(e) => setNewTicketProvider(e.target.value as PMProvider)}
                      className="h-9 px-2 rounded-xl border border-neutral-700 bg-neutral-900 text-white"
                    >
                      <option value="jira">Jira</option>
                      <option value="linear">Linear</option>
                      <option value="asana">Asana</option>
                    </select>
                    <select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value as PMTicketPriority)}
                      className="h-9 px-2 rounded-xl border border-neutral-700 bg-neutral-900 text-white"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <select
                    value={newTicketAssignee}
                    onChange={(e) => setNewTicketAssignee(e.target.value)}
                    className="w-full h-9 px-2 rounded-xl border border-neutral-700 bg-neutral-900 text-white"
                  >
                    {team.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full h-9 rounded-xl bg-white text-black font-semibold"
                  >
                    Create & Link
                  </button>
                </form>
              )}

              {linkedTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>
                      {t.provider.toUpperCase()} · {t.key}
                    </span>
                    <button onClick={() => onToggleLinkTicket(t.id)} className="text-neutral-400 hover:text-rose-400">
                      Unlink
                    </button>
                  </div>
                  <div className="text-xs font-semibold">{t.title}</div>
                  <div className="flex items-center justify-between gap-2 pt-1">
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
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {t.dueDate}
                    </span>
                  </div>
                </div>
              ))}

              {unlinkedTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onToggleLinkTicket(t.id)}
                  className="w-full p-2.5 rounded-xl border border-dashed border-neutral-800 hover:border-white text-left flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate text-neutral-300">
                    <span className="font-mono text-neutral-500 mr-1.5">{t.key}</span>
                    {t.title}
                  </span>
                  <span className="text-[11px] text-white shrink-0">+ Link</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
