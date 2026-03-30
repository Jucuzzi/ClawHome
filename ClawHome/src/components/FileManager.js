import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Button, Modal, Form, Input, message, Typography, Dropdown, Space, Breadcrumb, Spin, Tree, theme } from 'antd';
import {
  FolderOpenOutlined,
  ArrowUpOutlined,
  PlusOutlined,
  HomeOutlined,
  FolderOpenTwoTone,
  FileTwoTone,
  FileUnknownTwoTone,
  FileTextTwoTone,
  FileZipTwoTone,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import MonacoEditor from '@monaco-editor/react';

const { Content } = Layout;
const { useToken } = theme;

// 检测是否为移动端
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

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
  const { token } = useToken();
  const [currentPath, setCurrentPath] = useState('.');
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile());
  
  // 长按相关的状态
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  // 监听窗口大小变化，更新移动端状态
  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 构建目录树，只构建一次根目录，懒加载不递归全量加载
  const buildDirectoryTree = (parentPath = '.') => {
    // 只返回一级结构，展开时再加载子节点
    return [];
  };

  // 初始化加载根目录树
  const [directoryTree, setDirectoryTree] = useState([]);
  
  // 只加载一次根目录
  useEffect(() => {
    const loadRootTree = async () => {
      const response = await fetch(`/api/list?path=.`);
      const data = await response.json();
      if (data.error) {
        setDirectoryTree([]);
        return;
      }
      
      // 过滤掉以.开头的文件/文件夹，并保留所有文件和文件夹
      // 排序：文件夹始终放在前面，文件放在后面
      const directories = data.files.filter(f => !f.name.startsWith('.') && f.isDirectory);
      const files = data.files.filter(f => !f.name.startsWith('.') && !f.isDirectory);
      const items = [...directories, ...files];
      
      const rootNodes = items.map(item => ({
        title: item.name,
        key: item.name,
        isLeaf: !item.isDirectory,
        isDirectory: item.isDirectory,
        icon: item.isDirectory ? <FolderOpenTwoTone /> : <FileTwoTone />
      }));
      
      setDirectoryTree(rootNodes);
    };
    loadRootTree();
  }, []);

  // 懒加载子节点
  const onLoadData = async ({ key }) => {
    const response = await fetch(`/api/list?path=${encodeURIComponent(key)}`);
    const data = await response.json();
    if (data.error) return;
    
    // 过滤掉以.开头的文件/文件夹，保留所有文件和文件夹
    // 排序：文件夹始终放在前面，文件放在后面
    const directories = data.files.filter(f => !f.name.startsWith('.') && f.isDirectory);
    const files = data.files.filter(f => !f.name.startsWith('.') && !f.isDirectory);
    const items = [...directories, ...files];
    
    const loop = (list, key) => {
      list.forEach(node => {
        if (node.key === key) {
          node.children = items.map(item => ({
            title: item.name,
            key: `${key}/${item.name}`,
            isLeaf: !item.isDirectory,
            isDirectory: item.isDirectory,
            icon: item.isDirectory ? <FolderOpenTwoTone /> : <FileTwoTone />
          }));
        } else if (node.children) {
          loop(node.children, key);
        }
      });
    };
    
    const newTree = [...directoryTree];
    loop(newTree, key);
    setDirectoryTree(newTree);
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/list?path=${encodeURIComponent(currentPath)}`);
      const data = await response.json();
      if (data.error) {
        messageApi.error(data.error);
      } else {
        // 过滤掉以.开头的文件/文件夹，排序：文件夹始终放在前面，文件放在后面
        const directories = data.files.filter(f => !f.name.startsWith('.') && f.isDirectory);
        const files = data.files.filter(f => !f.name.startsWith('.') && !f.isDirectory);
        const sortedFiles = [...directories, ...files];
        setFileList(sortedFiles);
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

  // 长按开始
  const handleLongPressStart = (e, file) => {
    if (!isMobileDevice) return;
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setSelectedFile(file);
      // 获取触摸位置
      let clientX = 0;
      let clientY = 0;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.clientX !== undefined) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      setContextMenu({
        open: true,
        x: clientX,
        y: clientY,
        file
      });
    }, 500); // 500ms长按
  };

  // 长按结束
  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
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

  // 根据是否选中文件返回不同菜单项
  const getMenuItems = () => {
    if (!contextMenu.file) {
      // 空白区域只显示新建
      return [
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
    } else {
      // 有文件时显示完整菜单
      return [
        {
          key: 'edit',
          label: '编辑',
          disabled: contextMenu.file.isDirectory,
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
    }
  };

  return (
    <>
      {contextHolder}
      <Content 
        style={{ 
          margin: '16px', 
          padding: '16px', 
          background: token.colorBgContainer, 
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
          {/* 目录树 - 移动端隐藏 */}
          {!isMobileDevice && (
            <div style={{ 
              width: 250, 
              padding: '8px', 
              borderRight: `1px solid ${token.colorBorder}`, 
              flexShrink: 0
            }}>
              <Spin spinning={loading}>
                <Tree
                  treeData={directoryTree}
                  loadData={onLoadData}
                  onSelect={(selectedKeys, info) => {
                    if (selectedKeys.length > 0) {
                      // 只有文件夹才改变路径，文件只选中不跳转
                      if (info.node.isDirectory) {
                        const path = selectedKeys[0];
                        if (path !== currentPath) {
                          setCurrentPath(path);
                        }
                      }
                    }
                  }}
                  showIcon
                  defaultSelectedKeys={[currentPath]}
                />
              </Spin>
            </div>
          )}
          
          {/* 文件部分可滚动 */}
          <div style={{ flex: 1, paddingLeft: isMobileDevice ? 0 : 16, overflowY: 'auto' }}>
            <Spin spinning={loading}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexWrap: 'wrap',
                  minHeight: '100%'
                }}
                onClick={() => setSelectedItem(null)}
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
                  
                  const handleClick = (e) => {
                    e.stopPropagation();
                    if (longPressTriggered.current) {
                      // 如果长按已触发，不执行点击
                      longPressTriggered.current = false;
                      return;
                    }
                    if (isSelected) {
                      setSelectedItem(null); // 取消选中
                    } else {
                      setSelectedItem(file.name); // 选中当前
                    }
                  };

                  const fileCardElement = (
                    <div
                      style={{
                        padding: isMobileDevice ? '12px 4px' : '16px 8px',
                        cursor: isMobileDevice ? 'pointer' : 'context-menu',
                        background: token.colorBgContainer,
                        width: isMobileDevice ? '120px' : '120px',
                        height: isMobileDevice ? 'auto' : '180px',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        margin: isMobileDevice ? '0 4px 4px 0' : '0 8px 8px 0',
                        touchAction: 'manipulation'
                      }}
                      onClick={handleClick}
                      onDoubleClick={() => {
                        if (longPressTriggered.current) {
                          longPressTriggered.current = false;
                          return;
                        }
                        if (file.isDirectory) {
                          setCurrentPath(currentPath === '.' ? file.name : `${currentPath}/${file.name}`);
                        } else {
                          handleEdit(file);
                        }
                      }}
                      // 移动端长按事件
                      onMouseDown={(e) => handleLongPressStart(e, file)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={(e) => handleLongPressStart(e, file)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchCancel={handleLongPressEnd}
                    >
                      <div 
                        style={{ 
                          width: isMobileDevice ? 48 : 80, 
                          height: isMobileDevice ? 48 : 80,
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? token.colorFillSecondary : 'transparent'
                        }}
                      >
                        <div style={{ fontSize: isMobileDevice ? 28 : 48 }}>
                          {file.isDirectory ? <FolderOpenTwoTone /> : fileIcon}
                        </div>
                      </div>
                      <div 
                        style={{ 
                          wordBreak: 'break-word', 
                          overflowWrap: 'break-word',
                          textAlign: 'center',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? token.colorPrimary : 'transparent',
                          userSelect: 'none',
                          fontSize: isMobileDevice ? '11px' : 'inherit',
                          width: '100%',
                          minWidth: 0,
                          maxWidth: '100%',
                          flex: 1
                        }}
                      >
                        <Typography.Text style={{ 
                          color: isSelected ? token.colorTextLightSolid : 'inherit', 
                          userSelect: 'none',
                          display: 'block',
                          width: '100%'
                        }}>
                          {file.name}
                        </Typography.Text>
                      </div>
                    </div>
                  );

                  if (isMobileDevice) {
                    // 移动端：直接返回卡片
                    return <div key={file.name}>{fileCardElement}</div>;
                  } else {
                    // PC端：使用Dropdown包裹
                    return (
                      <Dropdown 
                        key={file.name}
                        menu={{ items: getMenuItems() }} 
                        trigger={['contextMenu']} 
                        onContextMenu={e => handleContextMenu(e, file)}
                      >
                        {fileCardElement}
                      </Dropdown>
                    );
                  }
                })}
              </div>
            </Spin>
          </div>
        </div>
        
        {/* 底部面包屑固定 */}
        <div style={{ textAlign: 'right', paddingTop: 16, borderTop: `1px solid ${token.colorBorder}`, flexShrink: 0 }}>
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
