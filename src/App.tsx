import React, { useState, useEffect } from 'react';
import {
  loadInitialState,
  saveStateToStorage,
  resetStateToDefault,
  getUserRoleInProject,
  AppState
} from './utils/storage';
import {
  Project,
  User,
  KanbanColumn,
  Task,
  RFI,
  Attachment,
  Comment,
  AuditLog,
  UserRole
} from './types/pms';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { GanttChart } from './components/GanttChart';
import { RFIModule } from './components/RFIModule';
import { TaskModal } from './components/TaskModal';
import { AuditTrailModal } from './components/AuditTrailModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { DatabaseApiViewer } from './components/DatabaseApiViewer';

export default function App() {
  const [appState, setAppState] = useState<AppState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<'kanban' | 'gantt' | 'rfi' | 'audit' | 'spec'>('kanban');

  // Modals state
  const [taskModalTask, setTaskModalTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalDefaultColId, setTaskModalDefaultColId] = useState<string | undefined>(undefined);

  const [activeRfiIdForModal, setActiveRfiIdForModal] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Sync state with localStorage
  useEffect(() => {
    saveStateToStorage(appState);
  }, [appState]);

  // Current entity getters
  const currentProject =
    appState.projects.find((p) => p.id === appState.currentProjectId) || appState.projects[0];
  const currentUser =
    appState.users.find((u) => u.id === appState.currentUserId) || appState.users[0];
  const currentRole = getUserRoleInProject(
    appState.projectMembers,
    appState.users,
    currentProject.id,
    currentUser.id
  );

  // Scoped project data
  const projectTasks = appState.tasks.filter((t) => t.projectId === currentProject.id);
  const projectColumns = appState.columns.filter((c) => c.projectId === currentProject.id);
  const projectRfis = appState.rfis.filter((r) => r.projectId === currentProject.id);
  const projectAuditLogs = appState.auditLogs.filter((a) => a.projectId === currentProject.id);

  // Helper to append audit log
  const logAction = (
    action: string,
    targetType: 'TASK' | 'RFI' | 'COLUMN' | 'PROJECT' | 'ATTACHMENT' | 'MEMBER',
    targetId: string,
    targetName: string,
    details: string
  ) => {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      projectId: currentProject.id,
      userId: currentUser.id,
      action,
      targetType,
      targetId,
      targetName,
      details,
      timestamp: new Date().toISOString(),
    };

    setAppState((prev) => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs],
    }));
  };

  // 1. Move Task (Kanban drag & drop)
  const handleMoveTask = (taskId: string, targetColumnId: string, targetPosition: number) => {
    const task = appState.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const sourceCol = appState.columns.find((c) => c.id === task.columnId);
    const targetCol = appState.columns.find((c) => c.id === targetColumnId);

    const updatedTasks = appState.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          columnId: targetColumnId,
          position: targetPosition,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setAppState((prev) => ({
      ...prev,
      tasks: updatedTasks,
    }));

    if (sourceCol?.id !== targetCol?.id) {
      logAction(
        '移動工作卡片',
        'TASK',
        taskId,
        task.title,
        `將卡片由「${sourceCol?.name || '未知'}」移動至「${targetCol?.name || '未知'}」`
      );
    }
  };

  // 2. Save / Create Task
  const handleSaveTask = (savedTask: Task) => {
    const existingIndex = appState.tasks.findIndex((t) => t.id === savedTask.id);
    const isNew = existingIndex === -1;

    let updatedTasks: Task[];
    if (isNew) {
      updatedTasks = [savedTask, ...appState.tasks];
      logAction(
        '建立工作卡片',
        'TASK',
        savedTask.id,
        savedTask.title,
        `建立新卡片並設定優先級為 ${savedTask.priority}`
      );
    } else {
      updatedTasks = appState.tasks.map((t) => (t.id === savedTask.id ? savedTask : t));
      logAction(
        '更新工作卡片',
        'TASK',
        savedTask.id,
        savedTask.title,
        `更新卡片內容、指派成員或關聯 RFI (${savedTask.linkedRfiIds?.length || 0} 個)`
      );
    }

    setAppState((prev) => ({
      ...prev,
      tasks: updatedTasks,
    }));
  };

  // 3. Delete Task
  const handleDeleteTask = (taskId: string) => {
    const task = appState.tasks.find((t) => t.id === taskId);
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
    if (task) {
      logAction('刪除工作卡片', 'TASK', taskId, task.title, '卡片已永久自專案看板移除');
    }
  };

  // 4. Save / Create / Respond RFI
  const handleSaveRfi = (savedRfi: RFI) => {
    const existing = appState.rfis.find((r) => r.id === savedRfi.id);
    const isNew = !existing;

    let updatedRfis: RFI[];
    if (isNew) {
      updatedRfis = [savedRfi, ...appState.rfis];
      logAction(
        '發布工程 RFI',
        'RFI',
        savedRfi.id,
        savedRfi.rfiNumber,
        `發起提問：${savedRfi.title} (位置：${savedRfi.locationSpecRef || '未註明'})`
      );
    } else {
      updatedRfis = appState.rfis.map((r) => (r.id === savedRfi.id ? savedRfi : r));
      const statusChanged = existing.status !== savedRfi.status;
      const responseAdded = !existing.officialResponse && !!savedRfi.officialResponse;

      if (responseAdded) {
        logAction(
          '正式答覆 RFI',
          'RFI',
          savedRfi.id,
          savedRfi.rfiNumber,
          `主管/受派人已完成官方答覆簽署，狀態變更為 ${savedRfi.status}`
        );
      } else if (statusChanged) {
        logAction(
          '變更 RFI 狀態',
          'RFI',
          savedRfi.id,
          savedRfi.rfiNumber,
          `狀態由 ${existing.status} 變更為 ${savedRfi.status}`
        );
      } else {
        logAction(
          '編輯 RFI 內容',
          'RFI',
          savedRfi.id,
          savedRfi.rfiNumber,
          `更新疑義說明與影響評估 (成本: ${savedRfi.costImpact ? '是' : '否'}, 工期: ${savedRfi.scheduleImpactDays}天)`
        );
      }
    }

    setAppState((prev) => ({
      ...prev,
      rfis: updatedRfis,
    }));
  };

  // 5. Delete RFI
  const handleDeleteRfi = (rfiId: string) => {
    const rfi = appState.rfis.find((r) => r.id === rfiId);
    setAppState((prev) => ({
      ...prev,
      rfis: prev.rfis.filter((r) => r.id !== rfiId),
    }));
    if (rfi) {
      logAction('刪除 RFI 提問', 'RFI', rfiId, rfi.rfiNumber, `已刪除 RFI：${rfi.title}`);
    }
  };

  // 6. Attachment management
  const handleAddAttachment = (attachment: Attachment) => {
    setAppState((prev) => ({
      ...prev,
      attachments: [attachment, ...prev.attachments],
    }));

    logAction(
      '上傳附件/貼圖',
      'ATTACHMENT',
      attachment.id,
      attachment.fileName,
      `上傳至 ${attachment.targetType} (#${attachment.targetId})，大小：${(attachment.fileSize / 1024).toFixed(1)} KB`
    );
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setAppState((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== attachmentId),
    }));
  };

  // 7. Comment management
  const handleAddComment = (comment: Comment) => {
    setAppState((prev) => ({
      ...prev,
      comments: [...prev.comments, comment],
    }));
  };

  // 8. Column management (PM / Admin)
  const handleAddColumn = (name: string, wipLimit: number) => {
    const newCol: KanbanColumn = {
      id: 'col-' + Math.random().toString(36).substring(2, 8),
      projectId: currentProject.id,
      name,
      position: projectColumns.length,
      wipLimit,
      createdAt: new Date().toISOString(),
    };

    setAppState((prev) => ({
      ...prev,
      columns: [...prev.columns, newCol],
    }));

    logAction('新增看板欄位', 'COLUMN', newCol.id, newCol.name, `WIP 上限設定為: ${wipLimit || '無限制'}`);
  };

  const handleUpdateColumn = (col: KanbanColumn) => {
    setAppState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.id === col.id ? col : c)),
    }));

    logAction('調整看板欄位', 'COLUMN', col.id, col.name, `更新欄位名稱與 WIP 上限 (${col.wipLimit || '無'})`);
  };

  const handleDeleteColumn = (columnId: string) => {
    const col = appState.columns.find((c) => c.id === columnId);
    setAppState((prev) => ({
      ...prev,
      columns: prev.columns.filter((c) => c.id !== columnId),
    }));

    if (col) {
      logAction('刪除看板欄位', 'COLUMN', columnId, col.name, '已移除看板欄位');
    }
  };

  // 9. Project & User Switchers
  const handleSelectProject = (projectId: string) => {
    setAppState((prev) => ({
      ...prev,
      currentProjectId: projectId,
    }));
  };

  const handleSelectUser = (userId: string) => {
    setAppState((prev) => ({
      ...prev,
      currentUserId: userId,
    }));
  };

  const handleCreateProject = (name: string, code: string, description: string) => {
    const newProj: Project = {
      id: 'prj-' + Math.random().toString(36).substring(2, 8),
      name,
      code,
      description,
      status: 'active',
      ownerId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    // Auto seed standard columns for new project
    const defaultCols: KanbanColumn[] = [
      { id: 'col-' + Math.random().toString(36).substring(2, 7), projectId: newProj.id, name: '待處理 (To Do)', position: 0, wipLimit: 0, createdAt: new Date().toISOString() },
      { id: 'col-' + Math.random().toString(36).substring(2, 7), projectId: newProj.id, name: '進行中 (In Progress)', position: 1, wipLimit: 4, createdAt: new Date().toISOString() },
      { id: 'col-' + Math.random().toString(36).substring(2, 7), projectId: newProj.id, name: '送審中 (Review)', position: 2, wipLimit: 2, createdAt: new Date().toISOString() },
      { id: 'col-' + Math.random().toString(36).substring(2, 7), projectId: newProj.id, name: '已完成 (Done)', position: 3, wipLimit: 0, createdAt: new Date().toISOString() },
    ];

    setAppState((prev) => ({
      ...prev,
      projects: [newProj, ...prev.projects],
      columns: [...prev.columns, ...defaultCols],
      currentProjectId: newProj.id,
    }));

    logAction('建立新專案', 'PROJECT', newProj.id, newProj.name, `專案代碼：${newProj.code}`);
  };

  const handleUpdateMemberRole = (userId: string, newRole: UserRole) => {
    setAppState((prev) => {
      const exists = prev.projectMembers.some(
        (m) => m.projectId === currentProject.id && m.userId === userId
      );

      let updatedMembers;
      if (exists) {
        updatedMembers = prev.projectMembers.map((m) =>
          m.projectId === currentProject.id && m.userId === userId
            ? { ...m, projectRole: newRole }
            : m
        );
      } else {
        updatedMembers = [
          ...prev.projectMembers,
          {
            projectId: currentProject.id,
            userId,
            projectRole: newRole,
            joinedAt: new Date().toISOString(),
          },
        ];
      }

      return { ...prev, projectMembers: updatedMembers };
    });
  };

  const handleResetData = () => {
    const fresh = resetStateToDefault();
    setAppState(fresh);
  };

  // Open Task Modal handler
  const handleOpenTaskModal = (task: Task | null, columnId?: string) => {
    setTaskModalTask(task);
    setTaskModalDefaultColId(columnId);
    setIsTaskModalOpen(true);
  };

  // Permissions check
  const canEditTask = currentRole !== 'viewer';
  const canManageColumns = currentRole === 'admin' || currentRole === 'pm';
  const canCreateRfi = currentRole !== 'viewer';
  const canRespondRfi = currentRole === 'admin' || currentRole === 'pm' || currentRole === 'member';
  const canCloseRfi = currentRole === 'admin' || currentRole === 'pm';

  const openRfiCount = projectRfis.filter((r) => r.status === 'open' || r.status === 'under_review').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0a] text-[#33ff00] font-mono overflow-hidden">
      {/* CRT Scanline Overlay */}
      <div className="scanline-overlay" />

      {/* Top Navigation Bar (Terminal Shell Style) */}
      <Navbar
        currentProject={currentProject}
        allProjects={appState.projects}
        currentUser={currentUser}
        currentRole={currentRole}
        allUsers={appState.users}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onProjectChange={handleSelectProject}
        onUserChange={handleSelectUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        taskCount={projectTasks.length}
        openRfiCount={openRfiCount}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0a0a0a]">
        {activeTab === 'kanban' && (
          <KanbanBoard
            columns={projectColumns}
            tasks={projectTasks}
            users={appState.users}
            rfis={projectRfis}
            attachments={appState.attachments}
            comments={appState.comments}
            currentUser={currentUser}
            canEdit={canEditTask}
            canManageColumns={canManageColumns}
            onMoveTask={handleMoveTask}
            onOpenTaskModal={handleOpenTaskModal}
            onAddColumn={handleAddColumn}
            onUpdateColumn={handleUpdateColumn}
            onDeleteColumn={handleDeleteColumn}
            onSwitchToGantt={() => setActiveTab('gantt')}
          />
        )}

        {activeTab === 'gantt' && (
          <GanttChart
            tasks={projectTasks}
            columns={projectColumns}
            users={appState.users}
            currentProject={currentProject}
            canEdit={canEditTask}
            onOpenTaskModal={handleOpenTaskModal}
            onUpdateTask={handleSaveTask}
            onSwitchToKanban={() => setActiveTab('kanban')}
          />
        )}

        {activeTab === 'rfi' && (
          <RFIModule
            rfis={projectRfis}
            tasks={projectTasks}
            users={appState.users}
            attachments={appState.attachments}
            comments={appState.comments}
            currentUser={currentUser}
            canCreateRfi={canCreateRfi}
            canRespondRfi={canRespondRfi}
            canCloseRfi={canCloseRfi}
            activeRfiId={activeRfiIdForModal}
            onCloseActiveRfi={() => setActiveRfiIdForModal(null)}
            onSaveRfi={handleSaveRfi}
            onDeleteRfi={handleDeleteRfi}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onAddComment={handleAddComment}
            onOpenTaskModal={(task) => handleOpenTaskModal(task)}
          />
        )}

        {activeTab === 'audit' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <AuditTrailModal
              isOpen={true}
              onClose={() => setActiveTab('kanban')}
              auditLogs={projectAuditLogs}
              users={appState.users}
            />
          </div>
        )}

        {activeTab === 'spec' && <DatabaseApiViewer appState={appState} />}
      </main>

      {/* Task Modal (Create / Edit Task) */}
      <TaskModal
        task={taskModalTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskModalTask(null);
        }}
        columns={projectColumns}
        initialColumnId={taskModalDefaultColId}
        projectId={currentProject.id}
        users={appState.users}
        rfis={projectRfis}
        attachments={appState.attachments}
        comments={appState.comments}
        currentUser={currentUser}
        canEdit={canEditTask}
        allTasks={projectTasks}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        onAddAttachment={handleAddAttachment}
        onDeleteAttachment={handleDeleteAttachment}
        onAddComment={handleAddComment}
        onOpenRfiModal={(rfiId) => {
          setIsTaskModalOpen(false);
          setActiveTab('rfi');
          setActiveRfiIdForModal(rfiId);
        }}
      />

      {/* Audit Trail Modal (Standalone Trigger) */}
      {isAuditOpen && activeTab !== 'audit' && (
        <AuditTrailModal
          isOpen={isAuditOpen}
          onClose={() => setIsAuditOpen(false)}
          auditLogs={projectAuditLogs}
          users={appState.users}
        />
      )}

      {/* Project Settings Modal */}
      {isSettingsOpen && (
        <ProjectSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          project={currentProject}
          allProjects={appState.projects}
          members={appState.projectMembers}
          users={appState.users}
          currentUser={currentUser}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onUpdateMemberRole={handleUpdateMemberRole}
          onResetData={handleResetData}
        />
      )}

      {/* Bottom Terminal Status Bar (tmux style) */}
      <footer className="h-6 bg-[#050505] border-t border-[#1f521f] text-[11px] px-3 flex items-center justify-between text-[#1f521f] shrink-0 font-mono select-none">
        <div className="flex items-center gap-3">
          <span className="bg-[#1f521f] text-[#33ff00] px-1 font-bold">PMS-CLI v2.4</span>
          <span className="text-[#33ff00]">sys@eng:~/{activeTab}$</span>
          <span className="hidden sm:inline text-[#1f521f]">|</span>
          <span className="hidden sm:inline text-[#ffb000]">[SESSION: ESTABLISHED]</span>
          <span className="hidden md:inline text-[#1f521f]">|</span>
          <span className="hidden md:inline text-[#33ff00]/70">NODE: {currentProject.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#33ff00] flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#33ff00] inline-block animate-cursor" />
            ONLINE [200 OK]
          </span>
          <span className="text-[#1f521f]">|</span>
          <span className="text-[#33ff00]/60">UTF-8</span>
          <span className="text-[#1f521f]">|</span>
          <span className="text-[#ffb000]">PORT: 3000</span>
        </div>
      </footer>
    </div>
  );
}
