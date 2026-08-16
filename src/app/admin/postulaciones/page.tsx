import type { Metadata } from "next";
import Link from "next/link";
import { AdminDemoNotice, AdminOperationalNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { adminApplications, statusTone } from "@/data/admin-demo";
import { regionNameFromCode } from "@/domain/professional-registration";
import { listProfessionalApplications, profileStatusLabels, profileStatusTone } from "@/lib/admin/professional-applications";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Postulaciones | Administración" };
export const dynamic = "force-dynamic";

function formatUpdated(value: string): string {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date(value));
}

export default async function ApplicationsPage() {
  if (isSupabaseAuthMode()) {
    const result = await listProfessionalApplications();
    return (
      <section className="admin-page">
        <AdminPageHeading eyebrow="Operación real" title="Postulaciones" description="Revisa los perfiles enviados por técnicos y empresas antes de publicarlos en el directorio." />
        <AdminOperationalNotice>Esta bandeja está conectada a Supabase. Cada decisión exige un motivo y queda registrada en auditoría.</AdminOperationalNotice>
        {result.error ? <p className="auth-message" role="alert">{result.error}</p> : null}
        <AdminTableCard title="Cola de revisión" description={`${result.data.length} postulaciones reales visibles`}>
          <table className="admin-table">
            <thead><tr><th>Postulación</th><th>Categoría</th><th>Ubicación</th><th>Experiencia</th><th>Estado</th><th>Actualización</th><th>Acción</th></tr></thead>
            <tbody>
              {result.data.map((application) => (
                <tr key={application.id}>
                  <td><strong>{application.displayName}</strong><small>{application.id.slice(0, 8)} · {application.kind === "company" ? "Empresa" : "Técnico"}</small></td>
                  <td>{application.categories[0] === "industrial" ? "Industrial" : application.categories[0] === "commercial" ? "Comercial" : "Residencial"}</td>
                  <td>{application.communeCodes[0] ?? "Sin comuna"}<small>{application.regionCode ? regionNameFromCode(application.regionCode) : "Sin región"}</small></td>
                  <td>{application.yearsExperience} años</td>
                  <td><AdminStatus tone={profileStatusTone(application.status)}>{profileStatusLabels[application.status]}</AdminStatus></td>
                  <td>{formatUpdated(application.updatedAt)}</td>
                  <td><Link className="admin-table-link" href={`/admin/postulaciones/${application.id}`}>Revisar</Link></td>
                </tr>
              ))}
              {!result.data.length && !result.error ? <tr><td colSpan={7}><div className="admin-empty-state"><strong>No hay postulaciones todavía</strong><p>Los registros enviados desde la página pública aparecerán aquí automáticamente.</p></div></td></tr> : null}
            </tbody>
          </table>
        </AdminTableCard>
      </section>
    );
  }

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
