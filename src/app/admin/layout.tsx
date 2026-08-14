import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, LogOut, ShieldCheck } from "lucide-react";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { Brand } from "@/components/site-shell";
import {
  requireDemoRole,
  type DemoRole,
} from "@/lib/auth/demo-session";
import "@/components/admin/admin.css";

export const metadata: Metadata = {
  title: "Administración demo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const roleLabels: Record<DemoRole, string> = {
  technician: "Técnico",
  moderator: "Moderador",
  admin: "Administrador",
  superadmin: "Superadministrador",
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireDemoRole(
    ["moderator", "admin", "superadmin"],
    "/admin",
  );

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <Brand />
          <span aria-hidden="true" className="admin-topbar-divider" />
          <span className="admin-area-name">Administración</span>
        </div>
        <div className="admin-session">
          <span className="admin-session-copy">
            <span>Sesión demo</span>
            <strong>{roleLabels[session.role]}</strong>
          </span>
          <form action="/api/demo-auth/logout?area=administracion" method="post">
            <button className="admin-signout" type="submit">
              <LogOut aria-hidden="true" size={16} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <div className="admin-workspace">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title">
            <span className="icon-box"><ShieldCheck aria-hidden="true" size={20} /></span>
            <span>
              <strong>Centro de control</strong>
              <small>Datos 100% ficticios</small>
            </span>
          </div>
          <AdminNavigation role={session.role} />
          <div className="admin-sidebar-footer">
            <Link href="/">
              Volver al sitio público
              <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
            <p>Las acciones de este prototipo no modifican datos reales.</p>
          </div>
        </aside>

        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
