import type { Metadata } from "next";
import { RegistrationWizard } from "@/components/registration-wizard";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Registro para empresas" };

export default function CompanyRegistrationPage() {
  const supabaseMode = isSupabaseAuthMode();

  return (
    <>
      <header className="page-hero"><div className="container"><span className="eyebrow">Registro empresarial</span><h1>Presenta tu empresa de climatización</h1><p>Completa solo los datos necesarios para postular. La galería, la formación y los documentos se agregan después desde el panel.</p></div></header>
      <section className="section"><div className="container"><RegistrationWizard isLive={supabaseMode} kind="company" /></div></section>
    </>
  );
}
