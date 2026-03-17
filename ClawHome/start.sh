#!/bin/bash

# ClawHome 服务启动脚本

BASE_DIR="/root/.openclaw/workspace/ClawHome"
LOG_DIR="$BASE_DIR"

echo "Starting ClawHome services..."

# 启动后端 API 服务
echo "Starting backend server on port 3000..."
cd "$BASE_DIR"
nohup node server.js > "$LOG_DIR/app.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# 等待后端启动
sleep 2

# 启动前端静态服务
echo "Starting frontend server on port 3001..."
cd "$BASE_DIR/build"
nohup npx serve -s -l 3001 > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# 等待前端启动
sleep 3

# 检查服务状态
echo ""
echo "Checking service status..."

if netstat -tlnp 2>/dev/null | grep -q ":3000.*LISTEN"; then
    echo "✅ Backend service is running on port 3000"
else
    echo "❌ Backend service failed to start"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3001.*LISTEN"; then
    echo "✅ Frontend service is running on port 3001"
else
    echo "❌ Frontend service failed to start"
fi

echo ""
echo "All services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
