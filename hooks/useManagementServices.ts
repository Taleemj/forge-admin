"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import {
  useDashboardContext,
  type MaintenanceRequest,
  type ManagementService,
} from "@/context/dashboard-context";

export function useManagementServices() {
  const {
    managementServices,
    maintenanceRequests,
    isLoadingManagementServices,
    isLoadingMaintenanceRequests,
    fetchManagementServices,
    fetchMaintenanceRequests,
  } = useDashboardContext();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      const isInitial = managementServices.length === 0;
      fetchManagementServices(!isInitial);
      fetchMaintenanceRequests(maintenanceRequests.length > 0);
      initialFetchDone.current = true;
    }
  }, [
    fetchMaintenanceRequests,
    fetchManagementServices,
    maintenanceRequests.length,
    managementServices.length,
  ]);

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

  const quoteRequest = async ({
    id,
    amount,
    notes,
    status,
  }: {
    id: string;
    amount: number;
    notes?: string;
    status?: MaintenanceRequest["status"];
  }) => {
    const response = await apiClient.put<MaintenanceRequest>(
      `/admin/maintenance-requests/${id}/quote`,
      { amount, notes, status },
    );
    await fetchMaintenanceRequests(true);
    return response.data;
  };

  return {
    services: managementServices,
    requests: maintenanceRequests,
    isLoading: isLoadingManagementServices || isLoadingMaintenanceRequests,
    createService,
    updateService,
    deleteService,
    quoteRequest,
    refresh: () => fetchManagementServices(false),
  };
}
