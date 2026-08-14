import type { Metadata } from "next";
import { AdminCard, AdminDemoNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { DemoAction, ModerationDecision } from "@/components/admin/demo-action";
import { adminProfessionals, statusTone } from "@/data/admin-demo";

export const metadata: Metadata = { title: "Profesionales | Administración demo" };

export default function ProfessionalsPage() {
  return (
    <section className="admin-page">
      <AdminPageHeading title="Profesionales" description="Supervisa los perfiles ficticios publicados, sus versiones pendientes y estados de visibilidad." />
      <AdminDemoNotice>La suspensión y revisión son simuladas. La versión aprobada de un perfil permanecerá publicada cuando exista una edición sensible pendiente.</AdminDemoNotice>
      <AdminTableCard title="Perfiles administrados" description={`${adminProfessionals.length} perfiles de prueba`}>
        <table className="admin-table">
          <thead><tr><th>Profesional</th><th>Región</th><th>Puntaje</th><th>Solicitudes</th><th>Estado</th><th>Actualización</th><th>Acción demo</th></tr></thead>
          <tbody>{adminProfessionals.map((professional) => (
            <tr key={professional.id}>
              <td><strong>{professional.name}</strong><small>{professional.id} · {professional.kind}</small></td>
              <td>{professional.region}</td><td>{professional.score}/100</td><td>{professional.requests}</td>
              <td><AdminStatus tone={statusTone(professional.status)}>{professional.status}</AdminStatus></td>
              <td>{professional.updated}</td><td><DemoAction label="Revisar perfil" /></td>
            </tr>
          ))}</tbody>
        </table>
      </AdminTableCard>
      <div style={{ marginTop: 20 }}>
        <AdminCard title="Acción sensible de demostración" description="Suspender u observar un perfil siempre exige un motivo visible.">
          <ModerationDecision actions={["Solicitar cambios", "Suspender perfil"]} resource={adminProfessionals[0].id} />
        </AdminCard>
      </div>
    </section>
  );
}
