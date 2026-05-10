"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { apiClient } from "@/lib/api";
import { adminUsersApi } from "@/lib/admin-users-api";
import type { AdminUser } from "@/types/auth";

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
    id?: string;
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    title?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type Design = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  floorPlan: string;
  descriptionMarkdown?: string;
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

export type ManagementService = {
  _id: string;
  title: string;
  description: string;
  helpText: string;
  price: number;
  billingPeriod: "once" | "month" | "quarter" | "year";
  category?: string;
  status: "active" | "draft" | "archived";
  images: string[];
  descriptionMarkdown?: string;
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

export type MaintenanceRequest = {
  _id: string;
  user:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        phone?: string;
      };
  service:
    | string
    | {
        _id: string;
        title: string;
        category?: string;
        price: number;
        billingPeriod: "once" | "month" | "quarter" | "year";
      };
  status: "requested" | "quoted" | "accepted" | "rejected" | "scheduled" | "completed";
  location: {
    label?: string;
    latitude?: number;
    longitude?: number;
    pinX?: number;
    pinY?: number;
  };
  propertyNotes?: string;
  quote?: {
    amount?: number;
    notes?: string;
    quotedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ProjectClient = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
};

export type ProjectInstallment = {
  _id?: string;
  title: string;
  description?: string;
  amount: number;
  dueAtProgress: number;
  dueDate?: string;
  status: "pending" | "due" | "paid" | "overdue";
};

export type ProjectMilestone = {
  _id?: string;
  title: string;
  description?: string;
  targetProgress: number;
  status: "pending" | "in_progress" | "completed";
  completedAt?: string;
  updates?: Array<{
    title: string;
    description: string;
    date: string;
    image?: string;
    media?: Array<{
      id?: string;
      type: "image" | "video";
      url: string;
      thumbnail?: string;
      title?: string;
    }>;
  }>;
};

export type Project = {
  _id: string;
  title: string;
  type: "construction" | "design" | "management";
  status:
    | "planning"
    | "construction"
    | "completed"
    | "pending"
    | "initialized"
    | "waiting_for_payment";
  progress: number;
  stage: string;
  client: ProjectClient | string;
  landId?: Land | string;
  designId?: Design | string;
  budget: {
    total: number;
    paid: number;
    breakdown: ProjectInstallment[];
  };
  milestones: ProjectMilestone[];
  createdAt: string;
  updatedAt: string;
};

interface DashboardContextType {
  lands: Land[];
  designs: Design[];
  managementServices: ManagementService[];
  maintenanceRequests: MaintenanceRequest[];
  projects: Project[];
  projectClients: ProjectClient[];
  users: AdminUser[];
  isLoadingLands: boolean;
  isLoadingDesigns: boolean;
  isLoadingManagementServices: boolean;
  isLoadingMaintenanceRequests: boolean;
  isLoadingProjects: boolean;
  isLoadingProjectClients: boolean;
  isLoadingUsers: boolean;
  fetchLands: (background?: boolean) => Promise<void>;
  fetchDesigns: (background?: boolean) => Promise<void>;
  fetchManagementServices: (background?: boolean) => Promise<void>;
  fetchMaintenanceRequests: (background?: boolean) => Promise<void>;
  fetchProjects: (background?: boolean) => Promise<void>;
  fetchProjectClients: (background?: boolean) => Promise<void>;
  fetchUsers: (background?: boolean) => Promise<void>;
  setLands: React.Dispatch<React.SetStateAction<Land[]>>;
  setDesigns: React.Dispatch<React.SetStateAction<Design[]>>;
  setManagementServices: React.Dispatch<React.SetStateAction<ManagementService[]>>;
  setMaintenanceRequests: React.Dispatch<React.SetStateAction<MaintenanceRequest[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setProjectClients: React.Dispatch<React.SetStateAction<ProjectClient[]>>;
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [lands, setLands] = useState<Land[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [managementServices, setManagementServices] = useState<ManagementService[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectClients, setProjectClients] = useState<ProjectClient[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [isLoadingLands, setIsLoadingLands] = useState(false);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isLoadingManagementServices, setIsLoadingManagementServices] = useState(false);
  const [isLoadingMaintenanceRequests, setIsLoadingMaintenanceRequests] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingProjectClients, setIsLoadingProjectClients] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const fetchLands = useCallback(async (background = false) => {
    if (!background) setIsLoadingLands(true);
    try {
      const response = await apiClient.get<Land[]>("/admin/lands");
      setLands(response.data);
    } catch (error) {
      console.error("Fetch lands error:", error);
    } finally {
      if (!background) setIsLoadingLands(false);
    }
  }, []);

  const fetchDesigns = useCallback(async (background = false) => {
    if (!background) setIsLoadingDesigns(true);
    try {
      const response = await apiClient.get<Design[]>("/admin/designs");
      setDesigns(response.data);
    } catch (error) {
      console.error("Fetch designs error:", error);
    } finally {
      if (!background) setIsLoadingDesigns(false);
    }
  }, []);

  const fetchManagementServices = useCallback(async (background = false) => {
    if (!background) setIsLoadingManagementServices(true);
    try {
      const response = await apiClient.get<ManagementService[]>("/admin/management-services");
      setManagementServices(response.data);
    } catch (error) {
      console.error("Fetch management services error:", error);
    } finally {
      if (!background) setIsLoadingManagementServices(false);
    }
  }, []);

  const fetchMaintenanceRequests = useCallback(async (background = false) => {
    if (!background) setIsLoadingMaintenanceRequests(true);
    try {
      const response = await apiClient.get<MaintenanceRequest[]>(
        "/admin/maintenance-requests",
      );
      setMaintenanceRequests(response.data);
    } catch (error) {
      console.error("Fetch maintenance requests error:", error);
    } finally {
      if (!background) setIsLoadingMaintenanceRequests(false);
    }
  }, []);

  const fetchProjects = useCallback(async (background = false) => {
    if (!background) setIsLoadingProjects(true);
    try {
      const response = await apiClient.get<Project[]>("/admin/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Fetch projects error:", error);
    } finally {
      if (!background) setIsLoadingProjects(false);
    }
  }, []);

  const fetchProjectClients = useCallback(async (background = false) => {
    if (!background) setIsLoadingProjectClients(true);
    try {
      const response = await apiClient.get<ProjectClient[]>("/admin/project-clients");
      setProjectClients(response.data);
    } catch (error) {
      console.error("Fetch project clients error:", error);
    } finally {
      if (!background) setIsLoadingProjectClients(false);
    }
  }, []);

  const fetchUsers = useCallback(async (background = false) => {
    if (!background) setIsLoadingUsers(true);
    try {
      const data = await adminUsersApi.list();
      setUsers(data);
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      if (!background) setIsLoadingUsers(false);
    }
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        lands,
        designs,
        managementServices,
        maintenanceRequests,
        projects,
        projectClients,
        users,
        isLoadingLands,
        isLoadingDesigns,
        isLoadingManagementServices,
        isLoadingMaintenanceRequests,
        isLoadingProjects,
        isLoadingProjectClients,
        isLoadingUsers,
        fetchLands,
        fetchDesigns,
        fetchManagementServices,
        fetchMaintenanceRequests,
        fetchProjects,
        fetchProjectClients,
        fetchUsers,
        setLands,
        setDesigns,
        setManagementServices,
        setMaintenanceRequests,
        setProjects,
        setProjectClients,
        setUsers,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
}
