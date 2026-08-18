import type { Metadata } from "next";
import { ServicesDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { ProfessionalServicesForm } from "@/components/professional-panel/professional-profile-forms";
import { PanelDemoNotice, PanelOperationalNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { getOwnedProfessionalProfile } from "@/lib/professional/profile";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Servicios | Panel profesional" };
export const dynamic = "force-dynamic";

export default async function ProfessionalServicesPage() {
  if (isSupabaseAuthMode()) {
    const profile = await getOwnedProfessionalProfile();
    return (
      <>
        <ProfessionalPanelHeader title="Servicios y especialidades" description="Indica qué trabajos realizas, marcas y tipos de equipos que conoces." />
        <PanelOperationalNotice>Los cambios quedarán pendientes de revisión antes de reemplazar la información pública aprobada.</PanelOperationalNotice>
        {profile ? (
          <section className="professional-panel-card" aria-labelledby="services-title">
            <div className="professional-panel-card-header"><div><h2 id="services-title">Oferta profesional</h2><p>Selecciona hasta seis servicios y agrega experiencia específica.</p></div></div>
            <div className="professional-panel-card-body"><ProfessionalServicesForm profile={profile} /></div>
          </section>
        ) : <div className="professional-panel-notice is-danger" role="alert"><p>No encontramos un perfil profesional asociado a esta cuenta.</p></div>}
      </>
    );
  }

  return (
    <>
      <ProfessionalPanelHeader
        title="Servicios"
        description="Administra qué especialidades se muestran y cuáles están disponibles para recibir solicitudes."
      />
      <PanelDemoNotice>
        Usa Pausar o Activar para ver un cambio inmediato de estado. No se modifica el directorio real.
      </PanelDemoNotice>
      <section className="professional-panel-card" aria-labelledby="services-title">
        <div className="professional-panel-card-header">
          <div><h2 id="services-title">Catálogo del perfil</h2><p>Cuatro servicios de demostración.</p></div>
          <span className="professional-panel-status is-neutral">Sin persistencia</span>
        </div>
        <ServicesDemoManager services={demoProfessionalPanel.services} />
      </section>
    </>
  );
}
