import type { Metadata } from "next";
import { RequestsDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";

export const metadata: Metadata = { title: "Solicitudes | Panel profesional demo" };

export default function ProfessionalRequestsPage() {
  return (
    <>
      <ProfessionalPanelHeader
        title="Solicitudes"
        description="Consulta la necesidad del cliente, sus canales autorizados y el estado de seguimiento."
      />
      <PanelDemoNotice>
        Ejemplo interactivo: abre SOL-DEMO-0004 y márcala como vista. Los correos `.invalid` y teléfonos indicados no son reales.
      </PanelDemoNotice>
      <RequestsDemoManager requests={demoProfessionalPanel.requests} />
    </>
  );
}

