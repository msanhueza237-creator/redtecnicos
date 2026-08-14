import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, UserCog } from "lucide-react";
import { enterAdminDemoAction } from "../actions";
import { isDemoAuthEnabled } from "@/lib/auth/demo-session";

export const metadata: Metadata = {
  title: "Acceso administrativo de demostración",
  description: "Acceso directo y no publicado al módulo administrativo del prototipo.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface AdminDemoAccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDemoAccessPage({ searchParams }: AdminDemoAccessPageProps) {
  const params = await searchParams;
  const enabled = isDemoAuthEnabled();
  const requestedPath = firstQueryValue(params.next);
  const error = firstQueryValue(params.error);
  const loggedOut = firstQueryValue(params.logout) === "1";

  return (
    <>
      <header className="page-hero compact-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
            <span aria-current="page">Administración demo</span>
          </nav>
          <span className="eyebrow">Acceso directo de revisión</span>
          <h1>Administración de la plataforma</h1>
          <p>
            Esta entrada existe únicamente para afinar el prototipo local. En la aplicación real
            será reemplazada por autenticación de Supabase y no se publicará en el sitio.
          </p>
        </div>
      </header>

      <section className="section section-subtle">
        <div className="container">
          {!enabled ? (
            <div className="empty-state" role="status">
              <ShieldCheck className="icon-box" size={44} aria-hidden="true" />
              <h2>Acceso administrativo demo deshabilitado</h2>
              <p>Este acceso solo funciona con el origen local de datos ficticios.</p>
              <Link className="button button-secondary" href="/">Volver al inicio</Link>
            </div>
          ) : (
            <>
              {(loggedOut || error) && (
                <div className="legal-note" role="status">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <p>
                    {loggedOut
                      ? "La sesión administrativa se cerró correctamente."
                      : "No fue posible iniciar la sesión administrativa de demostración."}
                  </p>
                </div>
              )}

              <article className="trust-card" style={{ maxWidth: "520px", margin: "24px auto 0" }}>
                <span className="icon-box"><UserCog size={22} aria-hidden="true" /></span>
                <h2 style={{ fontSize: "20px", margin: "17px 0 8px" }}>Administrador demo</h2>
                <p>Accede a todas las secciones del centro de control con información ficticia.</p>
                <form action={enterAdminDemoAction} style={{ marginTop: "20px" }}>
                  {requestedPath && <input type="hidden" name="next" value={requestedPath} />}
                  <button className="button button-primary" type="submit">
                    Entrar como administrador
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
