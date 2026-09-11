# PMS 系統設計文檔 (DESIGN.md)

本文件定義 PMS 專案管理與工程 RFI 追蹤系統的整體架構設計、視覺美學規範、前端元件體系與狀態持久化模式。

---

## 1. 視覺設計哲學 (Aesthetic Identity)

本專案採用 **賽博龐克復古終端機 (Retro-Futuristic Cyberpunk Terminal)** 風格，打破傳統千篇一律的企業管理軟體外觀，以高沉浸感、強烈視覺對比與精緻的光暈反饋，打造極致專業的工程控制台。

### 1.1 設計語彙與調色盤 (Design Tokens)

```css
:root {
  --term-bg: #0a0a0a;       /* 深邃純黑終端底色 */
  --term-fg: #33ff00;       /* 經典綠光螢光字元 (Primary Brand) */
  --term-muted: #1f521f;    /* 低飽和綠邊框與背景線條 */
  --term-dim: #0d280d;      /* 終端次級容器底色 */
  --term-amber: #ffb000;    /* 琥珀警示黃光 (Warning / Urgent) */
  --term-red: #ff3333;      /* 霓虹警報紅光 (Danger / Overdue) */
  --term-cyan: #00ffff;     /* 科技青藍色 (Info / Milestone) */
}
```

### 1.2 特色視覺元素
- **CRT 掃描線光柵 (Scanline Overlay)**：全局覆蓋 3px 間距的半透明掃描線，營造傳統陰極射線管 (CRT) 螢幕的復古科技感。
- **終端螢光外暈 (Terminal Glow)**：文字與邊框在特定聚焦、懸停或重要狀態下具備動態發光外暈 (`text-shadow` 與 `box-shadow`)。
- **現代等寬字型**：全局統一使用 Google Fonts `JetBrains Mono`，確保數據欄位對齊精準、代碼與工程流水號清晰易讀。
- **自訂細緻滾動條**：去除瀏覽器原生粗糙滾動條，採用 8px 像素方正風格搭配綠光滑塊。

---

## 2. 前端元件體系架構 (Component Architecture)

專案採用職責單一 (Single Responsibility) 的元件架構，核心劃分如下：

```
src/
├── components/
│   ├── Navbar.tsx                   # 頂部控制列：專案切換、視圖頁籤切換、RBAC 人員切換
│   ├── KanbanBoard.tsx              # 看板工作流：欄位渲染、拖曳排序、WIP 限額監控
│   ├── TaskCard.tsx                 # 看板任務卡片：標籤、進度、檢核清單與 RFI 關聯 Badge
│   ├── TaskModal.tsx                # 任務詳細檢視與編輯彈窗：子工項、附件與工期排程
│   ├── GanttChart.tsx               # 向量 SVG 互動甘特圖：日/週/月尺度、相依連線、里程碑
│   ├── RFIModule.tsx                # 工程疑義單處置中心：生命週期流轉、建築師決議、工期/金額影響
│   ├── AttachmentsList.tsx          # 施工照片與圖說附件預覽、剪貼簿圖片貼上
│   ├── RichTextEditorWithPaste.tsx  # 支援圖片黏貼上傳的富文字輸入器
│   ├── ProjectSettingsModal.tsx     # 專案成員管理、RBAC 角色指派與專案參數設定
│   ├── AuditTrailModal.tsx          # 系統不可竄改之全軌跡操作歷程記錄
│   └── DatabaseApiViewer.tsx        # 內建 SRS 資料庫綱要與 RESTful API 互動式規格檢視器
├── data/
│   └── initialData.ts               # 系統預設工程模擬資料庫
├── types/
│   └── pms.ts                       # 全局 TypeScript 領域實體定義
└── utils/
    └── storage.ts                   # LocalStorage 離線持久化與業務工具函數
```

---

## 3. 狀態管理與離線優先機制 (State Management & Local-First)

### 3.1 單一信任源 (Single Source of Truth)
- 由根元件 `App.tsx` 維護統一的 `AppState`，包含使用者、專案、欄位、任務、RFI、附件與稽核軌跡。
- 透過集中式 Action 處理各模組狀態轉移（例如：`handleMoveTask`、`handleCreateRfi`、`handleRespondRfi`）。

### 3.2 離線持久化 (Persistence Layer)
- 每次 `AppState` 發生變更，即時透過 `useEffect` 自動同步序列化至瀏覽器 `LocalStorage`（鍵名前綴：`pms_app_v1_state`）。
- 重新整理網頁或離線重啟時，`loadInitialState()` 自動還原工作進度。
- 提供 `resetStateToDefault()` 供管理者快速重設為標準模擬環境。

---

## 4. 未來擴展性設計 (Extensibility & Backend Transition)

當專案需從純本地展示版遷移至分散式雲端後端時：
1. **API 契約無縫接軌**：`DatabaseApiViewer.tsx` 與 `doc/spec/03_api_specification.md` 已嚴格定義 RESTful 路由與 Payload，後端（如 Node.js Express/NestJS 或 Go）可直接對標實作。
2. **物件儲存解耦**：附件模組預留了 S3/MinIO 預簽名 URL 上傳流程，可無痛從 Data URL 轉移為雲端物件儲存。
