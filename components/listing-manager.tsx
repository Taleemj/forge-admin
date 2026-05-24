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
import type { DesignRequest } from "@/context/dashboard-context";

const { Text, Title } = Typography;

const imageFallback =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120'%3E%3Crect width='160' height='120' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='Arial' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";

export type ListingKind = "land" | "design" | "house";

export type AdminListing = {
  _id: string;
  title: string;
  price: number;
  images: string[];
  descriptionMarkdown?: string;
  status?: "available" | "sold" | "under-construction";
  location?: string;
  size?: string;
  bedrooms?: number;
  bathrooms?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  floorPlan?: string;
  media?: Array<{
    id?: string;
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    title?: string;
  }>;
};

type ListingFormValues = Omit<AdminListing, "_id" | "images"> & {
  imageUploads?: UploadFile[];
  videoUploads?: UploadFile[];
  floorPlanUpload?: UploadFile[];
  latitude?: number;
  longitude?: number;
};

interface ListingManagerProps {
  kind: ListingKind;
  listings: AdminListing[];
  designRequests?: DesignRequest[];
  isLoading: boolean;
  onCreate: (data: FormData) => Promise<unknown>;
  onUpdate: (id: string, data: FormData) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onUpdateDesignRequest?: (data: {
    id: string;
    status: DesignRequest["status"];
    adminNotes?: string;
  }) => Promise<unknown>;
}

function uploadValueFromEvent(event: { fileList?: UploadFile[] } | UploadFile[]) {
  return Array.isArray(event) ? event : event?.fileList;
}

