"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AdminActionState } from "@/lib/admin/action-state";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  profileId: z.uuid(),
  decision: z.enum(["approve", "request_changes", "reject"]),
  reason: z.string().trim().min(8, "Escribe un motivo de al menos 8 caracteres.").max(1000),
});

const decisionMessages = {
  approve: "La postulación fue aprobada y su proyección pública quedó actualizada.",
  request_changes: "Se solicitaron cambios al profesional.",
  reject: "La postulación fue rechazada.",
} as const;

export async function moderateProfessionalApplicationAction(
  profileId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await getAppSession();
  if (!session || !["moderator", "admin", "superadmin"].includes(session.role)) {
    return { status: "error", message: "Tu sesión no tiene permisos para moderar postulaciones." };
  }

  const parsed = decisionSchema.safeParse({
    profileId,
    decision: formData.get("decision"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa la decisión." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_professional_profile", {
    target_profile_id: parsed.data.profileId,
    decision_key: parsed.data.decision,
    decision_reason: parsed.data.reason,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("información mínima")
        ? "El perfil todavía no contiene la información mínima para publicarse. Solicita cambios."
        : "No fue posible guardar la decisión. Vuelve a intentarlo.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: decisionMessages[parsed.data.decision] };
}
