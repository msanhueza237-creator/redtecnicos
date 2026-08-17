import "server-only";

import type { ProfessionalKind } from "@/domain/directory";
import { isSupabaseMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface PublicReview {
  id: string;
  profileSlug: string;
  professionalName: string;
  professionalKind: ProfessionalKind;
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  commune: string;
  service: string;
  publishedAt: string;
  isDemo: boolean;
}

interface PublicReviewRow {
  review_id: string;
  profile_slug: string;
  professional_name: string;
  professional_kind: ProfessionalKind;
  review_rating: number;
  review_comment: string;
  would_recommend: boolean;
  requester_commune: string;
  requested_service: string;
  published_at: string;
}

const fixtureReviews: PublicReview[] = [
  {
    id: "review-demo-1",
    profileSlug: "climasur-demo-spa",
    professionalName: "ClimaSur Demo SpA",
    professionalKind: "company",
    rating: 5,
    comment: "Pude comparar cobertura y experiencia antes de solicitar el contacto. El proceso fue claro y rápido.",
    wouldRecommend: true,
    commune: "Puerto Montt",
    service: "Climatización residencial",
    publishedAt: "2026-07-12T12:00:00.000Z",
    isDemo: true,
  },
  {
    id: "review-demo-2",
    profileSlug: "tecnico-austral-ejemplo",
    professionalName: "Técnico Austral Ejemplo",
    professionalKind: "technician",
    rating: 5,
    comment: "La información del perfil me permitió entender los servicios y la cobertura antes de contactar.",
    wouldRecommend: true,
    commune: "Punta Arenas",
    service: "Diagnóstico técnico",
    publishedAt: "2026-07-10T15:30:00.000Z",
    isDemo: true,
  },
  {
    id: "review-demo-3",
    profileSlug: "refrigeracion-central-ficticia",
    professionalName: "Refrigeración Central Ficticia",
    professionalKind: "company",
    rating: 5,
    comment: "Encontramos una empresa con experiencia declarada en cámaras de frío y dejamos registrada la solicitud.",
    wouldRecommend: true,
    commune: "Valparaíso",
    service: "Cámaras de frío",
    publishedAt: "2026-07-08T10:15:00.000Z",
    isDemo: true,
  },
];

function mapRow(row: PublicReviewRow): PublicReview {
  return {
    id: row.review_id,
    profileSlug: row.profile_slug,
    professionalName: row.professional_name,
    professionalKind: row.professional_kind,
    rating: Number(row.review_rating),
    comment: row.review_comment,
    wouldRecommend: row.would_recommend,
    commune: row.requester_commune,
    service: row.requested_service,
    publishedAt: row.published_at,
    isDemo: false,
  };
}

export async function listPublicReviews(limit = 3): Promise<PublicReview[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 6);
  if (!isSupabaseMode()) return fixtureReviews.slice(0, safeLimit);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_public_reviews", { p_limit: safeLimit });
  if (error) {
    console.error("No fue posible cargar las evaluaciones públicas desde Supabase.");
    return [];
  }

  return ((data ?? []) as unknown as PublicReviewRow[]).map(mapRow);
}