export function ListingManager({
  kind,
  listings,
  designRequests = [],
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onUpdateDesignRequest,
}: ListingManagerProps) {
  const [form] = Form.useForm<ListingFormValues>();
  const [requestForm] = Form.useForm<{
    status: DesignRequest["status"];
    adminNotes?: string;
  }>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminListing | null>(null);
  const [previewing, setPreviewing] = useState<AdminListing | null>(null);
  const [editingRequest, setEditingRequest] = useState<DesignRequest | null>(null);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedMediaUrls, setRemovedMediaUrls] = useState<string[]>([]);
  const [removeFloorPlan, setRemoveFloorPlan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const copy = useMemo(() => {
    const isLand = kind === "land";
    const isDesign = kind === "design";
    const isHouse = kind === "house";

    return {
      title: isLand ? "Land Listings" : isHouse ? "Houses for Sale" : "House Designs",
      kicker: isLand ? "Marketplace inventory" : isHouse ? "Property listings" : "Design catalogue",
      description: isLand
        ? "Create, edit, publish, and retire land listings."
        : isHouse
        ? "Manage house listings, bedroom/bathroom counts, location, and gallery media."
        : "Manage design packages, floor plans, gallery media, pricing, and markdown descriptions.",
      createLabel: isLand ? "New Land Listing" : isHouse ? "New House Listing" : "New Design",
    };
  }, [kind]);

  const openCreate = () => {
    setEditing(null);
    setRemovedImages([]);
    setRemovedMediaUrls([]);
    setRemoveFloorPlan(false);
    form.resetFields();
    form.setFieldsValue({
      status: "available",
      descriptionMarkdown:
        kind === "land"
          ? "# Listing Overview\n\n## Highlights\n- Add the strongest buyer-facing details here."
          : "# Design Overview\n\n## Included In The Package\n- Add package deliverables here.",
    });
    setDrawerOpen(true);
  };

  const openEdit = (listing: AdminListing) => {
    setEditing(listing);
    setRemovedImages([]);
    setRemovedMediaUrls([]);
    setRemoveFloorPlan(false);
    form.resetFields();
    form.setFieldsValue({
      ...listing,
      latitude: listing.coordinates?.latitude,
      longitude: listing.coordinates?.longitude,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: ListingFormValues) => {
    setSubmitting(true);
    try {
      const keptImages =
        editing?.images.filter((image) => !removedImages.includes(image)) ?? [];
      const retainedMedia =
        editing?.media?.length
          ? editing.media.filter(
              (item) =>
                !removedMediaUrls.includes(item.url) &&
                !removedImages.includes(item.url) &&
                !(removeFloorPlan && item.url === editing.floorPlan),
            )
          : [
              ...keptImages.map((image, index) => ({
                id: `${editing?._id}-image-${index}`,
                type: "image" as const,
                url: image,
                thumbnail: image,
                title: `${editing?.title} image ${index + 1}`,
              })),
              ...(editing?.floorPlan && !removeFloorPlan
                ? [
                    {
                      id: `${editing._id}-floor-plan`,
                      type: "image" as const,
                      url: editing.floorPlan,
                      thumbnail: editing.floorPlan,
                      title: `${editing.title} floor plan`,
                    },
                  ]
                : []),
            ];

      const payload = new FormData();
      payload.append("title", values.title ?? "");
      payload.append("price", String(values.price ?? 0));
      payload.append("descriptionMarkdown", values.descriptionMarkdown ?? "");
      payload.append("retainedImages", JSON.stringify(keptImages));
      payload.append("retainedMedia", JSON.stringify(retainedMedia));

      if (kind === "land" || kind === "house") {
        payload.append("status", values.status ?? "available");
        payload.append("location", values.location ?? "");
        payload.append("size", values.size ?? "");
        if (values.latitude !== undefined) payload.append("latitude", String(values.latitude));
        if (values.longitude !== undefined) payload.append("longitude", String(values.longitude));

        if (kind === "house") {
          payload.append("bedrooms", String(values.bedrooms ?? 0));
          payload.append("bathrooms", String(values.bathrooms ?? 0));
        }
      } else {
        payload.append("description", values.description ?? "");
        payload.append("removeFloorPlan", String(removeFloorPlan));
      }

      values.imageUploads?.forEach((file) => {
        if (file.originFileObj) payload.append("images", file.originFileObj);
      });

      values.videoUploads?.forEach((file) => {
        if (file.originFileObj) payload.append("mediaVideos", file.originFileObj);
      });

      values.floorPlanUpload?.forEach((file) => {
        if (file.originFileObj) payload.append("floorPlan", file.originFileObj);
      });

      if (editing) {
        await onUpdate(editing._id, payload);
        message.success("Listing updated");
      } else {
        await onCreate(payload);
        message.success("Listing created");
      }
      setDrawerOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      message.error("Failed to save listing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      message.success("Listing deleted");
    } catch {
      message.error("Failed to delete listing");
    }
  };

  const openRequest = (request: DesignRequest) => {
    setEditingRequest(request);
    requestForm.resetFields();
    requestForm.setFieldsValue({
      status: request.status,
      adminNotes: request.adminNotes,
    });
  };

  const handleRequestSubmit = async (values: {
    status: DesignRequest["status"];
    adminNotes?: string;
  }) => {
    if (!editingRequest || !onUpdateDesignRequest) return;
    setRequestSubmitting(true);
    try {
      await onUpdateDesignRequest({ id: editingRequest._id, ...values });
      message.success("Design request updated");
      setEditingRequest(null);
    } catch {
      message.error("Failed to update design request");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const columns: ColumnsType<AdminListing> = [
    {
      title: "Listing",
      dataIndex: "title",
      key: "title",
      render: (_, listing) => (
        <Flex align="center" gap={12}>
          <Image
            src={listing.images[0] || imageFallback}
            alt={listing.title}
            width={64}
            height={48}
            className="listing-thumb"
            fallback={imageFallback}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{listing.title}</Text>
            <Text type="secondary">
              {kind === "design" ? listing.description : listing.location}
            </Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `Ugx ${price.toLocaleString()}`,
    },
    {
      title: kind === "design" ? "Assets" : "Status",
      key: "status",
      render: (_, listing) =>
        kind === "design" ? (
          <Tag color={listing.floorPlan ? "success" : "warning"}>
            {listing.floorPlan ? "Floor plan" : "Needs plan"}
          </Tag>
        ) : (
          <Tag
            color={
              listing.status === "available"
                ? "success"
                : listing.status === "under-construction"
                ? "processing"
                : "default"
            }
          >
            {listing.status}
          </Tag>
        ),
    },
    {
      title: "Media",
      key: "media",
      render: (_, listing) => (
        <Tag color="processing">
          {listing.images.length + (listing.media?.length ?? 0)} files
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, listing) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewing(listing)} />
          <Button icon={<EditOutlined />} onClick={() => openEdit(listing)} />
          <Popconfirm
            title="Delete listing?"
            description="Are you sure you want to delete this listing?"
            onConfirm={() => handleDelete(listing._id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const designRequestColumns: ColumnsType<DesignRequest> = [
    {
      title: "Request",
      key: "request",
      render: (_, request) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {typeof request.design === "string" ? "Design" : request.design.title}
          </Text>
          <Text type="secondary">
            {typeof request.user === "string" ? "Client" : request.user.name}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: DesignRequest["status"]) => <Tag>{status}</Tag>,
    },
    {
      title: "Notes",
      key: "notes",
      render: (_, request) => request.notes || "No client notes",
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, request) => (
        <Button icon={<EditOutlined />} onClick={() => openRequest(request)}>
          Update
        </Button>
      ),
    },
  ];

  return (
    <AdminShell>
      <section className="dashboard-hero listing-hero">
        <Flex align="center" justify="space-between" className="dashboard-hero-inner">
          <Space direction="vertical" size={10}>
            <Text className="dashboard-kicker">{copy.kicker}</Text>
            <Title level={1}>{copy.title}</Title>
            <Text className="dashboard-hero-copy">{copy.description}</Text>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {copy.createLabel}
          </Button>
        </Flex>
      </section>

      <Card className="dashboard-card listing-card">
        <Table
          columns={columns}
          dataSource={listings}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 920 }}
        />
      </Card>

      {kind === "design" ? (
        <Card title="Design Interest Requests" className="dashboard-card listing-card dashboard-grid">
          <Table
            columns={designRequestColumns}
            dataSource={designRequests}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 6 }}
            scroll={{ x: 760 }}
          />
        </Card>
      ) : null}

      <Drawer
        title={editing ? `Edit ${editing.title}` : copy.createLabel}
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
            rules={[{ required: true, message: "Add a listing title." }]}
          >
            <Input placeholder={kind === "land" ? "Kira Suburb Lot" : "Modern Villa"} />
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

            {kind !== "design" ? (
              <Form.Item label="Status" name="status" className="listing-form-field">
                <Select
                  options={[
                    { value: "available", label: "Available" },
                    { value: "sold", label: "Sold" },
                    ...(kind === "house"
                      ? [{ value: "under-construction", label: "Under Construction" }]
                      : []),
                  ]}
                />
              </Form.Item>
            ) : (
              <Form.Item label="Short Description" name="description" className="listing-form-field">
                <Input placeholder="A 3-bedroom sustainable home..." />
              </Form.Item>
            )}
          </Flex>

          {kind !== "design" ? (
            <>
              <Flex gap={16} className="listing-form-row">
                <Form.Item label="Location" name="location" className="listing-form-field">
                  <Input placeholder="Wakiso, Uganda" />
                </Form.Item>
                <Form.Item label="Size" name="size" className="listing-form-field">
                  <Input placeholder={kind === "land" ? "0.25 Acre" : "250 sqm"} />
                </Form.Item>
              </Flex>
              {kind === "house" ? (
                <Flex gap={16} className="listing-form-row">
                  <Form.Item label="Bedrooms" name="bedrooms" className="listing-form-field">
                    <InputNumber min={0} className="full-width" />
                  </Form.Item>
                  <Form.Item label="Bathrooms" name="bathrooms" className="listing-form-field">
                    <InputNumber min={0} className="full-width" />
                  </Form.Item>
                </Flex>
              ) : null}
              <Flex gap={16} className="listing-form-row">
                <Form.Item label="Latitude" name="latitude" className="listing-form-field">
                  <InputNumber className="full-width" step={0.0001} />
                </Form.Item>
                <Form.Item label="Longitude" name="longitude" className="listing-form-field">
                  <InputNumber className="full-width" step={0.0001} />
                </Form.Item>
              </Flex>
            </>
          ) : (
            <>
              {editing?.floorPlan && !removeFloorPlan ? (
                <Card size="small" className="stored-media-card">
                  <Flex align="center" justify="space-between" className="stored-media-head">
                    <Text strong>Stored floor plan</Text>
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => setRemoveFloorPlan(true)}
                    >
                      Remove
                    </Button>
                  </Flex>
                  <Image
                    src={editing.floorPlan}
                    alt={`${editing.title} floor plan`}
                    width={160}
                    height={110}
                    className="listing-preview-image"
                  />
                </Card>
              ) : (
                <Form.Item
                  label="Upload Floor Plan"
                  name="floorPlanUpload"
                  valuePropName="fileList"
                  getValueFromEvent={uploadValueFromEvent}
                  rules={
                    !editing || removeFloorPlan
                      ? [{ required: true, message: "Upload a floor plan image." }]
                      : []
                  }
                >
                  <Upload
                    accept="image/*"
                    beforeUpload={() => false}
                    maxCount={1}
                    listType="picture"
                  >
                    <Button icon={<UploadOutlined />}>Choose Floor Plan</Button>
                  </Upload>
                </Form.Item>
              )}
            </>
          )}

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
            (item) =>
              item.type === "video" &&
              !removedMediaUrls.includes(item.url),
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
                : [{ required: true, message: "Upload at least one image." }]
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
                Ugx {previewing.price.toLocaleString()}
              </Descriptions.Item>
              {kind !== "design" ? (
                <>
                  <Descriptions.Item label="Location">{previewing.location}</Descriptions.Item>
                  <Descriptions.Item label="Size">{previewing.size}</Descriptions.Item>
                  {kind === "house" ? (
                    <>
                      <Descriptions.Item label="Bedrooms">{previewing.bedrooms}</Descriptions.Item>
                      <Descriptions.Item label="Bathrooms">{previewing.bathrooms}</Descriptions.Item>
                    </>
                  ) : null}
                  <Descriptions.Item label="Status">{previewing.status}</Descriptions.Item>
                </>
              ) : (
                <>
                  <Descriptions.Item label="Description">
                    {previewing.description}
                  </Descriptions.Item>
                  <Descriptions.Item label="Floor Plan">
                    {previewing.floorPlan || "Not uploaded"}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Card title="Markdown Copy" size="small">
              <MarkdownPreview value={previewing.descriptionMarkdown} />
            </Card>
          </Space>
        ) : null}
      </Modal>

      <Drawer
        title="Update Design Request"
        open={Boolean(editingRequest)}
        onClose={() => setEditingRequest(null)}
        width={560}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setEditingRequest(null)}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => requestForm.submit()}
              loading={requestSubmitting}
            >
              Save
            </Button>
          </Space>
        }
      >
        {editingRequest ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Client">
                {typeof editingRequest.user === "string"
                  ? "Client"
                  : editingRequest.user.name}
              </Descriptions.Item>
              <Descriptions.Item label="Design">
                {typeof editingRequest.design === "string"
                  ? "Design"
                  : editingRequest.design.title}
              </Descriptions.Item>
              <Descriptions.Item label="Client Notes">
                {editingRequest.notes || "No notes provided"}
              </Descriptions.Item>
            </Descriptions>

            <Form form={requestForm} layout="vertical" onFinish={handleRequestSubmit}>
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "requested", label: "Requested" },
                    { value: "contacted", label: "Contacted" },
                    { value: "in_discussion", label: "In Discussion" },
                    { value: "confirmed", label: "Confirmed" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Admin Notes" name="adminNotes">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Form>
          </Space>
        ) : null}
      </Drawer>
    </AdminShell>
  );
}
