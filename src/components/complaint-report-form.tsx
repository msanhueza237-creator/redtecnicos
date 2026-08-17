"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, LockKeyhole, MessageSquareWarning, Send } from "lucide-react";
import {
  complaintCategories,
  complaintCategoryLabels,
  complaintRelatedTypeLabels,
  complaintRelatedTypes,
  type ComplaintReceipt,
} from "@/domain/complaint";
import type { ApiEnvelope } from "@/domain/contact-request";

export function ComplaintReportForm({ isLive }: Readonly<{ isLive: boolean }>) {
  const [receipt, setReceipt] = useState<ComplaintReceipt | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/v1/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: formData.get("reporterName"),
          reporterEmail: formData.get("reporterEmail"),
          reporterPhone: formData.get("reporterPhone"),
          category: formData.get("category"),
          subject: formData.get("subject"),
          description: formData.get("description"),
          relatedType: formData.get("relatedType"),
          relatedReference: formData.get("relatedReference"),
          consentAccepted: formData.get("consentAccepted") === "on",
          website: formData.get("website"),
        }),
      });
      const result = await response.json() as ApiEnvelope<ComplaintReceipt>;
      if (!response.ok || !result.data) {
        setError(result.error?.message ?? "No pudimos registrar el reporte.");
        return;
      }
      setReceipt(result.data);
      form.reset();
    } catch {
      setError("No pudimos conectar con el canal de reportes. Inténtalo nuevamente.");
    } finally {
      setPending(false);
    }
  }

  if (receipt) {
    return (
      <section className="complaint-success" aria-labelledby="complaint-success-title" role="status">
        <CheckCircle2 aria-hidden="true" size={36} />
        <span>{isLive ? "Reporte registrado" : "Ejemplo completado"}</span>
        <h2 id="complaint-success-title">Tu número de caso es {receipt.caseNumber}</h2>
        <p>
          {isLive
            ? "Guarda este número. El equipo administrativo revisará los antecedentes y podrá contactarte por el correo informado."
            : "Este número es ficticio y no se guardó información en la demostración local."}
        </p>
        <button className="button button-secondary" onClick={() => setReceipt(null)} type="button">Enviar otro reporte</button>
      </section>
    );
  }

  return (
    <form className="complaint-form" onSubmit={submitReport}>
      <div className={`complaint-operational-note${isLive ? "" : " is-demo"}`} role="note">
        {isLive ? <LockKeyhole aria-hidden="true" size={19} /> : <MessageSquareWarning aria-hidden="true" size={19} />}
        <p>{isLive ? "Canal privado conectado a Supabase. Solo moderadores y administradores autorizados podrán revisar el reporte." : "Demostración local: el envío genera un ejemplo y no almacena datos."}</p>
      </div>

      <fieldset>
        <legend>Datos para responderte</legend>
        <div className="complaint-form-grid">
          <label className="field">
            <span>Nombre</span>
            <input autoComplete="name" className="input" maxLength={100} name="reporterName" required />
          </label>
          <label className="field">
            <span>Correo electrónico</span>
            <input autoComplete="email" className="input" maxLength={254} name="reporterEmail" required type="email" />
          </label>
          <label className="field complaint-field-full">
            <span>Teléfono <small>Opcional</small></span>
            <input autoComplete="tel" className="input" maxLength={24} minLength={8} name="reporterPhone" type="tel" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Información del problema</legend>
        <div className="complaint-form-grid">
          <label className="field">
            <span>Motivo principal</span>
            <select className="select" defaultValue="" name="category" required>
              <option disabled value="">Selecciona un motivo</option>
              {complaintCategories.map((category) => <option key={category} value={category}>{complaintCategoryLabels[category]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Recurso relacionado</span>
            <select className="select" defaultValue="general" name="relatedType">
              {complaintRelatedTypes.map((type) => <option key={type} value={type}>{complaintRelatedTypeLabels[type]}</option>)}
            </select>
          </label>
          <label className="field complaint-field-full">
            <span>Identificador o enlace relacionado <small>Opcional</small></span>
            <input className="input" maxLength={160} name="relatedReference" placeholder="Ej.: enlace del perfil o número de solicitud" />
          </label>
          <label className="field complaint-field-full">
            <span>Resumen del problema</span>
            <input className="input" maxLength={160} minLength={5} name="subject" required />
          </label>
          <label className="field complaint-field-full">
            <span>Describe lo ocurrido</span>
            <textarea className="textarea" maxLength={3000} minLength={30} name="description" placeholder="Explica los hechos, cuándo ocurrieron y qué solución esperas. No incluyas contraseñas ni datos bancarios." required rows={7} />
          </label>
        </div>
      </fieldset>

      <label className="complaint-honeypot" aria-hidden="true">
        Sitio web
        <input autoComplete="off" name="website" tabIndex={-1} />
      </label>
      <label className="auth-consent">
        <input name="consentAccepted" required type="checkbox" />
        <span>Acepto que Red Técnicos Chile trate estos datos exclusivamente para investigar y responder el reporte, conforme a la política de privacidad.</span>
      </label>
      <div className="complaint-safety-note">
        Este canal no reemplaza servicios de emergencia ni denuncias ante las autoridades. No adjuntamos archivos todavía para evitar recibir documentos inseguros o innecesarios.
      </div>
      {error ? <p className="auth-message" role="alert">{error}</p> : null}
      <button className="button button-primary complaint-submit" disabled={pending} type="submit">
        <Send aria-hidden="true" size={17} /> {pending ? "Registrando…" : "Enviar reporte"}
      </button>
    </form>
  );
}
