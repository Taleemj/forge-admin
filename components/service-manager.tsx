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
  Image,
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
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { MarkdownEditor, MarkdownPreview } from "@/components/markdown-editor";
import type {
  MaintenanceRequest,
  ManagementService,
} from "@/context/dashboard-context";

const { Text, Title } = Typography;
const { TextArea } = Input;

const imageFallback =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120'%3E%3Crect width='160' height='120' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='Arial' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";

type ServiceFormValues = Omit<
  ManagementService,
  "_id" | "images" | "media" | "createdAt" | "updatedAt"
> & {
  imageUploads?: UploadFile[];
  videoUploads?: UploadFile[];
};

interface ServiceManagerProps {
  services: ManagementService[];
  requests: MaintenanceRequest[];
  isLoading: boolean;
  onCreate: (data: FormData) => Promise<unknown>;
  onUpdate: (id: string, data: FormData) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onQuoteRequest: (data: {
    id: string;
    amount: number;
    notes?: string;
    status?: MaintenanceRequest["status"];
  }) => Promise<unknown>;
}

function uploadValueFromEvent(event: { fileList?: UploadFile[] } | UploadFile[]) {
  return Array.isArray(event) ? event : event?.fileList;
}

function billingLabel(period: ManagementService["billingPeriod"]) {
  const labels: Record<ManagementService["billingPeriod"], string> = {
    once: "one-time",
    month: "month",
    quarter: "quarter",
    year: "year",
  };
  return labels[period] ?? period;
}

