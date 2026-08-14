import { requireDemoRole } from "@/lib/auth/demo-session";

export const dynamic = "force-dynamic";

export default async function AdminAuditLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireDemoRole(["admin", "superadmin"], "/admin/auditoria");
  return children;
}
