import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Progress, List, Tag, Empty, Spin, Space, theme } from 'antd';
import { HeartOutlined, FireOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { isMobile } from '../utils';

const { Title } = Typography;
const { useToken } = theme;

function Dashboard() {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [bodyData, setBodyData] = useState(null);
  const [todos, setTodos] = useState([]);

  // 加载身体数据
  useEffect(() => {
    loadBodyData();
    loadTodos();
  }, []);

  const loadBodyData = async () => {
    try {
      const response = await fetch('/api/dashboard/body-data');
      const data = await response.json();
      setBodyData(data.data || getDefaultBodyData());
    } catch (err) {
      console.error('加载身体数据失败', err);
      setBodyData(getDefaultBodyData());
    } finally {
      setLoading(false);
    }
  };

  const loadTodos = async () => {
    try {
      const response = await fetch('/api/dashboard/todos');
      const data = await response.json();
      setTodos(data.data || []);
    } catch (err) {
      console.error('加载待办失败', err);
      setTodos([]);
    }
  };

  const getDefaultBodyData = () => ({
    weight: 70,
    height: 175,
    bodyFat: 15,
    muscleMass: 55,
    bmi: 22.9,
    restingHeartRate: 65,
    bloodPressure: '120/80',
    sleepHours: 7.5,
    waterIntake: 2000,
    steps: 8000,
    caloriesBurned: 2200,
    lastUpdate: dayjs().format('YYYY-MM-DD HH:mm')
  });

  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return { status: '偏瘦', color: '#faad14' };
    if (bmi < 24) return { status: '正常', color: '#52c41a' };
    if (bmi < 28) return { status: '超重', color: '#faad14' };
    return { status: '肥胖', color: '#f5222d' };
  };

  const getHealthScore = () => {
    if (!bodyData) return 0;
    let score = 100;
    // BMI 扣分
    const bmi = bodyData.bmi;
    if (bmi < 18.5 || bmi > 24) score -= 10;
    // 体脂率扣分
    if (bodyData.bodyFat > 20) score -= 10;
    // 睡眠扣分
    if (bodyData.sleepHours < 7) score -= 10;
    // 饮水扣分
    if (bodyData.waterIntake < 2000) score -= 10;
    return Math.max(0, score);
  };

  const healthScore = getHealthScore();
  const bmiStatus = bodyData ? getBMIStatus(bodyData.bmi) : { status: '正常', color: '#52c41a' };

  const handleCompleteTodo = (id) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <div style={{ padding: isMobile() ? '12px' : '24px', background: token.colorBgContainer, minHeight: 'calc(100vh - 64px)' }}>
      <Spin spinning={loading}>
        <div style={{ marginBottom: isMobile() ? '16px' : '24px' }}>
          <Title level={isMobile() ? 4 : 2} style={{ margin: 0 }}>
            📊 身体数据大盘
            <Tag color="blue" style={{ marginLeft: isMobile() ? 8 : 12 }}>
              {bodyData?.lastUpdate ? `更新于 ${bodyData.lastUpdate}` : '今日更新'}
            </Tag>
          </Title>
        </div>

        <Row gutter={[16, 16]}>
          {/* 健康评分 */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="健康评分"
                value={healthScore}
                suffix="/ 100"
                valueStyle={{ color: healthScore >= 80 ? '#3f8600' : healthScore >= 60 ? '#faad14' : '#f5222d' }}
                prefix={<HeartOutlined />}
              />
            </Card>
          </Col>

          {/* 体重 */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="体重"
                value={bodyData?.weight || 0}
                suffix="kg"
                precision={1}
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>

          {/* 身高 */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="身高"
                value={bodyData?.height || 0}
                suffix="cm"
                precision={0}
              />
            </Card>
          </Col>

          {/* BMI */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="BMI"
                value={bodyData?.bmi || 0}
                precision={1}
                valueStyle={{ color: bmiStatus.color }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: bmiStatus.color }}>
                状态：{bmiStatus.status}
              </div>
            </Card>
          </Col>

          {/* 体脂率 */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="体脂率"
                value={bodyData?.bodyFat || 0}
                suffix="%"
                precision={1}
              />
              <Progress
                percent={bodyData?.bodyFat || 0}
                size="small"
                style={{ marginTop: 8 }}
                status={bodyData?.bodyFat > 20 ? 'exception' : 'normal'}
              />
            </Card>
          </Col>

          {/* 肌肉量 */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="肌肉量"
                value={bodyData?.muscleMass || 0}
                suffix="kg"
                precision={1}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

export default Dashboard;
