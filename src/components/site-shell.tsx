import type { Route } from "next";
import Link from "next/link";
import { Menu, Snowflake } from "lucide-react";
import type { DemoRole } from "@/lib/auth/demo-session";

const navigation: Array<{ href: Route; label: string }> = [
  { href: "/tecnicos", label: "Buscar técnicos" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/registro-tecnico", label: "Soy técnico" },
];

function privateAreaLink(role: DemoRole | null): { href: Route; label: string } {
  if (role === "technician") {
    return { href: "/panel", label: "Panel profesional" };
  }

  if (role) {
    return { href: "/admin", label: "Administración" };
  }

  return { href: "/acceso-demo", label: "Ingreso profesional" };
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

export function SiteHeader({ sessionRole }: Readonly<{ sessionRole: DemoRole | null }>) {
  const privateArea = privateAreaLink(sessionRole);

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

export function SiteFooter({ sessionRole }: Readonly<{ sessionRole: DemoRole | null }>) {
  const privateArea = privateAreaLink(sessionRole);

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
        <div className="footer-bottom">
          <span>© 2026 Red Técnicos Chile. Prototipo local para revisión.</span>
          <span>No se reciben pagos ni se garantiza la ejecución de servicios.</span>
        </div>
      </div>
    </footer>
  );
}
