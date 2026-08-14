import type { Metadata } from "next";
import { Star } from "lucide-react";
import { AdminDemoNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { adminReviews, statusTone } from "@/data/admin-demo";
import { listDemoReviews } from "@/lib/contact-requests/demo-store";

export const metadata: Metadata = { title: "Evaluaciones | Administración demo" };
export const dynamic = "force-dynamic";

const submittedAtFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function ReviewsPage() {
  const capturedReviews = listDemoReviews();

  return (
    <section className="admin-page">
      <AdminPageHeading title="Evaluaciones" description="Modera comentarios ficticios asociados a solicitudes completadas y correos verificados." />
      <AdminDemoNotice>Las evaluaciones capturadas quedan pendientes y no se publican automáticamente. El token privado vincula cada opinión con una solicitud y el backend impide más de una evaluación por atención.</AdminDemoNotice>

      <AdminTableCard
        title="Recibidas en esta ejecución"
        description={`${capturedReviews.length} ${capturedReviews.length === 1 ? "evaluación vinculada" : "evaluaciones vinculadas"} a solicitudes creadas desde el sitio`}
      >
        {capturedReviews.length > 0 ? (
          <table className="admin-table">
            <thead><tr><th>Evaluación</th><th>Cliente / solicitud</th><th>Profesional</th><th>Nota</th><th>Comentario</th><th>Estado</th><th>Fecha</th><th>Acción demo</th></tr></thead>
            <tbody>
              {capturedReviews.map((review) => (
                <tr key={review.id}>
                  <td><strong>{review.id}</strong><small>{review.wouldRecommend ? "Sí recomienda" : "No recomienda"}</small></td>
                  <td><strong>{review.customerDisplayName}</strong><small>{review.customerEmail}</small><small>{review.requestId}</small></td>
                  <td>{review.professionalDisplayName}</td>
                  <td><span className="rating"><Star aria-hidden="true" fill="currentColor" size={14} /> {review.rating}/5</span></td>
                  <td>{review.comment}</td>
                  <td><AdminStatus tone="info">Pendiente</AdminStatus></td>
                  <td>{submittedAtFormatter.format(new Date(review.submittedAt))}</td>
                  <td><DemoAction label="Moderar" confirmation={`Se abrió la moderación demo de ${review.id}. La evaluación continúa pendiente y no se publicó.`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty-state">
            <strong>Aún no hay evaluaciones capturadas</strong>
            <p>Completa una solicitud, abre su seguimiento privado, confirma el trabajo y envía una calificación para verla aquí.</p>
          </div>
        )}
      </AdminTableCard>

      <AdminTableCard title="Historial base de demostración" description="Fixtures estáticos para validar otros estados de moderación">
        <table className="admin-table"><thead><tr><th>Evaluación</th><th>Profesional</th><th>Nota</th><th>Extracto</th><th>Estado</th><th>Fecha</th><th>Acción demo</th></tr></thead>
          <tbody>{adminReviews.map((review) => <tr key={review.id}><td><strong>{review.id}</strong></td><td>{review.professional}</td><td><span className="rating"><Star aria-hidden="true" fill="currentColor" size={14} /> {review.rating}/5</span></td><td>{review.excerpt}</td><td><AdminStatus tone={statusTone(review.status)}>{review.status}</AdminStatus></td><td>{review.created}</td><td><DemoAction label="Moderar" /></td></tr>)}</tbody>
        </table>
      </AdminTableCard>
    </section>
  );
}
