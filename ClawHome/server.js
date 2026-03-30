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

// 仪表盘 API - 身体数据
const dashboardBaseDir = path.join(basePath, 'user', 'dashboard');

// 确保目录存在
if (!fs.existsSync(dashboardBaseDir)) {
  fs.mkdirSync(dashboardBaseDir, { recursive: true });
}

// 获取身体数据
app.get('/api/dashboard/body-data', (req, res) => {
  const filePath = path.join(dashboardBaseDir, 'body-data.json');
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ data: null });
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    res.json({ data });
  } catch (err) {
    res.json({ error: err.message, data: null });
  }
});

// 保存身体数据
app.post('/api/dashboard/body-data', (req, res) => {
  const filePath = path.join(dashboardBaseDir, 'body-data.json');
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message, success: false });
  }
});

// 获取待办事项
app.get('/api/dashboard/todos', (req, res) => {
  const filePath = path.join(dashboardBaseDir, 'todos.json');
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ data: [] });
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    res.json({ data });
  } catch (err) {
    res.json({ error: err.message, data: [] });
  }
});

// 保存待办事项
app.post('/api/dashboard/todos', (req, res) => {
  const filePath = path.join(dashboardBaseDir, 'todos.json');
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message, success: false });
  }
});

// 权限管理 API
const authBaseDir = path.join(basePath, 'user', 'auth');

// 确保目录存在
if (!fs.existsSync(authBaseDir)) {
  fs.mkdirSync(authBaseDir, { recursive: true });
}

// 初始化默认管理员用户
const usersFilePath = path.join(authBaseDir, 'users.json');
if (!fs.existsSync(usersFilePath)) {
  const defaultUsers = [
    {
      id: 1,
      phone: '15958032243',
      password: 'nwkwlfhh8',
      name: '王力丰',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(usersFilePath, JSON.stringify(defaultUsers, null, 2), 'utf8');
}

// 登录
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  
  try {
    const content = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(content);
    
    const user = users.find(u => u.phone === phone && u.password === password);
    
    if (user) {
      // 生成简单的token（实际项目中应该使用JWT）
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      // 返回用户信息（不包含密码）
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        user: userWithoutPassword,
        token
      });
    } else {
      res.json({
        success: false,
        message: '账号或密码错误'
      });
    }
  } catch (err) {
    console.error('登录失败', err);
    res.json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

// 获取用户列表
app.get('/api/auth/users', (req, res) => {
  try {
    const content = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(content);
    
    // 不返回密码
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    
    res.json({ data: usersWithoutPassword });
  } catch (err) {
    console.error('获取用户列表失败', err);
    res.json({ error: err.message, data: [] });
  }
});

// 添加用户
app.post('/api/auth/users', (req, res) => {
  const { phone, password, name, role } = req.body;
  
  try {
    const content = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(content);
    
    // 检查手机号是否已存在
    if (users.find(u => u.phone === phone)) {
      return res.json({
        success: false,
        message: '该手机号已注册'
      });
    }
    
    // 添加新用户
    const newUser = {
      id: Date.now(),
      phone,
      password,
      name,
      role,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('添加用户失败', err);
    res.json({
      success: false,
      message: '添加用户失败'
    });
  }
});

// 更新用户
app.put('/api/auth/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { phone, name, role, password } = req.body;
  
  try {
    const content = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(content);
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 更新用户信息
    users[userIndex] = {
      ...users[userIndex],
      phone,
      name,
      role,
      ...(password && { password })
    };
    
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    
    const { password: _, ...userWithoutPassword } = users[userIndex];
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('更新用户失败', err);
    res.json({
      success: false,
      message: '更新用户失败'
    });
  }
});

// 删除用户
app.delete('/api/auth/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  try {
    const content = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(content);
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 不允许删除管理员
    if (users[userIndex].role === 'admin') {
      return res.json({
        success: false,
        message: '不能删除超级管理员'
      });
    }
    
    users.splice(userIndex, 1);
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    
    res.json({ success: true });
  } catch (err) {
    console.error('删除用户失败', err);
    res.json({
      success: false,
      message: '删除用户失败'
    });
  }
});

// Serve static files first

