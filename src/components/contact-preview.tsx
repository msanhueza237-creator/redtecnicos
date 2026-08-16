"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Info,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Phone,
  RotateCcw,
  Send,
} from "lucide-react";

interface ContactResult {
  requestId: string;
  trackingToken: string;
  professional: {
    displayName: string;
    email: string;
    phone: string;
    whatsapp?: string;
  };
  createdAt: string;
}

interface ContactPreviewProps {
  professionalId: string;
  professionalSlug: string;
  professionalName: string;
  professionalKind: "technician" | "company";
  services: string[];
  communes: string[];
  isDemo: boolean;
}

interface ContactApiResponse {
  data?: ContactResult;
  error?: string | { message?: string } | null;
}

function getApiError(payload: ContactApiResponse | null) {
  if (!payload?.error) return "No pudimos registrar la solicitud. Intenta nuevamente.";
  if (typeof payload.error === "string") return payload.error;
  return payload.error.message ?? "No pudimos registrar la solicitud. Intenta nuevamente.";
}

export function ContactPreview({
  professionalId,
  professionalSlug,
  professionalName,
  professionalKind,
  services,
  communes,
  isDemo,
}: ContactPreviewProps) {
  const [result, setResult] = useState<ContactResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/v1/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId,
          professionalSlug,
          customerName: form.get("customerName"),
          customerEmail: form.get("customerEmail"),
          customerPhone: form.get("customerPhone"),
          commune: form.get("commune"),
          service: form.get("service"),
          description: form.get("description"),
          consentAccepted: form.get("consentAccepted") === "on",
        }),
      });

      const payload = (await response.json().catch(() => null)) as ContactApiResponse | ContactResult | null;
      const data = payload && "requestId" in payload ? payload : payload?.data;

      if (!response.ok || !data) {
        setError(getApiError(payload && "requestId" in payload ? null : payload));
        return;
      }

      setResult(data);
    } catch {
      setError("No fue posible conectar con el servicio. Revisa tu conexión e intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyRequestId() {
    if (!result) return;
    await navigator.clipboard.writeText(result.requestId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (result) {
    return (
      <section className="contact-success" aria-labelledby="contact-success-title" role="status">
        <div className="contact-success-icon"><CheckCircle2 size={28} aria-hidden="true" /></div>
        <div>
          <span className="contact-success-kicker">Solicitud registrada</span>
          <h2 id="contact-success-title">Ya puedes contactar a {result.professional.displayName}</h2>
          <p>Guardamos tu solicitud en el historial. Usa estos canales para conversar directamente con el profesional.</p>
        </div>

        <div className="contact-channels" aria-label="Datos de contacto del profesional">
          <a href={`mailto:${result.professional.email}`}>
            <span><Mail size={18} aria-hidden="true" /> Correo electrónico</span>
            <strong>{result.professional.email}</strong>
            <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a href={`tel:${result.professional.phone.replace(/\s/g, "")}`}>
            <span><Phone size={18} aria-hidden="true" /> Celular</span>
            <strong>{result.professional.phone}</strong>
            <ArrowRight size={17} aria-hidden="true" />
          </a>
          {result.professional.whatsapp ? <a href={`https://wa.me/${result.professional.whatsapp.replace(/\D/g, "")}`} rel="noreferrer" target="_blank">
            <span><MessageSquareText size={18} aria-hidden="true" /> WhatsApp</span>
            <strong>Abrir conversación</strong>
            <ArrowRight size={17} aria-hidden="true" />
          </a> : null}
        </div>

        <div className="contact-request-reference">
          <span>Identificador de la solicitud</span>
          <strong>{result.requestId}</strong>
          <button type="button" onClick={copyRequestId} aria-label="Copiar identificador de solicitud">
            <Copy size={15} aria-hidden="true" /> {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        <a
          className="button button-primary contact-tracking-link"
          href={`/seguimiento/${encodeURIComponent(result.trackingToken)}`}
          referrerPolicy="no-referrer"
        >
          <MessageSquareText size={17} aria-hidden="true" />
          Seguir solicitud y evaluar después
        </a>
        <p className="contact-tracking-help">
          Guarda este enlace privado. Cuando el trabajo termine podrás confirmar el servicio y calificar al técnico o empresa sin crear una cuenta.
        </p>

        <p className="contact-safety-note">
          Red Técnicos Chile facilita el contacto, pero no interviene en presupuestos, pagos ni ejecución. Confirma siempre el alcance antes de contratar.
        </p>

        <button
          className="button button-secondary contact-new-request"
          type="button"
          onClick={() => {
            setCopied(false);
            setResult(null);
          }}
        >
          <RotateCcw size={16} aria-hidden="true" /> Realizar otra solicitud
        </button>
      </section>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <div className="contact-demo-label"><Info size={15} aria-hidden="true" /> {isDemo ? "Demo local: usa datos ficticios" : "Solicitud segura y registrada"}</div>
      <h2>Solicitar contacto</h2>
      <p className="contact-subtitle">
        Completa tus datos y verás inmediatamente el correo y celular de {professionalName}.
      </p>

      <div className="contact-fields-grid">
        <div className="field contact-field-full">
          <label htmlFor="contact-name">Nombre</label>
          <input className="input" id="contact-name" name="customerName" required minLength={2} maxLength={80} placeholder="Ej. Daniela Soto" autoComplete="name" />
        </div>
        <div className="field contact-field-full">
          <label htmlFor="contact-email">Correo electrónico</label>
          <input className="input" id="contact-email" name="customerEmail" type="email" required maxLength={160} placeholder="nombre@correo.cl" autoComplete="email" inputMode="email" />
        </div>
        <div className="field contact-field-full">
          <label htmlFor="contact-phone">Celular</label>
          <input className="input" id="contact-phone" name="customerPhone" type="tel" required minLength={8} maxLength={24} placeholder="+56 9 0000 0000" autoComplete="tel" inputMode="tel" />
        </div>
        <div className="field">
          <label htmlFor="contact-commune">Comuna</label>
          <select className="select" id="contact-commune" name="commune" required defaultValue="">
            <option value="" disabled>Selecciona</option>
            {communes.map((commune) => <option key={commune} value={commune}>{commune}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="contact-service">Servicio requerido</label>
          <select className="select" id="contact-service" name="service" required defaultValue="">
            <option value="" disabled>Selecciona</option>
            {services.map((service) => <option key={service} value={service}>{service}</option>)}
          </select>
        </div>
        <div className="field contact-field-full">
          <label htmlFor="contact-description">¿Qué necesitas?</label>
          <textarea
            className="textarea"
            id="contact-description"
            name="description"
            required
            minLength={10}
            maxLength={1000}
            aria-describedby="contact-description-help"
            placeholder="Describe el equipo, el problema y cuándo necesitas atención."
          />
          <span className="field-help" id="contact-description-help">No incluyas contraseñas, datos bancarios ni otra información sensible.</span>
        </div>
      </div>

      <div className="responsibility-box">
        <LockKeyhole size={18} aria-hidden="true" />
        <p>{isDemo ? "Esta demo guardará temporalmente la solicitud. No ingreses información real durante la revisión local." : `Guardaremos esta solicitud y tus datos para facilitar el contacto con ${professionalKind === "company" ? "la empresa" : "el técnico"}. También enviaremos un enlace privado de seguimiento a tu correo.`}</p>
      </div>

      <label className="checkbox-row consent-row">
        <input type="checkbox" name="consentAccepted" required />
        <span>Acepto el tratamiento de mis datos para gestionar esta solicitud y declaro haber leído la <Link href="/privacidad">política de privacidad</Link>.</span>
      </label>

      {error ? <div className="contact-error" role="alert">{error}</div> : null}

      <button className="button button-primary contact-submit" type="submit" disabled={isSubmitting}>
        <Send size={17} aria-hidden="true" /> {isSubmitting ? "Registrando solicitud…" : "Ver datos de contacto"}
      </button>
      <p className="contact-submit-help">Al continuar, la solicitud quedará asociada a este perfil y registrada en su historial.</p>
    </form>
  );
}
