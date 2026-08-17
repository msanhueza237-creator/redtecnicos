"use server";

import { revalidatePath } from "next/cache";
import type { AdminActionState } from "@/lib/admin/action-state";
import { reviewModerationSchema } from "@/domain/review-moderation";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const decisionMessages = {
  publish: "La evaluación fue publicada y la calificación del perfil quedó actualizada.",
  reject: "La evaluación fue rechazada y no se mostrará públicamente.",
  hide: "La evaluación fue ocultada y dejó de contar en la calificación pública.",
} as const;

export async function moderateReviewAction(
  reviewId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !["moderator", "admin", "superadmin"].includes(session.role)) {
    return { status: "error", message: "Tu sesión no tiene permisos para moderar evaluaciones reales." };
  }

  const parsed = reviewModerationSchema.safeParse({
    reviewId,
    decision: formData.get("decision"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa la decisión." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_review", {
    target_review_id: parsed.data.reviewId,
    decision_key: parsed.data.decision,
    decision_reason: parsed.data.reason,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("condiciones")
        ? "La solicitud todavía no cumple las condiciones para publicar esta evaluación."
        : error.message.includes("estado actual") || error.message.includes("Solo se puede")
          ? "La evaluación cambió de estado. Actualiza la página y vuelve a revisar."
          : "No fue posible guardar la decisión. Vuelve a intentarlo.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/evaluaciones");
  revalidatePath("/tecnicos");
  revalidatePath("/empresas");
  return { status: "success", message: decisionMessages[parsed.data.decision] };
}
