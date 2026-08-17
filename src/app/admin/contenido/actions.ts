"use server";

import { revalidatePath } from "next/cache";
import {
  siteContentEditorSchema,
  siteContentFromFormData,
  siteContentPublishSchema,
} from "@/domain/site-content";
import type { AdminActionState } from "@/lib/admin/action-state";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

async function requireContentAdministrator(): Promise<boolean> {
  const session = await getAppSession();
  return Boolean(
    session
    && session.source === "supabase"
    && ["admin", "superadmin"].includes(session.role),
  );
}

function mutationError(message: string): AdminActionState {
  if (message.includes("cambió") || message.includes("revision")) {
    return { status: "error", message: "Este bloque cambió en otra sesión. Actualiza la página antes de continuar." };
  }
  return { status: "error", message: "No fue posible guardar el contenido. Inténtalo nuevamente." };
}

export async function saveSiteContentDraftAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!await requireContentAdministrator()) {
    return { status: "error", message: "Tu sesión no tiene permisos para editar contenido público." };
  }

  const parsed = siteContentEditorSchema.safeParse(siteContentFromFormData(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los campos del bloque." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_site_content_draft", {
    p_slot: parsed.data.slot,
    p_expected_revision: parsed.data.expectedRevision,
    p_enabled: parsed.data.enabled,
    p_eyebrow: parsed.data.eyebrow,
    p_title: parsed.data.title,
    p_body: parsed.data.body,
    p_primary_cta_label: parsed.data.primaryCtaLabel,
    p_primary_cta_href: parsed.data.primaryCtaHref,
    p_secondary_cta_label: parsed.data.secondaryCtaLabel,
    p_secondary_cta_href: parsed.data.secondaryCtaHref,
    p_reason: parsed.data.reason,
  });
  if (error) return mutationError(error.message);

  revalidatePath("/admin/contenido");
  revalidatePath("/admin/auditoria");
  return { status: "success", message: "Borrador guardado. La portada todavía conserva la última versión publicada." };
}

export async function publishSiteContentAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!await requireContentAdministrator()) {
    return { status: "error", message: "Tu sesión no tiene permisos para publicar contenido." };
  }

  const parsed = siteContentPublishSchema.safeParse({
    slot: formData.get("slot"),
    expectedRevision: formData.get("expectedRevision"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa el motivo de publicación." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_site_content", {
    p_slot: parsed.data.slot,
    p_expected_revision: parsed.data.expectedRevision,
    p_reason: parsed.data.reason,
  });
  if (error) return mutationError(error.message);

  revalidatePath("/");
  revalidatePath("/admin/contenido");
  revalidatePath("/admin/auditoria");
  return { status: "success", message: "Versión publicada. El cambio ya está disponible en la portada." };
}
