"use client";

import { useActionState } from "react";
import { moderateGalleryItemAction } from "@/app/admin/galerias/actions";
import type { GalleryModerationState } from "@/domain/professional-gallery";
import { initialAdminActionState } from "@/lib/admin/action-state";

const decisionsByStatus: Record<GalleryModerationState, Array<"approve" | "request_changes" | "hide">> = {
  declared: ["approve", "request_changes", "hide"],
  pending_review: ["approve", "request_changes", "hide"],
  reviewed: ["request_changes", "hide"],
  changes_requested: ["approve", "hide"],
  rejected: [],
  hidden: [],
};

const decisionLabels = {
  approve: "Aprobar imagen",
  request_changes: "Solicitar cambios",
  hide: "Ocultar imagen",
} as const;

export function GalleryModerationForm({ itemId, status }: Readonly<{ itemId: string; status: GalleryModerationState }>) {
  const boundAction = moderateGalleryItemAction.bind(null, itemId);
  const [state, action, pending] = useActionState(boundAction, initialAdminActionState);
  const decisions = decisionsByStatus[status];

  if (!decisions.length) {
    return <p className="admin-action-feedback">Esta fotografía no admite nuevas decisiones desde su estado actual.</p>;
  }

  return (
    <form action={action} className="admin-decision">
      <label>
        <span>Motivo de la decisión</span>
        <textarea maxLength={1000} minLength={8} name="reason" placeholder="Ej.: trabajo claramente visible y coherente con el servicio declarado." required rows={3} />
        <small>Obligatorio. Se registrará con el administrador y la fecha.</small>
      </label>
      <div className="admin-actions">
        {decisions.map((decision, index) => (
          <button className={`button button-${index === 0 ? "primary" : "secondary"}`} disabled={pending} key={decision} name="decision" type="submit" value={decision}>
            {pending ? "Guardando…" : decisionLabels[decision]}
          </button>
        ))}
      </div>
      {state.message ? <p className="admin-action-feedback" data-status={state.status} role="status">{state.message}</p> : null}
    </form>
  );
}
