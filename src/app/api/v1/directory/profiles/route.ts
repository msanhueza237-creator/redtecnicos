import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { directoryFiltersSchema, filterProfessionals, projectPublicProfessional } from "@/domain/directory";
import { listDirectoryProfessionals } from "@/lib/directory/repository";
import { isSupabaseMode } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parsed = directoryFiltersSchema.safeParse({
    query: params.get("query") ?? "",
    region: params.get("region") ?? "",
    commune: params.get("commune") ?? "",
    service: params.get("service") ?? "",
    category: params.get("category") ?? "",
    kind: params.get("kind") ?? "",
    verifiedOnly: params.get("verifiedOnly") === "true",
    certifiedOnly: params.get("certifiedOnly") === "true",
    vehicleOnly: params.get("vehicleOnly") === "true",
    availability: params.get("availability") ?? "",
    modality: params.get("modality") ?? "",
    minimumExperience: Number(params.get("minimumExperience") ?? 0),
    minimumRating: Number(params.get("minimumRating") ?? 0),
    sort: params.get("sort") ?? "relevance",
  });

  if (!parsed.success) {
    return NextResponse.json({ data: null, error: { code: "INVALID_FILTERS", message: "Los filtros no son válidos." }, meta: null }, { status: 400 });
  }

  try {
    const professionals = await listDirectoryProfessionals();
    const enabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES !== "false";
    const data = filterProfessionals(professionals, parsed.data, enabled).map(projectPublicProfessional);
    return NextResponse.json({ data, error: null, meta: { total: data.length, source: isSupabaseMode() ? "supabase" : "fixtures" } });
  } catch {
    return NextResponse.json({ data: null, error: { code: "DIRECTORY_UNAVAILABLE", message: "El directorio no está disponible temporalmente." }, meta: null }, { status: 503 });
  }
}
