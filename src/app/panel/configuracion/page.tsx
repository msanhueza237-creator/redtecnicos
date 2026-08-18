import type { Metadata } from "next";
import { SettingsDemoForm } from "@/components/professional-panel/professional-panel-demo";
import { ProfessionalPreferencesForm } from "@/components/professional-panel/professional-profile-forms";
import { PanelDemoNotice, PanelOperationalNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { getAppSession } from "@/lib/auth/session";
import { getOwnedProfessionalProfile } from "@/lib/professional/profile";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Configuración | Panel profesional" };
export const dynamic = "force-dynamic";

export default async function ProfessionalSettingsPage() {
  if (isSupabaseAuthMode()) {
    const [profile, session] = await Promise.all([getOwnedProfessionalProfile(), getAppSession()]);
    return (
      <>
        <ProfessionalPanelHeader title="Disponibilidad y datos comerciales" description="Controla si recibes solicitudes e informa tus condiciones de atención." />
        <PanelOperationalNotice>La recepción de solicitudes cambia inmediatamente. Los datos comerciales se publican solo después de revisión.</PanelOperationalNotice>
        <div className="professional-panel-grid is-wide">
          <section className="professional-panel-card" aria-labelledby="preferences-title">
            <div className="professional-panel-card-header"><div><h2 id="preferences-title">Preferencias profesionales</h2><p>Mantén estos datos actualizados para evitar contactos fuera de disponibilidad.</p></div></div>
            <div className="professional-panel-card-body">{profile ? <ProfessionalPreferencesForm profile={profile} /> : <p>No encontramos tu perfil profesional.</p>}</div>
          </section>
          <aside className="professional-panel-card">
            <div className="professional-panel-card-header"><div><h2>Cuenta y seguridad</h2><p>Información privada de autenticación.</p></div></div>
            <div className="professional-panel-card-body"><dl className="detail-grid"><div><dt>Correo de acceso</dt><dd>{session?.email ?? "No disponible"}</dd></div><div><dt>Sesión</dt><dd>Protegida por Supabase Auth</dd></div><div><dt>Rol</dt><dd>{session?.role === "company" ? "Empresa" : "Técnico"}</dd></div></dl></div>
          </aside>
        </div>
      </>
    );
  }

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
