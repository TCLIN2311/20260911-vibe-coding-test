import React, { useState } from 'react';
import {
  Plus,
  MoreVertical,
  AlertTriangle,
  Settings,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  SlidersHorizontal,
  FolderPlus,
  Calendar
} from 'lucide-react';
import { KanbanColumn, Task, User, RFI, Attachment, Comment, TaskPriority } from '../types/pms';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  tasks: Task[];
  users: User[];
  rfis: RFI[];
  attachments: Attachment[];
  comments: Comment[];
  currentUser: User;
  canEdit: boolean;
  canManageColumns: boolean; // PM & Admin
  onMoveTask: (taskId: string, targetColumnId: string, targetPosition: number) => void;
  onOpenTaskModal: (task: Task | null, columnId?: string) => void;
  onAddColumn: (name: string, wipLimit: number) => void;
  onUpdateColumn: (col: KanbanColumn) => void;
  onDeleteColumn: (columnId: string) => void;
  onSwitchToGantt?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasks,
  users,
  rfis,
  attachments,
  comments,
  currentUser,
  canEdit,
  canManageColumns,
  onMoveTask,
  onOpenTaskModal,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onSwitchToGantt,
}) => {
  // Drag & drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Column edit modal state
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColWip, setNewColWip] = useState<number>(0);

  // Collect all unique tags
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)));

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    if (selectedAssignee !== 'all') {
      if (!t.assigneeIds.includes(selectedAssignee)) return false;
    }

    if (selectedPriority !== 'all') {
      if (t.priority !== selectedPriority) return false;
    }

    if (selectedTag !== 'all') {
      if (!t.tags.includes(selectedTag)) return false;
    }

    return true;
  });

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (!canEdit) return;
    setDragOverColId(colId);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!canEdit) return;

    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Target position at end of target column
    const tasksInTargetCol = tasks.filter((t) => t.columnId === targetColId);
    const newPosition = tasksInTargetCol.length;

    onMoveTask(taskId, targetColId, newPosition);
    setDraggedTaskId(null);
  };

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0a0a0a] text-[#33ff00] p-3 sm:p-4 overflow-hidden font-mono">
      {/* Filters and Controls Toolbar (Terminal Prompt Style) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 bg-[#050505] px-3 py-2 border border-[#1f521f] select-none text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          {/* Grep search */}
          <div className="relative flex-1 max-w-xs flex items-center">
            <span className="text-[#ffb000] font-bold mr-1.5">$</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="grep -i [pattern]..."
              className="w-full text-xs px-2 py-1 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1f521f] focus:outline-none focus:border-[#33ff00]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#ff3333] hover:text-white"
              >
                [x]
              </button>
            )}
          </div>

          {/* Member filter */}
          <div className="flex items-center gap-1">
            <span className="text-[#1f521f] hidden lg:inline">USER:</span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="text-xs bg-[#0a0a0a] border border-[#1f521f] px-2 py-1 text-[#33ff00] focus:outline-none focus:border-[#33ff00] cursor-pointer"
            >
              <option value="all" className="bg-[#0a0a0a] text-[#33ff00]">[ALL_USERS]</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0a0a0a] text-[#33ff00]">
                  @{u.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1">
            <span className="text-[#1f521f] hidden lg:inline">PRIO:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs bg-[#0a0a0a] border border-[#1f521f] px-2 py-1 text-[#33ff00] focus:outline-none focus:border-[#33ff00] cursor-pointer"
            >
              <option value="all" className="bg-[#0a0a0a] text-[#33ff00]">[ALL_PRIORITY]</option>
              <option value="urgent" className="bg-[#0a0a0a] text-[#ff3333]">[!URGENT]</option>
              <option value="high" className="bg-[#0a0a0a] text-[#ffb000]">[HIGH]</option>
              <option value="medium" className="bg-[#0a0a0a] text-[#33ff00]">[MEDIUM]</option>
              <option value="low" className="bg-[#0a0a0a] text-[#33ff00]/60">[LOW]</option>
            </select>
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="text-xs bg-[#0a0a0a] border border-[#1f521f] px-2 py-1 text-[#33ff00] focus:outline-none focus:border-[#33ff00] cursor-pointer hidden md:block"
            >
              <option value="all" className="bg-[#0a0a0a] text-[#33ff00]">[ALL_TAGS]</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag} className="bg-[#0a0a0a] text-[#33ff00]">
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {(searchQuery || selectedAssignee !== 'all' || selectedPriority !== 'all' || selectedTag !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedAssignee('all');
                setSelectedPriority('all');
                setSelectedTag('all');
              }}
              className="text-xs text-[#ff3333] hover:bg-[#ff3333] hover:text-[#0a0a0a] px-1.5 py-0.5 border border-[#ff3333]"
            >
              [RESET]
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onSwitchToGantt && (
            <button
              onClick={onSwitchToGantt}
              className="text-xs px-2.5 py-1 bg-[#0a0a0a] border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-[#0a0a0a] font-bold transition-colors"
            >
              [ &gt;&gt; GANTT_TIMELINE ]
            </button>
          )}

          {canManageColumns && (
            <button
              onClick={() => setShowAddColumnModal(true)}
              className="text-xs px-2.5 py-1 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] hover:border-[#33ff00] transition-colors"
            >
              [ + ADD_PIPE ]
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => onOpenTaskModal(null)}
              className="text-xs px-3 py-1 bg-[#33ff00] text-[#0a0a0a] font-bold hover:bg-white transition-colors"
            >
              [ + DISPATCH_TASK ]
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="flex-1 flex gap-3 overflow-x-auto pb-3 min-h-0 select-none">
        {sortedColumns.map((column) => {
          const colTasks = filteredTasks
            .filter((t) => t.columnId === column.id)
            .sort((a, b) => a.position - b.position);

          const isOverWip = column.wipLimit > 0 && colTasks.length > column.wipLimit;
          const isAtWip = column.wipLimit > 0 && colTasks.length === column.wipLimit;
          const isDragTarget = dragOverColId === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => setDragOverColId(null)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`w-72 sm:w-80 shrink-0 flex flex-col bg-[#050505] border transition-all ${
                isDragTarget
                  ? 'border-[#33ff00] bg-[#0d280d]/40'
                  : 'border-[#1f521f]'
              }`}
            >
              {/* Column Header */}
              <div className="p-2.5 border-b border-[#1f521f] bg-[#0a0a0a] flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[#33ff00] font-bold">&gt;</span>
                  <h3 className="text-xs font-bold text-[#33ff00] truncate uppercase tracking-wider" title={column.name}>
                    {column.name}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-1 font-bold border ${
                      isOverWip
                        ? 'border-[#ff3333] text-[#ff3333] bg-[#ff3333]/10'
                        : isAtWip
                        ? 'border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10'
                        : 'border-[#1f521f] text-[#33ff00]/70'
                    }`}
                  >
                    [{colTasks.length}{column.wipLimit > 0 ? `/${column.wipLimit}` : ''}]
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isOverWip && (
                    <span
                      title={`OVER WIP LIMIT (${column.wipLimit})`}
                      className="text-[10px] text-[#ff3333] font-bold border border-[#ff3333] px-1 animate-pulse"
                    >
                      !WIP_OVER
                    </span>
                  )}

                  {canManageColumns && (
                    <button
                      onClick={() => setEditingColumn(column)}
                      className="p-1 text-[#1f521f] hover:text-[#33ff00]"
                      title="CONFIGURE PIPE"
                    >
                      [OPT]
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[120px]">
                {colTasks.length === 0 ? (
                  <div
                    onClick={() => canEdit && onOpenTaskModal(null, column.id)}
                    className="h-28 border border-dashed border-[#1f521f] hover:border-[#33ff00] flex flex-col items-center justify-center text-[#1f521f] hover:text-[#33ff00] cursor-pointer transition-colors p-2 text-center"
                  >
                    <span className="text-xs font-mono">[ + EMPTY_QUEUE: CLICK_TO_ADD ]</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      rfis={rfis}
                      attachmentCount={
                        attachments.filter((a) => a.targetType === 'TASK' && a.targetId === task.id).length
                      }
                      commentCount={
                        comments.filter((c) => c.targetType === 'TASK' && c.targetId === task.id).length
                      }
                      onClick={() => onOpenTaskModal(task)}
                      onDragStart={handleDragStart}
                      isDragging={draggedTaskId === task.id}
                    />
                  ))
                )}
              </div>

              {/* Column Footer: Quick Add Card */}
              {canEdit && (
                <div className="p-1.5 border-t border-[#1f521f] bg-[#0a0a0a]">
                  <button
                    onClick={() => onOpenTaskModal(null, column.id)}
                    className="w-full py-1 text-xs text-[#33ff00]/60 hover:text-[#33ff00] hover:bg-[#1f521f]/30 flex items-center justify-center gap-1 font-mono transition-all border border-transparent hover:border-[#1f521f]"
                  >
                    <span>+ DISPATCH_TO_PIPE</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Column Edit Modal (PM/Admin) */}
      {editingColumn && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#33ff00] max-w-sm w-full p-4 space-y-3 font-mono text-xs">
            <div className="border-b border-[#1f521f] pb-2 flex justify-between items-center text-[#33ff00] font-bold">
              <span>+== [ CONFIG_PIPE // {editingColumn.name} ] ==+</span>
              <button onClick={() => setEditingColumn(null)} className="text-[#ff3333] hover:text-white">[X]</button>
            </div>

            <div>
              <label className="block text-xs text-[#33ff00]/80 mb-1">$ SET_PIPE_NAME:</label>
              <input
                type="text"
                value={editingColumn.name}
                onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
                className="w-full text-xs px-2 py-1 bg-[#050505] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#33ff00]/80 mb-1">
                $ SET_WIP_LIMIT (0 = UNLIMITED):
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={editingColumn.wipLimit}
                onChange={(e) =>
                  setEditingColumn({ ...editingColumn, wipLimit: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full text-xs px-2 py-1 bg-[#050505] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00] focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1f521f]">
              <button
                type="button"
                onClick={() => {
                  if (columns.length <= 1) {
                    alert('CRITICAL: CANNOT DELETE LAST REMAINING PIPELINE COLUMN');
                    return;
                  }
                  if (confirm(`CONFIRM DROP COLUMN "${editingColumn.name}"?`)) {
                    onDeleteColumn(editingColumn.id);
                    setEditingColumn(null);
                  }
                }}
                className="text-xs text-[#ff3333] hover:bg-[#ff3333] hover:text-[#0a0a0a] px-2 py-1 border border-[#ff3333]"
              >
                [DROP_COLUMN]
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingColumn(null)}
                  className="text-xs px-2 py-1 border border-[#1f521f] text-[#33ff00]/70 hover:text-white"
                >
                  [CANCEL]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateColumn(editingColumn);
                    setEditingColumn(null);
                  }}
                  className="text-xs px-3 py-1 bg-[#33ff00] text-[#0a0a0a] font-bold hover:bg-white"
                >
                  [COMMIT]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Column Modal */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#33ff00] max-w-sm w-full p-4 space-y-3 font-mono text-xs">
            <div className="border-b border-[#1f521f] pb-2 flex justify-between items-center text-[#33ff00] font-bold">
              <span>+== [ CREATE_NEW_PIPELINE_COLUMN ] ==+</span>
              <button onClick={() => setShowAddColumnModal(false)} className="text-[#ff3333] hover:text-white">[X]</button>
            </div>

            <div>
              <label className="block text-xs text-[#33ff00]/80 mb-1">$ PIPE_NAME:</label>
              <input
                type="text"
                placeholder="e.g. FAT_ACCEPTANCE_TEST"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                className="w-full text-xs px-2 py-1 bg-[#050505] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#33ff00]/80 mb-1">
                $ WIP_LIMIT (0 = UNLIMITED):
              </label>
              <input
                type="number"
                min="0"
                value={newColWip}
                onChange={(e) => setNewColWip(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs px-2 py-1 bg-[#050505] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00] focus:outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1f521f]">
              <button
                type="button"
                onClick={() => {
                  setShowAddColumnModal(false);
                  setNewColName('');
                }}
                className="text-xs px-2 py-1 border border-[#1f521f] text-[#33ff00]/70 hover:text-white"
              >
                [CANCEL]
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newColName.trim()) {
                    alert('PLEASE SPECIFY COLUMN NAME');
                    return;
                  }
                  onAddColumn(newColName.trim(), newColWip);
                  setShowAddColumnModal(false);
                  setNewColName('');
                  setNewColWip(0);
                }}
                className="text-xs px-3 py-1 bg-[#33ff00] text-[#0a0a0a] font-bold hover:bg-white"
              >
                [EXECUTE_CREATE]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
