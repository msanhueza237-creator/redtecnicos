import type { Metadata } from "next";
import Image from "next/image";
import { AdminDemoNotice, AdminPageHeading, AdminStatus } from "@/components/admin/admin-ui";
import { ModerationDecision } from "@/components/admin/demo-action";
import { adminGalleryItems, statusTone } from "@/data/admin-demo";

export const metadata: Metadata = { title: "Galerías | Administración demo" };

export default function AdminGalleriesPage() {
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
