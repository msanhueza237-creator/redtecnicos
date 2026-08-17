import type { Metadata } from "next";
import { AdminCard, AdminDemoNotice, AdminOperationalNotice, AdminPageHeading } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { SmtpTestForm } from "@/components/admin/smtp-test-form";
import { registrationNotificationStatus, smtpConfigurationStatus } from "@/lib/email/smtp";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Configuración | Administración" };

const options = [
  ["Revisión documental obligatoria", "Solicitar revisión antes de publicar un perfil nuevo.", true],
  ["Moderación de evaluaciones", "Revisar comentarios antes de hacerlos públicos.", true],
  ["Registro de nuevas empresas", "Permitir postulaciones con tipo de entidad empresa.", true],
  ["Publicación automática", "Publicar cambios sensibles sin revisión humana.", false],
] as const;

export default function SettingsPage() {
  const isLive = isSupabaseAuthMode();
  const smtpConfigured = smtpConfigurationStatus() === "configured";
  const registrationNotificationsConfigured = registrationNotificationStatus() === "configured";

  return (
    <section className="admin-page">
      <AdminPageHeading eyebrow={isLive ? "Operación real" : "Módulo de demostración"} title="Configuración" description={isLive ? "Estado de servicios y políticas operacionales de la plataforma." : "Representación no persistente de las políticas operacionales de la plataforma."} />
      {isLive ? <AdminOperationalNotice>Las pruebas de correo se ejecutan con la sesión administrativa y nunca muestran las credenciales SMTP.</AdminOperationalNotice> : <AdminDemoNotice>Los controles pueden cambiarse visualmente en el navegador, pero se restablecen al recargar y no afectan ningún flujo.</AdminDemoNotice>}
      {isLive ? <AdminCard title="Correo transaccional SMTP" description={smtpConfigured ? "Variables requeridas presentes" : "Configuración incompleta"}>
        <dl className="admin-info-list"><div><dt>Estado</dt><dd>{smtpConfigured ? "Configurado" : "Pendiente"}</dd></div><div><dt>Nuevas postulaciones</dt><dd>{registrationNotificationsConfigured ? "Aviso administrativo activo" : "Falta ADMIN_NOTIFICATION_EMAIL"}</dd></div><div><dt>Correo al postulante</dt><dd>{smtpConfigured ? "Confirmación de estado activa" : "Pendiente"}</dd></div><div><dt>Destinatario de prueba</dt><dd>Administrador autenticado</dd></div></dl>
        <div style={{ marginTop: 18 }}><SmtpTestForm configured={smtpConfigured} /></div>
      </AdminCard> : null}
      <div style={{ marginTop: isLive ? 20 : 0 }}>
      <AdminCard title="Reglas de moderación" description="Valores ficticios para revisar la interfaz">
        <div className="admin-settings-grid">
          {options.map(([title, description, enabled]) => <label className="admin-setting" key={title}><input defaultChecked={enabled} type="checkbox" /><span><strong>{title}</strong><span>{description}</span></span></label>)}
        </div>
        <div style={{ marginTop: 18 }}><DemoAction label="Simular guardado" variant="primary" confirmation="Configuración simulada. Los cambios no fueron guardados y se restablecerán al recargar." /></div>
      </AdminCard>
      </div>
      <div style={{ marginTop: 20 }}>
        <AdminCard title="Retención provisional" description="Requiere validación jurídica antes de producción">
          <dl className="admin-info-list"><div><dt>Logs técnicos</dt><dd>90 días</dd></div><div><dt>Analítica</dt><dd>13 meses</dd></div><div><dt>Solicitudes</dt><dd>24 meses</dd></div><div><dt>Consentimientos y auditoría</dt><dd>5 años</dd></div></dl>
        </AdminCard>
      </div>
    </section>
  );
}
