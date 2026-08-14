import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Preguntas frecuentes" };
export default function FaqPage() {
  return <ContentPage eyebrow="Respuestas directas" title="Preguntas frecuentes" introduction="Lo esencial sobre el directorio antes de registrarse o solicitar contacto." sections={[
    { title: "¿Red Técnicos Chile realiza instalaciones?", paragraphs: ["No. La plataforma funciona exclusivamente como directorio informativo y canal de contacto."] },
    { title: "¿Un perfil revisado está garantizado?", paragraphs: ["No. Una insignia confirma únicamente que cierta información fue presentada y revisada en una fecha específica."] },
    { title: "¿Se cobran comisiones?", paragraphs: ["La primera versión no procesa pagos, no fija precios y no cobra comisión por los trabajos."] },
    { title: "¿Cómo aparece un técnico?", paragraphs: ["El técnico o empresa debe registrarse voluntariamente, aceptar las condiciones, completar el perfil y enviarlo a revisión."] },
    { title: "¿Cómo puedo calificar un trabajo?", paragraphs: ["Después de solicitar el contacto, guarda el enlace privado de seguimiento. Cuando el servicio termine podrás confirmar el trabajo y enviar una sola evaluación. La opinión quedará pendiente de moderación antes de mostrarse públicamente."] },
  ]} />;
}
