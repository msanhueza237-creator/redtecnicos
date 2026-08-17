import "server-only";

import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface OwnedProfessionalCoverage {
  id: string;
  regionCode: string;
  communeNames: string[];
  modalities: string[];
  hasVehicle: boolean;
  status: string;
}

interface CoverageRow {
  id: string;
  region_code: string | null;
  commune_codes: string[];
  modalities: string[];
  has_vehicle: boolean;
  status: string;
}

export async function getOwnedProfessionalCoverage(): Promise<OwnedProfessionalCoverage | null> {
  const session = await getAppSession();
  if (!session?.userId || session.source !== "supabase") return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("id,region_code,commune_codes,modalities,has_vehicle,status")
    .eq("owner_user_id", session.userId)
    .maybeSingle();

  if (error) {
    throw new Error("No fue posible consultar la cobertura del perfil.", { cause: error });
  }
  if (!data) return null;

  const row = data as CoverageRow;
  return {
    id: row.id,
    regionCode: row.region_code ?? "",
    communeNames: row.commune_codes ?? [],
    modalities: row.modalities ?? [],
    hasVehicle: row.has_vehicle,
    status: row.status,
  };
}
