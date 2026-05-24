"use client";

import { ListingManager } from "@/components/listing-manager";
import { useHouses } from "@/hooks/useHouses";
import type { House } from "@/context/dashboard-context";

export default function HousesPage() {
  const { houses, isLoading, createHouse, updateHouse, deleteHouse } = useHouses();

  return (
    <ListingManager
      kind="house"
      listings={houses as any}
      isLoading={isLoading}
      onCreate={createHouse}
      onUpdate={updateHouse}
      onDelete={deleteHouse}
    />
  );
}
