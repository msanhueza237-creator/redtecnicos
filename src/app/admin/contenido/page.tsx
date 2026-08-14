import type { Metadata } from "next";
import { AdminCard, AdminDemoNotice, AdminPageHeading, AdminStatus } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";

export const metadata: Metadata = { title: "Contenido | Administración demo" };

export default function ContentPage() {
  return (
    <section className="admin-page">
      <AdminPageHeading title="Contenido público" description="Previsualiza mensajes operacionales y piezas informativas antes de publicarlas en el sitio." />
      <AdminDemoNotice>Editar o publicar contenido solo genera una confirmación visual. Esta demo no modifica redtecnicos.cl.</AdminDemoNotice>
      <div className="admin-stack">
        <AdminCard title="Aviso del directorio" description="Mensaje informativo visible para clientes">
          <div className="admin-content-preview"><AdminStatus tone="success">Activo · demo</AdminStatus><h3 style={{ margin: "14px 0 7px" }}>Encuentra profesionales de climatización en tu zona</h3><p className="admin-card-copy">Compara perfiles registrados voluntariamente y solicita contacto directo. Verifica siempre el alcance y las condiciones antes de contratar.</p></div>
          <div className="admin-actions" style={{ marginTop: 16 }}><DemoAction label="Editar aviso" /><DemoAction label="Previsualizar" /></div>
        </AdminCard>
        <AdminCard title="Mensaje para profesionales" description="Llamado de incorporación al directorio">
          <div className="admin-content-preview"><AdminStatus tone="info">Borrador · demo</AdminStatus><h3 style={{ margin: "14px 0 7px" }}>Haz visible tu experiencia</h3><p className="admin-card-copy">Crea un perfil profesional, declara tu cobertura y presenta antecedentes para revisión.</p></div>
          <div className="admin-actions" style={{ marginTop: 16 }}><DemoAction label="Editar borrador" /><DemoAction label="Simular publicación" variant="primary" /></div>
        </AdminCard>
      </div>
    </section>
  );
}
