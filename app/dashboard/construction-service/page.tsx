"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
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
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { LocationMapPreview } from "@/components/location-map-preview";
import { MarkdownEditor } from "@/components/markdown-editor";
import {
  useConstructionService,
  type ConstructionRequest,
  type ConstructionService,
} from "@/hooks/useConstructionService";

const { Text, Title } = Typography;

type ConstructionServiceFormValues = Omit<
  ConstructionService,
  "_id" | "images" | "media" | "createdAt" | "updatedAt"
> & {
  imageUploads?: UploadFile[];
  videoUploads?: UploadFile[];
};

function uploadValueFromEvent(event: { fileList?: UploadFile[] } | UploadFile[]) {
  return Array.isArray(event) ? event : event?.fileList;
}

function clientName(request: ConstructionRequest) {
  if (request.guestInfo) return request.guestInfo.name;
  if (typeof request.user === "object") return request.user.name;
  return "Account user";
}

function clientContact(request: ConstructionRequest) {
  if (request.guestInfo) return `${request.guestInfo.email} · ${request.guestInfo.phone}`;
  if (typeof request.user === "object")
    return `${request.user.email}${request.user.phone ? ` · ${request.user.phone}` : ""}`;
  return "No contact details";
}

export default function ConstructionServiceAdminPage() {
  const {
    services,
    requests,
    isLoading,
    createService,
    updateService,
    deleteService,
    updateRequest,
    convertRequestToProject,
  } = useConstructionService();
  const [serviceForm] = Form.useForm<ConstructionServiceFormValues>();
  const [requestForm] = Form.useForm<{
    status: ConstructionRequest["status"];
    adminNotes?: string;
  }>();
  const [convertForm] = Form.useForm<{
    title?: string;
    totalBudget?: number;
    depositAmount?: number;
    adminNotes?: string;
  }>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ConstructionService | null>(null);
  const [editingRequest, setEditingRequest] = useState<ConstructionRequest | null>(null);
  const [convertingRequest, setConvertingRequest] =
    useState<ConstructionRequest | null>(null);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedMediaUrls, setRemovedMediaUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [convertSubmitting, setConvertSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setRemovedImages([]);
    setRemovedMediaUrls([]);
    serviceForm.resetFields();
    serviceForm.setFieldsValue({
      title: "Construction Service",
      subtitle: "Build your home remotely with Forge.",
      status: "active",
      processMarkdown:
        "# Construction Process\n\n1. Consultation and project scope\n2. Site review and budget alignment\n3. Quote and milestone plan\n4. Client account and project setup\n5. Construction tracking, updates, documents, and payments",
      consultationText:
        "Submit your interest and our admin team will reach out to confirm details, quote, and next steps.",
    });
    setDrawerOpen(true);
  };

  const openEdit = (service: ConstructionService) => {
    setEditing(service);
    setRemovedImages([]);
    setRemovedMediaUrls([]);
    serviceForm.resetFields();
    serviceForm.setFieldsValue(service);
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: ConstructionServiceFormValues) => {
    setSubmitting(true);
    try {
      const keptImages =
        editing?.images.filter((image) => !removedImages.includes(image)) ?? [];
      const retainedMedia =
        editing?.media?.filter(
          (item) =>
            !removedMediaUrls.includes(item.url) && !removedImages.includes(item.url),
        ) ?? [];
      const payload = new FormData();
      payload.append("title", values.title ?? "");
      payload.append("subtitle", values.subtitle ?? "");
      payload.append("description", values.description ?? "");
      payload.append("processMarkdown", values.processMarkdown ?? "");
      payload.append("consultationText", values.consultationText ?? "");
      payload.append("startingPrice", String(values.startingPrice ?? ""));
      payload.append("status", values.status ?? "draft");
      payload.append("retainedImages", JSON.stringify(keptImages));
      payload.append("retainedMedia", JSON.stringify(retainedMedia));

      values.imageUploads?.forEach((file) => {
        if (file.originFileObj) payload.append("images", file.originFileObj);
      });
      values.videoUploads?.forEach((file) => {
        if (file.originFileObj) payload.append("mediaVideos", file.originFileObj);
      });

      if (editing) {
        await updateService(editing._id, payload);
        message.success("Construction service updated");
      } else {
        await createService(payload);
        message.success("Construction service created");
      }
      setDrawerOpen(false);
    } catch (error) {
      console.error(error);
      message.error("Failed to save construction service");
    } finally {
      setSubmitting(false);
    }
  };

  const requestColumns: ColumnsType<ConstructionRequest> = [
    {
      title: "Client",
      key: "client",
      render: (_, request) => (
        <Space direction="vertical" size={0}>
          <Text strong>{clientName(request)}</Text>
          <Text type="secondary">{clientContact(request)}</Text>
        </Space>
      ),
    },
    {
      title: "Project",
      key: "project",
      render: (_, request) => (
        <Space direction="vertical" size={0}>
          <Text>{request.location?.label || "No location provided"}</Text>
          <Text type="secondary">
            {[request.budgetRange, request.timeline, request.meetingPreference]
              .filter(Boolean)
              .join(" · ") || "No preferences"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag color="processing">{status.replaceAll("_", " ")}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, request) => (
        <Space>
          <Button
            onClick={() => {
              setEditingRequest(request);
              requestForm.resetFields();
              requestForm.setFieldsValue({
                status: request.status,
                adminNotes: request.adminNotes,
              });
            }}
          >
            Update
          </Button>
          <Button
            type="primary"
            disabled={request.status === "converted_to_project"}
            onClick={() => {
              setConvertingRequest(request);
              convertForm.resetFields();
              convertForm.setFieldsValue({
                title: `Construction Project${request.location?.label ? ` - ${request.location.label}` : ""}`,
                adminNotes: request.adminNotes,
              });
            }}
          >
            Create Project
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminShell>
      <section className="dashboard-hero">
        <div className="dashboard-hero-inner">
          <Space direction="vertical" size={10}>
            <Text className="dashboard-kicker">Forge Housing Admin</Text>
            <Title level={1}>Construction Service</Title>
            <Text className="dashboard-hero-copy">
              Publish the public construction service page and follow up on
              client interest before creating a full construction project.
            </Text>
          </Space>
        </div>
      </section>

      <Space direction="vertical" size={16} className="full-width">
        <Card
          title="Public Construction Service Page"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Version
            </Button>
          }
          className="dashboard-card"
        >
          <Table
            rowKey="_id"
            loading={isLoading}
            dataSource={services}
            pagination={false}
            columns={[
              {
                title: "Title",
                dataIndex: "title",
                key: "title",
                render: (_, service) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>{service.title}</Text>
                    <Text type="secondary">{service.subtitle}</Text>
                  </Space>
                ),
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (status: ConstructionService["status"]) => (
                  <Tag color={status === "active" ? "success" : "default"}>
                    {status}
                  </Tag>
                ),
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, service) => (
                  <Space>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(service)}>
                      Edit
                    </Button>
                    <Popconfirm
                      title="Delete construction service?"
                      onConfirm={() => deleteService(service._id)}
                    >
                      <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Card title="Construction Interest Requests" className="dashboard-card">
          <Table
            rowKey="_id"
            loading={isLoading}
            dataSource={requests}
            columns={requestColumns}
            scroll={{ x: 900 }}
          />
        </Card>
      </Space>

      <Drawer
        title={editing ? "Edit construction service" : "Create construction service"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={760}
        destroyOnClose
      >
        <Form form={serviceForm} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Subtitle" name="subtitle">
            <Input />
          </Form.Item>
          <Form.Item label="Short description" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Process details" name="processMarkdown">
            <MarkdownEditor />
          </Form.Item>
          <Form.Item label="Consultation CTA text" name="consultationText">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Starting price" name="startingPrice">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Active", value: "active" },
                { label: "Draft", value: "draft" },
                { label: "Archived", value: "archived" },
              ]}
            />
          </Form.Item>

          {editing?.images?.length ? (
            <Form.Item label="Existing images">
              <Space wrap>
                {editing.images.map((image) => (
                  <Tag
                    key={image}
                    closable
                    onClose={() => setRemovedImages((current) => [...current, image])}
                  >
                    {image.split("/").pop()}
                  </Tag>
                ))}
              </Space>
            </Form.Item>
          ) : null}

          {editing?.media?.length ? (
            <Form.Item label="Existing media">
              <Space wrap>
                {editing.media.map((item) => (
                  <Tag
                    key={item.url}
                    closable
                    onClose={() => setRemovedMediaUrls((current) => [...current, item.url])}
                  >
                    {item.type}: {item.title || item.url.split("/").pop()}
                  </Tag>
                ))}
              </Space>
            </Form.Item>
          ) : null}

          <Form.Item
            label="Upload images"
            name="imageUploads"
            valuePropName="fileList"
            getValueFromEvent={uploadValueFromEvent}
          >
            <Upload beforeUpload={() => false} multiple listType="picture">
              <Button icon={<UploadOutlined />}>Select images</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            label="Upload videos"
            name="videoUploads"
            valuePropName="fileList"
            getValueFromEvent={uploadValueFromEvent}
          >
            <Upload beforeUpload={() => false} multiple>
              <Button icon={<UploadOutlined />}>Select videos</Button>
            </Upload>
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={submitting}>
            Save construction service
          </Button>
        </Form>
      </Drawer>

      <Modal
        title="Update construction request"
        open={Boolean(editingRequest)}
        onCancel={() => setEditingRequest(null)}
        footer={null}
        width={720}
      >
        {editingRequest ? (
          <Card size="small" className="access-modules-card" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={10} className="full-width">
              <Space direction="vertical" size={0}>
                <Text strong>{clientName(editingRequest)}</Text>
                <Text type="secondary">{clientContact(editingRequest)}</Text>
              </Space>
              <Space direction="vertical" size={8} className="full-width">
                <Text strong>Project location</Text>
                <LocationMapPreview location={editingRequest.location} />
              </Space>
              <Space wrap>
                {editingRequest.budgetRange ? (
                  <Tag color="blue">Budget: {editingRequest.budgetRange}</Tag>
                ) : null}
                {editingRequest.timeline ? (
                  <Tag color="purple">Timeline: {editingRequest.timeline}</Tag>
                ) : null}
                {editingRequest.meetingPreference ? (
                  <Tag color="cyan">Follow-up: {editingRequest.meetingPreference}</Tag>
                ) : null}
              </Space>
              {editingRequest.notes ? (
                <Space direction="vertical" size={0}>
                  <Text strong>Client notes</Text>
                  <Text>{editingRequest.notes}</Text>
                </Space>
              ) : null}
            </Space>
          </Card>
        ) : null}
        <Form
          form={requestForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!editingRequest) return;
            setRequestSubmitting(true);
            try {
              await updateRequest(editingRequest._id, values);
              message.success("Request updated");
              setEditingRequest(null);
            } catch {
              message.error("Failed to update request");
            } finally {
              setRequestSubmitting(false);
            }
          }}
        >
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Requested", value: "requested" },
                { label: "Contacted", value: "contacted" },
                { label: "Meeting scheduled", value: "meeting_scheduled" },
                { label: "Quoted", value: "quoted" },
                { label: "Converted to project", value: "converted_to_project" },
                { label: "Rejected", value: "rejected" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Admin notes" name="adminNotes">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={requestSubmitting}>
            Save request
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Create project from construction request"
        open={Boolean(convertingRequest)}
        onCancel={() => setConvertingRequest(null)}
        footer={null}
        width={620}
      >
        {convertingRequest ? (
          <Card size="small" className="access-modules-card" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={10} className="full-width">
              <Space direction="vertical" size={0}>
                <Text strong>{clientName(convertingRequest)}</Text>
                <Text type="secondary">{clientContact(convertingRequest)}</Text>
              </Space>
              <Space direction="vertical" size={8} className="full-width">
                <Text strong>Project location</Text>
                <LocationMapPreview location={convertingRequest.location} />
              </Space>
            </Space>
          </Card>
        ) : null}
        <Form
          form={convertForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!convertingRequest) return;
            setConvertSubmitting(true);
            try {
              await convertRequestToProject(convertingRequest._id, values);
              message.success("Project created from construction request");
              setConvertingRequest(null);
            } catch {
              message.error("Failed to create project from request");
            } finally {
              setConvertSubmitting(false);
            }
          }}
        >
          <Form.Item label="Project title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Total budget" name="totalBudget">
            <InputNumber min={0} prefix="Ugx " className="full-width" />
          </Form.Item>
          <Form.Item label="Deposit amount" name="depositAmount">
            <InputNumber min={0} prefix="Ugx " className="full-width" />
          </Form.Item>
          <Form.Item label="Admin notes" name="adminNotes">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Text type="secondary">
            Guest requests create or reuse a client account. New accounts receive
            temporary credentials by email when email delivery is configured.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={convertSubmitting}>
              Create project workspace
            </Button>
          </div>
        </Form>
      </Modal>
    </AdminShell>
  );
}
