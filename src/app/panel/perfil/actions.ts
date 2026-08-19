"use server";

import { revalidatePath } from "next/cache";
import {
  professionalMainProfileSchema,
  type ProfessionalPanelActionState,
} from "@/domain/professional-profile";
import { requireAppRole } from "@/lib/auth/session";
import { notifyAdministratorOfProfessionalChange } from "@/lib/professional/change-notifications";
import { createClient } from "@/lib/supabase/server";

export async function updateProfessionalProfileAction(
  _previousState: ProfessionalPanelActionState,
  formData: FormData,
): Promise<ProfessionalPanelActionState> {
  const session = await requireAppRole(["technician", "company"], "/panel/perfil");
  if (session.source !== "supabase" || !session.userId) {
    return { status: "error", message: "Esta acción requiere una sesión profesional real." };
  }

  const parsed = professionalMainProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    headline: formData.get("headline"),
    summary: formData.get("summary"),
    categories: formData.getAll("categories").map(String),
    yearsExperience: formData.get("yearsExperience"),
    publicEmail: formData.get("publicEmail"),
    publicPhone: formData.get("publicPhone"),
    whatsappPhone: formData.get("whatsappPhone"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa la información del perfil." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_owned_professional_profile", {
    p_display_name: parsed.data.displayName,
    p_headline: parsed.data.headline,
    p_summary: parsed.data.summary,
    p_categories: parsed.data.categories,
    p_years_experience: parsed.data.yearsExperience,
    p_public_email: parsed.data.publicEmail,
    p_public_phone: parsed.data.publicPhone,
    p_whatsapp_phone: parsed.data.whatsappPhone,
  });
  if (error) {
    return {
      status: "error",
      message: error.message.includes("estado actual")
        ? "El estado actual del perfil no permite editarlo. Contacta a administración."
        : "No fue posible guardar el perfil. Inténtalo nuevamente.",
    };
  }

  await notifyAdministratorOfProfessionalChange(session, "Perfil principal y datos de contacto");

  revalidatePath("/panel");
  revalidatePath("/panel/perfil");
  revalidatePath("/admin/postulaciones");
  return {
    status: "success",
    message: "Cambios guardados y enviados a revisión. Tu ficha pública anterior seguirá visible hasta que sean aprobados.",
  };
}
