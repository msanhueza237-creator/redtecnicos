import type { Metadata } from "next";
import { ProfileDemoForm } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";

export const metadata: Metadata = { title: "Mi perfil | Panel profesional demo" };

export default function ProfessionalProfileEditorPage() {
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

