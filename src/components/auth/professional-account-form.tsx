"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import {
  initialAuthActionState,
  registerProfessionalAction,
} from "@/app/ingresar/actions";

export function ProfessionalAccountForm({
  kind,
}: Readonly<{ kind: "technician" | "company" }>) {
  const [state, action, pending] = useActionState(
    registerProfessionalAction,
    initialAuthActionState,
  );

  return (
    <div className="auth-card registration-account-card">
      <div className="auth-card-heading">
        <span className="icon-box"><ShieldCheck aria-hidden="true" size={22} /></span>
        <div>
          <span className="eyebrow">Paso 1 · Cuenta segura</span>
          <h2>Crea tu acceso profesional</h2>
          <p>La información del perfil, servicios y cobertura se completa después en el panel.</p>
        </div>
      </div>
      <form action={action} className="auth-form">
        <input name="kind" type="hidden" value={kind} />
        {state.message && (
          <p className="auth-message" data-status={state.status} role="status">
            {state.message}
          </p>
        )}
        <div className="field">
          <label htmlFor="register-name">Nombre completo</label>
          <input autoComplete="name" className="input" id="register-name" name="fullName" required />
          {state.fieldErrors?.fullName?.map((error) => <small key={error}>{error}</small>)}
        </div>
        <div className="field">
          <label htmlFor="register-email">Correo electrónico</label>
          <input autoComplete="email" className="input" id="register-email" name="email" required type="email" />
          {state.fieldErrors?.email?.map((error) => <small key={error}>{error}</small>)}
        </div>
        <div className="auth-fields-two">
          <div className="field">
            <label htmlFor="register-password">Contraseña</label>
            <input autoComplete="new-password" className="input" id="register-password" name="password" required type="password" />
          </div>
          <div className="field">
            <label htmlFor="register-confirm-password">Repetir contraseña</label>
            <input autoComplete="new-password" className="input" id="register-confirm-password" name="confirmPassword" required type="password" />
          </div>
        </div>
        {state.fieldErrors?.password?.map((error) => <small key={error}>{error}</small>)}
        <label className="auth-consent">
          <input name="terms" required type="checkbox" />
          <span>
            Acepto los <Link href="/terminos-tecnicos">términos para profesionales</Link> y el tratamiento de datos descrito en <Link href="/privacidad">Privacidad</Link>.
          </span>
        </label>
        {state.fieldErrors?.terms?.map((error) => <small key={error}>{error}</small>)}
        <button className="button button-primary" disabled={pending} type="submit">
          <UserPlus aria-hidden="true" size={17} />
          {pending ? "Creando cuenta…" : "Crear cuenta y confirmar correo"}
        </button>
      </form>
    </div>
  );
}
