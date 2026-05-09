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

interface DashboardContextType {
  lands: Land[];
  designs: Design[];
  users: AdminUser[];
  isLoadingLands: boolean;
  isLoadingDesigns: boolean;
  isLoadingUsers: boolean;
  fetchLands: (background?: boolean) => Promise<void>;
  fetchDesigns: (background?: boolean) => Promise<void>;
  fetchUsers: (background?: boolean) => Promise<void>;
  setLands: React.Dispatch<React.SetStateAction<Land[]>>;
  setDesigns: React.Dispatch<React.SetStateAction<Design[]>>;
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [lands, setLands] = useState<Land[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [isLoadingLands, setIsLoadingLands] = useState(false);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
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
        users,
        isLoadingLands,
        isLoadingDesigns,
        isLoadingUsers,
        fetchLands,
        fetchDesigns,
        fetchUsers,
        setLands,
        setDesigns,
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
