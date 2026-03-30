import React, { useState, useEffect } from 'react';
import { Typography, Card, List, Empty, Tag, Space, Button, message, Modal, theme } from 'antd';
import { FileTextOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { isMobile } from '../utils';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

function LearningRecords() {
  const { token } = useToken();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await fetch('/api/learning/records');
      const data = await response.json();
      setRecords(data.data || []);
    } catch (err) {
      console.error('加载学习记录失败', err);
      // 如果API不可用，显示一些示例数据
      setRecords([
        {
          id: 1,
          title: 'A2A互相注册和发现机制',
          category: 'Agent开发',
          date: '2026-03-24',
          status: 'completed',
          summary: '详细学习了A2A（Agent-to-Agent）的互相注册和发现机制，包括注册中心设计、Agent发现流程、健康检查机制等核心概念。'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record) => {
    navigate(`/learning/${record.id}`);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条学习记录吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/learning/records/${id}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (data.success) {
            message.success('删除成功');
            setRecords(prev => prev.filter(r => r.id !== id));
          } else {
            message.error('删除失败');
          }
        } catch (err) {
          console.error('删除失败', err);
          message.error('删除失败');
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'processing';
      case 'planned': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in-progress': return '进行中';
      case 'planned': return '计划中';
      default: return status;
    }
  };

  return (
    <div style={{ padding: isMobile() ? '12px' : '24px', background: token.colorBgContainer, minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: isMobile() ? '16px' : '24px' }}>
        <Title level={isMobile() ? 4 : 2} style={{ margin: 0 }}>
          📚 学习记录
        </Title>
        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          记录我的Agent学习历程
        </Paragraph>
      </div>

      <Card>
        {records.length === 0 ? (
          <Empty description="暂无学习记录" />
        ) : (
          <List
            dataSource={records}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(item)}
                  >
                    查看
                  </Button>,
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id)}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 24, color: token.colorPrimary }} />}
                  title={
                    <Space>
                      <Text strong>{item.title}</Text>
                      <Tag color={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Space>
                        <Tag color="blue">{item.category}</Tag>
                        <Text type="secondary">{dayjs(item.date).format('YYYY-MM-DD')}</Text>
                      </Space>
                      <Text type="secondary" ellipsis={{ tooltip: item.summary }}>
                        {item.summary}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}

export default LearningRecords;
