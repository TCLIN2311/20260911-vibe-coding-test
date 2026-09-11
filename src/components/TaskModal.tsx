import React, { useState } from 'react';
import {
  X,
  Calendar,
  User as UserIcon,
  Tag,
  CheckSquare,
  Paperclip,
  Trash2,
  HelpCircle,
  MessageSquare,
  Send,
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import {
  Task,
  User,
  KanbanColumn,
  RFI,
  Attachment,
  Comment,
  TaskPriority,
  ChecklistItem
} from '../types/pms';
import { RichTextEditorWithPaste } from './RichTextEditorWithPaste';
import { AttachmentsList } from './AttachmentsList';

interface TaskModalProps {
  task: Task | null; // null if creating a new task
  isOpen: boolean;
  onClose: () => void;
  columns: KanbanColumn[];
  initialColumnId?: string;
  projectId: string;
  users: User[];
  rfis: RFI[];
  attachments: Attachment[];
  comments: Comment[];
  currentUser: User;
  canEdit: boolean;
  allTasks?: Task[];
  onSaveTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddAttachment: (attachment: Attachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onAddComment: (comment: Comment) => void;
  onOpenRfiModal?: (rfiId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  columns,
  initialColumnId,
  projectId,
  users,
  rfis,
  attachments,
  comments,
  currentUser,
  canEdit,
  allTasks = [],
  onSaveTask,
  onDeleteTask,
  onAddAttachment,
  onDeleteAttachment,
  onAddComment,
  onOpenRfiModal,
}) => {
  if (!isOpen) return null;

  const isNew = !task;
  const taskId = task?.id || 'tsk-' + Math.random().toString(36).substring(2, 9);

  // Form states
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [columnId, setColumnId] = useState(task?.columnId || initialColumnId || columns[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [category, setCategory] = useState(task?.category || '第二階段：BIM 與機電系統整合');
  const [progress, setProgress] = useState(task?.progress !== undefined ? task.progress : 0);
  const [isMilestone, setIsMilestone] = useState(task?.isMilestone || false);
  const [dependencies, setDependencies] = useState<string[]>(task?.dependencies || []);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task?.assigneeIds || [currentUser.id]);
  const [tags, setTags] = useState<string[]>(task?.tags || ['MEP機電']);
  const [tagInput, setTagInput] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task?.checklist || []);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [linkedRfiIds, setLinkedRfiIds] = useState<string[]>(task?.linkedRfiIds || []);
  const [newCommentText, setNewCommentText] = useState('');

  // Checklist handlers
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: 'chk-' + Date.now(),
      text: newChecklistText.trim(),
      completed: false,
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistText('');
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(
      checklist.map((c) => (c.id === itemId ? { ...c, completed: !c.completed } : c))
    );
  };

  const removeChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter((c) => c.id !== itemId));
  };

  // Tag handler
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
  };

  // Assignee toggle
  const toggleAssignee = (uid: string) => {
    if (assigneeIds.includes(uid)) {
      setAssigneeIds(assigneeIds.filter((id) => id !== uid));
    } else {
      setAssigneeIds([...assigneeIds, uid]);
    }
  };

  // Linked RFI toggle
  const toggleLinkedRfi = (rfiId: string) => {
    if (linkedRfiIds.includes(rfiId)) {
      setLinkedRfiIds(linkedRfiIds.filter((id) => id !== rfiId));
    } else {
      setLinkedRfiIds([...linkedRfiIds, rfiId]);
    }
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請填寫卡片標題');
      return;
    }

    const savedTask: Task = {
      id: taskId,
      projectId,
      columnId,
      title: title.trim(),
      description,
      priority,
      position: task ? task.position : 0,
      startDate: startDate || null,
      dueDate: dueDate || null,
      category: category.trim() || undefined,
      progress: Number(progress),
      isMilestone,
      dependencies,
      createdBy: task ? task.createdBy : currentUser.id,
      createdAt: task ? task.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assigneeIds,
      tags,
      checklist,
      linkedRfiIds,
    };

    onSaveTask(savedTask);
    onClose();
  };

  // Comment submit
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: 'cmt-' + Date.now(),
      targetType: 'TASK',
      targetId: taskId,
      userId: currentUser.id,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddComment(newComment);
    setNewCommentText('');
  };

  const taskComments = comments.filter((c) => c.targetType === 'TASK' && c.targetId === taskId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-mono">
      <div className="bg-[#0a0a0a] border-2 border-[#33ff00] text-[#33ff00] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto shadow-[0_0_20px_rgba(51,255,0,0.15)]">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[#1f521f] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 border border-[#33ff00] text-[#33ff00] bg-[#0a0a0a]">
              {isNew ? '[+ NEW_TASK_DISPATCH]' : `[TASK_#${taskId.slice(-4).toUpperCase()}]`}
            </span>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              disabled={!canEdit}
              className="text-xs font-mono border border-[#1f521f] px-2 py-0.5 bg-[#0a0a0a] text-[#33ff00] focus:border-[#33ff00]"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0a] text-[#33ff00]">
                  PIPELINE: {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="px-2 py-0.5 text-[#ff3333] border border-[#ff3333] hover:bg-[#ff3333] hover:text-black transition-colors font-bold text-xs"
          >
            [ESC/CLOSE]
          </button>
        </div>

        {/* Content Body: Two columns layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main column (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#33ff00] mb-1">
                &gt; TASK_TITLE <span className="text-[#ff3333]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit}
                placeholder="e.g. B2F_CHILLER_PIPE_INTEGRATION"
                className="w-full text-xs font-mono px-2.5 py-1.5 bg-[#050505] border border-[#1f521f] focus:border-[#33ff00] text-[#33ff00] placeholder-[#1f521f]"
              />
            </div>

            {/* Description with Markdown + Clipboard paste */}
            <div>
              <RichTextEditorWithPaste
                label="TASK_DESCRIPTION_AND_SPECS"
                value={description}
                onChange={setDescription}
                targetType="TASK"
                targetId={taskId}
                currentUser={currentUser}
                onAddAttachment={onAddAttachment}
                rows={6}
                placeholder="INPUT TASK SPECS... CTRL+V AUTOMATICALLY UPLOADS CLIPBOARD SCREENSHOTS..."
              />
            </div>

            {/* Checklist */}
            <div className="bg-[#050505] border border-[#1f521f] p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#ffb000] flex items-center gap-1.5">
                  <span>&gt; SUBTASKS_AND_CHECKLIST</span>
                </h4>
                <span className="text-[10px] font-mono text-[#33ff00]">
                  [{checklist.filter((c) => c.completed).length}/{checklist.length} RESOLVED]
                </span>
              </div>

              {/* Progress bar ASCII */}
              {checklist.length > 0 && (
                <div className="text-[10px] text-[#33ff00]/70 font-mono">
                  PROGRESS: [
                  {'='.repeat(Math.round((checklist.filter((c) => c.completed).length / checklist.length) * 20))}
                  {'-'.repeat(20 - Math.round((checklist.filter((c) => c.completed).length / checklist.length) * 20))}
                  ] {Math.round((checklist.filter((c) => c.completed).length / checklist.length) * 100)}%
                </div>
              )}

              {/* Checklist items */}
              <div className="space-y-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-1.5 bg-[#0a0a0a] border border-[#1f521f] hover:border-[#33ff00] text-xs"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                        disabled={!canEdit}
                        className="accent-[#33ff00]"
                      />
                      <span
                        className={`text-xs font-mono ${
                          item.completed ? 'line-through text-[#1f521f]' : 'text-[#33ff00]'
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-[#ff3333] hover:underline px-1 text-[10px]"
                      >
                        [DEL]
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add checklist input */}
              {canEdit && (
                <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="add checklist milestone..."
                    className="flex-1 text-xs px-2 py-1 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1f521f] focus:border-[#33ff00]"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-[#0a0a0a] text-[#33ff00] border border-[#33ff00] text-xs font-bold hover:bg-[#33ff00] hover:text-black transition-colors shrink-0"
                  >
                    [ + ADD ]
                  </button>
                </form>
              )}
            </div>

            {/* Attachments Section */}
            <div className="border border-[#1f521f] p-3 bg-[#050505]">
              <AttachmentsList
                attachments={attachments}
                targetType="TASK"
                targetId={taskId}
                currentUser={currentUser}
                onAddAttachment={onAddAttachment}
                onDeleteAttachment={onDeleteAttachment}
                canEdit={canEdit}
              />
            </div>

            {/* Comments Thread */}
            <div className="border border-[#1f521f] p-3 bg-[#050505] space-y-3">
              <h4 className="text-xs font-bold text-[#ffb000] flex items-center gap-1.5">
                <span>&gt; LOG_STREAM_AND_DISCUSSIONS ({taskComments.length})</span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {taskComments.length === 0 ? (
                  <p className="text-xs text-[#1f521f] italic">[NO_COMMENTS_IN_BUFFER]</p>
                ) : (
                  taskComments.map((comment) => {
                    const author = users.find((u) => u.id === comment.userId);
                    return (
                      <div key={comment.id} className="bg-[#0a0a0a] p-2 border border-[#1f521f] text-xs">
                        <div className="flex items-center justify-between mb-1 text-[10px]">
                          <span className="font-bold text-[#ffb000]">
                            @{author?.fullName || 'SYSTEM_USER'}
                          </span>
                          <span className="text-[#1f521f] font-mono">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[#33ff00] whitespace-pre-wrap font-mono">{comment.content}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add comment box */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="post engineering audit remarks..."
                  className="flex-1 text-xs px-2.5 py-1 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1f521f] focus:border-[#33ff00]"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#33ff00] text-[#0a0a0a] text-xs font-bold hover:bg-white transition-colors shrink-0"
                >
                  [ TRANSMIT ]
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar controls (1/3) */}
          <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-[#1f521f] lg:pl-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-[#33ff00] mb-1">
                &gt; PRIORITY_LEVEL
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
                  const isSelected = priority === p;
                  const labels = { low: '[LOW]', medium: '[MED]', high: '[HIGH]', urgent: '[!URGENT!]' };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      disabled={!canEdit}
                      className={`text-xs py-1 px-1.5 border font-mono transition-all text-center ${
                        isSelected
                          ? p === 'urgent'
                            ? 'border-[#ff3333] bg-[#ff3333] text-black font-bold'
                            : 'border-[#33ff00] bg-[#33ff00] text-black font-bold'
                          : 'border-[#1f521f] text-[#33ff00]/70 hover:border-[#33ff00] bg-[#050505]'
                      }`}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule & Gantt Properties */}
            <div className="p-2.5 bg-[#050505] border border-[#1f521f] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ffb000]">
                  &gt; GANTT_PROPERTIES
                </span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMilestone}
                    onChange={(e) => setIsMilestone(e.target.checked)}
                    disabled={!canEdit}
                    className="accent-[#ffb000]"
                  />
                  <span className="text-[10px] text-[#ffb000] font-bold">
                    ◆ MILESTONE
                  </span>
                </label>
              </div>

              {/* Start Date & Due Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#33ff00]/70 mb-0.5">
                    START_DATE:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!canEdit}
                    className="w-full text-xs px-1.5 py-0.5 border border-[#1f521f] text-[#33ff00] bg-[#0a0a0a] focus:border-[#33ff00]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#33ff00]/70 mb-0.5">
                    DUE_DATE:
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={!canEdit}
                    className="w-full text-xs px-1.5 py-0.5 border border-[#1f521f] text-[#33ff00] bg-[#0a0a0a] focus:border-[#33ff00]"
                  />
                </div>
              </div>

              {/* Category / Phase */}
              <div>
                <label className="block text-[10px] text-[#33ff00]/70 mb-0.5">
                  PHASE / WORKPACKAGE:
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!canEdit}
                  className="w-full text-xs px-2 py-0.5 border border-[#1f521f] text-[#33ff00] bg-[#0a0a0a] focus:border-[#33ff00]"
                />
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] text-[#33ff00]/70">
                    EXECUTION_PROGRESS:
                  </label>
                  <span className="text-xs font-bold text-[#ffb000]">
                    {progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  disabled={!canEdit}
                  className="w-full h-1 bg-[#1f521f] appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Predecessor Dependencies */}
              <div>
                <label className="block text-[10px] text-[#33ff00]/70 mb-1">
                  PREDECESSORS (FS_DEPENDENCIES):
                </label>
                {allTasks.filter((t) => t.id !== taskId).length === 0 ? (
                  <p className="text-[10px] text-[#1f521f] italic">[NO_PREDECESSORS_AVAILABLE]</p>
                ) : (
                  <div className="max-h-24 overflow-y-auto space-y-1 bg-[#0a0a0a] border border-[#1f521f] p-1 text-xs">
                    {allTasks
                      .filter((t) => t.id !== taskId)
                      .map((t) => {
                        const isDep = dependencies.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-center gap-1.5 p-0.5 text-[10px] cursor-pointer ${
                              isDep ? 'bg-[#1f521f]/50 text-[#ffb000] font-bold' : 'text-[#33ff00]/70 hover:bg-[#1f521f]/20'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDep}
                              disabled={!canEdit}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDependencies([...dependencies, t.id]);
                                } else {
                                  setDependencies(dependencies.filter((id) => id !== t.id));
                                }
                              }}
                              className="accent-[#ffb000]"
                            />
                            <span className="truncate">{t.title}</span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-xs font-bold text-[#33ff00] mb-1 flex items-center gap-1">
                &gt; ASSIGNED_CREW ({assigneeIds.length})
              </label>
              <div className="space-y-1 max-h-36 overflow-y-auto border border-[#1f521f] p-1.5 bg-[#050505]">
                {users.map((user) => {
                  const isAssigned = assigneeIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => canEdit && toggleAssignee(user.id)}
                      className={`flex items-center gap-1.5 p-1 cursor-pointer text-xs transition-colors ${
                        isAssigned ? 'bg-[#1f521f]/50 border border-[#33ff00] text-[#33ff00]' : 'hover:bg-[#1f521f]/20 text-[#33ff00]/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        readOnly
                        className="accent-[#33ff00]"
                      />
                      <div className="min-w-0 flex-1 flex items-center justify-between text-[10px]">
                        <span className="font-bold truncate">@{user.fullName}</span>
                        <span className="text-[#1f521f] truncate">[{user.role}]</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Linked RFIs */}
            <div>
              <label className="block text-xs font-bold text-[#ffb000] mb-1 flex items-center gap-1">
                &gt; LINKED_RFIS ({linkedRfiIds.length})
              </label>
              <div className="space-y-1 max-h-36 overflow-y-auto border border-[#1f521f] p-1.5 bg-[#050505]">
                {rfis.length === 0 ? (
                  <p className="text-[10px] text-[#1f521f] italic">[NO_RFIS_IN_SYSTEM]</p>
                ) : (
                  rfis.map((rfi) => {
                    const isLinked = linkedRfiIds.includes(rfi.id);
                    return (
                      <div
                        key={rfi.id}
                        onClick={() => canEdit && toggleLinkedRfi(rfi.id)}
                        className={`flex items-start gap-1.5 p-1 text-xs cursor-pointer ${
                          isLinked ? 'bg-[#ffb000]/20 border border-[#ffb000] text-[#ffb000]' : 'hover:bg-[#1f521f]/20 text-[#33ff00]/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isLinked}
                          readOnly
                          className="mt-0.5 accent-[#ffb000]"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[10px] font-bold block">
                            [{rfi.rfiNumber}]
                          </span>
                          <span className="text-[10px] line-clamp-1">{rfi.title}</span>
                        </div>
                        {onOpenRfiModal && isLinked && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenRfiModal(rfi.id);
                            }}
                            className="text-[#ffb000] hover:underline text-[10px]"
                          >
                            [JUMP]
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-[#33ff00] mb-1 flex items-center gap-1">
                &gt; TAGS
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] border border-[#1f521f] text-[#33ff00] bg-[#050505]"
                  >
                    #{tag}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-[#ff3333] hover:font-bold ml-0.5"
                      >
                        x
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {canEdit && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="+tag [ENTER]..."
                  className="w-full text-xs px-2 py-0.5 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1f521f] focus:border-[#33ff00]"
                />
              )}
            </div>

            {/* Delete Task */}
            {!isNew && canEdit && onDeleteTask && (
              <div className="pt-2 border-t border-[#1f521f]">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('CONFIRM_DELETE_TASK: THIS OPERATION CANNOT BE UNDONE.')) {
                      onDeleteTask(taskId);
                      onClose();
                    }
                  }}
                  className="w-full py-1 px-2 text-xs text-[#ff3333] hover:bg-[#ff3333] hover:text-black border border-[#ff3333] transition-colors font-mono"
                >
                  [ ! DELETE_TASK ! ]
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#1f521f] bg-[#050505] flex items-center justify-between text-xs font-mono">
          <span className="text-[10px] text-[#1f521f]">
            {canEdit ? '$ LIVE_OPTIMISTIC_UPDATE_ARMED' : '$ READONLY_SESSION'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs border border-[#1f521f] text-[#33ff00]/70 hover:border-[#33ff00] hover:text-[#33ff00] transition-colors"
            >
              [ ABORT ]
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1 text-xs font-bold text-black bg-[#33ff00] hover:bg-white transition-colors"
              >
                {isNew ? '[ COMMIT_NEW_TASK ]' : '[ SAVE_CHANGES ]'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
