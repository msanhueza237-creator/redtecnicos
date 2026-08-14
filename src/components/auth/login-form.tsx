"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import {
  initialAuthActionState,
  loginAction,
} from "@/app/ingresar/actions";

export function LoginForm({ nextPath }: Readonly<{ nextPath?: string }>) {
  const [state, action, pending] = useActionState(loginAction, initialAuthActionState);

  return (
    <form action={action} className="auth-form">
      {nextPath && <input name="next" type="hidden" value={nextPath} />}
      {state.message && (
        <p className="auth-message" data-status={state.status} role="status">
          {state.message}
        </p>
      )}
      <div className="field">
        <label htmlFor="login-email">Correo electrónico</label>
        <input
          autoComplete="email"
          className="input"
          id="login-email"
          name="email"
          required
          type="email"
        />
        {state.fieldErrors?.email?.map((error) => <small key={error}>{error}</small>)}
      </div>
      <div className="field">
        <label htmlFor="login-password">Contraseña</label>
        <input
          autoComplete="current-password"
          className="input"
          id="login-password"
          name="password"
          required
          type="password"
        />
        {state.fieldErrors?.password?.map((error) => <small key={error}>{error}</small>)}
      </div>
      <button className="button button-primary" disabled={pending} type="submit">
        <LogIn aria-hidden="true" size={17} />
        {pending ? "Verificando…" : "Ingresar de forma segura"}
      </button>
    </form>
  );
}
