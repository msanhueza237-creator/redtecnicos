import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !session.userId) {
    return NextResponse.json({ error: "Inicia sesión para consultar el documento." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Documento no válido." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("qualifications")
    .select("document_path")
    .eq("id", id)
    .maybeSingle();
  if (error || !item?.document_path) {
    return NextResponse.json({ error: "Documento no disponible." }, { status: 404 });
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("qualification-documents")
    .createSignedUrl(item.document_path, 5 * 60);
  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: "No fue posible abrir el documento privado." }, { status: 503 });
  }

  const response = NextResponse.redirect(signed.signedUrl, 307);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
