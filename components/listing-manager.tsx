"use client";

import {
  CopyOutlined,
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
  id: string;
  title: string;
  price: number;
  images: string[];
  videos?: string[];
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
};

type ListingFormValues = Omit<AdminListing, "id" | "images" | "videos"> & {
  imageUploads?: UploadFile[];
  videoUploads?: UploadFile[];
  floorPlanUpload?: UploadFile[];
  latitude?: number;
  longitude?: number;
};

const landSeed: AdminListing[] = [
  {
    id: "land-01",
    title: "Kilifi Ocean View",
    location: "Kilifi, Kenya",
    size: "0.5 Acre",
    price: 12000,
    status: "sold",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop",
    ],
    coordinates: { latitude: -3.6305, longitude: 39.8499 },
    descriptionMarkdown:
      "# Coastal Plot Overview\nA premium elevated plot with uninterrupted ocean breezes and clear access roads.\n\n## Why It Stands Out\n- **Ready utilities** available within the immediate neighborhood.\n- Ideal for a boutique villa, holiday home, or short-stay investment.\n- Admin can include rich markdown from the CMS.",
  },
  {
    id: "land-02",
    title: "Naivasha Lakeside",
    location: "Naivasha, Kenya",
    size: "1.0 Acre",
    price: 18500,
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop",
    ],
    coordinates: { latitude: -0.7167, longitude: 36.4333 },
    descriptionMarkdown:
      "# Naivasha Lakeside\nA larger parcel suited for a family residence or hospitality concept.\n\n## Highlights\n- **Generous road frontage** with multiple layout options.\n- Strong potential for a lake-view residential concept.",
  },
  {
    id: "land-03",
    title: "Kira Suburb Lot",
    location: "Wakiso, Uganda",
    size: "0.25 Acre",
    price: 8000,
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1000&auto=format&fit=crop",
    ],
    coordinates: { latitude: 0.3961, longitude: 32.6498 },
    descriptionMarkdown:
      "# Kira Residential Plot\nA practical suburban lot for a first home build close to Kampala growth corridors.\n\n## Best Fit\n- Starter family home\n- Compact rental development\n- Future-value hold",
  },
];

const designSeed: AdminListing[] = [
  {
    id: "design-01",
    title: "The Modern African Villa",
    description: "A 3-bedroom sustainable home designed for coastal climates.",
    price: 2500,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
    ],
    floorPlan: "https://picsum.photos/seed/plan1/600/400",
    descriptionMarkdown:
      "# The Modern African Villa\nA premium 3-bedroom concept tuned for warm climates and indoor-outdoor living.\n\n## Included In The Package\n- Exterior elevations and concept renders\n- Preliminary floor planning\n- Presentation-ready package for quote discussions",
  },
  {
    id: "design-02",
    title: "Eco-Lodge Concept",
    description: "Minimalist design with maximum natural light and ventilation.",
    price: 1800,
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1000&auto=format&fit=crop",
    ],
    floorPlan: "https://picsum.photos/seed/plan2/600/400",
    descriptionMarkdown:
      "# Eco-Lodge Concept\nA lightweight hospitality-friendly design language focused on natural light, ventilation, and memorable guest experience.\n\n## Key Characteristics\n- Passive cooling strategy\n- Flexible interior zoning\n- Strong indoor-outdoor connection",
  },
];

function urlsFromUpload(files?: UploadFile[]) {
  return (files ?? [])
    .map((file) => {
      if (file.url) return file.url;
      if (file.thumbUrl) return file.thumbUrl;
      if (file.originFileObj) return URL.createObjectURL(file.originFileObj);
      return "";
    })
    .filter(Boolean);
}

function uploadValueFromEvent(event: { fileList?: UploadFile[] } | UploadFile[]) {
  return Array.isArray(event) ? event : event?.fileList;
}

function getSeed(kind: ListingKind) {
  return kind === "land" ? landSeed : designSeed;
}

