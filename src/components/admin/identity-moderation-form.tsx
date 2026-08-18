"use client";

import { useActionState } from "react";
import { moderateIdentityDocumentAction } from "@/app/admin/documentos/actions";
import type { QualificationModerationState } from "@/domain/professional-qualification";
import { initialAdminActionState } from "@/lib/admin/action-state";

const decisions: Record<QualificationModerationState, Array<"approve" | "request_changes" | "reject">> = {
  declared: ["request_changes", "reject"], pending_review: ["approve", "request_changes", "reject"], reviewed: ["request_changes", "reject"], changes_requested: ["approve", "reject"], rejected: [], hidden: [],
};
const labels = { approve: "Aprobar identidad", request_changes: "Solicitar cambios", reject: "Rechazar" } as const;

export function IdentityModerationForm({ documentId, status, securityValidated }: Readonly<{ documentId: string; status: QualificationModerationState; securityValidated: boolean }>) {
  const bound = moderateIdentityDocumentAction.bind(null, documentId);
  const [state, action, pending] = useActionState(bound, initialAdminActionState);
  const available = decisions[status].filter((decision) => decision !== "approve" || securityValidated);
  if (!available.length) return <p className="admin-action-feedback">Este documento no admite nuevas decisiones desde su estado actual.</p>;
  return <form action={action} className="admin-decision"><label><span>Motivo de la decisión</span><textarea maxLength={1000} minLength={8} name="reason" placeholder="Ej.: el nombre y el documento coinciden claramente." required rows={3} /><small>Obligatorio y registrado en auditoría.</small></label><div className="admin-actions">{available.map((decision, index) => <button className={`button button-${index === 0 ? "primary" : "secondary"}`} disabled={pending} key={decision} name="decision" type="submit" value={decision}>{pending ? "Guardando…" : labels[decision]}</button>)}</div>{state.message ? <p className="admin-action-feedback" data-status={state.status} role="status">{state.message}</p> : null}</form>;
}
