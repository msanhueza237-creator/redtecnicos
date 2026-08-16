import type { ReactNode } from "react";
import Link from "next/link";
import { FlaskConical, ShieldCheck } from "lucide-react";
import type { AdminStatusTone } from "@/data/admin-demo";
import "./admin.css";

export function AdminPageHeading({ title, description, action, eyebrow = "Módulo de demostración" }: { title: string; description: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="admin-page-heading">
      <div>
        <span className="demo-pill">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminOperationalNotice({ children }: { children: ReactNode }) {
  return (
    <div className="admin-demo-notice is-operational" role="note">
      <ShieldCheck aria-hidden="true" size={18} />
      <p>{children}</p>
    </div>
  );
}

export function AdminDemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="admin-demo-notice" role="note">
      <FlaskConical aria-hidden="true" size={18} />
      <p>{children ?? "Todos los nombres, indicadores y registros de esta sección son ficticios. Ninguna acción modifica datos ni se conecta a servicios remotos."}</p>
    </div>
  );
}

export function AdminStatus({ children, tone }: { children: ReactNode; tone: AdminStatusTone }) {
  return <span className={`admin-status admin-status-${tone}`}>{children}</span>;
}

export function AdminTableCard({ title, description, children, action }: { title: string; description: string; children: ReactNode; action?: ReactNode }) {
  return (
    <article className="admin-table-card">
      <div className="admin-table-toolbar">
        <div><h2>{title}</h2><p>{description}</p></div>
        {action}
      </div>
      <div className="admin-table-scroll">{children}</div>
    </article>
  );
}

export function AdminCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card-header"><div><h3>{title}</h3>{description ? <p>{description}</p> : null}</div></div>
      {children}
    </article>
  );
}

export function AdminBackLink({ href, children }: { href: "/admin" | "/admin/postulaciones"; children: ReactNode }) {
  return <Link className="admin-table-link" href={href}>← {children}</Link>;
}
