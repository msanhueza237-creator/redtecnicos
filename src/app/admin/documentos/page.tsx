import type { Metadata } from "next";
import { FileLock2, ShieldCheck } from "lucide-react";
import { QualificationModerationForm } from "@/components/admin/qualification-moderation-form";
import { AdminDemoNotice, AdminOperationalNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { adminDocuments, statusTone } from "@/data/admin-demo";
import { qualificationTypeLabel } from "@/domain/professional-qualification";
import { adminQualificationStatusLabel, adminQualificationStatusTone, listAdminQualificationDocuments } from "@/lib/admin/qualifications";
import { isSupabaseAuthMode } from "@/lib/supabase/config";
import styles from "./admin-documents.module.css";

export const metadata: Metadata = { title: "Documentos | Administración" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeZone: "America/Santiago" });

function formatFileSize(bytes: number): string {
  if (!bytes) return "No disponible";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  if (isSupabaseAuthMode()) {
    const result = await listAdminQualificationDocuments();
    return (
      <section className="admin-page">
        <AdminPageHeading eyebrow="Operación real" title="Documentos" description="Revisa títulos, certificaciones y capacitaciones sin exponer sus archivos al sitio público." />
        <AdminOperationalNotice>Los archivos se abren mediante enlaces privados de cinco minutos. La aprobación exige análisis antivirus limpio, motivo y sesión administrativa.</AdminOperationalNotice>
        {result.error ? <p className="auth-message" role="alert">{result.error}</p> : null}
        <div className={styles.grid}>
          {result.data.map((document) => (
            <article className={styles.card} key={document.id}>
              <div className={styles.heading}>
                <div><span className={styles.type}>{qualificationTypeLabel(document.type)}</span><h2>{document.title}</h2></div>
                <AdminStatus tone={adminQualificationStatusTone(document.status)}>{adminQualificationStatusLabel(document.status)}</AdminStatus>
              </div>
              <p className={styles.owner}>{document.owner}</p>
              <dl className={styles.details}>
                <div><dt>Institución</dt><dd>{document.institution}</dd></div>
                <div><dt>Obtención</dt><dd>{document.issuedYear}</dd></div>
                <div><dt>Vencimiento</dt><dd>{document.expiresAt ?? "No informado"}</dd></div>
                <div><dt>Archivo</dt><dd>{document.originalFileName} · {formatFileSize(document.fileSizeBytes)}</dd></div>
                <div><dt>Recepción</dt><dd>{dateFormatter.format(new Date(document.createdAt))}</dd></div>
              </dl>
              <div className={`${styles.security} ${document.scanStatus !== "clean" ? styles.isWarning : ""}`}>
                {document.scanStatus === "clean" ? <ShieldCheck aria-hidden="true" size={17} /> : <FileLock2 aria-hidden="true" size={17} />}
                <span>{document.scanStatus === "clean" ? "Firma, MIME, tamaño y análisis antivirus superados." : "Documento heredado sin análisis verificable: no se puede aprobar."}</span>
              </div>
              {document.reviewReason ? <p className={styles.reason}><strong>Último motivo:</strong> {document.reviewReason}</p> : null}
              <div className={styles.actions}>
                {document.hasDocument ? <a className="button button-secondary" href={`/api/v1/profiles/qualifications/${document.id}/document`} rel="noreferrer" target="_blank">Abrir respaldo privado</a> : null}
              </div>
              <QualificationModerationForm qualificationId={document.id} securityValidated={document.scanStatus === "clean" && document.hasDocument} status={document.status} />
            </article>
          ))}
        </div>
        {!result.data.length && !result.error ? <div className="admin-empty-state"><strong>Aún no hay documentos cargados</strong><p>Los antecedentes enviados por técnicos y empresas aparecerán aquí.</p></div> : null}
      </section>
    );
  }

  return (
    <section className="admin-page">
      <AdminPageHeading title="Documentos" description="Revisa metadatos y estados de los antecedentes enviados por profesionales ficticios." />
      <AdminDemoNotice>No existen archivos reales en esta vista. En producción, los documentos serán privados, validados y analizados antes de una revisión humana.</AdminDemoNotice>
      <AdminTableCard title="Bandeja documental" description="Archivos simulados, sin descarga">
        <table className="admin-table"><thead><tr><th>Documento</th><th>Propietario</th><th>Tipo</th><th>Recepción</th><th>Vencimiento</th><th>Estado</th><th>Acción demo</th></tr></thead>
          <tbody>{adminDocuments.map((document) => <tr key={document.id}><td><strong>{document.id}</strong><small>Metadato ficticio</small></td><td>{document.owner}</td><td>{document.type}</td><td>{document.received}</td><td>{document.expires}</td><td><AdminStatus tone={statusTone(document.status)}>{document.status}</AdminStatus></td><td><DemoAction label="Revisar" /></td></tr>)}</tbody>
        </table>
      </AdminTableCard>
    </section>
  );
}
