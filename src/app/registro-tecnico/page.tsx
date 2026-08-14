import type { Metadata } from "next";
import { RegistrationWizard } from "@/components/registration-wizard";

export const metadata: Metadata = { title: "Registro para técnicos" };

export default function TechnicianRegistrationPage() {
  return (
    <>
      <header className="page-hero"><div className="container"><span className="eyebrow">Registro voluntario</span><h1>Crea tu perfil profesional</h1><p>Completa cuatro pasos breves con la información indispensable. Podrás mejorar el perfil después desde tu panel.</p></div></header>
      <section className="section"><div className="container"><RegistrationWizard kind="technician" /></div></section>
    </>
  );
}
