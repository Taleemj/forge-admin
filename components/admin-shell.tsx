"use client";

import {
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Flex,
  Layout,
  List,
  Menu,
  Popover,
  Space,
  Tag,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { adminModules } from "@/components/admin-navigation";
import { useAuth } from "@/hooks/useAuth";

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

const notifications = [
  {
    title: "Roofing Phase Complete",
    description: "Mombasa Coastal Villa is ready for inspection.",
    type: "Progress",
    tone: "processing",
    unread: true,
  },
  {
    title: "Payment Confirmed",
    description: "$12,000 received for Entebbe Safari Lodge.",
    type: "Payment",
    tone: "success",
    unread: true,
  },
  {
    title: "Inspection Required",
    description: "Naivasha Lake House design review needs action.",
    type: "Alert",
    tone: "warning",
    unread: false,
  },
];

function getSelectedKey(pathname: string, items: MenuProps["items"]) {
  const selected = items
    ?.map((item) => item?.key?.toString())
    .filter((key): key is string => Boolean(key))
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(`${key}/`));

  return selected ? [selected] : ["/dashboard"];
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut, user, isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const allowedModules = useMemo(
    () =>
      user?.modules?.length
        ? adminModules.filter((module) => user.modules.includes(module.key))
        : adminModules,
    [user],
  );
  const navigationItems: MenuProps["items"] = useMemo(
    () =>
      allowedModules.map((module) => ({
        key: module.href,
        icon: module.icon,
        label: <Link href={module.href}>{module.label}</Link>,
      })),
    [allowedModules],
  );
  const selectedKeys = useMemo(
    () => getSelectedKey(pathname, navigationItems),
    [pathname, navigationItems],
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);
  const accountItems: MenuProps["items"] = [
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: <Link href="/dashboard/settings">Settings</Link>,
    },
    {
      type: "divider",
    },
    {
      key: "signout",
      danger: true,
      icon: <LogoutOutlined />,
      label: "Sign out",
      onClick: () => {
        signOut();
        router.push("/login");
      },
    },
  ];
  const notificationContent = (
    <div className="notification-popover">
      <Flex align="center" justify="space-between" className="notification-popover-head">
        <Space direction="vertical" size={0}>
          <Text strong>Notifications</Text>
          <Text type="secondary">2 unread updates</Text>
        </Space>
        <Badge count={2} />
      </Flex>

      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item className="notification-popover-item">
            <Link href="/dashboard/notifications" className="notification-popover-link">
              <Flex align="flex-start" gap={10}>
                <span
                  className={
                    item.unread
                      ? "notification-popover-dot is-unread"
                      : "notification-popover-dot"
                  }
                />
                <Space direction="vertical" size={4} className="notification-popover-copy">
                  <Flex align="center" gap={8} wrap="wrap">
                    <Text strong>{item.title}</Text>
                    <Tag color={item.tone}>{item.type}</Tag>
                  </Flex>
                  <Text type="secondary">{item.description}</Text>
                </Space>
              </Flex>
            </Link>
          </List.Item>
        )}
      />

      <Link href="/dashboard/notifications" className="notification-popover-footer">
        View all notifications
      </Link>
    </div>
  );

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Layout className="admin-shell">
      <Sider
        breakpoint="lg"
        collapsed={collapsed}
        collapsedWidth={80}
        onCollapse={setCollapsed}
        width={272}
        className="admin-sidebar"
      >
        <div className="admin-brand">
          <div className="admin-brand-mark">F</div>
          {!collapsed && (
            <div>
              <Text className="admin-brand-kicker">Forge Housing</Text>
              <Title level={5} className="admin-brand-title">
                Admin
              </Title>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={navigationItems}
          className="admin-menu"
        />
      </Sider>

      <Layout>
        <Header className="admin-topbar">
          <Button
            type="text"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
          />

          <Flex align="center" gap={16} className="admin-topbar-actions">
            <Popover
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
              arrow={false}
            >
              <Badge dot>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  aria-label="Notifications"
                />
              </Badge>
            </Popover>

            <Dropdown menu={{ items: accountItems }} trigger={["click"]}>
              <button className="admin-account-trigger" type="button">
                <Avatar size={36} icon={<UserOutlined />} />
                <span className="admin-account-copy">
                  <span className="admin-account-name">{user?.name || "Admin User"}</span>
                </span>
              </button>
            </Dropdown>
          </Flex>
        </Header>

        <Content className="admin-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
