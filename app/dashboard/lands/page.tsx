"use client";

import { ListingManager } from "@/components/listing-manager";
import { useLands } from "@/hooks/useLands";

export default function LandListingsPage() {
  const { lands, isLoading, createLand, updateLand, deleteLand } = useLands();

  return (
    <ListingManager
      kind="land"
      listings={lands}
      isLoading={isLoading}
      onCreate={createLand}
      onUpdate={(id, data) => updateLand({ id, data })}
      onDelete={deleteLand}
    />
  );
}
