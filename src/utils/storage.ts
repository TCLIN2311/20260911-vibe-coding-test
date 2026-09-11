import {
  Project,
  ProjectMember,
  KanbanColumn,
  Task,
  RFI,
  Attachment,
  AuditLog,
  Comment,
  User,
  UserRole
} from '../types/pms';
import {
  INITIAL_PROJECTS,
  INITIAL_PROJECT_MEMBERS,
  INITIAL_COLUMNS,
  INITIAL_TASKS,
  INITIAL_RFIS,
  INITIAL_ATTACHMENTS,
  INITIAL_COMMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
} from '../data/initialData';

const STORAGE_KEY_PREFIX = 'pms_app_v1_';

export interface AppState {
  currentProjectId: string;
  currentUserId: string;
  users: User[];
  projects: Project[];
  projectMembers: ProjectMember[];
  columns: KanbanColumn[];
  tasks: Task[];
  rfis: RFI[];
  attachments: Attachment[];
  comments: Comment[];
  auditLogs: AuditLog[];
}

export function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + 'state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.projects && parsed.tasks && parsed.rfis) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse state from localStorage', e);
  }

  return {
    currentProjectId: 'prj-tp2-green',
    currentUserId: 'usr-pm-02', // Default as PM
    users: INITIAL_USERS,
    projects: INITIAL_PROJECTS,
    projectMembers: INITIAL_PROJECT_MEMBERS,
    columns: INITIAL_COLUMNS,
    tasks: INITIAL_TASKS,
    rfis: INITIAL_RFIS,
    attachments: INITIAL_ATTACHMENTS,
    comments: INITIAL_COMMENTS,
    auditLogs: INITIAL_AUDIT_LOGS,
  };
}

export function saveStateToStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

export function resetStateToDefault(): AppState {
  localStorage.removeItem(STORAGE_KEY_PREFIX + 'state');
  return {
    currentProjectId: 'prj-tp2-green',
    currentUserId: 'usr-pm-02',
    users: INITIAL_USERS,
    projects: INITIAL_PROJECTS,
    projectMembers: INITIAL_PROJECT_MEMBERS,
    columns: INITIAL_COLUMNS,
    tasks: INITIAL_TASKS,
    rfis: INITIAL_RFIS,
    attachments: INITIAL_ATTACHMENTS,
    comments: INITIAL_COMMENTS,
    auditLogs: INITIAL_AUDIT_LOGS,
  };
}

export function generateNextRfiNumber(existingRfis: RFI[], projectCode = 'PRJ'): string {
  const currentYear = new Date().getFullYear();
  const prefix = `${projectCode}-RFI-${currentYear}-`;
  
  let maxSeq = 0;
  for (const rfi of existingRfis) {
    if (rfi.rfiNumber && rfi.rfiNumber.includes(`RFI-${currentYear}-`)) {
      const parts = rfi.rfiNumber.split('-');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

export function getUserRoleInProject(members: ProjectMember[], users: User[], projectId: string, userId: string): UserRole {
  const user = users.find(u => u.id === userId);
  if (user?.systemRole === 'admin') return 'admin';
  const member = members.find(m => m.projectId === projectId && m.userId === userId);
  return member?.projectRole || 'viewer';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
