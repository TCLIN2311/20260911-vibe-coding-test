import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Filter,
  Plus,
  FolderKanban,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Flag,
  User as UserIcon,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { Task, KanbanColumn, User, Project } from '../types/pms';

interface GanttChartProps {
  tasks: Task[];
  columns: KanbanColumn[];
  users: User[];
  currentProject: Project;
  canEdit: boolean;
  onOpenTaskModal: (task: Task | null) => void;
  onUpdateTask: (task: Task) => void;
  onSwitchToKanban: () => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

interface TaskGroup {
  name: string;
  tasks: Task[];
  minDate: Date;
  maxDate: Date;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  columns,
  users,
  currentProject,
  canEdit,
  onOpenTaskModal,
  onUpdateTask,
  onSwitchToKanban,
}) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedColumn, setSelectedColumn] = useState<string>('all');
  const [onlyMilestones, setOnlyMilestones] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Default cell width based on zoom level
  const columnWidth = useMemo(() => {
    switch (zoomLevel) {
      case 'day':
        return 38; // px per day
      case 'week':
        return 72; // px per week
      case 'month':
        return 120; // px per month
      default:
        return 38;
    }
  }, [zoomLevel]);

  // Normalize dates helper
  const parseTaskDate = (dStr: string | null | undefined, fallbackOffsetDays = 0): Date => {
    if (dStr) {
      const parts = dStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    const d = new Date(2026, 8, 10); // Reference current app time: 2026-09-10
    d.setDate(d.getDate() + fallbackOffsetDays);
    return d;
  };

  // Extract start and end for tasks
  const enrichedTasks = useMemo(() => {
    return tasks.map((t) => {
      let start = t.startDate ? parseTaskDate(t.startDate) : null;
      let end = t.dueDate ? parseTaskDate(t.dueDate) : null;

      if (t.isMilestone) {
        // Milestone is a single point
        const target = end || start || parseTaskDate('2026-09-20');
        start = new Date(target);
        end = new Date(target);
      } else {
        if (!start && end) {
          start = new Date(end);
          start.setDate(start.getDate() - 5);
        } else if (start && !end) {
          end = new Date(start);
          end.setDate(end.getDate() + 5);
        } else if (!start && !end) {
          start = parseTaskDate(t.createdAt, 0);
          end = new Date(start);
          end.setDate(end.getDate() + 7);
        }
      }

      // Ensure start <= end
      if (start && end && start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }

      // Calculate progress if not specified
      let prog = t.progress;
      if (prog === undefined) {
        if (t.columnId === 'col-done') {
          prog = 100;
        } else if (t.checklist && t.checklist.length > 0) {
          const completed = t.checklist.filter((c) => c.completed).length;
          prog = Math.round((completed / t.checklist.length) * 100);
        } else {
          prog = t.columnId === 'col-in-progress' ? 40 : 0;
        }
      }

      return {
        ...t,
        computedStart: start as Date,
        computedEnd: end as Date,
        computedProgress: prog,
        categoryName: t.category || '未分組工作項目 (General Work Packages)',
      };
    });
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return enrichedTasks.filter((t) => {
      if (onlyMilestones && !t.isMilestone) return false;
      if (selectedAssignee !== 'all' && !t.assigneeIds.includes(selectedAssignee)) return false;
      if (selectedColumn !== 'all' && t.columnId !== selectedColumn) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchTag = t.tags.some((tg) => tg.toLowerCase().includes(q));
        const matchCategory = t.categoryName.toLowerCase().includes(q);
        if (!matchTitle && !matchTag && !matchCategory) return false;
      }
      return true;
    });
  }, [enrichedTasks, onlyMilestones, selectedAssignee, selectedColumn, searchQuery]);

  // Group by category (similar to Develop v2.0, Develop v2.1 in OpenProject screenshot)
  const taskGroups = useMemo(() => {
    const groupsMap = new Map<string, TaskGroup>();

    filteredTasks.forEach((t) => {
      const gName = t.categoryName;
      if (!groupsMap.has(gName)) {
        groupsMap.set(gName, {
          name: gName,
          tasks: [],
          minDate: new Date(t.computedStart),
          maxDate: new Date(t.computedEnd),
        });
      }
      const group = groupsMap.get(gName)!;
      group.tasks.push(t);
      if (t.computedStart < group.minDate) group.minDate = new Date(t.computedStart);
      if (t.computedEnd > group.maxDate) group.maxDate = new Date(t.computedEnd);
    });

    return Array.from(groupsMap.values());
  }, [filteredTasks]);

  // Calculate timeline overall date bounds (e.g. from 2026-08-20 to 2026-10-31)
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    let minD = new Date(2026, 7, 20); // 2026-08-20
    let maxD = new Date(2026, 9, 31); // 2026-10-31

    enrichedTasks.forEach((t) => {
      if (t.computedStart < minD) minD = new Date(t.computedStart);
      if (t.computedEnd > maxD) maxD = new Date(t.computedEnd);
    });

    // Add padding days
    const paddedStart = new Date(minD);
    paddedStart.setDate(paddedStart.getDate() - 5);
    const paddedEnd = new Date(maxD);
    paddedEnd.setDate(paddedEnd.getDate() + 10);

    const diffTime = Math.abs(paddedEnd.getTime() - paddedStart.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return {
      timelineStart: paddedStart,
      timelineEnd: paddedEnd,
      totalDays: days,
    };
  }, [enrichedTasks]);

  // Array of days for calendar header
  const daysArray = useMemo(() => {
    const arr: { date: Date; dateStr: string; dayOfMonth: number; dayOfWeek: number; monthStr: string; isWeekend: boolean }[] = [];
    const curr = new Date(timelineStart);
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(curr);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      arr.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayOfMonth: d.getDate(),
        dayOfWeek: d.getDay(),
        monthStr: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`,
        isWeekend,
      });
      curr.setDate(curr.getDate() + 1);
    }
    return arr;
  }, [timelineStart, totalDays]);

  // Group days by month for top header
  const monthsHeader = useMemo(() => {
    const list: { monthName: string; count: number; startIndex: number }[] = [];
    let currentMonth = '';
    let currentCount = 0;
    let startIdx = 0;

    daysArray.forEach((item, idx) => {
      if (item.monthStr !== currentMonth) {
        if (currentMonth !== '') {
          list.push({ monthName: currentMonth, count: currentCount, startIndex: startIdx });
        }
        currentMonth = item.monthStr;
        currentCount = 1;
        startIdx = idx;
      } else {
        currentCount++;
      }
    });
    if (currentCount > 0) {
      list.push({ monthName: currentMonth, count: currentCount, startIndex: startIdx });
    }
    return list;
  }, [daysArray]);

  // Today marker (2026-09-10)
  const todayDate = useMemo(() => new Date(2026, 8, 10), []);
  const todayIndex = useMemo(() => {
    const diff = Math.floor((todayDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < totalDays ? diff : null;
  }, [todayDate, timelineStart, totalDays]);

  // Scroll to today on mount
  useEffect(() => {
    if (timelineContainerRef.current && todayIndex !== null) {
      const scrollToX = Math.max(0, todayIndex * columnWidth - 300);
      timelineContainerRef.current.scrollTo({ left: scrollToX, behavior: 'smooth' });
    }
  }, [columnWidth, todayIndex]);

  const scrollToToday = () => {
    if (timelineContainerRef.current && todayIndex !== null) {
      const scrollToX = Math.max(0, todayIndex * columnWidth - 300);
      timelineContainerRef.current.scrollTo({ left: scrollToX, behavior: 'smooth' });
    }
  };

  // Toggle group collapse
  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Coordinate helper: Date to X pixel
  const dateToX = (d: Date): number => {
    const diffDays = (d.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays * columnWidth;
  };

  // Priority color badges
  const priorityColor = {
    low: 'bg-emerald-500 text-emerald-100',
    medium: 'bg-blue-500 text-blue-100',
    high: 'bg-amber-500 text-amber-100',
    urgent: 'bg-rose-500 text-rose-100',
  };

  // Status badge
  const getColumnName = (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    return col?.name.split(' ')[0] || '待處理';
  };

  // Calculate row positions for SVG dependency arrows
  // We keep a flattened visible list of items: group headers and tasks
  const visibleItems = useMemo(() => {
    const list: { type: 'group' | 'task'; groupName: string; task?: typeof enrichedTasks[0] }[] = [];
    taskGroups.forEach((group) => {
      list.push({ type: 'group', groupName: group.name });
      if (!collapsedGroups[group.name]) {
        group.tasks.forEach((task) => {
          list.push({ type: 'task', groupName: group.name, task });
        });
      }
    });
    return list;
  }, [taskGroups, collapsedGroups]);

  const ROW_HEIGHT = 44; // height of each row in px

  // Build task coordinate mapping for dependency lines
  const taskCoordinates = useMemo(() => {
    const coords: Record<string, { startX: number; endX: number; y: number; isMilestone: boolean }> = {};

    visibleItems.forEach((item, index) => {
      if (item.type === 'task' && item.task) {
        const t = item.task;
        const startX = dateToX(t.computedStart);
        const endX = t.isMilestone ? startX : Math.max(startX + columnWidth, dateToX(t.computedEnd) + columnWidth);
        const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
        coords[t.id] = {
          startX,
          endX,
          y,
          isMilestone: !!t.isMilestone,
        };
      }
    });

    return coords;
  }, [visibleItems, columnWidth, timelineStart]);

  // Generate SVG dependency links (Finish-to-Start)
  const dependencyLinks = useMemo(() => {
    const links: {
      fromId: string;
      toId: string;
      path: string;
      isHighlighted: boolean;
    }[] = [];

    enrichedTasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((predId) => {
          const fromCoord = taskCoordinates[predId];
          const toCoord = taskCoordinates[task.id];

          if (fromCoord && toCoord) {
            const x1 = fromCoord.endX + 2;
            const y1 = fromCoord.y;
            const x2 = toCoord.startX - 6;
            const y2 = toCoord.y;

            // Orthogonal path routing (like OpenProject screenshot: right -> down/up -> right)
            let path = '';
            if (x2 >= x1 + 14) {
              const midX = x1 + (x2 - x1) / 2;
              path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
            } else {
              // Task starts before or immediately after predecessor ends; route around
              const dropY = y1 + (y2 > y1 ? 14 : -14);
              path = `M ${x1} ${y1} L ${x1 + 10} ${y1} L ${x1 + 10} ${dropY} L ${x2 - 10} ${dropY} L ${x2 - 10} ${y2} L ${x2} ${y2}`;
            }

            const isHighlighted = hoveredTaskId === predId || hoveredTaskId === task.id;

            links.push({
              fromId: predId,
              toId: task.id,
              path,
              isHighlighted,
            });
          }
        });
      }
    });

    return links;
  }, [enrichedTasks, taskCoordinates, hoveredTaskId]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-[#33ff00] font-mono overflow-hidden select-none">
      {/* 1. Terminal Top Action Bar */}
      <div className="border-b border-[#1f521f] px-3 py-2 bg-[#050505] flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
        {/* Left: Shell Title & Count badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[#ffb000] font-bold">&gt;&gt;</span>
            <h2 className="text-xs font-bold text-[#33ff00] tracking-wider uppercase">
              PROJECT_GANTT_TIMELINE.SH
            </h2>
          </div>
          <span className="text-[10px] bg-[#0a0a0a] text-[#33ff00]/70 px-1.5 py-0.5 border border-[#1f521f]">
            [{filteredTasks.length} TASKS]
          </span>
          {onlyMilestones && (
            <span className="text-[10px] text-[#ffb000] border border-[#ffb000] px-1 py-0.5 animate-pulse">
              ◆ [MILESTONES_ONLY]
            </span>
          )}
        </div>

        {/* Right Controls: + Create, Filter, Zoom, Switch to Kanban */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Create Task */}
          {canEdit && (
            <button
              onClick={() => onOpenTaskModal(null)}
              className="px-2.5 py-1 bg-[#33ff00] hover:bg-white text-[#0a0a0a] text-xs font-bold transition-colors"
            >
              [ + DISPATCH_TASK ]
            </button>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-2 py-1 text-xs border transition-colors ${
              showFilters || selectedAssignee !== 'all' || selectedColumn !== 'all' || onlyMilestones || searchQuery
                ? 'bg-[#1f521f]/50 border-[#33ff00] text-[#33ff00] font-bold'
                : 'bg-[#0a0a0a] border-[#1f521f] text-[#33ff00]/70 hover:border-[#33ff00]'
            }`}
          >
            [ FILTER{(selectedAssignee !== 'all' || selectedColumn !== 'all' || onlyMilestones || searchQuery) ? '*' : ''} ]
          </button>

          {/* Zoom controls */}
          <div className="flex items-center border border-[#1f521f] bg-[#0a0a0a] text-xs">
            <button
              onClick={() => {
                if (zoomLevel === 'day') setZoomLevel('week');
                else if (zoomLevel === 'week') setZoomLevel('month');
              }}
              disabled={zoomLevel === 'month'}
              className="px-1.5 py-0.5 text-[#33ff00] hover:bg-[#1f521f]/50 disabled:opacity-30"
            >
              [-]
            </button>

            <span className="text-[10px] font-bold px-1.5 text-[#ffb000]">
              {zoomLevel === 'day' ? 'ZOOM:DAY' : zoomLevel === 'week' ? 'ZOOM:WEEK' : 'ZOOM:MONTH'}
            </span>

            <button
              onClick={() => {
                if (zoomLevel === 'month') setZoomLevel('week');
                else if (zoomLevel === 'week') setZoomLevel('day');
              }}
              disabled={zoomLevel === 'day'}
              className="px-1.5 py-0.5 text-[#33ff00] hover:bg-[#1f521f]/50 disabled:opacity-30"
            >
              [+]
            </button>
          </div>

          {/* Jump to today */}
          <button
            onClick={scrollToToday}
            className="px-2 py-1 bg-[#0a0a0a] hover:bg-[#1f521f]/40 text-[#ffb000] border border-[#1f521f] hover:border-[#ffb000] text-xs font-mono transition-colors"
          >
            [ JUMP_TODAY ]
          </button>

          {/* Switch to Kanban View button */}
          <button
            onClick={onSwitchToKanban}
            className="px-2.5 py-1 bg-[#0a0a0a] hover:bg-[#1f521f] text-[#33ff00] border border-[#33ff00] text-xs font-bold transition-colors"
          >
            [ &lt;&lt; KANBAN_BOARD ]
          </button>
        </div>
      </div>

      {/* 2. Expandable Filter Toolbar */}
      {showFilters && (
        <div className="bg-[#050505] border-b border-[#1f521f] px-3 py-2 flex flex-wrap items-center gap-2.5 text-xs">
          {/* Keyword search */}
          <div className="relative w-56 flex items-center">
            <span className="text-[#ffb000] mr-1">$</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="grep pattern..."
              className="w-full px-2 py-0.5 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1f521f] focus:outline-none focus:border-[#33ff00]"
            />
          </div>

          {/* Assignee filter */}
          <div className="flex items-center gap-1">
            <span className="text-[#1f521f]">USER:</span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="bg-[#0a0a0a] border border-[#1f521f] px-2 py-0.5 text-[#33ff00] focus:outline-none"
            >
              <option value="all" className="bg-[#0a0a0a] text-[#33ff00]">[ALL_USERS]</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0a0a0a] text-[#33ff00]">
                  @{u.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Column/Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-[#1f521f]">STATUS:</span>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="bg-[#0a0a0a] border border-[#1f521f] px-2 py-0.5 text-[#33ff00] focus:outline-none"
            >
              <option value="all" className="bg-[#0a0a0a] text-[#33ff00]">[ALL_PIPES]</option>
              {columns.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0a] text-[#33ff00]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Only Milestones checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[#ffb000]">
            <input
              type="checkbox"
              checked={onlyMilestones}
              onChange={(e) => setOnlyMilestones(e.target.checked)}
              className="accent-[#ffb000]"
            />
            <span>[◆ MILESTONES_ONLY]</span>
          </label>

          {/* Clear filters */}
          {(selectedAssignee !== 'all' || selectedColumn !== 'all' || onlyMilestones || searchQuery) && (
            <button
              onClick={() => {
                setSelectedAssignee('all');
                setSelectedColumn('all');
                setOnlyMilestones(false);
                setSearchQuery('');
              }}
              className="text-[#ff3333] hover:bg-[#ff3333] hover:text-[#0a0a0a] px-1.5 py-0.5 border border-[#ff3333] ml-auto"
            >
              [RESET]
            </button>
          )}
        </div>
      )}

      {/* 3. Main Split View: Left Work Packages Table + Right Timeline Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Work Packages / Subject Table */}
        <div className="w-80 lg:w-96 border-r border-[#1f521f] bg-[#0a0a0a] flex flex-col shrink-0 overflow-hidden z-10">
          {/* Table Header */}
          <div className="h-14 border-b border-[#1f521f] bg-[#050505] px-3 flex items-center justify-between text-xs font-bold text-[#33ff00] tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="text-[#ffb000]">&gt;</span>
              <span>TASK_ID / SUBJECT</span>
            </div>
            <span className="text-[10px] text-[#33ff00]/60">
              PROGRESS / USER
            </span>
          </div>

          {/* Tasks & Groups Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1f521f]/50">
            {taskGroups.length === 0 ? (
              <div className="p-8 text-center text-[#1f521f] text-xs">
                [NO_MATCHING_TASKS]
              </div>
            ) : (
              visibleItems.map((item, index) => {
                if (item.type === 'group') {
                  const isCollapsed = !!collapsedGroups[item.groupName];
                  const groupObj = taskGroups.find((g) => g.name === item.groupName);
                  return (
                    <div
                      key={`group-${item.groupName}`}
                      onClick={() => toggleGroupCollapse(item.groupName)}
                      className="h-10 px-3 bg-[#0d280d]/40 hover:bg-[#1f521f]/40 flex items-center justify-between cursor-pointer transition-colors border-y border-[#1f521f] font-bold text-xs text-[#ffb000]"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[#ffb000]">{isCollapsed ? '[+]' : '[-]'}</span>
                        <span className="truncate">{item.groupName}</span>
                      </div>
                      <span className="text-[10px] px-1 bg-[#0a0a0a] text-[#ffb000] border border-[#ffb000]/40 font-mono shrink-0">
                        {groupObj?.tasks.length || 0}
                      </span>
                    </div>
                  );
                }

                // Render task row
                const task = item.task!;
                const isHovered = hoveredTaskId === task.id;
                const assignees = users.filter((u) => task.assigneeIds.includes(u.id));

                return (
                  <div
                    key={`task-row-${task.id}`}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    onClick={() => onOpenTaskModal(task)}
                    className={`h-10 px-3 pl-6 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isHovered ? 'bg-[#1f521f]/50' : 'hover:bg-[#1f521f]/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {task.isMilestone ? (
                        <span className="text-[#ffb000] font-bold shrink-0">◆</span>
                      ) : (
                        <span className={`text-[10px] shrink-0 ${
                          task.columnId === 'col-done' ? 'text-[#33ff00]' : 'text-[#ffb000]'
                        }`}>
                          {task.columnId === 'col-done' ? '✔' : '▶'}
                        </span>
                      )}
                      <span
                        className={`truncate ${
                          task.isMilestone ? 'font-bold text-[#ffb000]' : 'text-[#33ff00]'
                        } ${task.columnId === 'col-done' ? 'opacity-60 line-through' : ''}`}
                        title={task.title}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Progress bar ASCII */}
                      <span className="font-mono text-[10px] text-[#33ff00]/80">
                        {task.computedProgress}%
                      </span>

                      {/* Assignee Tag */}
                      <div className="flex items-center">
                        {assignees.slice(0, 1).map((u) => (
                          <span
                            key={u.id}
                            title={u.fullName}
                            className="text-[10px] text-[#33ff00]/70 border border-[#1f521f] px-1 bg-[#050505]"
                          >
                            @{u.fullName.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Timeline Grid & SVG Connectors & Gantt Bars */}
        <div
          ref={timelineContainerRef}
          className="flex-1 overflow-auto relative bg-[#0a0a0a]"
          style={{ cursor: 'default' }}
        >
          {/* Canvas container with total width */}
          <div
            className="relative"
            style={{ width: `${totalDays * columnWidth}px`, minHeight: '100%' }}
          >
            {/* 1. Sticky Date Scale Headers */}
            <div className="sticky top-0 z-20 bg-[#050505] border-b border-[#1f521f]">
              {/* Top Month Header */}
              <div className="h-7 flex border-b border-[#1f521f] bg-[#050505] text-[#33ff00] text-xs font-bold">
                {monthsHeader.map((m, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${m.count * columnWidth}px` }}
                    className="px-2 flex items-center border-r border-[#1f521f] truncate text-[11px]"
                  >
                    // {m.monthName}
                  </div>
                ))}
              </div>

              {/* Bottom Day/Date Header */}
              <div className="h-7 flex bg-[#0a0a0a] text-[10px] font-mono text-[#33ff00]/70">
                {daysArray.map((day, idx) => {
                  const isToday = todayIndex === idx;
                  return (
                    <div
                      key={day.dateStr}
                      style={{ width: `${columnWidth}px` }}
                      className={`h-full flex items-center justify-center border-r border-[#1f521f]/50 text-center ${
                        day.isWeekend ? 'bg-[#1f521f]/10 text-[#1f521f]' : ''
                      } ${isToday ? 'bg-[#ff3333]/20 text-[#ff3333] font-bold border-b border-[#ff3333]' : ''}`}
                      title={day.dateStr}
                    >
                      {day.dayOfMonth}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Vertical Background Grid Columns */}
            <div className="absolute inset-0 top-14 pointer-events-none flex">
              {daysArray.map((day, idx) => {
                const isToday = todayIndex === idx;
                return (
                  <div
                    key={`bg-${day.dateStr}`}
                    style={{ width: `${columnWidth}px` }}
                    className={`h-full border-r border-[#1f521f]/20 ${
                      day.isWeekend ? 'bg-[#1f521f]/5' : ''
                    } ${isToday ? 'bg-[#ff3333]/5' : ''}`}
                  />
                );
              })}
            </div>

            {/* 3. Today Red Dashed Line */}
            {todayIndex !== null && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10 flex flex-col items-center"
                style={{ left: `${todayIndex * columnWidth + columnWidth / 2}px` }}
              >
                <div className="bg-[#ff3333] text-[#0a0a0a] text-[9px] font-bold px-1 py-0.2">
                  TODAY
                </div>
                <div className="w-[1px] h-full border-l border-dashed border-[#ff3333]" />
              </div>
            )}

            {/* 4. SVG Layer for Dependency Lines */}
            <svg
              className="absolute inset-0 top-14 pointer-events-none z-10 overflow-visible"
              style={{ width: '100%', height: `${visibleItems.length * ROW_HEIGHT}px` }}
            >
              <defs>
                <marker
                  id="gantt-arrow-default"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#33ff00" />
                </marker>
                <marker
                  id="gantt-arrow-highlight"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#ffb000" />
                </marker>
              </defs>

              {dependencyLinks.map((link, idx) => (
                <path
                  key={`dep-${link.fromId}-${link.toId}-${idx}`}
                  d={link.path}
                  fill="none"
                  stroke={link.isHighlighted ? '#ffb000' : '#33ff00'}
                  strokeWidth={link.isHighlighted ? '2' : '1.5'}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  markerEnd={link.isHighlighted ? 'url(#gantt-arrow-highlight)' : 'url(#gantt-arrow-default)'}
                  className="transition-all duration-150 opacity-90"
                />
              ))}
            </svg>

            {/* 5. Row Content Layer (Group Summary Brackets, Gantt Bars, Milestone Diamonds) */}
            <div className="relative pt-0">
              {visibleItems.map((item, index) => {
                if (item.type === 'group') {
                  const groupObj = taskGroups.find((g) => g.name === item.groupName);
                  if (!groupObj) return null;

                  const startX = dateToX(groupObj.minDate);
                  const endX = dateToX(groupObj.maxDate) + columnWidth;
                  const width = Math.max(columnWidth, endX - startX);

                  return (
                    <div
                      key={`group-bar-${item.groupName}`}
                      style={{ height: `${ROW_HEIGHT}px` }}
                      className="relative flex items-center border-b border-[#1f521f] bg-[#0d280d]/20"
                    >
                      {/* Group bracket */}
                      <div
                        className="absolute h-2 border-t border-l border-r border-[#ffb000]"
                        style={{
                          left: `${startX}px`,
                          width: `${width}px`,
                          top: '18px',
                        }}
                      />
                      <span
                        className="absolute text-[10px] font-bold text-[#ffb000] truncate select-none font-mono"
                        style={{
                          left: `${startX + 4}px`,
                          top: '2px',
                        }}
                      >
                        [ {groupObj.name} ]
                      </span>
                    </div>
                  );
                }

                // Render Task Gantt Bar
                const task = item.task!;
                const isHovered = hoveredTaskId === task.id;
                const startX = dateToX(task.computedStart);
                const endX = dateToX(task.computedEnd) + columnWidth;
                const barWidth = Math.max(columnWidth * 0.8, endX - startX);

                const formatDateDisplay = (d: Date) => {
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                };

                return (
                  <div
                    key={`bar-row-${task.id}`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    onClick={() => onOpenTaskModal(task)}
                    className={`relative flex items-center border-b border-[#1f521f]/40 cursor-pointer transition-colors ${
                      isHovered ? 'bg-[#1f521f]/30' : ''
                    }`}
                  >
                    {task.isMilestone ? (
                      /* Milestone: Amber Diamond Node (◆) */
                      <div
                        className="absolute flex items-center gap-1.5 group z-10"
                        style={{
                          left: `${startX + columnWidth / 2 - 8}px`,
                          top: '14px',
                        }}
                      >
                        <div
                          className={`w-4 h-4 rotate-45 transition-transform duration-150 border border-black ${
                            isHovered ? 'scale-125' : ''
                          }`}
                          style={{ backgroundColor: '#ffb000' }}
                        />

                        <div className="flex items-center gap-1 pl-1 text-xs whitespace-nowrap">
                          <span className="font-bold text-[#ffb000]">
                            {task.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#ffb000] border border-[#ffb000] px-1">
                            {formatDateDisplay(task.computedEnd)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Regular Terminal Gantt Bar */
                      <div
                        className="absolute flex items-center group z-10"
                        style={{
                          left: `${startX}px`,
                          top: '8px',
                          width: `${barWidth}px`,
                        }}
                      >
                        {/* The Gantt Bar */}
                        <div
                          className={`h-6 w-full relative overflow-hidden transition-all duration-150 flex items-center border ${
                            task.columnId === 'col-done'
                              ? 'bg-[#0a0a0a] border-[#33ff00]/50'
                              : task.priority === 'urgent'
                              ? 'bg-[#ff3333]/20 border-[#ff3333]'
                              : task.priority === 'high'
                              ? 'bg-[#ffb000]/20 border-[#ffb000]'
                              : 'bg-[#1f521f]/40 border-[#33ff00]'
                          } ${isHovered ? 'border-white brightness-125' : ''}`}
                        >
                          {/* Inner Progress fill */}
                          <div
                            className={`h-full transition-all duration-300 ${
                              task.columnId === 'col-done'
                                ? 'bg-[#33ff00]/40'
                                : 'bg-[#33ff00]/30'
                            }`}
                            style={{ width: `${task.computedProgress}%` }}
                          />

                          {/* Inner text inside bar */}
                          {barWidth > 80 && (
                            <span className="absolute inset-0 px-1.5 flex items-center justify-between text-[10px] font-bold text-[#33ff00] truncate pointer-events-none font-mono">
                              <span className="truncate">{task.title}</span>
                              <span className="text-[9px] shrink-0 opacity-80">
                                {task.computedProgress}%
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Label outside bar */}
                        <div className="ml-2 flex items-center gap-1.5 whitespace-nowrap pointer-events-none">
                          <span className="text-xs text-[#33ff00]/90 font-mono">
                            {task.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#33ff00]/60 border border-[#1f521f] px-1">
                            {formatDateDisplay(task.computedStart)}-{formatDateDisplay(task.computedEnd)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Terminal Legend Bar */}
      <div className="border-t border-[#1f521f] px-3 py-1.5 bg-[#050505] flex flex-wrap items-center justify-between text-xs text-[#33ff00]/70 shrink-0 font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-[#ffb000]">LEGEND:</span>
          <div className="flex items-center gap-1">
            <span className="text-[#33ff00]">[|||]</span>
            <span>ACTIVE_TASK</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#33ff00]/50">[✔]</span>
            <span>DONE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#ffb000]">◆</span>
            <span className="text-[#ffb000]">MILESTONE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#33ff00]">--&gt;</span>
            <span>DEPENDENCY (FS)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#ff3333]">|:</span>
            <span className="text-[#ff3333]">TODAY_MARKER</span>
          </div>
        </div>

        <div className="text-[10px] text-[#1f521f]">
          $ CLICK_BAR_TO_EDIT // AUTOMATIC_FS_RESCHEDULING_ACTIVE
        </div>
      </div>
    </div>
  );
};
