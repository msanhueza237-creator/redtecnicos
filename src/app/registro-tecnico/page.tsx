import type { Metadata } from "next";
import { RegistrationWizard } from "@/components/registration-wizard";
import { ProfessionalAccountForm } from "@/components/auth/professional-account-form";
import { isSupabaseMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Registro para técnicos" };

export default function TechnicianRegistrationPage() {
  const supabaseMode = isSupabaseMode();

  return (
    <>
      <header className="page-hero"><div className="container"><span className="eyebrow">Registro voluntario</span><h1>Crea tu perfil profesional</h1><p>{supabaseMode ? "Crea primero tu acceso seguro. Los servicios, la cobertura, la formación y la galería se completan después desde el panel." : "Completa cuatro pasos breves con la información indispensable. Podrás mejorar el perfil después desde tu panel."}</p></div></header>
      <section className="section"><div className="container">{supabaseMode ? <ProfessionalAccountForm kind="technician" /> : <RegistrationWizard kind="technician" />}</div></section>
    </>
  );
}
