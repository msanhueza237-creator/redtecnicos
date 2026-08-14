import type { Metadata } from "next";
import { AdminDemoNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { adminClaims, statusTone } from "@/data/admin-demo";

export const metadata: Metadata = { title: "Reclamos | Administración demo" };

export default function ClaimsPage() {
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
