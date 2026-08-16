import type { Metadata } from "next";
import { RegistrationWizard } from "@/components/registration-wizard";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Registro para técnicos" };
export const dynamic = "force-dynamic";

export default function TechnicianRegistrationPage() {
  const supabaseMode = isSupabaseAuthMode();

  return (
    <>
      <header className="page-hero"><div className="container"><span className="eyebrow">Registro voluntario</span><h1>Crea tu perfil profesional</h1><p>Completa solo la información indispensable para presentarte a clientes. La galería, la formación y los documentos se agregan después desde tu panel.</p></div></header>
      <section className="section"><div className="container"><RegistrationWizard isLive={supabaseMode} kind="technician" /></div></section>
    </>
  );
}
