"use client";

import { ServiceManager } from "@/components/service-manager";
import { useManagementServices } from "@/hooks/useManagementServices";

export default function ManagementServicesPage() {
  const { services, isLoading, createService, updateService, deleteService } =
    useManagementServices();

  return (
    <ServiceManager
      services={services}
      isLoading={isLoading}
      onCreate={createService}
      onUpdate={(id, data) => updateService({ id, data })}
      onDelete={deleteService}
    />
  );
}
