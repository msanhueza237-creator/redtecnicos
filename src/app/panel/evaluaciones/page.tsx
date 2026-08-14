import type { Metadata } from "next";
import { Star } from "lucide-react";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { listDemoReviews } from "@/lib/contact-requests/demo-store";

export const metadata: Metadata = { title: "Evaluaciones | Panel profesional demo" };
export const dynamic = "force-dynamic";

const reviewStatusLabels = { pending: "Pendiente", published: "Publicada", rejected: "Rechazada", hidden: "Oculta" } as const;

export default function ProfessionalReviewsPage() {
  const { reviews, summary } = demoProfessionalPanel;
  const capturedReviews = listDemoReviews().filter(
    (review) => review.professionalId === demoProfessionalPanel.professional.id,
  );
  return (
    <>
      <ProfessionalPanelHeader
        title="Evaluaciones"
        description="Revisa opiniones vinculadas a solicitudes completadas y su estado de moderación."
      />
      <PanelDemoNotice />
      <div className="professional-panel-metrics">
        <article className="professional-panel-metric"><Star aria-hidden="true" size={20} /><span>Promedio publicado</span><strong>{summary.averageRating}/5</strong><small>Datos ficticios</small></article>
        <article className="professional-panel-metric"><Star aria-hidden="true" size={20} /><span>Publicadas</span><strong>{summary.publishedReviews}</strong><small>Con solicitud elegible</small></article>
        <article className="professional-panel-metric"><Star aria-hidden="true" size={20} /><span>Pendientes</span><strong>{reviews.filter((review) => review.status === "pending").length + capturedReviews.length}</strong><small>En moderación demo</small></article>
      </div>
      {capturedReviews.length > 0 ? (
        <section className="professional-panel-card" aria-labelledby="captured-reviews-title">
          <div className="professional-panel-card-header"><div><h2 id="captured-reviews-title">Recibidas en esta ejecución</h2><p>Evaluaciones vinculadas a solicitudes reales de esta demo local.</p></div></div>
          <div className="professional-panel-list">
            {capturedReviews.map((review) => (
              <article key={review.id}>
                <div>
                  <span className="professional-panel-list-meta">{review.requestId} · {review.customerDisplayName}</span>
                  <h3>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} · {review.rating}/5</h3>
                  <p>{review.comment}</p>
                </div>
                <span className="professional-panel-status is-pending">Pendiente</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="professional-panel-card" aria-labelledby="reviews-title">
        <div className="professional-panel-card-header"><div><h2 id="reviews-title">Historial de evaluaciones</h2><p>Una evaluación ficticia por solicitud.</p></div></div>
        <div className="professional-panel-list">
          {reviews.map((review) => (
            <article key={review.id}>
              <div>
                <span className="professional-panel-list-meta">{review.requestId} · {review.customerDisplayName}</span>
                <h3>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} · {review.rating}/5</h3>
                <p>{review.comment}</p>
                {review.professionalReply && <p><strong>Tu respuesta:</strong> {review.professionalReply}</p>}
              </div>
              <span className={`professional-panel-status ${review.status === "published" ? "is-approved" : "is-pending"}`}>
                {reviewStatusLabels[review.status]}
              </span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
