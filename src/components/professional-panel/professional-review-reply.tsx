"use client";

import { useActionState } from "react";
import { MessageSquareReply } from "lucide-react";
import { replyToProfessionalReviewAction } from "@/app/panel/evaluaciones/actions";
import { initialProfessionalPanelActionState } from "@/domain/professional-profile";

export function ProfessionalReviewReply({ reviewId }: Readonly<{ reviewId: string }>) {
  const [state, action, pending] = useActionState(replyToProfessionalReviewAction, initialProfessionalPanelActionState);
  return (
    <form action={action} className="professional-panel-form">
      <input name="reviewId" type="hidden" value={reviewId} />
      <label className="professional-panel-field"><span>Responder públicamente</span><textarea maxLength={800} minLength={2} name="reply" placeholder="Agradece o aclara el contexto con respeto. La respuesta no podrá editarse." required rows={3} /></label>
      <button className="button button-secondary" disabled={pending} type="submit"><MessageSquareReply aria-hidden="true" size={16} />{pending ? "Publicando…" : "Publicar una respuesta"}</button>
      {state.message ? <div className={`professional-panel-notice ${state.status === "success" ? "is-success" : "is-danger"}`} role={state.status === "error" ? "alert" : "status"}><p>{state.message}</p></div> : null}
    </form>
  );
}
