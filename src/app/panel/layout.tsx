import type { Metadata } from "next";
import { ProfessionalPanelShell } from "@/components/professional-panel/professional-panel-shell";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { requireAppRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Panel profesional",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfessionalPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAppRole(["technician", "company"], "/panel");
  const professional = demoProfessionalPanel.professional;
  const displayName = session.displayName ?? professional.displayName;
  const initials = displayName
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("es-CL") ?? "")
    .join("") || professional.initials;

  return (
    <ProfessionalPanelShell
      displayName={displayName}
      initials={initials}
      isDemo={session.source === "demo"}
    >
      {children}
    </ProfessionalPanelShell>
  );
}