// 初始化默认角色
const rolesFilePath = path.join(authBaseDir, 'roles.json');
if (!fs.existsSync(rolesFilePath)) {
  const defaultRoles = [
    {
      id: 1,
      key: 'admin',
      name: '超级管理员',
      description: '拥有所有权限',
      permissions: ['dashboard', 'filemanager', 'dailyreport', 'training', 'chat', 'learning', 'permission', 'role'],
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      key: 'guest',
      name: '游客',
      description: '只能查看学习记录',
      permissions: ['learning'],
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      key: 'user',
      name: '普通用户',
      description: '可以访问基本功能',
      permissions: ['dashboard', 'filemanager', 'dailyreport', 'training', 'chat', 'learning'],
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(rolesFilePath, JSON.stringify(defaultRoles, null, 2), 'utf8');
}

// 角色管理 API

// 获取角色列表
app.get('/api/auth/roles', (req, res) => {
  try {
    const content = fs.readFileSync(rolesFilePath, 'utf8');
    const roles = JSON.parse(content);
    
    res.json({ data: roles });
  } catch (err) {
    console.error('获取角色列表失败', err);
    res.json({ error: err.message, data: [] });
  }
});

// 添加角色
app.post('/api/auth/roles', (req, res) => {
  const { key, name, description, permissions } = req.body;
  
  try {
    const content = fs.readFileSync(rolesFilePath, 'utf8');
    const roles = JSON.parse(content);
    
    // 检查角色key是否已存在
    if (roles.find(r => r.key === key)) {
      return res.json({
        success: false,
        message: '该角色key已存在'
      });
    }
    
    // 添加新角色
    const newRole = {
      id: Date.now(),
      key,
      name,
      description,
      permissions: permissions || [],
      createdAt: new Date().toISOString()
    };
    
    roles.push(newRole);
    fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2), 'utf8');
    
    res.json({
      success: true,
      role: newRole
    });
  } catch (err) {
    console.error('添加角色失败', err);
    res.json({
      success: false,
      message: '添加角色失败'
    });
  }
});

// 更新角色
app.put('/api/auth/roles/:id', (req, res) => {
  const roleId = parseInt(req.params.id);
  const { name, description, permissions } = req.body;
  
  try {
    const content = fs.readFileSync(rolesFilePath, 'utf8');
    const roles = JSON.parse(content);
    
    const roleIndex = roles.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) {
      return res.json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 更新角色信息
    roles[roleIndex] = {
      ...roles[roleIndex],
      name,
      description,
      permissions: permissions || []
    };
    
    fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2), 'utf8');
    
    res.json({
      success: true,
      role: roles[roleIndex]
    });
  } catch (err) {
    console.error('更新角色失败', err);
    res.json({
      success: false,
      message: '更新角色失败'
    });
  }
});

// 删除角色
app.delete('/api/auth/roles/:id', (req, res) => {
  const roleId = parseInt(req.params.id);
  
  try {
    const content = fs.readFileSync(rolesFilePath, 'utf8');
    const roles = JSON.parse(content);
    
    const roleIndex = roles.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) {
      return res.json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 不允许删除系统角色
    if (['admin', 'guest', 'user'].includes(roles[roleIndex].key)) {
      return res.json({
        success: false,
        message: '不能删除系统角色'
      });
    }
    
    roles.splice(roleIndex, 1);
    fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2), 'utf8');
    
    res.json({ success: true });
  } catch (err) {
    console.error('删除角色失败', err);
    res.json({
      success: false,
      message: '删除角色失败'
    });
  }
});

// 角色管理 API

// 获取角色列表
app.get('/api/auth/roles', (req, res) => {
  try {
    const content = fs.readFileSync(rolesFilePath, 'utf8');
    const roles = JSON.parse(content);
    
    res.json({ data: roles });
  } catch (err) {
    console.error('获取角色列表失败', err);
    res.json({ error: err.message, data: [] });
  }
});

// 添加角色
app.post('/api/auth/roles', (req, res) => {
  const { key, name, description, permissions } = req.body;
  
  try {
    const content = fs.readFileSync(rolesFilePath, 'utf8');
    const roles = JSON.parse(content);
    
    // 检查角色key是否已存在
    if (roles.find(r => r.key === key)) {
      return res.json({
        success: false,
        message: '该角色key已存在'
      });
    }
    
    // 添加新角色
    const newRole = {
      id: Date.now(),
      key,
      name,
      description,
      permissions: permissions || [],
      createdAt: new Date().toISOString()
    };
    
    roles.push(newRole);
    fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2), 'utf8');
    
    res.json({
      success: true,
      role: newRole
    });
  } catch (err) {
    console.error('添加角色失败', err);
    res.json({
      success: false,
      message: '添加角色失败'
    });
  }
});

