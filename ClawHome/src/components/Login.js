import React, { useState } from 'react';
import { Form, Input, Button, Card, message, theme, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { isMobile } from '../utils';

const { Title, Text } = Typography;
const { useToken } = theme;

function Login() {
  const { token } = useToken();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        // 保存登录信息
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        message.success('登录成功！');
        
        // 跳转到之前访问的页面或首页
        const redirectPath = sessionStorage.getItem('redirectPath') || '/dashboard';
        sessionStorage.removeItem('redirectPath');
        navigate(redirectPath);
      } else {
        message.error(data.message || '登录失败，请检查账号密码');
      }
    } catch (err) {
      console.error('登录失败', err);
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: 0,
      phone: 'guest',
      name: '游客',
      role: 'guest',
      permissions: ['learning']
    };
    
    localStorage.setItem('user', JSON.stringify(guestUser));
    localStorage.setItem('token', 'guest-token');
    
    message.success('以游客身份登录！');
    
    // 游客默认跳转到学习记录页面
    navigate('/learning');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryBg} 100%)`,
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: 'none'
        }}
        bodyStyle={{
          padding: isMobile() ? '32px 24px' : '48px 40px'
        }}
      >
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <img 
              src="/lobster-logo.svg" 
              width={64} 
              height={64} 
              alt="龙虾屋" 
              style={{ marginBottom: 16 }}
            />
            <Title level={2} style={{ margin: 0, color: token.colorText }}>
              欢迎回来
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              登录龙虾屋，开启你的智能生活
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="手机号"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="密码"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<LoginOutlined />}
                block
                style={{
                  height: 48,
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Button
              type="link"
              onClick={handleGuestLogin}
              style={{ fontSize: 14 }}
            >
              游客访问
            </Button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              龙虾屋 © 2026
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default Login;
