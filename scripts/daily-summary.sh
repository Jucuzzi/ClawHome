#!/bin/bash

# 每日总结脚本
# 每天凌晨0点运行，总结前一天的交互

# 获取昨天的日期（格式：yyyy-MM-dd）
YESTERDAY=$(date -d "yesterday" +"%Y-%m-%d")
TODAY=$(date +"%Y-%m-%d")
MEMORY_DIR="/root/.openclaw/workspace/memory"
SUMMARY_FILE="$MEMORY_DIR/$YESTERDAY.md"

# 确保memory目录存在
mkdir -p "$MEMORY_DIR"

# 如果昨天的总结文件已经存在，就不重复生成
if [ -f "$SUMMARY_FILE" ]; then
    echo "总结文件 $SUMMARY_FILE 已存在，跳过生成"
    exit 0
fi

# 生成总结内容
cat > "$SUMMARY_FILE" << EOF
# $YESTERDAY 每日总结

## 日期
- 日期: $YESTERDAY
- 生成时间: $(date "+%Y-%m-%d %H:%M:%S")

## 重要事件
- [需要从会话历史中提取]

## 完成的工作
- [需要从会话历史中提取]

## 学到的东西
- [需要从会话历史中提取]

## 待办事项
- [需要从会话历史中提取]

## 备注
此文件由每日总结脚本自动生成。

---
糖宝 🍬
EOF

echo "已生成每日总结: $SUMMARY_FILE"
