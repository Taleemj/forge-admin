"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { useDashboardContext, type House } from "@/context/dashboard-context";

export function useHouses() {
  const { houses, isLoadingHouses, fetchHouses } = useDashboardContext();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      const isInitial = houses.length === 0;
      fetchHouses(!isInitial);
      initialFetchDone.current = true;
    }
  }, [fetchHouses, houses.length]);

  const createHouse = async (data: FormData) => {
    const response = await apiClient.post<House>("/admin/houses", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await fetchHouses(true); // background refresh after action
    return response.data;
  };

  const updateHouse = async ({ id, data }: { id: string; data: FormData }) => {
    const response = await apiClient.put<House>(`/admin/houses/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await fetchHouses(true); // background refresh after action
    return response.data;
  };

  const deleteHouse = async (id: string) => {
    await apiClient.delete(`/admin/houses/${id}`);
    await fetchHouses(true); // background refresh after action
  };

  return {
    houses,
    isLoading: isLoadingHouses,
    createHouse,
    updateHouse,
    deleteHouse,
    refresh: () => fetchHouses(false)
  };
}
