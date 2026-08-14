import type { Metadata } from "next";
import Link from "next/link";
import { AdminDemoNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { adminApplications, statusTone } from "@/data/admin-demo";

export const metadata: Metadata = { title: "Postulaciones | Administración demo" };

export default function ApplicationsPage() {
  return (
    <section className="admin-page">
      <AdminPageHeading title="Postulaciones" description="Revisa la identidad, experiencia, cobertura y antecedentes declarados por cada postulante ficticio." />
      <AdminDemoNotice />
      <AdminTableCard title="Cola de revisión" description={`${adminApplications.length} registros demo visibles`}>
        <table className="admin-table">
          <thead><tr><th>Postulación</th><th>Especialidad</th><th>Ubicación</th><th>Puntaje</th><th>Estado</th><th>Actualización</th><th>Acción</th></tr></thead>
          <tbody>
            {adminApplications.map((application) => (
              <tr key={application.id}>
                <td><strong>{application.name}</strong><small>{application.id} · {application.kind}</small></td>
                <td>{application.specialty}</td>
                <td>{application.commune}<small>{application.region}</small></td>
                <td>{application.score}/100</td>
                <td><AdminStatus tone={statusTone(application.status)}>{application.status}</AdminStatus></td>
                <td>{application.updated}</td>
                <td><Link className="admin-table-link" href={`/admin/postulaciones/${application.id}`}>Abrir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableCard>
    </section>
  );
}
