import { useCallback, useEffect, useState } from "react";
import { forgeApi } from "@/lib/forge-api";

export type MarketplaceInquiry = {
  id: string;
  _id?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  guestInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  itemType: "land" | "house";
  land?: {
    id: string;
    title: string;
    location: string;
    price: number;
  };
  house?: {
    id: string;
    title: string;
    location: string;
    price: number;
  };
  status: "requested" | "contacted" | "in_discussion" | "resolved" | "rejected";
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export function useMarketplaceInquiries() {
  const [inquiries, setInquiries] = useState<MarketplaceInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await forgeApi.getMarketplaceInquiries();
      setInquiries(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch marketplace inquiries");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInquiry = useCallback(async (id: string, payload: any) => {
    try {
      const updated = await forgeApi.updateMarketplaceInquiry(id, payload);
      setInquiries((prev) =>
        prev.map((item) => (item.id === id || item._id === id ? updated : item)),
      );
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed to update inquiry" };
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  return {
    inquiries,
    loading,
    error,
    fetchInquiries,
    updateInquiry,
  };
}
