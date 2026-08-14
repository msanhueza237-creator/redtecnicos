import { requireDemoRole } from "@/lib/auth/demo-session";

export const dynamic = "force-dynamic";

export default async function AdminContentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireDemoRole(["admin", "superadmin"], "/admin/contenido");
  return children;
}
