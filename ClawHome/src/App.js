import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Typography, Menu, ConfigProvider, Button, Dropdown, Space, Drawer, theme } from 'antd';
import * as antdTheme from 'antd/lib/theme';
import { FolderOpenOutlined, FileExcelOutlined, BulbOutlined, MoonOutlined, SettingOutlined, CalendarOutlined, MenuUnfoldOutlined, MenuFoldOutlined, MessageOutlined, DashboardOutlined, MenuOutlined, BookOutlined, LockOutlined, LogoutOutlined } from '@ant-design/icons';
import FileManager from './components/FileManager';
import DailyReport from './components/DailyReport';
import Training from './components/Training';
import ChatHistory from './components/ChatHistory';
import Dashboard from './components/Dashboard';
import LearningRecords from './components/LearningRecords';
import LearningRecordDetail from './components/LearningRecordDetail';
import Login from './components/Login';
import PermissionManagement from './components/PermissionManagement';
import RoleManagement from './components/RoleManagement';
import ProtectedRoute from './components/ProtectedRoute';

const { darkAlgorithm, defaultAlgorithm } = antdTheme;
const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { useToken } = theme;

// 检测是否为移动端
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

// 主题选项
const themeOptions = [
  { key: 'light', label: '浅色模式', icon: <BulbOutlined /> },
  { key: 'dark', label: '深色模式', icon: <MoonOutlined /> },
  { key: 'auto', label: '跟随系统', icon: <SettingOutlined /> },
];

