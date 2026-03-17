#!/usr/bin/env python3
"""
健身训练提醒脚本
每周二、三、四、五早上7:30提醒当天的训练计划
"""

import json
import subprocess
import sys
from datetime import datetime

# 用户ID（从消息上下文获取）
USER_ID = "ou_a7a4162a8cefaf0dfe0ab98766188df2"

# 训练计划
WORKOUT_PLANS = {
    2: {
        "day": "周二",
        "title": "上肢训练A（推类重点）",
        "warmup": "跑步机或椭圆机：5分钟",
        "exercises": [
            {"name": "杠铃卧推", "sets": "3组×10次", "target": "胸部、三头肌、前三角肌", "rest": "90秒"},
            {"name": "哑铃推举", "sets": "3组×12次", "target": "肩部", "rest": "75秒"},
            {"name": "高位下拉", "sets": "3组×12次", "target": "背部", "rest": "75秒"},
            {"name": "哑铃俯身划船", "sets": "3组×12次", "target": "背部", "rest": "75秒"},
            {"name": "绳索三头下压", "sets": "3组×15次", "target": "三头肌", "rest": "60秒"},
        ],
        "cardio": "跑步机或椭圆机：中等强度 10分钟",
        "stretch": "胸部、肩部、背部拉伸"
    },
    3: {
        "day": "周三",
        "title": "下肢训练A",
        "warmup": "跑步机：5分钟",
        "exercises": [
            {"name": "杠铃深蹲", "sets": "3组×10次", "target": "股四头肌、臀部、核心", "rest": "90秒"},
            {"name": "罗马尼亚硬拉", "sets": "3组×12次", "target": "腘绳肌、臀部", "rest": "75秒"},
            {"name": "腿举机", "sets": "3组×12次", "target": "股四头肌", "rest": "75秒"},
            {"name": "坐姿腿弯举", "sets": "3组×15次", "target": "腘绳肌", "rest": "60秒"},
            {"name": "提踵", "sets": "3组×20次", "target": "小腿", "rest": "45秒"},
        ],
        "cardio": "椭圆机或自行车：中等强度 10分钟",
        "stretch": "腿部、臀部拉伸"
    },
    4: {
        "day": "周四",
        "title": "上肢训练B（拉类重点）",
        "warmup": "跑步机：5分钟",
        "exercises": [
            {"name": "引体向上（或辅助引体向上）", "sets": "3组×8-10次", "target": "背部、二头肌", "rest": "90秒"},
            {"name": "哑铃平地卧推", "sets": "3组×12次", "target": "胸部", "rest": "75秒"},
            {"name": "坐姿划船", "sets": "3组×12次", "target": "背部", "rest": "75秒"},
            {"name": "哑铃侧平举", "sets": "3组×15次", "target": "肩部中束", "rest": "60秒"},
            {"name": "杠铃弯举", "sets": "3组×12次", "target": "二头肌", "rest": "60秒"},
        ],
        "cardio": "跑步机：中等强度 10分钟",
        "stretch": "背部、肩部、手臂拉伸"
    },
    5: {
        "day": "周五",
        "title": "下肢训练B",
        "warmup": "跑步机：5分钟",
        "exercises": [
            {"name": "硬拉", "sets": "3组×8次", "target": "全身后链", "rest": "90秒"},
            {"name": "箭步蹲", "sets": "3组×10次（每侧）", "target": "股四头肌、臀部", "rest": "75秒"},
            {"name": "腿屈举", "sets": "3组×12次", "target": "腘绳肌", "rest": "75秒"},
            {"name": "坐姿腿屈伸", "sets": "3组×15次", "target": "股四头肌", "rest": "60秒"},
            {"name": "平板支撑", "sets": "3组×45秒", "target": "核心", "rest": "45秒"},
        ],
        "cardio": "跳绳或战绳：高强度间歇 10分钟",
        "stretch": "全身拉伸"
    }
}

def get_workout_plan(day_of_week):
    """获取当天的训练计划"""
    return WORKOUT_PLANS.get(day_of_week)

def format_message(plan):
    """格式化训练计划消息"""
    exercises_text = ""
    for i, ex in enumerate(plan["exercises"], 1):
        exercises_text += f"{i}. **{ex['name']}** - {ex['sets']}\n"
        exercises_text += f"   - 目标：{ex['target']}\n"
        exercises_text += f"   - 休息：{ex['rest']}\n\n"

    message = f"""🏋️‍♀️ 早上好！今天是你健身的第{plan['day']}

**{plan['title']}**

⏱️ **训练时间**：50分钟

🔥 **热身（5分钟）**
- {plan['warmup']}

💪 **力量训练（35分钟）**
{exercises_text}
🏃 **有氧训练（10分钟）**
- {plan['cardio']}

🧘 **拉伸（5分钟）**
- {plan['stretch']}

---
💡 提醒：
- 训练前充分热身
- 保持动作标准，不要贪重量
- 感到疼痛立即停止
- 记录今天的重量和次数

加油！💪"""

    return message

def send_feishu_message(user_id, message):
    """通过OpenClaw发送飞书消息"""
    try:
        # 使用message工具发送消息
        cmd = [
            "openclaw", "message",
            "send",
            "--channel", "feishu",
            "--target", f"user:{user_id}",
            "--message", message
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"发送消息失败: {e}", file=sys.stderr)
        return False

def main():
    """主函数"""
    # 获取今天是周几（1=周一，7=周日）
    today = datetime.now().weekday() + 1

    # 检查是否是训练日（周二到周五）
    if today not in [2, 3, 4, 5]:
        print(f"今天不是训练日（周{['一','二','三','四','五','六','日'][today-1]}），跳过提醒")
        return

    # 获取训练计划
    plan = get_workout_plan(today)
    if not plan:
        print(f"找不到周{['一','二','三','四','五','六','日'][today-1]}的训练计划")
        return

    # 格式化消息
    message = format_message(plan)

    # 发送消息
    print(f"发送{plan['day']}训练提醒...")
    if send_feishu_message(USER_ID, message):
        print(f"✅ {plan['day']}训练提醒已发送")
    else:
        print(f"❌ {plan['day']}训练提醒发送失败")

if __name__ == "__main__":
    main()
