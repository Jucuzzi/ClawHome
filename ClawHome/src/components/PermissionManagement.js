import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm, theme } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { isMobile } from '../utils';

const { Title } = Typography;
const { useToken } = theme;
const { Option } = Select;

function PermissionManagement() {
  const { token } = useToken();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/auth/users');
      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error('加载用户列表失败', err);
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      phone: user.phone,
      name: user.name,
      role: user.role,
      password: ''
    });
    setModalVisible(true);
  };

  const handleDelete = async (userId) => {
    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        message.success('删除成功');
        loadUsers();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (err) {
      console.error('删除失败', err);
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingUser 
        ? `/api/auth/users/${editingUser.id}`
        : '/api/auth/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(editingUser ? '更新成功' : '添加成功');
        setModalVisible(false);
        loadUsers();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (err) {
      console.error('操作失败', err);
      message.error('操作失败');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'red';
      case 'user': return 'blue';
      default: return 'default';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return '超级管理员';
      case 'user': return '普通用户';
      default: return role;
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)} icon={role === 'admin' ? <LockOutlined /> : <UserOutlined />}>
          {getRoleText(role)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.role !== 'admin' && (
            <Popconfirm
              title="确认删除"
              description="确定要删除这个用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile() ? '12px' : '24px', background: token.colorBgContainer, minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: isMobile() ? '16px' : '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={isMobile() ? 4 : 2} style={{ margin: 0 }}>
          🔐 权限管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加用户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="user">普通用户</Option>
              <Option value="admin">超级管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={editingUser ? '新密码（不修改请留空）' : '密码'}
            name="password"
            rules={[
              !editingUser ? { required: true, message: '请输入密码' } : {},
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>
              {editingUser ? '更新' : '添加'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PermissionManagement;
