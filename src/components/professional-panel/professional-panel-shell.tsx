"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderCheck,
  GraduationCap,
  Image as Images,
  Inbox,
  LogOut,
  MapPinned,
  MessageSquareText,
  Settings,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";

const panelNavigation = [
  { href: "/panel", label: "Resumen", icon: UserRound },
  { href: "/panel/perfil", label: "Mi perfil", icon: UserRound },
  { href: "/panel/servicios", label: "Servicios", icon: Wrench },
  { href: "/panel/cobertura", label: "Cobertura", icon: MapPinned },
  { href: "/panel/documentos", label: "Documentos", icon: FolderCheck },
  { href: "/panel/identidad", label: "Identidad", icon: ShieldCheck },
  { href: "/panel/formacion", label: "Formación", icon: GraduationCap },
  { href: "/panel/galeria", label: "Galería", icon: Images },
  { href: "/panel/solicitudes", label: "Solicitudes", icon: Inbox },
  { href: "/panel/evaluaciones", label: "Evaluaciones", icon: MessageSquareText },
  { href: "/panel/configuracion", label: "Configuración", icon: Settings },
] as const;

interface ProfessionalPanelShellProps {
  children: React.ReactNode;
  displayName: string;
  initials: string;
  isDemo: boolean;
}

function PanelNavigation({ mobile = false }: Readonly<{ mobile?: boolean }>) {
  const pathname = usePathname();

  return (
    <nav
      className="professional-panel-nav"
      aria-label={mobile ? "Secciones del panel móvil" : "Secciones del panel profesional"}
    >
      {panelNavigation.map(({ href, icon: Icon, label }) => {
        const active = href === "/panel" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`professional-panel-nav-link${active ? " is-active" : ""}`}
            href={href as Route}
            key={href}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ProfessionalPanelShell({
  children,
  displayName,
  initials,
  isDemo,
}: Readonly<ProfessionalPanelShellProps>) {
  return (
    <section className="professional-panel-section">
      <div className="container professional-panel-shell">
        <aside className="professional-panel-sidebar">
          <div className="professional-panel-identity">
            <span className="avatar" aria-hidden="true">{initials}</span>
            <span>
              <strong>{displayName}</strong>
              <small>{isDemo ? "Perfil técnico ficticio" : "Cuenta profesional"}</small>
            </span>
          </div>
          <PanelNavigation />
          <form action="/api/auth/logout" method="post">
            <button className="professional-panel-nav-link" type="submit">
              <LogOut aria-hidden="true" size={18} />
              <span>{isDemo ? "Cerrar sesión demo" : "Cerrar sesión"}</span>
            </button>
          </form>
        </aside>

        <details className="professional-panel-mobile-summary">
          <summary>Secciones del panel</summary>
          <PanelNavigation mobile />
        </details>

        <div className="professional-panel-content">{children}</div>
      </div>
    </section>
  );
}
