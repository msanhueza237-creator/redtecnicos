"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import {
  galleryStatusClass,
  galleryStatusLabel,
  galleryAcceptedMimeTypes,
  MAX_GALLERY_BATCH_FILES,
  MAX_GALLERY_ITEMS,
  MAX_GALLERY_UPLOAD_BYTES,
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

interface PendingGalleryFile {
  id: string;
  file: File;
  title: string;
}

function titleFromFile(file: File, index: number): string {
  const cleaned = file.name
    .replace(/\.[^.]+$/u, "")
    .replace(/[_-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 120);
  return cleaned.length >= 2 ? cleaned : `Trabajo realizado ${index + 1}`;
}

export function ProfessionalGalleryManager({ initialItems }: Readonly<{ initialItems: ProfessionalGalleryItem[] }>) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingGalleryFile[]>([]);
  const [batchCategory, setBatchCategory] = useState<ProfessionalGalleryCategory>("residential");
  const [batchDescription, setBatchDescription] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const atLimit = items.length >= MAX_GALLERY_ITEMS;
  const remainingSlots = Math.max(0, MAX_GALLERY_ITEMS - items.length);

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setMessage(null);
    const files = Array.from(event.currentTarget.files ?? []);
    if (!files.length) {
      setPendingFiles([]);
      return;
    }
    if (files.length > MAX_GALLERY_BATCH_FILES || files.length > remainingSlots) {
      const allowed = Math.min(MAX_GALLERY_BATCH_FILES, remainingSlots);
      setPendingFiles([]);
      event.currentTarget.value = "";
      setError(`Puedes seleccionar hasta ${allowed} ${allowed === 1 ? "fotografía" : "fotografías"} en esta carga.`);
      return;
    }
    const invalid = files.find((file) =>
      file.size > MAX_GALLERY_UPLOAD_BYTES ||
      !galleryAcceptedMimeTypes.includes(file.type as (typeof galleryAcceptedMimeTypes)[number]),
    );
    if (invalid) {
      setPendingFiles([]);
      event.currentTarget.value = "";
      setError(`“${invalid.name}” no cumple el formato permitido o supera 8 MB.`);
      return;
    }
    setPendingFiles(files.map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      file,
      title: titleFromFile(file, index),
    })));
  }

  function updatePendingTitle(id: string, title: string) {
    setPendingFiles((current) => current.map((entry) => entry.id === id ? { ...entry, title } : entry));
  }

  async function uploadImages(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!pendingFiles.length) {
      setError("Selecciona al menos una fotografía para continuar.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploaded: ProfessionalGalleryItem[] = [];
      let failure: Error | null = null;

      for (const [index, entry] of pendingFiles.entries()) {
        setUploadProgress(index + 1);
        const formData = new FormData();
        formData.set("image", entry.file);
        formData.set("title", entry.title);
        formData.set("category", batchCategory);
        formData.set("description", batchDescription);

        try {
          const response = await fetch("/api/v1/profiles/gallery", { method: "POST", body: formData });
          const payload = await response.json() as GalleryApiResponse<ProfessionalGalleryItem>;
          if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? `No fue posible cargar “${entry.file.name}”.`);
          uploaded.push(payload.data);
        } catch (currentError) {
          failure = currentError instanceof Error ? currentError : new Error(`No fue posible cargar “${entry.file.name}”.`);
          break;
        }
      }

      if (uploaded.length) {
        setItems((current) => [...current, ...uploaded].sort((a, b) => a.displayOrder - b.displayOrder));
      }

      if (failure) {
        setPendingFiles((current) => current.slice(uploaded.length));
        setError(`${uploaded.length ? `Se cargaron ${uploaded.length} de ${pendingFiles.length}. ` : ""}${failure.message}`);
        return;
      }

      formRef.current?.reset();
      setPendingFiles([]);
      setBatchDescription("");
      setMessage(`${uploaded.length} ${uploaded.length === 1 ? "fotografía cargada" : "fotografías cargadas"} correctamente. ${uploaded.length === 1 ? "Quedó" : "Quedaron"} en revisión antes de publicarse.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible cargar las fotografías.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
      <form className={`professional-panel-form ${styles.upload}`} onSubmit={uploadImages} ref={formRef}>
        <div className="professional-panel-card-header">
          <div>
            <h2>Subir trabajos</h2>
            <p>Selecciona varias fotografías en una sola acción. Crearemos copias WebP optimizadas y eliminaremos sus metadatos.</p>
          </div>
          <span className="professional-panel-status is-neutral">{items.length}/{MAX_GALLERY_ITEMS}</span>
        </div>
        <div className="professional-panel-form-grid">
          <label className={`professional-panel-field professional-panel-field-span ${styles.file}`}>
            <span>Fotografías de trabajos</span>
            <input
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={atLimit || uploading}
              multiple
              onChange={selectImages}
              type="file"
            />
            <small>Selecciona hasta {Math.min(MAX_GALLERY_BATCH_FILES, remainingSlots)} a la vez · JPG, PNG, WebP o AVIF · máximo 8 MB por imagen. Evita rostros, patentes, direcciones y documentos personales.</small>
          </label>
          {pendingFiles.length ? (
            <>
              <label className="professional-panel-field">
                <span>Categoría de esta carga</span>
                <select disabled={uploading} onChange={(event) => setBatchCategory(event.target.value as ProfessionalGalleryCategory)} required value={batchCategory}>
                  {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="professional-panel-field professional-panel-field-span">
                <span>Descripción común</span>
                <textarea disabled={uploading} maxLength={600} minLength={10} onChange={(event) => setBatchDescription(event.target.value)} placeholder="Describe el equipo, la instalación o la mantención que aparece en estas fotografías." required rows={4} value={batchDescription} />
                <small>Esta descripción se aplicará a todas las fotografías seleccionadas.</small>
              </label>
              <div className={`professional-panel-field professional-panel-field-span ${styles.batchList}`} aria-label="Fotografías seleccionadas">
                <span>{pendingFiles.length} {pendingFiles.length === 1 ? "fotografía seleccionada" : "fotografías seleccionadas"}</span>
                {pendingFiles.map((entry, index) => (
                  <article className={styles.pendingItem} key={entry.id}>
                    <span className={styles.pendingIndex}>{index + 1}</span>
                    <div className={styles.pendingFile}>
                      <strong>{entry.file.name}</strong>
                      <small>{(entry.file.size / (1024 * 1024)).toFixed(1)} MB</small>
                    </div>
                    <label>
                      <span>Título público</span>
                      <input disabled={uploading} maxLength={120} minLength={2} onChange={(event) => updatePendingTitle(entry.id, event.target.value)} required value={entry.title} />
                    </label>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <div className="professional-panel-actions">
          <button className="button button-primary" disabled={atLimit || uploading || !pendingFiles.length} type="submit">
            {uploading ? <LoaderCircle aria-hidden="true" className={styles.spinner} size={18} /> : <UploadCloud aria-hidden="true" size={18} />}
            {uploading ? `Procesando ${uploadProgress}/${pendingFiles.length}…` : atLimit ? "Galería completa" : pendingFiles.length ? `Cargar ${pendingFiles.length} y enviar a revisión` : "Selecciona fotografías"}
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
          <p>Puedes presentar hasta cinco fotografías y seleccionar varias de una vez. Cada una será revisada antes de aparecer públicamente.</p>
        </div>
      )}
    </div>
  );
}
