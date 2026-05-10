"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import {
  useDashboardContext,
  type Project,
  type ProjectClient,
} from "@/context/dashboard-context";

export type ProjectPayload = {
  title: string;
  type: Project["type"];
  status: Project["status"];
  progress: number;
  stage: string;
  client: string;
  landId?: string;
  designId?: string;
  budget: Project["budget"];
  milestones: Project["milestones"];
};

export function useProjects() {
  const {
    projects,
    projectClients,
    lands,
    designs,
    isLoadingProjects,
    isLoadingProjectClients,
    fetchProjects,
    fetchProjectClients,
    fetchLands,
    fetchDesigns,
  } = useDashboardContext();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchProjects(projects.length > 0);
      fetchProjectClients(projectClients.length > 0);
      fetchLands(lands.length > 0);
      fetchDesigns(designs.length > 0);
      initialFetchDone.current = true;
    }
  }, [
    designs.length,
    fetchDesigns,
    fetchLands,
    fetchProjectClients,
    fetchProjects,
    lands.length,
    projectClients.length,
    projects.length,
  ]);

  const createProject = async (payload: ProjectPayload) => {
    const response = await apiClient.post<Project>("/admin/projects", payload);
    await fetchProjects(true);
    return response.data;
  };

  const updateProject = async ({ id, payload }: { id: string; payload: ProjectPayload }) => {
    const response = await apiClient.put<Project>(`/admin/projects/${id}`, payload);
    await fetchProjects(true);
    return response.data;
  };

  const updateMilestone = async ({
    projectId,
    milestoneId,
    data,
  }: {
    projectId: string;
    milestoneId: string;
    data: FormData;
  }) => {
    const response = await apiClient.put<Project>(
      `/admin/projects/${projectId}/milestones/${milestoneId}`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    await fetchProjects(true);
    return response.data;
  };

  const deleteProject = async (id: string) => {
    await apiClient.delete(`/admin/projects/${id}`);
    await fetchProjects(true);
  };

  return {
    projects,
    clients: projectClients as ProjectClient[],
    lands,
    designs,
    isLoading: isLoadingProjects || isLoadingProjectClients,
    createProject,
    updateProject,
    updateMilestone,
    deleteProject,
    refresh: () => fetchProjects(false),
  };
}
