"use client";

import { ListingManager } from "@/components/listing-manager";
import { useDesigns } from "@/hooks/useDesigns";

export default function DesignListingsPage() {
  const {
    designs,
    designRequests,
    isLoading,
    createDesign,
    updateDesign,
    deleteDesign,
    updateDesignRequest,
  } = useDesigns();

  return (
    <ListingManager
      kind="design"
      listings={designs}
      designRequests={designRequests}
      isLoading={isLoading}
      onCreate={createDesign}
      onUpdate={(id, data) => updateDesign({ id, data })}
      onDelete={deleteDesign}
      onUpdateDesignRequest={updateDesignRequest}
    />
  );
}
