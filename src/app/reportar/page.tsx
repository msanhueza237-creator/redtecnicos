import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ComplaintReportForm } from "@/components/complaint-report-form";
import { isSupabaseMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reportar un problema" };
export const dynamic = "force-dynamic";

export default function ReportPage() {
  const isLive = isSupabaseMode();
  return <>
    <header className="page-hero complaint-page-hero">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">Reportar un problema</span></nav>
        <span className="eyebrow">Canal de ayuda y seguridad</span>
        <h1>Reportar un problema</h1>
        <p>Informa una situación relacionada con un perfil, una solicitud de contacto, una evaluación o el uso de tus datos.</p>
      </div>
    </header>
    <section className="section complaint-page-section">
      <div className="container complaint-layout">
        <div className="complaint-introduction">
          <span className="eyebrow">Antes de enviar</span>
          <h2>Cuéntanos qué ocurrió</h2>
          <p>Revisaremos el caso con acceso restringido y cada decisión administrativa quedará registrada en auditoría.</p>
          <ul>
            <li>Entrega información concreta y verificable.</li>
            <li>No incluyas contraseñas, datos bancarios ni información médica.</li>
            <li>Conserva el número de caso que aparecerá al finalizar.</li>
          </ul>
        </div>
        <ComplaintReportForm isLive={isLive} />
      </div>
    </section>
  </>;
}
