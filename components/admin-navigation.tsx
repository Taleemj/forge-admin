"use client";

import {
  ApartmentOutlined,
  BellOutlined,
  HomeOutlined,
  BuildOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

export type AdminModuleKey =
  | "dashboard"
  | "lands"
  | "designs"
  | "management_services"
  | "projects"
  | "payments"
  | "users"
  | "notifications";

export type AdminModule = {
  key: AdminModuleKey;
  label: string;
  href: string;
  icon: ReactNode;
};

export const adminModules: AdminModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <DashboardOutlined />,
  },
  {
    key: "lands",
    label: "Land Listings",
    href: "/dashboard/lands",
    icon: <BuildOutlined />,
  },
  {
    key: "designs",
    label: "House Designs",
    href: "/dashboard/designs",
    icon: <ApartmentOutlined />,
  },
  {
    key: "management_services",
    label: "Property Services",
    href: "/dashboard/management-services",
    icon: <HomeOutlined />,
  },
  {
    key: "projects",
    label: "Projects",
    href: "/dashboard/projects",
    icon: <ApartmentOutlined />,
  },
  {
    key: "payments",
    label: "Payments",
    href: "/dashboard/payments",
    icon: <CreditCardOutlined />,
  },
  {
    key: "users",
    label: "Users & Roles",
    href: "/dashboard/users",
    icon: <TeamOutlined />,
  },
  {
    key: "notifications",
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: <BellOutlined />,
  },
];