export function ServiceManager({
  services,
  requests,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onQuoteRequest,
}: ServiceManagerProps) {
  const [form] = Form.useForm<ServiceFormValues>();
  const [quoteForm] = Form.useForm<{
    amount: number;
    notes?: string;
    status: MaintenanceRequest["status"];
  }>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ManagementService | null>(null);
  const [previewing, setPreviewing] = useState<ManagementService | null>(null);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedMediaUrls, setRemovedMediaUrls] = useState<string[]>([]);
  const [quoting, setQuoting] = useState<MaintenanceRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  const summary = useMemo(() => {
    const active = services.filter((service) => service.status === "active").length;
    const videos = services.reduce(
      (total, service) =>
        total + (service.media?.filter((item) => item.type === "video").length ?? 0),
      0,
    );
    const requested = requests.filter((request) => request.status === "requested").length;
    return { active, videos, requested };
  }, [requests, services]);

  const openCreate = () => {
    setEditing(null);
    setRemovedImages([]);
    setRemovedMediaUrls([]);
    form.resetFields();
    form.setFieldsValue({
      billingPeriod: "month",
      status: "active",
      descriptionMarkdown:
        "# Service Overview\n\n## What's Included\n- Add the client-facing service details here.",
    });
    setDrawerOpen(true);
  };

  const openEdit = (service: ManagementService) => {
    setEditing(service);
    setRemovedImages([]);
    setRemovedMediaUrls([]);
    form.resetFields();
    form.setFieldsValue(service);
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: ServiceFormValues) => {
    setSubmitting(true);
    try {
      const keptImages =
        editing?.images.filter((image) => !removedImages.includes(image)) ?? [];
      const retainedMedia =
        editing?.media?.length
          ? editing.media.filter(
              (item) =>
                !removedMediaUrls.includes(item.url) &&
                !removedImages.includes(item.url),
            )
          : keptImages.map((image, index) => ({
              id: `${editing?._id}-image-${index}`,
              type: "image" as const,
              url: image,
              thumbnail: image,
              title: `${editing?.title} image ${index + 1}`,
            }));

      const payload = new FormData();
      payload.append("title", values.title ?? "");
      payload.append("description", values.description ?? "");
      payload.append("helpText", values.helpText ?? "");
      payload.append("price", String(values.price ?? 0));
      payload.append("billingPeriod", values.billingPeriod ?? "month");
      payload.append("category", values.category ?? "");
      payload.append("status", values.status ?? "active");
      payload.append("descriptionMarkdown", values.descriptionMarkdown ?? "");
      payload.append("retainedImages", JSON.stringify(keptImages));
      payload.append("retainedMedia", JSON.stringify(retainedMedia));

      values.imageUploads?.forEach((file) => {
        if (file.originFileObj) payload.append("images", file.originFileObj);
      });

      values.videoUploads?.forEach((file) => {
        if (file.originFileObj) payload.append("mediaVideos", file.originFileObj);
      });

      if (editing) {
        await onUpdate(editing._id, payload);
        message.success("Service updated");
      } else {
        await onCreate(payload);
        message.success("Service created");
      }
      setDrawerOpen(false);
    } catch (error) {
      console.error("Save service error:", error);
      message.error("Failed to save service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      message.success("Service deleted");
    } catch {
      message.error("Failed to delete service");
    }
  };

  const openQuote = (request: MaintenanceRequest) => {
    setQuoting(request);
    quoteForm.resetFields();
    quoteForm.setFieldsValue({
      amount: request.quote?.amount,
      notes: request.quote?.notes,
      status: "quoted",
    });
  };

  const handleQuoteSubmit = async (values: {
    amount: number;
    notes?: string;
    status: MaintenanceRequest["status"];
  }) => {
    if (!quoting) return;
    setQuoteSubmitting(true);
    try {
      await onQuoteRequest({ id: quoting._id, ...values });
      message.success("Quote sent to client");
      setQuoting(null);
    } catch {
      message.error("Failed to send quote");
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const columns: ColumnsType<ManagementService> = [
    {
      title: "Service",
      dataIndex: "title",
      key: "title",
      render: (_, service) => (
        <Flex align="center" gap={12}>
          <Image
            src={service.images[0] || imageFallback}
            alt={service.title}
            width={64}
            height={48}
            className="listing-thumb"
            fallback={imageFallback}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{service.title}</Text>
            <Text type="secondary">{service.description}</Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: "Pricing",
      key: "pricing",
      render: (_, service) =>
        `Ugx ${service.price.toLocaleString()} / ${billingLabel(service.billingPeriod)}`,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category?: string) => category || "General",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: ManagementService["status"]) => {
        const color =
          status === "active" ? "success" : status === "draft" ? "warning" : "default";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Media",
      key: "media",
      render: (_, service) => (
        <Tag color="processing">
          {service.images.length + (service.media?.length ?? 0)} files
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, service) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewing(service)} />
          <Button icon={<EditOutlined />} onClick={() => openEdit(service)} />
          <Popconfirm
            title="Delete service?"
            description="Are you sure you want to delete this service?"
            onConfirm={() => handleDelete(service._id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const requestColumns: ColumnsType<MaintenanceRequest> = [
    {
      title: "Request",
      key: "request",
      render: (_, request) => {
        let client = "Guest";
        if (request.user && typeof request.user !== "string") {
          client = request.user.name;
        } else if (request.guestInfo) {
          client = `${request.guestInfo.name} (Guest)`;
        }
        
        const service =
          typeof request.service === "string" ? "Service" : request.service.title;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{service}</Text>
            <Text type="secondary">{client}</Text>
          </Space>
        );
      },
    },
    {
      title: "Location",
      key: "location",
      render: (_, request) => request.location?.label || "Pinned location",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: MaintenanceRequest["status"]) => (
        <Tag color={status === "quoted" ? "success" : "processing"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Quote",
      key: "quote",
      render: (_, request) =>
        request.quote?.amount
          ? `Ugx ${request.quote.amount.toLocaleString()}`
          : "Not quoted",
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, request) => (
        <Button icon={<EditOutlined />} onClick={() => openQuote(request)}>
          Quote
        </Button>
      ),
    },
  ];

  return (
    <AdminShell>
      <section className="dashboard-hero listing-hero">
        <Flex align="center" justify="space-between" className="dashboard-hero-inner">
          <Space direction="vertical" size={10}>
            <Text className="dashboard-kicker">Property maintenance</Text>
            <Title level={1}>Maintenance Services</Title>
            <Text className="dashboard-hero-copy">
              Configure maintenance services, pricing, client-facing details, and
              supporting service media.
            </Text>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Service
          </Button>
        </Flex>
      </section>

      <Flex gap={16} className="access-summary" wrap="wrap">
        <Card className="metric-card access-summary-card">
          <Space direction="vertical" size={2}>
            <Text type="secondary">Services</Text>
            <Title level={3}>{services.length}</Title>
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
            <Text type="secondary">Videos</Text>
            <Title level={3}>{summary.videos}</Title>
          </Space>
        </Card>
        <Card className="metric-card access-summary-card">
          <Space direction="vertical" size={2}>
            <Text type="secondary">Quote Requests</Text>
            <Title level={3}>{summary.requested}</Title>
          </Space>
        </Card>
      </Flex>

      <Card className="dashboard-card listing-card">
        <Table
          columns={columns}
          dataSource={services}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 980 }}
        />
      </Card>

      <Card title="Maintenance Quote Requests" className="dashboard-card listing-card dashboard-grid">
        <Table
          columns={requestColumns}
          dataSource={requests}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 760 }}
        />
      </Card>

      <Drawer
        title={editing ? `Edit ${editing.title}` : "New Service"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={760}
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
            label="Title"
            name="title"
            rules={[{ required: true, message: "Add a service title." }]}
          >
            <Input placeholder="Lawn & Compound Management" />
          </Form.Item>

          <Form.Item
            label="Short Description"
            name="description"
            rules={[{ required: true, message: "Add a short service description." }]}
          >
            <Input placeholder="Complete exterior care for residential properties." />
          </Form.Item>

          <Form.Item
            label="What's Included"
            name="helpText"
            rules={[{ required: true, message: "Add the included service details." }]}
          >
            <TextArea
              rows={4}
              placeholder="Describe scope, schedule, reporting, and service standards."
            />
          </Form.Item>

          <Flex gap={16} className="listing-form-row">
            <Form.Item
              label="Price"
              name="price"
              rules={[{ required: true, message: "Add a price." }]}
              className="listing-form-field"
            >
              <InputNumber min={0} prefix="Ugx " className="full-width" />
            </Form.Item>
            <Form.Item
              label="Billing"
              name="billingPeriod"
              className="listing-form-field"
              rules={[{ required: true, message: "Choose billing period." }]}
            >
              <Select
                options={[
                  { value: "once", label: "One-time" },
                  { value: "month", label: "Monthly" },
                  { value: "quarter", label: "Quarterly" },
                  { value: "year", label: "Yearly" },
                ]}
              />
            </Form.Item>
          </Flex>

          <Flex gap={16} className="listing-form-row">
            <Form.Item label="Category" name="category" className="listing-form-field">
              <Input placeholder="Exterior care" />
            </Form.Item>
            <Form.Item label="Status" name="status" className="listing-form-field">
              <Select
                options={[
                  { value: "active", label: "Active" },
                  { value: "draft", label: "Draft" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </Form.Item>
          </Flex>

          {editing &&
          editing.images.some((image) => !removedImages.includes(image)) ? (
            <Card size="small" className="stored-media-card">
              <Space direction="vertical" size={12} className="full-width">
                <Text strong>Stored images</Text>
                <Image.PreviewGroup>
                  <Flex gap={10} wrap="wrap" align="flex-start">
                    {editing.images
                      .filter((image) => !removedImages.includes(image))
                      .map((image) => (
                        <div key={image} className="stored-media-item">
                          <Image
                            src={image}
                            alt={editing.title}
                            width={104}
                            height={72}
                            className="listing-preview-image"
                          />
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              setRemovedImages((current) => [...current, image])
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                  </Flex>
                </Image.PreviewGroup>
              </Space>
            </Card>
          ) : null}

          {editing?.media?.some(
            (item) => item.type === "video" && !removedMediaUrls.includes(item.url),
          ) ? (
            <Card size="small" className="stored-media-card">
              <Space direction="vertical" size={12} className="full-width">
                <Text strong>Stored videos</Text>
                <Space direction="vertical" size={8} className="full-width">
                  {editing.media
                    .filter(
                      (item) =>
                        item.type === "video" &&
                        !removedMediaUrls.includes(item.url),
                    )
                    .map((item) => (
                      <Flex key={item.url} align="center" justify="space-between">
                        <Text ellipsis>{item.title || item.url}</Text>
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            setRemovedMediaUrls((current) => [...current, item.url])
                          }
                        >
                          Remove
                        </Button>
                      </Flex>
                    ))}
                </Space>
              </Space>
            </Card>
          ) : null}

          <Form.Item
            label="Upload Images"
            name="imageUploads"
            valuePropName="fileList"
            getValueFromEvent={uploadValueFromEvent}
            rules={
              editing
                ? []
                : [{ required: true, message: "Upload at least one service image." }]
            }
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

          <Form.Item label="Markdown Description" name="descriptionMarkdown">
            <MarkdownEditor />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        open={Boolean(previewing)}
        title={previewing?.title}
        onCancel={() => setPreviewing(null)}
        footer={<Button onClick={() => setPreviewing(null)}>Close</Button>}
        width={820}
      >
        {previewing ? (
          <Space direction="vertical" size={16} className="full-width">
            <Image.PreviewGroup>
              <Flex gap={12} wrap="wrap">
                {previewing.images.map((image) => (
                  <Image
                    key={image}
                    src={image}
                    alt={previewing.title}
                    width={150}
                    height={104}
                    className="listing-preview-image"
                  />
                ))}
                {!previewing.images.length ? (
                  <Image
                    src={imageFallback}
                    alt="No image uploaded"
                    width={150}
                    height={104}
                    className="listing-preview-image"
                    preview={false}
                  />
                ) : null}
              </Flex>
            </Image.PreviewGroup>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Price">
                Ugx {previewing.price.toLocaleString()} /{" "}
                {billingLabel(previewing.billingPeriod)}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                {previewing.category || "General"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">{previewing.status}</Descriptions.Item>
              <Descriptions.Item label="Description">
                {previewing.description}
              </Descriptions.Item>
              <Descriptions.Item label="What's Included">
                {previewing.helpText}
              </Descriptions.Item>
            </Descriptions>

            <Card title="Markdown Copy" size="small">
              <MarkdownPreview value={previewing.descriptionMarkdown} />
            </Card>
          </Space>
        ) : null}
      </Modal>

      <Drawer
        title="Send Maintenance Quote"
        open={Boolean(quoting)}
        onClose={() => setQuoting(null)}
        width={560}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setQuoting(null)}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => quoteForm.submit()}
              loading={quoteSubmitting}
            >
              Send Quote
            </Button>
          </Space>
        }
      >
        {quoting ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Client">
                {quoting.user && typeof quoting.user !== "string" 
                  ? quoting.user.name 
                  : quoting.guestInfo 
                    ? `${quoting.guestInfo.name} (Guest)`
                    : "Unknown"}
              </Descriptions.Item>
              {quoting.guestInfo && (
                <>
                  <Descriptions.Item label="Email">
                    {quoting.guestInfo.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {quoting.guestInfo.phone}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Service">
                {typeof quoting.service === "string"
                  ? "Service"
                  : quoting.service.title}
              </Descriptions.Item>
              <Descriptions.Item label="Pinned Location">
                {quoting.location?.label || "Pinned location"}
              </Descriptions.Item>
              <Descriptions.Item label="Property Notes">
                {quoting.propertyNotes || "No notes provided"}
              </Descriptions.Item>
            </Descriptions>

            <Form form={quoteForm} layout="vertical" onFinish={handleQuoteSubmit}>
              <Form.Item
                label="Quote Amount"
                name="amount"
                rules={[{ required: true, message: "Add quote amount." }]}
              >
                <InputNumber min={0} prefix="Ugx " className="full-width" />
              </Form.Item>
              <Form.Item label="Quote Notes" name="notes">
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item label="Status" name="status">
                <Select
                  options={[
                    { value: "quoted", label: "Quoted" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                />
              </Form.Item>
            </Form>
          </Space>
        ) : null}
      </Drawer>
    </AdminShell>
  );
}
