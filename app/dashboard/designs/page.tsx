"use client";

import { ListingManager } from "@/components/listing-manager";
import { useDesigns } from "@/hooks/useDesigns";

export default function DesignListingsPage() {
  const { designs, isLoading, createDesign, updateDesign, deleteDesign } = useDesigns();

  return (
    <ListingManager
      kind="design"
      listings={designs}
      isLoading={isLoading}
      onCreate={createDesign}
      onUpdate={(id, data) => updateDesign({ id, data })}
      onDelete={deleteDesign}
    />
  );
}
