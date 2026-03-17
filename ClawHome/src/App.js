import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Typography, Menu, ConfigProvider, Button, Dropdown, Space } from 'antd';
import * as antdTheme from 'antd/lib/theme';
import { FolderOpenOutlined, FileExcelOutlined, BulbOutlined, MoonOutlined, SettingOutlined, CalendarOutlined, MenuUnfoldOutlined, MenuFoldOutlined, MessageOutlined, DashboardOutlined } from '@ant-design/icons';
import FileManager from './components/FileManager';
import DailyReport from './components/DailyReport';
import Training from './components/Training';
import ChatHistory from './components/ChatHistory';
import Dashboard from './components/Dashboard';

const { darkAlgorithm, defaultAlgorithm } = antdTheme;
const { Header, Sider, Content } = Layout;
const { Title } = Typography;

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
  const [themeMode, setThemeMode] = useState(() => {
    // 从localStorage读取保存的主题
    return localStorage.getItem('app-theme-mode') || 'auto';
  });
  const [collapsed, setCollapsed] = useState(false);

  const [algorithm, setAlgorithm] = useState(() => getCurrentAlgorithm(themeMode));

  const getSelectedKey = () => {
    const pathname = location.pathname;
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/filemanager') return 'filemanager';
    if (pathname === '/dailyreport') return 'dailyreport';
    if (pathname === '/training') return 'training';
    if (pathname === '/chat') return 'chat';
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
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={collapsed ? 48 : 250} theme={getSiderTheme()} style={{ transition: 'width 0.2s' }}>
          <div style={{ padding: collapsed ? '16px 0' : '16px 0', textAlign: 'center', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: collapsed ? 0 : 8 }}>
            {!collapsed && (
              <>
                <img src="/lobster-logo.svg" width="32" height="32" alt="龙虾屋" />
                <Title level={4} style={{ margin: 0, color: themeMode === 'dark' || (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? '#fff' : '#000' }}>龙虾屋</Title>
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
            </Menu>
          )}
          <div style={{ position: 'absolute', bottom: 8, width: '100%', textAlign: 'center' }}>
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
        </Sider>
        <Layout>
          <Header style={{ background: getHeaderBg(), padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid #f0f0f0' }}>
            <Dropdown menu={{ items: menuItems, selectedKeys: [themeMode] }} placement="bottomRight">
              <Button type="text" icon={currentIcon()} />
            </Dropdown>
          </Header>
          <Content>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/filemanager" element={<FileManager />} />
              <Route path="/dailyreport" element={<DailyReport />} />
              <Route path="/training" element={<Training />} />
              <Route path="/chat" element={<ChatHistory />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
