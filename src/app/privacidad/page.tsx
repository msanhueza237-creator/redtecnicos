import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Privacidad" };
export default function PrivacyPage() {
  return <ContentPage eyebrow="Tratamiento responsable" title="Política de privacidad" introduction="Principios provisionales para el tratamiento de datos de clientes y profesionales." legalDraft sections={[
    { title: "Datos mínimos", paragraphs: ["La plataforma recopilará solamente la información necesaria para registrar profesionales, facilitar contactos y proteger la seguridad del servicio."], items: ["No se crearán perfiles desde fuentes públicas.", "Los documentos privados nunca se mostrarán en el directorio.", "No se venderán datos personales ni se usarán para campañas sin consentimiento independiente."] },
    { title: "Solicitudes de contacto", paragraphs: ["Para registrar una solicitud se pedirán nombre, correo, celular, comuna, servicio y descripción. Estos datos se utilizarán para entregar el canal autorizado del profesional, mantener el historial privado y gestionar el seguimiento de la solicitud."], items: ["El contacto del profesional no forma parte de la API pública del directorio.", "Los tokens de seguimiento se almacenarán únicamente como hash.", "La información del cliente será visible solo para los roles autorizados y el profesional correspondiente cuando exista RLS."] },
    { title: "Evaluaciones vinculadas", paragraphs: ["La calificación, recomendación y comentario quedarán asociados a la solicitud completada para impedir evaluaciones duplicadas o ajenas al trabajo. Antes de una publicación pública se aplicarán las reglas de moderación y minimización de identidad definidas para producción."] },
    { title: "Control del titular", paragraphs: ["Los profesionales podrán revisar, corregir y solicitar la eliminación de sus datos, sujeto a obligaciones legales y períodos de retención documentados."] },
    { title: "Retención provisional", paragraphs: ["Los períodos propuestos deberán validarse jurídicamente antes de producción: solicitudes 24 meses, analítica 13 meses y consentimientos o auditoría 5 años."] },
  ]} />;
}
