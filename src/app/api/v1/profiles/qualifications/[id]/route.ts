import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiEnvelope } from "@/domain/contact-request";
import { getAppSession } from "@/lib/auth/session";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;

function responseError(code: string, message: string, status: number) {
  return NextResponse.json(
    { data: null, error: { code, message }, meta: { source: "supabase" } } satisfies ApiEnvelope<never>,
    { status, headers: privateHeaders },
  );
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !session.userId || !["technician", "company"].includes(session.role)) {
    return responseError("UNAUTHORIZED", "Tu sesión no permite retirar documentos.", 401);
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return responseError("INVALID_ID", "El documento indicado no es válido.", 400);

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("owner_user_id", session.userId)
    .maybeSingle();
  if (profileError || !profile) return responseError("PROFILE_NOT_FOUND", "No encontramos tu perfil profesional.", 404);

  const { data: item, error: itemError } = await supabase
    .from("qualifications")
    .select("id,document_path,status")
    .eq("id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (itemError || !item) return responseError("DOCUMENT_NOT_FOUND", "El documento ya no está disponible.", 404);
  if (!["pending_review", "changes_requested", "rejected"].includes(item.status)) {
    return responseError("DOCUMENT_LOCKED", "Un antecedente aprobado solo puede modificarse después de una revisión administrativa.", 409);
  }

  let privileged;
  try {
    privileged = createPrivilegedClient();
  } catch {
    return responseError("SECURE_STORAGE_UNAVAILABLE", "El almacenamiento documental seguro no está disponible.", 503);
  }

  const { error: deleteError } = await privileged.from("qualifications").delete().eq("id", id).eq("profile_id", profile.id);
  if (deleteError) return responseError("DELETE_FAILED", "No fue posible retirar el antecedente.", 503);
  if (item.document_path) await privileged.storage.from("qualification-documents").remove([item.document_path]);

  return NextResponse.json(
    { data: { id }, error: null, meta: { source: "supabase" } } satisfies ApiEnvelope<{ id: string }>,
    { headers: privateHeaders },
  );
}
