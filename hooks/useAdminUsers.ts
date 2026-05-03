"use client";

import { adminUsersApi } from "@/lib/admin-users-api";

export function useAdminUsers() {
  return {
    listAdminUsers: adminUsersApi.list,
    createAdminUser: adminUsersApi.create,
    updateAdminUser: adminUsersApi.update,
    deleteAdminUser: adminUsersApi.remove,
  };
}
