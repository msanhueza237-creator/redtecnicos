import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ContactRequestTracker } from "@/components/contact-request-tracker";

export const metadata: Metadata = {
  title: "Seguimiento privado de solicitud",
  description: "Seguimiento privado de una solicitud de contacto y evaluación del trabajo realizado.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function TrackingPage({
  params,
}: Readonly<{ params: Promise<{ trackingToken: string }> }>) {
  const { trackingToken } = await params;

  return (
    <section className="tracking-section">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <ChevronRight aria-hidden="true" size={13} />
          <span aria-current="page">Seguimiento privado</span>
        </nav>
        <ContactRequestTracker trackingToken={trackingToken} />
      </div>
    </section>
  );
}
