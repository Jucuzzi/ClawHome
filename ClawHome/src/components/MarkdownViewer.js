import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { theme } from 'antd';

function MarkdownViewer({ content, style = {} }) {
  const { token } = theme.useToken();
  const isDark = token.colorBgContainer === '#1f1f1f' || token.colorBgContainer === '#141414';

  return (
    <div style={{ 
      lineHeight: 1.8, 
      fontSize: '14px',
      color: token.colorText,
      ...style 
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // 标题样式
          h1: ({ node, ...props }) => (
            <h1 
              style={{ 
                fontSize: '28px', 
                fontWeight: 700, 
                marginTop: '24px', 
                marginBottom: '16px',
                borderBottom: `2px solid ${token.colorBorder}`,
                paddingBottom: '8px',
                color: token.colorTextHeading
              }} 
              {...props} 
            />
          ),
          h2: ({ node, ...props }) => (
            <h2 
              style={{ 
                fontSize: '24px', 
                fontWeight: 600, 
                marginTop: '20px', 
                marginBottom: '12px',
                borderBottom: `1px solid ${token.colorBorder}`,
                paddingBottom: '6px',
                color: token.colorTextHeading
              }} 
              {...props} 
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 
              style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                marginTop: '16px', 
                marginBottom: '10px',
                color: token.colorTextHeading
              }} 
              {...props} 
            />
          ),
          h4: ({ node, ...props }) => (
            <h4 
              style={{ 
                fontSize: '18px', 
                fontWeight: 600, 
                marginTop: '14px', 
                marginBottom: '8px',
                color: token.colorTextHeading
              }} 
              {...props} 
            />
          ),
          h5: ({ node, ...props }) => (
            <h5 
              style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                marginTop: '12px', 
                marginBottom: '6px',
                color: token.colorTextHeading
              }} 
              {...props} 
            />
          ),
          h6: ({ node, ...props }) => (
            <h6 
              style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                marginTop: '10px', 
                marginBottom: '6px',
                color: token.colorTextSecondary
              }} 
              {...props} 
            />
          ),
          // 段落
          p: ({ node, ...props }) => (
            <p 
              style={{ 
                marginTop: '8px', 
                marginBottom: '8px',
                lineHeight: 1.8
              }} 
              {...props} 
            />
          ),
          // 列表
          ul: ({ node, ...props }) => (
            <ul 
              style={{ 
                paddingLeft: '24px', 
                marginTop: '8px', 
                marginBottom: '8px' 
              }} 
              {...props} 
            />
          ),
          ol: ({ node, ...props }) => (
            <ol 
              style={{ 
                paddingLeft: '24px', 
                marginTop: '8px', 
                marginBottom: '8px' 
              }} 
              {...props} 
            />
          ),
          li: ({ node, ...props }) => (
            <li 
              style={{ 
                marginTop: '4px', 
                marginBottom: '4px',
                lineHeight: 1.8
              }} 
              {...props} 
            />
          ),
          // 代码块
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <div style={{ margin: '12px 0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ 
                    background: isDark ? '#2d2d2d' : '#f5f5f5',
                    padding: '4px 12px',
                    fontSize: '12px',
                    color: token.colorTextSecondary,
                    borderBottom: `1px solid ${token.colorBorder}`
                  }}>
                    {language}
                  </div>
                  <SyntaxHighlighter
                    style={isDark ? oneDark : oneLight}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '12px',
                      fontSize: '13px',
                      lineHeight: 1.6
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            }
            
            return (
              <code
                style={{
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  color: isDark ? '#ff7b72' : '#e83e8c'
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          // 引用
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: `4px solid ${token.colorPrimary}`,
                paddingLeft: '16px',
                margin: '12px 0',
                color: token.colorTextSecondary,
                fontStyle: 'italic',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                padding: '12px 16px',
                borderRadius: '0 8px 8px 0'
              }}
              {...props}
            />
          ),
          // 链接
          a: ({ node, ...props }) => (
            <a
              style={{
                color: token.colorPrimary,
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // 图片
          img: ({ node, ...props }) => (
            <img
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                margin: '12px 0',
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
              {...props}
            />
          ),
          // 表格
          table: ({ node, ...props }) => (
            <div style={{ overflowX: 'auto', margin: '12px 0' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              style={{
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              }}
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              style={{
                padding: '12px',
                textAlign: 'left',
                fontWeight: 600,
                borderBottom: `2px solid ${token.colorBorder}`,
                borderRight: `1px solid ${token.colorBorder}`
              }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              style={{
                padding: '12px',
                borderBottom: `1px solid ${token.colorBorder}`,
                borderRight: `1px solid ${token.colorBorder}`
              }}
              {...props}
            />
          ),
          // 分隔线
          hr: ({ node, ...props }) => (
            <hr
              style={{
                border: 'none',
                borderTop: `2px solid ${token.colorBorder}`,
                margin: '24px 0'
              }}
              {...props}
            />
          ),
          // 强调
          strong: ({ node, ...props }) => (
            <strong
              style={{
                fontWeight: 700,
                color: token.colorTextHeading
              }}
              {...props}
            />
          ),
          em: ({ node, ...props }) => (
            <em
              style={{
                fontStyle: 'italic'
              }}
              {...props}
            />
          ),
          // 删除线
          del: ({ node, ...props }) => (
            <del
              style={{
                textDecoration: 'line-through',
                color: token.colorTextSecondary
              }}
              {...props}
            />
          )
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownViewer;
