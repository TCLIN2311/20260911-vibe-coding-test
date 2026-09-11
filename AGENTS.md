# AI Agent 協同規範與開發準則 (AGENTS.md)

本文件是所有 AI Agent（包括 Antigravity、Gemini、Claude 等協作助手）在本專案執行任何代碼更動、功能開發與重構時，**必須無條件遵循的最高執行準則**。

---

## 🎯 核心工作流：四階段開發規範 (Core Workflow)

在進行任何功能開發時，嚴禁未經討論直接修改程式碼。必須嚴格遵循以下 SOP：

```
[第 1 階段：需求討論] 
       │
       ▼
[第 2 階段：撰寫開發計畫] ──> 存入 doc/dev/plan_<功能名稱>.md 並參照
       │
       ▼
[第 3 階段：依計畫實作與驗證] ──> npm run lint & npm run build 通過
       │
       ▼
[第 4 階段：回寫規格文件] ──> 按章節同步更新至 doc/spec/
```

### 1. 討論先行 (Discuss First)
- 功能開發前，主動向使用者確認業務邏輯、使用情境、受影響的元件範圍以及角色權限 (RBAC)。
- 提出清晰的候選方案與權衡分析，達成共識後才進入下一階段。

### 2. 撰寫開發計畫 (Write Plan to `doc/dev/`)
- 在 `doc/dev/` 目錄下建立新計畫檔案。
- **命名規則**：強制使用 `plan_<功能名稱>.md`（例如：`doc/dev/plan_rfi_pdf_export.md`）。
- 必須參考 `doc/dev/template_plan.md` 包含背景、影響評估、技術架構、檢查清單。
- 開發實作過程中，以此計畫文件作為唯一的執行對照基準。

### 3. 實作與品質把關 (Implementation & Review)
- 遵循 Code Reviewer 原則：
  - **正確性 (Correctness)**：精準達成預期功能，考慮邊界條件。
  - **安全性 (Security)**：防止 XSS、注入漏洞與未校驗輸入。
  - **可維護性 (Maintainability)**：維持命名規範、不破壞現有程式碼與重要註解。
  - **效能 (Performance)**：避免不必要的 React 重繪或狀態過度計算。
- 遵循 `DESIGN.md` 中規定的 Cyberpunk Terminal 視覺風格與 Tailwind CSS 4 規範，嚴禁加入破壞整體風格之粗糙白色或未套用主題之原生 UI。
- **自動驗證標準**：實作完成後必須在終端執行並確認以下兩項指令 100% 通過：
  ```bash
  npm run lint    # TypeScript 型別靜態檢查
  npm run build   # 生產環境 Vite 打包建置 (0 錯誤、0 警告)
  ```

### 4. 回寫正式規格 (Write Back to `doc/spec/`)
- 功能開發並通過驗證後，**必須** 將新增/修改的業務邏輯、資料表模型 (Schema)、API 端點或操作流程，分門別類回寫更新至 `doc/spec/` 的對應章節中：
  - `doc/spec/01_system_overview.md` (架構與技術堆疊)
  - `doc/spec/02_database_schema.md` (資料表與實體關聯)
  - `doc/spec/03_api_specification.md` (API 端點與請求回應格式)
  - `doc/spec/04_rbac_security.md` (角色權限與稽核機制)
  - `doc/spec/05_kanban_and_rfi.md` (看板階段與 RFI 生命週期)
  - `doc/spec/06_gantt_and_schedule.md` (甘特圖與里程碑)
- 確保 `doc/spec/` 始終代表專案當前最新的真實規格 (Single Source of Truth)。

---

## 🛠️ 本地服務操作規範 (Server Management)

- **啟動本機伺服器**：`./start.sh` 或 `npm run start`（自動背景運行、日誌記錄與連接埠檢查）。
- **關閉本機伺服器**：`./stop.sh` 或 `npm run stop`（釋放 Port 3000）。
- **前台偵錯模式**：`./start.sh -f` 或 `npm run dev`。