export function ListingManager({ kind }: { kind: ListingKind }) {
  const [form] = Form.useForm<ListingFormValues>();
  const [listings, setListings] = useState<AdminListing[]>(() => getSeed(kind));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminListing | null>(null);
  const [previewing, setPreviewing] = useState<AdminListing | null>(null);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedVideos, setRemovedVideos] = useState<string[]>([]);
  const [removeFloorPlan, setRemoveFloorPlan] = useState(false);

  const copy = useMemo(() => {
    const isLand = kind === "land";

    return {
      title: isLand ? "Land Listings" : "House Designs",
      kicker: isLand ? "Marketplace inventory" : "Design catalogue",
      description: isLand
        ? "Create, edit, publish, and retire land listings before wiring the backend."
        : "Manage design packages, floor plans, gallery media, pricing, and markdown descriptions.",
      createLabel: isLand ? "New Land Listing" : "New Design",
    };
  }, [kind]);

  const openCreate = () => {
    setEditing(null);
    setRemovedImages([]);
    setRemovedVideos([]);
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
    setRemovedVideos([]);
    setRemoveFloorPlan(false);
    form.setFieldsValue({
      ...listing,
      imageUploads: [],
      videoUploads: [],
      floorPlanUpload: [],
      latitude: listing.coordinates?.latitude,
      longitude: listing.coordinates?.longitude,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = (values: ListingFormValues) => {
    const uploadedImages = urlsFromUpload(values.imageUploads);
    const uploadedVideos = urlsFromUpload(values.videoUploads);
    const floorPlanUpload = urlsFromUpload(values.floorPlanUpload)[0];
    const keptImages =
      editing?.images.filter((image) => !removedImages.includes(image)) ?? [];
    const keptVideos =
      editing?.videos?.filter((video) => !removedVideos.includes(video)) ?? [];
    const nextListing: AdminListing = {
      id: editing?.id ?? `${kind}-${Date.now()}`,
      title: values.title,
      price: Number(values.price ?? 0),
      images: editing ? [...keptImages, ...uploadedImages] : uploadedImages,
      videos: editing ? [...keptVideos, ...uploadedVideos] : uploadedVideos,
      descriptionMarkdown: values.descriptionMarkdown,
      status: kind === "land" ? values.status : undefined,
      location: values.location,
      size: values.size,
      description: values.description,
      floorPlan: floorPlanUpload || (removeFloorPlan ? undefined : editing?.floorPlan),
      coordinates:
        values.latitude !== undefined && values.longitude !== undefined
          ? {
              latitude: Number(values.latitude),
              longitude: Number(values.longitude),
            }
          : undefined,
    };

    setListings((current) =>
      editing
        ? current.map((item) => (item.id === editing.id ? nextListing : item))
        : [nextListing, ...current],
    );
    setDrawerOpen(false);
    setRemovedImages([]);
    setRemovedVideos([]);
    setRemoveFloorPlan(false);
  };

  const handleDuplicate = (listing: AdminListing) => {
    setListings((current) => [
      {
        ...listing,
        id: `${listing.id}-copy-${Date.now()}`,
        title: `${listing.title} Copy`,
      },
      ...current,
    ]);
  };

  const handleDelete = (id: string) => {
    setListings((current) => current.filter((item) => item.id !== id));
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
      render: (price: number) => `$${price.toLocaleString()}`,
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
          {listing.images.length + (listing.videos?.length ?? 0)} files
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 230,
      render: (_, listing) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewing(listing)} />
          <Button icon={<EditOutlined />} onClick={() => openEdit(listing)} />
          <Button icon={<CopyOutlined />} onClick={() => handleDuplicate(listing)} />
          <Popconfirm
            title="Delete listing?"
            description="This only removes it from the local dashboard state for now."
            onConfirm={() => handleDelete(listing.id)}
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
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 920 }}
        />
      </Card>

      <Drawer
        title={editing ? `Edit ${editing.title}` : copy.createLabel}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={760}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
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
              <InputNumber min={0} prefix="$" className="full-width" />
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
                  <InputNumber className="full-width" />
                </Form.Item>
                <Form.Item label="Longitude" name="longitude" className="listing-form-field">
                  <InputNumber className="full-width" />
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
              ) : null}
              <Form.Item
                label="Upload Floor Plan"
                name="floorPlanUpload"
                valuePropName="fileList"
                getValueFromEvent={uploadValueFromEvent}
              >
                <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                  <Button icon={<UploadOutlined />}>Select floor plan</Button>
                </Upload>
              </Form.Item>
            </>
          )}

          {editing &&
          (editing.images.some((image) => !removedImages.includes(image)) ||
            editing.videos?.some((video) => !removedVideos.includes(video))) ? (
            <Card size="small" className="stored-media-card">
              <Space direction="vertical" size={12} className="full-width">
                <Text strong>Stored media from backend</Text>
                {editing.images.some((image) => !removedImages.includes(image)) ? (
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
                ) : null}
                {editing.videos?.some((video) => !removedVideos.includes(video)) ? (
                  <Space direction="vertical" size={8} className="full-width">
                    {editing.videos
                      .filter((video) => !removedVideos.includes(video))
                      .map((video) => (
                        <div key={video} className="stored-video-item">
                          <video src={video} controls className="listing-video-preview" />
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              setRemovedVideos((current) => [...current, video])
                            }
                          >
                            Remove video
                          </Button>
                        </div>
                      ))}
                  </Space>
                ) : null}
              </Space>
            </Card>
          ) : null}

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
              listType="picture-card"
            >
              <UploadOutlined />
            </Upload>
          </Form.Item>

          <Form.Item
            label="Upload Videos"
            name="videoUploads"
            valuePropName="fileList"
            getValueFromEvent={uploadValueFromEvent}
          >
            <Upload accept="video/*" beforeUpload={() => false} multiple>
              <Button icon={<UploadOutlined />}>Select videos</Button>
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
            {previewing.videos?.length ? (
              <Space direction="vertical" size={10} className="full-width">
                {previewing.videos.map((video) => (
                  <video
                    key={video}
                    src={video}
                    controls
                    className="listing-video-preview"
                  />
                ))}
              </Space>
            ) : null}

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Price">
                ${previewing.price.toLocaleString()}
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
