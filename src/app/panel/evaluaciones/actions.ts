"use server";

import { revalidatePath } from "next/cache";
import {
  professionalReviewReplySchema,
  type ProfessionalPanelActionState,
} from "@/domain/professional-profile";
import { requireAppRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function replyToProfessionalReviewAction(
  _previousState: ProfessionalPanelActionState,
  formData: FormData,
): Promise<ProfessionalPanelActionState> {
  const session = await requireAppRole(["technician", "company"], "/panel/evaluaciones");
  if (session.source !== "supabase") return { status: "error", message: "Esta acción requiere una sesión profesional real." };

  const parsed = professionalReviewReplySchema.safeParse({
    reviewId: formData.get("reviewId"),
    reply: formData.get("reply"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa tu respuesta." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reply_to_owned_review", {
    target_review_id: parsed.data.reviewId,
    reply_text: parsed.data.reply,
  });
  if (error) {
    return { status: "error", message: error.message.includes("ya tiene") ? "Esta evaluación ya tiene una respuesta." : "No fue posible publicar tu respuesta." };
  }

  revalidatePath("/panel/evaluaciones");
  revalidatePath("/tecnicos");
  revalidatePath("/empresas");
  return { status: "success", message: "Respuesta publicada. Por transparencia, solo se permite una respuesta por evaluación." };
}
