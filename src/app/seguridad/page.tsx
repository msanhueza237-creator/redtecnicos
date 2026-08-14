import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Seguridad" };
export default function SecurityPage() {
  return <ContentPage eyebrow="Protección por diseño" title="Seguridad de la plataforma" introduction="Controles previstos para proteger cuentas, documentos y solicitudes." sections={[
    { title: "Acceso y permisos", paragraphs: ["La arquitectura objetivo utiliza Supabase Auth, separación de roles y Row Level Security en todas las tablas expuestas."], items: ["Cada profesional accederá solamente a sus datos.", "Los documentos privados requerirán permisos específicos y URLs firmadas.", "Administradores usarán autenticación reforzada antes del lanzamiento."] },
    { title: "Archivos", paragraphs: ["Los archivos pasarán por cuarentena, validación de firma y MIME, eliminación de metadatos y análisis antimalware antes de su aprobación."] },
    { title: "Reporte responsable", paragraphs: ["Mientras no exista un canal especializado, los problemas podrán informarse mediante la página de reporte sin adjuntar información sensible."] },
  ]} />;
}
