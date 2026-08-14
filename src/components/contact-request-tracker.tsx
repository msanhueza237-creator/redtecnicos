"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { ContactRequestTracking } from "@/domain/contact-request";

interface ApiResponse<T> {
  data: T | null;
  error: { message?: string } | null;
}

const statusLabels: Record<ContactRequestTracking["status"], string> = {
  new: "Solicitud registrada",
  viewed: "Solicitud revisada",
  contacted: "Contacto iniciado",
  accepted: "Trabajo coordinado",
  rejected: "Solicitud rechazada",
  completed: "Trabajo completado",
  cancelled: "Solicitud cancelada",
  expired: "Solicitud expirada",
};

function getErrorMessage<T>(payload: ApiResponse<T> | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

export function ContactRequestTracker({ trackingToken }: Readonly<{ trackingToken: string }>) {
  const [request, setRequest] = useState<ContactRequestTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionConfirmed, setCompletionConfirmed] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRequest() {
      try {
        const response = await fetch(`/api/v1/contact-requests/${encodeURIComponent(trackingToken)}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as ApiResponse<ContactRequestTracking> | null;
        if (!active) return;
        if (!response.ok || !payload?.data) {
          setError(getErrorMessage(payload, "No pudimos abrir este seguimiento."));
          return;
        }
        setRequest(payload.data);
      } catch {
        if (active) setError("No pudimos conectar con el seguimiento. Intenta nuevamente.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadRequest();
    return () => {
      active = false;
    };
  }, [trackingToken]);

  async function confirmCompletion() {
    if (!completionConfirmed) return;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/contact-requests/${encodeURIComponent(trackingToken)}/complete`,
        { method: "POST" },
      );
      const payload = (await response.json().catch(() => null)) as ApiResponse<ContactRequestTracking> | null;
      if (!response.ok || !payload?.data) {
        setError(getErrorMessage(payload, "No pudimos confirmar el trabajo."));
        return;
      }
      setRequest(payload.data);
    } catch {
      setError("No pudimos conectar con el seguimiento. Intenta nuevamente.");
    } finally {
      setWorking(false);
    }
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingToken,
          rating,
          comment,
          wouldRecommend: form.get("wouldRecommend") === "yes",
          customerDeclaration: form.get("customerDeclaration") === "on",
        }),
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse<NonNullable<ContactRequestTracking["review"]>> | null;
      if (!response.ok || !payload?.data) {
        setError(getErrorMessage(payload, "No pudimos registrar la evaluación."));
        return;
      }
      setRequest((current) => current ? { ...current, review: payload.data } : current);
    } catch {
      setError("No pudimos conectar con el servicio. Intenta nuevamente.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="tracking-loading" role="status">
        <LoaderCircle className="tracking-spinner" aria-hidden="true" size={28} />
        <strong>Abriendo seguimiento privado…</strong>
      </div>
    );
  }

  if (!request) {
    return (
      <section className="tracking-error" aria-labelledby="tracking-error-title">
        <LockKeyhole aria-hidden="true" size={34} />
        <h1 id="tracking-error-title">No pudimos abrir esta solicitud</h1>
        <p>{error ?? "El enlace no es válido o ya no está disponible."}</p>
        <Link className="button button-primary" href="/tecnicos">Volver al directorio</Link>
      </section>
    );
  }

  const isIneligible = ["rejected", "cancelled", "expired"].includes(request.status);

  return (
    <div className="tracking-layout">
      <header className="tracking-heading">
        <span className="eyebrow">Seguimiento privado · Demo local</span>
        <h1>Tu solicitud a {request.professional.displayName}</h1>
        <p>Desde aquí puedes confirmar el trabajo y dejar una evaluación vinculada a esta atención.</p>
      </header>

      <ol className="tracking-steps" aria-label="Avance de la solicitud">
        <li className="is-complete">
          <span><CheckCircle2 aria-hidden="true" size={18} /></span>
          <div><strong>Contacto solicitado</strong><small>{request.requestId}</small></div>
        </li>
        <li className={request.status === "completed" ? "is-complete" : ""}>
          <span><ClipboardCheck aria-hidden="true" size={18} /></span>
          <div><strong>Trabajo realizado</strong><small>{request.status === "completed" ? "Confirmado" : "Por confirmar"}</small></div>
        </li>
        <li className={request.review ? "is-complete" : ""}>
          <span><MessageSquareText aria-hidden="true" size={18} /></span>
          <div><strong>Evaluación</strong><small>{request.review ? "Enviada" : "Pendiente"}</small></div>
        </li>
      </ol>

      <div className="tracking-content">
        <aside className="tracking-summary" aria-labelledby="tracking-summary-title">
          <div className="tracking-summary-header">
            <div>
              <span>Solicitud</span>
              <h2 id="tracking-summary-title">{request.requestId}</h2>
            </div>
            <span className="tracking-status">{statusLabels[request.status]}</span>
          </div>
          <dl>
            <div><dt>Profesional</dt><dd>{request.professional.displayName}</dd></div>
            <div><dt>Servicio</dt><dd>{request.service}</dd></div>
            <div><dt>Comuna</dt><dd>{request.commune}</dd></div>
            <div><dt>Solicitante</dt><dd>{request.customerName}</dd></div>
            <div><dt>Necesidad informada</dt><dd>{request.description}</dd></div>
          </dl>
          <div className="tracking-private-note">
            <ShieldCheck aria-hidden="true" size={18} />
            <p>Este enlace es privado. No lo compartas: permite gestionar y evaluar esta solicitud sin crear una cuenta.</p>
          </div>
        </aside>

        <section className="tracking-action-card" aria-label="Acciones de seguimiento y evaluación">
          {request.review ? (
            <div className="review-thanks" role="status">
              <span className="review-thanks-icon"><BadgeCheck aria-hidden="true" size={30} /></span>
              <span className="eyebrow">Evaluación recibida</span>
              <h2>Gracias por compartir tu experiencia</h2>
              <div className="review-stars-static" aria-label={`${request.review.rating} de 5 estrellas`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} aria-hidden="true" fill={index < request.review!.rating ? "currentColor" : "none"} size={25} />
                ))}
              </div>
              <blockquote>“{request.review.comment}”</blockquote>
              <p><strong>Estado:</strong> pendiente de moderación. No se publicará automáticamente.</p>
              <p className="review-id">Evaluación {request.review.id}</p>
            </div>
          ) : request.status === "completed" ? (
            <form className="review-form" onSubmit={submitReview} aria-busy={working}>
              <span className="eyebrow">Una evaluación por solicitud</span>
              <h2>¿Cómo fue el trabajo?</h2>
              <p>Tu opinión ayuda a otros clientes a comparar técnicos y empresas con más contexto.</p>

              <fieldset className="star-rating">
                <legend>Calidad general del servicio</legend>
                <div>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} title={`${value} de 5 estrellas`}>
                      <input
                        checked={rating === value}
                        name="rating"
                        onChange={() => setRating(value)}
                        required
                        type="radio"
                        value={value}
                      />
                      <Star aria-hidden="true" fill={value <= rating ? "currentColor" : "none"} size={31} />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
                <small>{rating > 0 ? `${rating} de 5 estrellas seleccionadas` : "Selecciona entre 1 y 5 estrellas"}</small>
              </fieldset>

              <fieldset className="recommend-choice">
                <legend>¿Recomendarías a {request.professional.displayName}?</legend>
                <label><input name="wouldRecommend" required type="radio" value="yes" /> Sí, lo recomendaría</label>
                <label><input name="wouldRecommend" required type="radio" value="no" /> No lo recomendaría</label>
              </fieldset>

              <div className="field">
                <label htmlFor="review-comment">Comentario sobre el trabajo</label>
                <textarea
                  className="textarea"
                  id="review-comment"
                  maxLength={600}
                  minLength={10}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Cuéntanos sobre la calidad, puntualidad, comunicación y orden."
                  required
                  value={comment}
                />
                <span className="field-help">{comment.length}/600 · No publiques datos personales, direcciones ni información de pago.</span>
              </div>

              <label className="checkbox-row consent-row">
                <input name="customerDeclaration" required type="checkbox" />
                <span>Confirmo que esta evaluación corresponde al trabajo de esta solicitud y que mi comentario es honesto.</span>
              </label>

              {error ? <div className="contact-error" role="alert">{error}</div> : null}
              <button className="button button-primary" disabled={working || rating === 0} type="submit">
                <MessageSquareText aria-hidden="true" size={17} />
                {working ? "Enviando evaluación…" : "Enviar evaluación"}
              </button>
              <p className="review-moderation-note">La evaluación quedará pendiente de moderación antes de mostrarse públicamente.</p>
            </form>
          ) : isIneligible ? (
            <div className="tracking-ineligible">
              <LockKeyhole aria-hidden="true" size={30} />
              <h2>Esta solicitud no admite evaluaciones</h2>
              <p>Su estado actual es “{statusLabels[request.status]}”. Solo se puede evaluar un trabajo confirmado como realizado.</p>
            </div>
          ) : (
            <div className="complete-work-card">
              <span className="eyebrow">Paso previo</span>
              <h2>Confirma que el trabajo fue realizado</h2>
              <p>Hazlo solo si seleccionaste a este técnico o empresa y el servicio ya terminó. Después se habilitará la evaluación.</p>
              <label className="checkbox-row completion-check">
                <input
                  checked={completionConfirmed}
                  onChange={(event) => setCompletionConfirmed(event.target.checked)}
                  type="checkbox"
                />
                <span>Confirmo que {request.professional.displayName} realizó el trabajo asociado a esta solicitud.</span>
              </label>
              {error ? <div className="contact-error" role="alert">{error}</div> : null}
              <button
                className="button button-primary"
                disabled={!completionConfirmed || working}
                onClick={confirmCompletion}
                type="button"
              >
                <ClipboardCheck aria-hidden="true" size={17} />
                {working ? "Confirmando…" : "Confirmar trabajo y calificar"}
              </button>
              <p className="review-moderation-note">En producción también se notificará al profesional y quedará registro de la confirmación.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
