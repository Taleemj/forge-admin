"use client";

import { Card, Space, Table, Tag, Typography } from "antd";
import { AdminShell } from "@/components/admin-shell";
import { useMarketplaceInquiries } from "@/hooks/useMarketplaceInquiries";
import { EditOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Drawer, message } from "antd";
import { useState } from "react";
import type { ColumnsType } from "antd/es/table";
import type { MarketplaceInquiry } from "@/hooks/useMarketplaceInquiries";

const { Text, Title } = Typography;

export default function MarketplaceInquiriesPage() {
  const { inquiries, loading, updateInquiry } = useMarketplaceInquiries();
  const [editingInquiry, setEditingInquiry] = useState<MarketplaceInquiry | null>(null);
  const [requestForm] = Form.useForm<{
    status: MarketplaceInquiry["status"];
    adminNotes?: string;
  }>();
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const openInquiry = (inquiry: MarketplaceInquiry) => {
    setEditingInquiry(inquiry);
    requestForm.resetFields();
    requestForm.setFieldsValue({
      status: inquiry.status,
      adminNotes: inquiry.adminNotes,
    });
  };

  const handleRequestSubmit = async (values: {
    status: MarketplaceInquiry["status"];
    adminNotes?: string;
  }) => {
    if (!editingInquiry) return;
    setRequestSubmitting(true);
    try {
      await updateInquiry(editingInquiry.id || editingInquiry._id!, values);
      message.success("Inquiry updated");
      setEditingInquiry(null);
    } catch {
      message.error("Failed to update inquiry");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const columns: ColumnsType<MarketplaceInquiry> = [
    {
      title: "Inquiry",
      key: "inquiry",
      render: (_, inquiry) => {
        let client = "Guest";
        if (inquiry.user && typeof inquiry.user !== "string") {
          client = inquiry.user.name;
        } else if (inquiry.guestInfo) {
          client = `${inquiry.guestInfo.name} (Guest)`;
        }

        const item = inquiry.land || inquiry.house;
        const itemTitle = typeof item === "object" ? item.title : "Marketplace Item";

        return (
          <Space direction="vertical" size={0}>
            <Text strong>{itemTitle}</Text>
            <Text type="secondary">{client}</Text>
          </Space>
        );
      },
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, inquiry) => {
        let email = "";
        let phone = "";
        if (inquiry.user && typeof inquiry.user !== "string") {
          email = inquiry.user.email;
          phone = inquiry.user.phone;
        } else if (inquiry.guestInfo) {
          email = inquiry.guestInfo.email;
          phone = inquiry.guestInfo.phone;
        }
        return (
          <Space direction="vertical" size={0}>
            {email && <Text size="small">{email}</Text>}
            {phone && <Text type="secondary" size="small">{phone}</Text>}
          </Space>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "itemType",
      key: "itemType",
      render: (type: string) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: MarketplaceInquiry["status"]) => (
        <Tag
          color={
            status === "resolved" ? "success" : status === "rejected" ? "error" : "processing"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Notes",
      key: "notes",
      render: (_, inquiry) => inquiry.notes || "No client notes",
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, inquiry) => (
        <Button icon={<EditOutlined />} onClick={() => openInquiry(inquiry)}>
          Update
        </Button>
      ),
    },
  ];

  return (
    <AdminShell>
      <section className="dashboard-hero">
        <div className="dashboard-hero-inner">
          <Space direction="vertical" size={10}>
            <Text className="dashboard-kicker">Forge Housing Admin</Text>
            <Title level={1}>Marketplace Interest</Title>
            <Text className="dashboard-hero-copy">
              Manage all interest requests for lands and houses in one place.
            </Text>
          </Space>
        </div>
      </section>

      <Card className="dashboard-card">
        <Table
          rowKey={(record) => record.id || record._id!}
          loading={loading}
          dataSource={inquiries}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Drawer
        title="Update Interest Request"
        open={Boolean(editingInquiry)}
        onClose={() => setEditingInquiry(null)}
        width={560}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setEditingInquiry(null)}>Cancel</Button>
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
        {editingInquiry ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Client">
                {editingInquiry.user && typeof editingInquiry.user !== "string"
                  ? editingInquiry.user.name
                  : editingInquiry.guestInfo
                  ? `${editingInquiry.guestInfo.name} (Guest)`
                  : "Guest"}
              </Descriptions.Item>
              {editingInquiry.guestInfo && (
                <>
                  <Descriptions.Item label="Email">
                    {editingInquiry.guestInfo.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {editingInquiry.guestInfo.phone}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Item">
                {editingInquiry.land
                  ? typeof editingInquiry.land === "string"
                    ? "Land"
                    : editingInquiry.land.title
                  : typeof editingInquiry.house === "string"
                  ? "House"
                  : editingInquiry.house?.title}
              </Descriptions.Item>
              <Descriptions.Item label="Client Notes">
                {editingInquiry.notes || "No notes provided"}
              </Descriptions.Item>
            </Descriptions>

            <Form form={requestForm} layout="vertical" onFinish={handleRequestSubmit}>
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "requested", label: "Requested" },
                    { value: "contacted", label: "Contacted" },
                    { value: "in_discussion", label: "In Discussion" },
                    { value: "resolved", label: "Resolved" },
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
