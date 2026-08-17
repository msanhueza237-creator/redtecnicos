import type { Metadata, Route } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, EyeOff, Star, XCircle } from "lucide-react";
import { AdminDemoNotice, AdminOperationalNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { ReviewModerationForm } from "@/components/admin/review-moderation-form";
import { adminReviews, statusTone } from "@/data/admin-demo";
import { reviewStatusLabels, reviewStatusTone } from "@/domain/review-moderation";
import { listAdminReviews } from "@/lib/admin/reviews";
import { listDemoReviews } from "@/lib/contact-requests/demo-store";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Evaluaciones | Administración" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export default async function ReviewsPage() {
  if (isSupabaseAuthMode()) {
    const result = await listAdminReviews();
    const pending = result.data.filter((review) => review.status === "pending").length;
    const published = result.data.filter((review) => review.status === "published").length;
    const hidden = result.data.filter((review) => review.status === "hidden").length;
    const rejected = result.data.filter((review) => review.status === "rejected").length;

    return (
      <section className="admin-page">
        <AdminPageHeading
          eyebrow="Operación real"
          title="Evaluaciones"
          description="Revisa opiniones ligadas a solicitudes completadas antes de incorporarlas a la calificación pública."
        />
        <AdminOperationalNotice>Esta bandeja está conectada a Supabase. Publicar u ocultar recalcula inmediatamente la nota del profesional y cada decisión queda registrada en auditoría.</AdminOperationalNotice>
        {result.error ? <p className="auth-message" role="alert">{result.error}</p> : null}

        <div className="metric-grid admin-metrics">
          <article><span className="metric-icon"><Clock3 aria-hidden="true" size={20} /></span><span>Pendientes</span><strong>{pending}</strong><small>Esperando moderación</small></article>
          <article><span className="metric-icon"><CheckCircle2 aria-hidden="true" size={20} /></span><span>Publicadas</span><strong>{published}</strong><small>Incluidas en la nota</small></article>
          <article><span className="metric-icon"><EyeOff aria-hidden="true" size={20} /></span><span>Ocultas</span><strong>{hidden}</strong><small>Retiradas del perfil</small></article>
          <article><span className="metric-icon"><XCircle aria-hidden="true" size={20} /></span><span>Rechazadas</span><strong>{rejected}</strong><small>Con motivo registrado</small></article>
        </div>

        <AdminTableCard title="Bandeja de moderación" description={`${result.data.length} evaluaciones reales registradas`}>
          <table className="admin-table admin-review-table">
            <thead><tr><th>Evaluación</th><th>Cliente y solicitud</th><th>Profesional</th><th>Opinión</th><th>Estado</th><th>Moderación</th></tr></thead>
            <tbody>
              {result.data.map((review) => {
                const profileHref = (review.professionalKind === "company"
                  ? `/empresas/${review.professionalSlug}`
                  : `/tecnicos/${review.professionalSlug}`) as Route;
                return (
                  <tr key={review.id}>
                    <td><strong>{review.id.slice(0, 8)}</strong><small>{formatDate(review.createdAt)}</small><small>{review.emailVerified ? "Correo verificado" : "Correo sin verificar"}</small></td>
                    <td><strong>{review.customerName}</strong><small>{review.customerEmail}</small><small>{review.service}</small><small>Solicitud {review.requestId} · {review.requestStatus}</small></td>
                    <td>{review.professionalSlug ? <Link className="admin-table-link" href={profileHref}>{review.professionalName}</Link> : <strong>{review.professionalName}</strong>}<small>{review.professionalKind === "company" ? "Empresa" : "Técnico"}</small></td>
                    <td className="admin-review-copy"><span className="rating"><Star aria-hidden="true" fill="currentColor" size={14} /> {review.rating}/5</span><strong>{review.wouldRecommend ? "Sí recomienda" : "No recomienda"}</strong><small>{review.comment}</small></td>
                    <td><AdminStatus tone={reviewStatusTone(review.status)}>{reviewStatusLabels[review.status]}</AdminStatus>{review.moderationReason ? <small>Motivo: {review.moderationReason}</small> : null}{review.moderatedAt ? <small>{formatDate(review.moderatedAt)}</small> : null}</td>
                    <td><ReviewModerationForm reviewId={review.id} status={review.status} /></td>
                  </tr>
                );
              })}
              {!result.data.length && !result.error ? <tr><td colSpan={6}><div className="admin-empty-state"><strong>Aún no hay evaluaciones</strong><p>Las opiniones enviadas desde el seguimiento privado aparecerán aquí automáticamente.</p></div></td></tr> : null}
            </tbody>
          </table>
        </AdminTableCard>
      </section>
    );
  }

  const capturedReviews = listDemoReviews();
  return (
    <section className="admin-page">
      <AdminPageHeading title="Evaluaciones" description="Modera comentarios ficticios asociados a solicitudes completadas y correos verificados." />
      <AdminDemoNotice>En modo local las decisiones continúan simuladas. Al activar Supabase, esta misma bandeja exige motivo, registra auditoría y actualiza la nota pública.</AdminDemoNotice>
      <AdminTableCard title="Recibidas en esta ejecución" description={`${capturedReviews.length} evaluaciones vinculadas a solicitudes demo`}>
        {capturedReviews.length ? <table className="admin-table"><thead><tr><th>Cliente y solicitud</th><th>Profesional</th><th>Nota</th><th>Comentario</th><th>Estado</th><th>Acción demo</th></tr></thead><tbody>{capturedReviews.map((review) => <tr key={review.id}><td><strong>{review.customerDisplayName}</strong><small>{review.customerEmail}</small><small>Solicitud {review.requestId}</small></td><td>{review.professionalDisplayName}</td><td><span className="rating"><Star aria-hidden="true" fill="currentColor" size={14} /> {review.rating}/5</span></td><td>{review.comment}</td><td><AdminStatus tone="info">Pendiente</AdminStatus></td><td><DemoAction label="Moderar" /></td></tr>)}</tbody></table> : <div className="admin-empty-state"><strong>Aún no hay evaluaciones capturadas</strong><p>Completa el flujo demo de solicitud y calificación para verla aquí.</p></div>}
      </AdminTableCard>
      <AdminTableCard title="Historial base de demostración" description="Fixtures estáticos para validar otros estados">
        <table className="admin-table"><thead><tr><th>Evaluación</th><th>Profesional</th><th>Nota</th><th>Extracto</th><th>Estado</th><th>Acción demo</th></tr></thead><tbody>{adminReviews.map((review) => <tr key={review.id}><td><strong>{review.id}</strong></td><td>{review.professional}</td><td><span className="rating"><Star aria-hidden="true" fill="currentColor" size={14} /> {review.rating}/5</span></td><td>{review.excerpt}</td><td><AdminStatus tone={statusTone(review.status)}>{review.status}</AdminStatus></td><td><DemoAction label="Moderar" /></td></tr>)}</tbody></table>
      </AdminTableCard>
    </section>
  );
}
