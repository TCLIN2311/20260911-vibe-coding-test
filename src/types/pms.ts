export type UserRole = 'admin' | 'pm' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  systemRole: UserRole;
  department: string;
}

export type ProjectStatus = 'active' | 'archived' | 'planning';

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  createdAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  projectRole: UserRole;
  joinedAt: string;
}

export interface KanbanColumn {
  id: string;
  projectId: string;
  name: string;
  position: number;
  wipLimit: number; // 0 means no limit
  color?: string;
  createdAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  position: number;
  startDate?: string | null;
  dueDate: string | null;
  progress?: number; // 0 to 100%
  dependencies?: string[]; // IDs of tasks that must finish before this task starts
  isMilestone?: boolean; // Whether this is a project milestone (renders as diamond)
  category?: string; // Work package group (e.g. "Phase 1: Foundation", "Phase 2: MEP")
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assigneeIds: string[];
  tags: string[];
  checklist: ChecklistItem[];
  linkedRfiIds?: string[];
}

export type RFIStatus = 'draft' | 'open' | 'under_review' | 'answered' | 'closed' | 'rejected';

export interface RFI {
  id: string;
  projectId: string;
  rfiNumber: string; // e.g. PRJ-RFI-2026-001
  title: string;
  questionText: string;
  locationSpecRef: string; // Drawing No, Floor, Spec clause, etc.
  suggestedSolution?: string;
  status: RFIStatus;
  costImpact: boolean;
  costImpactAmount?: string;
  scheduleImpact: boolean;
  scheduleImpactDays: number;
  requesterId: string;
  assignedToId: string;
  officialResponse?: string;
  answeredBy?: string;
  answeredAt?: string;
  dueDate: string;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  linkedTaskIds?: string[];
  priority: TaskPriority;
}

export type AttachmentTargetType = 'TASK' | 'RFI' | 'COMMENT';

export interface Attachment {
  id: string;
  targetType: AttachmentTargetType;
  targetId: string;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  storageKey: string;
  publicUrl: string;
  uploadedBy: string;
  createdAt: string;
  isImage?: boolean;
}

export interface Comment {
  id: string;
  targetType: 'TASK' | 'RFI';
  targetId: string;
  userId: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface AuditLog {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  targetType: 'TASK' | 'RFI' | 'COLUMN' | 'PROJECT' | 'ATTACHMENT' | 'MEMBER';
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
}
