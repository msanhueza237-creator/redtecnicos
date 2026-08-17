import type { Metadata, Route } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Search } from "lucide-react";
import {
  AdminDemoNotice,
  AdminOperationalNotice,
  AdminPageHeading,
  AdminStatus,
  AdminTableCard,
} from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { adminClaims, statusTone } from "@/data/admin-demo";
import {
  complaintCategoryLabels,
  complaintPriorityLabels,
  complaintStatusLabels,
} from "@/domain/complaint";
import {
  complaintPriorityTone,
  complaintStatusTone,
  listAdminComplaints,
} from "@/lib/admin/complaints";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reclamos | Administración" };
export const dynamic = "force-dynamic";

const formatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

export default async function ClaimsPage() {
  if (isSupabaseAuthMode()) {
    const result = await listAdminComplaints();
    const open = result.data.filter((item) => !["resolved", "dismissed"].includes(item.status)).length;
    const highPriority = result.data.filter((item) => ["high", "urgent"].includes(item.priority) && !["resolved", "dismissed"].includes(item.status)).length;
    const investigating = result.data.filter((item) => item.status === "investigating").length;
    const resolved = result.data.filter((item) => item.status === "resolved").length;

    return (
      <section className="admin-page">
        <AdminPageHeading eyebrow="Operación real" title="Reclamos" description="Recibe, prioriza e investiga reportes relacionados con perfiles, solicitudes, evaluaciones o privacidad." />
        <AdminOperationalNotice>Los reportes de esta bandeja provienen del formulario público y contienen información privada. Cada cambio exige un motivo y queda registrado en Auditoría.</AdminOperationalNotice>
        {result.error ? <p className="auth-message" role="alert">{result.error}</p> : null}
        <div className="metric-grid admin-metrics admin-claims-metrics">
          <article><span className="metric-icon"><Clock3 aria-hidden="true" size={20} /></span><span>Casos abiertos</span><strong>{open}</strong><small>Pendientes de resolución</small></article>
          <article><span className="metric-icon"><AlertTriangle aria-hidden="true" size={20} /></span><span>Prioridad alta</span><strong>{highPriority}</strong><small>Altos o urgentes abiertos</small></article>
          <article><span className="metric-icon"><Search aria-hidden="true" size={20} /></span><span>Investigando</span><strong>{investigating}</strong><small>Con revisión activa</small></article>
          <article><span className="metric-icon"><CheckCircle2 aria-hidden="true" size={20} /></span><span>Resueltos</span><strong>{resolved}</strong><small>Con cierre registrado</small></article>
        </div>
        <AdminTableCard title="Casos reportados" description={`${result.data.length} ${result.data.length === 1 ? "caso real registrado" : "casos reales registrados"}`}>
          {result.data.length ? <table className="admin-table admin-claims-table">
            <thead><tr><th>Caso</th><th>Asunto</th><th>Reportante</th><th>Prioridad</th><th>Estado</th><th>Creación</th><th>Acción</th></tr></thead>
            <tbody>{result.data.map((complaint) => <tr key={complaint.id}>
              <td><strong>{complaint.caseNumber}</strong><small>{complaintCategoryLabels[complaint.category]}</small></td>
              <td><strong>{complaint.subject}</strong><small>{complaint.description.slice(0, 130)}{complaint.description.length > 130 ? "…" : ""}</small></td>
              <td>{complaint.reporterName}<small>{complaint.reporterEmail}</small></td>
              <td><AdminStatus tone={complaintPriorityTone(complaint.priority)}>{complaintPriorityLabels[complaint.priority]}</AdminStatus></td>
              <td><AdminStatus tone={complaintStatusTone(complaint.status)}>{complaintStatusLabels[complaint.status]}</AdminStatus></td>
              <td>{formatter.format(new Date(complaint.createdAt))}</td>
              <td><Link className="admin-table-link" href={`/admin/reclamos/${complaint.id}` as Route}>Abrir caso</Link></td>
            </tr>)}</tbody>
          </table> : <div className="admin-empty-state"><strong>Aún no hay reclamos</strong><p>Los reportes enviados desde el canal público aparecerán aquí automáticamente.</p></div>}
        </AdminTableCard>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <AdminPageHeading title="Reclamos" description="Prioriza e investiga reportes ficticios relacionados con perfiles, solicitudes o evaluaciones." />
      <AdminDemoNotice />
      <AdminTableCard title="Casos reportados" description="No contiene denuncias ni personas reales">
        <table className="admin-table"><thead><tr><th>Caso</th><th>Asunto</th><th>Recurso relacionado</th><th>Prioridad</th><th>Estado</th><th>Creación</th><th>Acción demo</th></tr></thead>
          <tbody>{adminClaims.map((claim) => <tr key={claim.id}><td><strong>{claim.id}</strong></td><td>{claim.subject}</td><td>{claim.related}</td><td><AdminStatus tone={statusTone(claim.priority)}>{claim.priority}</AdminStatus></td><td><AdminStatus tone={statusTone(claim.status)}>{claim.status}</AdminStatus></td><td>{claim.created}</td><td><DemoAction label="Abrir caso" /></td></tr>)}</tbody>
        </table>
      </AdminTableCard>
    </section>
  );
}
