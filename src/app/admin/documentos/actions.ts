"use server";

import { revalidatePath } from "next/cache";
import { qualificationModerationSchema } from "@/domain/professional-qualification";
import { identityDocumentModerationSchema } from "@/domain/identity-document";
import type { AdminActionState } from "@/lib/admin/action-state";
import { getAppSession } from "@/lib/auth/session";
import { sendIdentityDecisionEmail, sendQualificationDecisionEmail } from "@/lib/email/smtp";
import { createClient } from "@/lib/supabase/server";

const messages = {
  approve: "El antecedente fue aprobado y la formación pública quedó actualizada.",
  request_changes: "Se solicitaron cambios y el antecedente dejó de mostrarse públicamente.",
  reject: "El antecedente fue rechazado y no se mostrará públicamente.",
} as const;

export async function moderateQualificationAction(
  qualificationId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !["moderator", "admin", "superadmin"].includes(session.role)) {
    return { status: "error", message: "Tu sesión no tiene permisos para revisar documentos reales." };
  }

  const parsed = qualificationModerationSchema.safeParse({
    qualificationId,
    decision: formData.get("decision"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa la decisión." };

  const supabase = await createClient();
  const { data: item, error: itemError } = await supabase
    .from("qualifications")
    .select("id,profile_id,title")
    .eq("id", parsed.data.qualificationId)
    .maybeSingle();
  if (itemError || !item) return { status: "error", message: "El antecedente ya no está disponible." };

  const { error } = await supabase.rpc("moderate_qualification", {
    target_qualification_id: parsed.data.qualificationId,
    decision_key: parsed.data.decision,
    decision_reason: parsed.data.reason,
  });
  if (error) {
    return {
      status: "error",
      message: error.message.includes("seguridad")
        ? "Este archivo no tiene un análisis de seguridad válido y no puede aprobarse."
        : error.message.includes("estado actual")
          ? "El antecedente cambió de estado. Actualiza la página y vuelve a revisarlo."
          : "No fue posible guardar la decisión. Vuelve a intentarlo.",
    };
  }

  const [{ data: profile }, { data: contact }] = await Promise.all([
    supabase.from("professional_profiles").select("display_name").eq("id", item.profile_id).maybeSingle(),
    supabase.from("professional_contacts").select("public_email").eq("profile_id", item.profile_id).maybeSingle(),
  ]);

  let email: "sent" | "failed" | "skipped" = "skipped";
  if (contact?.public_email) {
    email = await sendQualificationDecisionEmail({
      applicantEmail: contact.public_email,
      applicantName: profile?.display_name ?? "Profesional",
      qualificationTitle: item.title,
      decision: parsed.data.decision === "approve"
        ? "approved"
        : parsed.data.decision === "request_changes" ? "changes_requested" : "rejected",
      reason: parsed.data.reason,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/documentos");
  revalidatePath("/panel");
  revalidatePath("/panel/formacion");
  revalidatePath("/panel/documentos");
  revalidatePath("/tecnicos");
  revalidatePath("/empresas");

  const emailSuffix = email === "failed" ? " La decisión se guardó, pero el correo no pudo enviarse." : "";
  return { status: "success", message: `${messages[parsed.data.decision]}${emailSuffix}` };
}

export async function moderateIdentityDocumentAction(
  documentId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !["moderator", "admin", "superadmin"].includes(session.role)) return { status: "error", message: "Tu sesión no permite revisar identidad." };
  const parsed = identityDocumentModerationSchema.safeParse({ documentId, decision: formData.get("decision"), reason: formData.get("reason") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa la decisión." };
  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase.from("identity_documents").select("profile_id").eq("id", parsed.data.documentId).maybeSingle();
  if (documentError || !document) return { status: "error", message: "El documento ya no está disponible." };
  const { error } = await supabase.rpc("moderate_identity_document", { target_document_id: parsed.data.documentId, decision_key: parsed.data.decision, decision_reason: parsed.data.reason });
  if (error) return { status: "error", message: error.message.includes("estado actual") ? "El documento cambió de estado. Actualiza la página." : "No fue posible guardar la decisión." };
  const [{ data: profile }, { data: contact }] = await Promise.all([supabase.from("professional_profiles").select("display_name").eq("id", document.profile_id).maybeSingle(), supabase.from("professional_contacts").select("public_email").eq("profile_id", document.profile_id).maybeSingle()]);
  let email: "sent" | "failed" | "skipped" = "skipped";
  if (contact?.public_email) email = await sendIdentityDecisionEmail({ applicantEmail: contact.public_email, applicantName: profile?.display_name ?? "Profesional", decision: parsed.data.decision === "approve" ? "approved" : parsed.data.decision === "request_changes" ? "changes_requested" : "rejected", reason: parsed.data.reason });
  revalidatePath("/"); revalidatePath("/admin"); revalidatePath("/admin/documentos"); revalidatePath("/panel/identidad"); revalidatePath("/tecnicos"); revalidatePath("/empresas");
  const message = parsed.data.decision === "approve" ? "Identidad aprobada. La insignia pública quedó actualizada." : parsed.data.decision === "request_changes" ? "Se solicitaron cambios y se retiró la insignia pública." : "Documento rechazado y se retiró la insignia pública.";
  return { status: "success", message: `${message}${email === "failed" ? " La decisión se guardó, pero el correo no pudo enviarse." : ""}` };
}
