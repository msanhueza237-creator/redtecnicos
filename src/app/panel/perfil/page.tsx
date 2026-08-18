import type { Metadata } from "next";
import { ProfileDemoForm } from "@/components/professional-panel/professional-panel-demo";
import {
  ProfessionalAvatarManager,
  ProfessionalMainProfileForm,
} from "@/components/professional-panel/professional-profile-forms";
import { PanelDemoNotice, PanelOperationalNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { getOwnedProfessionalProfile } from "@/lib/professional/profile";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Mi perfil | Panel profesional" };
export const dynamic = "force-dynamic";

export default async function ProfessionalProfileEditorPage() {
  if (isSupabaseAuthMode()) {
    const profile = await getOwnedProfessionalProfile();
    if (!profile) {
      return (
        <>
          <ProfessionalPanelHeader title="Mi perfil" description="Edita la información profesional que será revisada antes de publicarse." />
          <div className="professional-panel-notice is-danger" role="alert"><p>No encontramos un perfil profesional asociado a esta cuenta.</p></div>
        </>
      );
    }

    return (
      <>
        <ProfessionalPanelHeader title="Mi perfil" description="Actualiza tu presentación, fotografía y datos de contacto protegidos." />
        <PanelOperationalNotice>
          Los cambios se envían a revisión. Si ya tienes una ficha publicada, seguirá visible su última versión aprobada.
        </PanelOperationalNotice>
        {profile.reviewReason ? <div className="professional-panel-notice is-warning" role="note"><p><strong>Observación administrativa:</strong> {profile.reviewReason}</p></div> : null}
        <ProfessionalAvatarManager profile={profile} />
        <section className="professional-panel-card" aria-labelledby="public-profile-title">
          <div className="professional-panel-card-header">
            <div><h2 id="public-profile-title">Información profesional</h2><p>La información pública se actualizará después de ser aprobada.</p></div>
            <span className="professional-panel-status is-pending">{profile.status === "submitted" ? "En revisión" : "Editable"}</span>
          </div>
          <div className="professional-panel-card-body"><ProfessionalMainProfileForm profile={profile} /></div>
        </section>
      </>
    );
  }

  const { profile, account } = demoProfessionalPanel;
  return (
    <>
      <ProfessionalPanelHeader
        title="Mi perfil"
        description="Edita la presentación pública y revisa qué datos permanecen privados."
      />
      <PanelDemoNotice>
        Prueba el formulario con información ficticia. Guardar modifica solo esta pantalla y nunca publica cambios.
      </PanelDemoNotice>
      <div className="professional-panel-grid is-wide">
        <article className="professional-panel-card">
          <div className="professional-panel-card-header">
            <div><h2>Información pública</h2><p>Quedaría pendiente de revisión antes de reemplazar la versión aprobada.</p></div>
            <span className="professional-panel-status is-approved">Versión aprobada activa</span>
          </div>
          <div className="professional-panel-card-body">
            <ProfileDemoForm profile={profile} />
          </div>
        </article>
        <aside className="professional-panel-card">
          <div className="professional-panel-card-header"><div><h2>Datos privados</h2><p>No aparecen en el directorio público.</p></div></div>
          <div className="professional-panel-card-body">
            <dl className="detail-grid">
              <div><dt>Correo de acceso</dt><dd>{account.loginEmail}</dd></div>
              <div><dt>Estado del correo</dt><dd>Verificado · ejemplo</dd></div>
              <div><dt>Teléfono</dt><dd>{profile.phone}</dd></div>
              <div><dt>Origen</dt><dd>Fixtures locales</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}