// 获取当前应该使用的算法
const getCurrentAlgorithm = (themeMode) => {
  if (themeMode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? darkAlgorithm : defaultAlgorithm;
  }
  return themeMode === 'dark' ? darkAlgorithm : defaultAlgorithm;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useToken();
  const [themeMode, setThemeMode] = useState(() => {
    // 从localStorage读取保存的主题
    return localStorage.getItem('app-theme-mode') || 'auto';
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile());
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  });

  const [algorithm, setAlgorithm] = useState(() => getCurrentAlgorithm(themeMode));

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  // 监听窗口大小变化，更新移动端状态
  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getSelectedKey = () => {
    const pathname = location.pathname;
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/filemanager') return 'filemanager';
    if (pathname === '/dailyreport') return 'dailyreport';
    if (pathname === '/training') return 'training';
    if (pathname === '/chat') return 'chat';
    if (pathname.startsWith('/learning')) return 'learning';
    if (pathname === '/permission') return 'permission';
    if (pathname === '/role') return 'role';
    return 'dashboard';
  };

  // 根据主题模式获取算法
  useEffect(() => {
    localStorage.setItem('app-theme-mode', themeMode);
    setAlgorithm(getCurrentAlgorithm(themeMode));
    
    if (themeMode === 'auto') {
      // 监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (themeMode === 'auto') {
          setAlgorithm(getCurrentAlgorithm(themeMode));
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // 获取侧边栏主题
  const getSiderTheme = () => {
    if (themeMode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return themeMode === 'dark' ? 'dark' : 'light';
  };

  // 获取header背景色
  const getHeaderBg = () => {
    if (themeMode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? '#000' : '#fff';
    }
    return themeMode === 'dark' ? '#000' : '#fff';
  };

  const menuItems = themeOptions.map(option => ({
    key: option.key,
    label: (
      <Space onClick={() => setThemeMode(option.key)}>
        {option.icon}
        {option.label}
      </Space>
    )
  }));

  const currentIcon = () => {
    const option = themeOptions.find(o => o.key === themeMode);
    return option?.icon || <SettingOutlined />;
  };

  return (
    <ConfigProvider theme={{ algorithm }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={
          <Layout style={{ minHeight: '100vh' }}>
            {/* PC端侧边栏 */}
            {!isMobileDevice && (
              <Sider width={collapsed ? 48 : 250} theme={getSiderTheme()} style={{ transition: 'width 0.2s' }}>
                <div style={{ padding: collapsed ? '16px 0' : '16px 0', textAlign: 'center', borderBottom: `1px solid ${token.colorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: collapsed ? 0 : 8 }}>
                  {!collapsed && (
                    <>
                      <img src="/lobster-logo.svg" width="32" height="32" alt="龙虾屋" />
                      <Title level={4} style={{ margin: 0, color: token.colorText }}>龙虾屋</Title>
                    </>
                  )}
                  {collapsed && (
                    <img src="/lobster-logo.svg" width="32" height="32" alt="龙虾屋" />
                  )}
                </div>
                {!collapsed && (
                  <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    style={{ marginTop: 16 }}
                    onClick={({key}) => navigate(key)}
                  >
                    <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                      仪表盘
                    </Menu.Item>
                    <Menu.Item key="filemanager" icon={<FolderOpenOutlined />}>
                      文件管理器
                    </Menu.Item>
                    <Menu.Item key="dailyreport" icon={<FileExcelOutlined />}>
                      每日汇报
                    </Menu.Item>
                    <Menu.Item key="training" icon={<CalendarOutlined />}>
                      健身计划
                    </Menu.Item>
                    <Menu.Item key="chat" icon={<MessageOutlined />}>
                      AI聊天
                    </Menu.Item>
                    <Menu.Item key="learning" icon={<BookOutlined />}>
                      学习记录
                    </Menu.Item>
                    {user?.role === 'admin' && (
                      <Menu.Item key="permission" icon={<LockOutlined />}>
                        权限管理
                      </Menu.Item>
                    )}
                    {user?.role === 'admin' && (
                      <Menu.Item key="role" icon={<LockOutlined />}>
                        角色管理
                      </Menu.Item>
                    )}
                  </Menu>
                )}
                <div style={{ position: 'absolute', bottom: 8, width: '100%', textAlign: 'center' }}>
                  {user && (
                    <Button 
                      type="text" 
                      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                      onClick={() => setCollapsed(!collapsed)}
                    />
                  )}
                </div>
              </Sider>
            )}

            {/* 移动端抽屉菜单 */}
            <Drawer
              title="龙虾屋"
              placement="left"
              onClose={() => setMobileMenuVisible(false)}
              open={mobileMenuVisible}
              width={250}
            >
              <Menu
                mode="inline"
                selectedKeys={[getSelectedKey()]}
                onClick={({key}) => {
                  navigate(key);
                  setMobileMenuVisible(false);
                }}
              >
                <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                  仪表盘
                </Menu.Item>
                <Menu.Item key="filemanager" icon={<FolderOpenOutlined />}>
                  文件管理器
                </Menu.Item>
                <Menu.Item key="dailyreport" icon={<FileExcelOutlined />}>
                  每日汇报
                </Menu.Item>
                <Menu.Item key="training" icon={<CalendarOutlined />}>
                  健身计划
                </Menu.Item>
                <Menu.Item key="chat" icon={<MessageOutlined />}>
                  AI聊天
                </Menu.Item>
                <Menu.Item key="learning" icon={<BookOutlined />}>
                  学习记录
                </Menu.Item>
                {user?.role === 'admin' && (
                  <Menu.Item key="permission" icon={<LockOutlined />}>
                    权限管理
                  </Menu.Item>
                )}
                {user?.role === 'admin' && (
                  <Menu.Item key="role" icon={<LockOutlined />}>
                    角色管理
                  </Menu.Item>
                )}
              </Menu>
            </Drawer>

            <Layout>
              <Header style={{ background: getHeaderBg(), padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${token.colorBorder}` }}>
                <Space>
                  {isMobileDevice && (
                    <Button 
                      type="text" 
                      icon={<MenuOutlined />} 
                      onClick={() => setMobileMenuVisible(true)}
                    />
                  )}
                </Space>
                <Space>
                  {user && (
                    <Button 
                      type="text" 
                      icon={<LogoutOutlined />}
                      onClick={handleLogout}
                    >
                      退出
                    </Button>
                  )}
                  <Dropdown menu={{ items: menuItems, selectedKeys: [themeMode] }} placement="bottomRight">
                    <Button type="text" icon={currentIcon()} />
                  </Dropdown>
                </Space>
              </Header>
              <Content style={{ background: token.colorBgLayout, minHeight: 'calc(100vh - 64px)' }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/filemanager" element={
                    <ProtectedRoute>
                      <FileManager />
                    </ProtectedRoute>
                  } />
                  <Route path="/dailyreport" element={
                    <ProtectedRoute>
                      <DailyReport />
                    </ProtectedRoute>
                  } />
                  <Route path="/training" element={
                    <ProtectedRoute>
                      <Training />
                    </ProtectedRoute>
                  } />
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <ChatHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/learning" element={
                    <ProtectedRoute>
                      <LearningRecords />
                    </ProtectedRoute>
                  } />
                  <Route path="/learning/:id" element={
                    <ProtectedRoute>
                      <LearningRecordDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/permission" element={
                    <ProtectedRoute requireAdmin={true}>
                      <PermissionManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/role" element={
                    <ProtectedRoute requireAdmin={true}>
                      <RoleManagement />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        } />
      </Routes>
    </ConfigProvider>
  );
}

export default App;
