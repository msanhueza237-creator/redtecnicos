"use server";

import { revalidatePath } from "next/cache";
import {
  orderedCoverageCommunes,
  professionalCoverageSchema,
  type CoverageActionState,
} from "@/domain/professional-coverage";
import { requireAppRole } from "@/lib/auth/session";
import { notifyAdministratorOfProfessionalChange } from "@/lib/professional/change-notifications";
import { createClient } from "@/lib/supabase/server";

interface CoverageRpcRow {
  updated_status: string;
}

export async function updateProfessionalCoverageAction(
  _previousState: CoverageActionState,
  formData: FormData,
): Promise<CoverageActionState> {
  const session = await requireAppRole(["technician", "company"], "/panel/cobertura");
  if (session.source !== "supabase" || !session.userId) {
    return { status: "error", message: "Esta acción requiere una sesión profesional real." };
  }

  const primaryCommune = String(formData.get("primaryCommune") ?? "");
  const communeNames = orderedCoverageCommunes(
    primaryCommune,
    formData.getAll("communes").map(String),
  );
  const parsed = professionalCoverageSchema.safeParse({
    regionCode: formData.get("regionCode"),
    primaryCommune,
    communeNames,
    modalities: formData.getAll("modalities").map(String),
    hasVehicle: formData.get("hasVehicle") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Revisa la cobertura seleccionada.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_owned_profile_coverage", {
    p_region_code: parsed.data.regionCode,
    p_commune_names: orderedCoverageCommunes(
      parsed.data.primaryCommune,
      parsed.data.communeNames,
    ),
    p_modalities: parsed.data.modalities,
    p_has_vehicle: parsed.data.hasVehicle,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("estado actual")
        ? "El estado actual del perfil no permite cambiar la cobertura. Contacta a administración."
        : "No fue posible guardar la cobertura. Inténtalo nuevamente.",
    };
  }

  await notifyAdministratorOfProfessionalChange(session, "Cobertura y comunas");

  revalidatePath("/panel");
  revalidatePath("/panel/cobertura");
  revalidatePath("/tecnicos");
  revalidatePath("/empresas");

  const rows = (data ?? []) as CoverageRpcRow[];
  const submittedForReview = rows[0]?.updated_status === "submitted";
  return {
    status: "success",
    message: submittedForReview
      ? "Cobertura guardada y enviada a revisión. La versión pública anterior seguirá visible hasta que administración apruebe el cambio."
      : "Cobertura guardada correctamente.",
  };
}
