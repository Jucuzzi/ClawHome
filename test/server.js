const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
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
