"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import {
  useDashboardContext,
  type ManagementService,
} from "@/context/dashboard-context";

export function useManagementServices() {
  const {
    managementServices,
    isLoadingManagementServices,
    fetchManagementServices,
  } = useDashboardContext();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      const isInitial = managementServices.length === 0;
      fetchManagementServices(!isInitial);
      initialFetchDone.current = true;
    }
  }, [fetchManagementServices, managementServices.length]);

  const createService = async (data: FormData) => {
    const response = await apiClient.post<ManagementService>(
      "/admin/management-services",
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    await fetchManagementServices(true);
    return response.data;
  };

  const updateService = async ({ id, data }: { id: string; data: FormData }) => {
    const response = await apiClient.put<ManagementService>(
      `/admin/management-services/${id}`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    await fetchManagementServices(true);
    return response.data;
  };

  const deleteService = async (id: string) => {
    await apiClient.delete(`/admin/management-services/${id}`);
    await fetchManagementServices(true);
  };

  return {
    services: managementServices,
    isLoading: isLoadingManagementServices,
    createService,
    updateService,
    deleteService,
    refresh: () => fetchManagementServices(false),
  };
}
