# 第 02 章：資料庫綱要與實體關聯設計 (Database Schema)

本章規範 PMS 系統之領域資料實體（Entity）、欄位型別、主鍵外鍵約束及關聯圖。

---

## 2.1 實體關聯圖 (ERD)

```
       +---------------+ 1        n +--------------------+
       |     users     |------------|  project_members   |
       +---------------+            +--------------------+
         |           |                        |
         | 1       1 |                        | n
         |           v                        v
         |         +-----------------------------+
         |         |          projects           |
         |         +-----------------------------+
         |            | 1            | 1       | 1
         |            | n            | n       | n
         |            v              v         v
         |    +---------------+  +-------+  +-------------+
         |    |kanban_columns |  | rfis  |  | audit_logs  |
         |    +---------------+  +-------+  +-------------+
         |            | 1            ^
         |            | n            | n:m (關聯)
         |            v              v
         +--------> +--------------------+
                    |       tasks        |
                    +--------------------+
                              | 1
                              | n
                              v
                    +--------------------+
                    |    attachments     |
                    +--------------------+
```

---

## 2.2 核心實體表定義

### 1. `users` (使用者與系統帳號)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | PK, NOT NULL | 使用者唯一識別碼 (例: `usr-pm-02`) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | 帳號登入信箱 |
| `fullName` | VARCHAR(100) | NOT NULL | 使用者中文/英文全名 |
| `avatarUrl` | TEXT | NULL | 頭像圖片網址 (支援外部圖片或 SVG Data URL) |
| `systemRole` | VARCHAR(50) | NOT NULL | 全域系統角色 (`admin` / `pm` / `member` / `viewer`) |
| `department` | VARCHAR(100) | NOT NULL | 所屬部門單位 (例如：工務處、建築設計部、機電整合部) |

### 2. `projects` (工程專案實體)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | PK, NOT NULL | 專案唯一標識 (例: `prj-tp2-green`) |
| `name` | VARCHAR(255) | NOT NULL | 專案全稱 |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | 專案簡稱代號 (例: `TP2-GREEN`) |
| `description` | TEXT | NULL | 專案工程目標與規格說明 |
| `status` | VARCHAR(50) | NOT NULL | 專案狀態 (`active` / `archived` / `planning`) |
| `ownerId` | UUID / String | FK -> users.id | 專案總負責人 ID |
| `createdAt` | TIMESTAMPTZ | NOT NULL | 專案建立時間戳記 (ISO 8601) |

### 3. `kanban_columns` (看板欄位/工作階段)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | PK, NOT NULL | 欄位 ID (例: `col-in-progress`) |
| `projectId` | UUID / String | FK -> projects.id | 所屬專案 |
| `name` | VARCHAR(100) | NOT NULL | 階段名稱 (例: 待辦清單、施工中、品管驗收) |
| `position` | INT | NOT NULL | 水平排序位置順序 |
| `wipLimit` | INT | DEFAULT 0 | 在製品限制數量 (0 表示不限制) |
| `color` | VARCHAR(50) | NULL | 欄位識別強調色彩 |

