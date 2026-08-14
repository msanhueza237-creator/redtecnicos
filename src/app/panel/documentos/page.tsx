import type { Metadata } from "next";
import { DocumentsDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";

export const metadata: Metadata = { title: "Documentos | Panel profesional demo" };

export default function ProfessionalDocumentsPage() {
  return (
    <>
      <ProfessionalPanelHeader
        title="Documentos"
        description="Revisa estados, vencimientos y observaciones de documentos completamente ficticios."
      />
      <PanelDemoNotice>
        La acción de renovación es una simulación: no abre el disco, no carga archivos y no envía información.
      </PanelDemoNotice>
      <DocumentsDemoManager documents={demoProfessionalPanel.documents} />
    </>
  );
}

