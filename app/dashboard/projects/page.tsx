"use client";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import type { Project, ProjectMilestone } from "@/context/dashboard-context";
import { useProjects, type ProjectPayload } from "@/hooks/useProjects";

const { Text, Title } = Typography;
const { TextArea } = Input;

type ProjectFormValues = ProjectPayload;

type MilestoneFormValues = {
  title: string;
  description?: string;
  targetProgress: number;
  status: ProjectMilestone["status"];
  updateTitle?: string;
  updateDescription?: string;
  imageUploads?: UploadFile[];
  videoUploads?: UploadFile[];
};

function uploadValueFromEvent(event: { fileList?: UploadFile[] } | UploadFile[]) {
  return Array.isArray(event) ? event : event?.fileList;
}

function getClientName(project: Project) {
  return typeof project.client === "string" ? "Client" : project.client.name;
}

function optionLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

const projectTypeOptions = [
  { value: "construction", label: "Construction" },
  { value: "design", label: "Design" },
  { value: "management", label: "Maintenance" },
];

const statusOptions = [
  "planning",
  "construction",
  "completed",
  "pending",
  "initialized",
  "waiting_for_payment",
].map((status) => ({ value: status, label: optionLabel(status) }));

const installmentStatusOptions = ["pending", "due", "paid", "overdue"].map(
  (status) => ({ value: status, label: optionLabel(status) }),
);

const milestoneStatusOptions = ["pending", "in_progress", "completed"].map(
  (status) => ({ value: status, label: optionLabel(status) }),
);

const defaultMilestones: ProjectMilestone[] = [
  {
    title: "Project Setup",
    description: "Client requirements, site checks, and initial documentation.",
    targetProgress: 10,
    status: "pending",
    updates: [],
  },
  {
    title: "Primary Work",
    description: "Main design, construction, or maintenance execution phase.",
    targetProgress: 60,
    status: "pending",
    updates: [],
  },
  {
    title: "Review & Handover",
    description: "Final checks, approvals, and client handover.",
    targetProgress: 100,
    status: "pending",
    updates: [],
  },
];

