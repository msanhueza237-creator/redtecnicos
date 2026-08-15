"use client";

import { usePathname } from "next/navigation";
import { MobileBottomNavigation } from "@/components/mobile-bottom-navigation";
import { DemoBanner, SiteFooter, SiteHeader } from "@/components/site-shell";
import type { UserRole } from "@/domain/directory";
import type { AppDataSource, AuthDataSource } from "@/lib/supabase/config";

interface AppChromeProps {
  authSource: AuthDataSource;
  children: React.ReactNode;
  dataSource: AppDataSource;
  sessionRole: UserRole | null;
}

export function AppChrome({
  authSource,
  children,
  dataSource,
  sessionRole,
}: Readonly<AppChromeProps>) {
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
      {dataSource === "fixtures" && <DemoBanner />}
      <SiteHeader authSource={authSource} sessionRole={sessionRole} />
      <main id="contenido-principal">{children}</main>
      <SiteFooter authSource={authSource} sessionRole={sessionRole} />
      <MobileBottomNavigation authSource={authSource} role={sessionRole} />
    </>
  );
}
