import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiEnvelope } from "@/domain/contact-request";
import { getAppSession } from "@/lib/auth/session";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0" } as const;
function errorResponse(code: string, message: string, status: number) { return NextResponse.json({ data: null, error: { code, message }, meta: { source: "supabase" } } satisfies ApiEnvelope<never>, { status, headers }); }

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !session.userId || !["technician", "company"].includes(session.role)) return errorResponse("UNAUTHORIZED", "Tu sesión no permite retirar documentos.", 401);
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return errorResponse("INVALID_ID", "Documento no válido.", 400);
  const supabase = await createClient();
  const { data: profile } = await supabase.from("professional_profiles").select("id").eq("owner_user_id", session.userId).maybeSingle();
  if (!profile) return errorResponse("PROFILE_NOT_FOUND", "No encontramos tu perfil.", 404);
  const { data: item } = await supabase.from("identity_documents").select("id,document_path,status").eq("id", id).eq("profile_id", profile.id).maybeSingle();
  if (!item) return errorResponse("DOCUMENT_NOT_FOUND", "El documento ya no está disponible.", 404);
  if (!['pending_review', 'changes_requested', 'rejected'].includes(item.status)) return errorResponse("DOCUMENT_LOCKED", "Un documento aprobado requiere revisión administrativa para retirarse.", 409);
  let privileged;
  try { privileged = createPrivilegedClient(); } catch { return errorResponse("SECURE_STORAGE_UNAVAILABLE", "El almacenamiento privado no está disponible.", 503); }
  const { error } = await privileged.from("identity_documents").delete().eq("id", id).eq("profile_id", profile.id);
  if (error) return errorResponse("DELETE_FAILED", "No fue posible retirar el documento.", 503);
  await privileged.storage.from("identity-documents").remove([item.document_path]);
  return NextResponse.json({ data: { id }, error: null, meta: { source: "supabase" } } satisfies ApiEnvelope<{ id: string }>, { headers });
}
