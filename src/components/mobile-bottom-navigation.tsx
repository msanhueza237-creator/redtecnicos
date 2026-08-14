"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  CircleUserRound,
  House,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/domain/directory";
import type { AppDataSource } from "@/lib/supabase/config";

interface MobileBottomNavigationProps {
  authMode?: AppDataSource;
  role?: UserRole | null;
}

interface MobileNavigationItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

function privateEntry(role: UserRole | null, authMode: AppDataSource): MobileNavigationItem {
  if (role === "admin" || role === "moderator" || role === "superadmin") {
    return {
      href: "/admin",
      label: "Administrar",
      icon: ShieldCheck,
      isActive: (pathname) => pathname.startsWith("/admin"),
    };
  }

  if (role === "technician" || role === "company") {
    return {
      href: "/panel",
      label: "Mi panel",
      icon: LayoutDashboard,
      isActive: (pathname) => pathname.startsWith("/panel"),
    };
  }

  return {
    href: (authMode === "supabase" ? "/ingresar" : "/acceso-demo") as Route,
    label: "Ingresar",
    icon: CircleUserRound,
    isActive: (pathname) => pathname.startsWith("/acceso-demo") || pathname.startsWith("/ingresar"),
  };
}

export function MobileBottomNavigation({
  authMode = "fixtures",
  role = null,
}: Readonly<MobileBottomNavigationProps>) {
  const pathname = usePathname();
  const items: MobileNavigationItem[] = [
    {
      href: "/",
      label: "Inicio",
      icon: House,
      isActive: (currentPathname) => currentPathname === "/",
    },
    {
      href: "/tecnicos",
      label: "Buscar",
      icon: Search,
      isActive: (currentPathname) =>
        currentPathname.startsWith("/tecnicos") ||
        currentPathname.startsWith("/empresas/"),
    },
    {
      href: "/como-funciona",
      label: "Cómo funciona",
      icon: Waypoints,
      isActive: (currentPathname) => currentPathname.startsWith("/como-funciona"),
    },
    privateEntry(role, authMode),
  ];

  return (
    <>
      <div className="mobile-bottom-spacer" aria-hidden="true" />
      <nav
        className="mobile-bottom-navigation"
        aria-label="Navegación principal móvil"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <Link
              className="mobile-bottom-link"
              href={item.href}
              key={item.href}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
