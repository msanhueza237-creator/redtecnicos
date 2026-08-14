import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Reportar un problema" };
export default function ReportPage() {
  return <ContentPage eyebrow="Canal de demostración" title="Reportar un problema" introduction="El flujo real de reclamos se implementará en un ciclo posterior." sections={[
    { title: "En este prototipo", paragraphs: ["No existe envío ni persistencia. No ingreses nombres, teléfonos, correos, documentos, direcciones ni antecedentes reales."] },
    { title: "Flujo previsto", paragraphs: ["La versión funcional recibirá el reporte, clasificará su gravedad, solicitará antecedentes cuando sea necesario y registrará toda decisión administrativa."], items: ["Los antecedentes serán privados.", "Podrá aplicarse una suspensión preventiva ante riesgos graves.", "La resolución quedará respaldada en auditoría."] },
  ]} />;
}
