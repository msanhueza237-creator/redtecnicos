import type { Metadata } from "next";
import { CoverageDemoForm } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";

export const metadata: Metadata = { title: "Cobertura | Panel profesional demo" };

export default function ProfessionalCoveragePage() {
  return (
    <>
      <ProfessionalPanelHeader
        title="Cobertura"
        description="Define las comunas y modalidades en las que el perfil ficticio acepta solicitudes."
      />
      <PanelDemoNotice />
      <div className="professional-panel-grid is-wide">
        <section className="professional-panel-card" aria-labelledby="coverage-form-title">
          <div className="professional-panel-card-header"><div><h2 id="coverage-form-title">Zona de atención</h2><p>Selecciona una o más comunas del ejemplo.</p></div></div>
          <div className="professional-panel-card-body">
            <CoverageDemoForm coverage={demoProfessionalPanel.coverage} />
          </div>
        </section>
        <aside className="professional-panel-card">
          <div className="professional-panel-card-header"><div><h2>Vista resumida</h2><p>Información que orienta los filtros.</p></div></div>
          <div className="professional-panel-card-body">
            <ul className="professional-panel-checklist">
              <li>Región: {demoProfessionalPanel.coverage.region}</li>
              <li>Modalidades: {demoProfessionalPanel.coverage.modalities.join(" · ")}</li>
              <li>Distancia geográfica: fuera de este MVP</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

