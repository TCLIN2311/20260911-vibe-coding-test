#!/usr/bin/env bash

# 確保在專案目錄下執行
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR" || exit 1

PID_FILE="$PROJECT_DIR/.server.pid"
PORT=3000
STOPPED=0

echo "=========================================="
echo "  🛑 準備停止 PMS 專案本地伺服器..."
echo "=========================================="

# 1. 檢查 PID 檔案
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE" 2>/dev/null)
  if [ -n "$PID" ] && ps -p "$PID" >/dev/null 2>&1; then
    echo "⏳ 正在終止伺服器行程 (PID: $PID)..."
    kill "$PID" 2>/dev/null
    
    # 等待行程結束 (最多 5 秒)
    for i in {1..5}; do
      if ! ps -p "$PID" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    # 若尚未結束則強制終止
    if ps -p "$PID" >/dev/null 2>&1; then
      echo "⚠️ 行程未回應，執行強制停止..."
      kill -9 "$PID" 2>/dev/null
    fi
    STOPPED=1
  fi
  rm -f "$PID_FILE"
fi

# 2. 檢查連接埠 3000 是否仍有佔用行程
PORT_PIDS=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PORT_PIDS" ]; then
  echo "⏳ 發現佔用連接埠 $PORT 的行程 (PID: $PORT_PIDS)，正在終止..."
  for p in $PORT_PIDS; do
    kill "$p" 2>/dev/null
    sleep 0.5
    if ps -p "$p" >/dev/null 2>&1; then
      kill -9 "$p" 2>/dev/null
    fi
  done
  STOPPED=1
fi

if [ $STOPPED -eq 1 ]; then
  echo "=========================================="
  echo "  ✅ PMS 本地伺服器已成功停止！"
  echo "=========================================="
else
  echo "ℹ️ 目前沒有偵測到正在運行的 PMS 伺服器 (Port $PORT 未被佔用)。"
fi
