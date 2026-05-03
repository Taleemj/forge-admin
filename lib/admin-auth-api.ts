import { apiClient } from "@/lib/api";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  VerifyResetOtpPayload,
  AdminUser,
} from "@/types/auth";

export const adminAuthApi = {
  async login(payload: LoginPayload) {
    const response = await apiClient.post<AuthResponse>("/admin-auth/login", payload);
    return response.data;
  },

  async me() {
    const response = await apiClient.get<{ user: AdminUser }>("/admin-auth/me");
    return response.data.user;
  },

  async forgotPassword(payload: ForgotPasswordPayload) {
    const response = await apiClient.post<{ message: string }>(
      "/admin-auth/forgot-password",
      payload,
    );
    return response.data;
  },

  async verifyResetOtp(payload: VerifyResetOtpPayload) {
    const response = await apiClient.post<{ message: string }>(
      "/admin-auth/verify-reset-otp",
      payload,
    );
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload) {
    const response = await apiClient.post<{ message: string }>(
      "/admin-auth/reset-password",
      payload,
    );
    return response.data;
  },
};
