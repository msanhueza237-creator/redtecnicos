import type { Metadata } from "next";
import { ProfessionalPanelShell } from "@/components/professional-panel/professional-panel-shell";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { requireDemoRole } from "@/lib/auth/demo-session";

export const metadata: Metadata = {
  title: "Panel profesional demo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfessionalPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireDemoRole(["technician"], "/panel");
  const professional = demoProfessionalPanel.professional;

  return (
    <ProfessionalPanelShell
      displayName={professional.displayName}
      initials={professional.initials}
    >
      {children}
    </ProfessionalPanelShell>
  );
}
