"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import {
  galleryStatusClass,
  galleryStatusLabel,
  MAX_GALLERY_ITEMS,
  type ProfessionalGalleryCategory,
  type ProfessionalGalleryItem,
} from "@/domain/professional-gallery";
import styles from "./professional-gallery-manager.module.css";

const categoryLabels: Record<ProfessionalGalleryCategory, string> = {
  industrial: "Refrigeración industrial",
  commercial: "Refrigeración comercial",
  residential: "Climatización residencial",
};

interface GalleryApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

export function ProfessionalGalleryManager({ initialItems }: Readonly<{ initialItems: ProfessionalGalleryItem[] }>) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const atLimit = items.length >= MAX_GALLERY_ITEMS;

  async function uploadImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setUploading(true);

    try {
      const response = await fetch("/api/v1/profiles/gallery", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const payload = await response.json() as GalleryApiResponse<ProfessionalGalleryItem>;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "No fue posible cargar la fotografía.");

      setItems((current) => [...current, payload.data!].sort((a, b) => a.displayOrder - b.displayOrder));
      formRef.current?.reset();
      setMessage("Fotografía cargada correctamente. Quedó en revisión antes de publicarse.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible cargar la fotografía.");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(item: ProfessionalGalleryItem) {
    const confirmed = window.confirm(`¿Retirar “${item.title}” de tu galería?`);
    if (!confirmed) return;

    setError(null);
    setMessage(null);
    setRemovingId(item.id);
    try {
      const response = await fetch(`/api/v1/profiles/gallery/${item.id}`, { method: "DELETE" });
      const payload = await response.json() as GalleryApiResponse<{ id: string }>;
      if (!response.ok) throw new Error(payload.error?.message ?? "No fue posible retirar la fotografía.");
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setMessage("Fotografía retirada de la galería.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "No fue posible retirar la fotografía.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className={styles.manager}>
      <form className={`professional-panel-form ${styles.upload}`} onSubmit={uploadImage} ref={formRef}>
        <div className="professional-panel-card-header">
          <div>
            <h2>Agregar un trabajo</h2>
            <p>Usaremos una copia WebP optimizada y eliminaremos los metadatos de la fotografía.</p>
          </div>
          <span className="professional-panel-status is-neutral">{items.length}/{MAX_GALLERY_ITEMS}</span>
        </div>
        <div className="professional-panel-form-grid">
          <label className={`professional-panel-field professional-panel-field-span ${styles.file}`}>
            <span>Fotografía del trabajo</span>
            <input
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={atLimit || uploading}
              name="image"
              required
              type="file"
            />
            <small>JPG, PNG, WebP o AVIF · máximo 8 MB. Evita rostros, patentes, direcciones y documentos personales.</small>
          </label>
          <label className="professional-panel-field">
            <span>Título</span>
            <input disabled={atLimit || uploading} maxLength={120} minLength={2} name="title" placeholder="Ej.: Instalación de equipo split" required />
          </label>
          <label className="professional-panel-field">
            <span>Categoría</span>
            <select disabled={atLimit || uploading} name="category" required>
              {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="professional-panel-field professional-panel-field-span">
            <span>Descripción</span>
            <textarea disabled={atLimit || uploading} maxLength={600} minLength={10} name="description" placeholder="Describe brevemente el equipo, la instalación o la mantención realizada." required rows={4} />
          </label>
        </div>
        <div className="professional-panel-actions">
          <button className="button button-primary" disabled={atLimit || uploading} type="submit">
            {uploading ? <LoaderCircle aria-hidden="true" className={styles.spinner} size={18} /> : <UploadCloud aria-hidden="true" size={18} />}
            {uploading ? "Procesando fotografía…" : atLimit ? "Galería completa" : "Cargar y enviar a revisión"}
          </button>
        </div>
      </form>

      {message ? <div className="professional-panel-notice is-success" role="status"><p>{message}</p></div> : null}
      {error ? <div className="professional-panel-notice is-danger" role="alert"><p>{error}</p></div> : null}

      {items.length ? (
        <div className="professional-panel-gallery">
          {items.map((item) => (
            <article className="professional-panel-gallery-item" key={item.id}>
              <div className="professional-panel-gallery-image">
                <Image alt={item.altText} fill sizes="(max-width: 760px) 100vw, 30vw" src={item.imageUrl} unoptimized />
                <span>{String(item.displayOrder).padStart(2, "0")}</span>
              </div>
              <div className={styles.itemBody}>
                <span className={`professional-panel-status ${galleryStatusClass(item.status)}`}>{galleryStatusLabel(item.status)}</span>
                <h2>{item.title}</h2>
                <strong>{categoryLabels[item.category]}</strong>
                <p>{item.description}</p>
                {item.reviewReason ? <small className={styles.reviewNote}>Observación: {item.reviewReason}</small> : null}
                {["pending_review", "changes_requested"].includes(item.status) ? (
                  <button
                    className="button button-ghost"
                    disabled={removingId === item.id}
                    onClick={() => removeImage(item)}
                    type="button"
                  >
                    {removingId === item.id ? <LoaderCircle aria-hidden="true" className={styles.spinner} size={16} /> : <Trash2 aria-hidden="true" size={16} />}
                    {removingId === item.id ? "Retirando…" : "Retirar fotografía"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="professional-panel-empty">
          <span><ImagePlus aria-hidden="true" size={24} /></span>
          <h2>Aún no has cargado trabajos</h2>
          <p>Puedes presentar hasta tres fotografías. Cada una será revisada antes de aparecer en tu perfil público.</p>
        </div>
      )}
    </div>
  );
}
