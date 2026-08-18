"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { Camera, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { updateProfessionalPreferencesAction } from "@/app/panel/configuracion/actions";
import { updateProfessionalProfileAction } from "@/app/panel/perfil/actions";
import { updateProfessionalServicesAction } from "@/app/panel/servicios/actions";
import { categoryLabels } from "@/data/demo-professionals";
import { professionalServices } from "@/domain/professional-registration";
import {
  initialProfessionalPanelActionState,
  paymentMethodOptions,
  profileAvailabilityOptions,
} from "@/domain/professional-profile";
import type { OwnedProfessionalProfile } from "@/lib/professional/profile";
import styles from "./professional-profile-forms.module.css";

interface AvatarResponse {
  data: { avatarUrl: string; status: string } | null;
  error: { message?: string } | null;
}

function ActionFeedback({ state }: Readonly<{ state: typeof initialProfessionalPanelActionState }>) {
  if (!state.message) return null;
  return <div className={`professional-panel-notice ${state.status === "success" ? "is-success" : "is-danger"}`} role={state.status === "error" ? "alert" : "status"}><p>{state.message}</p></div>;
}

export function ProfessionalAvatarManager({ profile }: Readonly<{ profile: OwnedProfessionalProfile }>) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [status, setStatus] = useState(profile.avatarStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = profile.displayName.split(/\s+/u).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();

  async function uploadAvatar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setUploading(true);
    try {
      const response = await fetch("/api/v1/profiles/avatar", { method: "POST", body: new FormData(event.currentTarget) });
      const payload = await response.json() as AvatarResponse;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "No fue posible cargar la fotografía.");
      setAvatarUrl(payload.data.avatarUrl);
      setStatus("pending_review");
      setMessage("Fotografía procesada y enviada a revisión administrativa.");
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible cargar la fotografía.");
    } finally {
      setUploading(false);
    }
  }

  const statusLabel = status === "reviewed" ? "Aprobada" : status === "changes_requested" ? "Cambios solicitados" : status === "rejected" ? "Rechazada" : status === "pending_review" ? "En revisión" : "Sin fotografía aprobada";

  return (
    <section className={`professional-panel-card ${styles.avatarCard}`}>
      <div className="professional-panel-card-header"><div><h2>Fotografía profesional</h2><p>Usa una foto clara de rostro o el logotipo de tu empresa.</p></div><span className={`professional-panel-status ${status === "reviewed" ? "is-approved" : "is-pending"}`}>{statusLabel}</span></div>
      <div className={`professional-panel-card-body ${styles.avatarBody}`}>
        <div className={styles.avatarPreview}>
          {avatarUrl ? <Image alt={`Fotografía profesional de ${profile.displayName}`} fill sizes="144px" src={avatarUrl} /> : <span aria-hidden="true">{initials || "RT"}</span>}
        </div>
        <form className={styles.avatarForm} onSubmit={uploadAvatar}>
          <label className="professional-panel-field"><span>Seleccionar imagen</span><input accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif" disabled={uploading} name="avatar" ref={inputRef} required type="file" /><small>JPG, PNG, WebP o AVIF · máximo 5 MB. Se recortará y eliminarán sus metadatos.</small></label>
          <button className="button button-primary" disabled={uploading} type="submit">{uploading ? <LoaderCircle aria-hidden="true" className={styles.spinner} size={17} /> : <Camera aria-hidden="true" size={17} />}{uploading ? "Procesando…" : "Cargar fotografía"}</button>
        </form>
      </div>
      {profile.avatarReviewReason ? <p className={styles.reviewReason}><strong>Observación:</strong> {profile.avatarReviewReason}</p> : null}
      {message ? <div className="professional-panel-notice is-success" role="status"><p>{message}</p></div> : null}
      {error ? <div className="professional-panel-notice is-danger" role="alert"><p>{error}</p></div> : null}
    </section>
  );
}

export function ProfessionalMainProfileForm({ profile }: Readonly<{ profile: OwnedProfessionalProfile }>) {
  const [state, action, pending] = useActionState(updateProfessionalProfileAction, initialProfessionalPanelActionState);
  return (
    <form action={action} className="professional-panel-form">
      <div className="professional-panel-form-grid">
        <label className="professional-panel-field"><span>Nombre público</span><input defaultValue={profile.displayName} maxLength={100} minLength={2} name="displayName" required /></label>
        <label className="professional-panel-field"><span>Años de experiencia</span><input defaultValue={profile.yearsExperience} max={70} min={0} name="yearsExperience" required type="number" /></label>
        <label className="professional-panel-field professional-panel-field-full"><span>Título o especialidad principal</span><input defaultValue={profile.headline} maxLength={160} minLength={5} name="headline" placeholder="Ej.: Técnico en climatización residencial" required /></label>
        <label className="professional-panel-field professional-panel-field-full"><span>Presentación profesional</span><textarea defaultValue={profile.summary} maxLength={1600} minLength={40} name="summary" required rows={6} /><small>Explica qué haces, tu experiencia y el tipo de clientes que atiendes.</small></label>
      </div>
      <fieldset className="checkbox-group"><legend>Categorías que atiendes</legend>{Object.entries(categoryLabels).map(([value, label]) => <label className="checkbox-row" key={value}><input defaultChecked={(profile.categories as string[]).includes(value)} name="categories" type="checkbox" value={value} /><span>{label}</span></label>)}</fieldset>
      <div className="professional-panel-form-grid">
        <label className="professional-panel-field"><span>Correo que recibirá contactos</span><input autoComplete="email" defaultValue={profile.publicEmail} maxLength={254} name="publicEmail" required type="email" /></label>
        <label className="professional-panel-field"><span>Celular de contacto</span><input autoComplete="tel" defaultValue={profile.publicPhone} name="publicPhone" required type="tel" /></label>
        <label className="professional-panel-field"><span>WhatsApp</span><input autoComplete="tel" defaultValue={profile.whatsappPhone} name="whatsappPhone" required type="tel" /></label>
      </div>
      <div className={styles.privateNote}><ShieldCheck aria-hidden="true" size={18} /><p>Correo, celular y WhatsApp solo se revelan después de registrar una solicitud. Nunca aparecen directamente en la ficha pública.</p></div>
      <button className="button button-primary" disabled={pending} type="submit"><Save aria-hidden="true" size={17} />{pending ? "Guardando…" : "Guardar y enviar a revisión"}</button>
      <ActionFeedback state={state} />
    </form>
  );
}

