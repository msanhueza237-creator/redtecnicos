import { requireDemoRole } from "@/lib/auth/demo-session";

export const dynamic = "force-dynamic";

export default async function AdminSettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireDemoRole(["admin", "superadmin"], "/admin/configuracion");
  return children;
}
