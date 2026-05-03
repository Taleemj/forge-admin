import { apiClient } from "@/lib/api";
import type { AdminRole, AdminUser } from "@/types/auth";
import type { AdminModuleKey } from "@/components/admin-navigation";

export type AdminUserPayload = {
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  modules: AdminModuleKey[];
  isActive: boolean;
};

export const adminUsersApi = {
  async list() {
    const response = await apiClient.get<{ users: AdminUser[] }>("/admin-auth/users");
    return response.data.users;
  },

  async create(payload: AdminUserPayload) {
    const response = await apiClient.post<{ user: AdminUser }>(
      "/admin-auth/users",
      payload,
    );
    return response.data.user;
  },

  async update(id: string, payload: AdminUserPayload) {
    const response = await apiClient.put<{ user: AdminUser }>(
      `/admin-auth/users/${id}`,
      payload,
    );
    return response.data.user;
  },

  async remove(id: string) {
    const response = await apiClient.delete<{ message: string }>(
      `/admin-auth/users/${id}`,
    );
    return response.data;
  },
};
