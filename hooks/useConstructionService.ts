"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export type ConstructionService = {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  processMarkdown?: string;
  consultationText?: string;
  startingPrice?: number;
  status: "active" | "draft" | "archived";
  images: string[];
  media?: Array<{
    id?: string;
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    title?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type ConstructionRequest = {
  _id: string;
  user?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        phone?: string;
      };
  guestInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  service?: string | { _id: string; title: string };
  status:
    | "requested"
    | "contacted"
    | "meeting_scheduled"
    | "quoted"
    | "converted_to_project"
    | "rejected";
  location?: {
    label?: string;
    latitude?: number;
    longitude?: number;
  };
  budgetRange?: string;
  timeline?: string;
  meetingPreference?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export function useConstructionService() {
  const [services, setServices] = useState<ConstructionService[]>([]);
  const [requests, setRequests] = useState<ConstructionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [servicesResponse, requestsResponse] = await Promise.all([
        apiClient.get<ConstructionService[]>("/admin/construction-services"),
        apiClient.get<ConstructionRequest[]>("/admin/construction-requests"),
      ]);
      setServices(servicesResponse.data);
      setRequests(requestsResponse.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createService = async (data: FormData) => {
    const response = await apiClient.post<ConstructionService>(
      "/admin/construction-services",
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    await fetchAll();
    return response.data;
  };

  const updateService = async (id: string, data: FormData) => {
    const response = await apiClient.put<ConstructionService>(
      `/admin/construction-services/${id}`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    await fetchAll();
    return response.data;
  };

  const deleteService = async (id: string) => {
    await apiClient.delete(`/admin/construction-services/${id}`);
    await fetchAll();
  };

  const updateRequest = async (
    id: string,
    data: Pick<ConstructionRequest, "status" | "adminNotes">,
  ) => {
    const response = await apiClient.put<ConstructionRequest>(
      `/admin/construction-requests/${id}`,
      data,
    );
    await fetchAll();
    return response.data;
  };

  const convertRequestToProject = async (
    id: string,
    data: {
      title?: string;
      totalBudget?: number;
      depositAmount?: number;
      adminNotes?: string;
    },
  ) => {
    const response = await apiClient.post(
      `/admin/construction-requests/${id}/convert-to-project`,
      data,
    );
    await fetchAll();
    return response.data;
  };

  return {
    services,
    requests,
    isLoading,
    createService,
    updateService,
    deleteService,
    updateRequest,
    convertRequestToProject,
  };
}
