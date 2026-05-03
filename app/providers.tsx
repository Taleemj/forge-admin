"use client";

import { App, ConfigProvider } from "antd";
import type { ReactNode } from "react";

import { AuthProvider } from "@/context/auth-context";
import { DashboardProvider } from "@/context/dashboard-context";
import { forgeTheme } from "./theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={forgeTheme}>
      <App>
        <AuthProvider>
          <DashboardProvider>{children}</DashboardProvider>
        </AuthProvider>
      </App>
    </ConfigProvider>
  );
}
