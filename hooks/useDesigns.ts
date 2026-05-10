"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import {
  useDashboardContext,
  type Design,
  type DesignRequest,
} from "@/context/dashboard-context";

export function useDesigns() {
  const {
    designs,
    designRequests,
    isLoadingDesigns,
    isLoadingDesignRequests,
    fetchDesigns,
    fetchDesignRequests,
  } = useDashboardContext();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      const isInitial = designs.length === 0;
      fetchDesigns(!isInitial);
      fetchDesignRequests(designRequests.length > 0);
      initialFetchDone.current = true;
    }
  }, [designRequests.length, designs.length, fetchDesignRequests, fetchDesigns]);

  const createDesign = async (data: FormData) => {
    const response = await apiClient.post<Design>("/admin/designs", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await fetchDesigns(true); // background refresh
    return response.data;
  };

  const updateDesign = async ({ id, data }: { id: string; data: FormData }) => {
    const response = await apiClient.put<Design>(`/admin/designs/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await fetchDesigns(true); // background refresh
    return response.data;
  };

  const deleteDesign = async (id: string) => {
    await apiClient.delete(`/admin/designs/${id}`);
    await fetchDesigns(true); // background refresh
  };

  const updateDesignRequest = async ({
    id,
    status,
    adminNotes,
  }: {
    id: string;
    status: DesignRequest["status"];
    adminNotes?: string;
  }) => {
    const response = await apiClient.put<DesignRequest>(
      `/admin/design-requests/${id}`,
      { status, adminNotes },
    );
    await fetchDesignRequests(true);
    return response.data;
  };

  return {
    designs,
    designRequests,
    isLoading: isLoadingDesigns || isLoadingDesignRequests,
    createDesign,
    updateDesign,
    deleteDesign,
    updateDesignRequest,
    refresh: () => fetchDesigns(false)
  };
}
