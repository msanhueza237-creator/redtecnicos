import type { Metadata } from "next";
import { SettingsDemoForm } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";

export const metadata: Metadata = { title: "Configuración | Panel profesional demo" };

export default function ProfessionalSettingsPage() {
  const { account, preferences } = demoProfessionalPanel;
  return (
    <>
      <ProfessionalPanelHeader
        title="Configuración"
        description="Ajusta notificaciones, disponibilidad y preferencias de la cuenta ficticia."
      />
      <PanelDemoNotice />
      <div className="professional-panel-grid is-wide">
        <section className="professional-panel-card" aria-labelledby="preferences-title">
          <div className="professional-panel-card-header"><div><h2 id="preferences-title">Preferencias</h2><p>Ejemplo editable durante esta visita.</p></div></div>
          <div className="professional-panel-card-body"><SettingsDemoForm preferences={preferences} /></div>
        </section>
        <aside className="professional-panel-card">
          <div className="professional-panel-card-header"><div><h2>Cuenta y seguridad</h2><p>Estado preparado para Supabase Auth.</p></div></div>
          <div className="professional-panel-card-body">
            <dl className="detail-grid">
              <div><dt>Correo</dt><dd>{account.loginEmail}</dd></div>
              <div><dt>Correo verificado</dt><dd>{account.emailVerified ? "Sí · demo" : "No"}</dd></div>
              <div><dt>Teléfono verificado</dt><dd>{account.phoneVerified ? "Sí · demo" : "No"}</dd></div>
              <div><dt>Autenticación en dos pasos</dt><dd>No configurada en fixtures</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}

