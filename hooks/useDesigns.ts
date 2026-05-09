"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { useDashboardContext, type Design } from "@/context/dashboard-context";

export function useDesigns() {
  const { designs, isLoadingDesigns, fetchDesigns } = useDashboardContext();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      const isInitial = designs.length === 0;
      fetchDesigns(!isInitial);
      initialFetchDone.current = true;
    }
  }, [fetchDesigns, designs.length]);

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

  return {
    designs,
    isLoading: isLoadingDesigns,
    createDesign,
    updateDesign,
    deleteDesign,
    refresh: () => fetchDesigns(false)
  };
}
