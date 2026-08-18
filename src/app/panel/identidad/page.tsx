import type { Metadata } from "next";
import { ProfessionalIdentityManager } from "@/components/professional-panel/professional-identity-manager";
import { PanelDemoNotice, PanelOperationalNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { getAppSession } from "@/lib/auth/session";
import { listOwnedIdentityDocuments } from "@/lib/professional/identity-documents";

export const metadata: Metadata = { title: "Identidad | Panel profesional" };
export const dynamic = "force-dynamic";

export default async function ProfessionalIdentityPage() {
  const session = await getAppSession();
  if (session?.source === "supabase" && session.userId) {
    const result = await listOwnedIdentityDocuments(session.userId);
    return <><ProfessionalPanelHeader title="Identidad y empresa" description="Solicita una insignia de identidad revisada mediante documentación privada." /><PanelOperationalNotice>Los archivos solo pueden abrirlos su propietario y el equipo administrativo autorizado.</PanelOperationalNotice>{result.error ? <div className="professional-panel-notice is-danger" role="alert"><p>{result.error}</p></div> : null}<ProfessionalIdentityManager initialItems={result.data} /></>;
  }
  return <><ProfessionalPanelHeader title="Identidad y empresa" description="Vista de demostración del futuro proceso privado de verificación." /><PanelDemoNotice>No cargues datos reales en la demo. En modo Supabase el documento pasa por controles de seguridad y revisión humana.</PanelDemoNotice></>;
}
