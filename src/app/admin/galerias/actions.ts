"use server";

import { revalidatePath } from "next/cache";
import { galleryModerationSchema } from "@/domain/professional-gallery";
import type { AdminActionState } from "@/lib/admin/action-state";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const messages = {
  approve: "La fotografía fue aprobada y la galería pública quedó actualizada.",
  request_changes: "Se solicitaron cambios al profesional y la fotografía dejó de mostrarse públicamente.",
  hide: "La fotografía fue ocultada y retirada de la galería pública.",
} as const;

export async function moderateGalleryItemAction(
  itemId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !["moderator", "admin", "superadmin"].includes(session.role)) {
    return { status: "error", message: "Tu sesión no tiene permisos para moderar galerías reales." };
  }

  const parsed = galleryModerationSchema.safeParse({
    itemId,
    decision: formData.get("decision"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa la decisión." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_portfolio_item", {
    target_item_id: parsed.data.itemId,
    decision_key: parsed.data.decision,
    decision_reason: parsed.data.reason,
  });
  if (error) {
    return {
      status: "error",
      message: error.message.includes("estado actual") || error.message.includes("ya está")
        ? "La fotografía cambió de estado. Actualiza la página y vuelve a revisarla."
        : "No fue posible guardar la decisión. Vuelve a intentarlo.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/galerias");
  revalidatePath("/panel/galeria");
  revalidatePath("/tecnicos");
  revalidatePath("/empresas");
  return { status: "success", message: messages[parsed.data.decision] };
}
