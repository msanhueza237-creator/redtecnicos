"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ClipboardList,
  FileSearch,
  Images,
  LayoutDashboard,
  MessageSquareText,
  MessageSquareWarning,
  ScrollText,
  Settings,
  SlidersHorizontal,
  UserRoundSearch,
  UsersRound,
} from "lucide-react";
import type { AdminRole } from "@/lib/auth/roles";
import "./admin.css";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["moderator", "admin", "superadmin"] },
  { href: "/admin/postulaciones", label: "Postulaciones", icon: ClipboardList, roles: ["moderator", "admin", "superadmin"] },
  { href: "/admin/profesionales", label: "Profesionales", icon: UserRoundSearch, roles: ["moderator", "admin", "superadmin"] },
  { href: "/admin/documentos", label: "Documentos", icon: FileSearch, roles: ["moderator", "admin", "superadmin"] },
  { href: "/admin/galerias", label: "Galerías", icon: Images, roles: ["moderator", "admin", "superadmin"] },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: UsersRound, roles: ["moderator", "admin", "superadmin"] },
  { href: "/admin/evaluaciones", label: "Evaluaciones", icon: MessageSquareText, roles: ["moderator", "admin", "superadmin"] },
  { href: "/admin/reclamos", label: "Reclamos", icon: MessageSquareWarning, roles: ["moderator", "admin", "superadmin"] },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: Activity, roles: ["admin", "superadmin"] },
  { href: "/admin/contenido", label: "Contenido", icon: SlidersHorizontal, roles: ["admin", "superadmin"] },
  { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText, roles: ["admin", "superadmin"] },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, roles: ["admin", "superadmin"] },
] as const;

export function AdminNavigation({ role }: Readonly<{ role: AdminRole }>) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleItems = items.filter((item) =>
    (item.roles as readonly AdminRole[]).includes(role),
  );
  const activeHref = [...visibleItems]
    .reverse()
    .find((item) => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href))
    ?.href ?? "/admin";

  return (
    <>
      <label className="admin-mobile-navigation">
        <span>Sección administrativa</span>
        <select
          aria-label="Sección administrativa"
          onChange={(event) => router.push(event.target.value as Route)}
          value={activeHref}
        >
          {visibleItems.map((item) => <option key={item.href} value={item.href}>{item.label}</option>)}
        </select>
      </label>
      <nav aria-label="Secciones administrativas">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`admin-nav-link${isActive ? " is-active" : ""}`}
              href={href as Route}
              key={href}
            >
              <Icon aria-hidden="true" size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
