# PMS 專案管理與工程 RFI 追蹤系統 (本地運行版)

整合視覺化看板工作流、工程需求待釐清 (RFI) 追蹤與時程甘特圖 (Gantt Chart) 的專案管理系統，具備關鍵里程碑、相依關聯線、RBAC 權限管理與稽核紀錄。

---

## ⚡ 快速啟動與關閉

本專案已完成本地運行配置，並提供方便的快速管理腳本：

### 1. 啟動伺服器 (背景運行 + 自動開啟瀏覽器)
```bash
./start.sh
```
或使用 npm 指令：
```bash
npm run start
```
> **腳本特性**：
> - 自動檢查 Node.js 環境與是否缺少 `node_modules`（若無會自動 `npm install`）。
> - 自動防重複啟動與 Port 佔用偵測。
> - 在背景安全啟動服務並記錄 PID，同時輸出日誌至 `server.log`。
> - macOS 環境下自動開啟瀏覽器前往 `http://localhost:3000`。

### 2. 停止伺服器
```bash
./stop.sh
```
或使用 npm 指令：
```bash
npm run stop
```
> **腳本特性**：
> - 讀取 `.server.pid` 優雅終止服務，並自動釋放 Port 3000。

---

## 🛠️ 其他開發指令

| 指令 | 說明 |
| :--- | :--- |
| `./start.sh -f` 或 `npm run dev` | **前台開發模式**：即時在終端機查看 Vite 日誌，按 `Ctrl+C` 即可退出 |
| `npm run build` | **正式建置**：編譯打包前端生產檔案至 `dist/` 目錄 |
| `npm run preview` | **預覽打包結果**：本地預覽 `dist/` 靜態檔案 |
| `npm run lint` | **型別檢查**：執行 TypeScript 靜態檢查 (`tsc --noEmit`) |
| `npm run clean` | **清理快照與日誌**：清理 `dist/`、`server.log` 與 `.server.pid` |

---

## 💻 技術規格與環境需求

- **Node.js**：建議 `v18.0.0` 以上版本
- **核心框架**：React 19, TypeScript
- **建置工具**：Vite 6, @tailwindcss/vite 4
- **圖示庫**：Lucide React
- **動畫庫**：Motion
- **資料儲存**：純本地離線 LocalStorage 持久化，所有新增/編輯/拖曳看板皆即時保存在本機瀏覽器中。

---

## 🌐 預設存取資訊

- **本地網址**：[http://localhost:3000](http://localhost:3000)
- **預設使用者身份**：專案經理 (PM - 林廷宇)
- **預設專案**：台北南港軟體二期研發大樓新建工程 (代碼: `TP2-GREEN`)
