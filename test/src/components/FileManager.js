import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Button, Modal, Form, Input, message, Typography, Dropdown, Space, Breadcrumb, Spin } from 'antd';
import {
  FolderOpenOutlined,
  ArrowUpOutlined,
  PlusOutlined,
  HomeOutlined,
  FolderOpenTwoTone,
  FileTwoTone,
  FileUnknownTwoTone,
  FileTextTwoTone,
  FileZipTwoTone
} from '@ant-design/icons';
import MonacoEditor from '@monaco-editor/react';

const { Content } = Layout;

function buildTree(items, parentPath = '.') {
  const tree = [];
  items.forEach(item => {
    const fullPath = parentPath === '.' ? item.name : `${parentPath}/${item.name}`;
    const node = {
      title: item.name,
      isDirectory: item.isDirectory,
      key: fullPath,
      children: item.isDirectory ? [] : undefined
    };
    tree.push(node);
  });
  return tree;
}

function FileManager() {
  const [currentPath, setCurrentPath] = useState('.');
  const [fileList, setFileList] = useState([]);
  const [quickFolders, setQuickFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 初始化只加载一次根目录下的快捷文件夹
  useEffect(() => {
    const loadRootFolders = async () => {
      const response = await fetch(`/api/list?path=.`);
      const data = await response.json();
      if (!data.error) {
        setQuickFolders(data.files.filter(f => f.isDirectory));
      }
    };
    loadRootFolders();
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/list?path=${encodeURIComponent(currentPath)}`);
      const data = await response.json();
      if (data.error) {
        messageApi.error(data.error);
      } else {
        setFileList(data.files);
      }
    } catch (err) {
      messageApi.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPath, messageApi]);

  useEffect(() => {
    fetchFiles();
  }, [currentPath, fetchFiles]);

  const handleCreate = async (values) => {
    const { name, type } = values;
    setLoading(true);
    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          name,
          type
        })
      });
      const data = await response.json();
      if (data.error) {
        messageApi.error(data.error);
      } else {
        messageApi.success('创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchFiles();
      }
    } catch (err) {
      messageApi.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file) => {
    setLoading(true);
    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          name: file.name,
          isDirectory: file.isDirectory
        })
      });
      const data = await response.json();
      if (data.error) {
        messageApi.error(data.error);
      } else {
        messageApi.success('删除成功');
        fetchFiles();
      }
    } catch (err) {
      messageApi.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (values) => {
    const { newName } = values;
    setLoading(true);
    try {
      const response = await fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          oldName: selectedFile.name,
          newName
        })
      });
      const data = await response.json();
      if (data.error) {
        messageApi.error(data.error);
      } else {
        messageApi.success('重命名成功');
        setRenameModalVisible(false);
        setSelectedFile(null);
        form.resetFields();
        fetchFiles();
      }
    } catch (err) {
      messageApi.error('重命名失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (file) => {
    if (!file.isDirectory) {
      setSelectedFile(file);
      setLoading(true);
      try {
        const response = await fetch(`/api/read?path=${encodeURIComponent(currentPath)}&name=${encodeURIComponent(file.name)}`);
        const data = await response.json();
        if (data.error) {
          messageApi.error(data.error);
        } else {
          setFileContent(data.content);
          setEditModalVisible(true);
        }
      } catch (err) {
        messageApi.error('读取文件失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          name: selectedFile.name,
          content: fileContent
        })
      });
      const data = await response.json();
      if (data.error) {
        messageApi.error(data.error);
      } else {
        messageApi.success('保存成功');
        setEditModalVisible(false);
        setSelectedFile(null);
        setFileContent('');
        fetchFiles();
      }
    } catch (err) {
      messageApi.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const goToParent = () => {
    if (currentPath === '.') return;
    const parts = currentPath.split('/');
    parts.pop();
    const parentPath = parts.length > 0 ? parts.join('/') : '.';
    setCurrentPath(parentPath);
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(file);
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const handleBlankContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      file: null
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ open: false });
  };

  const menuItems = [
    {
      key: 'edit',
      label: '编辑',
      disabled: !contextMenu.file || contextMenu.file.isDirectory,
      onClick: () => {
        if (contextMenu.file) {
          handleEdit(contextMenu.file);
        }
        closeContextMenu();
      }
    },
    {
      key: 'rename',
      label: '重命名',
      disabled: !contextMenu.file,
      onClick: () => {
        if (contextMenu.file) {
          setSelectedFile(contextMenu.file);
          setRenameModalVisible(true);
          form.setFieldsValue({ newName: contextMenu.file.name });
        }
        closeContextMenu();
      }
    },
    {
      key: 'delete',
      label: '删除',
      danger: true,
      disabled: !contextMenu.file,
      onClick: () => {
        if (contextMenu.file) {
          handleDelete(contextMenu.file);
        }
        closeContextMenu();
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'createFile',
      label: '新建文件',
      onClick: () => {
        setCreateModalVisible(true);
        form.setFieldsValue({ type: 'file' });
        closeContextMenu();
      }
    },
    {
      key: 'createFolder',
      label: '新建文件夹',
      onClick: () => {
        setCreateModalVisible(true);
        form.setFieldsValue({ type: 'directory' });
        closeContextMenu();
      }
    }
  ];

  return (
    <>
      {contextHolder}
      <Content 
        style={{ 
          margin: '16px', 
          padding: '16px', 
          background: '#fff', 
          borderRadius: '4px', 
          minHeight: 'calc(100vh - 64px - 32px - 32px)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px - 32px - 32px)'
        }}
      >
        {/* 顶部操作按钮固定 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <Space>
            <Button icon={<HomeOutlined />} onClick={() => setCurrentPath('.')}>
              根目录
            </Button>
            <Button icon={<ArrowUpOutlined />} disabled={currentPath === '.'} onClick={goToParent}>
              返回上一级
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              新建
            </Button>
          </Space>
        </div>
        
        {/* 中间可滚动区域 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 快捷目录固定宽度 固定不动 */}
          <div style={{ 
            width: '200px', 
            padding: '8px', 
            borderRight: '1px solid #f0f0f0', 
            flexShrink: 0 
          }}>
            <Typography.Title level={5} style={{ margin: '0 0 8px 0' }}>快捷目录</Typography.Title>
            <Spin spinning={loading}>
              {quickFolders.length > 0 ? quickFolders.map(folder => (
                <div key={folder.name} style={{ padding: '4px 8px', cursor: 'pointer' }} onClick={() => setCurrentPath(currentPath === '.' ? folder.name : `${currentPath}/${folder.name}`)}>
                  <Space>
                    <FolderOpenOutlined />
                    <span>{folder.name}</span>
                  </Space>
                </div>
              )) : (
                <Typography.Text type="secondary">暂无文件夹</Typography.Text>
              )}
            </Spin>
          </div>
          
          {/* 文件部分可滚动 */}
          <div style={{ flex: 1, paddingLeft: 16, overflowY: 'auto' }}>
            <Spin spinning={loading}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                {fileList.map(file => {
                  // 根据文件类型选择图标
                  let fileIcon = <FileUnknownTwoTone />;
                  if (!file.isDirectory) {
                    const parts = file.name.split('.');
                    if (parts.length === 1) {
                      fileIcon = <FileUnknownTwoTone />; // 无后缀
                    } else {
                      const ext = parts.pop().toLowerCase();
                      // 压缩文件
                      if (['zip', 'rar', '7z', 'gz', 'tar', 'bz2'].includes(ext)) {
                        fileIcon = <FileZipTwoTone />;
                      } else if (['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'py', 'java', 'go', 'c', 'cpp', 'xml', 'yaml', 'yml', 'toml', 'ini', 'conf'].includes(ext)) {
                        fileIcon = <FileTextTwoTone />; // 可编辑文本文件
                      } else {
                        fileIcon = <FileTwoTone />; // 其他文件
                      }
                    }
                  }

                  const isSelected = selectedItem === file.name;
                  
                  const handleClick = () => {
                    if (isSelected) {
                      setSelectedItem(null); // 取消选中
                    } else {
                      setSelectedItem(file.name); // 选中当前
                    }
                  };

                  return (
                    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']} onContextMenu={e => handleContextMenu(e, file)} key={file.name}>
                      <div
                        style={{
                          padding: '16px 8px',
                          cursor: 'context-menu',
                          background: '#fff',
                          width: '120px',
                          height: '160px',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start'
                        }}
                        onClick={handleClick}
                        onDoubleClick={() => {
                          if (file.isDirectory) {
                            setCurrentPath(currentPath === '.' ? file.name : `${currentPath}/${file.name}`);
                          } else {
                            handleEdit(file);
                          }
                        }}
                      >
                        <div 
                          style={{ 
                            width: 60, 
                            height: 60,
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? '#E3E3E3' : 'transparent'
                          }}
                        >
                          <div style={{ fontSize: 48 }}>
                            {file.isDirectory ? <FolderOpenTwoTone /> : fileIcon}
                          </div>
                        </div>
                        <div 
                          style={{ 
                            wordBreak: 'break-word', 
                            textAlign: 'center',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? '#1890ff' : 'transparent',
                          }}
                        >
                          <Typography.Text style={{ color: isSelected ? '#fff' : 'inherit' }}>
                            {file.name}
                          </Typography.Text>
                        </div>
                      </div>
                    </Dropdown>
                  );
                })}
                <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']} onContextMenu={handleBlankContextMenu}>
                  <div 
                    style={{ width: '100%', minHeight: 100, paddingBottom: 16 }} 
                    onClick={() => setSelectedItem(null)}
                  />
                </Dropdown>
              </div>
            </Spin>
          </div>
        </div>
        
        {/* 底部面包屑固定 */}
        <div style={{ textAlign: 'right', paddingTop: 16, borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          <Breadcrumb>
            {currentPath === '.' ? (
              <Breadcrumb.Item onClick={() => setCurrentPath('.')}>根目录</Breadcrumb.Item>
            ) : (
              <>
                <Breadcrumb.Item onClick={() => setCurrentPath('.')}>根目录</Breadcrumb.Item>
                {(() => {
                  const items = [];
                  let acc = '';
                  const parts = currentPath.split('/');
                  parts.forEach((part, index) => {
                    acc = index === 0 ? part : `${acc}/${part}`;
                    items.push(
                      <Breadcrumb.Item key={acc} onClick={() => setCurrentPath(acc)}>
                        {part}
                      </Breadcrumb.Item>
                    );
                  });
                  return items;
                })()}
              </>
            )}
          </Breadcrumb>
        </div>
      </Content>

      <Modal
        title="新建"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入文件/文件夹名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            initialValue="file"
            rules={[{ required: true }]}
          >
            <div>
              <label><input type="radio" name="type" value="file" defaultChecked /> 文件</label>
              &nbsp;&nbsp;
              <label><input type="radio" name="type" value="directory" /> 文件夹</label>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`重命名 - ${selectedFile?.name}`}
        open={renameModalVisible}
        onCancel={() => {
          setRenameModalVisible(false);
          setSelectedFile(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} onFinish={handleRename} layout="vertical">
          <Form.Item
            name="newName"
            label="新名称"
            rules={[{ required: true, message: '请输入新名称' }]}
          >
            <Input placeholder="请输入新名称" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`编辑文件 - ${selectedFile?.name}`}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedFile(null);
          setFileContent('');
        }}
        onOk={handleSaveEdit}
        confirmLoading={loading}
        width={900}
        bodyStyle={{ height: 500, padding: 0 }}
      >
        <MonacoEditor
          height="100%"
          language="text"
          theme="vs"
          value={fileContent}
          options={{
            automaticLayout: true,
            readOnly: true
          }}
        />
      </Modal>
    </>
  );
}

export default FileManager;
