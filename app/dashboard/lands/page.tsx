"use client";

import { ListingManager } from "@/components/listing-manager";
import { useLands } from "@/hooks/useLands";
import { useMarketplaceInquiries } from "@/hooks/useMarketplaceInquiries";

export default function LandListingsPage() {
  const { lands, isLoading, createLand, updateLand, deleteLand } = useLands();
  const {
    inquiries,
    loading: isLoadingInquiries,
    updateInquiry,
  } = useMarketplaceInquiries();

  const landInquiries = inquiries.filter((inquiry) => inquiry.itemType === "land");

  return (
    <ListingManager
      kind="land"
      listings={lands}
      marketplaceInquiries={landInquiries}
      isLoading={isLoading || isLoadingInquiries}
      onCreate={createLand}
      onUpdate={(id, data) => updateLand({ id, data })}
      onDelete={deleteLand}
      onUpdateMarketplaceInquiry={({ id, ...data }) => updateInquiry(id, data)}
    />
  );
}
