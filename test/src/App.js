import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Typography, Menu, ConfigProvider, Button, Dropdown, Space } from 'antd';
import * as antdTheme from 'antd/lib/theme';
import { FolderOpenOutlined, FileExcelOutlined, BulbOutlined, MoonOutlined, SettingOutlined } from '@ant-design/icons';
import FileManager from './components/FileManager';
import DailyReport from './components/DailyReport';

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

  const [algorithm, setAlgorithm] = useState(() => getCurrentAlgorithm(themeMode));

  const getSelectedKey = () => {
    const pathname = location.pathname;
    if (pathname === '/filemanager') return 'filemanager';
    if (pathname === '/dailyreport') return 'dailyreport';
    return 'filemanager';
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
        <Sider width={200} theme={getSiderTheme()}>
          <div style={{ padding: '16px 0', textAlign: 'center', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0  100  100" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="90" height="90" rx="15" fill="#1890ff" />
              <text x="50" y="62" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">龙虾</text>
              <text x="50" y="85" textAnchor="middle" fill="white" fontSize="14">屋</text>
            </svg>
            <Title level={4} style={{ margin: 0, color: themeMode === 'dark' || (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? '#fff' : '#000' }}>龙虾屋</Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ marginTop: 16 }}
            onClick={({key}) => navigate(key)}
          >
            <Menu.Item key="filemanager" icon={<FolderOpenOutlined />}>
              文件管理器
            </Menu.Item>
            <Menu.Item key="dailyreport" icon={<FileExcelOutlined />}>
              每日汇报
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ background: getHeaderBg(), padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid #f0f0f0' }}>
            <Dropdown menu={{ items: menuItems, selectedKeys: [themeMode] }} placement="bottomRight">
              <Button type="text" icon={currentIcon()} />
            </Dropdown>
          </Header>
          <Content>
            <Routes>
              <Route path="/" element={<Navigate to="/filemanager" replace />} />
              <Route path="/filemanager" element={<FileManager />} />
              <Route path="/dailyreport" element={<DailyReport />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
