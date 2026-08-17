import type { Metadata } from "next";
import Image from "next/image";
import { GalleryModerationForm } from "@/components/admin/gallery-moderation-form";
import { AdminDemoNotice, AdminOperationalNotice, AdminPageHeading, AdminStatus } from "@/components/admin/admin-ui";
import { ModerationDecision } from "@/components/admin/demo-action";
import { adminGalleryItems, statusTone } from "@/data/admin-demo";
import { adminGalleryStatusLabel, adminGalleryStatusTone, listAdminGalleryItems } from "@/lib/admin/gallery";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Galerías | Administración" };
export const dynamic = "force-dynamic";

const categoryLabels = {
  industrial: "Refrigeración industrial",
  commercial: "Refrigeración comercial",
  residential: "Climatización residencial",
} as const;

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

export default async function AdminGalleriesPage() {
  if (isSupabaseAuthMode()) {
    const result = await listAdminGalleryItems();
    return (
      <section className="admin-page">
        <AdminPageHeading eyebrow="Operación real" title="Galerías" description="Revisa hasta tres trabajos por perfil antes de incorporarlos a la proyección pública." />
        <AdminOperationalNotice>Las imágenes provienen del almacenamiento privado. Aprobar, pedir cambios u ocultar actualiza la galería pública y registra la decisión en auditoría.</AdminOperationalNotice>
        {result.error ? <p className="auth-message" role="alert">{result.error}</p> : null}
        <div className="admin-gallery-review-grid">
          {result.data.map((item) => (
            <article className="admin-gallery-review-card" key={item.id}>
              <div className="admin-gallery-review-image"><Image alt={item.altText} fill sizes="(max-width: 760px) 100vw, 380px" src={item.imageUrl} unoptimized /></div>
              <div className="admin-gallery-review-body">
                <div className="admin-gallery-review-meta"><AdminStatus tone={adminGalleryStatusTone(item.status)}>{adminGalleryStatusLabel(item.status)}</AdminStatus><span>{item.id.slice(0, 8)}</span></div>
                <h2>{item.title}</h2>
                <p>{item.owner}</p>
                <p>{item.description}</p>
                <small>{categoryLabels[item.category]} · posición {item.displayOrder} · recibida {dateFormatter.format(new Date(item.createdAt))}</small>
                {item.reviewReason ? <p className="admin-action-feedback">Último motivo: {item.reviewReason}</p> : null}
                <GalleryModerationForm itemId={item.id} status={item.status} />
              </div>
            </article>
          ))}
        </div>
        {!result.data.length && !result.error ? <div className="admin-empty-state"><strong>Aún no hay fotografías cargadas</strong><p>Las imágenes enviadas por técnicos y empresas aparecerán aquí para revisión.</p></div> : null}
      </section>
    );
  }

  return (
    <section className="admin-page">
      <AdminPageHeading title="Galerías" description="Revisa hasta tres trabajos por perfil antes de incorporarlos a la proyección pública." />
      <AdminDemoNotice>Las fotografías son ilustrativas y locales. Ocultar, aprobar o pedir cambios solo produce una confirmación visible en esta demo.</AdminDemoNotice>
      <div className="admin-gallery-review-grid">
        {adminGalleryItems.map((item) => (
          <article className="admin-gallery-review-card" key={item.id}>
            <div className="admin-gallery-review-image"><Image alt={`Trabajo ficticio: ${item.title}`} fill sizes="(max-width: 760px) 100vw, 380px" src={item.imageSrc} /></div>
            <div className="admin-gallery-review-body">
              <div className="admin-gallery-review-meta"><AdminStatus tone={statusTone(item.status)}>{item.status}</AdminStatus><span>{item.id}</span></div>
              <h2>{item.title}</h2>
              <p>{item.owner}</p>
              <small>{item.category} · recibida {item.received}</small>
              <ModerationDecision actions={["Aprobar imagen", "Solicitar cambios", "Ocultar imagen"]} resource={item.id} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
