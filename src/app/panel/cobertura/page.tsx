import type { Metadata } from "next";
import { CoverageDemoForm } from "@/components/professional-panel/professional-panel-demo";
import { ProfessionalCoverageForm } from "@/components/professional-panel/professional-coverage-form";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { regionNameFromCode } from "@/domain/professional-registration";
import { getOwnedProfessionalCoverage } from "@/lib/professional/coverage";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Cobertura | Panel profesional" };
export const dynamic = "force-dynamic";

export default async function ProfessionalCoveragePage() {
  if (isSupabaseAuthMode()) {
    const coverage = await getOwnedProfessionalCoverage();
    if (!coverage) {
      return (
        <>
          <ProfessionalPanelHeader title="Cobertura" description="Define las comunas y modalidades donde atiendes." />
          <div className="professional-panel-empty"><h2>No encontramos tu perfil</h2><p>Vuelve al resumen o contacta a administración para revisar tu cuenta.</p></div>
        </>
      );
    }

    return (
      <>
        <ProfessionalPanelHeader
          title="Cobertura"
          description="Elige tu comuna principal y todas las comunas donde realmente puedes atender solicitudes."
        />
        <div className="professional-panel-grid is-wide coverage-page-grid">
          <section className="professional-panel-card" aria-labelledby="coverage-form-title">
            <div className="professional-panel-card-header"><div><h2 id="coverage-form-title">Zona de atención</h2><p>La búsqueda del cliente usará exactamente estas comunas.</p></div></div>
            <div className="professional-panel-card-body">
              <ProfessionalCoverageForm
                initialCommuneNames={coverage.communeNames}
                initialHasVehicle={coverage.hasVehicle}
                initialModalities={coverage.modalities}
                initialRegionCode={coverage.regionCode}
                profileStatus={coverage.status}
              />
            </div>
          </section>
          <aside className="professional-panel-card coverage-summary-card">
            <div className="professional-panel-card-header"><div><h2>Resumen actual</h2><p>Información declarada en tu perfil privado.</p></div></div>
            <div className="professional-panel-card-body">
              <ul className="professional-panel-checklist">
                <li>Región: {regionNameFromCode(coverage.regionCode)}</li>
                <li>Comuna principal: {coverage.communeNames[0] ?? "Sin definir"}</li>
                <li>Comunas atendidas: {coverage.communeNames.length}</li>
                <li>La dirección particular nunca se publica</li>
              </ul>
            </div>
          </aside>
        </div>
      </>
    );
  }

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
