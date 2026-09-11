# PMS 系統規格手冊 (System Specifications)

本目錄 (`doc/spec/`) 為 PMS 專案管理與工程 RFI 追蹤系統的正式規格說明書，依章節結構化管理。

---

## 📚 規格章節目錄索引

| 章節編號 | 文件名稱 | 內容說明 |
| :--- | :--- | :--- |
| **第 01 章** | [01_system_overview.md](./01_system_overview.md) | 系統願景、整體架構、技術堆疊與本地運行機制 |
| **第 02 章** | [02_database_schema.md](./02_database_schema.md) | 領域資料實體模型、關聯圖 (ERD) 與資料庫結構 |
| **第 03 章** | [03_api_specification.md](./03_api_specification.md) | RESTful API 規格規範、端點定義與輸入輸出 Schema |
| **第 04 章** | [04_rbac_security.md](./04_rbac_security.md) | 角色型存取控制 (RBAC) 權限矩陣與系統稽核日誌機制 |
| **第 05 章** | [05_kanban_and_rfi.md](./05_kanban_and_rfi.md) | 看板工作流、WIP 限制與工程 RFI 提問處置生命週期 |
| **第 06 章** | [06_gantt_and_schedule.md](./06_gantt_and_schedule.md) | 時程甘特圖、相依關聯線 (FS/SS/FF)、關鍵路徑與里程碑 |

---

## 🔄 規格維護原則
- 任何新功能或改動在完成開發與驗證後，**必須** 更新對應章節之文檔，確保本規格手冊為系統唯一真實資訊來源 (Single Source of Truth)。
- 修改歷史與變更依據須標明對應之 `doc/dev/plan_<功能名稱>.md`。
