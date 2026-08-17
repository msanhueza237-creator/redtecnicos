import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiEnvelope } from "@/domain/contact-request";
import { getAppSession } from "@/lib/auth/session";
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
    return responseError("UNAUTHORIZED", "Tu sesión no permite retirar fotografías.", 401);
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return responseError("INVALID_ID", "La fotografía indicada no es válida.", 400);

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("owner_user_id", session.userId)
    .maybeSingle();
  if (profileError || !profile) return responseError("PROFILE_NOT_FOUND", "No encontramos tu perfil profesional.", 404);

  const { data: item, error: itemError } = await supabase
    .from("portfolio_items")
    .select("id,storage_path,status")
    .eq("id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (itemError || !item) return responseError("IMAGE_NOT_FOUND", "La fotografía ya no está disponible.", 404);
  if (!["pending_review", "changes_requested"].includes(item.status)) {
    return responseError("IMAGE_LOCKED", "Una fotografía aprobada u oculta solo puede gestionarse desde administración.", 409);
  }

  const { error: deleteError } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (deleteError) return responseError("DELETE_FAILED", "No fue posible retirar la fotografía.", 503);

  await supabase.storage.from("gallery-images").remove([item.storage_path]);
  return NextResponse.json(
    { data: { id }, error: null, meta: { source: "supabase" } } satisfies ApiEnvelope<{ id: string }>,
    { headers: privateHeaders },
  );
}
