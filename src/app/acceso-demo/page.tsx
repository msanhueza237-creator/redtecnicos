import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Wrench } from "lucide-react";
import { enterTechnicianDemoAction, leaveDemoAction } from "./actions";
import { getDemoSession, isDemoAuthEnabled } from "@/lib/auth/demo-session";

export const metadata: Metadata = {
  title: "Acceso técnico de demostración",
  description: "Acceso local al panel profesional con datos completamente ficticios.",
};

export const dynamic = "force-dynamic";

interface DemoAccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DemoAccessPage({ searchParams }: DemoAccessPageProps) {
  const params = await searchParams;
  const enabled = isDemoAuthEnabled();
  const session = enabled ? await getDemoSession() : null;
  const requestedPath = firstQueryValue(params.next);
  const error = firstQueryValue(params.error);
  const loggedOut = firstQueryValue(params.logout) === "1";

  return (
    <>
      <header className="page-hero compact-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
            <span aria-current="page">Acceso técnico demo</span>
          </nav>
          <span className="eyebrow">Entorno local con datos ficticios</span>
          <h1>Revisa la experiencia del técnico</h1>
          <p>
            Este acceso crea una sesión temporal para recorrer el panel profesional. No utiliza
            cuentas, contraseñas ni información real.
          </p>
        </div>
      </header>

      <section className="section section-subtle">
        <div className="container">
          {!enabled ? (
            <div className="empty-state" role="status">
              <ShieldCheck className="icon-box" size={44} aria-hidden="true" />
              <h2>Acceso demo deshabilitado</h2>
              <p>
                Esta función requiere <code>APP_DATA_SOURCE=fixtures</code> y
                <code> DEMO_AUTH_ENABLED=true</code>. No está disponible al conectar otro
                origen de datos.
              </p>
              <Link className="button button-secondary" href="/">Volver al inicio</Link>
            </div>
          ) : (
            <>
              {(loggedOut || error) && (
                <div className="legal-note" role="status">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <p>
                    {loggedOut
                      ? "La sesión de demostración se cerró correctamente."
                      : "No fue posible iniciar el acceso técnico de demostración."}
                  </p>
                </div>
              )}

              {session?.role === "technician" && (
                <div className="dashboard-card" style={{ marginBlock: "20px" }}>
                  <div className="dashboard-card-header">
                    <div>
                      <span className="status-pill">Sesión demo activa</span>
                      <h2 style={{ marginTop: "12px" }}>Técnico</h2>
                      <p>La sesión se cerrará automáticamente después de ocho horas.</p>
                    </div>
                    <form action={leaveDemoAction}>
                      <button className="button button-secondary" type="submit">Cerrar sesión</button>
                    </form>
                  </div>
                </div>
              )}

              <article className="trust-card" style={{ maxWidth: "520px", margin: "24px auto 0" }}>
                <span className="icon-box"><Wrench size={22} aria-hidden="true" /></span>
                <h2 style={{ fontSize: "20px", margin: "17px 0 8px" }}>Panel profesional</h2>
                <p>Revisa el perfil, las solicitudes y los documentos del técnico.</p>
                <form action={enterTechnicianDemoAction} style={{ marginTop: "20px" }}>
                  {requestedPath && <input type="hidden" name="next" value={requestedPath} />}
                  <button className="button button-primary" type="submit">
                    Entrar como técnico
                  </button>
                </form>
              </article>
            </>
          )}
        </div>
      </section>
    </>
  );
}
