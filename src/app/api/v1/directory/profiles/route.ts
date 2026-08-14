import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { demoProfessionals } from "@/data/demo-professionals";
import { directoryFiltersSchema, filterProfessionals, projectPublicProfessional } from "@/domain/directory";

export function GET(request: NextRequest) {
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

  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES !== "false";
  const data = filterProfessionals(demoProfessionals, parsed.data, enabled).map(projectPublicProfessional);
  return NextResponse.json({ data, error: null, meta: { total: data.length, source: "fixtures" } });
}
