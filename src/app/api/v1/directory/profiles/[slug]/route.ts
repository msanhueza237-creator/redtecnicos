import { NextResponse } from "next/server";
import { projectPublicProfessional } from "@/domain/directory";
import { getDirectoryProfessional } from "@/lib/directory/repository";
import { isSupabaseMode } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES !== "false";
  const professional = enabled || isSupabaseMode() ? await getDirectoryProfessional(slug) : undefined;

  if (!professional) {
    return NextResponse.json({ data: null, error: { code: "NOT_FOUND", message: "Perfil no encontrado." }, meta: null }, { status: 404 });
  }

  return NextResponse.json({ data: projectPublicProfessional(professional), error: null, meta: { source: isSupabaseMode() ? "supabase" : "fixtures" } });
}
