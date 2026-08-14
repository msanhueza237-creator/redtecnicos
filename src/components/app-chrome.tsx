"use client";

import { usePathname } from "next/navigation";
import { MobileBottomNavigation } from "@/components/mobile-bottom-navigation";
import { DemoBanner, SiteFooter, SiteHeader } from "@/components/site-shell";
import type { UserRole } from "@/domain/directory";
import type { AppDataSource } from "@/lib/supabase/config";

interface AppChromeProps {
  authMode: AppDataSource;
  children: React.ReactNode;
  sessionRole: UserRole | null;
}

export function AppChrome({ authMode, children, sessionRole }: Readonly<AppChromeProps>) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  if (isAdminArea) {
    return (
      <>
        <a className="skip-link" href="#contenido-principal">
          Ir al contenido principal
        </a>
        <main id="contenido-principal">{children}</main>
      </>
    );
  }

  return (
    <>
      <a className="skip-link" href="#contenido-principal">
        Ir al contenido principal
      </a>
      {authMode === "fixtures" && <DemoBanner />}
      <SiteHeader authMode={authMode} sessionRole={sessionRole} />
      <main id="contenido-principal">{children}</main>
      <SiteFooter authMode={authMode} sessionRole={sessionRole} />
      <MobileBottomNavigation authMode={authMode} role={sessionRole} />
    </>
  );
}
