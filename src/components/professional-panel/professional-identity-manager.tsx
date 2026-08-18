"use client";

import { useRef, useState } from "react";
import { FileLock2, LoaderCircle, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import {
  identityDocumentTypeLabel,
  MAX_IDENTITY_DOCUMENTS,
  type IdentityDocumentItem,
} from "@/domain/identity-document";
import { qualificationStatusClass, qualificationStatusLabel } from "@/domain/professional-qualification";

interface IdentityApiResponse<T> { data: T | null; error: { message?: string } | null }

export function ProfessionalIdentityManager({ initialItems }: Readonly<{ initialItems: IdentityDocumentItem[] }>) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const atLimit = items.length >= MAX_IDENTITY_DOCUMENTS;

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null); setError(null);
    try {
      const response = await fetch("/api/v1/profiles/identity", { method: "POST", body: new FormData(event.currentTarget) });
      const payload = await response.json() as IdentityApiResponse<IdentityDocumentItem>;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "No fue posible cargar el documento.");
      setItems((current) => [payload.data!, ...current]);
      formRef.current?.reset();
      setMessage("Documento recibido, analizado y enviado a revisión privada.");
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "No fue posible cargar el documento."); }
    finally { setBusy(false); }
  }

  async function remove(item: IdentityDocumentItem) {
    if (!window.confirm("¿Retirar este documento privado?")) return;
    setBusy(true); setMessage(null); setError(null);
    try {
      const response = await fetch(`/api/v1/profiles/identity/${item.id}`, { method: "DELETE" });
      const payload = await response.json() as IdentityApiResponse<{ id: string }>;
      if (!response.ok) throw new Error(payload.error?.message ?? "No fue posible retirar el documento.");
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setMessage("Documento retirado correctamente.");
    } catch (removeError) { setError(removeError instanceof Error ? removeError.message : "No fue posible retirar el documento."); }
    finally { setBusy(false); }
  }

  return (
    <div className="professional-panel-grid">
      <section className="professional-panel-card">
        <div className="professional-panel-card-header"><div><h2>Verificar identidad</h2><p>Adjunta un respaldo vigente. Su contenido nunca será público.</p></div><span className="professional-panel-status is-neutral">{items.length}/{MAX_IDENTITY_DOCUMENTS}</span></div>
        <div className="professional-panel-card-body">
          <form className="professional-panel-form" onSubmit={upload} ref={formRef}>
            <label className="professional-panel-field"><span>Tipo de documento</span><select disabled={busy || atLimit} name="documentType" required><option value="identity_document">Cédula u otro documento de identidad</option><option value="company_tax_document">Documento tributario de empresa</option></select></label>
            <label className="professional-panel-field"><span>Nombre completo o razón social</span><input disabled={busy || atLimit} maxLength={160} minLength={3} name="subjectName" required /></label>
            <label className="professional-panel-field"><span>Archivo privado</span><input accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" disabled={busy || atLimit} name="document" required type="file" /><small>PDF, JPG o PNG · máximo 10 MB.</small></label>
            <div className="professional-panel-notice"><ShieldCheck aria-hidden="true" size={18} /><p>El archivo se valida por firma y MIME, se limpia si es imagen y pasa por ClamAV antes de guardarse.</p></div>
            <button className="button button-primary" disabled={busy || atLimit} type="submit">{busy ? <LoaderCircle aria-hidden="true" size={17} /> : <UploadCloud aria-hidden="true" size={17} />}{busy ? "Procesando…" : atLimit ? "Límite alcanzado" : "Enviar a revisión"}</button>
          </form>
        </div>
      </section>
      <section className="professional-panel-card">
        <div className="professional-panel-card-header"><div><h2>Estado de verificación</h2><p>Solo la insignia de aprobación podrá aparecer públicamente.</p></div></div>
        <div className="professional-panel-list">
          {items.map((item) => <article key={item.id}><span className="professional-panel-list-icon"><FileLock2 aria-hidden="true" size={20} /></span><div><span className="professional-panel-list-meta">{identityDocumentTypeLabel(item.documentType)}</span><h3>{item.subjectName}</h3><p>{item.originalFileName}</p>{item.reviewReason ? <small>Observación: {item.reviewReason}</small> : null}<div className="professional-panel-actions">{item.hasDocument ? <a className="button button-secondary" href={`/api/v1/profiles/identity/${item.id}/document`} rel="noreferrer" target="_blank">Abrir privado</a> : null}{["pending_review", "changes_requested", "rejected"].includes(item.status) ? <button className="button button-ghost" disabled={busy} onClick={() => remove(item)} type="button"><Trash2 aria-hidden="true" size={15} />Retirar</button> : null}</div></div><span className={`professional-panel-status ${qualificationStatusClass(item.status)}`}>{qualificationStatusLabel(item.status)}</span></article>)}
          {!items.length ? <div className="professional-panel-empty"><ShieldCheck aria-hidden="true" size={24} /><h2>Identidad aún no verificada</h2><p>Puedes usar el panel sin cargar este documento; será necesario para obtener la insignia de identidad revisada.</p></div> : null}
        </div>
      </section>
      {message ? <div className="professional-panel-notice is-success" role="status"><p>{message}</p></div> : null}
      {error ? <div className="professional-panel-notice is-danger" role="alert"><p>{error}</p></div> : null}
    </div>
  );
}
