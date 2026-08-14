import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Términos para clientes" };
export default function ClientTermsPage() {
  return <ContentPage eyebrow="Condiciones de uso" title="Términos para clientes" introduction="Reglas provisionales para buscar y contactar profesionales mediante el directorio." legalDraft sections={[
    { title: "Rol de Red Técnicos Chile", paragraphs: ["Red Técnicos Chile facilita información y contacto. No presta, contrata, dirige ni supervisa los servicios ofrecidos."] },
    { title: "Acuerdo directo", paragraphs: ["La selección, presupuesto, materiales, pago, ejecución y garantía se acuerdan directamente entre cliente y profesional."] },
    { title: "Solicitud y contacto inmediato", paragraphs: ["Al enviar el formulario y aceptar el aviso, la solicitud quedará registrada y se mostrarán inmediatamente los canales autorizados del profesional. El cliente deberá utilizar esos datos exclusivamente para conversar sobre el servicio solicitado."] },
    { title: "Evaluaciones", paragraphs: ["El cliente podrá evaluar una sola vez al profesional vinculado a una solicitud confirmada como completada. La evaluación deberá corresponder a una experiencia real, no contener datos personales de terceros y podrá quedar sujeta a moderación antes de publicarse."] },
    { title: "Uso responsable", paragraphs: ["El cliente deberá entregar información veraz, respetar la privacidad de los profesionales y no utilizar sus canales de contacto para spam, reventa, acoso ni otros fines ilícitos o abusivos."] },
  ]} />;
}
