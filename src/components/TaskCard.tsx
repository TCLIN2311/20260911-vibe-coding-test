import React from 'react';
import {
  Calendar,
  CheckSquare,
  Paperclip,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Task, User, TaskPriority, RFI } from '../types/pms';

interface TaskCardProps {
  task: Task;
  users: User[];
  rfis: RFI[];
  attachmentCount: number;
  commentCount: number;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  rfis,
  attachmentCount,
  commentCount,
  onClick,
  onDragStart,
  isDragging = false,
}) => {
  // Get assignees
  const assignees = users.filter((u) => task.assigneeIds.includes(u.id));

  // Checklist counts
  const totalChecklist = task.checklist.length;
  const completedChecklist = task.checklist.filter((c) => c.completed).length;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  // Linked RFIs
  const linkedRfis = rfis.filter((r) => task.linkedRfiIds?.includes(r.id));

  // Priority badge config
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-1 py-0.2 text-[10px] font-mono font-bold border border-[#ff3333] text-[#ff3333] bg-[#ff3333]/10">[!URGENT]</span>;
      case 'high':
        return <span className="px-1 py-0.2 text-[10px] font-mono font-bold border border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10">[PRIO:HI]</span>;
      case 'medium':
        return <span className="px-1 py-0.2 text-[10px] font-mono font-bold border border-[#33ff00] text-[#33ff00] bg-[#33ff00]/10">[PRIO:MD]</span>;
      case 'low':
        return <span className="px-1 py-0.2 text-[10px] font-mono border border-[#1f521f] text-[#33ff00]/60">[PRIO:LO]</span>;
    }
  };

  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.columnId !== 'col-done' : false;

  // ASCII progress generator
  const renderAsciiProgress = (pct: number) => {
    const totalBars = 10;
    const filledBars = Math.round((pct / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    return `[${'|'.repeat(filledBars)}${'.'.repeat(emptyBars)}]`;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className={`group bg-[#0a0a0a] p-3 border border-[#1f521f] hover:border-[#33ff00] transition-colors cursor-grab active:cursor-grabbing select-none relative font-mono text-xs ${
        isDragging ? 'opacity-30 border-dashed border-[#33ff00]' : ''
      }`}
    >
      {/* Top row: ID, Priority & Overdue */}
      <div className="flex items-center justify-between gap-1.5 mb-2 border-b border-[#1f521f]/50 pb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-[#33ff00] bg-[#1f521f]/30 px-1 border border-[#1f521f]">
            #{task.id}
          </span>
          {getPriorityBadge(task.priority)}
          {task.isMilestone && (
            <span className="px-1 py-0.2 text-[10px] font-bold border border-[#ff3333] text-[#ff3333] bg-[#ff3333]/10">
              ◆_MILESTONE
            </span>
          )}
        </div>

        {isOverdue && (
          <span className="flex items-center gap-0.5 text-[10px] text-[#ff3333] font-bold border border-[#ff3333] px-1 bg-[#ff3333]/10 animate-pulse">
            !OVERDUE
          </span>
        )}
      </div>

      {/* Task Title */}
      <h3 className="text-xs font-bold text-[#33ff00] group-hover:text-white transition-colors leading-snug mb-2 font-mono">
        <span className="text-[#ffb000] mr-1">&gt;</span>
        {task.title}
      </h3>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1 bg-[#050505] text-[#33ff00]/70 border border-[#1f521f]"
            >
              --tag={tag}
            </span>
          ))}
        </div>
      )}

      {/* Linked RFIs Chips */}
      {linkedRfis.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {linkedRfis.map((rfi) => (
            <span
              key={rfi.id}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-1 border border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10 hover:bg-[#ffb000] hover:text-[#0a0a0a]"
              title={`LINKED RFI: ${rfi.title} (${rfi.status})`}
            >
              <span>? {rfi.rfiNumber}</span>
            </span>
          ))}
        </div>
      )}

      {/* Checklist / ASCII Progress */}
      {totalChecklist > 0 && (
        <div className="mb-2 space-y-1 bg-[#050505] p-1.5 border border-[#1f521f]">
          <div className="flex items-center justify-between text-[10px] text-[#33ff00]/80">
            <span>CHECKLIST:</span>
            <span className="font-mono text-[#ffb000]">
              {completedChecklist}/{totalChecklist} ({checklistPercent}%)
            </span>
          </div>
          <div className="text-[10px] text-[#33ff00] font-mono tracking-widest">
            {renderAsciiProgress(checklistPercent)}
          </div>
        </div>
      )}

      {/* Bottom row: Due Date, Counts, Assignees */}
      <div className="flex items-center justify-between pt-1.5 border-t border-[#1f521f] text-[10px] text-[#33ff00]/70 mt-1">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={isOverdue ? 'text-[#ff3333] font-bold' : 'text-[#33ff00]/80'}>
              DUE:{new Date(task.dueDate).toISOString().slice(5, 10)}
            </span>
          )}

          {attachmentCount > 0 && (
            <span className="text-[#33ff00]/60">
              ATT:{attachmentCount}
            </span>
          )}

          {commentCount > 0 && (
            <span className="text-[#ffb000]">
              MSG:{commentCount}
            </span>
          )}
        </div>

        {/* Assignees initials/login */}
        <div className="flex items-center gap-1">
          {assignees.map((user) => (
            <span
              key={user.id}
              title={`${user.fullName} (${user.department})`}
              className="px-1 text-[10px] border border-[#1f521f] bg-[#050505] text-[#33ff00]"
            >
              @{user.username || user.fullName.slice(0, 3)}
            </span>
          ))}
          {assignees.length === 0 && (
            <span className="text-[#1f521f] italic">[UNASSIGNED]</span>
          )}
        </div>
      </div>
    </div>
  );
};
