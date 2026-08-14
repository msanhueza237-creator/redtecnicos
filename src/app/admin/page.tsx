import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, FileSearch, Images, MessageSquareWarning, UserRoundCheck } from "lucide-react";
import { AdminDemoNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { adminApplications, statusTone } from "@/data/admin-demo";
import { listDemoReviews } from "@/lib/contact-requests/demo-store";

export const metadata: Metadata = { title: "Administración demo" };
export const dynamic = "force-dynamic";

export default function AdminPage() {
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
