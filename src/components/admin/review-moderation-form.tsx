"use client";

import { useActionState } from "react";
import { moderateReviewAction } from "@/app/admin/evaluaciones/actions";
import { availableReviewDecisions, type ReviewStatus } from "@/domain/review-moderation";
import { initialAdminActionState } from "@/lib/admin/action-state";

const decisionLabels = {
  publish: "Publicar",
  reject: "Rechazar",
  hide: "Ocultar",
} as const;

export function ReviewModerationForm({ reviewId, status }: Readonly<{ reviewId: string; status: ReviewStatus }>) {
  const boundAction = moderateReviewAction.bind(null, reviewId);
  const [state, action, pending] = useActionState(boundAction, initialAdminActionState);
  const decisions = availableReviewDecisions(status);

  return (
    <form action={action} className="admin-decision admin-review-decision">
      <label>
        <span>Motivo de la decisión</span>
        <textarea
          maxLength={1000}
          minLength={8}
          name="reason"
          placeholder={status === "published" ? "Ej.: se ocultó mientras revisamos un reclamo." : "Ej.: solicitud y comentario revisados; cumple las reglas."}
          required
          rows={3}
        />
        <small>Quedará guardado con el administrador y la fecha.</small>
      </label>
      <div className="admin-actions">
        {decisions.map((decision, index) => (
          <button
            className={`button button-${index === 0 ? "primary" : "secondary"}`}
            disabled={pending}
            key={decision}
            name="decision"
            type="submit"
            value={decision}
          >
            {pending ? "Guardando…" : decisionLabels[decision]}
          </button>
        ))}
      </div>
      {state.message ? <p className="admin-action-feedback" data-status={state.status} role="status">{state.message}</p> : null}
    </form>
  );
}
