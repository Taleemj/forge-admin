"use client";

import { useMemo, type ReactNode } from "react";
import {
  ApartmentOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Empty,
  Flex,
  List,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import { AdminShell } from "@/components/admin-shell";
import { useDesigns } from "@/hooks/useDesigns";
import { useLands } from "@/hooks/useLands";
import { useManagementServices } from "@/hooks/useManagementServices";
import { useProjects } from "@/hooks/useProjects";

const { Text, Title } = Typography;

type ProjectRow = {
  key: string;
  project: string;
  client: string;
  type: string;
  status: string;
  progress: number;
};

type ActivityItem = {
  key: string;
  title: string;
  description: string;
  timestamp: string;
  icon: ReactNode;
};

const projectColumns: ColumnsType<ProjectRow> = [
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
    render: (status: string) => {
      const normalized = status.toLowerCase();
      const color =
        normalized === "completed"
          ? "success"
          : normalized === "construction" || normalized === "in_progress"
            ? "processing"
            : normalized === "waiting_for_payment"
              ? "gold"
              : "warning";

      return <Tag color={color}>{status.replaceAll("_", " ")}</Tag>;
    },
  },
  {
    title: "Progress",
    dataIndex: "progress",
    key: "progress",
    render: (progress: number) => <Progress percent={progress} size="small" />,
  },
];

