"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export type Design = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  floorPlan: string;
  descriptionMarkdown?: string;
  media?: Array<{
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    title?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export function useDesigns() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchDesigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Design[]>("/admin/designs");
      setDesigns(response.data);
      setIsError(false);
    } catch (error) {
      console.error("Fetch designs error:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  const createDesign = async (data: Partial<Design>) => {
    const response = await apiClient.post<Design>("/admin/designs", data);
    await fetchDesigns();
    return response.data;
  };

  const updateDesign = async ({ id, data }: { id: string; data: Partial<Design> }) => {
    const response = await apiClient.put<Design>(`/admin/designs/${id}`, data);
    await fetchDesigns();
    return response.data;
  };

  const deleteDesign = async (id: string) => {
    await apiClient.delete(`/admin/designs/${id}`);
    await fetchDesigns();
  };

  return {
    designs,
    isLoading,
    isError,
    createDesign,
    updateDesign,
    deleteDesign,
    refresh: fetchDesigns
  };
}
