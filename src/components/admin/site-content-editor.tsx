"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ExternalLink, Save, Send } from "lucide-react";
import {
  publishSiteContentAction,
  saveSiteContentDraftAction,
} from "@/app/admin/contenido/actions";
import { AdminStatus } from "@/components/admin/admin-ui";
import {
  siteContentHrefValues,
  type AdminSiteContentEntry,
} from "@/domain/site-content";
import { initialAdminActionState } from "@/lib/admin/action-state";

const destinationLabels: Record<(typeof siteContentHrefValues)[number], string> = {
  "/tecnicos": "Directorio de técnicos",
  "/registro-tecnico": "Registro de técnico",
  "/registro-empresa": "Registro de empresa",
  "/como-funciona": "Cómo funciona",
  "/preguntas-frecuentes": "Preguntas frecuentes",
  "/reportar": "Reportar un problema",
};

function ContentPreview({ entry }: Readonly<{ entry: AdminSiteContentEntry }>) {
  return (
    <div className="admin-content-preview" aria-label={`Vista publicada de ${entry.label}`}>
      <div className="admin-content-preview-heading">
        <AdminStatus tone={entry.published.enabled ? "success" : "neutral"}>
          {entry.published.enabled ? "Visible" : "Oculto"} · versión {entry.publishedVersion}
        </AdminStatus>
        <Link href="/" target="_blank">Abrir portada <ExternalLink aria-hidden="true" size={14} /></Link>
      </div>
      <span className="admin-content-eyebrow">{entry.published.eyebrow}</span>
      <h3>{entry.published.title}</h3>
      <p>{entry.published.body}</p>
      <div className="admin-content-preview-actions">
        <span>{entry.published.primaryCtaLabel}</span>
        {entry.published.secondaryCtaLabel ? <span>{entry.published.secondaryCtaLabel}</span> : null}
      </div>
    </div>
  );
}

export function SiteContentEditor({ entry }: Readonly<{ entry: AdminSiteContentEntry }>) {
  const [saveState, saveAction, savePending] = useActionState(saveSiteContentDraftAction, initialAdminActionState);
  const [publishState, publishAction, publishPending] = useActionState(publishSiteContentAction, initialAdminActionState);
  const hasDraft = entry.revision !== entry.publishedRevision;

  return (
    <article className="admin-content-card">
      <header className="admin-content-card-header">
        <div>
          <div className="admin-content-title-row">
            <h2>{entry.label}</h2>
            <AdminStatus tone={hasDraft ? "warning" : "success"}>{hasDraft ? "Borrador pendiente" : "Publicado"}</AdminStatus>
          </div>
          <p>{entry.description}</p>
        </div>
        <span className="admin-content-version">Revisión {entry.revision} · publicada {entry.publishedRevision}</span>
      </header>

      <div className="admin-content-layout">
        <form action={saveAction} className="admin-content-form">
          <input name="slot" type="hidden" value={entry.slot} />
          <input name="expectedRevision" type="hidden" value={entry.revision} />
          <label className="admin-content-toggle">
            <input defaultChecked={entry.draft.enabled} name="enabled" type="checkbox" />
            <span><strong>Mostrar este bloque en la portada</strong><small>Al desactivarlo, solo se ocultará cuando publiques el borrador.</small></span>
          </label>
          <div className="admin-content-form-grid">
            <label><span>Etiqueta superior</span><input defaultValue={entry.draft.eyebrow} maxLength={60} minLength={3} name="eyebrow" required /></label>
            <label className="is-wide"><span>Título</span><input defaultValue={entry.draft.title} maxLength={120} minLength={8} name="title" required /></label>
            <label className="is-wide"><span>Texto</span><textarea defaultValue={entry.draft.body} maxLength={500} minLength={20} name="body" required rows={4} /></label>
            <label><span>Botón principal</span><input defaultValue={entry.draft.primaryCtaLabel} maxLength={60} minLength={3} name="primaryCtaLabel" required /></label>
            <label><span>Destino principal</span><select defaultValue={entry.draft.primaryCtaHref} name="primaryCtaHref">{siteContentHrefValues.map((href) => <option key={href} value={href}>{destinationLabels[href]}</option>)}</select></label>
            <label><span>Botón secundario (opcional)</span><input defaultValue={entry.draft.secondaryCtaLabel} maxLength={60} name="secondaryCtaLabel" /></label>
            <label><span>Destino secundario</span><select defaultValue={entry.draft.secondaryCtaHref} name="secondaryCtaHref"><option value="">Sin botón secundario</option>{siteContentHrefValues.map((href) => <option key={href} value={href}>{destinationLabels[href]}</option>)}</select></label>
            <label className="is-wide"><span>Motivo del cambio</span><textarea maxLength={500} minLength={8} name="reason" placeholder="Ej.: actualizamos el mensaje para explicar mejor el funcionamiento del directorio." required rows={2} /><small>Este motivo y la versión anterior quedarán en Auditoría.</small></label>
          </div>
          <button className="button button-secondary" disabled={savePending} type="submit"><Save aria-hidden="true" size={16} /> {savePending ? "Guardando…" : "Guardar borrador"}</button>
          {saveState.message ? <p className="admin-action-feedback" data-status={saveState.status} role="status">{saveState.message}</p> : null}
        </form>

        <div className="admin-content-publish-panel">
          <ContentPreview entry={entry} />
          <form action={publishAction} className="admin-content-publish-form">
            <input name="slot" type="hidden" value={entry.slot} />
            <input name="expectedRevision" type="hidden" value={entry.revision} />
            <label><span>Motivo de publicación</span><textarea disabled={!hasDraft} maxLength={500} minLength={8} name="reason" placeholder="Ej.: contenido revisado y aprobado para la portada." required rows={3} /></label>
            <button className="button button-primary" disabled={!hasDraft || publishPending} type="submit"><Send aria-hidden="true" size={16} /> {publishPending ? "Publicando…" : hasDraft ? "Publicar este borrador" : "No hay cambios pendientes"}</button>
            <small>Publicar reemplaza la versión visible, conserva el historial y registra al administrador.</small>
            {publishState.message ? <p className="admin-action-feedback" data-status={publishState.status} role="status">{publishState.message}</p> : null}
          </form>
        </div>
      </div>
    </article>
  );
}
