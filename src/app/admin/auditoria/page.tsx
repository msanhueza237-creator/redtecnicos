import type { Metadata } from "next";
import { AdminDemoNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { adminAudit, statusTone } from "@/data/admin-demo";

export const metadata: Metadata = { title: "Auditoría | Administración demo" };

export default function AuditPage() {
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
