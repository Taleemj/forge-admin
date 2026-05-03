"use client";

import { useEffect, useRef } from "react";
import { adminUsersApi, type AdminUserPayload } from "@/lib/admin-users-api";
import { useDashboardContext } from "@/context/dashboard-context";

export function useAdminUsers() {
  const { users, isLoadingUsers, fetchUsers } = useDashboardContext();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      const isInitial = users.length === 0;
      fetchUsers(!isInitial);
      initialFetchDone.current = true;
    }
  }, [fetchUsers, users.length]);

  const createUser = async (payload: AdminUserPayload) => {
    const user = await adminUsersApi.create(payload);
    await fetchUsers(true);
    return user;
  };

  const updateUser = async ({ id, payload }: { id: string; payload: AdminUserPayload }) => {
    const user = await adminUsersApi.update(id, payload);
    await fetchUsers(true);
    return user;
  };

  const deleteUser = async (id: string) => {
    const result = await adminUsersApi.remove(id);
    await fetchUsers(true);
    return result;
  };

  return {
    users,
    isLoading: isLoadingUsers,
    createUser,
    updateUser,
    deleteUser,
    refresh: () => fetchUsers(false)
  };
}
