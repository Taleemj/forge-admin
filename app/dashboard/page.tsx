"use client";

import {
  ApartmentOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Flex,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import { AdminShell } from "@/components/admin-shell";

const { Text, Title } = Typography;

type ProjectRow = {
  key: string;
  project: string;
  client: string;
  type: string;
  status: "Planning" | "Construction" | "Completed";
  progress: number;
};

const projects: ProjectRow[] = [
  {
    key: "proj-101",
    project: "Mombasa Coastal Villa",
    client: "Alvin",
    type: "Construction",
    status: "Construction",
    progress: 65,
  },
  {
    key: "proj-102",
    project: "Naivasha Lake House",
    client: "Alvin",
    type: "Design",
    status: "Planning",
    progress: 30,
  },
  {
    key: "proj-103",
    project: "Nairobi Luxury Apartments",
    client: "Alvin",
    type: "Management",
    status: "Completed",
    progress: 100,
  },
];

const columns: ColumnsType<ProjectRow> = [
  {
    title: "Project",
    dataIndex: "project",
    key: "project",
    render: (value: string, record) => (
      <Space direction="vertical" size={0}>
        <Text strong>{value}</Text>
        <Text type="secondary">{record.client}</Text>
      </Space>
    ),
  },
  {
    title: "Type",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: ProjectRow["status"]) => {
      const color =
        status === "Completed"
          ? "success"
          : status === "Construction"
            ? "processing"
            : "warning";

      return <Tag color={color}>{status}</Tag>;
    },
  },
  {
    title: "Progress",
    dataIndex: "progress",
    key: "progress",
    render: (progress: number) => <Progress percent={progress} size="small" />,
  },
];

const activity = [
  {
    title: "Land listing updated",
    description: "Naivasha Lakeside marked as available",
    icon: <BuildOutlined />,
  },
  {
    title: "Design package ready",
    description: "Eco-Lodge Concept content is ready for review",
    icon: <ApartmentOutlined />,
  },
  {
    title: "Payment confirmed",
    description: "$12,000 received for Entebbe Safari Lodge",
    icon: <DollarOutlined />,
  },
];

const metrics = [
  {
    title: "Active Projects",
    value: 4,
    icon: <ApartmentOutlined />,
    helper: "Construction, design, and management",
  },
  {
    title: "Land Listings",
    value: 4,
    icon: <EnvironmentOutlined />,
    helper: "3 available, 1 sold",
  },
  {
    title: "House Designs",
    value: 3,
    icon: <BuildOutlined />,
    helper: "Ready concept packages",
  },
  {
    title: "Clients",
    value: 1,
    icon: <TeamOutlined />,
    helper: "Registered client accounts",
  },
];

export default function DashboardPage() {
  return (
    <AdminShell>
      <section className="dashboard-hero">
        <Flex align="center" justify="space-between" className="dashboard-hero-inner">
          <Space direction="vertical" size={10}>
            <Text className="dashboard-kicker">Forge Housing Admin</Text>
            <Title level={1}>Dashboard</Title>
            <Text className="dashboard-hero-copy">
              Monitor client projects, marketplace inventory, payments, and
              field updates from one operational view.
            </Text>
          </Space>

          <Space size={10} className="dashboard-hero-actions">
            <Button type="default">Review Updates</Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Create Listing
            </Button>
          </Space>
        </Flex>
      </section>

      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col xs={24} sm={12} xl={6} key={metric.title}>
            <Card className="metric-card">
              <Flex align="flex-start" justify="space-between" gap={16}>
                <Statistic title={metric.title} value={metric.value} />
                <span className="metric-icon">{metric.icon}</span>
              </Flex>
              <Text type="secondary" className="metric-helper">
                {metric.helper}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="dashboard-grid">
        <Col xs={24} xl={16}>
          <Card
            title="Project Pipeline"
            extra={<Button type="link">View all</Button>}
            className="dashboard-card"
          >
            <Table
              columns={columns}
              dataSource={projects}
              pagination={false}
              scroll={{ x: 720 }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Recent Activity" className="dashboard-card">
            <List
              itemLayout="horizontal"
              dataSource={activity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<span className="activity-icon">{item.icon}</span>}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="dashboard-grid">
        <Col xs={24} lg={8}>
          <Card className="stage-card">
            <Space direction="vertical" size={12}>
              <ClockCircleOutlined className="status-icon" />
              <Title level={4}>Planning</Title>
              <Text type="secondary">
                Design work and early project setup awaiting approvals.
              </Text>
              <Progress percent={30} showInfo={false} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="stage-card">
            <Space direction="vertical" size={12}>
              <BuildOutlined className="status-icon" />
              <Title level={4}>Construction</Title>
              <Text type="secondary">
                Site progress, updates, and milestone tracking in motion.
              </Text>
              <Progress percent={65} showInfo={false} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="stage-card">
            <Space direction="vertical" size={12}>
              <CheckCircleOutlined className="status-icon" />
              <Title level={4}>Completed</Title>
              <Text type="secondary">
                Handover, property management, and client reporting.
              </Text>
              <Progress percent={100} showInfo={false} />
            </Space>
          </Card>
        </Col>
      </Row>
    </AdminShell>
  );
}
