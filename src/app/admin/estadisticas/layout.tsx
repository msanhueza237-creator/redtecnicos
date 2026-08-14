import { requireAppRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminStatisticsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAppRole(["admin", "superadmin"], "/admin/estadisticas");
  return children;
}
