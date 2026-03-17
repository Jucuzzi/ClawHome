#!/bin/bash

# 同步前端编译文件到nginx可访问目录
# 使用方法：./sync-to-nginx.sh

SOURCE_DIR="/root/.openclaw/workspace/ClawHome/build"
TARGET_DIR="/var/www/html/lobster-house"

echo "🔄 同步前端文件到nginx目录..."
echo "源目录: $SOURCE_DIR"
echo "目标目录: $TARGET_DIR"

# 检查源目录是否存在
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ 错误：源目录不存在，请先运行 npm run build"
    exit 1
fi

# 同步文件
rsync -av --delete "$SOURCE_DIR/" "$TARGET_DIR/"

echo "✅ 同步完成！"
echo "📝 文件列表："
ls -la "$TARGET_DIR"
