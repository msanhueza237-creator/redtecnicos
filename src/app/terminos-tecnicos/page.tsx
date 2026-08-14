import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Términos para técnicos" };
export default function TechnicianTermsPage() {
  return <ContentPage eyebrow="Condiciones profesionales" title="Términos para técnicos y empresas" introduction="Reglas provisionales para crear y mantener un perfil profesional voluntario." legalDraft sections={[
    { title: "Registro voluntario", paragraphs: ["El titular inicia el registro, declara que la información es verdadera y autoriza únicamente los datos seleccionados para publicación."] },
    { title: "Revisión y moderación", paragraphs: ["Red Técnicos Chile podrá solicitar cambios, rechazar o suspender perfiles cuando existan antecedentes incompletos, inconsistentes o riesgos graves."] },
    { title: "Independencia", paragraphs: ["El profesional actúa de manera independiente. Red Técnicos Chile no es empleador, representante ni parte de los acuerdos comerciales celebrados."] },
  ]} />;
}
