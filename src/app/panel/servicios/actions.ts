"use server";

import { revalidatePath } from "next/cache";
import {
  professionalServicesProfileSchema,
  splitOptionalList,
  type ProfessionalPanelActionState,
} from "@/domain/professional-profile";
import { requireAppRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updateProfessionalServicesAction(
  _previousState: ProfessionalPanelActionState,
  formData: FormData,
): Promise<ProfessionalPanelActionState> {
  const session = await requireAppRole(["technician", "company"], "/panel/servicios");
  if (session.source !== "supabase" || !session.userId) {
    return { status: "error", message: "Esta acción requiere una sesión profesional real." };
  }

  const parsed = professionalServicesProfileSchema.safeParse({
    services: formData.getAll("services").map(String),
    specialties: splitOptionalList(formData.get("specialties")),
    brands: splitOptionalList(formData.get("brands")),
    equipmentTypes: splitOptionalList(formData.get("equipmentTypes")),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los servicios seleccionados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_owned_professional_services", {
    p_services: parsed.data.services,
    p_specialties: parsed.data.specialties,
    p_brands: parsed.data.brands,
    p_equipment_types: parsed.data.equipmentTypes,
  });
  if (error) {
    return {
      status: "error",
      message: error.message.includes("estado actual")
        ? "El estado actual del perfil no permite editar servicios. Contacta a administración."
        : "No fue posible guardar los servicios. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/panel");
  revalidatePath("/panel/servicios");
  revalidatePath("/admin/postulaciones");
  return { status: "success", message: "Servicios y especialidades guardados y enviados a revisión." };
}
