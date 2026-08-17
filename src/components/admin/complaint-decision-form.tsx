"use client";

import { useActionState, useState } from "react";
import { updateComplaintAction } from "@/app/admin/reclamos/actions";
import {
  complaintPriorities,
  complaintPriorityLabels,
  complaintStatuses,
  complaintStatusLabels,
  type ComplaintPriority,
  type ComplaintStatus,
} from "@/domain/complaint";
import { initialAdminActionState } from "@/lib/admin/action-state";

export function ComplaintDecisionForm({
  complaintId,
  currentPriority,
  currentStatus,
}: Readonly<{
  complaintId: string;
  currentPriority: ComplaintPriority;
  currentStatus: ComplaintStatus;
}>) {
  const boundAction = updateComplaintAction.bind(null, complaintId);
  const [state, action, pending] = useActionState(boundAction, initialAdminActionState);
  const [status, setStatus] = useState<ComplaintStatus>(currentStatus);
  const closesCase = status === "resolved" || status === "dismissed";

  return (
    <form action={action} className="admin-decision admin-complaint-decision">
      <div className="admin-complaint-decision-grid">
        <label>
          <span>Estado</span>
          <select name="status" onChange={(event) => setStatus(event.target.value as ComplaintStatus)} value={status}>
            {complaintStatuses.map((value) => <option key={value} value={value}>{complaintStatusLabels[value]}</option>)}
          </select>
        </label>
        <label>
          <span>Prioridad</span>
          <select defaultValue={currentPriority} name="priority">
            {complaintPriorities.map((value) => <option key={value} value={value}>{complaintPriorityLabels[value]}</option>)}
          </select>
        </label>
      </div>
      <label>
        <span>Motivo de la actualización</span>
        <textarea maxLength={1000} minLength={8} name="reason" placeholder="Describe qué se revisó y por qué cambia el estado o prioridad." required rows={4} />
        <small>Obligatorio. Se registra con tu usuario y fecha en Auditoría.</small>
      </label>
      <label>
        <span>Resumen de resolución {closesCase ? "(obligatorio)" : "(opcional hasta cerrar)"}</span>
        <textarea maxLength={1500} minLength={closesCase ? 10 : undefined} name="resolutionSummary" required={closesCase} rows={4} />
      </label>
      <div className="admin-actions"><button className="button button-primary" disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar actualización"}</button></div>
      {state.message ? <p className="admin-action-feedback" data-status={state.status} role="status">{state.message}</p> : null}
    </form>
  );
}
