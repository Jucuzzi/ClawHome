const fs = require('fs');
const { execSync } = require('child_process');
const { feishu_doc } = require('openclaw-tools');

// 获取今天日期
const today = new Date();
const dateStr = today.toISOString().split('T')[0];

// 获取简短总结（这里取当天星期加上总结）
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const summary = `${dateStr} ${weekDays[today.getDay()]}日常`;

// 读取今日memory记录
let dailyContent = '';
const todayMemoryPath = `/root/.openclaw/workspace/memory/${dateStr}.md`;
if (fs.existsSync(todayMemoryPath)) {
  dailyContent = fs.readFileSync(todayMemoryPath, 'utf8');
}

// 读取当前openclaw配置
const configPath = '/root/.openclaw/openclaw.json';
const configContent = fs.readFileSync(configPath, 'utf8');

// 整理内容
let content = `# ${dateStr} 每日总结\n\n`;
content += `## 今日动态\n\n${dailyContent || '暂无记录'}\n\n`;
content += `## 今日操作记录\n\n`;

// 获取今天系统日志里的操作
try {
  const history = execSync('find /root/.openclaw/workspace -newerct "1 day ago" -type f | grep -E "(log|history)" | head -20').toString();
  content += "今天修改/创建的文件:\n```\n" + history + "```\n\n";
} catch (e) {
  content += "无法获取操作记录\n\n";
}

content += `## 当前配置文件\n\n\`\`\`json\n${configContent}\n\`\`\`\n`;

// 创建飞书文档
async function createDoc() {
  const result = await feishu_doc.create({
    title: summary,
    content: content
  });
  console.log('Created doc:', result);
}

createDoc().catch(err => {
  console.error('Error creating doc:', err);
  process.exit(1);
});
