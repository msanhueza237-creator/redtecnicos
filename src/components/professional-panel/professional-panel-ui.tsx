import type { Route } from "next";
import Link from "next/link";
import { ChevronRight, FlaskConical, ShieldCheck } from "lucide-react";

interface ProfessionalPanelHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

export function ProfessionalPanelHeader({
  title,
  description,
  eyebrow = "Panel profesional",
  actions,
}: Readonly<ProfessionalPanelHeaderProps>) {
  return (
    <header className="professional-panel-header">
      <div className="professional-panel-header-copy">
        <nav className="professional-panel-breadcrumbs" aria-label="Ruta del panel">
          <Link href="/panel">Panel</Link>
          <ChevronRight aria-hidden="true" size={14} />
          <span aria-current="page">{title}</span>
        </nav>
        <span className="professional-panel-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="professional-panel-header-actions">{actions}</div>}
    </header>
  );
}

export function PanelDemoNotice({ children }: Readonly<{ children?: React.ReactNode }>) {
  return (
    <div className="professional-panel-demo-notice" role="note">
      <FlaskConical aria-hidden="true" size={19} />
      <p>
        {children ?? "Ejemplo local: los cambios se muestran en esta pantalla y no guardan datos reales."}
      </p>
    </div>
  );
}

export function PanelOperationalNotice({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="professional-panel-notice is-success" role="note">
      <ShieldCheck aria-hidden="true" size={19} />
      <p>{children}</p>
    </div>
  );
}

export function PanelActionLink({
  href,
  children,
  secondary = false,
}: Readonly<{ href: Route; children: React.ReactNode; secondary?: boolean }>) {
  return (
    <Link className={`button ${secondary ? "button-secondary" : "button-primary"}`} href={href}>
      {children}
    </Link>
  );
}
