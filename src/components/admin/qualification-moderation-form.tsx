"use client";

import { useActionState } from "react";
import { moderateQualificationAction } from "@/app/admin/documentos/actions";
import type { QualificationModerationState } from "@/domain/professional-qualification";
import { initialAdminActionState } from "@/lib/admin/action-state";

const decisionsByStatus: Record<QualificationModerationState, Array<"approve" | "request_changes" | "reject">> = {
  declared: ["request_changes", "reject"],
  pending_review: ["approve", "request_changes", "reject"],
  reviewed: ["request_changes", "reject"],
  changes_requested: ["approve", "reject"],
  rejected: [],
  hidden: [],
};

const decisionLabels = {
  approve: "Aprobar antecedente",
  request_changes: "Solicitar cambios",
  reject: "Rechazar",
} as const;

export function QualificationModerationForm({
  qualificationId,
  status,
  securityValidated,
}: Readonly<{ qualificationId: string; status: QualificationModerationState; securityValidated: boolean }>) {
  const boundAction = moderateQualificationAction.bind(null, qualificationId);
  const [state, action, pending] = useActionState(boundAction, initialAdminActionState);
  const decisions = decisionsByStatus[status].filter((decision) => decision !== "approve" || securityValidated);

  if (!decisions.length) {
    return <p className="admin-action-feedback">Este antecedente no admite nuevas decisiones desde su estado actual.</p>;
  }

  return (
    <form action={action} className="admin-decision">
      <label>
        <span>Motivo de la decisión</span>
        <textarea maxLength={1000} minLength={8} name="reason" placeholder="Ej.: el nombre, la institución y el documento coinciden claramente." required rows={3} />
        <small>Obligatorio. Se enviará al profesional y quedará registrado en auditoría.</small>
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
