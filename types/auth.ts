import type { AdminModuleKey } from "@/components/admin-navigation";

export type AdminRole = "super_admin" | "admin" | "manager" | "viewer";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  modules: AdminModuleKey[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthResponse = {
  token: string;
  user: AdminUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type VerifyResetOtpPayload = {
  email: string;
  otp: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  password: string;
};
