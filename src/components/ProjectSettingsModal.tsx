import React, { useState } from 'react';
import {
  Settings,
  Users,
  ShieldCheck,
  RotateCcw,
  Plus,
  FolderPlus,
  Building,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { Project, ProjectMember, User, UserRole } from '../types/pms';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  allProjects: Project[];
  members: ProjectMember[];
  users: User[];
  currentUser: User;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, code: string, description: string) => void;
  onUpdateMemberRole: (userId: string, newRole: UserRole) => void;
  onResetData: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  allProjects,
  members,
  users,
  currentUser,
  onSelectProject,
  onCreateProject,
  onUpdateMemberRole,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'rbac' | 'projects'>('members');
  const [showNewProjForm, setShowNewProjForm] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  if (!isOpen) return null;

  const projectMembers = members.filter((m) => m.projectId === project.id);

  const rbacMatrix = [
    { module: '專案管理與全域系統設定', admin: true, pm: false, member: false, viewer: false },
    { module: '看板欄位自訂與 WIP 上限設置', admin: true, pm: true, member: false, viewer: false },
    { module: '工作卡片建立、移動與指派他人', admin: true, pm: true, member: true, viewer: false },
    { module: '提出工程 RFI 資訊請求', admin: true, pm: true, member: true, viewer: false },
    { module: '填寫 RFI 正式官方回覆', admin: true, pm: true, member: '僅受派者', viewer: false },
    { module: 'RFI 結案簽核與駁回', admin: true, pm: true, member: false, viewer: false },
    { module: '附件上傳與剪貼簿貼圖', admin: true, pm: true, member: true, viewer: false },
    { module: '留言討論與進度檢視', admin: true, pm: true, member: true, viewer: true },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">專案設定與權限矩陣 (RBAC)</h3>
              <p className="text-xs text-slate-500">
                管理【{project.name}】工程團隊成員、職責角色與權限分配
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2 border-b border-slate-200 flex items-center gap-2 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" /> 專案成員與指派 ({projectMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'rbac'
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 權限矩陣 (RBAC Matrix)
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" /> 專案切換與新增 ({allProjects.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 1. Members Management */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">專案授權成員名冊</h4>
                  <p className="text-xs text-slate-500">
                    可在此調整成員在本專案的職位角色，即時反映在權限與操作範圍
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {users.map((user) => {
                  const memberRecord = projectMembers.find((m) => m.userId === user.id);
                  const isMember = !!memberRecord;
                  const role = memberRecord?.projectRole || user.systemRole;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{user.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{user.department}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={role}
                          onChange={(e) => onUpdateMemberRole(user.id, e.target.value as UserRole)}
                          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
                        >
                          <option value="admin">系統管理員 (Admin)</option>
                          <option value="pm">專案經理 (PM)</option>
                          <option value="member">執行成員 (Member)</option>
                          <option value="viewer">檢視者 (Viewer)</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. RBAC Matrix */}
          {activeTab === 'rbac' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">角色基礎存取控制矩陣 (RBAC Matrix)</h4>
                <p className="text-xs text-slate-500">
                  依據 SRS 第 3.1 節規範，系統嚴格區分四大層級角色之功能權責
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">功能模組 / 操作權限</th>
                      <th className="py-2.5 px-3 text-center">系統管理員 (Admin)</th>
                      <th className="py-2.5 px-3 text-center">專案經理 (PM)</th>
                      <th className="py-2.5 px-3 text-center">執行成員 (Member)</th>
                      <th className="py-2.5 px-3 text-center">檢視者 (Viewer)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rbacMatrix.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-medium text-slate-800">{item.module}</td>
                        <td className="py-2.5 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.pm ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.member === true ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : item.member === '僅受派者' ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                              受派者可
                            </span>
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.viewer ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Projects List & Switcher */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">系統專案總覽</h4>
                  <p className="text-xs text-slate-500">點擊即可切換至不同專案進行管理與 RFI 追蹤</p>
                </div>

                <button
                  onClick={() => setShowNewProjForm(!showNewProjForm)}
                  className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> 建立新專案
                </button>
              </div>

              {showNewProjForm && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-900">建立新工程專案</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        專案名稱 *
                      </label>
                      <input
                        type="text"
                        value={newProjName}
                        onChange={(e) => setNewProjName(e.target.value)}
                        placeholder="例：台中水湳經貿轉運站智慧機電工程"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        專案代碼 (Code) *
                      </label>
                      <input
                        type="text"
                        value={newProjCode}
                        onChange={(e) => setNewProjCode(e.target.value)}
                        placeholder="例：TX-HUB"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white uppercase font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      工程概述與範疇
                    </label>
                    <input
                      type="text"
                      value={newProjDesc}
                      onChange={(e) => setNewProjDesc(e.target.value)}
                      placeholder="請輸入主要工程規格、標章目標與預估工期"
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowNewProjForm(false)}
                      className="text-xs px-3 py-1 text-slate-600"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        if (!newProjName.trim() || !newProjCode.trim()) {
                          alert('請輸入專案名稱與代碼');
                          return;
                        }
                        onCreateProject(newProjName.trim(), newProjCode.trim(), newProjDesc.trim());
                        setShowNewProjForm(false);
                        setNewProjName('');
                        setNewProjCode('');
                        setNewProjDesc('');
                      }}
                      className="text-xs px-4 py-1 bg-indigo-600 text-white rounded font-medium"
                    >
                      確認建立
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {allProjects.map((p) => {
                  const isCurrent = p.id === project.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                            {p.code}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{p.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">
                              目前運作中
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xl">{p.description}</p>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onSelectProject(p.id);
                            onClose();
                          }}
                          className="text-xs px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium shadow-2xs"
                        >
                          切換至此專案
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Reset demo data button */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              if (confirm('確定要重設所有專案資料至初始展示範例嗎？')) {
                onResetData();
                onClose();
              }
            }}
            className="text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重設所有展示資料
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
