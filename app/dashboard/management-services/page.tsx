"use client";

import { ServiceManager } from "@/components/service-manager";
import { useManagementServices } from "@/hooks/useManagementServices";

export default function ManagementServicesPage() {
  const {
    services,
    requests,
    isLoading,
    createService,
    updateService,
    deleteService,
    quoteRequest,
  } =
    useManagementServices();

  return (
    <ServiceManager
      services={services}
      requests={requests}
      isLoading={isLoading}
      onCreate={createService}
      onUpdate={(id, data) => updateService({ id, data })}
      onDelete={deleteService}
      onQuoteRequest={quoteRequest}
    />
  );
}
