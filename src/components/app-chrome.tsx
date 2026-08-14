"use client";

import { usePathname } from "next/navigation";
import { MobileBottomNavigation } from "@/components/mobile-bottom-navigation";
import { DemoBanner, SiteFooter, SiteHeader } from "@/components/site-shell";
import type { DemoRole } from "@/lib/auth/demo-session";

interface AppChromeProps {
  children: React.ReactNode;
  sessionRole: DemoRole | null;
}

export function AppChrome({ children, sessionRole }: Readonly<AppChromeProps>) {
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
      <DemoBanner />
      <SiteHeader sessionRole={sessionRole} />
      <main id="contenido-principal">{children}</main>
      <SiteFooter sessionRole={sessionRole} />
      <MobileBottomNavigation role={sessionRole} />
    </>
  );
}
