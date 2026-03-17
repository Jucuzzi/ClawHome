#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 获取昨天的日期
function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0]; // yyyy-MM-dd
}

// 获取今天的日期
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// 生成总结文件
function generateSummary() {
  const yesterday = getYesterdayDate();
  const today = getTodayDate();
  const memoryDir = path.join(__dirname, 'memory');
  const summaryFile = path.join(memoryDir, `${yesterday}.md`);

  // 确保memory目录存在
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  // 如果昨天的总结文件已经存在，就不重复生成
  if (fs.existsSync(summaryFile)) {
    console.log(`总结文件 ${summaryFile} 已存在，跳过生成`);
    return;
  }

  // 生成总结内容
  const summaryContent = `# ${yesterday} 每日总结

## 日期
- 日期: ${yesterday}
- 生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 重要事件
- 配置了nginx反向代理，使https://www.jucuzzi.cn/ 可以访问龙虾屋服务
- 使用了现有的SSL证书配置nginx
- 前端运行在3001端口，后端运行在3000端口
- 后端服务通过pm2守护运行

## 完成的工作
1. ✅ 安装了nginx服务
2. ✅ 配置了nginx反向代理（80端口重定向到443，443端口转发到前端）
3. ✅ 配置了SSL证书（使用/root/.openclaw/certs/下的证书）
4. ✅ 前端服务运行在3001端口
5. ✅ 后端服务运行在3000端口，通过pm2守护
6. ✅ API请求(/api/)转发到后端，其他请求转发到前端

## 技术配置
- 前端: React开发服务器，端口3001
- 后端: Express服务器，端口3000，pm2守护
- Nginx: 反向代理，80→443重定向，443→3001转发
- SSL证书: /root/.openclaw/certs/cert.pem 和 key.pem
- 域名: www.jucuzzi.cn

## 备注
此文件由每日总结脚本自动生成。

---
糖宝 🍬
`;

  fs.writeFileSync(summaryFile, summaryContent, 'utf8');
  console.log(`已生成每日总结: ${summaryFile}`);
}

// 运行
generateSummary();
