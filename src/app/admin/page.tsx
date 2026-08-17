import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, FileSearch, Images, MessageSquareWarning, UserRoundCheck } from "lucide-react";
import { AdminDemoNotice, AdminOperationalNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { adminApplications, statusTone } from "@/data/admin-demo";
import { regionNameFromCode } from "@/domain/professional-registration";
import { listProfessionalApplications, profileStatusLabels, profileStatusTone } from "@/lib/admin/professional-applications";
import { listAdminReviews } from "@/lib/admin/reviews";
import { listDemoReviews } from "@/lib/contact-requests/demo-store";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Administración demo" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (isSupabaseAuthMode()) {
    const [result, reviewsResult] = await Promise.all([
      listProfessionalApplications(10),
      listAdminReviews(100),
    ]);
    const pending = result.data.filter((item) => ["submitted", "under_review"].includes(item.status)).length;
    const published = result.data.filter((item) => ["approved", "verified"].includes(item.status)).length;
    const changes = result.data.filter((item) => item.status === "changes_requested").length;
    const rejected = result.data.filter((item) => item.status === "rejected").length;

    return (
      <section className="admin-page">
        <AdminPageHeading eyebrow="Operación real" title="Resumen de moderación" description="Estado actual del registro y revisión de profesionales en Red Técnicos Chile." />
        <AdminOperationalNotice>Las postulaciones y evaluaciones de este resumen provienen de Supabase. Cada decisión administrativa exige un motivo y queda auditada.</AdminOperationalNotice>
        {result.error || reviewsResult.error ? <p className="auth-message" role="alert">{result.error ?? reviewsResult.error}</p> : null}
        <div className="metric-grid admin-metrics">
          <article><span className="metric-icon"><ClipboardList aria-hidden="true" size={20} /></span><span>Por revisar</span><strong>{pending}</strong><small>Enviadas o en revisión</small></article>
          <article><span className="metric-icon"><UserRoundCheck aria-hidden="true" size={20} /></span><span>Perfiles publicados</span><strong>{published}</strong><small>Con proyección pública</small></article>
          <article><span className="metric-icon"><FileSearch aria-hidden="true" size={20} /></span><span>Cambios solicitados</span><strong>{changes}</strong><small>Esperando al profesional</small></article>
          <article><span className="metric-icon"><MessageSquareWarning aria-hidden="true" size={20} /></span><span>Rechazadas</span><strong>{rejected}</strong><small>Con motivo auditado</small></article>
          <article><span className="metric-icon"><MessageSquareWarning aria-hidden="true" size={20} /></span><span>Evaluaciones pendientes</span><strong>{reviewsResult.data.filter((review) => review.status === "pending").length}</strong><small><Link href="/admin/evaluaciones">Abrir moderación</Link></small></article>
        </div>
        <AdminTableCard title="Postulaciones recientes" description="Registros reales ordenados por su última actualización." action={<Link className="button button-secondary" href="/admin/postulaciones">Ver todas</Link>}>
          <table className="admin-table">
            <thead><tr><th>Perfil</th><th>Tipo</th><th>Región</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {result.data.slice(0, 5).map((application) => (
                <tr key={application.id}>
                  <td><strong>{application.displayName}</strong><small>{application.id.slice(0, 8)}</small></td>
                  <td>{application.kind === "company" ? "Empresa" : "Técnico"}</td>
                  <td>{application.regionCode ? regionNameFromCode(application.regionCode) : "Sin región"}</td>
                  <td><AdminStatus tone={profileStatusTone(application.status)}>{profileStatusLabels[application.status]}</AdminStatus></td>
                  <td><Link className="admin-table-link" href={`/admin/postulaciones/${application.id}`}>Revisar</Link></td>
                </tr>
              ))}
              {!result.data.length && !result.error ? <tr><td colSpan={5}><div className="admin-empty-state"><strong>Sin postulaciones</strong><p>Los nuevos registros aparecerán aquí.</p></div></td></tr> : null}
            </tbody>
          </table>
        </AdminTableCard>
      </section>
    );
  }

  const capturedReviews = listDemoReviews();

  return (
    <section className="admin-page">
      <AdminPageHeading title="Resumen de moderación" description="Una vista central de la operación ficticia de Red Técnicos Chile." />
      <AdminDemoNotice />
      <div className="metric-grid admin-metrics">
        <article><span className="metric-icon"><ClipboardList aria-hidden="true" size={20} /></span><span>Postulaciones pendientes</span><strong>12</strong><small>4 nuevas esta semana</small></article>
        <article><span className="metric-icon"><UserRoundCheck aria-hidden="true" size={20} /></span><span>Perfiles publicados</span><strong>48</strong><small>Indicador ficticio</small></article>
        <article><span className="metric-icon"><FileSearch aria-hidden="true" size={20} /></span><span>Documentos por revisar</span><strong>19</strong><small>Solo metadatos demo</small></article>
        <article><span className="metric-icon"><Images aria-hidden="true" size={20} /></span><span>Galerías por revisar</span><strong>7</strong><small>Fotografías ficticias</small></article>
        <article><span className="metric-icon"><MessageSquareWarning aria-hidden="true" size={20} /></span><span>Evaluaciones pendientes</span><strong>{3 + capturedReviews.length}</strong><small>{capturedReviews.length} recibidas en esta ejecución</small></article>
        <article><span className="metric-icon"><MessageSquareWarning aria-hidden="true" size={20} /></span><span>Reclamos abiertos</span><strong>2</strong><small>Indicador ficticio</small></article>
      </div>
      <AdminTableCard
        title="Postulaciones recientes"
        description="Cola ficticia para probar el flujo de revisión."
        action={<Link className="button button-secondary" href="/admin/postulaciones">Ver todas</Link>}
      >
        <table className="admin-table">
          <thead><tr><th>Perfil</th><th>Tipo</th><th>Región</th><th>Estado</th><th>Actualización</th><th>Acción</th></tr></thead>
          <tbody>
            {adminApplications.slice(0, 4).map((application) => (
              <tr key={application.id}>
                <td><strong>{application.name}</strong><small>{application.id} · Perfil ficticio</small></td>
                <td>{application.kind}</td>
                <td>{application.region}</td>
                <td><AdminStatus tone={statusTone(application.status)}>{application.status}</AdminStatus></td>
                <td>{application.updated}</td>
                <td><Link className="admin-table-link" href={`/admin/postulaciones/${application.id}`}>Revisar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableCard>
    </section>
  );
}
