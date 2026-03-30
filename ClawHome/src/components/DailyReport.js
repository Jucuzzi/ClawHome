import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Collapse, Spin, Alert, theme } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { isMobile } from '../utils';

const { Content } = Layout;
const { Title, Paragraph } = Typography;
const { Panel } = Collapse;
const { useToken } = theme;

function DailyReport() {
  const { token } = useToken();
  const [memoryFiles, setMemoryFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMemoryFiles = async () => {
      try {
        setLoading(true);
        // 获取memory目录下的文件列表
        const response = await fetch('/api/list?path=./memory');
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        
        // 过滤出md文件，按日期倒序排序
        const mdFiles = data.files
          .filter(f => !f.isDirectory && f.name.endsWith('.md'))
          .sort((a, b) => b.name.localeCompare(a.name));
        
        // 读取每个文件内容
        const filesWithContent = await Promise.all(
          mdFiles.map(async (file) => {
            const res = await fetch(`/api/read?path=./memory&name=${encodeURIComponent(file.name)}`);
            const contentData = await res.json();
            return {
              name: file.name,
              content: contentData.content || '暂无内容'
            };
          })
        );
        
        setMemoryFiles(filesWithContent);
        setLoading(false);
      } catch (err) {
        setError('加载memory内容失败');
        setLoading(false);
      }
    };

    loadMemoryFiles();
  }, []);

  return (
    <Content style={{ margin: isMobile() ? '8px' : '16px', padding: isMobile() ? '12px' : '16px', background: token.colorBgContainer, borderRadius: '4px', minHeight: 'calc(100vh - 64px - 32px - 32px)' }}>
      <Title level={isMobile() ? 4 : 3}>每日汇报</Title>
      <Paragraph type="secondary" style={{ fontSize: isMobile() ? 12 : 14 }}>
        以下是每天往memory中写入的内容，按日期倒序排列：
      </Paragraph>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>正在加载...</div>
        </div>
      )}
      
      {error && !loading && (
        <Alert message="错误" description={error} type="error" showIcon />
      )}
      
      {!loading && !error && memoryFiles.length === 0 && (
        <Alert message="提示" description="暂无memory记录" type="info" showIcon />
      )}
      
      {!loading && !error && memoryFiles.length > 0 && (
        <Collapse 
          defaultActiveKey={[memoryFiles[0]?.name]}
          accordion
          style={{ marginTop: 16 }}
        >
          {memoryFiles.map((file) => (
            <Panel 
              header={
                <span style={{ fontSize: 16 }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  {file.name.replace('.md', '')}
                </span>
              } 
              key={file.name}
            >
              <Card 
                style={{ backgroundColor: token.colorBgLayout }} 
                bodyStyle={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {file.content}
              </Card>
            </Panel>
          ))}
        </Collapse>
      )}
    </Content>
  );
}

export default DailyReport;