function formatProjectType(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatRelativeDate(value?: string) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No timestamp";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const {
    projects,
    clients,
    isLoading: isLoadingProjects,
  } = useProjects();
  const { lands, isLoading: isLoadingLands } = useLands();
  const { designs, designRequests, isLoading: isLoadingDesigns } = useDesigns();
  const {
    services,
    requests: maintenanceRequests,
    isLoading: isLoadingServices,
  } = useManagementServices();

  const isLoading =
    isLoadingProjects ||
    isLoadingLands ||
    isLoadingDesigns ||
    isLoadingServices;

  const activeProjects = projects.filter((project) => project.status !== "completed");
  const availableLands = lands.filter((land) => land.status === "available");
  const activeServices = services.filter((service) => service.status === "active");

  const projectRows = useMemo<ProjectRow[]>(
    () =>
      projects
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 6)
        .map((project) => ({
          key: project._id,
          project: project.title,
          client:
            typeof project.client === "string"
              ? "Unassigned client"
              : project.client.name,
          type: formatProjectType(project.type),
          status: formatProjectType(project.status.replaceAll("_", " ")),
          progress: project.progress,
        })),
    [projects],
  );

  const stageMetrics = useMemo(() => {
    const planning = projects.filter((project) => project.status === "planning").length;
    const inExecution = projects.filter((project) =>
      ["construction", "initialized", "waiting_for_payment"].includes(
        project.status,
      ),
    ).length;
    const completed = projects.filter((project) => project.status === "completed").length;
    const total = projects.length || 1;

    return {
      planning: Math.round((planning / total) * 100),
      inExecution: Math.round((inExecution / total) * 100),
      completed: Math.round((completed / total) * 100),
      counts: { planning, inExecution, completed },
    };
  }, [projects]);

  const financeSnapshot = useMemo(() => {
    const totalBudget = projects.reduce(
      (sum, project) => sum + Number(project.budget?.total ?? 0),
      0,
    );
    const totalPaid = projects.reduce(
      (sum, project) => sum + Number(project.budget?.paid ?? 0),
      0,
    );

    return {
      totalBudget,
      totalPaid,
      collectionRate:
        totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0,
    };
  }, [projects]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const projectActivity = projects.flatMap((project) =>
      (project.milestones || []).flatMap((milestone) =>
        (milestone.updates || []).map((update, index) => ({
          key: `${project._id}-${milestone._id || milestone.title}-${index}`,
          title: `${project.title}: ${update.title}`,
          description:
            update.description || `${milestone.title} milestone was updated.`,
          timestamp: update.date || project.updatedAt,
          icon: <ApartmentOutlined />,
        })),
      ),
    );

    const maintenanceActivity = maintenanceRequests.map((request) => ({
      key: request._id,
      title:
        typeof request.service === "string"
          ? "Maintenance request"
          : `${request.service.title} request`,
      description:
        request.status === "quoted"
          ? "Quote sent to client."
          : `Request is ${request.status.replaceAll("_", " ")}.`,
      timestamp: request.updatedAt,
      icon: <ToolOutlined />,
    }));

    const designActivity = designRequests.map((request) => ({
      key: request._id,
      title:
        typeof request.design === "string"
          ? "Design request"
          : `${request.design.title} interest`,
      description: `Request is ${request.status.replaceAll("_", " ")}.`,
      timestamp: request.updatedAt,
      icon: <BuildOutlined />,
    }));

    return [...projectActivity, ...maintenanceActivity, ...designActivity]
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 6);
  }, [designRequests, maintenanceRequests, projects]);

  const metrics = [
    {
      title: "Active Projects",
      value: activeProjects.length,
      icon: <ApartmentOutlined />,
      helper: `${projects.length} total project records`,
    },
    {
      title: "Land Listings",
      value: lands.length,
      icon: <EnvironmentOutlined />,
      helper: `${availableLands.length} available right now`,
    },
    {
      title: "House Designs",
      value: designs.length,
      icon: <BuildOutlined />,
      helper: `${designRequests.length} active design enquiries`,
    },
    {
      title: "Clients",
      value: clients.length,
      icon: <TeamOutlined />,
      helper: `${maintenanceRequests.length} maintenance requests in flow`,
    },
  ];

  return (
    <AdminShell>
      <section className="dashboard-hero">
        <Flex align="center" justify="space-between" className="dashboard-hero-inner">
          <Space direction="vertical" size={10}>
            <Text className="dashboard-kicker">Forge Housing Admin</Text>
            <Title level={1}>Dashboard</Title>
            <Text className="dashboard-hero-copy">
              Monitor project delivery, listing inventory, service demand, and
              client follow-ups from the live backend.
            </Text>
          </Space>

          <Space direction="vertical" size={4} align="end">
            <Text type="secondary">Portfolio budget</Text>
            <Title level={3} style={{ margin: 0 }}>
              UGX {financeSnapshot.totalBudget.toLocaleString()}
            </Title>
            <Text type="secondary">
              Collected UGX {financeSnapshot.totalPaid.toLocaleString()} ·{" "}
              {financeSnapshot.collectionRate}% received
            </Text>
          </Space>
        </Flex>
      </section>

      <Spin spinning={isLoading}>
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
            <Card title="Project Pipeline" className="dashboard-card">
              {projectRows.length ? (
                <Table
                  columns={projectColumns}
                  dataSource={projectRows}
                  pagination={false}
                  scroll={{ x: 720 }}
                />
              ) : (
                <Empty description="No projects yet" />
              )}
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card title="Recent Activity" className="dashboard-card">
              {recentActivity.length ? (
                <List
                  itemLayout="horizontal"
                  dataSource={recentActivity}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<span className="activity-icon">{item.icon}</span>}
                        title={item.title}
                        description={
                          <Space direction="vertical" size={0}>
                            <Text>{item.description}</Text>
                            <Text type="secondary">
                              {formatRelativeDate(item.timestamp)}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No recent activity" />
              )}
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
                  {stageMetrics.counts.planning} project
                  {stageMetrics.counts.planning === 1 ? "" : "s"} waiting on
                  kickoff, approvals, or structuring.
                </Text>
                <Progress percent={stageMetrics.planning} showInfo={false} />
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="stage-card">
              <Space direction="vertical" size={12}>
                <BuildOutlined className="status-icon" />
                <Title level={4}>Execution</Title>
                <Text type="secondary">
                  {stageMetrics.counts.inExecution} project
                  {stageMetrics.counts.inExecution === 1 ? "" : "s"} currently
                  being delivered or mobilized.
                </Text>
                <Progress percent={stageMetrics.inExecution} showInfo={false} />
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="stage-card">
              <Space direction="vertical" size={12}>
                <CheckCircleOutlined className="status-icon" />
                <Title level={4}>Completed</Title>
                <Text type="secondary">
                  {stageMetrics.counts.completed} project
                  {stageMetrics.counts.completed === 1 ? "" : "s"} finished and
                  ready for handover or ongoing management.
                </Text>
                <Progress percent={stageMetrics.completed} showInfo={false} />
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="dashboard-grid">
          <Col xs={24} lg={12}>
            <Card title="Revenue Snapshot" className="dashboard-card">
              <Space direction="vertical" size={18} style={{ width: "100%" }}>
                <div>
                  <Flex justify="space-between" align="center">
                    <Text>Total Project Budget</Text>
                    <Text strong>UGX {financeSnapshot.totalBudget.toLocaleString()}</Text>
                  </Flex>
                  <Progress percent={100} showInfo={false} />
                </div>
                <div>
                  <Flex justify="space-between" align="center">
                    <Text>Collected To Date</Text>
                    <Text strong>UGX {financeSnapshot.totalPaid.toLocaleString()}</Text>
                  </Flex>
                  <Progress
                    percent={financeSnapshot.collectionRate}
                    showInfo={false}
                  />
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Demand Overview" className="dashboard-card">
              <List
                dataSource={[
                  {
                    label: "Maintenance requests",
                    value: maintenanceRequests.length,
                    icon: <ToolOutlined />,
                  },
                  {
                    label: "Design enquiries",
                    value: designRequests.length,
                    icon: <BuildOutlined />,
                  },
                  {
                    label: "Active maintenance services",
                    value: activeServices.length,
                    icon: <DollarOutlined />,
                  },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<span className="activity-icon">{item.icon}</span>}
                      title={item.label}
                    />
                    <Text strong>{item.value}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </AdminShell>
  );
}
