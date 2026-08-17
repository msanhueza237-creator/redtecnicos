"use client";

import { useRef, useState } from "react";
import { FileCheck2, GraduationCap, LoaderCircle, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import {
  MAX_QUALIFICATIONS,
  qualificationStatusClass,
  qualificationStatusLabel,
  qualificationTypeLabel,
  type ProfessionalQualificationItem,
} from "@/domain/professional-qualification";
import styles from "./professional-qualification-manager.module.css";

interface QualificationApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "Tamaño no disponible";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProfessionalQualificationManager({ initialItems }: Readonly<{ initialItems: ProfessionalQualificationItem[] }>) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const atLimit = items.length >= MAX_QUALIFICATIONS;

  async function submitQualification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      const response = await fetch("/api/v1/profiles/qualifications", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const payload = await response.json() as QualificationApiResponse<ProfessionalQualificationItem>;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "No fue posible cargar el documento.");

      setItems((current) => [payload.data!, ...current]);
      formRef.current?.reset();
      setMessage("Documento cargado y analizado correctamente. Quedó pendiente de revisión administrativa.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible cargar el documento.");
    } finally {
      setUploading(false);
    }
  }

  async function removeQualification(item: ProfessionalQualificationItem) {
    if (!window.confirm(`¿Retirar “${item.title}” y su documento privado?`)) return;
    setError(null);
    setMessage(null);
    setRemovingId(item.id);
    try {
      const response = await fetch(`/api/v1/profiles/qualifications/${item.id}`, { method: "DELETE" });
      const payload = await response.json() as QualificationApiResponse<{ id: string }>;
      if (!response.ok) throw new Error(payload.error?.message ?? "No fue posible retirar el antecedente.");
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setMessage("Antecedente y documento retirados correctamente.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "No fue posible retirar el antecedente.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className={styles.manager}>
      <form className={`professional-panel-form ${styles.upload}`} onSubmit={submitQualification} ref={formRef}>
        <div className="professional-panel-card-header">
          <div>
            <h2>Agregar formación respaldada</h2>
            <p>Declara el antecedente y adjunta el documento oficial emitido por la institución.</p>
          </div>
          <span className="professional-panel-status is-neutral">{items.length}/{MAX_QUALIFICATIONS}</span>
        </div>

        <div className="professional-panel-form-grid">
          <label className="professional-panel-field">
            <span>Tipo de antecedente</span>
            <select disabled={atLimit || uploading} name="type" required>
              <option value="technical_degree">Título técnico</option>
              <option value="professional_degree">Título profesional</option>
              <option value="training">Capacitación o certificación</option>
            </select>
          </label>
          <label className="professional-panel-field">
            <span>Nombre del título o capacitación</span>
            <input disabled={atLimit || uploading} maxLength={180} minLength={2} name="title" placeholder="Ej.: Técnico en Refrigeración" required />
          </label>
          <label className="professional-panel-field">
            <span>Institución emisora</span>
            <input disabled={atLimit || uploading} maxLength={180} minLength={2} name="institution" placeholder="Ej.: Instituto Profesional" required />
          </label>
          <label className="professional-panel-field">
            <span>Año de obtención</span>
            <input disabled={atLimit || uploading} max={new Date().getFullYear()} min={1950} name="issuedYear" required type="number" />
          </label>
          <label className="professional-panel-field">
            <span>Vencimiento, si corresponde</span>
            <input disabled={atLimit || uploading} name="expiresAt" type="date" />
          </label>
          <label className={`professional-panel-field ${styles.file}`}>
            <span>Documento de respaldo</span>
            <input
              accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
              disabled={atLimit || uploading}
              name="document"
              required
              type="file"
            />
            <small>PDF, JPG o PNG · máximo 10 MB.</small>
          </label>
        </div>

        <div className={styles.securityNote}>
          <ShieldCheck aria-hidden="true" size={19} />
          <p>El archivo pasará por cuarentena y análisis antivirus. Nunca será público ni se enviará adjunto por correo.</p>
        </div>
        <div className="professional-panel-actions">
          <button className="button button-primary" disabled={atLimit || uploading} type="submit">
            {uploading ? <LoaderCircle aria-hidden="true" className={styles.spinner} size={18} /> : <UploadCloud aria-hidden="true" size={18} />}
            {uploading ? "Analizando documento…" : atLimit ? "Límite alcanzado" : "Cargar y enviar a revisión"}
          </button>
        </div>
      </form>

      {message ? <div className="professional-panel-notice is-success" role="status"><p>{message}</p></div> : null}
      {error ? <div className="professional-panel-notice is-danger" role="alert"><p>{error}</p></div> : null}

      {items.length ? (
        <div className={styles.list}>
          {items.map((item) => (
            <article className={styles.item} key={item.id}>
              <span className={styles.icon}><GraduationCap aria-hidden="true" size={22} /></span>
              <div className={styles.copy}>
                <div className={styles.itemTop}>
                  <span>{qualificationTypeLabel(item.type)}</span>
                  <span className={`professional-panel-status ${qualificationStatusClass(item.status)}`}>{qualificationStatusLabel(item.status)}</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.institution} · {item.issuedYear}{item.expiresAt ? ` · vence ${item.expiresAt}` : ""}</p>
                <small><FileCheck2 aria-hidden="true" size={14} /> {item.originalFileName} · {formatFileSize(item.fileSizeBytes)} · análisis de seguridad superado</small>
                {item.reviewReason ? <p className={styles.reviewReason}><strong>Observación:</strong> {item.reviewReason}</p> : null}
                <div className={styles.actions}>
                  {item.hasDocument ? <a className="button button-secondary" href={`/api/v1/profiles/qualifications/${item.id}/document`} rel="noreferrer" target="_blank">Ver respaldo privado</a> : null}
                  {["pending_review", "changes_requested", "rejected"].includes(item.status) ? (
                    <button className="button button-ghost" disabled={removingId === item.id} onClick={() => removeQualification(item)} type="button">
                      {removingId === item.id ? <LoaderCircle aria-hidden="true" className={styles.spinner} size={16} /> : <Trash2 aria-hidden="true" size={16} />}
                      {removingId === item.id ? "Retirando…" : "Retirar"}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="professional-panel-empty">
          <span><GraduationCap aria-hidden="true" size={24} /></span>
          <h2>Aún no has agregado formación</h2>
          <p>Los títulos y capacitaciones solo aparecerán públicamente después de revisar su respaldo.</p>
        </div>
      )}
    </div>
  );
}
