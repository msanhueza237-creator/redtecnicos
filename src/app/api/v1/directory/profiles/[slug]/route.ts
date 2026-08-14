import { NextResponse } from "next/server";
import { getProfessionalBySlug } from "@/data/demo-professionals";
import { projectPublicProfessional } from "@/domain/directory";

interface Context {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES !== "false";
  const professional = enabled ? getProfessionalBySlug(slug) : undefined;

  if (!professional) {
    return NextResponse.json({ data: null, error: { code: "NOT_FOUND", message: "Perfil no encontrado." }, meta: null }, { status: 404 });
  }

  return NextResponse.json({ data: projectPublicProfessional(professional), error: null, meta: { source: "fixtures" } });
}
