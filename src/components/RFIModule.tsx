import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Calendar,
  DollarSign,
  ArrowRight,
  Printer,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Share2,
  Trash2,
  Edit,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import {
  RFI,
  RFIStatus,
  User,
  Task,
  Attachment,
  Comment,
  TaskPriority
} from '../types/pms';
import { RichTextEditorWithPaste } from './RichTextEditorWithPaste';
import { AttachmentsList } from './AttachmentsList';

interface RFIModuleProps {
  rfis: RFI[];
  tasks: Task[];
  users: User[];
  attachments: Attachment[];
  comments: Comment[];
  currentUser: User;
  canCreateRfi: boolean; // Member, PM, Admin
  canRespondRfi: boolean; // PM, Admin, or Assigned Responder
  canCloseRfi: boolean; // PM, Admin
  activeRfiId?: string | null;
  onCloseActiveRfi?: () => void;
  onSaveRfi: (rfi: RFI) => void;
  onDeleteRfi?: (rfiId: string) => void;
  onAddAttachment: (attachment: Attachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onAddComment: (comment: Comment) => void;
  onOpenTaskModal?: (task: Task) => void;
}

export const RFIModule: React.FC<RFIModuleProps> = ({
  rfis,
  tasks,
  users,
  attachments,
  comments,
  currentUser,
  canCreateRfi,
  canRespondRfi,
  canCloseRfi,
  activeRfiId,
  onCloseActiveRfi,
  onSaveRfi,
  onDeleteRfi,
  onAddAttachment,
  onDeleteAttachment,
  onAddComment,
  onOpenTaskModal,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [impactOnlyFilter, setImpactOnlyFilter] = useState(false);
  const [currentRfiModal, setCurrentRfiModal] = useState<RFI | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showPrintSheet, setShowPrintSheet] = useState(false);

  // If activeRfiId provided externally (e.g. from task link), open it
  React.useEffect(() => {
    if (activeRfiId) {
      const match = rfis.find((r) => r.id === activeRfiId);
      if (match) {
        setCurrentRfiModal(match);
      }
    }
  }, [activeRfiId, rfis]);

  // Status mapping
  const statusLabels: Record<RFIStatus, { label: string; color: string; bg: string; border: string }> = {
    draft: { label: '[DRAFT]', color: 'text-[#33ff00]/60', bg: 'bg-[#050505]', border: 'border-[#1f521f]' },
    open: { label: '[OPEN]', color: 'text-[#33ff00]', bg: 'bg-[#0a0a0a]', border: 'border-[#33ff00]' },
    under_review: { label: '[UNDER_REVIEW]', color: 'text-[#ffb000]', bg: 'bg-[#0a0a0a]', border: 'border-[#ffb000]' },
    answered: { label: '[ANSWERED]', color: 'text-[#33ff00]', bg: 'bg-[#1f521f]/40', border: 'border-[#33ff00]' },
    closed: { label: '[CLOSED/RESOLVED]', color: 'text-[#33ff00]', bg: 'bg-[#050505]', border: 'border-[#1f521f]' },
    rejected: { label: '[!REJECTED!]', color: 'text-[#ff3333]', bg: 'bg-[#0a0a0a]', border: 'border-[#ff3333]' },
  };

  // Filter RFIs
  const filteredRfis = rfis.filter((r) => {
    if (selectedStatusFilter !== 'all' && r.status !== selectedStatusFilter) return false;
    if (impactOnlyFilter && !r.costImpact && !r.scheduleImpact) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.rfiNumber.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchLoc = r.locationSpecRef.toLowerCase().includes(q);
      const matchQ = r.questionText.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchLoc && !matchQ) return false;
    }
    return true;
  });

  // Summary counts
  const countTotal = rfis.length;
  const countOpen = rfis.filter((r) => r.status === 'open' || r.status === 'under_review').length;
  const countAnswered = rfis.filter((r) => r.status === 'answered').length;
  const countClosed = rfis.filter((r) => r.status === 'closed').length;
  const countImpact = rfis.filter((r) => r.costImpact || r.scheduleImpact).length;

  const handleOpenDetail = (rfi: RFI) => {
    setCurrentRfiModal(rfi);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    // Generate next serial number
    const nextSeq = String(rfis.length + 1).padStart(3, '0');
    const newNumber = `PRJ-RFI-${new Date().getFullYear()}-${nextSeq}`;

    const newRfi: RFI = {
      id: 'rfi-' + Math.random().toString(36).substring(2, 9),
      projectId: 'prj-tp2-green',
      rfiNumber: newNumber,
      title: '',
      questionText: '',
      locationSpecRef: '',
      suggestedSolution: '',
      status: 'draft',
      costImpact: false,
      scheduleImpact: false,
      scheduleImpactDays: 0,
      requesterId: currentUser.id,
      assignedToId: 'usr-pm-02', // Default to PM
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      priority: 'medium',
      linkedTaskIds: [],
    };

    setCurrentRfiModal(newRfi);
    setIsCreatingNew(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0a0a0a] text-[#33ff00] p-3 sm:p-4 overflow-hidden font-mono">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        <div className="bg-[#050505] p-2.5 border border-[#1f521f]">
          <span className="text-[10px] text-[#33ff00]/60 block">// TOTAL_RFI_CASES</span>
          <span className="text-lg font-bold text-[#33ff00] font-mono">{countTotal}</span>
        </div>
        <div className="bg-[#050505] p-2.5 border border-[#1f521f]">
          <span className="text-[10px] text-[#ffb000] block">// PENDING_REVIEW</span>
          <span className="text-lg font-bold text-[#ffb000] font-mono">{countOpen}</span>
        </div>
        <div className="bg-[#050505] p-2.5 border border-[#1f521f]">
          <span className="text-[10px] text-[#33ff00] block">// ANSWERED_OFFICIAL</span>
          <span className="text-lg font-bold text-[#33ff00] font-mono">{countAnswered}</span>
        </div>
        <div className="bg-[#050505] p-2.5 border border-[#1f521f]">
          <span className="text-[10px] text-[#33ff00]/60 block">// RESOLVED_ARCHIVED</span>
          <span className="text-lg font-bold text-[#33ff00]/80 font-mono">{countClosed}</span>
        </div>
        <div className="bg-[#050505] p-2.5 border border-[#1f521f] col-span-2 sm:col-span-1">
          <span className="text-[10px] text-[#ff3333] block">// COST_SCHEDULE_IMPACT</span>
          <span className="text-lg font-bold text-[#ff3333] font-mono">{countImpact}</span>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="bg-[#050505] px-3 py-2 border border-[#1f521f] mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-2.5 top-1.5 text-xs text-[#1f521f]">&gt;</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY ID, SPEC, TITLE..."
              className="w-full text-xs pl-6 pr-2.5 py-1 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1f521f] focus:border-[#33ff00]"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-[#ffb000] cursor-pointer px-2 py-1 border border-[#1f521f] hover:border-[#ffb000] bg-[#0a0a0a] select-none">
            <input
              type="checkbox"
              checked={impactOnlyFilter}
              onChange={(e) => setImpactOnlyFilter(e.target.checked)}
              className="accent-[#ffb000]"
            />
            <span>[ IMPACT_ONLY ({countImpact}) ]</span>
          </label>
        </div>

        {/* Action Button */}
        {canCreateRfi && (
          <button
            onClick={handleCreateNew}
            className="text-xs px-3 py-1 bg-[#33ff00] hover:bg-white text-black font-bold transition-colors flex items-center gap-1.5"
          >
            [ + DISPATCH_NEW_RFI ]
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 text-xs select-none">
        {[
          { id: 'all', label: 'ALL_RFIS', count: rfis.length },
          { id: 'draft', label: 'DRAFT', count: rfis.filter((r) => r.status === 'draft').length },
          { id: 'open', label: 'OPEN', count: rfis.filter((r) => r.status === 'open').length },
          { id: 'under_review', label: 'IN_REVIEW', count: rfis.filter((r) => r.status === 'under_review').length },
          { id: 'answered', label: 'ANSWERED', count: rfis.filter((r) => r.status === 'answered').length },
          { id: 'closed', label: 'CLOSED', count: rfis.filter((r) => r.status === 'closed').length },
          { id: 'rejected', label: 'REJECTED', count: rfis.filter((r) => r.status === 'rejected').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatusFilter(tab.id)}
            className={`px-2.5 py-1 border font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 text-xs ${
              selectedStatusFilter === tab.id
                ? 'bg-[#33ff00] text-black border-[#33ff00] font-bold'
                : 'bg-[#050505] text-[#33ff00]/70 hover:border-[#33ff00] border-[#1f521f]'
            }`}
          >
            <span>[{tab.label}]</span>
            <span className="text-[10px]">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* RFI Table List */}
      <div className="flex-1 bg-[#050505] border border-[#1f521f] overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse font-mono">
            <thead className="bg-[#0a0a0a] border-b border-[#1f521f] text-[10px] text-[#33ff00] sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3">RFI_NUMBER</th>
                <th className="py-2 px-3">SUBJECT & SPEC REF</th>
                <th className="py-2 px-3">LIFECYCLE</th>
                <th className="py-2 px-3">IMPACT_EVAL</th>
                <th className="py-2 px-3">REQUESTER / ASSIGNEE</th>
                <th className="py-2 px-3">DUE_DATE</th>
                <th className="py-2 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f521f] text-xs">
              {filteredRfis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#1f521f]">
                    [NO_MATCHING_RFI_RECORDS_FOUND]
                  </td>
                </tr>
              ) : (
                filteredRfis.map((rfi) => {
                  const requester = users.find((u) => u.id === rfi.requesterId);
                  const assignedTo = users.find((u) => u.id === rfi.assignedToId);
                  const cfg = statusLabels[rfi.status] || statusLabels.open;
                  const attCount = attachments.filter((a) => a.targetType === 'RFI' && a.targetId === rfi.id).length;

                  return (
                    <tr
                      key={rfi.id}
                      onClick={() => handleOpenDetail(rfi)}
                      className="hover:bg-[#1f521f]/20 cursor-pointer transition-colors"
                    >
                      {/* RFI Number */}
                      <td className="py-2.5 px-3 font-mono font-bold text-[#ffb000] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>[{rfi.rfiNumber}]</span>
                        </div>
                      </td>

                      {/* Title & Location */}
                      <td className="py-2.5 px-3 max-w-xs sm:max-w-md">
                        <div className="font-bold text-[#33ff00] line-clamp-1">
                          {rfi.title}
                        </div>
                        <div className="text-[10px] text-[#33ff00]/60 truncate flex items-center gap-1.5 mt-0.5">
                          <span className="border border-[#1f521f] px-1 bg-[#0a0a0a]">
                            LOC: {rfi.locationSpecRef || 'N/A'}
                          </span>
                          {attCount > 0 && (
                            <span className="text-[#ffb000]">
                              [ATT:{attCount}]
                            </span>
                          )}
                          {rfi.linkedTaskIds && rfi.linkedTaskIds.length > 0 && (
                            <span className="text-[#33ff00]/80">
                              [TASKS:{rfi.linkedTaskIds.length}]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      {/* Impact */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-[10px]">
                          {rfi.costImpact && (
                            <span className="text-[#ffb000] font-bold">
                              [COST_IMPACT]
                            </span>
                          )}
                          {rfi.scheduleImpact && (
                            <span className="text-[#ff3333] font-bold">
                              [DELAY:+{rfi.scheduleImpactDays}D]
                            </span>
                          )}
                          {!rfi.costImpact && !rfi.scheduleImpact && (
                            <span className="text-[#1f521f]">[NO_IMPACT]</span>
                          )}
                        </div>
                      </td>

                      {/* Requester & Assigned */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-[10px]">
                          <div className="text-[#33ff00]">
                            REQ: @{requester?.fullName || 'UNKNOWN'}
                          </div>
                          <div className="text-[#33ff00]/60">
                            ASSIGN: @{assignedTo?.fullName || 'UNASSIGNED'}
                          </div>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[10px] text-[#33ff00]/80 font-mono">
                        {rfi.dueDate}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(rfi);
                          }}
                          className="px-2 py-0.5 text-xs text-[#33ff00] border border-[#1f521f] hover:border-[#33ff00] hover:bg-[#1f521f]/30 font-bold"
                        >
                          [INSPECT &gt;]
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RFI Modal: Detailed Viewer & Editor */}
      {currentRfiModal && (
        <RFIDetailModal
          rfi={currentRfiModal}
          isNew={isCreatingNew}
          isOpen={true}
          onClose={() => {
            setCurrentRfiModal(null);
            setIsCreatingNew(false);
            if (onCloseActiveRfi) onCloseActiveRfi();
          }}
          tasks={tasks}
          users={users}
          attachments={attachments}
          comments={comments}
          currentUser={currentUser}
          canRespondRfi={canRespondRfi}
          canCloseRfi={canCloseRfi}
          onSaveRfi={onSaveRfi}
          onDeleteRfi={onDeleteRfi}
          onAddAttachment={onAddAttachment}
          onDeleteAttachment={onDeleteAttachment}
          onAddComment={onAddComment}
          onOpenTaskModal={onOpenTaskModal}
        />
      )}
    </div>
  );
};

/* --- RFI Detail & Official Response Modal --- */
interface RFIDetailModalProps {
  rfi: RFI;
  isNew: boolean;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  users: User[];
  attachments: Attachment[];
  comments: Comment[];
  currentUser: User;
  canRespondRfi: boolean;
  canCloseRfi: boolean;
  onSaveRfi: (rfi: RFI) => void;
  onDeleteRfi?: (rfiId: string) => void;
  onAddAttachment: (attachment: Attachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onAddComment: (comment: Comment) => void;
  onOpenTaskModal?: (task: Task) => void;
}

const RFIDetailModal: React.FC<RFIDetailModalProps> = ({
  rfi,
  isNew,
  isOpen,
  onClose,
  tasks,
  users,
  attachments,
  comments,
  currentUser,
  canRespondRfi,
  canCloseRfi,
  onSaveRfi,
  onDeleteRfi,
  onAddAttachment,
  onDeleteAttachment,
  onAddComment,
  onOpenTaskModal,
}) => {
  // Form edit states
  const [title, setTitle] = useState(rfi.title);
  const [questionText, setQuestionText] = useState(rfi.questionText);
  const [locationSpecRef, setLocationSpecRef] = useState(rfi.locationSpecRef);
  const [suggestedSolution, setSuggestedSolution] = useState(rfi.suggestedSolution || '');
  const [status, setStatus] = useState<RFIStatus>(rfi.status);
  const [costImpact, setCostImpact] = useState(rfi.costImpact);
  const [costImpactAmount, setCostImpactAmount] = useState(rfi.costImpactAmount || '');
  const [scheduleImpact, setScheduleImpact] = useState(rfi.scheduleImpact);
  const [scheduleImpactDays, setScheduleImpactDays] = useState(rfi.scheduleImpactDays || 0);
  const [assignedToId, setAssignedToId] = useState(rfi.assignedToId);
  const [dueDate, setDueDate] = useState(rfi.dueDate);
  const [priority, setPriority] = useState<TaskPriority>(rfi.priority || 'medium');
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(rfi.linkedTaskIds || []);

  // Official response state
  const [officialResponse, setOfficialResponse] = useState(rfi.officialResponse || '');
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');

  if (!isOpen) return null;

  const requester = users.find((u) => u.id === rfi.requesterId) || currentUser;
  const responder = users.find((u) => u.id === rfi.assignedToId);

  const handleSave = () => {
    if (!title.trim() || !questionText.trim()) {
      alert('請填寫 RFI 主旨與詳細提問說明');
      return;
    }

    const updated: RFI = {
      ...rfi,
      title: title.trim(),
      questionText: questionText.trim(),
      locationSpecRef: locationSpecRef.trim(),
      suggestedSolution: suggestedSolution.trim(),
      status,
      costImpact,
      costImpactAmount: costImpact ? costImpactAmount : '',
      scheduleImpact,
      scheduleImpactDays: scheduleImpact ? scheduleImpactDays : 0,
      assignedToId,
      dueDate,
      priority,
      linkedTaskIds,
      officialResponse: officialResponse.trim() || undefined,
      answeredBy: officialResponse.trim() ? (rfi.answeredBy || currentUser.id) : undefined,
      answeredAt: officialResponse.trim() ? (rfi.answeredAt || new Date().toISOString()) : undefined,
    };

    onSaveRfi(updated);
    onClose();
  };

  const toggleLinkedTask = (taskId: string) => {
    if (linkedTaskIds.includes(taskId)) {
      setLinkedTaskIds(linkedTaskIds.filter((id) => id !== taskId));
    } else {
      setLinkedTaskIds([...linkedTaskIds, taskId]);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: 'cmt-' + Date.now(),
      targetType: 'RFI',
      targetId: rfi.id,
      userId: currentUser.id,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddComment(newComment);
    setNewCommentText('');
  };

  const rfiComments = comments.filter((c) => c.targetType === 'RFI' && c.targetId === rfi.id);

  // Status progression stepper
  const steps: RFIStatus[] = ['draft', 'open', 'under_review', 'answered', 'closed'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-mono">
      <div className="bg-[#0a0a0a] border-2 border-[#33ff00] text-[#33ff00] w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden my-auto shadow-[0_0_20px_rgba(51,255,0,0.2)]">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[#1f521f] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0a0a0a] text-[#ffb000] border border-[#ffb000]">
              [{rfi.rfiNumber}]
            </span>
            <span className="text-[10px] text-[#33ff00]/60 hidden sm:inline">
              // DISPATCHED: {new Date(rfi.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintSheet(true)}
              className="text-xs px-2.5 py-1 bg-[#0a0a0a] border border-[#1f521f] hover:border-[#33ff00] text-[#33ff00] flex items-center gap-1.5 transition-colors"
            >
              [ PREVIEW_PRINT_SHEET ]
            </button>
            <button
              onClick={onClose}
              className="px-2 py-0.5 text-xs text-[#ff3333] border border-[#1f521f] hover:border-[#ff3333]"
            >
              [ X ]
            </button>
          </div>
        </div>

        {/* Status Pipeline Stepper */}
        <div className="px-4 py-2 bg-[#050505] border-b border-[#1f521f] flex items-center justify-between overflow-x-auto gap-2 text-xs">
          <span className="text-[10px] text-[#33ff00]/60 uppercase tracking-wider shrink-0">
            // PIPELINE_STAGE:
          </span>
          <div className="flex items-center gap-1 sm:gap-2 flex-1 max-w-2xl justify-between">
            {steps.map((st, idx) => {
              const isActive = status === st;
              const isPast = steps.indexOf(status) >= idx && status !== 'rejected';
              const names = {
                draft: '1.DRAFT',
                open: '2.OPEN',
                under_review: '3.IN_REVIEW',
                answered: '4.ANSWERED',
                closed: '5.RESOLVED',
              };

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    // Check permissions
                    if (st === 'closed' && !canCloseRfi) {
                      alert('REQUIRE_PRIVILEGE: PM or ADMIN credential required for formal RFI closure.');
                      return;
                    }
                    setStatus(st);
                  }}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 border font-mono transition-all ${
                    isActive
                      ? 'bg-[#33ff00] text-black border-[#33ff00] font-bold'
                      : isPast
                      ? 'bg-[#1f521f]/40 text-[#33ff00] border-[#1f521f]'
                      : 'bg-[#0a0a0a] text-[#33ff00]/40 border-[#1f521f] hover:border-[#33ff00]/60'
                  }`}
                >
                  [{names[st]}]
                </button>
              );
            })}

            {status === 'rejected' && (
              <span className="text-[11px] px-2 py-0.5 bg-[#0a0a0a] border border-[#ff3333] text-[#ff3333] font-bold">
                [! REJECTED !]
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Question & Solution (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[10px] text-[#33ff00]/70 uppercase tracking-wider mb-1">
                // RFI_SUBJECT_TITLE <span className="text-[#ff3333]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. B2F CHILLER ROOM 400A CONDUIT SRC BEAM OPENING SPEC CONFLICT"
                className="w-full text-xs font-bold px-2.5 py-1.5 bg-[#050505] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00]"
              />
            </div>

            {/* Location & Spec Ref */}
            <div>
              <label className="block text-[10px] text-[#33ff00]/70 uppercase tracking-wider mb-1">
                // SPEC_AND_DRAWING_REFERENCE <span className="text-[#ff3333]">*</span>
              </label>
              <input
                type="text"
                value={locationSpecRef}
                onChange={(e) => setLocationSpecRef(e.target.value)}
                placeholder="e.g. DWG# S-B2-108 / MEP-B2-301, GRID 3CL-D"
                className="w-full text-xs px-2.5 py-1.5 bg-[#050505] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00] font-mono"
              />
            </div>

            {/* Question Description with RichText & Clipboard Paste */}
            <div>
              <RichTextEditorWithPaste
                label="// QUESTION_AND_INQUIRY_DESCRIPTION"
                value={questionText}
                onChange={setQuestionText}
                targetType="RFI"
                targetId={rfi.id}
                currentUser={currentUser}
                onAddAttachment={onAddAttachment}
                rows={6}
                placeholder="Detail technical ambiguity or spec collision. Press Ctrl+V to paste screenshot attachments directly..."
                required
              />
            </div>

            {/* Suggested Solution */}
            <div>
              <label className="block text-[10px] text-[#33ff00]/70 uppercase tracking-wider mb-1">
                // CONTRACTOR_SUGGESTED_SOLUTION
              </label>
              <textarea
                rows={3}
                value={suggestedSolution}
                onChange={(e) => setSuggestedSolution(e.target.value)}
                placeholder="Propose viable field remediation or alternative engineering design..."
                className="w-full text-xs px-2.5 py-1.5 bg-[#050505] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00]"
              />
            </div>

            {/* Official Response Section */}
            <div className="border border-[#ffb000] p-3.5 bg-[#050505] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#ffb000] flex items-center gap-1.5">
                  <span>[ OFFICIAL_ENGINEERING_RESPONSE ]</span>
                </h4>
                {rfi.answeredAt && (
                  <span className="text-[10px] text-[#33ff00]/70 font-mono">
                    TIMESTAMP: {new Date(rfi.answeredAt).toLocaleString()}
                  </span>
                )}
              </div>

              {!canRespondRfi && !rfi.officialResponse && (
                <div className="p-2 bg-[#0a0a0a] text-[#ffb000] text-[10px] border border-[#ffb000]">
                  ! ACCESS_RESTRICTION: Only Project Managers or Assigned Responders can commit official replies.
                </div>
              )}

              <RichTextEditorWithPaste
                value={officialResponse}
                onChange={setOfficialResponse}
                targetType="RFI"
                targetId={rfi.id}
                currentUser={currentUser}
                onAddAttachment={onAddAttachment}
                rows={5}
                placeholder={
                  canRespondRfi
                    ? 'Enter official structural consultant response. Ctrl+V to attach diagram...'
                    : 'Awaiting official review.'
                }
              />

              {canRespondRfi && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (!officialResponse.trim()) {
                        alert('Official response text required.');
                        return;
                      }
                      setStatus('answered');
                    }}
                    className="text-xs px-3 py-1 bg-[#ffb000] text-black font-bold hover:bg-white transition-colors"
                  >
                    [ SIGN_AND_COMMIT_RESPONSE ]
                  </button>
                  {canCloseRfi && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatus('closed');
                      }}
                      className="text-xs px-3 py-1 bg-[#33ff00] text-black font-bold hover:bg-white transition-colors"
                    >
                      [ APPROVE_AND_CLOSE_RFI ]
                    </button>
                  )}
                  {canCloseRfi && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatus('rejected');
                      }}
                      className="text-xs px-3 py-1 bg-[#ff3333] text-black font-bold hover:bg-white transition-colors"
                    >
                      [ ! REJECT_RFI ! ]
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="border border-[#1f521f] p-3.5 bg-[#050505]">
              <AttachmentsList
                attachments={attachments}
                targetType="RFI"
                targetId={rfi.id}
                currentUser={currentUser}
                onAddAttachment={onAddAttachment}
                onDeleteAttachment={onDeleteAttachment}
                canEdit={true}
              />
            </div>

            {/* Comments Thread */}
            <div className="border border-[#1f521f] p-3.5 bg-[#050505] space-y-2.5">
              <h4 className="text-xs font-bold text-[#33ff00] flex items-center gap-1.5">
                <span>// FIELD_COORDINATION_LOG ({rfiComments.length})</span>
              </h4>

              <div className="space-y-2">
                {rfiComments.map((comment) => {
                  const author = users.find((u) => u.id === comment.userId);
                  return (
                    <div key={comment.id} className="bg-[#0a0a0a] p-2 border border-[#1f521f]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-[#ffb000]">@{author?.fullName}</span>
                        <span className="text-[10px] text-[#33ff00]/60">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#33ff00]">{comment.content}</p>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="APPEND LOG ENTRY..."
                  className="flex-1 text-xs px-2.5 py-1 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00]"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#33ff00] text-black text-xs font-bold hover:bg-white"
                >
                  [ TRANSMIT ]
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Controls (1 col) */}
          <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-[#1f521f] lg:pl-5">
            {/* Impact Assessment */}
            <div className="bg-[#050505] border border-[#ffb000] p-3 space-y-2.5">
              <h4 className="text-xs font-bold text-[#ffb000] uppercase tracking-wider flex items-center gap-1">
                // IMPACT_ASSESSMENT
              </h4>

              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs text-[#33ff00] cursor-pointer">
                  <span>COST_IMPACT</span>
                  <input
                    type="checkbox"
                    checked={costImpact}
                    onChange={(e) => setCostImpact(e.target.checked)}
                    className="accent-[#ffb000]"
                  />
                </label>
                {costImpact && (
                  <input
                    type="text"
                    value={costImpactAmount}
                    onChange={(e) => setCostImpactAmount(e.target.value)}
                    placeholder="EST: $85,000 USD"
                    className="w-full text-xs px-2 py-1 border border-[#ffb000] bg-[#0a0a0a] text-[#ffb000]"
                  />
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#1f521f]">
                <label className="flex items-center justify-between text-xs text-[#33ff00] cursor-pointer">
                  <span>SCHEDULE_DELAY</span>
                  <input
                    type="checkbox"
                    checked={scheduleImpact}
                    onChange={(e) => setScheduleImpact(e.target.checked)}
                    className="accent-[#ff3333]"
                  />
                </label>
                {scheduleImpact && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#33ff00]/70">DAYS:</span>
                    <input
                      type="number"
                      min="0"
                      value={scheduleImpactDays}
                      onChange={(e) => setScheduleImpactDays(parseInt(e.target.value, 10) || 0)}
                      className="w-20 text-xs px-2 py-0.5 border border-[#ff3333] bg-[#0a0a0a] text-[#ff3333] font-mono"
                    />
                    <span className="text-[10px] text-[#33ff00]/70">D</span>
                  </div>
                )}
              </div>
            </div>

            {/* Responder Assignment */}
            <div>
              <label className="block text-[10px] text-[#33ff00]/70 uppercase tracking-wider mb-1">
                // ASSIGNED_RESPONDER
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-[#1f521f] bg-[#050505] text-[#33ff00] focus:border-[#33ff00]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[10px] text-[#33ff00]/70 uppercase tracking-wider mb-1">
                // DUE_DATE
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-[#1f521f] bg-[#050505] text-[#33ff00] focus:border-[#33ff00] font-mono"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] text-[#33ff00]/70 uppercase tracking-wider mb-1">
                // PRIORITY
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs px-2.5 py-1.5 border border-[#1f521f] bg-[#050505] text-[#33ff00] focus:border-[#33ff00]"
              >
                <option value="urgent">[URGENT]</option>
                <option value="high">[HIGH]</option>
                <option value="medium">[MEDIUM]</option>
                <option value="low">[LOW]</option>
              </select>
            </div>

            {/* Linked Tasks */}
            <div>
              <label className="block text-[10px] text-[#33ff00]/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                // LINKED_KANBAN_TASKS ({linkedTaskIds.length})
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto border border-[#1f521f] p-1.5 bg-[#050505]">
                {tasks.map((task) => {
                  const isLinked = linkedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleLinkedTask(task.id)}
                      className={`flex items-start gap-1.5 p-1 text-xs cursor-pointer ${
                        isLinked ? 'bg-[#1f521f]/40 border border-[#33ff00]' : 'hover:bg-[#1f521f]/20'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-[#33ff00]">
                        {isLinked ? '[X]' : '[ ]'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#33ff00] truncate text-xs">{task.title}</p>
                        <p className="text-[9px] text-[#33ff00]/60">DUE: {task.dueDate || 'N/A'}</p>
                      </div>
                      {onOpenTaskModal && isLinked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTaskModal(task);
                          }}
                          className="text-[#ffb000] hover:text-white px-1 font-bold text-xs"
                        >
                          [&gt;]
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delete button */}
            {!isNew && canCloseRfi && onDeleteRfi && (
              <div className="pt-3 border-t border-[#1f521f]">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Confirm permanent deletion of this RFI entry?')) {
                      onDeleteRfi(rfi.id);
                      onClose();
                    }
                  }}
                  className="w-full py-1 px-2 text-xs text-[#ff3333] hover:bg-[#ff3333] hover:text-black border border-[#ff3333] transition-colors font-bold"
                >
                  [ ! PURGE_RFI_RECORD ! ]
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#1f521f] bg-[#050505] flex items-center justify-between text-xs font-mono">
          <span className="text-[10px] text-[#33ff00]/70">
            // STATUS: <strong className="text-[#33ff00]">{status.toUpperCase()}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs border border-[#1f521f] text-[#33ff00]/70 hover:border-[#33ff00] hover:text-[#33ff00]"
            >
              [ ABORT ]
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1 text-xs font-bold text-black bg-[#33ff00] hover:bg-white transition-colors"
            >
              [ SAVE_RFI_CHANGES ]
            </button>
          </div>
        </div>
      </div>

      {/* Formal Printable RFI Document Sheet */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-mono">
          <div className="bg-[#050505] border-2 border-[#33ff00] text-[#33ff00] max-w-4xl w-full p-6 shadow-[0_0_25px_rgba(51,255,0,0.3)] space-y-5 my-auto">
            {/* Print Header */}
            <div className="flex items-center justify-between border-b border-[#33ff00] pb-3">
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#33ff00]">
                  ===================================================<br />
                  REQUEST FOR INFORMATION (RFI) - SPEC CLARIFICATION<br />
                  ===================================================
                </h1>
                <p className="text-[10px] text-[#33ff00]/60 mt-1">FORM NO. ENG-RFI-V3 // STAT: FORMAL SUBMISSION</p>
              </div>
              <div className="text-right">
                <span className="text-base font-mono font-bold text-[#ffb000]">[{rfi.rfiNumber}]</span>
                <p className="text-[10px] text-[#33ff00]/60">DATE: {new Date(rfi.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 border border-[#1f521f] text-xs divide-y md:divide-y-0 md:divide-x divide-[#1f521f] bg-[#0a0a0a]">
              <div className="p-3 space-y-1.5">
                <p><strong>// PROJECT:</strong> SMART COMMERCE HEADQUARTERS BLDG A</p>
                <p><strong>// INITIATOR:</strong> {requester?.fullName} [{requester?.department}]</p>
                <p><strong>// DEADLINE:</strong> {dueDate}</p>
              </div>
              <div className="p-3 space-y-1.5">
                <p><strong>// RESPONDER:</strong> {responder?.fullName} [{responder?.department}]</p>
                <p><strong>// LOCATION/DWG:</strong> {locationSpecRef || 'SEE_BODY'}</p>
                <p>
                  <strong>// IMPACT:</strong>{' '}
                  {costImpact ? `COST (${costImpactAmount || 'TBD'}); ` : 'NO_COST; '}
                  {scheduleImpact ? `SCHEDULE +${scheduleImpactDays}D` : 'NO_DELAY'}
                </p>
              </div>
            </div>

            {/* Question Text */}
            <div className="border border-[#1f521f] p-3 bg-[#0a0a0a] text-xs space-y-2">
              <h3 className="font-bold text-[#ffb000] text-xs">[ 01. INQUIRY & SPECIFICATION CONFLICT DESCRIPTION ]</h3>
              <p className="font-bold text-[#33ff00]">{title}</p>
              <div className="text-[#33ff00]/90 whitespace-pre-wrap leading-relaxed">{questionText}</div>
              {suggestedSolution && (
                <div className="mt-2 pt-2 border-t border-dashed border-[#1f521f] text-[#ffb000]">
                  <strong>PROPOSED CONTRACTOR REMEDIATION:</strong>
                  <p>{suggestedSolution}</p>
                </div>
              )}
            </div>

            {/* Official Response */}
            <div className="border border-[#ffb000] p-3 text-xs space-y-2 bg-[#0a0a0a]">
              <h3 className="font-bold text-[#ffb000] text-xs">[ 02. ARCHITECT / CONSULTANT OFFICIAL DIRECTIVE ]</h3>
              {officialResponse ? (
                <div className="text-[#33ff00] whitespace-pre-wrap leading-relaxed font-mono">
                  {officialResponse}
                </div>
              ) : (
                <p className="text-[#33ff00]/40 italic">// AWAITING FORMAL WRITTEN DETERMINATION</p>
              )}
            </div>

            {/* Signature Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#1f521f] text-center text-xs divide-x divide-[#1f521f] bg-[#0a0a0a]">
              <div className="p-3 space-y-6">
                <p className="font-bold text-[11px] text-[#33ff00]/80">FIELD ENG</p>
                <p className="text-[#33ff00]/30 font-mono">[ SIGN SEAL ]</p>
              </div>
              <div className="p-3 space-y-6">
                <p className="font-bold text-[11px] text-[#33ff00]/80">GENERAL PM</p>
                <p className="text-[#33ff00]/30 font-mono">[ SIGN SEAL ]</p>
              </div>
              <div className="p-3 space-y-6">
                <p className="font-bold text-[11px] text-[#33ff00]/80">SUPERVISING ARCH</p>
                <p className="text-[#33ff00]/30 font-mono">[ SIGN SEAL ]</p>
              </div>
              <div className="p-3 space-y-6">
                <p className="font-bold text-[11px] text-[#33ff00]/80">CLIENT REP</p>
                <p className="text-[#33ff00]/30 font-mono">[ SIGN SEAL ]</p>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-[#1f521f]">
              <button
                onClick={() => setShowPrintSheet(false)}
                className="px-3 py-1 text-xs text-[#33ff00]/70 border border-[#1f521f] hover:border-[#33ff00]"
              >
                [ CLOSE ]
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1 text-xs bg-[#33ff00] text-black font-bold flex items-center gap-1.5 hover:bg-white"
              >
                <Printer className="w-3.5 h-3.5" /> [ EXECUTE_PRINT ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
