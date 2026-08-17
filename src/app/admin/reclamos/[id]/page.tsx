import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComplaintDecisionForm } from "@/components/admin/complaint-decision-form";
import {
  AdminOperationalNotice,
  AdminPageHeading,
  AdminStatus,
} from "@/components/admin/admin-ui";
import {
  complaintCategoryLabels,
  complaintPriorityLabels,
  complaintRelatedTypeLabels,
  complaintStatusLabels,
} from "@/domain/complaint";
import {
  complaintPriorityTone,
  complaintStatusTone,
  getAdminComplaint,
} from "@/lib/admin/complaints";

export const metadata: Metadata = { title: "Detalle del reclamo | Administración" };
export const dynamic = "force-dynamic";

const formatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

export default async function ComplaintDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const result = await getAdminComplaint(id);
  if (!result.data && !result.error) notFound();
  if (!result.data) {
    return <section className="admin-page"><Link className="admin-table-link" href="/admin/reclamos">← Volver a reclamos</Link><p className="auth-message" role="alert" style={{ marginTop: 20 }}>{result.error}</p></section>;
  }
  const complaint = result.data;

  return (
    <section className="admin-page">
      <Link className="admin-table-link" href="/admin/reclamos">← Volver a reclamos</Link>
      <AdminPageHeading eyebrow="Caso real" title={complaint.caseNumber} description={complaint.subject} />
      <AdminOperationalNotice>Los datos del reportante son privados. Úsalos únicamente para investigar y responder este caso.</AdminOperationalNotice>
      <div className="admin-detail-grid">
        <div className="admin-stack">
          <article className="dashboard-card admin-complaint-detail">
            <div className="admin-complaint-status-row">
              <AdminStatus tone={complaintStatusTone(complaint.status)}>{complaintStatusLabels[complaint.status]}</AdminStatus>
              <AdminStatus tone={complaintPriorityTone(complaint.priority)}>{complaintPriorityLabels[complaint.priority]}</AdminStatus>
            </div>
            <h2>Antecedentes del reporte</h2>
            <p className="admin-complaint-description">{complaint.description}</p>
            <dl className="admin-info-list">
              <div><dt>Categoría</dt><dd>{complaintCategoryLabels[complaint.category]}</dd></div>
              <div><dt>Recurso</dt><dd>{complaintRelatedTypeLabels[complaint.relatedType]}{complaint.relatedReference ? ` · ${complaint.relatedReference}` : ""}</dd></div>
              <div><dt>Creado</dt><dd>{formatter.format(new Date(complaint.createdAt))}</dd></div>
              <div><dt>Última actualización</dt><dd>{formatter.format(new Date(complaint.updatedAt))}</dd></div>
              <div><dt>Responsable</dt><dd>{complaint.assignedToName ?? "Sin asignar"}</dd></div>
            </dl>
          </article>
          {complaint.lastAdminReason ? <article className="dashboard-card"><h2>Última decisión</h2><p className="admin-card-copy">{complaint.lastAdminReason}</p>{complaint.resolutionSummary ? <><h3>Resolución</h3><p className="admin-card-copy">{complaint.resolutionSummary}</p></> : null}</article> : null}
        </div>
        <aside className="admin-stack">
          <article className="dashboard-card">
            <h2>Datos de contacto</h2>
            <dl className="admin-info-list">
              <div><dt>Nombre</dt><dd>{complaint.reporterName}</dd></div>
              <div><dt>Correo</dt><dd><a href={`mailto:${complaint.reporterEmail}`}>{complaint.reporterEmail}</a></dd></div>
              <div><dt>Teléfono</dt><dd>{complaint.reporterPhone ?? "No informado"}</dd></div>
            </dl>
          </article>
          <article className="dashboard-card">
            <h2>Gestionar caso</h2>
            <p className="admin-card-copy">Clasifica, investiga o cierra el caso. El motivo nunca será público automáticamente.</p>
            <ComplaintDecisionForm complaintId={complaint.id} currentPriority={complaint.priority} currentStatus={complaint.status} />
          </article>
        </aside>
      </div>
    </section>
  );
}
