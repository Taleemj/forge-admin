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

const { Text, Title } = Typography;

const imageFallback =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120'%3E%3Crect width='160' height='120' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='Arial' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";

export type ListingKind = "land" | "design";

export type AdminListing = {
  _id: string;
  title: string;
  price: number;
  images: string[];
  descriptionMarkdown?: string;
  status?: "available" | "sold";
  location?: string;
  size?: string;
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
  isLoading: boolean;
  onCreate: (data: FormData) => Promise<unknown>;
  onUpdate: (id: string, data: FormData) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

function uploadValueFromEvent(event: { fileList?: UploadFile[] } | UploadFile[]) {
  return Array.isArray(event) ? event : event?.fileList;
}

export function ListingManager({
  kind,
  listings,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: ListingManagerProps) {
  const [form] = Form.useForm<ListingFormValues>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminListing | null>(null);
  const [previewing, setPreviewing] = useState<AdminListing | null>(null);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedMediaUrls, setRemovedMediaUrls] = useState<string[]>([]);
  const [removeFloorPlan, setRemoveFloorPlan] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const copy = useMemo(() => {
    const isLand = kind === "land";

    return {
      title: isLand ? "Land Listings" : "House Designs",
      kicker: isLand ? "Marketplace inventory" : "Design catalogue",
      description: isLand
        ? "Create, edit, publish, and retire land listings."
        : "Manage design packages, floor plans, gallery media, pricing, and markdown descriptions.",
      createLabel: isLand ? "New Land Listing" : "New Design",
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

      if (kind === "land") {
        payload.append("status", values.status ?? "available");
        payload.append("location", values.location ?? "");
        payload.append("size", values.size ?? "");
        if (values.latitude !== undefined) payload.append("latitude", String(values.latitude));
        if (values.longitude !== undefined) payload.append("longitude", String(values.longitude));
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
              {kind === "land" ? listing.location : listing.description}
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
      title: kind === "land" ? "Status" : "Assets",
      key: "status",
      render: (_, listing) =>
        kind === "land" ? (
          <Tag color={listing.status === "available" ? "success" : "default"}>
            {listing.status}
          </Tag>
        ) : (
          <Tag color={listing.floorPlan ? "success" : "warning"}>
            {listing.floorPlan ? "Floor plan" : "Needs plan"}
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

            {kind === "land" ? (
              <Form.Item label="Status" name="status" className="listing-form-field">
                <Select
                  options={[
                    { value: "available", label: "Available" },
                    { value: "sold", label: "Sold" },
                  ]}
                />
              </Form.Item>
            ) : (
              <Form.Item label="Short Description" name="description" className="listing-form-field">
                <Input placeholder="A 3-bedroom sustainable home..." />
              </Form.Item>
            )}
          </Flex>

          {kind === "land" ? (
            <>
              <Flex gap={16} className="listing-form-row">
                <Form.Item label="Location" name="location" className="listing-form-field">
                  <Input placeholder="Wakiso, Uganda" />
                </Form.Item>
                <Form.Item label="Size" name="size" className="listing-form-field">
                  <Input placeholder="0.25 Acre" />
                </Form.Item>
              </Flex>
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
              {kind === "land" ? (
                <>
                  <Descriptions.Item label="Location">{previewing.location}</Descriptions.Item>
                  <Descriptions.Item label="Size">{previewing.size}</Descriptions.Item>
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
    </AdminShell>
  );
}
