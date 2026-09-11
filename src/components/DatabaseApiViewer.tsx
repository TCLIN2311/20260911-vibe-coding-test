import React, { useState } from 'react';
import {
  Database,
  Code2,
  Play,
  Copy,
  Check,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileJson,
  KeyRound
} from 'lucide-react';
import { AppState } from '../utils/storage';

interface DatabaseApiViewerProps {
  appState: AppState;
}

export const DatabaseApiViewer: React.FC<DatabaseApiViewerProps> = ({ appState }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'api' | 'tester'>('schema');
  const [selectedTable, setSelectedTable] = useState<string>('rfis');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/v1/projects/:projectId/rfis');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Schema definitions
  const schemas: Record<
    string,
    { title: string; description: string; columns: { name: string; type: string; fk?: string; note?: string }[] }
  > = {
    users: {
      title: 'users (使用者與人員帳號)',
      description: '儲存系統使用者基本資訊、頭像、部門與全局系統權限',
      columns: [
        { name: 'id', type: 'UUID (PK)', note: 'Primary Key' },
        { name: 'email', type: 'VARCHAR(255)', note: 'Unique 登入電子郵件' },
        { name: 'password_hash', type: 'VARCHAR(255)', note: 'BCrypt 雜湊加密密碼' },
        { name: 'full_name', type: 'VARCHAR(100)', note: '使用者姓名' },
        { name: 'avatar_url', type: 'TEXT', note: '使用者頭像圖片網址' },
        { name: 'role', type: 'VARCHAR(50)', note: '系統角色 (admin/pm/member/viewer)' },
        { name: 'created_at', type: 'TIMESTAMPTZ', note: '帳號建立時間戳記' },
      ],
    },
    projects: {
      title: 'projects (專案實體)',
      description: '儲存工程或軟體專案之代號、名稱、狀態與專案擁有者',
      columns: [
        { name: 'id', type: 'UUID (PK)', note: 'Primary Key' },
        { name: 'name', type: 'VARCHAR(255)', note: '專案全名' },
        { name: 'code', type: 'VARCHAR(50)', note: '專案代號 (例如：TP-TW2)' },
        { name: 'description', type: 'TEXT', note: '工程規格與專案概述' },
        { name: 'status', type: 'VARCHAR(50)', note: 'active / archived / planning' },
        { name: 'owner_id', type: 'UUID (FK)', fk: '-> users.id', note: '專案總負責人' },
        { name: 'created_at', type: 'TIMESTAMPTZ', note: '建立時間' },
      ],
    },
    project_members: {
      title: 'project_members (專案成員與 RBAC 角色)',
      description: '多對多關聯表，記錄使用者在各專案中的特定職責權限',
      columns: [
        { name: 'project_id', type: 'UUID (FK)', fk: '-> projects.id' },
        { name: 'user_id', type: 'UUID (FK)', fk: '-> users.id' },
        { name: 'project_role', type: 'VARCHAR(50)', note: 'admin / pm / member / viewer' },
      ],
    },
    kanban_columns: {
      title: 'kanban_columns (看板工作流欄位)',
      description: '支援動態新增、排序、WIP (Work In Progress) 限制設定',
      columns: [
        { name: 'id', type: 'UUID (PK)', note: 'Primary Key' },
        { name: 'project_id', type: 'UUID (FK)', fk: '-> projects.id' },
        { name: 'name', type: 'VARCHAR(100)', note: '欄位名稱 (如: 進行中)' },
        { name: 'position', type: 'INT', note: '排序順序索引' },
        { name: 'wip_limit', type: 'INT', note: 'WIP 張數上限 (0 表示不限)' },
        { name: 'created_at', type: 'TIMESTAMPTZ', note: '建立時間' },
      ],
    },
    tasks: {
      title: 'tasks (工作卡片)',
      description: '看板核心工作實體，支援富文本、優先級、位置與指派',
      columns: [
        { name: 'id', type: 'UUID (PK)', note: 'Primary Key' },
        { name: 'column_id', type: 'UUID (FK)', fk: '-> kanban_columns.id' },
        { name: 'title', type: 'VARCHAR(255)', note: '工作卡片主旨' },
        { name: 'description', type: 'TEXT', note: '詳細施工要求 (Markdown / 富文本)' },
        { name: 'priority', type: 'VARCHAR(20)', note: 'low / medium / high / urgent' },
        { name: 'position', type: 'FLOAT8', note: '浮點排序索引 (Fractional Indexing)' },
        { name: 'due_date', type: 'DATE', note: '截止工期' },
        { name: 'created_by', type: 'UUID (FK)', fk: '-> users.id' },
        { name: 'created_at', type: 'TIMESTAMPTZ', note: '建立時間' },
      ],
    },
    task_assignees: {
      title: 'task_assignees (卡片多責任人指派)',
      description: '多對多關聯表，記錄單一工作卡片指派的一位或多位責任人員',
      columns: [
        { name: 'task_id', type: 'UUID (FK)', fk: '-> tasks.id' },
        { name: 'user_id', type: 'UUID (FK)', fk: '-> users.id' },
      ],
    },
    rfis: {
      title: 'rfis (工程需求待釐清與資訊請求)',
      description: 'RFI 核心模組：生命週期、影響評估、流水號與官方答覆',
      columns: [
        { name: 'id', type: 'UUID (PK)', note: 'Primary Key' },
        { name: 'project_id', type: 'UUID (FK)', fk: '-> projects.id' },
        { name: 'rfi_number', type: 'VARCHAR(50)', note: '唯一流水編號 (例: PRJ-RFI-2026-001)' },
        { name: 'title', type: 'VARCHAR(255)', note: '疑義提問主旨' },
        { name: 'question_text', type: 'TEXT', note: '詳細提問與衝突說明' },
        { name: 'location_spec_ref', type: 'VARCHAR(255)', note: '圖紙編號/樓層/條文位置' },
        { name: 'suggested_solution', type: 'TEXT', note: '提出人建議替代方案' },
        { name: 'status', type: 'VARCHAR(30)', note: 'draft / open / under_review / answered / closed / rejected' },
        { name: 'cost_impact', type: 'BOOLEAN', note: '是否產生工程造價變動' },
        { name: 'schedule_impact_days', type: 'INT', note: '預估工期展延天數' },
        { name: 'requester_id', type: 'UUID (FK)', fk: '-> users.id', note: '發起工程師' },
        { name: 'assigned_to_id', type: 'UUID (FK)', fk: '-> users.id', note: '受派答覆主管/建築師' },
        { name: 'official_response', type: 'TEXT', note: '正式官方簽認答覆內容' },
        { name: 'answered_at', type: 'TIMESTAMPTZ', note: '正式答覆時間' },
        { name: 'due_date', type: 'DATE', note: '要求回覆期限' },
        { name: 'closed_at', type: 'TIMESTAMPTZ', note: '正式結案歸檔時間' },
      ],
    },
    attachments: {
      title: 'attachments (物件儲存附件與剪貼簿貼圖)',
      description: '對接 MinIO / S3 物件儲存，記錄檔案大小、MIME-type 及關聯對象',
      columns: [
        { name: 'id', type: 'UUID (PK)', note: 'Primary Key' },
        { name: 'target_type', type: 'VARCHAR(20)', note: "'TASK' | 'RFI' | 'COMMENT'" },
        { name: 'target_id', type: 'UUID', note: '綁定之實體 ID' },
        { name: 'file_name', type: 'VARCHAR(255)', note: '原始檔名' },
        { name: 'file_size', type: 'BIGINT', note: '檔案位元組大小 (Byte)' },
        { name: 'mime_type', type: 'VARCHAR(100)', note: 'MIME-type 安全檢驗 (防止偽造)' },
        { name: 'storage_key', type: 'VARCHAR(500)', note: 'S3 / MinIO 物件路徑' },
        { name: 'public_url', type: 'TEXT', note: '預簽名 (Presigned) 或公開 URL' },
        { name: 'uploaded_by', type: 'UUID (FK)', fk: '-> users.id' },
        { name: 'created_at', type: 'TIMESTAMPTZ', note: '上傳時間' },
      ],
    },
  };

  // RESTful API specifications
  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/auth/login',
      category: '身份認證',
      desc: '使用者登入獲取 Stateless JWT Token',
      mockResponse: () => ({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItcG0tMDIiLCJyb2xlIjoicG0ifQ...',
        user: appState.users.find((u) => u.id === appState.currentUserId),
      }),
    },
    {
      method: 'GET',
      path: '/api/v1/users/me',
      category: '身份認證',
      desc: '取得目前登入使用者個人資訊與所屬專案清單',
      mockResponse: () => ({
        user: appState.users.find((u) => u.id === appState.currentUserId),
        projects: appState.projects,
      }),
    },
    {
      method: 'GET',
      path: '/api/v1/projects/:projectId/kanban',
      category: '看板管理',
      desc: '取得專案完整看板工作流欄位與卡片清單 (含 WIP 上限)',
      mockResponse: () => ({
        project: appState.projects.find((p) => p.id === appState.currentProjectId),
        columns: appState.columns,
        tasks: appState.tasks,
      }),
    },
    {
      method: 'POST',
      path: '/api/v1/tasks',
      category: '看板管理',
      desc: '在指定看板欄位建立新卡片 (支援檢查清單與附件)',
      mockResponse: () => ({
        success: true,
        task: appState.tasks[0],
      }),
    },
    {
      method: 'PATCH',
      path: '/api/v1/tasks/:id/move',
      category: '看板管理',
      desc: '移動卡片跨欄位或排序 (浮點排序法 Fractional Indexing)',
      mockResponse: () => ({
        taskId: appState.tasks[0]?.id,
        newColumnId: 'col-in-progress',
        newPosition: 1.5,
        optimistic: true,
      }),
    },
    {
      method: 'GET',
      path: '/api/v1/projects/:projectId/rfis',
      category: 'RFI 管理',
      desc: '條件篩選 RFI 列表（支援狀態、責任人、影響評估篩選）',
      mockResponse: () => ({
        total: appState.rfis.length,
        items: appState.rfis,
      }),
    },
    {
      method: 'POST',
      path: '/api/v1/rfis',
      category: 'RFI 管理',
      desc: '發布新工程 RFI 提問，系統自動生成流水編號',
      mockResponse: () => ({
        rfiNumber: 'PRJ-RFI-2026-005',
        status: 'open',
        rfi: appState.rfis[0],
      }),
    },
    {
      method: 'POST',
      path: '/api/v1/rfis/:id/respond',
      category: 'RFI 管理',
      desc: '主管/受派建築師填寫正式工程回覆與決議 (RBAC 限制)',
      mockResponse: () => ({
        rfiId: appState.rfis[0]?.id,
        status: 'answered',
        answeredBy: appState.currentUserId,
        officialResponse: '經核定採行樑下繞管方案 A，已修正竣工圖號 MEP-B2-301。',
      }),
    },
    {
      method: 'POST',
      path: '/api/v1/attachments/presigned-url',
      category: '檔案與物件儲存',
      desc: '請求 MinIO / S3 預簽名上傳 URL (支援剪貼簿貼圖即時上傳)',
      mockResponse: () => ({
        uploadUrl: 'https://s3.ap-northeast-1.amazonaws.com/pms-storage/projects/tp-tw2/...?X-Amz-Signature=...',
        storageKey: `projects/tp-tw2/tasks/snap_${Date.now()}.png`,
        expiresIn: 900,
      }),
    },
  ];

  const handleTestApi = (endpoint: any) => {
    setSelectedEndpoint(`${endpoint.method} ${endpoint.path}`);
    const res = endpoint.mockResponse();
    setTestResult(JSON.stringify(res, null, 2));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-100/70 p-3 sm:p-5 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              系統資料庫實體與 RESTful API 規格規範
            </h2>
            <p className="text-xs text-slate-500">
              對照 SRS 第 4 節 (Database Schema) 與第 5 節 (API Endpoints) 完整規範
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'schema' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> 資料庫實體設計 (Schema)
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'api' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> RESTful API 規格書
          </button>
          <button
            onClick={() => {
              setActiveTab('tester');
              if (!testResult) handleTestApi(endpoints[2]);
            }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'tester' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> 即時 API 調試器 (Runner)
          </button>
        </div>
      </div>

      {/* Tab 1: Database Schema Design */}
      {activeTab === 'schema' && (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col md:flex-row">
          {/* Table List (Left) */}
          <div className="w-full md:w-64 border-r border-slate-200 p-3 bg-slate-50/70 overflow-y-auto space-y-1 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
              8 大核心實體表格
            </span>
            {Object.keys(schemas).map((key) => {
              const sch = schemas[key];
              const isSel = selectedTable === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTable(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    isSel
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <span className="font-mono">{key}</span>
                  <span className="text-[10px] opacity-75">{sch.columns.length} 欄位</span>
                </button>
              );
            })}
          </div>

          {/* Table Details (Right) */}
          <div className="flex-1 p-5 overflow-y-auto">
            {schemas[selectedTable] && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    {schemas[selectedTable].title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {schemas[selectedTable].description}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">欄位名稱 (Column)</th>
                        <th className="py-2.5 px-3">資料型別 (PostgreSQL)</th>
                        <th className="py-2.5 px-3">外鍵關聯 (FK)</th>
                        <th className="py-2.5 px-3">規格說明 / 約束備註</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schemas[selectedTable].columns.map((col) => (
                        <tr key={col.name} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                            {col.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{col.type}</td>
                          <td className="py-2.5 px-3">
                            {col.fk ? (
                              <span className="font-mono text-[11px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                                {col.fk}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{col.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: RESTful API Specifications */}
      {activeTab === 'api' && (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-y-auto p-5 space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-800">RESTful API 端點規格總覽</h3>
            <p className="text-xs text-slate-500">
              Stateless JWT 認證、RESTful 語意命名與 S3 預簽名 URL (Presigned URL) 直傳架構
            </p>
          </div>

          <div className="space-y-3">
            {endpoints.map((ep, idx) => {
              const methodColor =
                ep.method === 'GET'
                  ? 'bg-blue-100 text-blue-700'
                  : ep.method === 'POST'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700';

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${methodColor}`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">{ep.path}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded">
                        {ep.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{ep.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('tester');
                      handleTestApi(ep);
                    }}
                    className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium shrink-0 flex items-center gap-1 self-start sm:self-center"
                  >
                    <Play className="w-3 h-3" /> 模擬呼叫此 API
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive API Tester */}
      {activeTab === 'tester' && (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col md:flex-row">
          {/* Endpoint selector */}
          <div className="w-full md:w-80 border-r border-slate-200 p-3 bg-slate-50/70 overflow-y-auto space-y-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
              點選端點即時測試
            </span>
            {endpoints.map((ep, idx) => {
              const isSelected = selectedEndpoint === `${ep.method} ${ep.path}`;
              return (
                <div
                  key={idx}
                  onClick={() => handleTestApi(ep)}
                  className={`p-2 rounded-lg cursor-pointer text-xs transition-all ${
                    isSelected ? 'bg-indigo-600 text-white shadow-2xs' : 'hover:bg-slate-200/70 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-mono font-bold px-1 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : ep.method === 'GET'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-[11px] truncate">{ep.path}</span>
                  </div>
                  <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {ep.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Test Console */}
          <div className="flex-1 p-5 flex flex-col overflow-hidden bg-slate-900 text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">200 OK</span>
                <span className="text-slate-400">響應耗時: 18ms</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300 truncate">{selectedEndpoint}</span>
              </div>
              <button
                onClick={() => testResult && copyToClipboard(testResult)}
                className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? '已複製 JSON' : '複製'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-lg border border-slate-800 text-[11px] leading-relaxed select-text">
              <pre>{testResult || '// 請點擊左側任一 API 端點進行模擬呼叫...'}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
