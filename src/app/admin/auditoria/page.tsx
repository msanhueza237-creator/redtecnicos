import type { Metadata } from "next";
import {
  AdminDemoNotice,
  AdminOperationalNotice,
  AdminPageHeading,
  AdminStatus,
  AdminTableCard,
} from "@/components/admin/admin-ui";
import { adminAudit, statusTone } from "@/data/admin-demo";
import { listAdminAuditEvents } from "@/lib/admin/audit";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Auditoría | Administración" };
export const dynamic = "force-dynamic";

const formatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/Santiago",
});

function filterValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.slice(0, 80) : "";
}

function formattedPayload(value: unknown): string {
  return value == null ? "Sin datos" : JSON.stringify(value, null, 2);
}

export default async function AuditPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>) {
  if (!isSupabaseAuthMode()) {
    return (
      <section className="admin-page">
        <AdminPageHeading title="Auditoría" description="Traza decisiones administrativas ficticias con actor, recurso, resultado y momento." />
        <AdminDemoNotice>Este historial es estático. En producción será inmutable, restringido por rol y cada corrección administrativa requerirá un motivo.</AdminDemoNotice>
        <AdminTableCard title="Eventos recientes" description="Registro de actividad completamente simulado">
          <table className="admin-table"><thead><tr><th>Evento</th><th>Actor</th><th>Acción</th><th>Recurso</th><th>Resultado</th><th>Fecha</th></tr></thead>
            <tbody>{adminAudit.map((event) => <tr key={event.id}><td><strong>{event.id}</strong></td><td>{event.actor}</td><td>{event.action}</td><td>{event.resource}</td><td><AdminStatus tone={statusTone(event.result)}>{event.result}</AdminStatus></td><td>{event.date}</td></tr>)}</tbody>
          </table>
        </AdminTableCard>
      </section>
    );
  }

  const params = await searchParams;
  const filters = {
    query: filterValue(params.q),
    action: filterValue(params.action),
    entityType: filterValue(params.entity),
  };
  const result = await listAdminAuditEvents(filters);

  return (
    <section className="admin-page">
      <AdminPageHeading eyebrow="Operación real" title="Auditoría" description="Consulta el historial inmutable de decisiones y cambios sensibles realizados en la plataforma." />
      <AdminOperationalNotice>Esta vista lee directamente el registro de Supabase. Los eventos no se editan ni se eliminan desde el panel administrativo.</AdminOperationalNotice>
      {result.error ? <p className="auth-message" role="alert">{result.error}</p> : null}
      <form className="admin-audit-filters" method="get">
        <label><span>Buscar</span><input defaultValue={filters.query} name="q" placeholder="Acción, recurso, identificador o motivo" /></label>
        <label><span>Tipo de recurso</span><select defaultValue={filters.entityType} name="entity"><option value="">Todos</option><option value="professional_profile">Perfil profesional</option><option value="review">Evaluación</option><option value="complaint">Reclamo</option><option value="app_user">Usuario</option></select></label>
        <label><span>Acción exacta</span><input defaultValue={filters.action} name="action" placeholder="Ej.: complaint.updated" /></label>
        <button className="button button-secondary" type="submit">Aplicar filtros</button>
      </form>
      <AdminTableCard title="Eventos recientes" description={`${result.data.length} ${result.data.length === 1 ? "evento encontrado" : "eventos encontrados"}; máximo 200 por consulta`}>
        {result.data.length ? <table className="admin-table admin-audit-table">
          <thead><tr><th>Evento</th><th>Actor</th><th>Acción</th><th>Recurso</th><th>Motivo</th><th>Fecha</th><th>Cambios</th></tr></thead>
          <tbody>{result.data.map((event) => <tr key={event.id}>
            <td><strong>AUD-{String(event.id).padStart(6, "0")}</strong></td>
            <td>{event.actorName}</td>
            <td><AdminStatus tone="success">{event.action}</AdminStatus></td>
            <td>{event.entityType}<small>{event.entityId ?? "Sin identificador"}</small></td>
            <td>{event.reason}</td>
            <td>{formatter.format(new Date(event.createdAt))}</td>
            <td><details className="admin-audit-details"><summary>Ver detalle</summary><strong>Antes</strong><pre>{formattedPayload(event.beforeData)}</pre><strong>Después</strong><pre>{formattedPayload(event.afterData)}</pre></details></td>
          </tr>)}</tbody>
        </table> : <div className="admin-empty-state"><strong>No hay eventos para estos filtros</strong><p>Prueba quitando los filtros o realiza una acción administrativa auditada.</p></div>}
      </AdminTableCard>
    </section>
  );
}
