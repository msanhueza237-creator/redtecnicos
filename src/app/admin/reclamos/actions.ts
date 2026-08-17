"use server";

import { revalidatePath } from "next/cache";
import { complaintAdminUpdateSchema } from "@/domain/complaint";
import type { AdminActionState } from "@/lib/admin/action-state";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updateComplaintAction(
  complaintId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await getAppSession();
  if (!session || !["moderator", "admin", "superadmin"].includes(session.role)) {
    return { status: "error", message: "Tu sesión no tiene permisos para gestionar reclamos." };
  }

  const parsed = complaintAdminUpdateSchema.safeParse({
    complaintId,
    status: formData.get("status"),
    priority: formData.get("priority"),
    reason: formData.get("reason"),
    resolutionSummary: formData.get("resolutionSummary"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa la decisión." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_complaint_case", {
    p_complaint_id: parsed.data.complaintId,
    p_status: parsed.data.status,
    p_priority: parsed.data.priority,
    p_reason: parsed.data.reason,
    p_resolution_summary: parsed.data.resolutionSummary,
  });
  if (error) return { status: "error", message: "No fue posible actualizar el reclamo. Inténtalo nuevamente." };

  revalidatePath("/admin");
  revalidatePath("/admin/reclamos");
  revalidatePath(`/admin/reclamos/${complaintId}`);
  revalidatePath("/admin/auditoria");
  return { status: "success", message: "El caso fue actualizado y la decisión quedó registrada en auditoría." };
}
