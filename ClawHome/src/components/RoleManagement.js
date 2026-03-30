import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm, theme, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { isMobile } from '../utils';

const { Title } = Typography;
const { useToken } = theme;
const { Option } = Select;

// 所有可用的路由
const allRoutes = [
  { key: 'dashboard', label: '仪表盘', path: '/dashboard' },
  { key: 'filemanager', label: '文件管理器', path: '/filemanager' },
  { key: 'dailyreport', label: '每日汇报', path: '/dailyreport' },
  { key: 'training', label: '健身计划', path: '/training' },
  { key: 'chat', label: 'AI聊天', path: '/chat' },
  { key: 'learning', label: '学习记录', path: '/learning' },
  { key: 'permission', label: '权限管理', path: '/permission' },
  { key: 'role', label: '角色管理', path: '/role' },
];

function RoleManagement() {
  const { token } = useToken();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/auth/roles');
      const data = await response.json();
      setRoles(data.data || []);
    } catch (err) {
      console.error('加载角色列表失败', err);
      message.error('加载角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({
      permissions: ['learning'] // 默认只能访问学习记录
    });
    setModalVisible(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions || []
    });
    setModalVisible(true);
  };

  const handleDelete = async (roleId) => {
    try {
      const response = await fetch(`/api/auth/roles/${roleId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        message.success('删除成功');
        loadRoles();
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
      const url = editingRole 
        ? `/api/auth/roles/${editingRole.id}`
        : '/api/auth/roles';
      
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(editingRole ? '更新成功' : '添加成功');
        setModalVisible(false);
        loadRoles();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (err) {
      console.error('操作失败', err);
      message.error('操作失败');
    }
  };

  const getRouteLabels = (permissions) => {
    if (!permissions || permissions.length === 0) return <Tag color="default">无权限</Tag>;
    return permissions.map(perm => {
      const route = allRoutes.find(r => r.key === perm);
      return route ? <Tag key={perm} color="blue">{route.label}</Tag> : null;
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Tag icon={<KeyOutlined />} color="purple">{name}</Tag>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '可访问路由',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Space wrap>
          {getRouteLabels(permissions)}
        </Space>
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
          {record.key !== 'admin' && record.key !== 'guest' && (
            <Popconfirm
              title="确认删除"
              description="确定要删除这个角色吗？"
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
          🎭 角色管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加角色
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={roles}
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
        title={editingRole ? '编辑角色' : '添加角色'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="角色名称"
            name="name"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" disabled={!!editingRole} />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>

          <Form.Item
            label="可访问路由"
            name="permissions"
            rules={[{ required: true, message: '请选择可访问的路由' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {allRoutes.map(route => (
                  <Checkbox key={route.key} value={route.key}>
                    {route.label} ({route.path})
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>
              {editingRole ? '更新' : '添加'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RoleManagement;
