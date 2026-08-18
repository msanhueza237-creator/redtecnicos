"use server";

import { revalidatePath } from "next/cache";
import {
  professionalPreferencesSchema,
  type ProfessionalPanelActionState,
} from "@/domain/professional-profile";
import { requireAppRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updateProfessionalPreferencesAction(
  _previousState: ProfessionalPanelActionState,
  formData: FormData,
): Promise<ProfessionalPanelActionState> {
  const session = await requireAppRole(["technician", "company"], "/panel/configuracion");
  if (session.source !== "supabase" || !session.userId) {
    return { status: "error", message: "Esta acción requiere una sesión profesional real." };
  }

  const parsed = professionalPreferencesSchema.safeParse({
    availability: formData.get("availability"),
    workingHours: formData.get("workingHours"),
    emergencyAvailable: formData.get("emergencyAvailable") === "on",
    acceptsNewRequests: formData.get("acceptsNewRequests") === "on",
    issuesInvoice: formData.get("issuesInvoice") === "on",
    issuesReceipt: formData.get("issuesReceipt") === "on",
    writtenQuotes: formData.get("writtenQuotes") === "on",
    declaredWarranty: formData.get("declaredWarranty"),
    paymentMethods: formData.getAll("paymentMethods").map(String),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa la configuración." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_owned_professional_preferences", {
    p_availability: parsed.data.availability,
    p_working_hours: parsed.data.workingHours,
    p_emergency_available: parsed.data.emergencyAvailable,
    p_accepts_new_requests: parsed.data.acceptsNewRequests,
    p_issues_invoice: parsed.data.issuesInvoice,
    p_issues_receipt: parsed.data.issuesReceipt,
    p_written_quotes: parsed.data.writtenQuotes,
    p_declared_warranty: parsed.data.declaredWarranty,
    p_payment_methods: parsed.data.paymentMethods,
  });
  if (error) {
    return { status: "error", message: "No fue posible guardar la disponibilidad y preferencias." };
  }

  revalidatePath("/");
  revalidatePath("/panel");
  revalidatePath("/panel/configuracion");
  return {
    status: "success",
    message: "Disponibilidad actualizada inmediatamente. Los datos comerciales quedaron enviados a revisión.",
  };
}
