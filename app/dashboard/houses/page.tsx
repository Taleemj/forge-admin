"use client";

import { ListingManager } from "@/components/listing-manager";
import { useHouses } from "@/hooks/useHouses";
import { useMarketplaceInquiries } from "@/hooks/useMarketplaceInquiries";

export default function HousesPage() {
  const { houses, isLoading, createHouse, updateHouse, deleteHouse } = useHouses();
  const {
    inquiries,
    loading: isLoadingInquiries,
    updateInquiry,
  } = useMarketplaceInquiries();

  const houseInquiries = inquiries.filter((inquiry) => inquiry.itemType === "house");

  return (
    <ListingManager
      kind="house"
      listings={houses as any}
      marketplaceInquiries={houseInquiries}
      isLoading={isLoading || isLoadingInquiries}
      onCreate={createHouse}
      // @ts-ignore
      onUpdate={updateHouse}
      onDelete={deleteHouse}
      onUpdateMarketplaceInquiry={({ id, ...data }) => updateInquiry(id, data)}
    />
  );
}
