# 第 03 章：RESTful API 規格規範書 (API Specification)

本章定義 PMS 系統標準 RESTful API 端點、HTTP 動詞、請求路徑、認證要求與輸入輸出 Payload Schema。

---

## 3.1 共通規範
- **Base URL**：`/api/v1`
- **Content-Type**：`application/json`
- **認證方式**：Bearer Token (JWT)
- **錯誤代碼結構**：
  ```json
  {
    "error": {
      "code": "BAD_REQUEST",
      "message": "說明錯誤具體原因",
      "details": []
    }
  }
  ```

---

## 3.2 專案管理 API (Projects)

### 1. 取得使用者專案清單
- **GET** `/api/v1/projects`
- **權限**：已登入使用者
- **Response 200**：
  ```json
  [
    {
      "id": "prj-tp2-green",
      "name": "台北南港軟體二期研發大樓新建工程",
      "code": "TP2-GREEN",
      "description": "地下 3 層、地上 18 層綠建築鋼骨結構研發大樓新建工程",
      "status": "active",
      "ownerId": "usr-pm-02",
      "createdAt": "2026-01-10T08:00:00.000Z"
    }
  ]
  ```

---

## 3.3 看板與任務 API (Tasks & Columns)

### 1. 取得專案任務列表
- **GET** `/api/v1/projects/:projectId/tasks`
- **Query Params**：`columnId`, `priority`, `assigneeId`
- **Response 200**：
  ```json
  {
    "total": 12,
    "items": [
      {
        "id": "tsk-001",
        "projectId": "prj-tp2-green",
        "columnId": "col-in-progress",
        "title": "B2F 昇降機道剪力牆綁筋與預埋件查驗",
        "priority": "high",
        "position": 0,
        "progress": 70,
        "startDate": "2026-09-01",
        "dueDate": "2026-09-15",
        "isMilestone": false,
        "category": "結構工程",
        "assigneeIds": ["usr-eng-03"]
      }
    ]
  }
  ```

### 2. 拖曳更新任務位置 (看板 Drag & Drop)
- **PATCH** `/api/v1/tasks/:id/move`
- **Request Body**：
  ```json
  {
    "targetColumnId": "col-qa",
    "targetPosition": 2
  }
  ```
- **Response 200**：
  ```json
  {
    "success": true,
    "taskId": "tsk-001",
    "columnId": "col-qa",
    "position": 2,
    "updatedAt": "2026-09-11T05:30:00.000Z"
  }
  ```

---

## 3.4 工程疑義單 API (RFIs)

### 1. 發布新 RFI 提問
- **POST** `/api/v1/rfis`
- **Request Body**：
  ```json
  {
    "projectId": "prj-tp2-green",
    "title": "B2F 機房主幹管與結構大樑淨高衝突釐清",
    "locationSpecRef": "MEP-B2-04 / S-301 結構剖面圖",
    "questionText": "發現 400mm 消防冰水管與大樑下緣重疊，無法滿足 2.4m 淨高要求，請指示繞樑或套管補強方案。",
    "suggestedSolution": "建議採行樑下繞管方案 A，已附帶干涉示意圖。",
    "costImpact": true,
    "costImpactAmount": "約 NT$ 45,000",
    "scheduleImpact": true,
    "scheduleImpactDays": 3,
    "dueDate": "2026-09-18",
    "priority": "urgent",
    "assignedToId": "usr-arch-01",
    "linkedTaskIds": ["tsk-003"]
  }
  ```
- **Response 201**：
  ```json
  {
    "id": "rfi-new-99",
    "rfiNumber": "PRJ-RFI-2026-005",
    "status": "open",
    "createdAt": "2026-09-11T05:40:00.000Z"
  }
  ```

### 2. 主管/建築師正式工程答覆
- **POST** `/api/v1/rfis/:id/respond`
- **權限限制**：僅限受指派人或專案管理員 (PM/Admin)
- **Request Body**：
  ```json
  {
    "officialResponse": "經核定採行樑下繞管方案 A，已修正竣工圖號 MEP-B2-301，請依圖施工並加強防震懸吊。",
    "status": "answered"
  }
  ```
- **Response 200**：
  ```json
  {
    "rfiId": "rfi-new-99",
    "status": "answered",
    "answeredBy": "usr-arch-01",
    "answeredAt": "2026-09-11T06:00:00.000Z"
  }
  ```

---

## 3.5 物件儲存與附件 API (Attachments)

### 1. 取得雲端物件儲存預簽名上傳 URL (S3 / MinIO)
- **POST** `/api/v1/attachments/presigned-url`
- **Request Body**：
  ```json
  {
    "fileName": "site_photo_b2_beam.png",
    "fileSize": 1845020,
    "mimeType": "image/png",
    "targetType": "RFI",
    "targetId": "rfi-001"
  }
  ```
- **Response 200**：
  ```json
  {
    "uploadUrl": "https://storage.internal.corp/pms-storage/projects/tp2/...?Signature=...",
    "storageKey": "projects/tp2/rfis/rfi-001/snap_1726034120.png",
    "expiresIn": 900
  }
  ```
