import type { ThemeConfig } from "antd";

export const forgePrimaryColor =
  process.env.NEXT_PUBLIC_ANTD_PRIMARY_COLOR || "#2dd4bf";

export const forgeTheme: ThemeConfig = {
  token: {
    colorPrimary: forgePrimaryColor,
    colorInfo: forgePrimaryColor,
    colorSuccess: "#2dd4bf",
    colorWarning: "#ff5c00",
    borderRadius: 8,
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  components: {
    Layout: {
      bodyBg: "#f8fafc",
      headerBg: "#ffffff",
      siderBg: "#0f172a",
      triggerBg: "#0f172a",
    },
    Menu: {
      darkItemBg: "#0f172a",
      darkSubMenuItemBg: "#0f172a",
      darkItemSelectedBg: forgePrimaryColor,
    },
  },
};
