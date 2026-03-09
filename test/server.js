const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
// 启用gzip压缩所有响应
app.use(compression());
const port = 3000;
// 硬编码绝对路径确保能访问memory目录
const basePath = '/root/.openclaw/workspace';
console.log('basePath:', basePath);

app.use(express.json());

// API routes
app.get('/api/list', (req, res) => {
  let reqPath = req.query.path || '.';
  if (reqPath === '.') reqPath = basePath;
  else reqPath = path.join(basePath, reqPath);
  console.log('requested path:', reqPath);
  
  const exists = fs.existsSync(reqPath);
  if (!exists) {
    return res.json({ error: '路径不存在', requestedPath: reqPath, exists: exists });
  }
  
  try {
    const items = fs.readdirSync(reqPath);
    const files = items.map(name => {
      const fullPath = path.join(reqPath, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        isDirectory: stat.isDirectory(),
        size: stat.size
      };
    });
    res.json({ files });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/api/read', (req, res) => {
  const { path: parentPath, name } = req.query;
  let fullParentPath = parentPath === '.' ? basePath : path.join(basePath, parentPath);
  const fullPath = path.join(fullParentPath, name);
  
  if (!fs.existsSync(fullPath)) {
    return res.json({ error: '文件不存在' });
  }
  if (fs.statSync(fullPath).isDirectory()) {
    return res.json({ error: '文件夹无法读取内容' });
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ content });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.post('/api/write', (req, res) => {
  const { path: parentPath, name, content } = req.body;
  let fullParentPath = parentPath === '.' ? basePath : path.join(basePath, parentPath);
  const fullPath = path.join(fullParentPath, name);
  
  try {
    fs.writeFileSync(fullPath, content, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.post('/api/create', (req, res) => {
  const { path: parentPath, name, type } = req.body;
  let fullParentPath = parentPath === '.' ? basePath : path.join(basePath, parentPath);
  const fullPath = path.join(fullParentPath, name);
  
  if (fs.existsSync(fullPath)) {
    return res.json({ error: '文件/文件夹已存在' });
  }
  
  try {
    if (type === 'directory') {
      fs.mkdirSync(fullPath);
    } else {
      fs.writeFileSync(fullPath, '');
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.post('/api/rename', (req, res) => {
  const { path: parentPath, oldName, newName } = req.body;
  let fullParentPath = parentPath === '.' ? basePath : path.join(basePath, parentPath);
  const oldPath = path.join(fullParentPath, oldName);
  const newPath = path.join(fullParentPath, newName);
  
  if (!fs.existsSync(oldPath)) {
    return res.json({ error: '原文件不存在' });
  }
  if (fs.existsSync(newPath)) {
    return res.json({ error: '新名称已存在' });
  }
  
  try {
    fs.renameSync(oldPath, newPath);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.post('/api/delete', (req, res) => {
  const { path: parentPath, name, isDirectory } = req.body;
  let fullParentPath = parentPath === '.' ? basePath : path.join(basePath, parentPath);
  const fullPath = path.join(fullParentPath, name);
  
  if (!fs.existsSync(fullPath)) {
    return res.json({ error: '文件不存在' });
  }
  
  try {
    if (isDirectory) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// 健身记录API - 按月存储，每个月一个JSON文件
const trainingBaseDir = path.join(basePath, 'user', 'training');

// 确保目录存在
if (!fs.existsSync(trainingBaseDir)) {
  fs.mkdirSync(trainingBaseDir, { recursive: true });
}

// 获取指定月份的健身记录
app.get('/api/training/month', (req, res) => {
  const { month } = req.query; // yyyy-MM
  const filePath = path.join(trainingBaseDir, `${month}.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ data: {} });
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const monthData = JSON.parse(content);
    res.json({ data: monthData });
  } catch (err) {
    res.json({ error: err.message, data: {} });
  }
});

// 保存指定月份的健身记录（某个日期更新后整个月份保存）
app.post('/api/training/save', (req, res) => {
  const { month, date, records } = req.body; // month: yyyy-MM
  const filePath = path.join(trainingBaseDir, `${month}.json`);
  
  try {
    let monthData = {};
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      monthData = JSON.parse(content);
    }
    monthData[date] = records;
    // 如果没有记录，删除这个key
    if (records.length === 0) {
      delete monthData[date];
    }
    // 确保目录存在
    if (!fs.existsSync(trainingBaseDir)) {
      fs.mkdirSync(trainingBaseDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(monthData, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message, success: false });
  }
});

// 获取所有月份列表（有记录的）
app.get('/api/training/months', (req, res) => {
  try {
    if (!fs.existsSync(trainingBaseDir)) {
      return res.json({ months: [] });
    }
    const files = fs.readdirSync(trainingBaseDir);
    const months = files.filter(name => name.endsWith('.json')).map(name => name.replace('.json', ''));
    res.json({ months });
  } catch (err) {
    res.json({ error: err.message, months: [] });
  }
});

// Serve static files first
app.use(express.static(path.join(__dirname, 'build')));

// EVERY other request gets the index.html (for client-side routing)
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