### 4. `tasks` (工作任務與施工單元)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | PK, NOT NULL | 任務唯一識別碼 |
| `projectId` | UUID / String | FK -> projects.id | 所屬專案 |
| `columnId` | UUID / String | FK -> columns.id | 所屬看板欄位階段 |
| `title` | VARCHAR(255) | NOT NULL | 任務主旨摘要 |
| `description` | TEXT | NULL | 任務詳述與規格附註 |
| `priority` | VARCHAR(50) | NOT NULL | 優先級 (`low` / `medium` / `high` / `urgent`) |
| `position` | INT | NOT NULL | 垂直排序順序 |
| `startDate` | DATE / String | NULL | 預計起工日期 (YYYY-MM-DD) |
| `dueDate` | DATE / String | NULL | 預計完工或交付期限 (YYYY-MM-DD) |
| `progress` | INT | DEFAULT 0 | 施工完成進度百分比 (0 - 100) |
| `dependencies` | ARRAY[String] | NULL | 前置相依任務 ID 陣列 (用於甘特圖連線) |
| `isMilestone` | BOOLEAN | DEFAULT false | 是否為專案關鍵里程碑 (甘特圖呈菱形標示) |
| `category` | VARCHAR(100) | NULL | 工種/工作套件分組 (例: 結構工程、MEP 機電) |
| `assigneeIds` | ARRAY[String] | NOT NULL | 指派執行人員 ID 陣列 |
| `tags` | ARRAY[String] | NOT NULL | 自訂施工標籤陣列 |
| `checklist` | JSONB / ARRAY | DEFAULT '[]' | 子項目檢核清單 (`[{ id, text, completed }]`) |
| `linkedRfiIds` | ARRAY[String] | NULL | 關聯之工程 RFI 提問編號陣列 |

### 5. `rfis` (工程疑義釐清單 Request for Information)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | PK, NOT NULL | RFI 系統識別碼 |
| `projectId` | UUID / String | FK -> projects.id | 所屬專案 |
| `rfiNumber` | VARCHAR(100) | UNIQUE, NOT NULL | 流水編號 (例: `PRJ-RFI-2026-001`) |
| `title` | VARCHAR(255) | NOT NULL | 提問主題 |
| `questionText` | TEXT | NOT NULL | 工地遭遇之疑義詳述 |
| `locationSpecRef` | VARCHAR(255) | NOT NULL | 引用圖說號碼、樓層、規範條文 |
| `suggestedSolution` | TEXT | NULL | 提議建議處置方針 |
| `status` | VARCHAR(50) | NOT NULL | 狀態 (`draft`/`open`/`under_review`/`answered`/`closed`/`rejected`) |
| `costImpact` | BOOLEAN | DEFAULT false | 是否評估產生工程追加款影響 |
| `costImpactAmount` | VARCHAR(100) | NULL | 預估衍生費用金額或計算式 |
| `scheduleImpact` | BOOLEAN | DEFAULT false | 是否評估衍生關鍵要徑工期延誤 |
| `scheduleImpactDays` | INT | DEFAULT 0 | 預估影響工期天數 |
| `requesterId` | UUID / String | FK -> users.id | 發起提問人員 ID |
| `assignedToId` | UUID / String | FK -> users.id | 受派回覆主管/建築師 ID |
| `officialResponse` | TEXT | NULL | 正式核定工程答覆與裁決方案 |
| `answeredBy` | UUID / String | NULL | 填覆人員 ID |
| `answeredAt` | TIMESTAMPTZ | NULL | 回覆時間戳記 |
| `dueDate` | DATE / String | NOT NULL | 要求回覆期限 |
| `priority` | VARCHAR(50) | NOT NULL | 急迫性分級 |
| `linkedTaskIds` | ARRAY[String] | NULL | 關聯之現場施工任務 ID 陣列 |

### 6. `audit_logs` (系統稽核軌跡)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | PK, NOT NULL | 軌跡紀錄唯一碼 |
| `projectId` | UUID / String | FK -> projects.id | 所屬專案 |
| `userId` | UUID / String | FK -> users.id | 操作人員 ID |
| `action` | VARCHAR(100) | NOT NULL | 動作類型 (例: `CREATE_TASK`, `ANSWER_RFI`) |
| `targetType` | VARCHAR(50) | NOT NULL | 操作目標物件 (`TASK` / `RFI` / `COLUMN` / `PROJECT` 等) |
| `targetId` | VARCHAR(100) | NOT NULL | 目標物件識別碼 |
| `targetName` | VARCHAR(255) | NOT NULL | 目標物件顯示標題 |
| `details` | TEXT | NOT NULL | 詳細變更內容（前後差異比對） |
| `timestamp` | TIMESTAMPTZ | NOT NULL | 動作時間 (ISO 8601) |