export default function ProjectsPage() {
  const [form] = Form.useForm<ProjectFormValues>();
  const [milestoneForm] = Form.useForm<MilestoneFormValues>();
  const {
    projects,
    clients,
    lands,
    designs,
    isLoading,
    createProject,
    updateProject,
    updateMilestone,
    deleteProject,
  } = useProjects();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [previewing, setPreviewing] = useState<Project | null>(null);
  const [milestoneProject, setMilestoneProject] = useState<Project | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);

  const summary = useMemo(() => {
    const active = projects.filter((project) => project.status !== "completed").length;
    const dueInstallments = projects.reduce(
      (total, project) =>
        total +
        project.budget.breakdown.filter((installment) => installment.status === "due")
          .length,
      0,
    );
    return { active, dueInstallments };
  }, [projects]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      type: "construction",
      status: "planning",
      progress: 0,
      stage: "Project Setup",
      budget: {
        total: 0,
        paid: 0,
        breakdown: [
          {
            title: "Deposit",
            amount: 0,
            dueAtProgress: 0,
            status: "due",
          },
          {
            title: "Mid-project Installment",
            amount: 0,
            dueAtProgress: 50,
            status: "pending",
          },
          {
            title: "Final Installment",
            amount: 0,
            dueAtProgress: 100,
            status: "pending",
          },
        ],
      },
      milestones: defaultMilestones,
    });
    setDrawerOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    form.resetFields();
    form.setFieldsValue({
      title: project.title,
      type: project.type,
      status: project.status,
      progress: project.progress,
      stage: project.stage,
      client:
        typeof project.client === "string" ? project.client : project.client._id,
      landId: typeof project.landId === "string" ? project.landId : project.landId?._id,
      designId:
        typeof project.designId === "string" ? project.designId : project.designId?._id,
      budget: project.budget,
      milestones: project.milestones,
    });
    setDrawerOpen(true);
  };

  const openMilestoneUpdate = (project: Project, milestone: ProjectMilestone) => {
    setMilestoneProject(project);
    setEditingMilestone(milestone);
    milestoneForm.resetFields();
    milestoneForm.setFieldsValue({
      title: milestone.title,
      description: milestone.description,
      targetProgress: milestone.targetProgress,
      status: milestone.status,
      updateTitle: milestone.title,
    });
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateProject({ id: editing._id, payload: values });
        message.success("Project updated");
      } else {
        await createProject(values);
        message.success("Project created");
      }
      setDrawerOpen(false);
    } catch (error) {
      console.error("Save project error:", error);
      message.error("Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMilestoneSubmit = async (values: MilestoneFormValues) => {
    if (!milestoneProject || !editingMilestone?._id) return;

    setMilestoneSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title", values.title);
      payload.append("description", values.description ?? "");
      payload.append("targetProgress", String(values.targetProgress ?? 0));
      payload.append("status", values.status);
      payload.append("updateTitle", values.updateTitle ?? values.title);
      payload.append("updateDescription", values.updateDescription ?? "");

      values.imageUploads?.forEach((file) => {
        if (file.originFileObj) payload.append("images", file.originFileObj);
      });
      values.videoUploads?.forEach((file) => {
        if (file.originFileObj) payload.append("mediaVideos", file.originFileObj);
      });

      await updateMilestone({
        projectId: milestoneProject._id,
        milestoneId: editingMilestone._id,
        data: payload,
      });
      message.success("Milestone updated and client notified");
      setMilestoneProject(null);
      setEditingMilestone(null);
    } catch (error) {
      console.error("Save milestone error:", error);
      message.error("Failed to update milestone");
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      message.success("Project deleted");
    } catch {
      message.error("Failed to delete project");
    }
  };

  const columns: ColumnsType<Project> = [
    {
      title: "Project",
      dataIndex: "title",
      key: "title",
      render: (_, project) => (
        <Space direction="vertical" size={0}>
          <Text strong>{project.title}</Text>
          <Text type="secondary">{getClientName(project)}</Text>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag>{optionLabel(type)}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "completed" ? "success" : "processing"}>
          {optionLabel(status)}
        </Tag>
      ),
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      render: (progress: number) => <Progress percent={progress} size="small" />,
    },
    {
      title: "Budget",
      key: "budget",
      render: (_, project) => `$${project.budget.total.toLocaleString()}`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, project) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewing(project)} />
          <Button icon={<EditOutlined />} onClick={() => openEdit(project)} />
          <Popconfirm
            title="Delete project?"
            onConfirm={() => handleDelete(project._id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminShell>
      <section className="dashboard-hero listing-hero">
        <Flex align="center" justify="space-between" className="dashboard-hero-inner">
          <Space direction="vertical" size={10}>
            <Text className="dashboard-kicker">Client work</Text>
            <Title level={1}>Projects</Title>
            <Text className="dashboard-hero-copy">
              Set up construction, design, and maintenance projects with budgets,
              progress-based installments, and milestone updates.
            </Text>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Project
          </Button>
        </Flex>
      </section>

      <Flex gap={16} className="access-summary" wrap="wrap">
        <Card className="metric-card access-summary-card">
          <Space direction="vertical" size={2}>
            <Text type="secondary">Projects</Text>
            <Title level={3}>{projects.length}</Title>
          </Space>
        </Card>
        <Card className="metric-card access-summary-card">
          <Space direction="vertical" size={2}>
            <Text type="secondary">Active</Text>
            <Title level={3}>{summary.active}</Title>
          </Space>
        </Card>
        <Card className="metric-card access-summary-card">
          <Space direction="vertical" size={2}>
            <Text type="secondary">Due Installments</Text>
            <Title level={3}>{summary.dueInstallments}</Title>
          </Space>
        </Card>
      </Flex>

      <Card className="dashboard-card listing-card">
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 980 }}
        />
      </Card>

      <Drawer
        title={editing ? `Edit ${editing.title}` : "New Project"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={860}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()} loading={submitting}>
              Save
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Project Title"
            name="title"
            rules={[{ required: true, message: "Add a project title." }]}
          >
            <Input placeholder="Mombasa Coastal Villa" />
          </Form.Item>

          <Flex gap={16} className="listing-form-row">
            <Form.Item
              label="Client"
              name="client"
              className="listing-form-field"
              rules={[{ required: true, message: "Select a client." }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={clients.map((client) => ({
                  value: client._id,
                  label: `${client.name} (${client.email})`,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              className="listing-form-field"
              rules={[{ required: true }]}
            >
              <Select options={projectTypeOptions} />
            </Form.Item>
          </Flex>

          <Flex gap={16} className="listing-form-row">
            <Form.Item label="Status" name="status" className="listing-form-field">
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item label="Progress" name="progress" className="listing-form-field">
              <InputNumber min={0} max={100} suffix="%" className="full-width" />
            </Form.Item>
            <Form.Item label="Current Stage" name="stage" className="listing-form-field">
              <Input placeholder="Foundation Work" />
            </Form.Item>
          </Flex>

          <Flex gap={16} className="listing-form-row">
            <Form.Item label="Linked Land" name="landId" className="listing-form-field">
              <Select
                allowClear
                options={lands.map((land) => ({
                  value: land._id,
                  label: `${land.title} - ${land.location}`,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Linked Design"
              name="designId"
              className="listing-form-field"
            >
              <Select
                allowClear
                options={designs.map((design) => ({
                  value: design._id,
                  label: design.title,
                }))}
              />
            </Form.Item>
          </Flex>

          <Card title="Budget" size="small" className="stored-media-card">
            <Flex gap={16} className="listing-form-row">
              <Form.Item
                label="Total Budget"
                name={["budget", "total"]}
                className="listing-form-field"
                rules={[{ required: true, message: "Add total budget." }]}
              >
                <InputNumber min={0} prefix="$" className="full-width" />
              </Form.Item>
              <Form.Item
                label="Paid"
                name={["budget", "paid"]}
                className="listing-form-field"
              >
                <InputNumber min={0} prefix="$" className="full-width" />
              </Form.Item>
            </Flex>

            <Form.List name={["budget", "breakdown"]}>
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} className="full-width">
                  {fields.map((field) => (
                    <Card size="small" key={field.key}>
                      <Flex gap={12} className="listing-form-row">
                        <Form.Item
                          label="Installment"
                          name={[field.name, "title"]}
                          className="listing-form-field"
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          label="Amount"
                          name={[field.name, "amount"]}
                          className="listing-form-field"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={0} prefix="$" className="full-width" />
                        </Form.Item>
                        <Form.Item
                          label="Due at"
                          name={[field.name, "dueAtProgress"]}
                          className="listing-form-field"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={0} max={100} suffix="%" className="full-width" />
                        </Form.Item>
                        <Form.Item
                          label="Status"
                          name={[field.name, "status"]}
                          className="listing-form-field"
                        >
                          <Select options={installmentStatusOptions} />
                        </Form.Item>
                      </Flex>
                      <Button danger onClick={() => remove(field.name)}>
                        Remove Installment
                      </Button>
                    </Card>
                  ))}
                  <Button onClick={() => add({ status: "pending", dueAtProgress: 0 })}>
                    Add Installment
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Card title="Milestones" size="small" className="stored-media-card">
            <Form.List name="milestones">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} className="full-width">
                  {fields.map((field) => (
                    <Card size="small" key={field.key}>
                      <Flex gap={12} className="listing-form-row">
                        <Form.Item
                          label="Milestone"
                          name={[field.name, "title"]}
                          className="listing-form-field"
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          label="Target Progress"
                          name={[field.name, "targetProgress"]}
                          className="listing-form-field"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={0} max={100} suffix="%" className="full-width" />
                        </Form.Item>
                        <Form.Item
                          label="Status"
                          name={[field.name, "status"]}
                          className="listing-form-field"
                        >
                          <Select options={milestoneStatusOptions} />
                        </Form.Item>
                      </Flex>
                      <Form.Item label="Description" name={[field.name, "description"]}>
                        <TextArea rows={2} />
                      </Form.Item>
                      <Button danger onClick={() => remove(field.name)}>
                        Remove Milestone
                      </Button>
                    </Card>
                  ))}
                  <Button
                    onClick={() =>
                      add({ status: "pending", targetProgress: 0, updates: [] })
                    }
                  >
                    Add Milestone
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>
        </Form>
      </Drawer>

      <Modal
        open={Boolean(previewing)}
        title={previewing?.title}
        onCancel={() => setPreviewing(null)}
        footer={<Button onClick={() => setPreviewing(null)}>Close</Button>}
        width={920}
      >
        {previewing ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Client">
                {getClientName(previewing)}
              </Descriptions.Item>
              <Descriptions.Item label="Stage">{previewing.stage}</Descriptions.Item>
              <Descriptions.Item label="Budget">
                ${previewing.budget.total.toLocaleString()} total, $
                {previewing.budget.paid.toLocaleString()} paid
              </Descriptions.Item>
            </Descriptions>

            <Card title="Milestones" size="small">
              <Space direction="vertical" size={12} className="full-width">
                {previewing.milestones.map((milestone) => (
                  <Card key={milestone._id || milestone.title} size="small">
                    <Flex align="center" justify="space-between" gap={16}>
                      <Space direction="vertical" size={2}>
                        <Text strong>{milestone.title}</Text>
                        <Text type="secondary">{milestone.description}</Text>
                        <Tag>{optionLabel(milestone.status)}</Tag>
                      </Space>
                      <Space>
                        <Progress
                          type="circle"
                          percent={milestone.targetProgress}
                          size={54}
                        />
                        <Button
                          icon={<EditOutlined />}
                          disabled={!milestone._id}
                          onClick={() => openMilestoneUpdate(previewing, milestone)}
                        >
                          Update
                        </Button>
                      </Space>
                    </Flex>
                  </Card>
                ))}
              </Space>
            </Card>
          </Space>
        ) : null}
      </Modal>

      <Drawer
        title={editingMilestone ? `Update ${editingMilestone.title}` : "Update Milestone"}
        open={Boolean(editingMilestone)}
        onClose={() => {
          setMilestoneProject(null);
          setEditingMilestone(null);
        }}
        width={620}
        destroyOnClose
        extra={
          <Space>
            <Button
              onClick={() => {
                setMilestoneProject(null);
                setEditingMilestone(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => milestoneForm.submit()}
              loading={milestoneSubmitting}
            >
              Save Update
            </Button>
          </Space>
        }
      >
        <Form form={milestoneForm} layout="vertical" onFinish={handleMilestoneSubmit}>
          <Form.Item label="Milestone" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Flex gap={16} className="listing-form-row">
            <Form.Item
              label="Target Progress"
              name="targetProgress"
              className="listing-form-field"
            >
              <InputNumber min={0} max={100} suffix="%" className="full-width" />
            </Form.Item>
            <Form.Item label="Status" name="status" className="listing-form-field">
              <Select options={milestoneStatusOptions} />
            </Form.Item>
          </Flex>
          <Form.Item label="Update Title" name="updateTitle">
            <Input />
          </Form.Item>
          <Form.Item label="Update Description" name="updateDescription">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="Upload Images"
            name="imageUploads"
            valuePropName="fileList"
            getValueFromEvent={uploadValueFromEvent}
          >
            <Upload
              accept="image/*"
              beforeUpload={() => false}
              multiple
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Choose Images</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            label="Upload Videos"
            name="videoUploads"
            valuePropName="fileList"
            getValueFromEvent={uploadValueFromEvent}
          >
            <Upload accept="video/*" beforeUpload={() => false} multiple>
              <Button icon={<UploadOutlined />}>Choose Videos</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>
    </AdminShell>
  );
}
