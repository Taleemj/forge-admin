"use client";

import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  MailOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Drawer,
  Flex,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";

import {
  adminModules,
  type AdminModuleKey,
} from "@/components/admin-navigation";
import { AdminShell } from "@/components/admin-shell";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import type { AdminUser } from "@/types/auth";

const { Text, Title } = Typography;

type UserFormValues = {
  name: string;
  email: string;
  role: "super_admin" | "admin" | "manager" | "viewer";
  isActive: boolean;
  modules: AdminModuleKey[];
  password?: string;
};

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "viewer", label: "Viewer" },
];

function roleLabel(role: string) {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

export default function AdminUsersPage() {
  const [form] = Form.useForm<UserFormValues>();
  const { users, isLoading, createUser, updateUser, deleteUser } = useAdminUsers();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeCount = useMemo(
    () => users.filter((user) => user.isActive).length,
    [users],
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      role: "admin",
      isActive: true,
      modules: ["dashboard"],
    });
    setDrawerOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role as any,
      isActive: user.isActive,
      modules: user.modules as AdminModuleKey[],
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateUser({ id: editing.id, payload: values as any });
        message.success("User updated successfully");
      } else {
        await createUser(values as any);
        message.success("User created successfully");
      }
      setDrawerOpen(false);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success("User deleted successfully");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleStatusChange = async (user: AdminUser, checked: boolean) => {
    try {
      await updateUser({
        id: user.id,
        payload: {
          name: user.name,
          email: user.email,
          role: user.role as any,
          isActive: checked,
          modules: user.modules as AdminModuleKey[],
        },
      });
      message.success(`User ${checked ? "activated" : "deactivated"}`);
    } catch (error: any) {
      message.error("Failed to update status");
    }
  };

  const moduleOptions = adminModules.map((module) => ({
    label: (
      <span className="access-module-option">
        <span className="access-module-icon">{module.icon}</span>
        <span>{module.label}</span>
      </span>
    ),
    value: module.key,
  }));

  const columns: ColumnsType<AdminUser> = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (_, user) => (
        <Flex align="center" gap={12}>
          <Avatar icon={<UserOutlined />} />
          <Space direction="vertical" size={0}>
            <Text strong>{user.name}</Text>
            <Text type="secondary">{user.email}</Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "super_admin" ? "success" : "processing"}>
          {roleLabel(role)}
        </Tag>
      ),
    },
    {
      title: "Module Access",
      key: "modules",
      render: (_, user) => (
        <Flex gap={6} wrap="wrap">
          {user.modules.map((moduleKey) => {
            const module = adminModules.find((item) => item.key === moduleKey);
            return module ? <Tag key={module.key}>{module.label}</Tag> : null;
          })}
        </Flex>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, user) => (
        <Switch
          checked={isActive}
          checkedChildren="Active"
          unCheckedChildren="Off"
          onChange={(checked) => handleStatusChange(user, checked)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, user) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(user)} />
          <Popconfirm
            title="Delete admin user?"
            onConfirm={() => handleDelete(user.id)}
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
            <Text className="dashboard-kicker">Access control</Text>
            <Title level={1}>Users & Roles</Title>
            <Text className="dashboard-hero-copy">
              Manage admin users and the dashboard modules each account can access.
            </Text>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create User
          </Button>
        </Flex>
      </section>

      <Flex gap={16} className="access-summary" wrap="wrap">
        <Card className="metric-card access-summary-card">
          <Space direction="vertical" size={2}>
            <Text type="secondary">Total Users</Text>
            <Title level={3}>{users.length}</Title>
          </Space>
          <span className="metric-icon">
            <TeamOutlined />
          </span>
        </Card>
        <Card className="metric-card access-summary-card">
          <Space direction="vertical" size={2}>
            <Text type="secondary">Active Users</Text>
            <Title level={3}>{activeCount}</Title>
          </Space>
          <span className="metric-icon">
            <UserOutlined />
          </span>
        </Card>
        <Card className="metric-card access-summary-card">
          <Space direction="vertical" size={2}>
            <Text type="secondary">Modules</Text>
            <Title level={3}>{adminModules.length}</Title>
          </Space>
          <span className="metric-icon">
            <LockOutlined />
          </span>
        </Card>
      </Flex>

      <Card className="dashboard-card access-table-card">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 980 }}
        />
      </Card>

      <Drawer
        title={editing ? `Edit ${editing.name}` : "Create Admin User"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={680}
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
        <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
          <Form.Item
            label="Full name"
            name="name"
            rules={[{ required: true, message: "Enter the user's name." }]}
          >
            <Input size="large" prefix={<UserOutlined />} placeholder="Admin User" />
          </Form.Item>

          <Form.Item
            label="Email address"
            name="email"
            rules={[
              { required: true, message: "Enter the user's email." },
              { type: "email", message: "Enter a valid email address." },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="admin@forgehousing.com"
            />
          </Form.Item>

          {!editing ? (
            <Form.Item
              label="Temporary password"
              name="password"
              rules={[
                { required: true, message: "Enter a temporary password." },
                { min: 8, message: "Password must be at least 8 characters." },
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="Temporary password"
              />
            </Form.Item>
          ) : (
             <Form.Item
              label="New password (leave blank to keep current)"
              name="password"
              rules={[
                { min: 8, message: "Password must be at least 8 characters." },
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="New password"
              />
            </Form.Item>
          )}

          <Flex gap={16} className="listing-form-row">
            <Form.Item
              label="Role"
              name="role"
              className="listing-form-field"
              rules={[{ required: true, message: "Select a role." }]}
            >
              <Select size="large" options={roleOptions} />
            </Form.Item>

            <Form.Item
              label="Account status"
              name="isActive"
              valuePropName="checked"
              className="listing-form-field"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Off" />
            </Form.Item>
          </Flex>

          <Card size="small" className="access-modules-card">
            <Form.Item
              label="Dashboard module access"
              name="modules"
              rules={[
                {
                  required: true,
                  message: "Select at least one dashboard module.",
                },
              ]}
            >
              <Checkbox.Group
                options={moduleOptions}
                className="access-module-grid"
                onChange={(values) => {
                  const moduleValues = values as AdminModuleKey[];
                  if (!moduleValues.includes("dashboard")) {
                    form.setFieldValue("modules", ["dashboard", ...moduleValues]);
                  }
                }}
              />
            </Form.Item>
          </Card>
        </Form>
      </Drawer>
    </AdminShell>
  );
}
