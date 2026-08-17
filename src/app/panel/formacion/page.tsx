import type { Metadata } from "next";
import { QualificationsDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { ProfessionalQualificationManager } from "@/components/professional-panel/professional-qualification-manager";
import { PanelDemoNotice, PanelOperationalNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { getAppSession } from "@/lib/auth/session";
import { listProfessionalQualifications } from "@/lib/professional/qualifications";

export const metadata: Metadata = { title: "Formación | Panel profesional" };
export const dynamic = "force-dynamic";

export default async function ProfessionalQualificationsPage() {
  const session = await getAppSession();
  if (session?.source === "supabase" && session.userId) {
    const result = await listProfessionalQualifications(session.userId);
    return (
      <>
        <ProfessionalPanelHeader title="Formación" description="Declara títulos y capacitaciones y adjunta su respaldo oficial privado." />
        <PanelOperationalNotice>
          Cada archivo se valida, pasa por cuarentena y análisis antivirus. Solo la información aprobada aparecerá en tu perfil; el documento nunca será público.
        </PanelOperationalNotice>
        {result.error ? <div className="professional-panel-notice is-danger" role="alert"><p>{result.error}</p></div> : null}
        <ProfessionalQualificationManager initialItems={result.data} />
      </>
    );
  }

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
