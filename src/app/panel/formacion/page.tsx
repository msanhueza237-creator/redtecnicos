import type { Metadata } from "next";
import { QualificationsDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";

export const metadata: Metadata = { title: "Formación | Panel profesional demo" };

export default function ProfessionalQualificationsPage() {
  return (
    <>
      <ProfessionalPanelHeader
        title="Formación"
        description="Declara títulos profesionales, títulos técnicos y capacitaciones para revisión."
      />
      <PanelDemoNotice>
        No cargues documentos reales. Esta vista demuestra qué datos se revisarán y cuáles podrán aparecer públicamente.
      </PanelDemoNotice>
      <QualificationsDemoManager qualifications={demoProfessionalPanel.qualifications} />
    </>
  );
}
