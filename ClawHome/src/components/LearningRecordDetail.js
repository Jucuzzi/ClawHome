import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Tag, Space, Button, message, Modal, Spin, theme, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import MarkdownViewer from './MarkdownViewer';
import { isMobile } from '../utils';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

function LearningRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useToken();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/learning/records/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setRecord(data.data);
      } else {
        message.error('加载失败');
        navigate('/learning');
      }
    } catch (err) {
      console.error('加载学习记录失败', err);
      message.error('加载失败');
      navigate('/learning');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    message.confirm({
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
            navigate('/learning');
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 64px)' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div style={{ 
      padding: isMobile() ? '12px' : '24px', 
      background: token.colorBgContainer, 
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 顶部操作栏 - 固定不滚动 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
        flexShrink: 0
      }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/learning')}
          >
            返回
          </Button>
          <Breadcrumb separator="/">
            <Breadcrumb.Item onClick={() => navigate('/learning')} style={{ cursor: 'pointer' }}>
            学习记录
            </Breadcrumb.Item>
          </Breadcrumb>
        </Space>
        <Button 
          danger 
          icon={<DeleteOutlined />}
          onClick={handleDelete}
        >
          删除
        </Button>
      </div>

      {/* 元信息 - 固定不滚动 */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <Space wrap size="small">
          <Tag color="blue">{record.category}</Tag>
          <Tag color={getStatusColor(record.status)}>
            {getStatusText(record.status)}
          </Tag>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {dayjs(record.date).format('YYYY-MM-DD')}
          </Text>
        </Space>
      </div>

      {/* 内容区域 - 撑满剩余空间，可滚动 */}
      <div style={{ 
        background: token.colorBgContainer,
        borderRadius: '8px',
        padding: '24px',
        flex: 1,
        overflow: 'auto',
        minHeight: 0
      }}>
        <MarkdownViewer content={record.content || record.summary} />
      </div>
    </div>
  );
}

export default LearningRecordDetail;
