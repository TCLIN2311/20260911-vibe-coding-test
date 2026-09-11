#!/usr/bin/env bash

# 確保在專案目錄下執行
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR" || exit 1

PID_FILE="$PROJECT_DIR/.server.pid"
LOG_FILE="$PROJECT_DIR/server.log"
PORT=3000

echo "=========================================="
echo "  🚀 準備啟動 PMS 專案本地伺服器..."
echo "=========================================="

# 1. 檢查 Node.js 與 npm
if ! command -v node >/dev/null 2>&1; then
  echo "❌ 錯誤：找不到 Node.js。請先至 https://nodejs.org 安裝 Node.js。"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ 錯誤：找不到 npm。請確認 Node.js 環境設定。"
  exit 1
fi

# 2. 檢查 node_modules 是否存在，若無則自動安裝
if [ ! -d "node_modules" ]; then
  echo "📦 偵測到尚未安裝依賴套件，正在執行 npm install..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ 依賴套件安裝失敗，請檢查網路或 npm 設定。"
    exit 1
  fi
  echo "✅ 依賴套件安裝完成！"
fi

# 3. 檢查伺服器是否已在運行中
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" 2>/dev/null)
  if [ -n "$OLD_PID" ] && ps -p "$OLD_PID" >/dev/null 2>&1; then
    echo "⚠️ 伺服器已經在背景運行中！(PID: $OLD_PID)"
    echo "🌐 本地網址: http://localhost:$PORT"
    echo "💡 如需關閉，請執行: ./stop.sh"
    exit 0
  fi
fi

# 檢查連接埠是否被佔用
PORT_PID=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PORT_PID" ]; then
  echo "⚠️ 連接埠 $PORT 已被其他程式 (PID: $PORT_PID) 佔用。"
  echo "💡 您可以執行 ./stop.sh 關閉它，或檢查該程式。"
  exit 1
fi

# 4. 判斷是否為前台模式 (例如傳入 -f 或 --foreground)
if [[ "$1" == "-f" ]] || [[ "$1" == "--foreground" ]]; then
  echo "🖥️ 正在以前台模式啟動伺服器 (按 Ctrl+C 可停止)..."
  npx vite --port $PORT --host
  exit 0
fi

# 5. 背景啟動模式
echo "⏳ 正在啟動 Vite 開發伺服器..."
nohup npx vite --port $PORT --host > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# 等待伺服器啟動完成 (最多等候 8 秒)
for i in {1..8}; do
  if lsof -ti :$PORT >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# 檢查是否成功在背景運行
if ps -p "$SERVER_PID" >/dev/null 2>&1; then
  echo "=========================================="
  echo "  ✅ PMS 本地伺服器已成功在背景啟動！"
  echo "=========================================="
  echo "  📌 行程編號 (PID): $SERVER_PID"
  echo "  🌐 本地瀏覽網址:    http://localhost:$PORT"
  echo "  📜 即時日誌檔案:    $LOG_FILE"
  echo "  🛑 停止伺服器指令:  ./stop.sh 或 npm run stop"
  echo "=========================================="

  # macOS 自動開啟瀏覽器 (除非指定 --no-open)
  if [[ "$1" != "--no-open" ]] && [[ "$2" != "--no-open" ]]; then
    if command -v open >/dev/null 2>&1; then
      open "http://localhost:$PORT"
    fi
  fi
else
  echo "❌ 啟動失敗，請查看日誌內容："
  tail -n 20 "$LOG_FILE"
  rm -f "$PID_FILE"
  exit 1
fi
