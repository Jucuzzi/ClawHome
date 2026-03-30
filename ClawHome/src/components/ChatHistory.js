import React, { useState, useEffect } from 'react';
import { Layout, Card, List, Typography, Tag, Spin, Empty, Space, Divider, theme } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { isMobile } from '../utils';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

function ChatHistory() {
  const { token } = useToken();
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      // 这里获取对话历史，假设API是/api/chat/history
      const response = await fetch('/api/chat/history');
      const data = await response.json();
      if (data.success) {
        setChatHistory(data.data || []);
      } else {
        // 如果API不存在，使用示例数据展示结构
        setChatHistory(getSampleData());
      }
    } catch (error) {
      console.error('获取对话历史失败:', error);
      // 出错时使用示例数据
      setChatHistory(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  const getSampleData = () => {
    return [
      {
        id: 1,
        role: 'user',
        content: '你好，请问今天天气怎么样？',
        timestamp: Date.now() - 3600000 * 2
      },
      {
        id: 2,
        role: 'assistant',
        content: '你好！今天天气很好，阳光明媚，非常适合出去走走。温度大约在20度左右，很舒服。',
        timestamp: Date.now() - 3600000 * 2 + 60000
      },
      {
        id: 3,
        role: 'user',
        content: '帮我写一段JavaScript代码，实现数组去重',
        timestamp: Date.now() - 3600000
      },
      {
        id: 4,
        role: 'assistant',
        content: '当然可以！这里有几种实现数组去重的方法：\n\n```javascript\n// 方法1: 使用Set\nconst uniqueArray = [...new Set(array)];\n\n// 方法2: 使用filter\nconst uniqueArray = array.filter((item, index, arr) => arr.indexOf(item) === index);\n\n// 方法3: 使用reduce\nconst uniqueArray = array.reduce((acc, current) => {\n  if (!acc.includes(current)) {\n    acc.push(current);\n  }\n  return acc;\n}, []);\n```\n\n推荐使用Set方法，它最简洁高效！',
        timestamp: Date.now() - 3600000 + 80000
      }
    ];
  };

  const getRoleInfo = (role) => {
    if (role === 'user') {
      return {
        label: '用户',
        color: 'blue',
        icon: <UserOutlined />
      };
    } else {
      return {
        label: 'AI',
        color: 'green',
        icon: <RobotOutlined />
      };
    }
  };

  return (
    <Layout style={{ padding: isMobile() ? '12px' : '24px', background: 'transparent' }}>
      <Content>
        <Title level={isMobile() ? 4 : 2} style={{ marginBottom: isMobile() ? 16 : 24 }}>AI聊天历史</Title>
        
        <Spin spinning={loading}>
          {chatHistory.length === 0 ? (
            <Empty description="暂无聊天记录" />
          ) : (
            <Card bordered={false}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {chatHistory.map((message, index) => {
                  const roleInfo = getRoleInfo(message.role);
                  return (
                    <Card
                      key={message.id || index}
                      size="small"
                      style={{
                        backgroundColor: message.role === 'user' ? token.colorInfoBg : token.colorSuccessBg,
                        borderLeft: `4px solid ${message.role === 'user' ? token.colorInfo : token.colorSuccess}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Tag color={roleInfo.color} icon={roleInfo.icon}>
                          {roleInfo.label}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(message.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </div>
                      <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Paragraph>
                    </Card>
                  );
                })}
              </Space>
            </Card>
          )}
        </Spin>
      </Content>
    </Layout>
  );
}

export default ChatHistory;
