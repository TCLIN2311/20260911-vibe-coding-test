import React from 'react';
import {
  FolderKanban,
  Calendar,
  HelpCircle,
  ShieldAlert,
  Server,
  Settings,
  Building,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles,
  User,
  Info
} from 'lucide-react';
import { Project, User as UserModel, UserRole } from '../types/pms';

interface NavbarProps {
  currentProject: Project;
  allProjects: Project[];
  currentUser: UserModel;
  currentRole: UserRole;
  allUsers: UserModel[];
  activeTab: 'kanban' | 'gantt' | 'rfi' | 'audit' | 'spec';
  onTabChange: (tab: 'kanban' | 'gantt' | 'rfi' | 'audit' | 'spec') => void;
  onProjectChange: (projectId: string) => void;
  onUserChange: (userId: string) => void;
  onOpenSettings: () => void;
  onOpenAudit: () => void;
  taskCount: number;
  openRfiCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  allProjects,
  currentUser,
  currentRole,
  allUsers,
  activeTab,
  onTabChange,
  onProjectChange,
  onUserChange,
  onOpenSettings,
  onOpenAudit,
  taskCount,
  openRfiCount,
}) => {
  const roleDisplay: Record<UserRole, { label: string; badge: string }> = {
    admin: { label: 'ADMIN', badge: 'border-[#ff3333] text-[#ff3333] bg-[#ff3333]/10' },
    pm: { label: 'PM_LEAD', badge: 'border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10' },
    member: { label: 'ENGINEER', badge: 'border-[#33ff00] text-[#33ff00] bg-[#33ff00]/10' },
    viewer: { label: 'READONLY', badge: 'border-[#1f521f] text-[#33ff00]/60 bg-transparent' },
  };

  return (
    <header className="bg-[#050505] text-[#33ff00] border-b border-[#1f521f] shrink-0 select-none font-mono">
      {/* Top Mainframe Header Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#1f521f]/60">
        {/* Mainframe Prompt & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#33ff00] font-bold text-base tracking-widest terminal-glow flex items-center gap-1.5">
              <span className="text-[#ffb000]">&gt;</span> PMS_MAINFRAME
              <span className="text-[10px] px-1.5 py-0.5 border border-[#1f521f] text-[#33ff00]/80 bg-[#0a0a0a]">
                CLI_v2.4
              </span>
              <span className="w-2 h-4 bg-[#33ff00] inline-block animate-cursor" />
            </span>
          </div>

          <span className="h-4 w-px bg-[#1f521f] mx-1 hidden sm:block" />

          {/* Project Node Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#33ff00]">
            <span className="text-[#1f521f] font-bold">&gt;&gt; NODE:</span>
            <select
              value={currentProject.id}
              onChange={(e) => onProjectChange(e.target.value)}
              className="text-xs bg-[#0a0a0a] text-[#33ff00] border border-[#1f521f] px-2 py-1 font-mono focus:outline-none focus:border-[#33ff00] cursor-pointer hover:border-[#33ff00]/60 max-w-[200px] sm:max-w-xs truncate"
            >
              {allProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0a0a0a] text-[#33ff00]">
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: User Session & Settings */}
        <div className="flex items-center gap-2">
          {/* User Persona Switcher */}
          <div className="flex items-center bg-[#0a0a0a] border border-[#1f521f] px-2 py-1 gap-2 text-xs">
            <span className="text-[#1f521f] font-bold hidden md:inline">
              USER@SESSION:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#ffb000] font-bold">#</span>
              <select
                value={currentUser.id}
                onChange={(e) => onUserChange(e.target.value)}
                className="text-xs bg-transparent text-[#33ff00] font-mono focus:outline-none cursor-pointer"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#0a0a0a] text-[#33ff00]">
                    {u.fullName} [{roleDisplay[u.systemRole]?.label}]
                  </option>
                ))}
              </select>
            </div>
            <span
              className={`text-[10px] px-1 py-0.2 font-mono font-bold border ${roleDisplay[currentRole]?.badge}`}
            >
              [{roleDisplay[currentRole]?.label}]
            </span>
          </div>

          {/* Settings Command Button */}
          <button
            onClick={onOpenSettings}
            title="SYSTEM CONFIGURATION (--settings)"
            className="px-2.5 py-1 text-xs border border-[#1f521f] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors font-mono font-bold flex items-center gap-1"
          >
            <span>[ SYS_CFG ]</span>
          </button>
        </div>
      </div>

      {/* Navigation Command Tabs (tmux / shell window style) */}
      <div className="px-2 flex items-center bg-[#0a0a0a] overflow-x-auto text-xs border-b border-[#1f521f]">
        <button
          onClick={() => onTabChange('kanban')}
          className={`px-3 py-1.5 font-mono border-r border-[#1f521f] transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'kanban'
              ? 'bg-[#33ff00] text-[#0a0a0a] font-bold'
              : 'text-[#33ff00]/70 hover:text-[#33ff00] hover:bg-[#1f521f]/20'
          }`}
        >
          <span>[1: KANBAN_FLOW]</span>
          <span className={`text-[10px] px-1 font-mono ${activeTab === 'kanban' ? 'bg-[#0a0a0a] text-[#33ff00]' : 'border border-[#1f521f] text-[#33ff00]/80'}`}>
            {taskCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange('gantt')}
          className={`px-3 py-1.5 font-mono border-r border-[#1f521f] transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'gantt'
              ? 'bg-[#33ff00] text-[#0a0a0a] font-bold'
              : 'text-[#33ff00]/70 hover:text-[#33ff00] hover:bg-[#1f521f]/20'
          }`}
        >
          <span>[2: GANTT_TIMELINE]</span>
          <span className={`text-[9px] px-1 font-mono uppercase ${activeTab === 'gantt' ? 'bg-[#0a0a0a] text-[#ffb000]' : 'border border-[#ffb000]/60 text-[#ffb000]'}`}>
            READY
          </span>
        </button>

        <button
          onClick={() => onTabChange('rfi')}
          className={`px-3 py-1.5 font-mono border-r border-[#1f521f] transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rfi'
              ? 'bg-[#33ff00] text-[#0a0a0a] font-bold'
              : 'text-[#33ff00]/70 hover:text-[#33ff00] hover:bg-[#1f521f]/20'
          }`}
        >
          <span>[3: RFI_DISCREPANCY]</span>
          {openRfiCount > 0 ? (
            <span className={`text-[10px] px-1 font-mono font-bold ${activeTab === 'rfi' ? 'bg-[#0a0a0a] text-[#ff3333]' : 'border border-[#ffb000] text-[#ffb000]'}`}>
              !{openRfiCount} PENDING
            </span>
          ) : (
            <span className={`text-[9px] px-1 ${activeTab === 'rfi' ? 'bg-[#0a0a0a] text-[#33ff00]' : 'text-[#1f521f]'}`}>
              [0]
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('audit')}
          className={`px-3 py-1.5 font-mono border-r border-[#1f521f] transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-[#33ff00] text-[#0a0a0a] font-bold'
              : 'text-[#33ff00]/70 hover:text-[#33ff00] hover:bg-[#1f521f]/20'
          }`}
        >
          <span>[4: AUDIT_LOGS]</span>
        </button>

        <button
          onClick={() => onTabChange('spec')}
          className={`px-3 py-1.5 font-mono border-r border-[#1f521f] transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'spec'
              ? 'bg-[#33ff00] text-[#0a0a0a] font-bold'
              : 'text-[#33ff00]/70 hover:text-[#33ff00] hover:bg-[#1f521f]/20'
          }`}
        >
          <span>[5: DB_SCHEMA_API]</span>
        </button>
      </div>
    </header>
  );
};
