import type { Metadata } from "next";
import { AdminCard, AdminDemoNotice, AdminPageHeading } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";

export const metadata: Metadata = { title: "Configuración | Administración demo" };

const options = [
  ["Revisión documental obligatoria", "Solicitar revisión antes de publicar un perfil nuevo.", true],
  ["Moderación de evaluaciones", "Revisar comentarios antes de hacerlos públicos.", true],
  ["Registro de nuevas empresas", "Permitir postulaciones con tipo de entidad empresa.", true],
  ["Publicación automática", "Publicar cambios sensibles sin revisión humana.", false],
] as const;

export default function SettingsPage() {
  return (
    <section className="admin-page">
      <AdminPageHeading title="Configuración" description="Representación no persistente de las políticas operacionales de la plataforma." />
      <AdminDemoNotice>Los controles pueden cambiarse visualmente en el navegador, pero se restablecen al recargar y no afectan ningún flujo.</AdminDemoNotice>
      <AdminCard title="Reglas de moderación" description="Valores ficticios para revisar la interfaz">
        <div className="admin-settings-grid">
          {options.map(([title, description, enabled]) => <label className="admin-setting" key={title}><input defaultChecked={enabled} type="checkbox" /><span><strong>{title}</strong><span>{description}</span></span></label>)}
        </div>
        <div style={{ marginTop: 18 }}><DemoAction label="Simular guardado" variant="primary" confirmation="Configuración simulada. Los cambios no fueron guardados y se restablecerán al recargar." /></div>
      </AdminCard>
      <div style={{ marginTop: 20 }}>
        <AdminCard title="Retención provisional" description="Requiere validación jurídica antes de producción">
          <dl className="admin-info-list"><div><dt>Logs técnicos</dt><dd>90 días</dd></div><div><dt>Analítica</dt><dd>13 meses</dd></div><div><dt>Solicitudes</dt><dd>24 meses</dd></div><div><dt>Consentimientos y auditoría</dt><dd>5 años</dd></div></dl>
        </AdminCard>
      </div>
    </section>
  );
}
