import type { Metadata } from "next";
import { Star } from "lucide-react";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { ProfessionalReviewReply } from "@/components/professional-panel/professional-review-reply";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { listDemoReviews } from "@/lib/contact-requests/demo-store";
import { listOwnedProfessionalReviews } from "@/lib/professional/reviews";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Evaluaciones | Panel profesional" };
export const dynamic = "force-dynamic";

const reviewStatusLabels = { pending: "Pendiente", published: "Publicada", rejected: "Rechazada", hidden: "Oculta" } as const;

export default async function ProfessionalReviewsPage() {
  if (isSupabaseAuthMode()) {
    const result = await listOwnedProfessionalReviews();
    const published = result.data.filter((review) => review.status === "published");
    const average = published.length ? published.reduce((total, review) => total + review.rating, 0) / published.length : 0;
    return (
      <>
        <ProfessionalPanelHeader title="Evaluaciones" description="Revisa opiniones verificadas y responde una vez de forma pública y profesional." />
        <div className="professional-panel-metrics">
          <article className="professional-panel-metric"><Star aria-hidden="true" size={20} /><span>Promedio publicado</span><strong>{average.toFixed(1)}/5</strong><small>{published.length} evaluaciones</small></article>
          <article className="professional-panel-metric"><Star aria-hidden="true" size={20} /><span>Publicadas</span><strong>{published.length}</strong><small>Visibles en tu ficha</small></article>
          <article className="professional-panel-metric"><Star aria-hidden="true" size={20} /><span>Pendientes</span><strong>{result.data.filter((review) => review.status === "pending").length}</strong><small>En moderación</small></article>
        </div>
        {result.error ? <div className="professional-panel-notice is-danger" role="alert"><p>{result.error}</p></div> : null}
        <section className="professional-panel-card" aria-labelledby="reviews-title">
          <div className="professional-panel-card-header"><div><h2 id="reviews-title">Historial de evaluaciones</h2><p>Solo se originan en solicitudes completadas y correos verificados.</p></div></div>
          {result.data.length ? <div className="professional-panel-list">{result.data.map((review) => (
            <article key={review.id}>
              <div>
                <span className="professional-panel-list-meta">{review.service} · {review.commune} · {review.customerName}</span>
                <h3>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} · {review.rating}/5</h3>
                <p>{review.comment}</p>
                <small>{review.wouldRecommend ? "El cliente lo recomienda" : "El cliente indicó que no lo recomendaría"}</small>
                {review.professionalReply ? <p><strong>Tu respuesta pública:</strong> {review.professionalReply}</p> : review.status === "published" ? <ProfessionalReviewReply reviewId={review.id} /> : null}
              </div>
              <span className={`professional-panel-status ${review.status === "published" ? "is-approved" : review.status === "pending" ? "is-pending" : "is-danger"}`}>{reviewStatusLabels[review.status]}</span>
            </article>
          ))}</div> : <div className="professional-panel-empty"><h2>Aún no tienes evaluaciones</h2><p>Aparecerán aquí después de que un cliente complete y evalúe una solicitud.</p></div>}
        </section>
      </>
    );
  }

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
