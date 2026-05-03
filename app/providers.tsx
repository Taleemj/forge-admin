"use client";

import { App, ConfigProvider } from "antd";
import type { ReactNode } from "react";

import { forgeTheme } from "./theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={forgeTheme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
