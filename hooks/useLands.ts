"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { useDashboardContext, type Land } from "@/context/dashboard-context";

export function useLands() {
  const { lands, isLoadingLands, fetchLands } = useDashboardContext();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      const isInitial = lands.length === 0;
      fetchLands(!isInitial);
      initialFetchDone.current = true;
    }
  }, [fetchLands, lands.length]);

  const createLand = async (data: Partial<Land>) => {
    const response = await apiClient.post<Land>("/admin/lands", data);
    await fetchLands(true); // background refresh after action
    return response.data;
  };

  const updateLand = async ({ id, data }: { id: string; data: Partial<Land> }) => {
    const response = await apiClient.put<Land>(`/admin/lands/${id}`, data);
    await fetchLands(true); // background refresh after action
    return response.data;
  };

  const deleteLand = async (id: string) => {
    await apiClient.delete(`/admin/lands/${id}`);
    await fetchLands(true); // background refresh after action
  };

  return {
    lands,
    isLoading: isLoadingLands,
    createLand,
    updateLand,
    deleteLand,
    refresh: () => fetchLands(false)
  };
}
