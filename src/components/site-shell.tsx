import type { Route } from "next";
import Link from "next/link";
import { Menu, Snowflake } from "lucide-react";
import type { UserRole } from "@/domain/directory";
import type { AuthDataSource } from "@/lib/supabase/config";
import { isAdminRole } from "@/lib/auth/roles";

const navigation: Array<{ href: Route; label: string }> = [
  { href: "/tecnicos", label: "Buscar técnicos" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/registro-tecnico", label: "Soy técnico" },
];

const discoveryLinks: Array<{ href: Route; label: string }> = [
  { href: "/servicios/instalacion-aire-acondicionado" as Route, label: "Instalación de aire acondicionado" },
  { href: "/servicios/mantencion-aire-acondicionado" as Route, label: "Mantención de aire acondicionado" },
  { href: "/servicios/refrigeracion-comercial" as Route, label: "Refrigeración comercial" },
  { href: "/servicios/camaras-de-frio" as Route, label: "Cámaras de frío" },
  { href: "/guias/como-elegir-tecnico-refrigeracion-climatizacion" as Route, label: "Cómo elegir un técnico" },
  { href: "/guias/como-redactar-solicitud-servicio-tecnico" as Route, label: "Cómo preparar una solicitud" },
];

function privateAreaLink(
  role: UserRole | null,
  authSource: AuthDataSource,
): { href: Route; label: string } {
  if (role === "technician" || role === "company") {
    return { href: "/panel", label: "Panel profesional" };
  }

  if (isAdminRole(role)) {
    return { href: "/admin", label: "Administración" };
  }

  return authSource === "supabase"
    ? { href: "/ingresar" as Route, label: "Ingresar" }
    : { href: "/acceso-demo", label: "Ingreso profesional" };
}

export function DemoBanner() {
  return (
    <div className="demo-banner" role="status">
      Versión de demostración · Todos los perfiles y datos mostrados son ficticios
    </div>
  );
}

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Red Técnicos Chile — Inicio">
      <span className="brand-symbol" aria-hidden="true">
        <Snowflake size={21} strokeWidth={2.6} />
      </span>
      <span className="brand-copy">
        <strong>Red Técnicos Chile</strong>
        <span>Refrigeración y climatización</span>
      </span>
    </Link>
  );
}

export function SiteHeader({
  authSource,
  sessionRole,
}: Readonly<{ authSource: AuthDataSource; sessionRole: UserRole | null }>) {
  const privateArea = privateAreaLink(sessionRole, authSource);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <Link className="nav-link" href={privateArea.href}>
            {privateArea.label}
          </Link>
          <Link className="button button-primary" href="/registro-tecnico">
            Publicar mi perfil
          </Link>
        </nav>
        <details className="mobile-menu">
          <summary aria-label="Abrir menú">
            <Menu size={22} aria-hidden="true" />
          </summary>
          <nav className="mobile-menu-panel" aria-label="Navegación móvil">
            {navigation.map((item) => (
              <Link className="nav-link" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link className="nav-link" href={privateArea.href}>
              {privateArea.label}
            </Link>
            <Link className="button button-primary" href="/registro-tecnico">
              Publicar mi perfil
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter({
  authSource,
  sessionRole,
}: Readonly<{ authSource: AuthDataSource; sessionRole: UserRole | null }>) {
  const privateArea = privateAreaLink(sessionRole, authSource);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h2>Red Técnicos Chile</h2>
            <p>
              Directorio informativo para consultar perfiles registrados voluntariamente y solicitar contacto directo.
            </p>
          </div>
          <div>
            <h3>Plataforma</h3>
            <div className="footer-links">
              <Link href="/tecnicos">Buscar técnicos</Link>
              <Link href="/como-funciona">Cómo funciona</Link>
              <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
              <Link href="/reportar">Reportar un problema</Link>
              <Link href={privateArea.href}>{privateArea.label}</Link>
            </div>
          </div>
          <div>
            <h3>Información legal</h3>
            <div className="footer-links">
              <Link href="/terminos-clientes">Términos para clientes</Link>
              <Link href="/terminos-tecnicos">Términos para técnicos</Link>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/seguridad">Seguridad</Link>
            </div>
          </div>
        </div>
        <nav className="footer-discovery-links" aria-label="Servicios y guías útiles">
          <span>Servicios y guías:</span>
          <div>
            {discoveryLinks.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </div>
        </nav>
        <div className="footer-bottom">
          <span>© 2026 Red Técnicos Chile. Prototipo local para revisión.</span>
          <span>No se reciben pagos ni se garantiza la ejecución de servicios.</span>
        </div>
      </div>
    </footer>
  );
}