// 更新角色
app.put('/api/auth/roles/:id', (req, res) => {
  const roleId = parseInt(req.params.id);
  const { name, description, permissions } = req.body;
  
  try {
    const content = fs.readFileSync(rolesFilePath, 'utf8');
    const roles = JSON.parse(content);
    
    const roleIndex = roles.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) {
      return res.json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 更新角色信息
    roles[roleIndex] = {
      ...roles[roleIndex],
      name,
      description,
      permissions: permissions || []
    };
    
    fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2), 'utf8');
    
    res.json({
      success: true,
      role: roles[roleIndex]
    });
  } catch (err) {
    console.error('更新角色失败', err);
    res.json({
      success: false,
      message: '更新角色失败'
    });
  }
});

// 删除角色
app.delete('/api/auth/roles/:id', (req, res) => {
  const roleId = parseInt(req.params.id);
  
  try {
    const content = fs.readFileSync(rolesFilePath, 'utf8');
    const roles = JSON.parse(content);
    
    const roleIndex = roles.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) {
      return res.json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 不允许删除系统角色
    if (['admin', 'guest', 'user'].includes(roles[roleIndex].key)) {
      return res.json({
        success: false,
        message: '不能删除系统角色'
      });
    }
    
    roles.splice(roleIndex, 1);
    fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2), 'utf8');
    
    res.json({ success: true });
  } catch (err) {
    console.error('删除角色失败', err);
    res.json({
      success: false,
      message: '删除角色失败'
    });
  }
});

// 学习记录 API
const learningBaseDir = path.join(basePath, 'user', 'learning');

// 确保目录存在
if (!fs.existsSync(learningBaseDir)) {
  fs.mkdirSync(learningBaseDir, { recursive: true });
}

// 获取所有学习记录
app.get('/api/learning/records', (req, res) => {
  const filePath = path.join(learningBaseDir, 'records.json');
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ success: true, data: [] });
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const records = JSON.parse(content);
    res.json({ success: true, data: records });
  } catch (err) {
    console.error('获取学习记录失败', err);
    res.json({ error: err.message, data: [] });
  }
});

// 获取单个学习记录
app.get('/api/learning/records/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const filePath = path.join(learningBaseDir, 'records.json');
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ success: false, message: '记录不存在' });
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const records = JSON.parse(content);
    const record = records.find(r => r.id === id);
    
    if (!record) {
      return res.json({ success: false, message: '记录不存在' });
    }
    
    res.json({ success: true, data: record });
  } catch (err) {
    console.error('获取学习记录失败', err);
    res.json({ success: false, message: '获取失败' });
  }
});

// 创建学习记录
app.post('/api/learning/records', (req, res) => {
  const { title, category, date, status, summary, content } = req.body;
  
  try {
    const filePath = path.join(learningBaseDir, 'records.json');
    let records = [];
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      records = JSON.parse(fileContent);
    }
    
    const newRecord = {
      id: Date.now(),
      title,
      category,
      date: date || new Date().toISOString().split('T')[0],
      status: status || 'planned',
      summary,
      content,
      createdAt: new Date().toISOString()
    };
    
    records.unshift(newRecord); // 新记录放在最前面
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf8');
    
    res.json({ success: true, data: newRecord });
  } catch (err) {
    console.error('创建学习记录失败', err);
    res.json({ success: false, message: '创建失败' });
  }
});

// 更新学习记录
app.put('/api/learning/records/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, category, date, status, summary, content } = req.body;
  const filePath = path.join(learningBaseDir, 'records.json');
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ success: false, message: '记录不存在' });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = JSON.parse(fileContent);
    const recordIndex = records.findIndex(r => r.id === id);
    
    if (recordIndex === -1) {
      return res.json({ success: false, message: '记录不存在' });
    }
    
    // 更新记录
    records[recordIndex] = {
      ...records[recordIndex],
      title,
      category,
      date,
      status,
      summary,
      content,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf8');
    
    res.json({ success: true, data: records[recordIndex] });
  } catch (err) {
    console.error('更新学习记录失败', err);
    res.json({ success: false, message: '更新失败' });
  }
});

// 删除学习记录
app.delete('/api/learning/records/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const filePath = path.join(learningBaseDir, 'records.json');
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ success: false, message: '记录不存在' });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = JSON.parse(fileContent);
    const recordIndex = records.findIndex(r => r.id === id);
    
    if (recordIndex === -1) {
      return res.json({ success: false, message: '记录不存在' });
    }
    
    records.splice(recordIndex, 1);
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf8');
    
    res.json({ success: true });
  } catch (err) {
    console.error('删除学习记录失败', err);
    res.json({ success: false, message: '删除失败' });
  }
});

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
