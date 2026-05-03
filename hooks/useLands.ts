"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export type Land = {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  images: string[];
  status: "available" | "sold";
  descriptionMarkdown?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  media?: Array<{
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    title?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export function useLands() {
  const [lands, setLands] = useState<Land[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchLands = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Land[]>("/admin/lands");
      setLands(response.data);
      setIsError(false);
    } catch (error) {
      console.error("Fetch lands error:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  const createLand = async (data: Partial<Land>) => {
    const response = await apiClient.post<Land>("/admin/lands", data);
    await fetchLands();
    return response.data;
  };

  const updateLand = async ({ id, data }: { id: string; data: Partial<Land> }) => {
    const response = await apiClient.put<Land>(`/admin/lands/${id}`, data);
    await fetchLands();
    return response.data;
  };

  const deleteLand = async (id: string) => {
    await apiClient.delete(`/admin/lands/${id}`);
    await fetchLands();
  };

  return {
    lands,
    isLoading,
    isError,
    createLand,
    updateLand,
    deleteLand,
    refresh: fetchLands
  };
}
