import type { Metadata } from "next";
import { RegistrationWizard } from "@/components/registration-wizard";

export const metadata: Metadata = { title: "Registro para empresas" };

export default function CompanyRegistrationPage() {
  return (
    <>
      <header className="page-hero"><div className="container"><span className="eyebrow">Registro empresarial</span><h1>Presenta tu empresa de climatización</h1><p>Completa cuatro pasos breves para informar servicios y cobertura. Los antecedentes adicionales se podrán agregar después.</p></div></header>
      <section className="section"><div className="container"><RegistrationWizard kind="company" /></div></section>
    </>
  );
}
