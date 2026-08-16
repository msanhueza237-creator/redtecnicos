"use client";

import { useActionState } from "react";
import { testSmtpAction, type SmtpTestState } from "@/app/admin/configuracion/actions";

const initialState: SmtpTestState = { status: "idle", message: "" };

export function SmtpTestForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(testSmtpAction, initialState);

  return (
    <form action={action}>
      <button className="button button-primary" disabled={!configured || pending} type="submit">
        {pending ? "Validando…" : "Validar conexión y enviar prueba"}
      </button>
      {!configured ? <p className="admin-form-error">Faltan variables SMTP en la aplicación.</p> : null}
      {state.message ? <p className={state.status === "success" ? "admin-form-success" : "admin-form-error"} role="status">{state.message}</p> : null}
    </form>
  );
}
