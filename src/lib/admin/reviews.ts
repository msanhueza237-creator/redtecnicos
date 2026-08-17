import "server-only";

import type { ReviewStatus } from "@/domain/review-moderation";
import { createClient } from "@/lib/supabase/server";

export interface AdminReview {
  id: string;
  requestId: string;
  professionalProfileId: string;
  professionalName: string;
  professionalSlug: string;
  professionalKind: "technician" | "company";
  customerName: string;
  customerEmail: string;
  service: string;
  requestStatus: string;
  emailVerified: boolean;
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  status: ReviewStatus;
  moderationReason: string | null;
  moderatedAt: string | null;
  createdAt: string;
}

interface ReviewRow {
  id: string;
  contact_request_id: string;
  professional_profile_id: string;
  rating: number;
  comment: string;
  would_recommend: boolean;
  status: ReviewStatus;
  moderation_reason: string | null;
  moderated_at: string | null;
  created_at: string;
}

interface RequestRow {
  id: string;
  requester_name: string;
  requester_email: string;
  requested_service: string;
  status: string;
  requester_email_verified_at: string | null;
}

interface ProfileRow {
  profile_id: string;
  display_name: string;
  slug: string;
  kind: "technician" | "company";
}

export interface AdminReviewsResult {
  data: AdminReview[];
  error: string | null;
}

export async function listAdminReviews(limit = 100): Promise<AdminReviewsResult> {
  const supabase = await createClient();
  const { data: reviewData, error: reviewError } = await supabase
    .from("reviews")
    .select("id,contact_request_id,professional_profile_id,rating,comment,would_recommend,status,moderation_reason,moderated_at,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (reviewError) {
    return { data: [], error: "No fue posible cargar las evaluaciones desde Supabase." };
  }

  const reviews = (reviewData ?? []) as unknown as ReviewRow[];
  if (!reviews.length) return { data: [], error: null };

  const requestIds = [...new Set(reviews.map((review) => review.contact_request_id))];
  const profileIds = [...new Set(reviews.map((review) => review.professional_profile_id))];
  const [{ data: requestData, error: requestError }, { data: profileData, error: profileError }] = await Promise.all([
    supabase
      .from("contact_requests")
      .select("id,requester_name,requester_email,requested_service,status,requester_email_verified_at")
      .in("id", requestIds),
    supabase
      .from("directory_profiles")
      .select("profile_id,display_name,slug,kind")
      .in("profile_id", profileIds),
  ]);

  if (requestError || profileError) {
    return { data: [], error: "No fue posible completar la información privada de las evaluaciones." };
  }

  const requests = new Map(
    ((requestData ?? []) as unknown as RequestRow[]).map((request) => [request.id, request]),
  );
  const profiles = new Map(
    ((profileData ?? []) as unknown as ProfileRow[]).map((profile) => [profile.profile_id, profile]),
  );

  return {
    data: reviews.map((review) => {
      const request = requests.get(review.contact_request_id);
      const profile = profiles.get(review.professional_profile_id);
      return {
        id: review.id,
        requestId: review.contact_request_id,
        professionalProfileId: review.professional_profile_id,
        professionalName: profile?.display_name ?? "Perfil no disponible",
        professionalSlug: profile?.slug ?? "",
        professionalKind: profile?.kind ?? "technician",
        customerName: request?.requester_name ?? "Cliente no disponible",
        customerEmail: request?.requester_email ?? "Correo no disponible",
        service: request?.requested_service ?? "Servicio no disponible",
        requestStatus: request?.status ?? "unknown",
        emailVerified: Boolean(request?.requester_email_verified_at),
        rating: review.rating,
        comment: review.comment,
        wouldRecommend: review.would_recommend,
        status: review.status,
        moderationReason: review.moderation_reason,
        moderatedAt: review.moderated_at,
        createdAt: review.created_at,
      };
    }),
    error: null,
  };
}
