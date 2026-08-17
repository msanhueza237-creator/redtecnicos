import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { DocumentsDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, PanelOperationalNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { qualificationStatusClass, qualificationStatusLabel, qualificationTypeLabel } from "@/domain/professional-qualification";
import { getAppSession } from "@/lib/auth/session";
import { listProfessionalQualifications } from "@/lib/professional/qualifications";

export const metadata: Metadata = { title: "Documentos | Panel profesional" };
export const dynamic = "force-dynamic";

function formatFileSize(bytes: number): string {
  if (!bytes) return "Tamaño no disponible";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ProfessionalDocumentsPage() {
  const session = await getAppSession();
  if (session?.source === "supabase" && session.userId) {
    const result = await listProfessionalQualifications(session.userId);
    return (
      <>
        <ProfessionalPanelHeader
          title="Documentos"
          description="Consulta los respaldos privados, vencimientos y resultados de revisión."
          actions={<Link className="button button-primary" href="/panel/formacion">Agregar antecedente</Link>}
        />
        <PanelOperationalNotice>
          Los documentos están en almacenamiento privado. Los enlaces duran cinco minutos y requieren una sesión autorizada.
        </PanelOperationalNotice>
        {result.error ? <div className="professional-panel-notice is-danger" role="alert"><p>{result.error}</p></div> : null}
        <div className="professional-panel-list professional-panel-qualifications">
          {result.data.map((item) => (
            <article key={item.id}>
              <span className="professional-panel-list-icon"><FileCheck2 aria-hidden="true" size={20} /></span>
              <div>
                <span className="professional-panel-list-meta">{qualificationTypeLabel(item.type)}</span>
                <h3>{item.title}</h3>
                <p>{item.originalFileName} · {formatFileSize(item.fileSizeBytes)}{item.expiresAt ? ` · vence ${item.expiresAt}` : " · sin vencimiento informado"}</p>
                {item.reviewReason ? <small>Observación: {item.reviewReason}</small> : null}
              </div>
              <div>
                <span className={`professional-panel-status ${qualificationStatusClass(item.status)}`}>{qualificationStatusLabel(item.status)}</span>
                {item.hasDocument ? <a className="button button-secondary" href={`/api/v1/profiles/qualifications/${item.id}/document`} rel="noreferrer" target="_blank">Abrir privado</a> : null}
              </div>
            </article>
          ))}
        </div>
        {!result.data.length && !result.error ? <div className="professional-panel-empty"><span><ShieldCheck aria-hidden="true" size={24} /></span><h2>Aún no hay documentos</h2><p>Agrega un título o capacitación junto con su respaldo oficial.</p><Link className="button button-primary" href="/panel/formacion">Agregar formación</Link></div> : null}
      </>
    );
  }

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
