import type { Metadata } from "next";
import { ServicesDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";

export const metadata: Metadata = { title: "Servicios | Panel profesional demo" };

export default function ProfessionalServicesPage() {
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

