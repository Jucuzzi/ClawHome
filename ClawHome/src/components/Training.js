import React, { useState, useEffect } from 'react';
import { Typography, Calendar, Card, List, Input, Button, Space, Tag, Modal, Form, message, Spin, Checkbox, theme } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { isMobile } from '../utils';

const { useToken } = theme;

const trainingParts = [
  { label: '肩', value: '肩' },
  { label: '背', value: '背' },
  { label: '腿', value: '腿' },
  { label: '胸', value: '胸' },
  { label: '腹', value: '腹' },
  { label: '有氧', value: '有氧' },
  { label: '其他', value: '其他' },
];

function Training() {
  const { token } = useToken();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [records, setRecords] = useState([]);
  const [monthDataCache, setMonthDataCache] = useState({});
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const dateStr = selectedDate.format('YYYY-MM-DD');

  // 加载月份数据
  const loadMonthData = async (month) => {
    if (monthDataCache[month]) {
      // 已经缓存，直接用
      return;
    }

    setLoadingMonth(true);
    try {
      const response = await fetch(`/api/training/month?month=${month}`);
      const data = await response.json();
      if (data.data) {
        setMonthDataCache(prev => ({
          ...prev,
          [month]: data.data
        }));
      }
    } catch (err) {
      console.error('加载月份数据失败', err);
      messageApi.error('加载月份数据失败');
    } finally {
      setLoadingMonth(false);
    }
  };

  // 初始化加载当前月份
  useEffect(() => {
    loadMonthData(currentMonth);
  }, []);

  // 日期改变加载记录
  useEffect(() => {
    const month = selectedDate.format('YYYY-MM-DD').slice(0, 7);
    const monthData = monthDataCache[month] || {};
    setRecords(monthData[dateStr] || []);
  }, [selectedDate, monthDataCache]);

  // 月份改变重新加载
  const onPanelChange = (value) => {
    const newMonth = value.format('YYYY-MM');
    setSelectedDate(value);
    setCurrentMonth(newMonth);
    loadMonthData(newMonth);
  };

  const onSelect = (date) => {
    setSelectedDate(date);
    const month = date.format('YYYY-MM');
    const key = date.format('YYYY-MM-DD');
    const monthData = monthDataCache[month] || {};
    const dayRecords = monthData[key] || [];
    
    if (dayRecords.length > 0) {
      // 有记录，打开编辑弹窗
      setEditingIndex(0);
      form.setFieldsValue(dayRecords[0]);
      setModalVisible(true);
    } else {
      // 没有记录，打开新增弹窗
      setEditingIndex(null);
      form.resetFields();
      setModalVisible(true);
    }
  };

  const openAddModal = () => {
    setEditingIndex(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditRecord = (index) => {
    setEditingIndex(index);
    const record = records[index];
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSaveRecord = (values) => {
    const month = selectedDate.format('YYYY-MM');
    const key = selectedDate.format('YYYY-MM-DD');
    const monthData = monthDataCache[month] || {};
    const dayRecords = monthData[key] || [];
    
    let newRecords = [...dayRecords];
    if (editingIndex !== null) {
      // 编辑已有记录
      newRecords[editingIndex] = values;
    } else {
      // 添加新记录
      newRecords.push(values);
    }
    
    // 更新缓存
    const newMonthData = {
      ...monthDataCache[month],
      [key]: newRecords
    };
    setMonthDataCache(prev => ({
      ...prev,
      [month]: newMonthData
    }));

    // 保存到后端
    saveToBackend(month, key, newRecords);
    setModalVisible(false);
    setEditingIndex(null);
    form.resetFields();
  };

  const saveToBackend = async (month, date, newRecords) => {
    try {
      const response = await fetch('/api/training/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          month, 
          date, 
          records: newRecords 
        })
      });
      const data = await response.json();
      if (data.success) {
        messageApi.success('保存成功');
      } else {
        messageApi.error(data.error || '保存失败');
      }
    } catch (err) {
      messageApi.error('保存失败');
    }
  };

  const handleDeleteRecord = () => {
    const month = selectedDate.format('YYYY-MM');
    const key = selectedDate.format('YYYY-MM-DD');
    
    // 删除当天记录
    const newMonthData = { ...monthDataCache[month] };
    delete newMonthData[key];
    
    setMonthDataCache(prev => ({
      ...prev,
      [month]: newMonthData
    }));

    // 保存到后端（空数组会删除记录）
    saveToBackend(month, key, []);
    
    setModalVisible(false);
    setEditingIndex(null);
    form.resetFields();
  };

  // 计算本月总训练次数
  const getMonthTrainingCount = () => {
    const data = monthDataCache[currentMonth] || {};
    let count = 0;
    Object.keys(data).forEach(date => {
      if (data[date].length > 0) {
        count++;
      }
    });
    return count;
  };

  // 自定义日期单元格渲染
  const dateCellRender = (value) => {
    const month = value.format('YYYY-MM');
    const key = value.format('YYYY-MM-DD');
    // 只有当前月份有数据才渲染
    const monthData = monthDataCache[month] || {};
    const data = monthData[key];
    if (!data || data.length === 0) return null;

    // 收集所有部位
    const parts = [...new Set(data.flatMap(r => r.parts || []))];
    // 计算总时长
    const totalDuration = data.reduce((sum, r) => {
      const duration = r.duration || '';
      const num = parseInt(duration);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
    // 获取第一个记录的简短备注
    const firstContent = data[0]?.content?.split('\n')[0] || '';
    
    return (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        gap: 4,
        padding: 4
      }}>
        {/* 训练部位标签 */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2
        }}>
          {parts.map(part => (
            <Tag key={part} color="blue" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
              {part}
            </Tag>
          ))}
        </div>

        {/* 总时长 */}
        {totalDuration > 0 && (
          <div style={{ fontSize: 12, color: token.colorPrimary, fontWeight: 500 }}>
            ⏱ {totalDuration} 分钟
          </div>
        )}

        {/* 第一个记录的简短备注 */}
        {firstContent && (
          <div style={{
            fontSize: 11,
            color: token.colorTextSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {firstContent}
          </div>
        )}
      </div>
    );
  };

  // 单元格渲染
  const cellRender = (current, info) => {
    if (info.type === 'date') {
      return dateCellRender(current);
    }
    return info.originNode;
  };

  const hasRecords = records.length > 0;

  return (
    <div style={{ margin: isMobile() ? '8px' : '16px', padding: isMobile() ? '12px' : '16px', background: token.colorBgContainer, borderRadius: '4px', height: 'calc(100vh - 64px - 32px - 32px)', display: 'flex', flexDirection: 'column' }}>
      {contextHolder}
      <div style={{ marginBottom: isMobile() ? '12px' : '16px' }}>
        <Typography.Title level={isMobile() ? 4 : 3} style={{ margin: 0 }}>
          📅 健身计划 · {selectedDate.format('YYYY年MM月')}
          {getMonthTrainingCount() > 0 && <Tag color="blue" style={{ marginLeft: isMobile() ? 8 : 12 }}>本月训练 {getMonthTrainingCount()} 天</Tag>}
        </Typography.Title>
      </div>
      
      {/* 日历占满整个content区域 */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Spin spinning={loadingMonth}>
          <div style={{ flex: 1, overflow: 'auto', minHeight: isMobile() ? '600px' : '800px' }}>
            <Calendar
              fullscreen={!isMobile()}
              onSelect={onSelect}
              onPanelChange={onPanelChange}
              value={selectedDate}
              cellRender={cellRender}
            />
          </div>
        </Spin>
      </Card>

      {/* 添加/编辑记录弹窗 */}
      <Modal
        title={editingIndex !== null ? `编辑 ${dateStr} 记录` : `添加 ${dateStr} 健身记录`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingIndex(null);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setModalVisible(false);
            setEditingIndex(null);
            form.resetFields();
          }}>
            取消
          </Button>,
          editingIndex !== null && (
            <Button key="delete" danger onClick={handleDeleteRecord}>
              删除记录
            </Button>
          ),
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {editingIndex !== null ? '保存修改' : '添加'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveRecord}>
          <Form.Item
            name="type"
            label="训练类型"
            initialValue="力量训练"
            rules={[{ required: true, message: '请输入训练类型' }]}
          >
            <Input placeholder="例如：力量训练/有氧训练/拉伸" />
          </Form.Item>
          <Form.Item
            name="duration"
            label="训练时长（分钟）"
          >
            <Input placeholder="例如：60" />
          </Form.Item>
          <Form.Item
            name="parts"
            label="训练部位"
            rules={[{ required: true, message: '请至少选择一个训练部位' }]}
          >
            <Checkbox.Group options={trainingParts} />
          </Form.Item>
          <Form.Item
            name="content"
            label="训练内容/备注"
            rules={[{ required: true, message: '请输入训练内容' }]}
          >
            <Input.TextArea 
              placeholder="请详细记录今天的训练内容，动作、组数、重量..."
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Training;
