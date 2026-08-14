import { requireAppRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminContentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAppRole(["admin", "superadmin"], "/admin/contenido");
  return children;
}
