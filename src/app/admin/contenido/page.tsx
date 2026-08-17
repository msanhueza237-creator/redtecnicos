import type { Metadata } from "next";
import { FileClock, ShieldCheck } from "lucide-react";
import {
  AdminCard,
  AdminDemoNotice,
  AdminOperationalNotice,
  AdminPageHeading,
  AdminStatus,
} from "@/components/admin/admin-ui";
import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { defaultSiteContent, siteContentSlotKeys } from "@/domain/site-content";
import { listAdminSiteContent } from "@/lib/content/repository";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Contenido | Administración" };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  if (!isSupabaseAuthMode()) {
    return (
      <section className="admin-page">
        <AdminPageHeading title="Contenido público" description="Revisa cómo funciona el editor seguro de los bloques principales de la portada." />
        <AdminDemoNotice>En el entorno local se muestran valores ficticios. En producción, cada cambio se guarda como borrador, exige un motivo y solo llega al sitio después de publicarlo.</AdminDemoNotice>
        <div className="admin-stack">
          {siteContentSlotKeys.map((slot) => {
            const content = defaultSiteContent[slot];
            return <AdminCard description="Vista local sin persistencia" key={slot} title={slot === "home_directory_notice" ? "Aviso del directorio" : "Llamado para profesionales"}>
              <div className="admin-content-preview"><AdminStatus tone="info">Ejemplo local</AdminStatus><h3>{content.title}</h3><p className="admin-card-copy">{content.body}</p></div>
            </AdminCard>;
          })}
        </div>
      </section>
    );
  }

  const result = await listAdminSiteContent();
  return (
    <section className="admin-page admin-content-page">
      <AdminPageHeading
        eyebrow="Operación real"
        title="Contenido público"
        description="Edita bloques controlados de la portada sin HTML libre y publica solo cuando la versión esté revisada."
      />
      <AdminOperationalNotice>La portada conserva la última versión publicada mientras editas. Guardar o publicar requiere un motivo, valida destinos internos y registra el cambio en Auditoría.</AdminOperationalNotice>
      {result.error ? <p className="auth-message" role="alert">{result.error}</p> : null}
      <div className="admin-content-safety" role="note">
        <ShieldCheck aria-hidden="true" size={20} />
        <div><strong>Edición acotada y segura</strong><p>No se admite HTML, scripts ni enlaces externos. Los avisos legales permanecen fuera de este editor.</p></div>
        <span><FileClock aria-hidden="true" size={15} /> Historial versionado</span>
      </div>
      <div className="admin-stack">
        {result.data.map((entry) => <SiteContentEditor entry={entry} key={entry.slot} />)}
      </div>
      {!result.data.length && !result.error ? <div className="admin-empty-state"><strong>No hay bloques configurados</strong><p>Aplica la migración de contenido para habilitar el editor.</p></div> : null}
    </section>
  );
}