export function ProfessionalServicesForm({ profile }: Readonly<{ profile: OwnedProfessionalProfile }>) {
  const [state, action, pending] = useActionState(updateProfessionalServicesAction, initialProfessionalPanelActionState);
  return (
    <form action={action} className="professional-panel-form">
      <fieldset className="checkbox-group"><legend>Servicios activos · selecciona hasta seis</legend><div className={styles.serviceGrid}>{professionalServices.map((service) => <label className="checkbox-row" key={service}><input defaultChecked={profile.services.includes(service)} name="services" type="checkbox" value={service} /><span>{service}</span></label>)}</div></fieldset>
      <div className="professional-panel-form-grid">
        <label className="professional-panel-field professional-panel-field-full"><span>Especialidades</span><textarea defaultValue={profile.specialties.join(", ")} maxLength={960} name="specialties" placeholder="Ej.: refrigeración gastronómica, detección electrónica de fugas" rows={3} /><small>Separa cada elemento con coma. Máximo 12.</small></label>
        <label className="professional-panel-field"><span>Marcas con experiencia</span><textarea defaultValue={profile.brands.join(", ")} maxLength={960} name="brands" placeholder="Ej.: Carrier, Midea, LG" rows={3} /></label>
        <label className="professional-panel-field"><span>Equipos que atiendes</span><textarea defaultValue={profile.equipmentTypes.join(", ")} maxLength={960} name="equipmentTypes" placeholder="Ej.: split, cassette, cámaras de frío" rows={3} /></label>
      </div>
      <button className="button button-primary" disabled={pending} type="submit"><Save aria-hidden="true" size={17} />{pending ? "Guardando…" : "Guardar servicios"}</button>
      <ActionFeedback state={state} />
    </form>
  );
}

export function ProfessionalPreferencesForm({ profile }: Readonly<{ profile: OwnedProfessionalProfile }>) {
  const [state, action, pending] = useActionState(updateProfessionalPreferencesAction, initialProfessionalPanelActionState);
  return (
    <form action={action} className="professional-panel-form">
      <div className="professional-panel-form-grid">
        <label className="professional-panel-field"><span>Disponibilidad</span><select defaultValue={profile.availability} name="availability" required>{profileAvailabilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label className="professional-panel-field"><span>Días y horarios habituales</span><input defaultValue={profile.workingHours} maxLength={180} name="workingHours" placeholder="Ej.: lunes a sábado, 09:00 a 19:00" /></label>
      </div>
      <fieldset className="checkbox-group"><legend>Recepción de solicitudes</legend><label className="checkbox-row"><input defaultChecked={profile.acceptsNewRequests} name="acceptsNewRequests" type="checkbox" /><span>Acepto nuevas solicitudes</span></label><label className="checkbox-row"><input defaultChecked={profile.emergencyAvailable} name="emergencyAvailable" type="checkbox" /><span>Estoy disponible para emergencias</span></label></fieldset>
      <fieldset className="checkbox-group"><legend>Información comercial declarada</legend><label className="checkbox-row"><input defaultChecked={profile.issuesInvoice} name="issuesInvoice" type="checkbox" /><span>Emito factura</span></label><label className="checkbox-row"><input defaultChecked={profile.issuesReceipt} name="issuesReceipt" type="checkbox" /><span>Emito boleta</span></label><label className="checkbox-row"><input defaultChecked={profile.writtenQuotes} name="writtenQuotes" type="checkbox" /><span>Entrego presupuesto escrito</span></label></fieldset>
      <fieldset className="checkbox-group"><legend>Medios de pago aceptados</legend>{paymentMethodOptions.map((method) => <label className="checkbox-row" key={method}><input defaultChecked={profile.paymentMethods.includes(method)} name="paymentMethods" type="checkbox" value={method} /><span>{method}</span></label>)}</fieldset>
      <label className="professional-panel-field"><span>Garantía declarada del trabajo</span><textarea defaultValue={profile.declaredWarranty} maxLength={240} name="declaredWarranty" placeholder="Ej.: garantía de 90 días sobre la mano de obra, según condiciones del presupuesto." rows={3} /><small>No prometas condiciones que no puedas respaldar por escrito.</small></label>
      <button className="button button-primary" disabled={pending} type="submit"><Save aria-hidden="true" size={17} />{pending ? "Guardando…" : "Guardar disponibilidad y preferencias"}</button>
      <ActionFeedback state={state} />
    </form>
  );
}
